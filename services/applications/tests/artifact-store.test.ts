import { expect, it } from "vitest";
import { createHash, generateKeyPairSync, randomUUID } from "node:crypto";
import { applicationId, utcInstant } from "../src/types";
import { openArtifactEnvelope, sealArtifactEnvelope } from "../src/artifact-crypto";
import { createArtifactStore } from "../src/artifact-store";
import { makeArtifactHarness } from "./fixtures/artifacts";
import { takePrivateSnapshot, withPrivateFiles } from "../src/custody";
import { withReconstructedDocuments, assertReconstructedBundle, type ReconstructionDependencies, type ReconstructedBundle } from "../src/reconstruction";
import { readdir, readFile, rm } from "node:fs/promises";
import { payloadDigest } from "../src/crypto";
import sharp from "sharp";
import { createCustodyLedger } from "../src/custody";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { join } from "node:path";
import { openRepository } from "../src/repository";
import { testIngressAuthority } from "./fixtures/ingress-authority";
import type { Acceptance } from "../src/types";

async function withEmptyBundle<T>(h:Awaited<ReturnType<typeof makeArtifactHarness>>, action:(bundle:ReconstructedBundle)=>Promise<T>,pixel=9) {
  const snapshot=await takePrivateSnapshot(h.repo.getCommittedIntake(h.accepted.id)!,h.keys);
  const deps:ReconstructionDependencies={scope:h.keys.custody,monotonicNow:()=>0,scanner:{assurance:"qualified-local-engine",scan:async file=>({kind:"clean",complete:true,digest:file.digest,bytes:file.bytes,signatureTime:utcInstant(new Date().toISOString()),engineIdentity:"typed-fixture-not-clamav"})},inspector:{assurance:"local-test",inspect:async()=>({kind:"inspected",inspection:{format:"png",pageCount:1}})},raster:{render:async(_file,emit)=>{await emit({index:0,width:1,height:1,channels:3,pixels:new Uint8Array([pixel,8,7])});return{format:"png",pageCount:1};}},output:{verify:async file=>{await sharp(await readFile(file.path)).raw().toBuffer();}}};
  return withPrivateFiles(snapshot,h.keys,processing=>withReconstructedDocuments(processing,deps,action));
}

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
    await h.repo.retireOriginal(h.accepted.id,2);
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
    const record=await createArtifactStore(h.repo,h.keys,h.keys.custody).adoptMime(h.accepted.id,(async function*(){yield Buffer.from("raw message");})(),1);
    const fs=await import("node:fs/promises"), fd=await fs.open(record.path,"r+");try{await fd.write(Buffer.from([0]),0,1,0);}finally{await fd.close();}
    const recovered=createCustodyLedger(h.repo,h.config);
    await expect(recovered.reconcile()).rejects.toThrow("DIGEST_MISMATCH");
  }finally{await h.close();}
});

it("cleans a failed 16 MiB MIME adoption without widening the intake file policy",async()=>{
  const h=await makeArtifactHarness();
  try{
    const original=h.repo.adoptArtifact;
    h.repo.adoptArtifact=async()=>{throw new Error("CAS_BOUNDARY_FAILURE");};
    await expect(createArtifactStore(h.repo,h.keys,h.keys.custody).adoptMime(h.accepted.id,(async function*(){yield Buffer.alloc(16*1024*1024,77);})(),1)).rejects.toThrow("CAS_BOUNDARY_FAILURE");
    h.repo.adoptArtifact=original;
    const recovered=createCustodyLedger(h.repo,h.config);expect((await recovered.reconcile()).orphans).toHaveLength(1);
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
    const artifact=await withEmptyBundle(h,bundle=>store.adoptBundle(bundle,1));
    await h.repo.retireOriginal(h.accepted.id,2);
    h.config.clock.now=()=>new Date("2026-10-10T10:00:00.000Z");
    await h.keys.custody.reconcile();const before=await h.keys.custody.cleanupOrphans();
    expect((await readdir(h.keys.privateRoot)).includes(`${h.reservation.id}.journal`)).toBe(false);
    const retry=await h.keys.custody.reserve({...h.reservation,now:utcInstant("2026-10-10T10:00:00.000Z")});
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
    const record=await store.adoptMime(h.accepted.id,raw(),1);
    expect(await store.adoptMime(h.accepted.id,raw(),1)).toEqual(record);
    await expect(store.adoptMime(h.accepted.id,(async function*(){yield Buffer.from("different");})(),2)).rejects.toThrow("ARTIFACT_CONFLICT");
    await expect(store.adoptMime(h.accepted.id,(async function*(){yield Buffer.alloc(16*1024*1024+1);})(),2)).rejects.toThrow("ARTIFACT_TOO_LARGE");
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
