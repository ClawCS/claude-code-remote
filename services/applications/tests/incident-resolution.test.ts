import { afterEach, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { rm, copyFile, chmod } from "node:fs/promises";
import { join } from "node:path";
import { Secret, TOTP } from "otpauth";
import { maintenanceFixture } from "./fixtures/maintenance";
import { refreshTestRepository } from "./fixtures/admission";
import { bindMaintenance, settleMaintenance } from "../src/worker-maintenance";
import { runRetentionOnce } from "../src/retention";
import { reconcileRestore } from "../src/restore";
import { erasureOwner } from "../src/erasure-repository";
import { digest, utcInstant, type IncidentResolutionInput, type SensitiveAction } from "../src/types";

const connections = vi.hoisted(() => [] as Database.Database[]);
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.push(this); } } };
});
const fixtures: Awaited<ReturnType<typeof maintenanceFixture>>[] = [];
afterEach(async () => {
  for (const f of fixtures) await settleMaintenance(f.owner).catch(() => {});
  for (const db of connections.splice(0)) if (db.open) db.close();
  for (const f of fixtures.splice(0)) await rm(f.root, { recursive: true, force: true });
});
async function setup(payloadCompleted = false) {
  const f = await maintenanceFixture("ordinary", true); fixtures.push(f);
  const accepted = await f.accept(), repository = f.owner.repository, id = accepted.accepted.id, db = connections.at(-1)!;
  const now = () => utcInstant(f.owner.clock.now().toISOString());
  const claim = repository.claimDispatchWork("synthetic-incident", now(), "prepare")!;
  await repository.recordDeliveryFailure({ id, version: claim.case.version, token: claim.case.claimToken }, { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" }, now());
  if (payloadCompleted) {
    f.advance(7 * 86400000); bindMaintenance(f.owner, f.services, f.monotonicNow);
    let complete = false;
    for (let n = 0; n < 150 && !complete; n++) {
      const report = await runRetentionOnce(f.owner);
      expect(report.status).not.toBe("blocked"); complete = report.status === "complete";
    }
    expect(complete).toBe(true);
  }
  let epoch = digest("9".repeat(64));
  const password = "Synthetic incident password 2026";
  const auth = repository.createAuthentication({ keys: accepted.keys, rateKey: Buffer.alloc(32, 8), trust: { currentEpoch: () => epoch }, initialEnrollmentEpoch: () => epoch });
  const enrollment = await auth.beginEnrollment(password, password);
  const otp = () => TOTP.generate({ secret: Secret.fromBase32(new URL(enrollment.provisioningUri).searchParams.get("secret")!), timestamp: f.owner.clock.now().getTime() });
  auth.finishEnrollment(enrollment.handle, otp()); f.advance(30000);
  const login = await auth.authenticate({ username: "niko", password, otp: otp(), trustedIp: "127.0.0.1" });
  if (login.kind !== "authenticated") throw new Error("SYNTHETIC_LOGIN_FAILED");
  const session = login.session;
  const input: IncidentResolutionInput = { kind: "record-delivery-incident-resolution", contactedAt: now(), contactChannel: "phone", agreedResubmissionRoute: "Synthetic private canary: hand in new documents" };
  async function grant(kind: SensitiveAction["kind"] = input.kind) {
    f.advance(30000); db.prepare("DELETE FROM auth_attempts").run();
    const proof = await auth.authorizeSensitiveAction(session, { password, otp: otp(), trustedIp: "127.0.0.1" }, { kind, caseId: id, version: repository.getLifecycleCase(id, session).version });
    await refreshTestRepository(repository); return proof;
  }
  return { f, repository, id, db, now, input, session: login.session, grant, changeEpoch() { epoch = digest("8".repeat(64)); } };
}

it("atomically records original staff proof, shortened deadlines and only the first exact payload intent", async () => {
  const s = await setup(), proof = await s.grant(), before = s.repository.getLifecycleCase(s.id, s.session), delivery = s.repository.getDelivery(s.id);
  const result = await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session);
  expect(result.retention).toBe("commit_pending");
  expect(result.record).toEqual({ caseId: s.id, version: before.version + 1, actor: s.session.staffId, recordedAt: s.now(), contactedAt: s.input.contactedAt, contactChannel: "phone", agreedResubmissionRoute: s.input.agreedResubmissionRoute });
  expect(s.repository.getLifecycleCase(s.id, s.session)).toEqual({ ...before, version: before.version + 1, payloadDeleteAfter: s.now(), contactDeleteAfter: s.now() });
  expect(s.repository.getDelivery(s.id)).toEqual(delivery);
  expect(s.db.prepare("SELECT event,version,at FROM audit WHERE event='delivery:incident-resolution-recorded'").all()).toEqual([{ event: "delivery:incident-resolution-recorded", version: before.version + 1, at: s.now() }]);
  const events = s.db.prepare("SELECT event FROM erasure_events WHERE phase='proposed'").all() as { event: string }[];
  expect(events).toHaveLength(1); expect(JSON.parse(events[0].event)[4][1]).toBe("processing_payload");
  expect(events[0].event).not.toContain("canary");
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)).toEqual(result);
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session)).rejects.toThrow("AUTH_DENIED");
});

