import { afterEach, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { rm, rename, mkdir } from "node:fs/promises";
import { maintenanceFixture, deferred } from "./fixtures/maintenance";
import { beginMaintenance, bindMaintenance, settleMaintenance } from "../src/worker-maintenance";
import { erasureOwner } from "../src/erasure-repository";
import { maintenanceJournal } from "../src/ledger";
import { runRetentionOnce } from "../src/retention";
import { applicationId, digest, utcInstant } from "../src/types";
import { testAdmission, testReadiness } from "./fixtures/admission";

const connections=vi.hoisted(()=>[] as Database.Database[]);
vi.mock("better-sqlite3",async original=>{
  const actual=await original<{default:typeof Database}>();
  return {default:class extends actual.default {
    constructor(...args:ConstructorParameters<typeof actual.default>){super(...args);connections.push(this);}
  }};
});
const fixtures:Awaited<ReturnType<typeof maintenanceFixture>>[]=[];
afterEach(async()=>{
  vi.useRealTimers();
  for(const f of fixtures)await settleMaintenance(f.owner).catch(()=>{});
  for(const db of connections.splice(0))if(db.open)db.close();
  for(const f of fixtures.splice(0))await rm(f.root,{recursive:true,force:true});
});
async function fixture(){const f=await maintenanceFixture("ordinary",true);fixtures.push(f);return f;}

it("rejects invalid-clock reporting without an unhandled cleanup rejection",async()=>{
  const f=await fixture();bindMaintenance(f.owner,f.services,f.monotonicNow);
  const now=f.owner.clock.now,unhandled:unknown[]=[];
  const capture=(error:unknown)=>{unhandled.push(error);};process.on("unhandledRejection",capture);
  try{
    f.owner.clock.now=()=>new Date(NaN);
    await expect(runRetentionOnce(f.owner)).rejects.toThrow("Invalid time value");
    await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
    expect(unhandled).toEqual([]);
    expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
  }finally{f.owner.clock.now=now;process.off("unhandledRejection",capture);}
});

it("rejects invalid-clock deadline reporting while retaining the actual late hold",async()=>{
  const f=await fixture(),held=deferred(),original=f.services.holdMaintenance!,now=f.owner.clock.now;
  f.services.holdMaintenance=async function(owner){await held.promise;return original.call(this,owner);};
  bindMaintenance(f.owner,f.services,f.monotonicNow);vi.useFakeTimers({toFake:["setTimeout","clearTimeout"]});
  const result=runRetentionOnce(f.owner),caught=result.then(()=>null,error=>error);
  try{
    f.owner.clock.now=()=>new Date(NaN);
    await vi.advanceTimersByTimeAsync(120000);
    expect(await caught).toBeInstanceOf(RangeError);
    expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
    expect(()=>f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
  }finally{f.owner.clock.now=now;held.resolve();await settleMaintenance(f.owner).catch(()=>{});await result.catch(()=>{});}
});

it("enters actual held maintenance synchronously and reports only bounded nonidentifying progress",async()=>{
  const f=await fixture(); bindMaintenance(f.owner,f.services,f.monotonicNow);
  const result=runRetentionOnce(f.owner);
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
  expect(()=>f.owner.repository.listWorkerSchedule(f.owner.clock.now().toISOString() as never)).toThrow("MAINTENANCE_INHIBITED");
  const report=await result;
  expect(report.status).toBe("progress");
  expect(report.consumedItems).toBeGreaterThan(0);
  expect(report.consumedItems).toBeLessThanOrEqual(1000);
  expect(report.selectedCount).toBeLessThanOrEqual(20);
  expect(Object.isFrozen(report)).toBe(true);
  expect(Object.keys(report).sort()).toEqual(["blocker","consumedItems","hasMore","nextWakeAt","selectedCount","status"]);
});

it("reports a timed-out actual hold as settling without admitting a successor or losing ownership",async()=>{
  const f=await fixture(), held=deferred();
  const original=f.services.holdMaintenance!;
  f.services.holdMaintenance=async function(owner){await held.promise;return original.call(this,owner);};
  bindMaintenance(f.owner,f.services,f.monotonicNow);
  vi.useFakeTimers();
  const result=runRetentionOnce(f.owner);
  f.advance(120000); await vi.advanceTimersByTimeAsync(120000);
  expect((await result).status).toBe("settling");
  expect((await runRetentionOnce(f.owner)).status).toBe("settling");
  expect(()=>f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
  held.resolve(); await settleMaintenance(f.owner).catch(()=>{});
});

it("drives a genuine due payload through original scan, physical erasure, rows, checkpoint and acknowledged done", async () => {
  const f = await fixture(), accepted = await f.accept(), db = connections.at(-1)!;
  f.advance(7 * 86400000); bindMaintenance(f.owner, f.services, f.monotonicNow);
  let completed = false;
  for (let n = 0; n < 150 && !completed; n++) {
    const report = await runRetentionOnce(f.owner);
    expect(report.consumedItems).toBeLessThanOrEqual(1000);
    expect(report.selectedCount).toBeLessThanOrEqual(20);
    expect(report.status, `invocation ${n}: ${report.blocker}`).not.toBe("blocked");
    completed = report.status === "complete";
  }
  expect(completed).toBe(true);
  expect(db.prepare("SELECT 1 FROM erasure_events WHERE caseId=? AND phase='acknowledged' AND json_extract(event,'$[3]')='erase_done'").get(accepted.accepted.id)).toBeDefined();
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(true);
  expect(db.prepare("SELECT payloadBytes,encryptedPayloadPath FROM cases WHERE id=?").get(accepted.accepted.id)).toEqual({ payloadBytes: 0, encryptedPayloadPath: null });
  expect(db.prepare("SELECT 1 FROM erasure_manifests LIMIT 1").get()).toBeUndefined();
});
it("recovers a lost original append reply using the same stored erasure event",async()=>{
  const f=await fixture(),accepted=await f.accept(),db=connections.at(-1)!;
  f.advance(7*86400000);const append=f.journalFixture.port.append;let lost=false;
  f.journalFixture.port.append=async event=>{const receipt=await append(event);if(!lost&&event[3]==="erase_commit"&&event[4][1]==="processing_payload"){lost=true;throw new Error("synthetic-lost-append-reply");}return receipt;};
  bindMaintenance(f.owner,f.services,f.monotonicNow);let done=false;
  for(let n=0;n<300&&!done;n++){
    const result=await runRetentionOnce(f.owner);expect(result.consumedItems).toBeLessThanOrEqual(1000);
    if(result.status==="blocked")expect(result.blocker).toBe("journal");
    done=!!db.prepare("SELECT 1 FROM erasure_events WHERE caseId=? AND phase='acknowledged' AND json_extract(event,'$[3]')='erase_done'").get(accepted.accepted.id);
  }
  expect(lost).toBe(true);expect(done).toBe(true);
  expect(f.journalFixture.receipts.filter(receipt=>{const event=JSON.parse(receipt.entry)[0][7];return event[3]==="erase_commit"&&event[4][1]==="processing_payload";})).toHaveLength(1);
});

it("reopens an ordinary owner only after confirmed release and fresh original-owner post-release checks", async () => {
  const f = await fixture(); bindMaintenance(f.owner, f.services, f.monotonicNow);
  let report;
  for (let n = 0; n < 150; n++) {
    report = await runRetentionOnce(f.owner);
    if (report.status === "complete") break;
  }
  expect(report?.status).toBe("complete");
  expect(report?.hasMore).toBe(false);
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(true);
  expect(f.owner.repository.listWorkerSchedule(f.owner.clock.now().toISOString() as never)).toEqual([]);
});

it("reconstructs nonempty ordinary custody readiness from a new original owner's current physical pass", async () => {
  const f = await fixture(), accepted = await f.accept(), next = await f.restart("ordinary");
  expect(next.owner.custody.getIntakeReadiness().ready).toBe(false);
  bindMaintenance(next.owner, next.services, f.monotonicNow);
  let result;
  for (let n = 0; n < 200; n++) {
    result = await runRetentionOnce(next.owner);
    expect(result.consumedItems).toBeLessThanOrEqual(1000);
    expect(result.status, `invocation ${n}: ${result.blocker}`).not.toBe("blocked");
    if (result.status === "complete") break;
  }
  expect(result?.status).toBe("complete");
  expect(next.owner.custody.getIntakeReadiness().ready).toBe(true);
  expect(next.owner.repository.getCommittedIntake(accepted.accepted.id)?.encryptedPayloadPath).toBe(accepted.record.encryptedPayloadPath);
});

it("runs real never-accepted cleanup after an ordinary reopen and resumes the same nonempty original owner", async () => {
  const f = await fixture(); await f.accept(); bindMaintenance(f.owner,f.services,f.monotonicNow);
  for (let n=0;n<200;n++) { const result=await runRetentionOnce(f.owner); expect(result.status).not.toBe("blocked"); if(result.status==="complete")break; }
  const sessionHash=digest("c".repeat(64));
  const reservation=await f.owner.custody.reserve({...testAdmission(),sessionHash,idempotencyKey:"abort-resume",reservedBytes:20000,now:utcInstant(f.owner.clock.now().toISOString())},testReadiness);
  await expect(f.owner.custody.abortIntake(reservation.id,sessionHash)).rejects.toThrow("CUSTODY_NOT_READY");
  let result;
  for (let n=0;n<150;n++) { result=await runRetentionOnce(f.owner); expect(result.status,`invocation ${n}: ${result.blocker}`).not.toBe("blocked"); if(result.status==="complete")break; }
  expect(result?.status).toBe("complete");
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(true);
  expect(connections.at(-1)!.prepare("SELECT 1 FROM reservations WHERE id=?").get(reservation.id)).toBeUndefined();
});

it.each(["missing", "mutated", "throws"] as const)("keeps ordinary producers inhibited with a %s original post-release assertion", async defect => {
  const f = await fixture();
  if (defect === "missing") delete f.services.assertOrdinaryReady;
  if (defect === "throws") f.services.assertOrdinaryReady = () => { throw new Error("SYNTHETIC_UNSETTLED_QUOTA"); };
  bindMaintenance(f.owner, f.services, f.monotonicNow);
  if (defect === "mutated") f.services.assertOrdinaryReady = () => {};
  let result;
  for (let n = 0; n < 100; n++) { result = await runRetentionOnce(f.owner); if (result.status === "blocked") break; }
  expect(result?.status).toBe("blocked");
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
  expect(() => f.owner.repository.listWorkerSchedule(f.owner.clock.now().toISOString() as never)).toThrow("MAINTENANCE_INHIBITED");
});

it("never retries an uncertain release or reopens after its original hold was physically released", async () => {
  const f = await fixture(), original = f.services.releaseMaintenance!;
  let releases = 0;
  f.services.releaseMaintenance = async function(owner, hold) { releases++; await original.call(this, owner, hold); throw new Error("lost-release-reply"); };
  bindMaintenance(f.owner, f.services, f.monotonicNow);
  let result;
  for (let n = 0; n < 100; n++) { result = await runRetentionOnce(f.owner); if (result.status === "blocked") break; }
  expect(releases).toBe(1); expect(result?.status).toBe("blocked");
  expect((await runRetentionOnce(f.owner)).status).toBe("blocked");
  expect(releases).toBe(1); expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
  expect(() => f.owner.repository.close()).toThrow("MAINTENANCE_WORK_ACTIVE");
});

it("takes a new actual hold and fresh pass when post-release replay discovers a new committed obligation", async () => {
  const f = await fixture(), hold = f.services.holdMaintenance!, release = f.services.releaseMaintenance!;
  let holds = 0;
  f.services.holdMaintenance = function(owner) { holds++; return hold.call(this, owner); };
  f.services.releaseMaintenance = async function(owner, token) {
    await release.call(this, owner, token);
    f.journalFixture.commit(["tj-journal-event-v1", "e".repeat(32), owner.clock.now().toISOString(), "erase_commit", [applicationId("22222222-2222-4222-8222-222222222222"), "processing_contact", "fixture-erasure", "a".repeat(64)]]);
  };
  bindMaintenance(f.owner, f.services, f.monotonicNow);
  for (let n = 0; n < 120 && holds < 2; n++) {
    const report = await runRetentionOnce(f.owner);
    expect(report.status).not.toBe("complete");
    expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
  }
  expect(holds).toBe(2);
});

it.each([false, true])("retains long final traversal only for verified barrier-only writes (ordinary mutation=%s)", async mutation => {
  const f = await fixture(), db = connections.at(-1)!;
  bindMaintenance(f.owner, f.services, f.monotonicNow);
  const erasure = erasureOwner(f.owner.repository);
  // Exhaust the nine fixed due streams; seven unchanged final-work phases remain.
  for (let n = 0; n < 9; n++) {
    const run = await beginMaintenance(f.owner);
    expect((await erasure.finalWorkBatch(run)).complete).toBe(false);
    await settleMaintenance(f.owner);
  }
  f.advance(61000);
  let run = await beginMaintenance(f.owner);
  await maintenanceJournal(run, f.owner.repository, { kind: "refresh", purpose: "refresh" });
  await settleMaintenance(f.owner);
  if (mutation) db.prepare("UPDATE erasure_maintenance SET authLocked=authLocked WHERE singleton=1").run();
  let complete = false;
  for (let n = 0; n < 7; n++) {
    run = await beginMaintenance(f.owner);
    complete = (await erasure.finalWorkBatch(run)).complete;
    await settleMaintenance(f.owner);
  }
  expect(complete).toBe(!mutation);
});

it.each(["side-effect","partial","malformed"] as const)("does not accept final-read continuity after a %s barrier",async defect=>{
  const f=await fixture(),db=connections.at(-1)!;bindMaintenance(f.owner,f.services,f.monotonicNow);
  const erasure=erasureOwner(f.owner.repository);
  for(let n=0;n<8;n++){const run=await beginMaintenance(f.owner);await erasure.finalWorkBatch(run);await settleMaintenance(f.owner);}
  if(defect==="side-effect")db.exec("CREATE TRIGGER foreign_barrier_write AFTER INSERT ON journal_facts WHEN NEW.kind='barrier' BEGIN UPDATE erasure_maintenance SET authLocked=authLocked WHERE singleton=1; END");
  else if(defect==="partial")db.exec("CREATE TRIGGER partial_barrier BEFORE UPDATE ON journal_projection BEGIN SELECT RAISE(ABORT,'synthetic partial barrier'); END");
  else {
    const receipt=f.journalFixture.commit(["tj-journal-event-v1","e".repeat(32),f.owner.clock.now().toISOString(),"barrier",["a".repeat(64),"0".repeat(64),"refresh"]]);
    f.journalFixture.receipts[f.journalFixture.receipts.length-1]={...receipt,entry:JSON.stringify([JSON.parse(receipt.entry)[0],"x".repeat(86)]) as typeof receipt.entry};
  }
  f.advance(61000);let run=await beginMaintenance(f.owner);
  await expect(maintenanceJournal(run,f.owner.repository,{kind:"refresh",purpose:"refresh"})).rejects.toThrow();await settleMaintenance(f.owner);
  run=await beginMaintenance(f.owner);
  await expect(erasure.finalWorkBatch(run)).rejects.toThrow();
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
});

it.each(["replacement","service-change"] as const)("denies a new pass after original %s despite a prior ordinary completion",async defect=>{
  const f=await fixture();bindMaintenance(f.owner,f.services,f.monotonicNow);
  for(let n=0;n<150;n++){const result=await runRetentionOnce(f.owner);expect(result.status).not.toBe("blocked");if(result.status==="complete")break;}
  if(defect==="replacement"){await rename(f.config.runtimeRoot,`${f.config.runtimeRoot}.old`);await mkdir(f.config.runtimeRoot,{mode:0o700});}
  else f.services.holdMaintenance=async()=>Object.freeze({});
  expect((await runRetentionOnce(f.owner)).status).toBe("blocked");
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
});
