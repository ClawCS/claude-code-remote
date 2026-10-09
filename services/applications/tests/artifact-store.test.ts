import { testAdmission, testReadiness } from "./fixtures/admission";
import { expect, it, vi } from "vitest";
import { createHash, generateKeyPairSync, randomUUID } from "node:crypto";
import { applicationId, utcInstant } from "../src/types";
import { openArtifactEnvelope, sealArtifactEnvelope } from "../src/artifact-crypto";
import { createArtifactStore } from "../src/artifact-store";
import { makeArtifactHarness, claimArtifactPreparation } from "./fixtures/artifacts";
import { takePrivateSnapshot, withPrivateFiles } from "../src/custody";
import { withReconstructedDocuments, assertReconstructedBundle, type ReconstructionDependencies, type ReconstructedBundle } from "../src/reconstruction";
import { readdir, readFile, rm } from "node:fs/promises";
import { encodePayload, payloadDigest, sealIncoming } from "../src/crypto";
import * as fs from "node:fs/promises";
import sharp from "sharp";
import { createCustodyLedger } from "../src/custody";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { openRepository } from "../src/repository";
import { testIngressAuthority } from "./fixtures/ingress-authority";
import type { Acceptance } from "../src/types";

vi.mock("node:fs/promises",async importOriginal=>({...await importOriginal<typeof import("node:fs/promises")>()}));

async function withEmptyBundle<T>(h:Awaited<ReturnType<typeof makeArtifactHarness>>, action:(bundle:ReconstructedBundle)=>Promise<T>,pixel=9) {
  const snapshot=await takePrivateSnapshot(h.repo.getCommittedIntake(h.accepted.id)!,h.keys);
  const deps:ReconstructionDependencies={scope:h.keys.custody,monotonicNow:()=>0,scanner:{assurance:"qualified-local-engine",scan:async file=>({kind:"clean",complete:true,digest:file.digest,bytes:file.bytes,signatureTime:utcInstant(new Date().toISOString()),engineIdentity:"typed-fixture-not-clamav"})},inspector:{assurance:"local-test",inspect:async()=>({kind:"inspected",inspection:{format:"png",pageCount:1}})},raster:{render:async(_file,emit)=>{await emit({index:0,width:1,height:1,channels:3,pixels:new Uint8Array([pixel,8,7])});return{format:"png",pageCount:1};}},output:{verify:async file=>{await sharp(await readFile(file.path)).raw().toBuffer();}}};
  return withPrivateFiles(snapshot,h.keys,processing=>withReconstructedDocuments(processing,deps,action));
}