it("rolls back proof, deadlines, audit, first intent and grant consumption together", async () => {
  const s = await setup(), proof = await s.grant(), before = s.repository.getLifecycleCase(s.id, s.session);
  s.db.exec("CREATE TRIGGER incident_rollback BEFORE INSERT ON erasure_events BEGIN SELECT RAISE(ABORT,'synthetic-rollback'); END");
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session)).rejects.toThrow("CASE_STORAGE_FAILED");
  expect(s.repository.getLifecycleCase(s.id, s.session)).toEqual(before);
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)).toBeNull();
  expect(s.db.prepare("SELECT count(*) n FROM auth_grants").get()).toEqual({ n: 1 });
  expect(s.db.prepare("SELECT count(*) n FROM erasure_events").get()).toEqual({ n: 0 });
  s.db.exec("DROP TRIGGER incident_rollback");
  expect((await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session)).retention).toBe("commit_pending");
});

it("reuses genuine independently acknowledged and physically completed payload coverage as the first identity intent", async () => {
  const s = await setup(true), proof = await s.grant();
  const before = s.db.prepare("SELECT commitEventId,stage FROM erasure_obligations WHERE caseId=? AND scope='processing_payload'").get(s.id);
  expect(before).toMatchObject({ stage: "locally-complete" });
  await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session);
  expect(s.db.prepare("SELECT commitEventId,stage FROM erasure_obligations WHERE caseId=? AND scope='processing_payload'").get(s.id)).toEqual(before);
  const pending = s.db.prepare("SELECT json_extract(event,'$[4][1]') scope FROM erasure_events WHERE phase='proposed'").all();
  expect(pending).toEqual([{ scope: "incident_identity" }]);
});
it("does not reuse a covering commitment whose replay identity contradicts the actual accepted source", async () => {
  const s = await setup(true), proof = await s.grant();
  s.db.prepare("UPDATE cases SET idempotencyKey='synthetic-mismatched-identity' WHERE id=?").run(s.id);
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session)).rejects.toThrow("ERASURE_UNVERIFIED");
  expect(s.db.prepare("SELECT count(*) n FROM delivery_incident_resolutions").get()).toEqual({ n: 0 });
  expect(s.db.prepare("SELECT count(*) n FROM auth_grants").get()).toEqual({ n: 1 });
});

