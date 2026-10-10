import { afterEach, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { chmodSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Secret, TOTP } from "otpauth";
import { openReadyTestRepository, refreshTestRepository, testAdmission } from "./fixtures/admission";
import { applicationId, digest, utcInstant } from "../src/types";
import { sealName } from "../src/crypto";
import { sealContact } from "../src/contact-crypto";
import { createSafetyJournal } from "../src/ledger";
import { syntheticJournal } from "./fixtures/ledger";
import { testAdmissionScope } from "./fixtures/admission";
import { erasureOwner } from "../src/erasure-repository";
import { deletionOwner } from "../src/deletion-repository";
import { maintenanceFixture } from "./fixtures/maintenance";
import { bindMaintenance, settleMaintenance, settleMaintenanceForClose } from "../src/worker-maintenance";
import { runRetentionOnce } from "../src/retention";

const connections = vi.hoisted(() => [] as Database.Database[]);
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.push(this); } } };
});
const roots: string[] = [];
const maintenance: Awaited<ReturnType<typeof maintenanceFixture>>[] = [];
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
afterEach(async () => { for (const f of maintenance.splice(0)) { await settleMaintenance(f.owner).catch(() => {}); roots.push(f.root); } for (const db of connections.splice(0)) if (db.open) db.close(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); vi.restoreAllMocks(); });
async function setup(key: unknown = keys.privateKey) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "admin-read-"))); chmodSync(root, 0o700); roots.push(root);
  let time = Date.parse("2026-10-10T12:00:00.000Z"), epoch = digest("9".repeat(64));
  const clock = { now: () => new Date(time) };
  const journalFixture = syntheticJournal();
  const scope = { ledgerId: journalFixture.context.ledgerId, historyEpoch: journalFixture.context.historyEpoch, associationKeyId: "fixture-erasure", associationKey: Buffer.alloc(32, 17), approvedScopes: [testAdmissionScope] };
  const repo = await openReadyTestRepository(join(root, "db.sqlite"), clock, { adminPrivateKey: key as typeof keys.privateKey, deletionScope: { currentScope: () => scope }, journalFactory: projection => createSafetyJournal({ port: journalFixture.port, trust: { currentContext: () => journalFixture.context }, clock: { wallNow: clock.now, monotonicNow: () => time }, projection }) });
  const db = connections.at(-1)!, password = "Synthetic admin reader password";
  const auth = repo.createAuthentication({ keys, rateKey: Buffer.alloc(32, 4), trust: { currentEpoch: () => epoch }, initialEnrollmentEpoch: () => epoch });
  const enrollment = await auth.beginEnrollment(password, password);
  const otp = () => TOTP.generate({ secret: Secret.fromBase32(new URL(enrollment.provisioningUri).searchParams.get("secret")!), timestamp: time });
  auth.finishEnrollment(enrollment.handle, otp()); time += 30000;
  const login = await auth.authenticate({ username: "niko", password, otp: otp(), trustedIp: "127.0.0.1" });
  if (login.kind !== "authenticated") throw new Error("SYNTHETIC_LOGIN_FAILED");
  await refreshTestRepository(repo);
  function accept(name = "Synthetic name canary") {
    const now = utcInstant(clock.now().toISOString());
    const reservation = repo.reserve({ sessionHash: digest("1".repeat(64)), idempotencyKey: randomUUID(), reservedBytes: 1, now, ...testAdmission() });
    return repo.commitIntake({ reservationId: reservation.id, digest: digest("2".repeat(64)), encryptedPayloadPath: join(root, "synthetic.enc"), actualBytes: 1, encryptedName: sealName(name, keys.publicKey), job: "sales-fulltime", now });
  }
  function clone(id: string, count: number) {
    // Large synthetic backlog bypasses intake capacity only in this fixture.
    const row = db.prepare("SELECT * FROM cases WHERE id=?").get(id) as Record<string, unknown>;
    const life = db.prepare("SELECT * FROM case_lifecycle WHERE caseId=?").get(id) as Record<string, unknown>;
    const insert = db.prepare(`INSERT INTO cases(${Object.keys(row).join(",")}) VALUES(${Object.keys(row).map(k => `@${k}`).join(",")})`);
    const insertLife = db.prepare(`INSERT INTO case_lifecycle(${Object.keys(life).join(",")}) VALUES(${Object.keys(life).map(k => `@${k}`).join(",")})`);
    db.transaction(() => { for (let n = 0; n < count; n++) { const next = randomUUID(); db.prepare("INSERT INTO reservations(id,sessionHash,idempotencyKey,reservedBytes,expiresAt,active) VALUES(?,?,?,1,?,0)").run(next, row.sessionHash, next, row.contactDeleteAfter); insert.run({ ...row, id: next, reservationId: next, reference: `TJ-${n.toString(16).padStart(24, "0").toUpperCase()}`, idempotencyKey: next }); insertLife.run({ ...life, caseId: next }); db.prepare("INSERT INTO deliveries(caseId) VALUES(?)").run(next); } })();
  }
  let session = login.session;
  return { repo, db, clock, auth, scope, journalFixture, get session() { return session; }, accept, clone,
    async relogin() { const next = await auth.authenticate({ username: "niko", password, otp: otp(), trustedIp: "127.0.0.1" }); if (next.kind !== "authenticated") throw new Error("SYNTHETIC_LOGIN_FAILED"); session = next.session; await refreshTestRepository(repo); },
    async grant(id: ReturnType<typeof applicationId>, kind: import("../src/types").SensitiveAction["kind"]) { time += 30000; const proof = await auth.authorizeSensitiveAction(session, { password, otp: otp(), trustedIp: "127.0.0.1" }, { caseId: id, kind, version: repo.getLifecycleCase(id, session).version }); await refreshTestRepository(repo); return proof; },
    now: () => utcInstant(clock.now().toISOString()),
    async refresh() { await refreshTestRepository(repo); },
    advance(ms: number) { time += ms; }, changeEpoch() { epoch = digest("8".repeat(64)); },
    async operational(id: ReturnType<typeof applicationId>) { const claim = repo.claimDispatchWork("synthetic-reader", utcInstant(clock.now().toISOString()), "prepare")!; expect(claim.case.id).toBe(id); await repo.recordDeliveryFailure({ id, version: claim.case.version, token: claim.case.claimToken }, { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" }, utcInstant(clock.now().toISOString())); },
  };
}

it("returns immutable minimal empty and exact case projections without database or journal writes", async () => {
  const s = await setup();
  expect(s.repo.listAdminCases(null, s.session)).toEqual({ cases: [], next: null, observedAt: s.now() });
  const a = s.accept(), before = s.db.prepare("SELECT total_changes() n").get();
  const detail = s.repo.getAdminCase(a.id, s.session)!;
  expect(detail.case).toEqual({ id: a.id, reference: a.reference, name: "Synthetic name canary", job: "sales-fulltime", acceptedAt: a.acceptedAt, version: 1, caseState: "open", deliveryState: "queued", closedOn: null, deadline: null, deleteFrom: null, holdReviewOn: null, manualCategory: null, hints: { deletionWarning: false, openReminder: false, holdReviewDue: false }, pendingAction: false, identityValidUntil: "2026-11-09T12:00:30.000Z" });
  expect(detail).toEqual({ case: detail.case, observedAt: s.now(), holdReason: null, deliveryIssue: null, mailbox: { state: "not_observed" }, externalCopies: { confirmed: false, at: null }, retention: { payload: "not_committed", contact: "not_committed", publicToken: "not_committed", incidentIdentity: "not_committed", identifyingRegister: "not_committed" }, contact: null, pending: null });
  expect(Object.isFrozen(detail.case.hints)).toBe(true); expect(Object.isFrozen(detail.retention)).toBe(true);
  expect(s.repo.getAdminCase(applicationId(randomUUID()), s.session)).toBeNull();
  expect(s.db.prepare("SELECT total_changes() n").get()).toEqual(before);
});

it("has exact twenty-key exhaustion and bounded original SQL work on a large backlog", async () => {
  const s = await setup(), a = s.accept(); s.clone(a.id, 19);
  expect(s.repo.listAdminCases(null, s.session).next).toBeNull();
  s.db.prepare("UPDATE cases SET reference='TJ-'||upper(substr(replace(id,'-',''),1,24))").run();
  s.clone(a.id, 5000);
  const first = s.repo.listAdminCases(null, s.session), tuple = JSON.parse(Buffer.from(first.next!, "base64url").toString());
  expect(first.cases).toHaveLength(20); expect(Buffer.byteLength(JSON.stringify(first))).toBeLessThanOrEqual(65536);
  const plan = s.db.prepare("EXPLAIN QUERY PLAN SELECT acceptedAt,id FROM cases INDEXED BY maintenance_accepted_due WHERE (acceptedAt,id)>(?,?) ORDER BY acceptedAt,id LIMIT 21").all(tuple[1], tuple[2]);
  expect(JSON.stringify(plan)).toContain("SEARCH cases USING COVERING INDEX maintenance_accepted_due"); expect(JSON.stringify(plan)).not.toContain("TEMP B-TREE");
  let work = 2, queries: string[] = [];
  const prepare = s.db.prepare.bind(s.db);
  vi.spyOn(s.db, "prepare").mockImplementation(((sql: string) => {
    const st = prepare(sql);
    return new Proxy({} as Database.Statement, { get(_target, key) { if (key === "get" || key === "all") return (...args: unknown[]) => { queries.push(sql); const result = st[key](...args); work += 1 + (key === "all" ? (result as unknown[]).length : result === undefined ? 0 : 1); return result; }; const value = st[key as keyof typeof st]; return typeof value === "function" ? value.bind(st) : value; } });
  }) as typeof s.db.prepare);
  const page = s.repo.listAdminCases({ acceptedAt: tuple[1], id: tuple[2] }, s.session);
  expect(page.cases).toHaveLength(20); expect(work).toBeLessThanOrEqual(4096);
  const pageWork = work; work = 2; queries = [];
  expect(s.repo.getAdminCase(applicationId(page.cases[0].id), s.session)).not.toBeNull();
  expect(work).toBeLessThanOrEqual(256); expect(queries.filter(q => q.includes("delivery_attempts")).every(q => q.endsWith("LIMIT 4"))).toBe(true);
  console.info(`admin-read measured original SQL statements+rows: page=${pageWork}, detail=${work}; backlog=5020`);
});

it.each(["name", "contact", "cleanup", "attempts"])("fails closed for corrupt eligible %s evidence", async defect => {
  const s = await setup(), a = s.accept(); await s.operational(a.id);
  if (defect === "name") s.db.prepare("UPDATE cases SET encryptedName='private-error-canary' WHERE id=?").run(a.id);
  if (defect === "contact") { const contact = Buffer.from(sealContact("synthetic@example.invalid", { caseId: a.id, acceptedAt: a.acceptedAt, version: 1 }, keys.publicKey), "base64"); contact[contact.length - 1] ^= 1; s.db.prepare("UPDATE deliveries SET contactEnvelope=? WHERE caseId=?").run(contact.toString("base64"), a.id); }
  if (defect === "cleanup") s.db.prepare("UPDATE deliveries SET cleanupDueAt=? WHERE caseId=?").run(s.now(), a.id);
  if (defect === "attempts") { s.db.pragma("ignore_check_constraints=ON"); for (let n = 1; n <= 4; n++) s.db.prepare("INSERT INTO delivery_attempts(caseId,ordinal,startedAt,finishedAt,outcome,retryable,mimeDigest,fingerprint) VALUES(?,?,?,?,'definitely_failed',1,?,?)").run(a.id, n, s.now(), s.now(), "1".repeat(64), "2".repeat(64)); }
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow(/^ADMIN_UNAVAILABLE$/);
});

it("enforces exact identity and contact deadlines and leaves no canary after original identity commitments", async () => {
  const s = await setup(), a = s.accept(); await s.operational(a.id);
  const expires = utcInstant(new Date(Date.parse(s.now()) + 1000).toISOString());
  s.db.prepare("UPDATE cases SET contactDeleteAfter=? WHERE id=?").run(expires, a.id);
  s.db.prepare("UPDATE deliveries SET contactEnvelope=? WHERE caseId=?").run(sealContact("expiry-canary@example.invalid", { caseId: a.id, acceptedAt: a.acceptedAt, version: 1 }, keys.publicKey), a.id);
  s.advance(999); expect(s.repo.getAdminCase(a.id, s.session)!.contact?.validUntil).toBe(expires);
  s.advance(1); expect(s.repo.getAdminCase(a.id, s.session)!.contact).toBeNull();
  for (const scope of ["incident_identity", "identifying_register"]) {
    s.db.prepare("INSERT INTO erasure_scopes VALUES(?,?,?,1)").run(a.id, scope, "e".repeat(32));
    const before = s.db.prepare("SELECT total_changes() n").get();
    expect(s.repo.getAdminCase(a.id, s.session)).toBeNull(); expect(s.repo.listAdminCases(null, s.session).cases).toEqual([]);
    expect(s.db.prepare("SELECT total_changes() n").get()).toEqual(before);
    s.db.prepare("DELETE FROM erasure_scopes").run();
  }
  s.advance(30 * 86400000 - 1001); await s.relogin();
  expect(s.repo.getAdminCase(a.id, s.session)!.case.identityValidUntil).toBe("2026-11-09T12:00:30.000Z");
  s.advance(1); s.db.prepare("UPDATE cases SET encryptedName='must-not-decrypt-expired' WHERE id=?").run(a.id);
  expect(s.repo.getAdminCase(a.id, s.session)).toBeNull(); expect(s.repo.listAdminCases(null, s.session).cases).toEqual([]);
});

it("suppresses identity immediately after genuine incident resolution, without echoing actor or route", async () => {
  const s = await setup(), a = s.accept(); await s.operational(a.id);
  const proof = await s.grant(a.id, "record-delivery-incident-resolution");
  await s.repo.recordDeliveryIncidentResolution(a.id, { kind: "record-delivery-incident-resolution", contactedAt: s.now(), contactChannel: "phone", agreedResubmissionRoute: "private-resolution-canary" }, proof, s.session);
  const before = s.db.prepare("SELECT total_changes() n").get();
  expect(s.repo.getAdminCase(a.id, s.session)).toBeNull(); expect(s.repo.listAdminCases(null, s.session).cases).toEqual([]);
  expect(s.db.prepare("SELECT total_changes() n").get()).toEqual(before);
  s.db.exec("DROP TRIGGER incident_resolution_immutable");
  s.db.prepare("UPDATE delivery_incident_resolutions SET recordedAt=? WHERE caseId=?").run("2026-10-11T12:00:30.000Z", a.id);
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it.each(["session", "epoch", "clock", "scope", "projection", "readiness"])("rechecks final original %s authority before returning private data", async defect => {
  const s = await setup(), a = s.accept(); let checks = 0;
  const now = s.clock.now, raw = (sql: string) => Database.prototype.prepare.call(s.db, sql) as Database.Statement;
  vi.spyOn(s.clock, "now").mockImplementation(() => {
    if (++checks === 2) {
      if (defect === "session") raw("UPDATE auth_sessions SET revoked=1").run();
      if (defect === "epoch") s.changeEpoch();
      if (defect === "clock") s.advance(1800000);
      if (defect === "scope") s.scope.associationKeyId = "changed";
      if (defect === "projection") raw("UPDATE journal_projection SET hash=?").run("a".repeat(64));
      if (defect === "readiness") raw("UPDATE erasure_maintenance SET authLocked=1").run();
    }
    return now();
  });
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow(["session", "epoch", "clock"].includes(defect) ? "AUTH_DENIED" : "ADMIN_UNAVAILABLE");
  expect(checks).toBe(2);
});

it("validates seek operands without getters and emits only canonical bounded cursors", async () => {
  const s = await setup(); let called = false;
  const after = { get acceptedAt() { called = true; return s.now(); }, id: applicationId(randomUUID()) };
  expect(() => s.repo.listAdminCases(after, s.session)).toThrow("ADMIN_UNAVAILABLE"); expect(called).toBe(false);
  for (const value of [{ acceptedAt: "2026-10-10T12:00:30Z", id: randomUUID() }, { acceptedAt: "+010000-01-01T00:00:00.000Z", id: randomUUID() }, { acceptedAt: s.now(), id: randomUUID().toUpperCase() }, { acceptedAt: s.now(), id: randomUUID(), extra: 1 }]) expect(() => s.repo.listAdminCases(value as never, s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it("projects a genuine proposed scope and rejects an orphan pending erasure instead of reporting no commitment", async () => {
  const s = await setup(), a = s.accept(); s.advance(7 * 86400000); await s.relogin();
  const owner = erasureOwner(s.repo);
  await s.repo.withCaseLock(a.id, async () => owner.prepareCommit(a.id, "processing_payload"));
  expect(s.repo.getAdminCase(a.id, s.session)!.retention.payload).toBe("commit_pending");
  s.db.prepare("DELETE FROM erasure_scopes WHERE caseId=?").run(a.id);
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it("denies missing, malformed and expired original sessions without private reads", async () => {
  const s = await setup(), a = s.accept(); let called = false;
  for (const session of [null, undefined, {}, { ...s.session, generation: 99 }, { ...s.session, get sessionId() { called = true; return s.session.sessionId; } }]) expect(() => s.repo.getAdminCase(a.id, session as never)).toThrow("AUTH_DENIED");
  expect(called).toBe(false);
  s.advance(1800000); await s.refresh();
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow("AUTH_DENIED");
});

it.each(["proposed", "acknowledged"] as const)("projects only bounded validated %s lifecycle proposal data without recovery", async phase => {
  const s = await setup(), a = s.accept(), row = s.repo.getLifecycleCase(a.id, s.session), eventId = "d".repeat(32);
  const event: import("../src/types").JournalEvent = ["tj-journal-event-v1", eventId, s.now(), "case_fence", [a.id, "initial", row.lifecycle.initialAuthority!, "1", "reject"]];
  const receipt = phase === "acknowledged" ? s.journalFixture.commit(event) : null;
  s.db.prepare("INSERT INTO lifecycle_proposals(eventId,caseId,event,actionBytes,grantHash,phase,entry,head) VALUES(?,?,?,?,?,?,?,?)").run(eventId, a.id, JSON.stringify(event), JSON.stringify({ kind: "reject", closedOn: "2026-10-10" }), "f".repeat(64), phase, receipt?.entry ?? null, receipt?.head ?? null);
  s.db.prepare("UPDATE case_lifecycle SET pendingEventId=?,safetyRevision=? WHERE caseId=?").run(eventId, phase === "proposed" ? 1 : 2, a.id);
  await s.refresh();
  const before = s.db.prepare("SELECT total_changes() n").get(), calls = s.journalFixture.calls.length;
  expect(s.repo.getAdminCase(a.id, s.session)!.pending).toEqual({ eventId, kind: "reject", phase });
  expect(s.repo.listAdminCases(null, s.session).cases[0].pendingAction).toBe(true);
  expect(s.db.prepare("SELECT total_changes() n").get()).toEqual(before); expect(s.journalFixture.calls).toHaveLength(calls);
  s.db.exec("DROP TRIGGER lifecycle_proposal_immutable");
  s.db.prepare("UPDATE lifecycle_proposals SET actionBytes=? WHERE eventId=?").run('{"kind":"reject","closedOn":"2026-10-10","privateCanary":"inconsistent"}', eventId);
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it("clears contact and identity at final clock check, not just at entry", async () => {
  const s = await setup(), a = s.accept(); await s.operational(a.id);
  s.db.prepare("UPDATE cases SET contactDeleteAfter=? WHERE id=?").run("2026-10-10T12:00:30.001Z", a.id);
  s.db.prepare("UPDATE deliveries SET contactEnvelope=? WHERE caseId=?").run(sealContact("final-canary@example.invalid", { caseId: a.id, acceptedAt: a.acceptedAt, version: 1 }, keys.publicKey), a.id);
  let calls = 0; const original = s.clock.now;
  const spy = vi.spyOn(s.clock, "now").mockImplementation(() => { if (++calls === 2) s.advance(1); return original(); });
  expect(s.repo.getAdminCase(a.id, s.session)!.contact).toBeNull(); spy.mockRestore();
  s.advance(30 * 86400000 - 2); await s.relogin(); calls = 0;
  vi.spyOn(s.clock, "now").mockImplementation(() => { if (++calls === 2) s.advance(1); return original(); });
  expect(s.repo.getAdminCase(a.id, s.session)).toBeNull();
});

it("suppresses invalid identity at exactly its earlier contact deadline without decrypting the name", async () => {
  const s = await setup(), a = s.accept(), claim = s.repo.claimDispatchWork("invalid-fixture", s.now(), "prepare")!;
  await s.repo.recordDeliveryFailure({ id: a.id, version: claim.case.version, token: claim.case.claimToken }, { category: "invalid", reason: "INVALID_INPUT" }, s.now());
  expect(s.repo.getAdminCase(a.id, s.session)!.case.identityValidUntil).toBe("2026-10-11T12:00:30.000Z");
  s.advance(86400000 - 1); await s.relogin(); expect(s.repo.getAdminCase(a.id, s.session)).not.toBeNull();
  s.advance(1); s.db.prepare("UPDATE cases SET encryptedName='expired-invalid-canary'").run();
  expect(s.repo.getAdminCase(a.id, s.session)).toBeNull();
});

it("counts escaped serialization and rejects oversized names rather than truncating them", async () => {
  const s = await setup(), a = s.accept("\u0001".repeat(120)); s.clone(a.id, 19);
  const page = s.repo.listAdminCases(null, s.session);
  expect(page.cases).toHaveLength(20); expect(Buffer.byteLength(JSON.stringify(page))).toBeLessThanOrEqual(65536);
  expect(page.cases.every(c => c.name === "\u0001".repeat(120) && Buffer.byteLength(JSON.stringify(c)) <= 3072)).toBe(true);
  expect(Buffer.byteLength(JSON.stringify(s.repo.getAdminCase(a.id, s.session)))).toBeLessThanOrEqual(8192);
  s.db.prepare("UPDATE cases SET encryptedName=? WHERE id=?").run("x".repeat(4097), a.id);
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it("keeps a validated delivered reduced register beyond thirty days but rejects conflicting delivery evidence", async () => {
  const s = await setup(), a = s.accept(), fingerprint = "4".repeat(64), messageId = `<${a.id}@trinkgut-jammers.de>`;
  const registered = { id: a.id, messageId, keyId: "synthetic", profile: "tj-mail-1", fingerprint, shape: { kind: "text", parts: 1, attachments: [] } };
  const schedule = [0, 300000, 1800000, 3600000, 86400000].map(ms => new Date(Date.parse(a.acceptedAt) + ms).toISOString());
  s.db.prepare("UPDATE deliveries SET messageId=?,keyId='synthetic',identityDate=?,registered=?,mimeDigest=?,receiptStartedAt=?,receiptSchedule=?,confirmedAt=?,copies=?,cleanupDueAt=? WHERE caseId=?").run(messageId, a.acceptedAt, JSON.stringify(registered), "5".repeat(64), a.acceptedAt, JSON.stringify(schedule), a.acceptedAt, JSON.stringify([{ mailbox: "private-folder-canary", uid: 1, uidValidity: "1", fingerprint }]), new Date(Date.parse(a.acceptedAt) + 23 * 3600000).toISOString(), a.id);
  s.db.prepare("UPDATE cases SET deliveryState='delivered' WHERE id=?").run(a.id);
  s.advance(31 * 86400000); await s.relogin();
  const detail = s.repo.getAdminCase(a.id, s.session)!;
  expect(detail.case.identityValidUntil).toBeNull(); expect(detail.contact).toBeNull(); expect(JSON.stringify(detail)).not.toContain("private-folder-canary");
  s.db.prepare("UPDATE cases SET deliveryState='queued' WHERE id=?").run(a.id);
  // Remove MIME to satisfy the ordinary queued parser: the admin-specific
  // contradictory confirmed-delivery boundary must still reject it.
  s.db.prepare("UPDATE deliveries SET mimeDigest=NULL WHERE caseId=?").run(a.id);
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it.each(["incident_identity", "identifying_register"] as const)("selects no private columns after a genuinely verified %s commit even while physical rows remain", async scope => {
  const s = await setup(), a = s.accept(); await s.operational(a.id);
  const proof = await s.grant(a.id, "record-delivery-incident-resolution"), before = s.repo.getLifecycleCase(a.id, s.session);
  const local = await s.repo.recordDeliveryIncidentResolution(a.id, { kind: "record-delivery-incident-resolution", contactedAt: s.now(), contactChannel: "email", agreedResubmissionRoute: "private-actor-route-canary" }, proof, s.session);
  const owner = erasureOwner(s.repo);
  const first = (await s.repo.withCaseLock(a.id, async () => owner.pending(a.id)))!;
  await s.repo.withCaseLock(a.id, async () => owner.acknowledge(first, await owner.journal!.append(first)));
  if (scope === "incident_identity") await s.repo.withCaseLock(a.id, async () => { const event = owner.prepareCommit(a.id, scope); owner.acknowledge(event, await owner.journal!.append(event)); });
  else {
    if (first[3] !== "erase_commit") throw new Error("SYNTHETIC_COMMIT_REQUIRED");
    s.journalFixture.commit(["tj-journal-event-v1", "b".repeat(32), s.now(), "attempt_intent", [a.id, "c".repeat(32), "initial", before.lifecycle.initialAuthority!, String(local.record.version), "d".repeat(32), first[4][2], "e".repeat(64)]]);
    s.journalFixture.commit(["tj-journal-event-v1", "f".repeat(32), s.now(), "mailbox_clear_observed", [a.id, "b".repeat(32), "1", s.now(), s.now(), "listed-selectable-v1"]]);
    s.journalFixture.commit(["tj-journal-event-v1", "a".repeat(32), s.now(), "erase_commit", [a.id, scope, first[4][2], first[4][3], "initial", before.lifecycle.initialAuthority!, String(local.record.version), "f".repeat(32), "7".repeat(64)]]);
    await s.refresh();
  }
  expect(s.db.prepare("SELECT actor FROM delivery_incident_resolutions WHERE caseId=?").get(a.id)).toBeDefined();
  const statements: string[] = [], prepare = s.db.prepare.bind(s.db), total = s.db.prepare("SELECT total_changes() n").get();
  const spy = vi.spyOn(s.db, "prepare").mockImplementation(((sql: string) => { statements.push(sql); return prepare(sql); }) as typeof s.db.prepare);
  expect(s.repo.getAdminCase(a.id, s.session)).toBeNull(); expect(s.repo.listAdminCases(null, s.session).cases).toEqual([]);
  expect(statements.some(sql => /encryptedName|delivery_incident_resolutions|case_lifecycle|FROM deliveries/.test(sql))).toBe(false);
  spy.mockRestore(); expect(s.db.prepare("SELECT total_changes() n").get()).toEqual(total);
});

it("uses genuine current local completion, never a historical stage flag, for retention", async () => {
  const f = await maintenanceFixture("ordinary", true); maintenance.push(f);
  const a = await f.accept(); f.advance(7 * 86400000); bindMaintenance(f.owner, f.services, f.monotonicNow);
  let complete = false;
  for (let n = 0; n < 150 && !complete; n++) { const result = await runRetentionOnce(f.owner); expect(result.status).not.toBe("blocked"); complete = result.status === "complete"; }
  expect(complete).toBe(true);
  await refreshTestRepository(f.owner.repository);
  const db = connections.at(-1)!, before = db.prepare("SELECT total_changes() n").get();
  expect(erasureOwner(f.owner.repository).adminRetention(a.accepted.id)).toMatchObject({ payload: "local_complete", publicToken: "local_complete", contact: "not_committed" });
  expect(db.prepare("SELECT total_changes() n").get()).toEqual(before);
  await settleMaintenanceForClose(f.owner);
  const next = await f.restart("ordinary");
  expect(erasureOwner(next.owner.repository).adminRetention(a.accepted.id)).toMatchObject({ payload: "committed_cleanup_pending", publicToken: "committed_cleanup_pending" });
  next.owner.repository.close();
});

it("validates actual current mailbox receipts without latching or mutating the original owner", async () => {
  const f = await maintenanceFixture("ordinary", true); maintenance.push(f);
  const a = await f.accept(); await f.qualifySyntheticFinalScope(a);
  const repo = f.owner.repository, db = connections.at(-1)!;
  const row = await repo.withCaseLock(a.accepted.id, async value => value);
  const before = db.prepare("SELECT total_changes() n").get();
  expect(deletionOwner(repo).adminMailbox(row)).toEqual({ state: "currently_cleared" });
  expect(db.prepare("SELECT total_changes() n").get()).toEqual(before);
  db.prepare("UPDATE deletion_state SET clearSafetyRevision=clearSafetyRevision+1").run();
  expect(deletionOwner(repo).adminMailbox(row)).toEqual({ state: "open" });
  db.prepare("UPDATE deletion_state SET clearSafetyRevision=clearSafetyRevision-1").run();
  db.prepare("DELETE FROM journal_facts WHERE kind='mailbox_clear_observed'").run();
  expect(() => deletionOwner(repo).adminMailbox(row)).toThrow("DELETION_STORAGE_INVALID");
});

it("examines only twenty chronological tie keys with key-only lookahead and sparse-page progress", async () => {
  const s = await setup(), a = s.accept(); s.clone(a.id, 20);
  const ordered = s.db.prepare("SELECT id,acceptedAt FROM cases ORDER BY acceptedAt,id").all() as { id: ReturnType<typeof applicationId>; acceptedAt: ReturnType<typeof utcInstant> }[];
  s.db.prepare("UPDATE cases SET encryptedName='corrupt-lookahead' WHERE id=?").run(ordered[20].id);
  const page = s.repo.listAdminCases(null, s.session);
  expect(page.cases.map(c => c.id)).toEqual(ordered.slice(0, 20).map(c => c.id));
  expect(JSON.parse(Buffer.from(page.next!, "base64url").toString())).toEqual([1, ordered[19].acceptedAt, ordered[19].id]);
  for (const row of ordered.slice(0, 20)) s.db.prepare("INSERT INTO erasure_scopes VALUES(?,'incident_identity',?,1)").run(row.id, "e".repeat(32));
  expect(s.repo.listAdminCases(null, s.session)).toEqual({ cases: [], next: page.next, observedAt: s.now() });
  expect(() => s.repo.listAdminCases(ordered[19], s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it.each([null, keys.publicKey, generateKeyPairSync("ed25519").privateKey])("fails closed with unusable configured decryption key", async key => {
  const s = await setup(key); expect(() => s.repo.listAdminCases(null, s.session)).toThrow("ADMIN_UNAVAILABLE");
});

it("shows contact only for a current eligible incident and never changes or exposes internal evidence", async () => {
  const s = await setup(), a = s.accept(); await s.operational(a.id);
  s.db.prepare("UPDATE deliveries SET contactEnvelope=? WHERE caseId=?").run(sealContact("synthetic-canary@example.invalid", { caseId: a.id, acceptedAt: a.acceptedAt, version: 1 }, keys.publicKey), a.id);
  const before = s.db.prepare("SELECT total_changes() n").get();
  const result = s.repo.getAdminCase(a.id, s.session)!;
  expect(result.contact).toEqual({ email: "synthetic-canary@example.invalid", validUntil: "2026-11-09T12:00:30.000Z" });
  expect(result.deliveryIssue).toEqual({ category: "operational", reason: "DEPENDENCY_UNAVAILABLE", determinedAt: s.now(), incidentAt: "2026-10-10T13:00:30.000Z", manualRequiredAt: "2026-10-11T12:00:30.000Z" });
  expect(JSON.stringify(result)).not.toMatch(/actor|Envelope|Payload|registered|fingerprint|sessionId|mailboxChecks/);
  expect(s.db.prepare("SELECT total_changes() n").get()).toEqual(before);
});

it("keeps partial, blocked and stale mailbox evidence truthful without latching contradictions", async () => {
  const s = await setup(), a = s.accept();
  s.db.prepare("INSERT INTO deletion_state(caseId,status) VALUES(?,'partial')").run(a.id);
  expect(s.repo.getAdminCase(a.id, s.session)!.mailbox.state).toBe("partial");
  s.db.prepare("UPDATE deletion_state SET status='mailbox_cleared',clearEventId=?,clearVersion=99,clearSafetyRevision=1 WHERE caseId=?").run("e".repeat(32), a.id);
  expect(s.repo.getAdminCase(a.id, s.session)!.mailbox.state).toBe("open");
  const event = ["tj-journal-event-v1", "f".repeat(32), s.now(), "copy_result", [a.id, "a".repeat(32), "mismatch", "CONTENT_MISMATCH"]];
  s.db.prepare("INSERT INTO deletion_events(eventId,caseId,event,resultFor,phase) VALUES(?,?,?,?,'proposed')").run(event[1], a.id, JSON.stringify(event), "a".repeat(32));
  const before = s.db.prepare("SELECT total_changes() n").get();
  expect(s.repo.getAdminCase(a.id, s.session)!.mailbox.state).toBe("blocked");
  expect(s.db.prepare("SELECT contradictory FROM deletion_state WHERE caseId=?").get(a.id)).toEqual({ contradictory: 0 });
  expect(s.db.prepare("SELECT total_changes() n").get()).toEqual(before);
});

it("rejects unverified committed retention rather than mistaking a scope flag for completed cleanup", async () => {
  const s = await setup(), a = s.accept();
  s.db.prepare("INSERT INTO erasure_scopes VALUES(?,'processing_payload',?,1)").run(a.id, "e".repeat(32));
  expect(() => s.repo.getAdminCase(a.id, s.session)).toThrow("ADMIN_UNAVAILABLE");
  expect(() => s.repo.listAdminCases(null, s.session)).toThrow("ADMIN_UNAVAILABLE");
});
