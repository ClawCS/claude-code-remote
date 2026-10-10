import { testAdmission, testReadiness } from "./admission";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCustodyLedger } from "../../src/custody";
import { openTestRepository as openRepository } from "./admission";
import { encodePayload, payloadDigest, sealIncoming } from "../../src/crypto";
import { digest, utcInstant, type WorkerKeys, type PayloadFile } from "../../src/types";
import { testIngressAuthority } from "./ingress-authority";
import { takePrivateSnapshot } from "../../src/custody";
import { sealContact } from "../../src/contact-crypto";

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
  const reservation=await custody.reserve({ ...testAdmission(), sessionHash:digest("b".repeat(64)),idempotencyKey:randomUUID(),reservedBytes:2*maxBytes,now}, testReadiness);
  const file=await sealIncoming((async function*(){yield encoded;})(),{root:intakeRoot,maxBytes,reservationId:reservation.id},keys.publicKey);
  const accepted=await custody.commitIntake({reservationId:reservation.id,digest:payloadDigest(payload),encryptedPayloadPath:file.path,actualBytes:file.bytes,encryptedName:"ciphertext",job:"sales-fulltime",now});
  return {root,repo,keys,accepted,payload,config,authority,reservation,close:async()=>{repo.close();await rm(root,{recursive:true,force:true});}};
}

// Storage fixtures stage only bounded authority. Arbitrary raw storage bytes below
// are NOT verified MIME: this helper never binds them, marks ready, or sends them.
async function prepareArtifactDelivery(h: Awaited<ReturnType<typeof makeArtifactHarness>>, register: boolean) {
  const now = utcInstant(h.config.clock.now().toISOString());
  return h.repo.withCaseLock(h.accepted.id, async current => {
    let row = current;
    if (!row.claimToken) {
      throw new Error("FIXTURE_PREPARATION_CLAIM_REQUIRED");
    }
    const claim = () => ({ id: row.id, version: row.version, token: row.claimToken! });
    const snapshot = await takePrivateSnapshot(h.repo.getCommittedIntake(row.id)!, h.keys);
    row = (await h.repo.storeContact(claim(), sealContact(snapshot.input.email, { caseId: row.id, acceptedAt: row.acceptedAt, version: 1 }, h.keys.publicKey), h.keys.privateKey, now)).case;
    if (register) {
      const staged = await h.repo.stageDeliveryIdentity(claim(), "storage-fixture-1", now); row = staged.case;
      row = (await h.repo.stageRegisteredMail(claim(), { id: row.id, messageId: staged.delivery.identity!.messageId, keyId: "storage-fixture-1", profile: "tj-mail-1", fingerprint: digest("d".repeat(64)), shape: { kind: "text", parts: 1, attachments: [] } }, now)).case;
    }
    return row;
  });
}
export async function claimArtifactPreparation(h: Awaited<ReturnType<typeof makeArtifactHarness>>, register = false) {
  const claimed = h.repo.claimNext("storage-fixture", utcInstant(h.config.clock.now().toISOString()));
  if (claimed?.id !== h.accepted.id) throw new Error("FIXTURE_PREPARATION_CLAIM_REQUIRED");
  return prepareArtifactDelivery(h, register);
}
