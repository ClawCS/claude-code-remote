import { createSecretKey } from "node:crypto";
import sharp from "sharp";
import { makeArtifactHarness } from "./artifacts";
import { createArtifactStore } from "../../src/artifact-store";
import { runDispatchOnce } from "../../src/dispatch";
import { utcInstant, type DispatchDependencies } from "../../src/types";

async function main() {
  if (process.env.NODE_ENV !== "test" || !process.send) throw new Error("TEST_ONLY");
  const stage = process.argv[2];
  const source = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
  const h = await makeArtifactHarness([{ name: "synthetic.png", mediaType: "image/png", content: source.toString("base64") }]);
  const artifacts = createArtifactStore(h.repo, h.keys, h.keys.custody), key = createSecretKey(Buffer.alloc(32, 7));
  let sendCalls = 0, rasterCalls = 0;
  const pause = async () => {
    process.send!({ stage, root: h.root, accepted: h.accepted, privateKey: h.keys.privateKey.export({ format: "pem", type: "pkcs8" }), publicKey: h.keys.publicKey.export({ format: "pem", type: "spki" }), sendCalls, rasterCalls, registered: h.repo.getDelivery(h.accepted.id).registered, mime: h.repo.getArtifact(h.accepted.id, "mime") });
    // Parent performs actual SIGKILL, so no dispatcher finally runs.
    await new Promise<void>(() => {});
  };
  const adoptBundle = artifacts.adoptBundle, adoptMime = artifacts.adoptMime;
  artifacts.adoptBundle = async (...args) => { const result = await adoptBundle(...args); if (stage === "bundle") await pause(); return result; };
  artifacts.adoptMime = async (...args) => { const result = await adoptMime(...args); if (stage === "mime") await pause(); return result; };
  const register = h.repo.stageRegisteredMail, intent = h.repo.beginSendAttempt;
  h.repo.stageRegisteredMail = async (...args) => { const result = await register(...args); if (stage === "registration") await pause(); return result; };
  h.repo.beginSendAttempt = async (...args) => { const result = await intent(...args); if (stage === "intent") await pause(); return result; };
  const finish = h.repo.finishSendAttempt;
  h.repo.finishSendAttempt = async (...args) => { if (stage === "outcome") await pause(); return finish(...args); };
  const deps: DispatchDependencies = {
    repository: h.repo, clock: h.config.clock, owner: "crash-fixture", keys: h.keys, custody: h.keys.custody, artifacts,
    signingKeyId: "key-1", signingKeys: new Map([["key-1", key]]), verificationKeys: new Map([["key-1", key]]),
    reconstruction: {
      scope: h.keys.custody, monotonicNow: () => 0,
      scanner: { assurance: "qualified-local-engine", scan: async file => ({ kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "synthetic-not-clamav" }) },
      inspector: { assurance: "local-test", inspect: async () => ({ kind: "inspected", inspection: { format: "png", pageCount: 1 } }) },
      raster: { render: async (_file, emit) => { rasterCalls++; await emit({ index: 0, width: 1, height: 1, channels: 3, pixels: new Uint8Array([9, 8, 7]) }); return { format: "png", pageCount: 1 }; } },
      output: { verify: async file => { await sharp(file.path).raw().toBuffer(); } },
    },
    createSmtp: () => ({ connect: async () => {}, login: async () => {}, send: async (_envelope, raw) => { for await (const chunk of raw) { if (!chunk.length) throw new Error("EMPTY_RAW"); } sendCalls++; return { accepted: ["info@trinkgut-jammers.de"], rejected: [], response: "250 accepted" }; }, close: () => {} }),
    createMailbox: () => { throw new Error("NO_MAILBOX_IN_CHILD"); },
  };
  await runDispatchOnce(deps); await runDispatchOnce(deps);
  throw new Error("CRASH_BOUNDARY_NOT_REACHED");
}
void main().catch(() => { process.send?.({ error: "CRASH_FIXTURE_FAILED" }); process.exitCode = 1; });
