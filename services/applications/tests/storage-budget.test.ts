import { afterEach, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, stat, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCustodyLedger } from "../src/custody";
import { encodePayload, payloadDigest, sealIncoming } from "../src/crypto";
import { openRepository } from "../src/repository";
import { digest, utcInstant, type ApplicationRepository } from "../src/types";
import { testIngressAuthority, TestIngressAuthority } from "./fixtures/ingress-authority";
import { makeArtifactHarness } from "./fixtures/artifacts";
import { takePrivateSnapshot, withPrivateFiles } from "../src/custody";

let root: string | undefined;
let repository: ApplicationRepository | undefined;
afterEach(async () => { repository?.close(); if (root) await rm(root, { recursive: true, force: true }); });

it("reserves future output and scratch capacity before accepting another case", async () => {
  root = await mkdtemp(join(await realpath(tmpdir()), "applications-budget-"));
  repository = openRepository(join(root, "registry.sqlite"));
  const now = utcInstant("2026-10-09T10:00:00.000Z"), sessionHash = digest("a".repeat(64));
  for (let index = 0; index < 4; index++) {
    const reservation = repository.reserve({ sessionHash, idempotencyKey: String(index), reservedBytes: 2, now });
    repository.commitIntake({ reservationId: reservation.id, digest: sessionHash, encryptedPayloadPath: join(root, `${index}.enc`), actualBytes: 1, encryptedName: "ciphertext", job: "sales-fulltime", now });
  }
  expect(() => repository!.reserve({ sessionHash, idempotencyKey: "fifth", reservedBytes: 2, now })).toThrow("CAPACITY_EXCEEDED");
  // A retry needs transient intake space, not another permanent output set.
  expect(repository.reserve({ sessionHash, idempotencyKey: "0", reservedBytes: 2, now }).id).toBeTruthy();
});

// Catches releasing physical capacity while a foreign, unlinked ingress inode
// still consumes storage. No mocked byte totals or filesystem operations.
it("accounts for an ingress inode until its retained descriptor is closed", async () => {
  root = await mkdtemp(join(await realpath(tmpdir()), "applications-budget-"));
  const intakeRoot = join(root, "intake"), custodyRoot = join(root, "custody"), runtimeRoot = join(root, "runtime");
  await Promise.all([intakeRoot, custodyRoot, runtimeRoot].map(path => mkdir(path, { mode: 0o700 })));
  repository = openRepository(join(root, "registry.sqlite"));
  const now = utcInstant("2026-10-09T10:00:00.000Z");
  const authority = testIngressAuthority(intakeRoot);
  const custody = createCustodyLedger(repository, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock: { now: () => new Date(now) }, ingressAuthority: authority });
  await custody.reconcile();
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const payload = { version: 1 as const, input: { name: "Synthetic", email: "synthetic@example.invalid", job: "sales-fulltime" as const }, files: [] };
  const reservation = await custody.reserve({ sessionHash: digest("a".repeat(64)), idempotencyKey: "open-inode", reservedBytes: 20000, now });
  const sealed = await sealIncoming((async function* () { yield encodePayload(payload); })(), { root: intakeRoot, maxBytes: 10000, reservationId: reservation.id }, pair.publicKey);
  const retained = await authority.retain(reservation.id);
  const child = await authority.holdInChild(reservation.id);
  try {
    await custody.commitIntake({ reservationId: reservation.id, digest: payloadDigest(payload), encryptedPayloadPath: sealed.path, actualBytes: sealed.bytes, encryptedName: "ciphertext", job: "sales-fulltime", now });
    const inventory = await custody.cleanupOrphans();
    let visibleBytes = 0;
    for (const directory of [intakeRoot, custodyRoot, runtimeRoot]) for (const name of await readdir(directory)) visibleBytes += (await stat(join(directory, name))).size;
    const retainedInode = await retained.stat();
    const unlinkedBytes = retainedInode.nlink === 0 ? retainedInode.size : 0;
    expect(inventory.physicalBytes).toBeGreaterThanOrEqual(visibleBytes + unlinkedBytes);
    const before = inventory.physicalBytes + inventory.reservedHeadroom;
    await child.grow(9000);
    const grown = await custody.cleanupOrphans();
    expect((await retained.stat()).size).toBe(9000);
    expect(grown.physicalBytes).toBeGreaterThan(inventory.physicalBytes);
    expect(grown.physicalBytes + grown.reservedHeadroom).toBe(before);
    // The trusted authority must still charge an inode if its name disappears.
    await unlink(sealed.path);
    await child.grow(9500);
    expect((await retained.stat()).nlink).toBe(0);
    const hidden=await custody.cleanupOrphans();
    expect(hidden.physicalBytes).toBeGreaterThanOrEqual((await retained.stat()).size+sealed.bytes);
    expect(hidden.physicalBytes+hidden.reservedHeadroom).toBe(before);
    await expect(child.grow(10001)).rejects.toThrow("FIXTURE_QUOTA_EXCEEDED");
  } finally { await retained.close(); await child.close(); }
  await custody.reconcile();
  expect(await readdir(intakeRoot)).toEqual([]);
});

