import { generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCustodyLedger } from "../../src/custody";
import { openRepository } from "../../src/repository";
import { encodePayload, payloadDigest, sealIncoming } from "../../src/crypto";
import { digest, utcInstant, type WorkerKeys, type PayloadFile } from "../../src/types";
import { testIngressAuthority } from "./ingress-authority";

export async function makeArtifactHarness(files:PayloadFile[]=[]) {
  const root = await mkdtemp(join(await realpath(tmpdir()),"applications-artifacts-"));
  const intakeRoot=join(root,"intake"), privateRoot=join(root,"custody"), runtimeRoot=join(root,"runtime");
  await Promise.all([intakeRoot,privateRoot,runtimeRoot].map(path=>mkdir(path,{mode:0o700})));
  const repo=openRepository(join(root,"registry.sqlite")), now=utcInstant("2026-10-09T10:00:00.000Z");
  const authority=testIngressAuthority(intakeRoot);
  const config={ intakeRoot,custodyRoot:privateRoot,runtimeRoot,intakeUid:process.getuid!(),sharedGid:process.getgid!(),clock:{now:()=>new Date(now)},ingressAuthority:authority };
  const custody=createCustodyLedger(repo,config); await custody.reconcile();
  const keys: WorkerKeys={...generateKeyPairSync("rsa",{modulusLength:2048}),intakeRoot,privateRoot,runtimeRoot,custody};
  const payload={version:1 as const,input:{name:"Synthetic Applicant",email:"synthetic@example.invalid",job:"sales-fulltime" as const},files};
  const encoded=encodePayload(payload), maxBytes=Math.max(10000,encoded.length+2048);
  const reservation=await custody.reserve({sessionHash:digest("b".repeat(64)),idempotencyKey:randomUUID(),reservedBytes:2*maxBytes,now});
  const file=await sealIncoming((async function*(){yield encoded;})(),{root:intakeRoot,maxBytes,reservationId:reservation.id},keys.publicKey);
  const accepted=await custody.commitIntake({reservationId:reservation.id,digest:payloadDigest(payload),encryptedPayloadPath:file.path,actualBytes:file.bytes,encryptedName:"ciphertext",job:"sales-fulltime",now});
  return {root,repo,keys,accepted,payload,config,authority,reservation,close:async()=>{repo.close();await rm(root,{recursive:true,force:true});}};
}