it("continues the second scope with real original physical cleanup and erases private proof before its parent", async () => {
  const s = await setup(), proof = await s.grant();
  await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session);
  bindMaintenance(s.f.owner, s.f.services, s.f.monotonicNow);
  let complete = false, payloadBeforeIdentity = false;
  for (let n = 0; n < 300 && !complete; n++) {
    const report = await runRetentionOnce(s.f.owner);
    expect(report.consumedItems).toBeLessThanOrEqual(1000); expect(report.selectedCount).toBeLessThanOrEqual(20);
    expect(report.status, `${n}:${report.blocker}`).not.toBe("blocked");
    if (s.db.prepare("SELECT 1 FROM delivery_incident_resolutions WHERE caseId=?").get(s.id) && s.db.prepare("SELECT 1 FROM erasure_obligations WHERE caseId=? AND scope='processing_payload' AND stage='locally-complete'").get(s.id)) payloadBeforeIdentity = true;
    if (!s.db.prepare("SELECT 1 FROM cases WHERE id=?").get(s.id)) expect(s.db.prepare("SELECT 1 FROM erasure_obligations WHERE caseId=? AND scope='processing_payload' AND stage='locally-complete'").get(s.id)).toBeDefined();
    complete = report.status === "complete";
  }
  expect(complete).toBe(true); expect(payloadBeforeIdentity).toBe(true);
  expect(s.db.prepare("SELECT 1 FROM cases WHERE id=?").get(s.id)).toBeUndefined();
  expect(s.db.prepare("SELECT 1 FROM delivery_incident_resolutions").get()).toBeUndefined();
  expect(JSON.stringify(s.f.journalFixture.receipts)).not.toContain("canary");
  const committedScopes = s.f.journalFixture.receipts.map(receipt => JSON.parse(receipt.entry)[0][7]).filter(event => event[3] === "erase_commit").map(event => event[4][1]);
  expect(committedScopes).toEqual(["processing_payload", "incident_identity"]);
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)).toBeNull();
});

it.each([
  { extra: "unapproved" }, { agreedResubmissionRoute: " " }, { agreedResubmissionRoute: "x".repeat(251) },
  { agreedResubmissionRoute: "\u0000" }, { agreedResubmissionRoute: "\u200bhidden" }, { agreedResubmissionRoute: "\ud800" },
  { agreedResubmissionRoute: "\u2028" }, { contactChannel: "sms" }, { contactedAt: "2026-10-10T12:00:00Z" },
  { contactedAt: "2026-10-09T12:00:00.000Z" }, { contactedAt: "2026-10-11T12:00:00.000Z" },
])("rejects bounded-input violation without consuming grant: %j", async change => {
  const s = await setup(), proof = await s.grant();
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, { ...s.input, ...change } as IncidentResolutionInput, proof, s.session)).rejects.toThrow("INCIDENT_RESOLUTION_INVALID");
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)).toBeNull();
  expect(s.db.prepare("SELECT count(*) n FROM auth_grants").get()).toEqual({ n: 1 });
});

it("rejects all accessor and nonplain inputs without invoking getters; snapshots operands before the guard await", async () => {
  const s = await setup(), proof = await s.grant(); let invoked = false;
  for (const key of Object.keys(s.input)) {
    const bad = { ...s.input }; Object.defineProperty(bad, key, { get() { invoked = true; throw new Error("getter executed"); } });
    await expect(s.repository.recordDeliveryIncidentResolution(s.id, bad, proof, s.session)).rejects.toThrow("INCIDENT_RESOLUTION_INVALID");
  }
  expect(invoked).toBe(false);
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, Object.assign(Object.create(null), s.input), proof, s.session)).rejects.toThrow("INCIDENT_RESOLUTION_INVALID");
  const mutable = { ...s.input }, promise = s.repository.recordDeliveryIncidentResolution(s.id, mutable, proof, s.session);
  mutable.agreedResubmissionRoute = "Changed after call";
  expect((await promise).record.agreedResubmissionRoute).toBe(s.input.agreedResubmissionRoute);
});