it("blocks admission before writes when no lifetime/quota authority is available",async()=>{
  const h=await makeArtifactHarness();
  try{
    const unavailable=createCustodyLedger(h.repo,{...h.config,ingressAuthority:undefined});
    await expect(unavailable.reconcile()).rejects.toThrow("INGRESS_AUTHORITY_UNAVAILABLE");
    await expect(unavailable.reserve({sessionHash:digest("c".repeat(64)),idempotencyKey:"forbidden",reservedBytes:20000,now:utcInstant("2026-10-09T10:00:00.000Z")})).rejects.toThrow("CUSTODY_NOT_READY");
    expect(await readdir(h.keys.intakeRoot)).toEqual([]);
  }finally{await h.close();}
});

it("migrates legacy journals only with the authority's exact recovered domain mapping",async()=>{
  const h=await makeArtifactHarness();
  try{
    const name=(await readdir(h.keys.privateRoot)).find(name=>name.endsWith(".journal"))!,path=join(h.keys.privateRoot,name);
    const original=JSON.parse(await readFile(path,"utf8"));const legacy={...original,version:1};delete legacy.lease;delete legacy.release;
    await writeFile(path,JSON.stringify(legacy),{mode:0o600});
    const unknown=createCustodyLedger(h.repo,{...h.config,ingressAuthority:new TestIngressAuthority(h.keys.intakeRoot)});
    await expect(unknown.reconcile()).rejects.toThrow(/INGRESS_AUTHORITY_/);
    expect(h.repo.getCommittedIntake(h.accepted.id)).not.toBeNull();
    const recovered=createCustodyLedger(h.repo,h.config);await recovered.reconcile();
    const migrated=JSON.parse(await readFile(path,"utf8"));
    expect(migrated.version).toBe(2);expect(migrated.lease.generation).toBe(original.lease.generation);
    expect(migrated.cleanupAfter).toBe(original.cleanupAfter);
  }finally{await h.close();}
});

it.each(["stale","unavailable"])("preserves DB acceptance and all transient allowance when release authority is %s",async fault=>{
  const h=await makeArtifactHarness();
  try{
    const now=utcInstant("2026-10-09T10:00:00.000Z"),sessionHash=digest("c".repeat(64));
    const reservation=await h.keys.custody.reserve({sessionHash,idempotencyKey:"release-failure",reservedBytes:20000,now});
    const sealed=await sealIncoming((async function*(){yield encodePayload(h.payload);})(),{root:h.keys.intakeRoot,maxBytes:10000,reservationId:reservation.id},h.keys.publicKey);
    const quiesce=h.authority.quiesce.bind(h.authority);
    h.authority.quiesce=async lease=>{
      if(fault==="unavailable")throw new Error("INGRESS_AUTHORITY_UNAVAILABLE");
      const evidence=await quiesce(lease);return {...evidence,lease:{...evidence.lease,generation:"stale-generation"}};
    };
    await expect(h.keys.custody.commitIntake({reservationId:reservation.id,digest:payloadDigest(h.payload),encryptedPayloadPath:sealed.path,actualBytes:sealed.bytes,encryptedName:"ciphertext",job:"sales-fulltime",now})).rejects.toThrow(/INGRESS_AUTHORITY_/);
    expect(h.repo.listRetainedIntakes()).toHaveLength(2);
    expect((await stat(sealed.path)).size).toBe(sealed.bytes);
    const journal=JSON.parse(await readFile(join(h.keys.privateRoot,`${reservation.id}.journal`),"utf8"));
    expect(journal.budget).toBe(20000);expect(journal.release).toBe("pending");
    await expect(h.keys.custody.reserve({sessionHash,idempotencyKey:"later",reservedBytes:20000,now})).rejects.toThrow("CUSTODY_NOT_READY");
    h.authority.quiesce=quiesce;
    await h.keys.custody.reconcile();
    expect(await readdir(h.keys.intakeRoot)).toEqual([]);
  }finally{await h.close();}
});

