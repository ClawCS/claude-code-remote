import { mkdtemp, mkdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openReadyTestRepository } from "./admission";
import { createCustodyLedger } from "../../src/custody";
import { testIngressAuthority } from "./ingress-authority";
import type { WorkerOwner, WorkerLifecycleOptions } from "../../src/types";
import { digest, utcInstant } from "../../src/types";
import { generateKeyPairSync } from "node:crypto";
import { encodePayload, payloadDigest, sealIncoming } from "../../src/crypto";
import { testAdmission, testReadiness } from "./admission";

export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

// Actual local exclusion model for these synthetic owners only. Not OS evidence.
export async function maintenanceFixture(startup: "ordinary" | "cold-maintenance" = "ordinary") {
  const root = await mkdtemp(join(await realpath(tmpdir()), "maintenance-synthetic-"));
  let time = Date.parse("2026-10-10T12:00:00.000Z"), monotonic = 0;
  const clock = { now: () => new Date(time) };
  const repository = await openReadyTestRepository(join(root, "registry.sqlite"), clock, { startup });
  const config = { intakeRoot: join(root, "incoming"), custodyRoot: join(root, "custody"), runtimeRoot: join(root, "runtime"), intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock };
  await Promise.all([config.intakeRoot, config.custodyRoot, config.runtimeRoot].map(path => mkdir(path, { mode: 0o700 })));
  const authority = testIngressAuthority(config.intakeRoot);
  const custody = createCustodyLedger(repository, { ...config, ingressAuthority: authority });
  if (startup === "ordinary") await custody.reconcile();
  const owner: WorkerOwner = Object.freeze({ repository, custody, clock });
  const handle = Object.freeze({});
  let held = false, settles = 0;
  const services: NonNullable<WorkerLifecycleOptions["services"]> = {
    async holdMaintenance(candidate) { if (candidate !== owner || held) throw new Error("SYNTHETIC_HOLD_INVALID"); held = true; return handle; },
    assertMaintenanceHeld(candidate, value) { if (candidate !== owner || value !== handle || !held) throw new Error("SYNTHETIC_HOLD_LOST"); },
    async releaseMaintenance() { throw new Error("RELEASE_NOT_ALLOWED_IN_1A"); },
    async settle() { settles++; }, async close() {},
  };
  async function accept() {
    const keys = { ...generateKeyPairSync("rsa", { modulusLength: 2048 }), intakeRoot: config.intakeRoot, privateRoot: config.custodyRoot, runtimeRoot: config.runtimeRoot, custody };
    const payload = { version: 1 as const, input: { name: "Synthetic only", email: "synthetic@example.invalid", job: "sales-fulltime" as const }, files: [] };
    const now = utcInstant(clock.now().toISOString());
    const reservation = await custody.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "custody-lifetime", reservedBytes: 20000, now }, testReadiness);
    const file = await sealIncoming((async function* () { yield encodePayload(payload); })(), { root: config.intakeRoot, maxBytes: 10000, reservationId: reservation.id }, keys.publicKey);
    const accepted = await custody.commitIntake({ reservationId: reservation.id, digest: payloadDigest(payload), encryptedPayloadPath: file.path, actualBytes: file.bytes, encryptedName: "synthetic", job: "sales-fulltime", now });
    return { keys, accepted, record: repository.getCommittedIntake(accepted.id)! };
  }
  return { root, owner, config, authority, services, accept, monotonicNow: () => monotonic, get settles() { return settles; }, loseHold() { held = false; }, advance(ms: number) { monotonic += ms; time += ms; }, async close() { repository.close(); await rm(root, { recursive: true, force: true }); } };
}