it("accepts the exact 250-codepoint/1000-byte route boundary and rejects duplicate fresh authorization", async () => {
  const s = await setup(), proof = await s.grant();
  const result = await s.repository.recordDeliveryIncidentResolution(s.id, { ...s.input, agreedResubmissionRoute: "😀".repeat(250) }, proof, s.session);
  expect(result.record.agreedResubmissionRoute).toBe("😀".repeat(250));
  const again = await s.grant();
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, again, s.session)).rejects.toThrow("INCIDENT_RESOLUTION_EXISTS");
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)).toEqual(result);
  expect(() => s.db.prepare("UPDATE delivery_incident_resolutions SET contactChannel='email'").run()).toThrow("IMMUTABLE_INCIDENT_RESOLUTION");
});

it.each(["forged", "stale", "epoch", "session"])("denies %s original grant authority without local writes", async defect => {
  const s = await setup(), original = await s.grant();
  const proof = defect === "forged" ? { ...original, nonce: "x".repeat(43) } : original;
  if (defect === "stale") s.db.prepare("UPDATE cases SET version=version+1 WHERE id=?").run(s.id);
  if (defect === "epoch") s.changeEpoch();
  const session = defect === "session" ? { ...s.session, generation: s.session.generation + 1 } : s.session;
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, session)).rejects.toThrow(defect === "stale" ? "CASE_STALE" : "AUTH_DENIED");
  expect(s.db.prepare("SELECT count(*) n FROM delivery_incident_resolutions").get()).toEqual({ n: 0 });
});

it.each(["invalid", "queued", "unclassified", "claim", "contradiction", "uncertain"])("denies %s evidence without changing deadlines", async defect => {
  const s = await setup(), proof = await s.grant();
  if (defect === "invalid") s.db.prepare("UPDATE deliveries SET category='invalid',reason='INVALID_INPUT' WHERE caseId=?").run(s.id);
  if (defect === "queued") s.db.prepare("UPDATE cases SET deliveryState='queued' WHERE id=?").run(s.id);
  if (defect === "unclassified") s.db.prepare("UPDATE deliveries SET category=NULL,reason=NULL,determinedAt=NULL WHERE caseId=?").run(s.id);
  if (defect === "claim") s.db.prepare("UPDATE cases SET claimOwner='synthetic',claimedAt=?,claimToken=?,claimKind='prepare' WHERE id=?").run(s.now(), "1".repeat(32), s.id);
  if (defect === "contradiction") s.db.prepare("UPDATE deliveries SET confirmedAt=? WHERE caseId=?").run(s.now(), s.id);
  if (defect === "uncertain") s.db.prepare("UPDATE case_lifecycle SET pendingEventId=? WHERE caseId=?").run("f".repeat(32), s.id);
  const before = s.db.prepare("SELECT payloadDeleteAfter,contactDeleteAfter,version FROM cases WHERE id=?").get(s.id);
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session)).rejects.toThrow();
  expect(s.db.prepare("SELECT payloadDeleteAfter,contactDeleteAfter,version FROM cases WHERE id=?").get(s.id)).toEqual(before);
  expect(s.db.prepare("SELECT count(*) n FROM delivery_incident_resolutions").get()).toEqual({ n: 0 });
});

it("rolls back an epoch change inside the exact proof/intent transaction", async () => {
  const s = await setup(), proof = await s.grant(), before = s.repository.getLifecycleCase(s.id, s.session);
  s.db.function("change_synthetic_epoch", () => { s.changeEpoch(); return 1; });
  s.db.exec("CREATE TRIGGER epoch_during_resolution AFTER INSERT ON delivery_incident_resolutions BEGIN SELECT change_synthetic_epoch(); END");
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session)).rejects.toThrow("AUTH_DENIED");
  expect(s.db.prepare("SELECT version,payloadDeleteAfter FROM cases WHERE id=?").get(s.id)).toEqual({ version: before.version, payloadDeleteAfter: before.payloadDeleteAfter });
  expect(s.db.prepare("SELECT count(*) n FROM delivery_incident_resolutions").get()).toEqual({ n: 0 });
  expect(s.db.prepare("SELECT count(*) n FROM erasure_events").get()).toEqual({ n: 0 });
  expect(s.db.prepare("SELECT count(*) n FROM auth_grants").get()).toEqual({ n: 1 });
});

