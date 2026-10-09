import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import type { Stats } from "node:fs";
import { lstat, open, readFile, readdir, type FileHandle } from "node:fs/promises";
import { join } from "node:path";
import { createCustodyLedger as productionCustodyLedger } from "../../src/custody";
export { takePrivateSnapshot, withPrivateFiles } from "../../src/custody";
import type { ApplicationRepository, CustodyConfig } from "../../src/types";
import type { IngressAuthority, IngressEvidence, IngressLease, LegacyIngress } from "../../src/types";
import { testReadiness } from "./admission";

// Explicit controlled-holder fixture, NOT an OS quota/confinement adapter.
// The harness grants access only to its bounded seal helper and registered
// holders. Child growth obeys a hard fixture command bound; R5 must prove an
// actual quota against arbitrary producers, descendants and FD transfers.
const domains = new Map<string, TestIngressAuthority>();
export function testIngressAuthority(domain: string): TestIngressAuthority {
  if (process.env.NODE_ENV !== "test") throw new Error("TEST_ONLY");
  let port = domains.get(domain);
  if (!port) { port = new TestIngressAuthority(domain); domains.set(domain, port); }
  return port;
}
export function createTestCustodyLedger(repo:ApplicationRepository,config:CustodyConfig){
  const ledger = productionCustodyLedger(repo,{...config,ingressAuthority:testIngressAuthority(config.intakeRoot)});
  return { ...ledger, reserve: (input: Parameters<typeof ledger.reserve>[0], readiness = testReadiness) => ledger.reserve(input, readiness) };
}
export const createCustodyLedger=createTestCustodyLedger;
interface Entry { lease: IngressLease; state: IngressEvidence["state"]; holders: Set<FileHandle>; child?: ChildProcess }
export class TestIngressAuthority implements IngressAuthority {
  readonly assurance = "local-test" as const;
  private entries = new Map<string, Entry>();
  available = true;
  constructor(private domain: string) {}
  // Only these tests' explicitly controlled, single-process seal writers use
  // this recovery seam. No descriptor transfers/descendants occur in that
  // fixture; this method is NOT evidence about an arbitrary OS PID/domain.
  async recoverExitedHarness(child:ChildProcess,custodyRoot:string){
    if(child.exitCode===null&&child.signalCode===null)throw new Error("HARNESS_STILL_LIVE");
    for(const name of await readdir(custodyRoot))if(name.endsWith(".journal")){
      const journal=JSON.parse(await readFile(join(custodyRoot,name),"utf8"));
      if(journal.kind!=="intake")continue;
      const lease=journal.lease as IngressLease;
      if(!lease||lease.domain!==this.domain)throw new Error("INGRESS_AUTHORITY_MISMATCH");
      this.entries.set(lease.reservationId,{lease,state:journal.release==="released"?"released":"quiescent",holders:new Set()});
    }
  }
  private entry(lease: IngressLease): Entry {
    if (!this.available) throw new Error("INGRESS_AUTHORITY_UNAVAILABLE");
    const entry = this.entries.get(lease.reservationId);
    if (!entry || JSON.stringify(entry.lease) !== JSON.stringify(lease)) throw new Error("INGRESS_AUTHORITY_MISMATCH");
    return entry;
  }
  async recover(leases: readonly IngressLease[], legacy: readonly LegacyIngress[]) {
    if (!this.available) throw new Error("INGRESS_AUTHORITY_UNAVAILABLE");
    for (const lease of leases) this.entry(lease);
    return legacy.map(item=>{
      const entry=this.entries.get(item.reservationId);
      if(!entry||entry.lease.path!==item.path||entry.lease.allowance!==item.allowance||!["quiescent","released"].includes(entry.state)||entry.child||entry.holders.size)throw new Error("INGRESS_AUTHORITY_MISMATCH");
      return {...entry.lease};
    });
  }
  async prepare(reservationId: string, path: string, allowance: number) {
    if (!this.available || this.entries.has(reservationId)) throw new Error("INGRESS_AUTHORITY_UNAVAILABLE");
    const lease = { reservationId, path, allowance, generation: randomUUID(), domain: this.domain };
    this.entries.set(reservationId, { lease, state: "prepared", holders: new Set() }); return { ...lease };
  }
  async grant(lease: IngressLease) { const entry = this.entry(lease); if (entry.state !== "prepared") throw new Error("INGRESS_AUTHORITY_MISMATCH"); entry.state = "bounded"; return this.observe(lease); }
  async observe(lease: IngressLease): Promise<IngressEvidence> {
    const entry = this.entry(lease);
    let info: Stats | undefined;
    try { info = await lstat(lease.path); } catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
    let chargedBytes = info?.size ?? 0;
    for (const fd of entry.holders) {
      try { const holder = await fd.stat(); if (!info || holder.ino !== info.ino || holder.dev !== info.dev) chargedBytes += holder.size; }
      catch (error) { if (error instanceof Error && "code" in error && error.code === "EBADF") entry.holders.delete(fd); else throw error; }
    }
    if (chargedBytes > lease.allowance) throw new Error("FIXTURE_QUOTA_EXCEEDED");
    return { lease: { ...lease }, state: entry.state, chargedBytes, object: info ? { dev: info.dev, ino: info.ino } : null };
  }
  async quiesce(lease: IngressLease) {
    const entry = this.entry(lease); await this.observe(lease);
    if (entry.child || entry.holders.size) return this.observe(lease);
    if (entry.state !== "released") entry.state = "quiescent";
    return this.observe(lease);
  }
  async released(lease: IngressLease) {
    const entry = this.entry(lease), evidence = await this.observe(lease);
    if (!["quiescent", "released"].includes(entry.state) || evidence.chargedBytes || evidence.object || entry.child || entry.holders.size) throw new Error("INGRESS_RELEASE_UNCONFIRMED");
    entry.state = "released"; return this.observe(lease);
  }
  async retain(reservationId: string): Promise<FileHandle> {
    const entry = this.entries.get(reservationId)!;
    if (entry.state !== "bounded") throw new Error("INGRESS_AUTHORITY_MISMATCH");
    const fd = await open(entry.lease.path, "r+"); entry.holders.add(fd); return fd;
  }
  async holdInChild(reservationId: string) {
    const entry = this.entries.get(reservationId)!;
    const child = spawn(process.execPath, ["--eval", `const fs=require('node:fs'); const fd=fs.openSync(process.argv[1],'r+'); const cap=Number(process.argv[2]); process.send({ready:true}); process.on('message',m=>{ if(m.close){fs.closeSync(fd);process.exit(0);} if(Number.isSafeInteger(m.size)&&m.size<=cap){ const b=Buffer.alloc(m.size,120);fs.writeSync(fd,b,0,b.length,0);fs.fsyncSync(fd);process.send({size:fs.fstatSync(fd).size}); } else process.send({error:'FIXTURE_QUOTA_EXCEEDED'}); }); process.on('disconnect',()=>{fs.closeSync(fd);process.exit(0);});`, entry.lease.path, String(entry.lease.allowance)], { stdio: ["ignore", "ignore", "pipe", "ipc"] });
    entry.child = child; await once(child, "message");
    return {
      grow: async (size: number) => { const response = once(child, "message"); child.send({ size }); const [result] = await response; if (result.error) throw new Error(result.error); return result.size as number; },
      close: async () => { const exited = once(child, "exit"); child.send({ close: true }); await exited; entry.child = undefined; },
    };
  }
}