it("finishes reconciliation while an artifact reader holds the case lock and waits for custody", async () => {
  const h = await makeArtifactHarness();
  const custody = h.keys.custody, store = createArtifactStore(h.repo, h.keys, custody);
  const event = () => { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; };
  const fsPaused = event(), resumeFs = event(), caseHeld = event(), scopeQueued = event(), inverseLock = event();
  let rejectBlockedWait!: (error: Error) => void;
  const cancelBlockedWait = new Promise<never>((_, reject) => { rejectBlockedWait = reject; });
  void cancelBlockedWait.catch(() => {});
  let reconciliation: Promise<unknown> | undefined, reader: Promise<unknown> | undefined, blockedCaseWait: Promise<unknown> | undefined;
  const withCaseLock = h.repo.withCaseLock, withScope = custody.withScope;
  let pause: ReturnType<typeof vi.spyOn> | undefined;
  try {
    await withEmptyBundle(h, bundle => store.adoptBundle(bundle, 1));
    const readdir = fs.readdir;
    pause = vi.spyOn(fs, "readdir").mockImplementationOnce(async (...args) => {
      fsPaused.resolve(); await resumeFs.promise; return readdir(...args);
    });
    reconciliation = custody.reconcile();
    await fsPaused.promise;
    expect(custody.getIntakeReadiness()).toEqual({ ready: false });
    let readerHasCase = false;
    h.repo.withCaseLock = (id, action) => {
      const alreadyHeld = readerHasCase;
      const acquired = withCaseLock(id, async row => { readerHasCase = true; caseHeld.resolve(); return action(row); });
      if (alreadyHeld) {
        // The reader already owns this lock. Reconciliation must not wait on it
        // while retaining the queue the reader needs. Cancellation is cleanup
        // only: the real lock acquisition is still exercised and awaited.
        blockedCaseWait = acquired; inverseLock.resolve();
        return Promise.race([acquired, cancelBlockedWait]);
      }
      return acquired;
    };
    custody.withScope = (id, action) => { const pending = withScope(id, action); scopeQueued.resolve(); return pending; };
    reader = store.withBundle(h.accepted.id, async bundle => { expect(bundle.requestDigest).toBe(payloadDigest(h.payload)); });
    await caseHeld.promise; await scopeQueued.promise;
    resumeFs.resolve();
    const result = await Promise.race([reconciliation.then(() => "completed"), inverseLock.promise.then(() => "inverse-lock-order")]);
    expect(result).toBe("completed");
    // Remove instrumentation before the reader's legitimate nested case lock.
    h.repo.withCaseLock = withCaseLock;
    await reader;
    expect(custody.getIntakeReadiness()).toEqual({ ready: true });
    expect(await readdir(h.keys.runtimeRoot)).toEqual([]);
  } finally {
    h.repo.withCaseLock = withCaseLock; custody.withScope = withScope;
    resumeFs.resolve(); rejectBlockedWait(new Error("TEST_CANCEL_BLOCKED_RECONCILIATION"));
    await Promise.allSettled([reconciliation, reader, blockedCaseWait].filter((pending): pending is Promise<unknown> => !!pending));
    pause?.mockRestore();
    await h.close();
  }
});

// Catches retaining the maximum claim after durable adoption, for each domain.
it.each(["bundle", "mime"] as const)("replaces the pending %s allowance with registered physical bytes", async kind => {
  const h=await makeArtifactHarness();
  try {
    const store=createArtifactStore(h.repo,h.keys,h.keys.custody);
    const before=await h.keys.custody.cleanupOrphans();
    const original=h.repo.getCommittedIntake(h.accepted.id)!;
    expect(before.physicalBytes+before.reservedHeadroom).toBe(134217728+8192+8192+original.actualBytes+10553344+16779264+16384);
    const record=kind==="bundle"?await withEmptyBundle(h,bundle=>store.adoptBundle(bundle,1)):await store.adoptMime(h.accepted.id,(async function*(){yield Buffer.from("small MIME");})(),(await claimArtifactPreparation(h,true)).version);
    const after=await h.keys.custody.cleanupOrphans();
    expect((await fs.stat(record.path)).size).toBe(record.bytes);
    const maximum=kind==="bundle"?10553344:16779264;
    expect(after.physicalBytes+after.reservedHeadroom).toBe(before.physicalBytes+before.reservedHeadroom-maximum+record.bytes);
    const recovered=createCustodyLedger(h.repo,h.config),restarted=await recovered.reconcile();
    expect(restarted.physicalBytes+restarted.reservedHeadroom).toBe(after.physicalBytes+after.reservedHeadroom);
  } finally { await h.close(); }
});