it("never extends an earlier technical deadline or infers resolution from a manual case", async () => {
  const s = await setup();
  await s.repository.applyCaseAction(s.id, { kind: "manual-case", category: "other", reason: "Synthetic business decision only" }, await s.grant("manual-case"), s.session);
  s.db.prepare("UPDATE cases SET payloadDeleteAfter=acceptedAt,contactDeleteAfter=acceptedAt WHERE id=?").run(s.id);
  const before = s.db.prepare("SELECT payloadDeleteAfter,contactDeleteAfter FROM cases WHERE id=?").get(s.id);
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)).toBeNull();
  const proof = await s.grant(); await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session);
  expect(s.db.prepare("SELECT payloadDeleteAfter,contactDeleteAfter FROM cases WHERE id=?").get(s.id)).toEqual(before);
});

it("denies changed current independent authority, not just a locally matching case version", async () => {
  const s = await setup(), proof = await s.grant(), row = s.repository.getLifecycleCase(s.id, s.session);
  s.f.journalFixture.commit(["tj-journal-event-v1", "e".repeat(32), s.now(), "case_fence", [s.id, "initial", row.lifecycle.initialAuthority!, String(row.version), "reject"]]);
  await refreshTestRepository(s.repository);
  await expect(s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session)).rejects.toThrow("CASE_BLOCKED");
  expect(s.db.prepare("SELECT count(*) n FROM delivery_incident_resolutions").get()).toEqual({ n: 0 });
});

it("keeps a failed append on the same event and reports independently committed scopes separately from cleanup", async () => {
  const s = await setup(), proof = await s.grant(), owner = erasureOwner(s.repository);
  const local = await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session);
  const event = (await s.repository.withCaseLock(s.id, async () => owner.pending(s.id)))!;
  const append = s.f.journalFixture.port.append;
  s.f.journalFixture.port.append = async value => { await append(value); throw new Error("synthetic-lost-reply"); };
  await expect(owner.journal!.append(event)).rejects.toThrow();
  expect(await s.repository.withCaseLock(s.id, async () => owner.pending(s.id))).toEqual(event);
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)?.retention).toBe("commit_pending");
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)?.record).toEqual(local.record);
  s.f.journalFixture.port.append = append;
  await owner.journal!.recover(event);
  await s.repository.withCaseLock(s.id, async () => owner.acknowledge(event, await owner.journal!.append(event)));
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)?.retention).toBe("commit_pending");
  await s.repository.withCaseLock(s.id, async () => {
    const second = owner.prepareCommit(s.id, "incident_identity"); owner.acknowledge(second, await owner.journal!.append(second));
  });
  expect(s.repository.getDeliveryIncidentResolution(s.id, s.session)).toEqual({ record: null, retention: "committed_cleanup_pending" });
  expect(s.f.journalFixture.receipts.filter(receipt => JSON.parse(receipt.entry)[0][7][1] === event[1])).toHaveLength(1);
  expect(s.db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(s.id)).not.toEqual({ payloadBytes: 0 });
});

