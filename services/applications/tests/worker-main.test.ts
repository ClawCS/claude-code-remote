import { afterEach, describe, expect, it, vi } from "vitest";
import { createApplicationWorker } from "../src/worker-main";
import { createSecretKey } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createArtifactStore } from "../src/artifact-store";
import { makeArtifactHarness } from "./fixtures/artifacts";
import { digest, utcInstant } from "../src/types";
import { createWorkerRpcClient } from "../src/worker-rpc";
import { join } from "node:path";
import { testAdmission } from "./fixtures/admission";
import type { WorkerLifecycleOptions, WorkerProof } from "../src/types";

const fixtures: Awaited<ReturnType<typeof makeArtifactHarness>>[] = [];
afterEach(async () => { vi.useRealTimers(); for (const fixture of fixtures.splice(0)) await fixture.close(); });
async function fixture() { const h = await makeArtifactHarness(); fixtures.push(h); return h; }
const now = utcInstant("2026-10-09T10:00:00.000Z");
describe("worker scheduling projection", () => {
  it("projects persisted work and incident deadlines without granting a claim or exposing private data", async () => {
    const h = await fixture();
    expect(h.repo.listWorkerSchedule(now)).toEqual([{ id: h.accepted.id, reference: h.accepted.reference, state: "queued", busy: false, dispatchDueAt: now, incidentAt: "2026-10-09T11:00:00.000Z", manualRequiredAt: "2026-10-10T10:00:00.000Z" }]);
    const claim = h.repo.claimDispatchWork("live", now)!;
    expect(h.repo.listWorkerSchedule(now)[0]).toMatchObject({ state: "scanning", busy: true, dispatchDueAt: null });
    await h.repo.recordDeliveryFailure({ id: claim.case.id, version: claim.case.version, token: claim.case.claimToken }, { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" }, now);
    expect(h.repo.listWorkerSchedule(now)[0]).toMatchObject({ state: "needs_attention", busy: false, dispatchDueAt: null, incidentAt: "2026-10-09T11:00:00.000Z" });
  });
  it("reprojects the terminal state when the real claim selector returns idle after expiry", async () => {
    const h = await fixture(), expired = utcInstant("2026-10-16T10:00:00.000Z");
    expect(h.repo.listWorkerSchedule(expired)[0].dispatchDueAt).toBe(now);
    expect(h.repo.claimDispatchWork("worker", expired)).toBeNull();
    expect(h.repo.listWorkerSchedule(expired)[0]).toMatchObject({ state: "needs_attention", dispatchDueAt: null });
  });
});

async function lifecycle() {
  const h = await fixture(); let time = new Date(now);
  const clock = { now: () => new Date(time) }, owner = { repository: h.repo, custody: h.keys.custody, clock };
  h.config.clock = clock;
  const proof = (): WorkerProof => ({ checkedAt: utcInstant(clock.now().toISOString()), validUntil: utcInstant(new Date(clock.now().getTime() + 300000).toISOString()) });
  const options: WorkerLifecycleOptions = {
    acquire: () => owner,
    dispatch: () => {
      const key = createSecretKey(Buffer.alloc(32, 7));
      return { ...owner, owner: "lifecycle-test", keys: h.keys, artifacts: createArtifactStore(h.repo, h.keys, h.keys.custody), signingKeyId: "key-1", signingKeys: new Map([["key-1", key]]), verificationKeys: new Map([["key-1", key]]),
        reconstruction: { scope: h.keys.custody, monotonicNow: () => 0, scanner: { assurance: "qualified-local-engine", scan: async file => ({ kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "synthetic-not-clamav" }) }, inspector: { assurance: "local-test", inspect: async () => ({ kind: "inspected", inspection: { format: "png", pageCount: 1 } }) }, raster: { render: async () => { throw new Error("NO_FILES"); } }, output: { verify: async () => {} } },
        createSmtp: () => ({ connect: async () => {}, login: async () => {}, send: async (_envelope, raw) => { for await (const bytes of raw) void bytes; return { accepted: ["info@trinkgut-jammers.de"], rejected: [], response: "250 synthetic" }; }, close: () => {} }),
        createMailbox: () => ({ findVerified: async () => ({ complete: true, copies: [], issues: [] }), disconnect: async () => {} }),
      };
    },
    restore: { assurance: "local-test", verify: async () => ({ ...proof(), checkpointId: "synthetic-checkpoint", ledgerVerified: true }), current: () => ({ ...proof(), checkpointId: "synthetic-checkpoint", ledgerVerified: true }) },
    retention: { assurance: "local-test", sweep: async () => ({ ...proof(), validUntil: utcInstant(new Date(clock.now().getTime() + 3600001).toISOString()) }) },
    readiness: { assurance: "local-test", current: () => ({ runtime: proof(), scanner: proof(), mail: proof(), retention: proof() }) },
  };
  return { h, options, owner, clock, proof, advance: (ms: number) => { time = new Date(time.getTime() + ms); } };
}
describe("worker lifecycle", () => {
  it("backs off a failed overdue maintenance pass instead of scheduling a past deadline in a hot loop", async () => {
    const f = await lifecycle(), worker = createApplicationWorker(f.options);
    await worker.start(); f.advance(360000); f.h.authority.available = false;
    try {
      expect(await worker.runOnce()).toEqual({ dispatched: false, nextWakeAt: "2026-10-09T10:06:01.000Z" });
      expect(worker.getIntakeReadiness()).toEqual({ ready: false });
    } finally { f.h.authority.available = true; await worker.drain({ graceMs: 1000 }); }
  });
  it("shares its current gate with the actual Unix RPC reserve boundary", async () => {
    const f = await lifecycle(); let live = true;
    const socketPath = join(f.h.root, "worker.sock");
    const worker = createApplicationWorker({ ...f.options, rpc: { socketPath, sharedGid: process.getgid!() }, readiness: { assurance: "local-test", current: () => ({ runtime: live ? f.proof() : null, scanner: f.proof(), mail: f.proof(), retention: f.proof() }) } });
    await worker.start();
    const client = createWorkerRpcClient(socketPath), input = { ...testAdmission(), sessionHash: digest("c".repeat(64)), idempotencyKey: "lifecycle-rpc", reservedBytes: 20000, now };
    expect(await client.getIntakeReadiness()).toEqual({ ready: true });
    live = false; await expect(client.reserve(input)).rejects.toThrow("WORKER_UNAVAILABLE");
    live = true; const reserved = await client.reserve(input);
    await client.abortIntake(reserved.id, input.sessionHash);
    expect(await worker.drain({ graceMs: 1000 })).toEqual({ state: "stopped", complete: true });
    await expect(client.getIntakeReadiness()).rejects.toThrow("WORKER_UNAVAILABLE");
  });
  it.each(["runtime", "scanner", "mail", "retention"] as const)("keeps intake closed without current %s evidence", async missing => {
    const f = await lifecycle();
    const worker = createApplicationWorker({ ...f.options, readiness: { assurance: "local-test", current: () => ({ runtime: f.proof(), scanner: f.proof(), mail: f.proof(), retention: f.proof(), [missing]: null }) } });
    await worker.start(); expect(worker.getIntakeReadiness()).toEqual({ ready: false });
    expect((await worker.runOnce()).dispatched).toBe(false);
    await worker.drain({ graceMs: 1000 });
  });
  it("requires actual cleanup evidence, rejects stale or changed restore proof, and sanitizes failure logs", async () => {
    const f = await lifecycle(), events: unknown[] = [];
    const blocked = createApplicationWorker({ ...f.options, retention: { assurance: "qualified", sweep: async () => { throw new Error("synthetic-private@example.invalid"); } }, onEvent: event => events.push(event) });
    expect(await blocked.start()).toEqual({ state: "unavailable" });
    expect(blocked.getIntakeReadiness()).toEqual({ ready: false });
    expect(JSON.stringify(events)).not.toContain("example.invalid");
    expect(events).toEqual([{ reference: expect.stringMatching(/^[a-f0-9-]{36}$/), code: "WORKER_UNAVAILABLE" }]);
    const worker = createApplicationWorker({ ...f.options, restore: { ...f.options.restore!, current: () => ({ ...f.proof(), checkpointId: "different-checkpoint", ledgerVerified: true }) } });
    expect(await worker.start()).toEqual({ state: "unavailable" });
    expect(worker.getIntakeReadiness()).toEqual({ ready: false });
    await worker.drain({ graceMs: 1000 });
  });
  it("does not use local test restore evidence outside NODE_ENV=test", async () => {
    const f = await lifecycle();
    vi.stubEnv("NODE_ENV", "production");
    try { const worker = createApplicationWorker(f.options); expect(await worker.start()).toEqual({ state: "unavailable" }); expect(worker.getIntakeReadiness()).toEqual({ ready: false }); }
    finally { vi.unstubAllEnvs(); }
  });
  it("does not reconcile plaintext or custody before current runtime recovery evidence exists", async () => {
    const f = await lifecycle();
    const reconciliation = vi.spyOn(f.owner.custody, "reconcile");
    const worker = createApplicationWorker({ ...f.options, readiness: { assurance: "local-test", current: () => ({ runtime: null, scanner: f.proof(), mail: f.proof(), retention: f.proof() }) } });
    expect(await worker.start()).toEqual({ state: "unavailable" });
    expect(reconciliation).not.toHaveBeenCalled();
  });
  it("awaits actual service settlement and leaves the repository open when the grace interval expires", async () => {
    const f = await lifecycle(); let settled!: () => void, entered!: () => void, closed = false;
    const work = new Promise<void>(resolve => { settled = resolve; }), active = new Promise<void>(resolve => { entered = resolve; });
    const worker = createApplicationWorker({ ...f.options, services: { settle: async () => { entered(); await work; }, close: async () => { closed = true; } } });
    await worker.start(); vi.useFakeTimers();
    const drain = worker.drain({ graceMs: 10 }); await active; await vi.advanceTimersByTimeAsync(10);
    expect(await drain).toEqual({ state: "draining", complete: false });
    expect(closed).toBe(false); expect(f.h.repo.listWorkerSchedule(now)).toHaveLength(1);
    settled(); expect(await worker.drain({ graceMs: 10 })).toEqual({ state: "stopped", complete: true }); expect(closed).toBe(true);
  });
  it("never reopens acceptance when drain races an unfinished restore verification", async () => {
    const f = await lifecycle(); let release!: () => void, entered!: () => void;
    const waiting = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
    const worker = createApplicationWorker({ ...f.options, restore: { ...f.options.restore!, verify: async () => { entered(); await waiting; return f.options.restore!.verify(f.owner); } } });
    const startup = worker.start(); await started;
    const stopped = worker.drain({ graceMs: 1000 }); release();
    expect((await startup).state).not.toBe("running");
    expect(await stopped).toEqual({ state: "stopped", complete: true });
    expect(worker.getIntakeReadiness()).toEqual({ ready: false });
  });
  it("runs actual due dispatch once per persisted receipt slot and emits terminal incidents after an idle selector", async () => {
    const f = await lifecycle(), events: unknown[] = [];
    const acceptedPath = f.h.repo.getCommittedIntake(f.h.accepted.id)!.encryptedPayloadPath, acceptedBytes = await readFile(acceptedPath);
    const worker = createApplicationWorker({ ...f.options, onEvent: event => events.push(event) });
    await worker.start();
    expect((await worker.runOnce()).dispatched).toBe(true);
    expect((await worker.runOnce()).dispatched).toBe(true);
    expect((await worker.runOnce()).dispatched).toBe(true);
    expect(f.h.repo.getDelivery(f.h.accepted.id).mailboxChecks).toBe(1);
    for (let i = 0; i < 5; i++) expect((await worker.runOnce()).dispatched).toBe(false);
    f.advance(300000);
    expect((await worker.runOnce()).dispatched).toBe(true);
    expect(f.h.repo.getDelivery(f.h.accepted.id).mailboxChecks).toBe(2);
    expect(await readFile(acceptedPath)).toEqual(acceptedBytes);
    f.advance(7 * 86400000);
    expect((await worker.runOnce()).dispatched).toBe(true);
    expect(f.h.repo.listWorkerSchedule(utcInstant(f.clock.now().toISOString()))[0]).toMatchObject({ state: "needs_attention", dispatchDueAt: null });
    expect((await worker.runOnce()).dispatched).toBe(false);
    expect(events).toContainEqual({ reference: f.h.accepted.reference, code: "MANUAL_REQUIRED" });
    await worker.drain({ graceMs: 1000 });
  });
  it("keeps a real unfinished SMTP scope and DB ownership through grace expiry", async () => {
    const f = await lifecycle(); let entered!: () => void, release!: () => void;
    const active = new Promise<void>(resolve => { entered = resolve; }), outcome = new Promise<void>(resolve => { release = resolve; });
    const deps = f.options.dispatch!(f.owner), original = deps.createSmtp;
    const worker = createApplicationWorker({ ...f.options, dispatch: () => ({ ...deps, createSmtp: () => { const smtp = original(); return { ...smtp, send: async (envelope, raw) => { const result = await smtp.send(envelope, raw); entered(); await outcome; return result; } }; } }) });
    await worker.start(); await worker.runOnce();
    const sending = worker.runOnce(); await active;
    vi.useFakeTimers(); f.advance(3600000);
    // New timers must be installed with the fake scheduler below; start's existing
    // real timer is canceled by drain. The durable active intent is the key proof.
    const drain = worker.drain({ graceMs: 10 }); await vi.advanceTimersByTimeAsync(10);
    expect(await drain).toEqual({ state: "draining", complete: false });
    expect(f.h.repo.getDelivery(f.h.accepted.id).attempts[0].outcome).toBeNull();
    expect(worker.getIntakeReadiness()).toEqual({ ready: false });
    release(); await sending;
    expect(await worker.drain({ graceMs: 10 })).toEqual({ state: "stopped", complete: true });
  });
  it("prunes expired admission counters within five minutes even while SMTP owns its async scope", async () => {
    const f = await lifecycle(); vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    let entered!: () => void, release!: () => void;
    const active = new Promise<void>(resolve => { entered = resolve; }), outcome = new Promise<void>(resolve => { release = resolve; });
    const deps = f.options.dispatch!(f.owner), original = deps.createSmtp;
    const worker = createApplicationWorker({ ...f.options, dispatch: () => ({ ...deps, createSmtp: () => { const smtp = original(); return { ...smtp, send: async (envelope, raw) => { const result = await smtp.send(envelope, raw); entered(); await outcome; return result; } }; } }) });
    await worker.start(); await worker.runOnce();
    const sending = worker.runOnce(); await active;
    try {
      f.advance(3600000); await vi.advanceTimersByTimeAsync(300000);
      expect(f.h.repo.pruneAdmissionEvents(utcInstant(f.clock.now().toISOString()))).toBe(0);
      expect(f.h.repo.getDelivery(f.h.accepted.id).attempts[0].outcome).toBeNull();
    } finally { release(); await sending; await worker.drain({ graceMs: 1000 }); }
  });
  it("has no construction side effects and never treats normal restart as restore approval", async () => {
    const f = await lifecycle(); let acquired = 0;
    const worker = createApplicationWorker({ ...f.options, acquire: () => { acquired++; return f.owner; }, restore: undefined });
    expect(acquired).toBe(0); expect(worker.getIntakeReadiness()).toEqual({ ready: false });
    expect(await worker.start()).toEqual({ state: "unavailable" });
    expect(acquired).toBe(1); expect(worker.getIntakeReadiness()).toEqual({ ready: false });
  });
  it("requires cleanup plus all fresh current gates and synchronously withdraws admission during drain", async () => {
    const f = await lifecycle(); let runtime = true;
    const worker = createApplicationWorker({ ...f.options, readiness: { assurance: "local-test", current: () => ({ runtime: runtime ? f.proof() : null, scanner: f.proof(), mail: f.proof(), retention: f.proof() }) } });
    expect(await worker.start()).toEqual({ state: "running" });
    expect(worker.getIntakeReadiness()).toEqual({ ready: true });
    runtime = false; expect(worker.getIntakeReadiness()).toEqual({ ready: false });
    runtime = true; expect(worker.getIntakeReadiness()).toEqual({ ready: true });
    const draining = worker.drain({ graceMs: 1000 });
    expect(worker.getIntakeReadiness()).toEqual({ ready: false });
    expect(await draining).toEqual({ state: "stopped", complete: true });
    expect(() => f.h.repo.listWorkerSchedule(now)).toThrow();
  });
  it("does not allocate dispatch runs without due work and reprojects terminalization after idle", async () => {
    const f = await lifecycle(); f.advance(7 * 86400000);
    const events: unknown[] = [];
    const worker = createApplicationWorker({ ...f.options, dispatch: undefined, onEvent: event => events.push(event) });
    await worker.start();
    // With no dispatcher installed, no success-default processing can occur.
    expect((await worker.runOnce()).dispatched).toBe(false);
    expect(f.h.repo.listWorkerSchedule(utcInstant(f.clock.now().toISOString()))[0].state).toBe("queued");
    expect(events).toContainEqual({ reference: f.h.accepted.reference, code: "DELIVERY_INCIDENT" });
    expect(events).toContainEqual({ reference: f.h.accepted.reference, code: "MANUAL_REQUIRED" });
    await worker.drain({ graceMs: 1000 });
  });
});