it("admits another small case using capacity released by adopted bundle and MIME bytes", async()=>{
  const h=await makeArtifactHarness();
  try {
    const store=createArtifactStore(h.repo,h.keys,h.keys.custody);
    await withEmptyBundle(h,bundle=>store.adoptBundle(bundle,1));
    await store.adoptMime(h.accepted.id,(async function*(){yield Buffer.from("small MIME");})(),(await claimArtifactPreparation(h,true)).version);
    for(let index=0;index<4;index++){
      const reservation=await h.keys.custody.reserve({ ...testAdmission(), ...h.reservation,idempotencyKey:`after-artifacts-${index}`,now:utcInstant("2026-10-09T10:00:00.000Z")}, testReadiness);
      const sealed=await sealIncoming((async function*(){yield encodePayload(h.payload);})(),{root:h.keys.intakeRoot,maxBytes:10000,reservationId:reservation.id},h.keys.publicKey);
      await h.keys.custody.commitIntake({reservationId:reservation.id,digest:payloadDigest(h.payload),encryptedPayloadPath:sealed.path,actualBytes:sealed.bytes,encryptedName:"ciphertext",job:"sales-fulltime",now:utcInstant("2026-10-09T10:00:00.000Z")});
    }
    expect(h.repo.listRetainedIntakes()).toHaveLength(5);
    const inventory=await h.keys.custody.cleanupOrphans();
    expect(inventory.physicalBytes+inventory.reservedHeadroom).toBeLessThan(262144000);
  }finally{await h.close();}
});

// Fault injection is limited to the filesystem acquisition boundary; durable
// journals, admission, ownership recovery and later bundle access remain real.
it.each([false,true])("closes admission and releases ownership after scope mkdir fails (created=%s)",async created=>{
  const h=await makeArtifactHarness();
  try{
    const store=createArtifactStore(h.repo,h.keys,h.keys.custody);
    await withEmptyBundle(h,bundle=>store.adoptBundle(bundle,1));
    const mkdir=fs.mkdir;
    const fault=vi.spyOn(fs,"mkdir").mockImplementationOnce(async(path,options)=>{
      if(created)await mkdir(path,options);
      throw Object.assign(new Error("ENOSPC"),{code:"ENOSPC"});
    });
    try{await expect(store.withBundle(h.accepted.id,async()=>{})).rejects.toThrow("ENOSPC");}finally{fault.mockRestore();}
    const journals=await Promise.all((await readdir(h.keys.privateRoot)).filter(name=>name.endsWith(".journal")).map(async name=>JSON.parse(await readFile(join(h.keys.privateRoot,name),"utf8"))));
    expect(journals.filter(entry=>entry.kind==="processing")).toHaveLength(1);
    await expect(h.keys.custody.reserve({ ...testAdmission(), ...h.reservation,idempotencyKey:"after-mkdir-failure",now:utcInstant("2026-10-09T10:00:00.000Z")}, testReadiness)).rejects.toThrow("CUSTODY_NOT_READY");
    await expect(store.withBundle(h.accepted.id,async()=>{})).rejects.toThrow("CUSTODY_NOT_READY");
    await h.keys.custody.reconcile();
    expect(await readdir(h.keys.runtimeRoot)).toEqual([]);
    await store.withBundle(h.accepted.id,async bundle=>expect(bundle.requestDigest).toBe(payloadDigest(h.payload)));
  }finally{await h.close();}
});

it("persists an immutable encrypted bundle, preserves request identity, and expires callback authority", async()=>{
  const h=await makeArtifactHarness();
  try {
    const store=createArtifactStore(h.repo,h.keys,h.keys.custody);
    const originalDigest=payloadDigest(h.payload);
    let escaped!:ReconstructedBundle;
    const artifact=await withEmptyBundle(h,async bundle=>{
      escaped=bundle;
      const adopted=await store.adoptBundle(bundle,1);
      expect(await store.adoptBundle(bundle,1)).toEqual(adopted);
      return adopted;
    });
    expect(()=>assertReconstructedBundle(escaped)).toThrow("INVALID_RECONSTRUCTED_BUNDLE");
    expect((await readFile(artifact.path)).includes(Buffer.from(h.payload.input.name))).toBe(false);
    await store.withBundle(h.accepted.id,async replayed=>{
      expect(replayed.requestDigest).toBe(originalDigest);
      expect(replayed.input).toEqual(h.payload.input);
      expect(()=>assertReconstructedBundle(replayed)).not.toThrow();
      escaped=replayed;
    });
    expect(()=>assertReconstructedBundle(escaped)).toThrow("INVALID_RECONSTRUCTED_BUNDLE");
    expect(await readdir(h.keys.runtimeRoot)).toEqual([]);
    expect(h.repo.getRequestIdentity(h.accepted.id).digest).toBe(originalDigest);
    expect(artifact.expiresAt).toBe("2026-10-16T10:00:00.000Z");
  } finally { await h.close(); }
});