it.each([
  ["incident_identity", false], ["incident_identity", true],
  ["identifying_register", false], ["identifying_register", true],
] as const)("suppresses private proof after original %s commitment (unavailable observation: %s)", async (scope, unavailable) => {
  const s = await setup(), proof = await s.grant(), owner = erasureOwner(s.repository);
  const row = s.repository.getLifecycleCase(s.id, s.session);
  const local = await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session);
  const first = (await s.repository.withCaseLock(s.id, async () => owner.pending(s.id)))!;
  await s.repository.withCaseLock(s.id, async () => owner.acknowledge(first, await owner.journal!.append(first)));
  if (scope === "incident_identity") await s.repository.withCaseLock(s.id, async () => {
    const identity = owner.prepareCommit(s.id, scope); owner.acknowledge(identity, await owner.journal!.append(identity));
  });
  else {
    // Actual signed final-scope lineage enters through the original verifier /
    // projection, as independently committed history can precede local cleanup.
    if (first[3] !== "erase_commit") throw new Error("SYNTHETIC_COMMIT_REQUIRED");
    const initial = row.lifecycle.initialAuthority!, version = String(local.record.version), key = first[4][2], association = first[4][3];
    s.f.journalFixture.commit(["tj-journal-event-v1", "b".repeat(32), s.now(), "attempt_intent", [s.id, "c".repeat(32), "initial", initial, version, "d".repeat(32), key, "e".repeat(64)]]);
    s.f.journalFixture.commit(["tj-journal-event-v1", "f".repeat(32), s.now(), "mailbox_clear_observed", [s.id, "b".repeat(32), "1", s.now(), s.now(), "listed-selectable-v1"]]);
    s.f.journalFixture.commit(["tj-journal-event-v1", "a".repeat(32), s.now(), "erase_commit", [s.id, scope, key, association, "initial", initial, version, "f".repeat(32), "7".repeat(64)]]);
    await refreshTestRepository(s.repository);
  }
  expect(s.db.prepare("SELECT 1 FROM delivery_incident_resolutions WHERE caseId=?").get(s.id)).toBeDefined();
  expect(s.db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(s.id)).not.toEqual({ payloadBytes: 0 });
  if (unavailable) s.f.advance(60001);
  expect(owner.journal!.observation() === null).toBe(unavailable);
  expect(() => s.repository.getLifecycleCase(s.id, s.session)).toThrow("CASE_ERASED");
  const select = vi.spyOn(s.db, "prepare");
  try {
    const result = s.repository.getDeliveryIncidentResolution(s.id, s.session);
    expect(result).toEqual({ record: null, retention: unavailable ? "commit_pending" : "committed_cleanup_pending" });
    for (const privateValue of ["canary", local.record.actor, local.record.contactedAt, local.record.agreedResubmissionRoute]) expect(JSON.stringify(result)).not.toContain(privateValue);
    expect(select.mock.calls.some(([sql]) => sql.includes("SELECT caseId,version,actor"))).toBe(false);
  } finally { select.mockRestore(); }
});

it("restores only the acknowledged payload scope without reconstructing lost private proof or early identity intent", async () => {
  const s = await setup(), proof = await s.grant(), owner = erasureOwner(s.repository);
  const backup = join(s.f.root, "before-resolution.sqlite"); await s.db.backup(backup); await chmod(backup, 0o600);
  await s.repository.recordDeliveryIncidentResolution(s.id, s.input, proof, s.session);
  const first = (await s.repository.withCaseLock(s.id, async () => owner.pending(s.id)))!;
  await s.repository.withCaseLock(s.id, async () => owner.acknowledge(first, await owner.journal!.append(first)));
  s.repository.close(); await copyFile(backup, join(s.f.root, "registry.sqlite"));
  const next = await s.f.restart(), db = connections.at(-1)!;
  bindMaintenance(next.owner, next.services, s.f.monotonicNow);
  let complete = false;
  for (let n = 0; n < 200 && !complete; n++) {
    const report = await reconcileRestore(next.owner);
    expect(report.authLocked).toBe(true); expect(report.consumedItems).toBeLessThanOrEqual(1000);
    expect(report.status, `${n}:${report.blocker}`).not.toBe("blocked"); complete = report.status === "complete";
  }
  expect(complete).toBe(true);
  expect(db.prepare("SELECT scope FROM erasure_scopes WHERE caseId=?").all(s.id)).toEqual([{ scope: "processing_payload" }]);
  expect(db.prepare("SELECT count(*) n FROM delivery_incident_resolutions").get()).toEqual({ n: 0 });
  expect(db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(s.id)).toEqual({ payloadBytes: 0 });
  expect(() => next.owner.repository.getDeliveryIncidentResolution(s.id, s.session)).toThrow("REPOSITORY_COLD");
  await settleMaintenance(next.owner);
});