it("retains the two producer slots across repository restart while real child holders remain live",async()=>{
  const h=await makeArtifactHarness(),holders:Awaited<ReturnType<TestIngressAuthority["holdInChild"]>>[]=[];
  let reopened:ReturnType<typeof openRepository>|undefined;
  try{
    const now=utcInstant("2026-10-09T10:00:00.000Z");
    for(const idempotencyKey of ["holder-one","holder-two"]){
      const reservation=await h.keys.custody.reserve({sessionHash:digest("c".repeat(64)),idempotencyKey,reservedBytes:20000,now});
      await sealIncoming((async function*(){yield encodePayload(h.payload);})(),{root:h.keys.intakeRoot,maxBytes:10000,reservationId:reservation.id},h.keys.publicKey);
      holders.push(await h.authority.holdInChild(reservation.id));
    }
    h.repo.close();reopened=openRepository(join(h.root,"registry.sqlite"));
    const recovered=createCustodyLedger(reopened,h.config);await recovered.reconcile();
    await expect(recovered.reserve({sessionHash:digest("d".repeat(64)),idempotencyKey:"third-holder",reservedBytes:20000,now})).rejects.toThrow("CAPACITY_EXCEEDED");
    expect(await holders[0].grow(9000)).toBe(9000);
  }finally{for(const holder of holders)await holder.close();reopened?.close();await h.close();}
});

it("admits a maximum decoded intake and a second physical upload without double-counting active scratch",async()=>{
  const content=Buffer.alloc(5*1024*1024,83).toString("base64");
  const h=await makeArtifactHarness([{name:"one.png",mediaType:"image/png",content},{name:"two.png",mediaType:"image/png",content}]);
  try{
    const before=await h.keys.custody.cleanupOrphans();
    const snapshot=await takePrivateSnapshot(h.repo.getCommittedIntake(h.accepted.id)!,h.keys);
    await withPrivateFiles(snapshot,h.keys,async processing=>{
      expect((await stat(processing.files[0].path)).size+(await stat(processing.files[1].path)).size).toBe(10485760);
      const active=await h.keys.custody.cleanupOrphans();
      expect(active.physicalBytes).toBeGreaterThan(before.physicalBytes+10485760);
      expect(active.physicalBytes+active.reservedHeadroom).toBe(before.physicalBytes+before.reservedHeadroom);
    });
    const encoded=encodePayload(h.payload),maxBytes=encoded.length+2048,now=utcInstant("2026-10-09T10:00:00.000Z");
    const second=await h.keys.custody.reserve({sessionHash:digest("c".repeat(64)),idempotencyKey:"second-max",reservedBytes:2*maxBytes,now});
    const file=await sealIncoming((async function*(){yield encoded;})(),{root:h.keys.intakeRoot,maxBytes,reservationId:second.id},h.keys.publicKey);
    expect((await stat(file.path)).size).toBe(file.bytes);
    await h.keys.custody.commitIntake({reservationId:second.id,digest:payloadDigest(h.payload),encryptedPayloadPath:file.path,actualBytes:file.bytes,encryptedName:"ciphertext",job:"sales-fulltime",now});
    const inventory=await h.keys.custody.cleanupOrphans();
    expect(inventory.physicalBytes+inventory.reservedHeadroom).toBeLessThanOrEqual(262144000);
    await expect(h.keys.custody.reserve({sessionHash:digest("d".repeat(64)),idempotencyKey:"third-max",reservedBytes:2*maxBytes,now})).rejects.toThrow("CAPACITY_EXCEEDED");
    const smallPayload={...h.payload,files:[]},small=await h.keys.custody.reserve({sessionHash:digest("e".repeat(64)),idempotencyKey:"small",reservedBytes:20000,now});
    const smallFile=await sealIncoming((async function*(){yield encodePayload(smallPayload);})(),{root:h.keys.intakeRoot,maxBytes:10000,reservationId:small.id},h.keys.publicKey);
    await h.keys.custody.commitIntake({reservationId:small.id,digest:payloadDigest(smallPayload),encryptedPayloadPath:smallFile.path,actualBytes:smallFile.bytes,encryptedName:"ciphertext",job:"sales-fulltime",now});
    const almost=await h.keys.custody.cleanupOrphans();
    const remaining=262144000-almost.physicalBytes-almost.reservedHeadroom-8192;
    const fill=await h.keys.custody.reserve({...h.reservation,reservedBytes:remaining,now});
    try{
      const full=await h.keys.custody.cleanupOrphans();expect(full.physicalBytes+full.reservedHeadroom).toBe(262144000);
      await withPrivateFiles(snapshot,h.keys,async processing=>expect(processing.files).toHaveLength(2));
    }finally{await h.keys.custody.abortIntake(fill.id,h.reservation.sessionHash);}
  }finally{await h.close();}
});