it("restores newly encoded bytes with original source mapping in a reused scope and after retirement",async()=>{
  const source=await sharp({create:{width:1,height:1,channels:3,background:{r:200,g:30,b:40}}}).png().toBuffer();
  const h=await makeArtifactHarness([{name:"source.png",mediaType:"image/png",content:source.toString("base64")}]);
  try{
    const store=createArtifactStore(h.repo,h.keys,h.keys.custody);let wanted="";
    await withEmptyBundle(h,async bundle=>{
      expect(bundle.files[0].digest).not.toBe(bundle.files[0].sourceDigest);wanted=bundle.files[0].digest;
      await store.adoptBundle(bundle,1);
      await store.withBundle(bundle.id,async restored=>expect(restored.files[0].digest).toBe(wanted));
    });
    await expect(withEmptyBundle(h,bundle=>store.adoptBundle(bundle,1),100)).rejects.toThrow("ARTIFACT_CONFLICT");
    await h.repo.retireOriginal(h.accepted.id,(await claimArtifactPreparation(h)).version);
    await h.keys.custody.reconcile();
    await store.withBundle(h.accepted.id,async restored=>{
      expect(restored.requestDigest).toBe(payloadDigest(h.payload));
      expect(restored.files[0].digest).toBe(wanted);
      expect(restored.files[0].sourceIndex).toBe(0);
      expect((await readFile(restored.files[0].path)).equals(source)).toBe(false);
    });
    await expect(store.withBundle(h.accepted.id,async()=>{throw new Error("CALLBACK_FAILED");})).rejects.toThrow("CALLBACK_FAILED");
    expect(await readdir(h.keys.runtimeRoot)).toEqual([]);
  }finally{await h.close();}
});

it("fails startup readiness for same-size tampering of a registered artifact",async()=>{
  const h=await makeArtifactHarness();
  try{
    const record=await createArtifactStore(h.repo,h.keys,h.keys.custody).adoptMime(h.accepted.id,(async function*(){yield Buffer.from("raw message");})(),(await claimArtifactPreparation(h,true)).version);
    const fs=await import("node:fs/promises"), fd=await fs.open(record.path,"r+");try{await fd.write(Buffer.from([0]),0,1,0);}finally{await fd.close();}
    const recovered=createCustodyLedger(h.repo,h.config);
    await expect(recovered.reconcile()).rejects.toThrow("DIGEST_MISMATCH");
  }finally{await h.close();}
});

it("cleans a failed 16 MiB MIME adoption without widening the intake file policy",async()=>{
  const h=await makeArtifactHarness();
  try{
    const before=await h.keys.custody.cleanupOrphans();
    const original=h.repo.adoptArtifact;
    h.repo.adoptArtifact=async()=>{throw new Error("CAS_BOUNDARY_FAILURE");};
    await expect(createArtifactStore(h.repo,h.keys,h.keys.custody).adoptMime(h.accepted.id,(async function*(){yield Buffer.alloc(16*1024*1024,77);})(),1)).rejects.toThrow("CAS_BOUNDARY_FAILURE");
    h.repo.adoptArtifact=original;
    const recovered=createCustodyLedger(h.repo,h.config),inventory=await recovered.reconcile();expect(inventory.orphans).toHaveLength(1);
    const artifactName=(await readdir(h.keys.privateRoot)).find(name=>name.endsWith(".mime.enc"))!;
    const orphanBytes=(await fs.stat(join(h.keys.privateRoot,artifactName))).size+(await fs.stat(join(h.keys.privateRoot,artifactName.replace(".mime.enc",".journal")))).size;
    // Failed publication keeps the future MIME maximum AND charges real residue.
    expect(inventory.physicalBytes+inventory.reservedHeadroom).toBe(before.physicalBytes+before.reservedHeadroom+orphanBytes);
    h.config.clock.now=()=>new Date("2026-10-10T10:00:00.000Z");
    expect((await recovered.cleanupOrphans()).orphans).toEqual([]);
    expect(h.repo.getCommittedIntake(h.accepted.id)).not.toBeNull();
    expect((await readdir(h.keys.privateRoot)).filter(name=>name.endsWith(".mime.enc"))).toEqual([]);
  }finally{await h.close();}
});

it("does not reserve a second output set for replay after original and intake-journal deletion",async()=>{
  const h=await makeArtifactHarness();
  try{
    const store=createArtifactStore(h.repo,h.keys,h.keys.custody);
    const originalPath=h.repo.getCommittedIntake(h.accepted.id)!.encryptedPayloadPath;
    const originalBytes=await readFile(originalPath),journalPath=join(h.keys.privateRoot,`${h.reservation.id}.journal`);
    const artifact=await withEmptyBundle(h,bundle=>store.adoptBundle(bundle,1));
    await h.repo.retireOriginal(h.accepted.id,(await claimArtifactPreparation(h)).version);
    h.config.clock.now=()=>new Date("2026-10-10T10:00:00.000Z");
    await h.keys.custody.reconcile();await h.keys.custody.cleanupOrphans();
    expect(await readFile(originalPath)).toEqual(originalBytes);
    expect((await readdir(h.keys.privateRoot)).includes(`${h.reservation.id}.journal`)).toBe(true);
    // Synthetic later Task11 erasure of these fixture-owned paths, not retention qualification.
    await fs.unlink(originalPath);await fs.unlink(journalPath);
    await h.keys.custody.reconcile();const before=await h.keys.custody.cleanupOrphans();
    expect((await readdir(h.keys.privateRoot)).includes(`${h.reservation.id}.journal`)).toBe(false);
    const retry=await h.keys.custody.reserve({ ...testAdmission(), ...h.reservation,now:utcInstant("2026-10-10T10:00:00.000Z")}, testReadiness);
    const during=await h.keys.custody.cleanupOrphans();
    expect(during.physicalBytes+during.reservedHeadroom-before.physicalBytes-before.reservedHeadroom).toBe(28192);
    expect(h.repo.getRequestIdentity(h.accepted.id).digest).toBe(payloadDigest(h.payload));
    expect(h.repo.getArtifact(h.accepted.id,"bundle")!.expiresAt).toBe(artifact.expiresAt);
    await h.keys.custody.abortIntake(retry.id,h.reservation.sessionHash);
  }finally{await h.close();}
});

it("stores 16 MiB MIME once, rejects changed retries, and authenticates before yielding any bytes",async()=>{
  const h=await makeArtifactHarness();
  try {
    const store=createArtifactStore(h.repo,h.keys,h.keys.custody), bytes=Buffer.alloc(16*1024*1024,77);
    const raw=async function*(){yield bytes;};
    const version=(await claimArtifactPreparation(h,true)).version;
    const record=await store.adoptMime(h.accepted.id,raw(),version);
    expect(await store.adoptMime(h.accepted.id,raw(),version)).toEqual(record);
    const current=await h.repo.withCaseLock(h.accepted.id,async row=>row.version);
    await expect(store.adoptMime(h.accepted.id,(async function*(){yield Buffer.from("different");})(),current)).rejects.toThrow("ARTIFACT_CONFLICT");
    await expect(store.adoptMime(h.accepted.id,(async function*(){yield Buffer.alloc(16*1024*1024+1);})(),current)).rejects.toThrow("ARTIFACT_TOO_LARGE");
    await store.withMime(h.accepted.id,async raw=>{let count=0;for await(const chunk of raw)count+=chunk.length;expect(count).toBe(16777216);});
    const fs=await import("node:fs/promises"), fd=await fs.open(record.path,"r+");
    try {await fd.write(Buffer.from([0]),0,1,0);}finally{await fd.close();}
    let yielded=false;
    await expect(store.withMime(h.accepted.id,async raw=>{for await(const chunk of raw){yielded=!!chunk;}})).rejects.toThrow("DIGEST_MISMATCH");
    expect(yielded).toBe(false);
  }finally{await h.close();}
});

it("authenticates all MIME bytes at the independent 16 MiB boundary and binds case and kind", () => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const id = applicationId(randomUUID()), source = Buffer.alloc(16 * 1024 * 1024, 97);
  const ciphertext = sealArtifactEnvelope(source, id, "mime", pair.publicKey);
  expect(openArtifactEnvelope(ciphertext, id, "mime", pair.privateKey).equals(source)).toBe(true);
  expect(ciphertext.length).toBeLessThanOrEqual(source.length + 2048);
  expect(() => sealArtifactEnvelope(Buffer.alloc(source.length + 1), id, "mime", pair.publicKey)).toThrow("ARTIFACT_TOO_LARGE");
  expect(() => openArtifactEnvelope(ciphertext, applicationId(randomUUID()), "mime", pair.privateKey)).toThrow("AUTHENTICATION_FAILED");
  expect(() => openArtifactEnvelope(ciphertext, id, "bundle", pair.privateKey)).toThrow("AUTHENTICATION_FAILED");
  ciphertext[ciphertext.length - 1] ^= 1;
  expect(() => openArtifactEnvelope(ciphertext, id, "mime", pair.privateKey)).toThrow("AUTHENTICATION_FAILED");
});

it.each(["before-fsync","after-fsync","before-rename","after-rename","before-db","after-db","after-retire","enospc"])("preserves durable authority across an actual worker crash at %s",async stage=>{
  const child=spawn(process.execPath,["--import","tsx",join(process.cwd(),"services/applications/tests/fixtures/artifact-crash-child.ts"),stage],{stdio:["ignore","ignore","pipe","ipc"]});
  let root:string|undefined;let repo:ReturnType<typeof openRepository>|undefined;
  try{
    const [message]=await Promise.race([once(child,"message"),once(child,"exit").then(()=>{throw new Error("CRASH_FIXTURE_EXITED_EARLY");})]);
    const result=message as {root:string;stage:string;accepted:Acceptance;error?:string};root=result.root;
    expect(result.stage).toBe(stage==="enospc"?"failure":"boundary");
    if(stage==="enospc")expect(result.error).toBe("ENOSPC");
    const exited=once(child,"exit");child.kill("SIGKILL");await exited;
    const intakeRoot=join(root,"intake"),custodyRoot=join(root,"custody"),runtimeRoot=join(root,"runtime"),authority=testIngressAuthority(intakeRoot);
    await authority.recoverExitedHarness(child,custodyRoot);
    repo=openRepository(join(root,"registry.sqlite"));
    const ledger=createCustodyLedger(repo,{intakeRoot,custodyRoot,runtimeRoot,intakeUid:process.getuid!(),sharedGid:process.getgid!(),clock:{now:()=>new Date("2026-10-09T10:00:00.000Z")},ingressAuthority:authority});
    const inventory=await ledger.reconcile();
    const artifact=repo.getArtifact(result.accepted.id,"bundle");
    if(["after-db","after-retire"].includes(stage)){
      expect(artifact).not.toBeNull();
      expect(createHash("sha256").update(await readFile(artifact!.path)).digest("hex")).toBe(artifact!.ciphertextDigest);
      expect(artifact!.expiresAt).toBe("2026-10-16T10:00:00.000Z");
    }else{expect(artifact).toBeNull();expect(inventory.orphans).toHaveLength(1);}
    expect(repo.getCommittedIntake(result.accepted.id)===null).toBe(stage==="after-retire");
    expect(repo.getRequestIdentity(result.accepted.id).acceptedAt).toBe("2026-10-09T10:00:00.000Z");
    expect(await readdir(runtimeRoot)).toEqual([]);
  }finally{child.kill("SIGKILL");repo?.close();if(root)await rm(root,{recursive:true,force:true});}
},15000);
