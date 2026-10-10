import { afterEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { Secret, TOTP } from "otpauth";
import { openRepository } from "../src/repository";
import { createSafetyJournal } from "../src/ledger";
import { applyCaseAction, berlinDate, decideCaseAction, deletionEligibility, lifecycleIndicators, retentionDates } from "../src/lifecycle";
import { applicationId, dateOnly, digest, utcInstant, type CaseAction, type ApplicationRepository, type JournalEvent } from "../src/types";
import { syntheticJournal } from "./fixtures/ledger";
import { testAdmission, testAdmissionScope, removeTask10Schema } from "./fixtures/admission";

const connections = vi.hoisted(() => ({ current: undefined as Database.Database | undefined }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.current = this; } } };
});
const cleanups: (() => void)[] = [];
afterEach(() => { vi.useRealTimers(); while (cleanups.length) cleanups.pop()!(); });
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 }), password = "Synthetic lifecycle password 2026";

describe("calendar authority", () => {
  it.each([
    ["2026-08-31", "2027-02-28", "2027-03-01"], ["2023-08-31", "2024-02-29", "2024-03-01"],
    ["2024-02-29", "2024-08-29", "2024-08-30"], ["2026-01-31", "2026-07-31", "2026-08-01"],
    ["2025-09-29", "2026-03-29", "2026-03-30"], ["2026-04-25", "2026-10-25", "2026-10-26"],
  ])("clamps six calendar months from %s", (closed, deadline, deleteFrom) => {
    expect(retentionDates(dateOnly(closed))).toEqual({ deadline, deleteFrom });
  });
  it.each(["2026-02-29", "2026-04-31", "2026-1-01", "", "9999-12-31"])("rejects invalid or unrepresentable date %s", value => {
    expect(() => retentionDates(value as ReturnType<typeof dateOnly>)).toThrow();
  });
  it.each([
    ["2026-03-28T22:59:59.999Z", "2026-03-28"], ["2026-03-28T23:00:00.000Z", "2026-03-29"],
    ["2026-03-29T21:59:59.999Z", "2026-03-29"], ["2026-03-29T22:00:00.000Z", "2026-03-30"],
    ["2026-10-24T21:59:59.999Z", "2026-10-24"], ["2026-10-24T22:00:00.000Z", "2026-10-25"],
    ["2026-10-25T22:59:59.999Z", "2026-10-25"], ["2026-10-25T23:00:00.000Z", "2026-10-26"],
    ["2026-10-25T00:30:00.000Z", "2026-10-25"], ["2026-10-25T01:30:00.000Z", "2026-10-25"],
  ])("uses Berlin calendar day for %s", (instant, expected) => expect(berlinDate(new Date(instant))).toBe(expected));
});

async function setup(initial = "2026-10-10T12:00:00.000Z") {
  const directory = mkdtempSync(join(realpathSync(tmpdir()), "lifecycle-synthetic-"));
  let time = Date.parse(initial), monotonic = 0, epoch: ReturnType<typeof digest> | null = digest("a".repeat(64));
  const fixture = syntheticJournal();
  let journal!: ReturnType<typeof createSafetyJournal>;
  const options = { admissionScope: { currentScope: () => testAdmissionScope },deletionScope:{currentScope:()=>({ledgerId:fixture.context.ledgerId,historyEpoch:fixture.context.historyEpoch,associationKeyId:"lifecycle-erasure",associationKey:Buffer.alloc(32,7),approvedScopes:[testAdmissionScope]})}, journalFactory: (projection: Parameters<typeof createSafetyJournal>[0]["projection"]) => {
    journal = createSafetyJournal({ port: { append: event => fixture.port.append(event), readSince: cursor => fixture.port.readSince(cursor) }, trust: { currentContext: () => fixture.context }, clock: { wallNow: () => new Date(time), monotonicNow: () => monotonic }, projection }); return journal;
  } };
  let repository: ApplicationRepository = openRepository(join(directory, "registry.sqlite"), { now: () => new Date(time) }, options);
  await journal.refresh("startup");
  cleanups.push(() => { repository.close(); rmSync(directory, { recursive: true, force: true }); });
  let service = repository.createAuthentication({ keys, rateKey: Buffer.alloc(32, 7), trust: { currentEpoch: () => epoch }, initialEnrollmentEpoch: () => epoch });
  const stage = await service.beginEnrollment(password, password);
  const otp = () => TOTP.generate({ secret: Secret.fromBase32(new URL(stage.provisioningUri).searchParams.get("secret")!), algorithm: "SHA1", digits: 6, period: 30, timestamp: time });
  service.finishEnrollment(stage.handle, otp()); time += 30000;
  const loginResult = await service.authenticate({ username: "niko", password, otp: otp(), trustedIp: "127.0.0.1" });
  if (loginResult.kind !== "authenticated") throw new Error("synthetic login failed");
  const logged = loginResult;
  let count = 0;
  function accept() {
    const now = utcInstant(new Date(time).toISOString()); count++;
    const reservation = repository.reserve({ ...testAdmission(), sessionHash: digest(count.toString(16).padStart(64, "0")), idempotencyKey: `case-${count}`, reservedBytes: 1, now });
    const input = { reservationId: reservation.id, digest: digest("b".repeat(64)), encryptedPayloadPath: join(directory, `case-${count}.enc`), actualBytes: 1, encryptedName: "synthetic ciphertext", job: "sales-fulltime" as const, now };
    return { ...repository.commitIntake(input), input };
  }
  const accepted = accept();
  const read = () => repository.getLifecycleCase(accepted.id, logged.session);
  async function grant(action: CaseAction) {
    time += 30000;
    // Reauthentication rate budget stays real; fixture moves the clock only
    // between completed independent operator actions, never while proving expiry.
    const db = connections.current!; db.prepare("DELETE FROM auth_attempts").run();
    return service.authorizeSensitiveAction(logged.session, { password, otp: otp(), trustedIp: "127.0.0.1" }, { kind: action.kind, caseId: accepted.id, version: read().version });
  }
  async function act(action: CaseAction, recoveryEventId?: string) {
    const proof = await grant(action);
    await journal.refresh("refresh");
    return applyCaseAction(accepted.id, action, proof, { repository, session: logged.session, recoveryEventId });
  }
  return { directory, fixture, get journal() { return journal; }, get service() { return service; }, logged, accepted, accept, read, grant, act, get repository() { return repository; }, get db() { return connections.current!; }, setTime(value: number) { time = value; }, advance(ms: number) { time += ms; monotonic += ms; }, get time() { return time; }, setEpoch(value: typeof epoch) { epoch = value; }, reopenOwner(restartJournal = false) {
    repository.close();
    void restartJournal; // Every original-owner restart now invalidates projected current authority.
    repository = openRepository(join(directory, "registry.sqlite"), { now: () => new Date(time) }, options); service = repository.createAuthentication({ keys, rateKey: Buffer.alloc(32, 7), trust: { currentEpoch: () => epoch } });
  } };
}

describe("actual lifecycle commits", () => {
  it("blocks a locally current action when an independent newer fence has no local business proposal", async () => {
    const s = await setup(), row = s.read();
    s.fixture.commit(["tj-journal-event-v1", "e".repeat(32), new Date(s.time).toISOString(), "case_fence", [row.id, "initial", row.lifecycle.initialAuthority!, String(row.version), "reject"]]);
    await s.journal.refresh("refresh");
    await expect(s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") })).rejects.toThrow("CASE_BLOCKED");
    expect(s.read().caseState).toBe("open");
    expect(s.db.prepare("SELECT count(*) n FROM lifecycle_proposals").get()).toEqual({ n: 0 });
  });
  it.each(["rejected", "manual", "held"] as const)("rejects persisted initial-authority %s decisions without inventing a fence", async state => {
    const s = await setup(), before = s.read(), at = utcInstant(new Date(s.time).toISOString());
    const contradictory = { ...before, lifecycle: { ...before.lifecycle } };
    if (state === "rejected") {
      s.db.prepare("UPDATE cases SET caseState='rejected_closed',closedOn='2026-10-10' WHERE id=?").run(s.accepted.id);
      s.db.prepare("UPDATE case_lifecycle SET deadline='2027-04-10',deleteFrom='2027-04-11' WHERE caseId=?").run(s.accepted.id);
      contradictory.caseState = "rejected_closed"; contradictory.closedOn = dateOnly("2026-10-10");
      contradictory.lifecycle.deadline = dateOnly("2027-04-10"); contradictory.lifecycle.deleteFrom = dateOnly("2027-04-11");
    } else if (state === "manual") {
      s.db.prepare("UPDATE cases SET caseState='manual_case' WHERE id=?").run(s.accepted.id);
      s.db.prepare("UPDATE case_lifecycle SET manualCategory='other' WHERE caseId=?").run(s.accepted.id);
      contradictory.caseState = "manual_case"; contradictory.lifecycle.manualCategory = "other";
    } else {
      s.db.prepare("UPDATE cases SET caseState='reviewing' WHERE id=?").run(s.accepted.id);
      s.db.prepare("UPDATE case_lifecycle SET holdReviewOn='2026-10-10',holdReason='Pending review',holdActor=?,holdAt=? WHERE caseId=?").run(s.logged.session.staffId, at, s.accepted.id);
      contradictory.caseState = "reviewing";
      contradictory.lifecycle.hold = { reviewOn: dateOnly("2026-10-10"), reason: "Pending review", actor: s.logged.session.staffId, at };
    }
    expect(s.read).toThrow("INVALID_LIFECYCLE_STATE");
    expect(deletionEligibility(contradictory, dateOnly("2028-01-01"))).toBe("blocked");
    expect(s.db.prepare("SELECT initialAuthority,authorityKind,authorityId FROM case_lifecycle WHERE caseId=?").get(s.accepted.id)).toEqual({ initialAuthority: before.lifecycle.initialAuthority, authorityKind: "initial", authorityId: before.lifecycle.initialAuthority });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_proposals").get()).toEqual({ n: 0 });
  });
  it.each([
    ["proposed", "missing"], ["acknowledged", "missing"],
    ["proposed", "mismatched"], ["acknowledged", "mismatched"],
    ["proposed", "extra"], ["acknowledged", "extra"],
  ] as const)("rejects persisted %s outstanding proposals with a %s pending correspondence", async (phase, fault) => {
    const s = await setup(), before = s.read();
    function insertProposal() {
      const eventId = randomBytes(16).toString("hex"), event: JournalEvent = ["tj-journal-event-v1", eventId, new Date(s.time).toISOString(), "case_fence", [s.accepted.id, "initial", before.lifecycle.initialAuthority!, "1", "reject"]];
      const receipt = phase === "acknowledged" ? s.fixture.commit(event) : null;
      s.db.prepare("INSERT INTO lifecycle_proposals(eventId,caseId,event,actionBytes,grantHash,phase,entry,head) VALUES(?,?,?,?,?,?,?,?)").run(eventId, s.accepted.id, JSON.stringify(event), JSON.stringify({ kind: "reject", closedOn: "2026-10-10" }), "f".repeat(64), phase, receipt?.entry ?? null, receipt?.head ?? null);
      return eventId;
    }
    const eventId = insertProposal();
    s.db.prepare("UPDATE case_lifecycle SET pendingEventId=?,safetyRevision=? WHERE caseId=?").run(eventId, phase === "proposed" ? 1 : 2, s.accepted.id);
    expect(s.read().lifecycle.pendingEventId).toBe(eventId);
    if (fault === "extra") insertProposal();
    else s.db.prepare("UPDATE case_lifecycle SET pendingEventId=? WHERE caseId=?").run(fault === "missing" ? null : "e".repeat(32), s.accepted.id);
    const persisted = s.db.prepare("SELECT pendingEventId,safetyRevision FROM case_lifecycle WHERE caseId=?").get(s.accepted.id);
    const proposals = s.db.prepare("SELECT eventId,phase FROM lifecycle_proposals ORDER BY eventId").all();
    expect(s.read).toThrow("INVALID_LIFECYCLE_STATE");
    expect(s.db.prepare("SELECT pendingEventId,safetyRevision FROM case_lifecycle WHERE caseId=?").get(s.accepted.id)).toEqual(persisted);
    expect(s.db.prepare("SELECT eventId,phase FROM lifecycle_proposals ORDER BY eventId").all()).toEqual(proposals);
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_audit").get()).toEqual({ n: 0 });
  });
  it("retains initial authority through ordinary review and external attestation without a fence", async () => {
    const s = await setup(), initial = s.read().lifecycle.initialAuthority;
    await s.act({ kind: "review" }); await s.act({ kind: "confirm-external-copies", confirmed: true, reason: "Checked current copies" });
    expect(s.read()).toMatchObject({ caseState: "reviewing", lifecycle: { initialAuthority: initial, authorityKind: "initial", authorityId: initial, pendingEventId: null, externalCopiesConfirmed: true } });
    expect(deletionEligibility(s.read(), dateOnly("2028-01-01"))).toBe("not_due");
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_proposals").get()).toEqual({ n: 0 });
  });
  it("covers the complete state/action legality matrix without deriving expectations from the transition implementation", async () => {
    const s = await setup(), base = s.read(), at = utcInstant(new Date(s.time).toISOString());
    const actions: CaseAction[] = [{ kind: "review" }, { kind: "reject", closedOn: dateOnly("2026-10-10") }, { kind: "correct-date", closedOn: dateOnly("2026-10-10"), reason: "Correction" }, { kind: "reopen", reason: "Reopen" }, { kind: "hold", reviewOn: dateOnly("2026-10-10"), reason: "Hold" }, { kind: "release-hold", reason: "Release" }, { kind: "manual-case", category: "data-subject-request", reason: "Separate" }, { kind: "confirm-external-copies", confirmed: true, reason: "Checked" }];
    // correct-date is intentionally the same date in the rejected fixture.
    const expected = { open: [true, true, false, false, false, false, true, true], reviewing: [false, true, false, false, false, false, true, true], rejected_closed: [false, false, false, true, true, false, true, true], manual_case: [false, false, false, false, false, false, true, true] } as const;
    for (const state of ["open", "reviewing", "rejected_closed", "manual_case"] as const) {
      const row = { ...base, caseState: state, closedOn: state === "rejected_closed" ? dateOnly("2026-10-10") : null, lifecycle: { ...base.lifecycle, deadline: state === "rejected_closed" ? dateOnly("2027-04-10") : null, deleteFrom: state === "rejected_closed" ? dateOnly("2027-04-11") : null, manualCategory: state === "manual_case" ? "other" as const : null } };
      for (const [index, action] of actions.entries()) {
        const apply = () => decideCaseAction(row, action, s.logged.session.staffId, at);
        if (expected[state][index]) expect(apply().version).toBe(2); else expect(apply).toThrow();
      }
      const held = { ...row, lifecycle: { ...row.lifecycle, hold: { reviewOn: dateOnly("2026-10-10"), reason: "Pending", actor: s.logged.session.staffId, at } } };
      expect(decideCaseAction(held, { kind: "release-hold", reason: "Resolved" }, s.logged.session.staffId, at).lifecycle.hold).toBeNull();
    }
  });
  it("preserves actual technical failure facts and independent expiries through rejection and reopening", async () => {
    const s = await setup(), now = utcInstant(new Date(s.time).toISOString());
    const claim = s.repository.claimDispatchWork("synthetic-worker", now, "prepare")!;
    await s.repository.recordDeliveryFailure({ id: claim.case.id, version: claim.case.version, token: claim.case.claimToken }, { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" }, now);
    const before = s.read(), delivery = s.repository.getDelivery(s.accepted.id);
    await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") }); await s.act({ kind: "reopen", reason: "Resume discussion" });
    expect(s.read().deliveryState).toBe(before.deliveryState); expect(s.read().deliveryState).not.toBe("delivered");
    expect(s.repository.getDelivery(s.accepted.id)).toEqual(delivery);
    expect(s.read().payloadDeleteAfter).toBe(before.payloadDeleteAfter); expect(s.read().contactDeleteAfter).toBe(before.contactDeleteAfter);
  });
  it("does not reconcile a pending fence after the DB-owned identity guard is minimized", async () => {
    const s = await setup();
    s.db.exec("CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON lifecycle_audit BEGIN SELECT RAISE(ABORT,'synthetic'); END;");
    await expect(s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") })).rejects.toThrow("CASE_STORAGE_FAILED");
    s.db.prepare("UPDATE case_lifecycle SET identityState='minimized'").run();
    const count = s.fixture.calls.length, pending = s.read().lifecycle.pendingEventId;
    expect((await s.repository.recoverLifecyclePending()).cases[0]).toMatchObject({ outcome: "blocked", eventId: pending });
    expect(s.fixture.calls).toHaveLength(count);
  });
  it("fails closed without leaking malformed private proposal bytes through parse errors", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action);
    s.fixture.port.append = async () => { throw new Error("synthetic failure"); };
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow();
    s.db.exec("DROP TRIGGER lifecycle_proposal_immutable;");
    s.db.prepare("UPDATE lifecycle_proposals SET actionBytes=?").run("private synthetic malformed reason");
    expect(s.read).toThrow("INVALID_LIFECYCLE_STATE");
  });
  it("rejects a changed safety revision during explicit recovery before staging the successor", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") };
    s.db.exec("CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON lifecycle_audit BEGIN SELECT RAISE(ABORT,'synthetic'); END;");
    await expect(s.act(action)).rejects.toThrow("CASE_STORAGE_FAILED"); s.db.exec("DROP TRIGGER synthetic_audit_failure;");
    const pending = s.read().lifecycle.pendingEventId!, fresh = await s.grant(action), append = s.fixture.port.append;
    s.fixture.port.append = async event => { const result = await append(event); if (event[3] === "barrier") s.db.prepare("UPDATE case_lifecycle SET safetyRevision=safetyRevision+1 WHERE caseId=?").run(s.accepted.id); return result; };
    await expect(applyCaseAction(s.accepted.id, action, fresh, { repository: s.repository, session: s.logged.session, recoveryEventId: pending })).rejects.toThrow("CASE_BLOCKED");
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_proposals").get()).toEqual({ n: 1 });
    expect(s.read().version).toBe(1);
  });
  it("rolls back an ignored lifecycle CAS instead of auditing an attestation that was not stored", async () => {
    const s = await setup(), action: CaseAction = { kind: "confirm-external-copies", confirmed: true, reason: "Checked" }, proof = await s.grant(action);
    s.db.exec("CREATE TRIGGER synthetic_ignore_lifecycle BEFORE UPDATE ON case_lifecycle BEGIN SELECT RAISE(IGNORE); END;");
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow("CASE_BLOCKED");
    expect(s.read()).toMatchObject({ version: 1, lifecycle: { externalCopiesConfirmed: false } });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_audit").get()).toEqual({ n: 0 });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM auth_grants").get()).toEqual({ n: 1 });
  });
  it("rejects inconsistent acknowledged/applied safety records instead of trusting an orphan phase", async () => {
    const s = await setup(); await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    s.db.prepare("DELETE FROM lifecycle_audit").run();
    expect(s.read).toThrow("INVALID_LIFECYCLE_STATE");
  });
  it("invalidates an open-case external attestation on genuine rejection, retains it in audit and never resets a same-date correction", async () => {
    const s = await setup();
    await s.act({ kind: "confirm-external-copies", confirmed: true, reason: "Current copies checked" });
    await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    expect(s.read().lifecycle.externalCopiesConfirmed).toBe(false);
    expect(s.db.prepare("SELECT oldExternalConfirmed,newExternalConfirmed FROM lifecycle_audit WHERE kind='reject'").get()).toEqual({ oldExternalConfirmed: 1, newExternalConfirmed: 0 });
    const before = s.read();
    await expect(s.act({ kind: "correct-date", closedOn: dateOnly("2026-10-10"), reason: "Same date" })).rejects.toThrow("CASE_NO_OP");
    expect(s.read()).toEqual(before);
  });
  it("bounds explicit recovery to twenty rows with continuation and never executes private stored actions", async () => {
    const s = await setup(), ids = [];
    for (let index = 0; index < 21; index++) {
      const id = applicationId(randomUUID()), reservation = randomUUID(), initial = randomBytes(16).toString("hex"), eventId = randomBytes(16).toString("hex"); ids.push(id);
      s.db.prepare("INSERT INTO reservations(id,sessionHash,idempotencyKey,reservedBytes,expiresAt,active,submission) SELECT ?,sessionHash,?,reservedBytes,expiresAt,0,submission FROM reservations LIMIT 1").run(reservation, `recovery-${index}`);
      s.db.prepare("INSERT INTO cases(id,reference,reservationId,sessionHash,idempotencyKey,digest,encryptedName,job,acceptedAt,deliveryState,caseState,version,payloadBytes,payloadDeleteAfter,contactDeleteAfter,submission) SELECT ?,?,?,sessionHash,?,digest,encryptedName,job,acceptedAt,deliveryState,caseState,version,payloadBytes,payloadDeleteAfter,contactDeleteAfter,submission FROM cases WHERE id=?").run(id, `TJ-${String(index).padStart(24, "0")}`, reservation, `recovery-${index}`, s.accepted.id);
      s.db.prepare("INSERT INTO deliveries(caseId) VALUES(?)").run(id);
      s.db.prepare("INSERT INTO case_lifecycle(caseId,initialAuthority,authorityKind,authorityId,safetyRevision,pendingEventId) VALUES(?,?,'initial',?,1,?)").run(id, initial, initial, eventId);
      const event: JournalEvent = ["tj-journal-event-v1", eventId, new Date(s.time).toISOString(), "case_fence", [id, "initial", initial, "1", "reject"]];
      s.db.prepare("INSERT INTO lifecycle_proposals(eventId,caseId,event,actionBytes,grantHash,phase) VALUES(?,?,?,?,?,'proposed')").run(eventId, id, JSON.stringify(event), JSON.stringify({ kind: "reject", closedOn: "2026-10-10" }), "f".repeat(64));
      s.fixture.commit(event);
    }
    ids.sort();
    const first = await s.repository.recoverLifecyclePending(); expect(first.cases.map(row => row.id)).toEqual(ids.slice(0, 20)); expect(first.continuation).toBe(ids[19]);
    expect(first.cases.every(row => row.outcome === "acknowledged")).toBe(true);
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_proposals WHERE phase='proposed'").get()).toEqual({ n: 1 });
    const second = await s.repository.recoverLifecyclePending(first.continuation!); expect(second.cases.map(row => row.id)).toEqual(ids.slice(20)); expect(second.continuation).toBeNull();
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM cases WHERE caseState='open' AND version=1").get()).toEqual({ n: 22 });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_audit").get()).toEqual({ n: 0 });
  });
  it("leaves continuation offline without looping or staging a successor", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action), append = s.fixture.port.append;
    s.fixture.port.append = async event => { const result = await append(event); if (event[3] === "case_fence") throw new Error("lost synthetic reply"); return result; };
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow();
    s.fixture.port.append = append;
    for (let index = 0; index < 1001; index++) s.fixture.commit(["tj-journal-event-v1", randomBytes(16).toString("hex"), new Date(s.time).toISOString(), "barrier", [randomBytes(32).toString("hex"), "0".repeat(64), "refresh"]]);
    const fresh = await s.grant(action), pending = s.read().lifecycle.pendingEventId!;
    await expect(applyCaseAction(s.accepted.id, action, fresh, { repository: s.repository, session: s.logged.session, recoveryEventId: pending })).rejects.toThrow("CASE_JOURNAL_CONTINUATION");
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_proposals").get()).toEqual({ n: 1 });
    expect(s.read()).toMatchObject({ version: 1, caseState: "open", lifecycle: { pendingEventId: pending } });
    expect(s.journal.observation()).toBeNull();
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM auth_grants").get()).toEqual({ n: 2 });
  });
  it("does not release a live unknown append or auto-retry another proposal after timeout", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action), append = s.fixture.port.append;
    let release!: () => void, entered!: () => void;
    const waiting = new Promise<void>(resolve => { entered = resolve; }), wait = new Promise<void>(resolve => { release = resolve; });
    s.fixture.port.append = async event => { entered(); await wait; return append(event); };
    vi.useFakeTimers();
    const applying = applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session });
    const rejected = expect(applying).rejects.toThrow(); await waiting;
    s.advance(15001); await vi.advanceTimersByTimeAsync(15001); await rejected;
    const pending = s.read().lifecycle.pendingEventId!;
    const outcome = await s.repository.recoverLifecyclePending();
    expect(outcome.cases[0]).toMatchObject({ eventId: pending, outcome: "blocked" });
    expect(s.fixture.receipts).toHaveLength(1); expect(s.read().version).toBe(1);
    release(); await vi.advanceTimersByTimeAsync(0); vi.useRealTimers();
    expect(s.read().lifecycle.pendingEventId).toBe(pending);
  });
  it("rejects a wrong signed receipt without consuming grant or admitting an unfenced action", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action);
    s.fixture.port.append = async () => s.fixture.receipts[0];
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow();
    expect(s.read().version).toBe(1); expect(s.read().lifecycle.pendingEventId).not.toBeNull();
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM auth_grants").get()).toEqual({ n: 1 });
    await expect(s.act({ kind: "review" })).rejects.toThrow();
  });
  it.each([4, 5])("migrates actual schema %s once, preserving acceptance, auth and replay while leaving historical authority unknown", async version => {
    const s = await setup(), acceptedAt = s.accepted.acceptedAt, publicBefore = s.repository.getPublicStatus(digest((await import("node:crypto")).createHash("sha256").update(s.accepted.statusProof).digest("hex")), utcInstant(new Date(s.time).toISOString()));
    const retainedGrant = version === 5 ? await s.grant({ kind: "review" }) : null;
    s.repository.close();
    const legacy = new Database(join(s.directory, "registry.sqlite"));
    removeTask10Schema(legacy);
    legacy.exec("DROP TABLE lifecycle_audit; DROP TABLE lifecycle_proposals; DROP TABLE case_lifecycle;");
    if (version === 4) legacy.exec("DROP TABLE auth_grants; DROP TABLE auth_sessions; DROP TABLE auth_recovery; DROP TABLE auth_staff; DROP TABLE auth_attempts; DROP TABLE auth_clock;");
    legacy.pragma(`user_version=${version}`); legacy.close();
    s.reopenOwner(); await s.journal.refresh("startup");
    const row = await s.repository.withCaseLock(s.accepted.id, async row => row);
    expect(row.lifecycle).toMatchObject({ initialAuthority: null, authorityKind: null, authorityId: null, identityState: "identifying" });
    expect(row.acceptedAt).toBe(acceptedAt); expect(deletionEligibility(row, dateOnly("2028-01-01"))).toBe("blocked");
    expect(s.repository.commitIntake(s.accepted.input).replayed).toBe(true);
    expect(s.db.pragma("user_version", { simple: true })).toBe(11);
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM case_lifecycle").get()).toEqual({ n: 1 });
    expect(s.repository.getPublicStatus(digest((await import("node:crypto")).createHash("sha256").update(s.accepted.statusProof).digest("hex")), utcInstant(new Date(s.time).toISOString()))).toEqual(publicBefore);
    if (version === 5) {
      expect(s.service.authorizeSession(s.logged.token, utcInstant(new Date(s.time).toISOString()))).toEqual(s.logged.session);
      await applyCaseAction(s.accepted.id, { kind: "review" }, retainedGrant!, { repository: s.repository, session: s.logged.session });
      await expect(applyCaseAction(s.accepted.id, { kind: "review" }, retainedGrant!, { repository: s.repository, session: s.logged.session })).rejects.toThrow("AUTH_DENIED");
      await s.act({ kind: "confirm-external-copies", confirmed: true, reason: "Historical copies checked" });
      expect(s.read().lifecycle).toMatchObject({ initialAuthority: null, authorityKind: null, authorityId: null, externalCopiesConfirmed: true });
      expect(deletionEligibility(s.read(), dateOnly("2028-01-01"))).toBe("blocked");
      await expect(s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") })).rejects.toThrow("CASE_BLOCKED");
    }
    s.reopenOwner(); expect(s.db.prepare("SELECT COUNT(*) AS n FROM case_lifecycle").get()).toEqual({ n: 1 });
  });
  it.each(["identity", "date", "pending", "authority", "hold", "attestation"] as const)("fails closed for malformed/minimized %s state", async mutation => {
    const s = await setup();
    if (mutation === "identity") s.db.prepare("UPDATE case_lifecycle SET identityState='minimized'").run();
    if (mutation === "date") s.db.prepare("UPDATE case_lifecycle SET deadline='2026-02-29'").run();
    if (mutation === "pending") s.db.prepare("UPDATE case_lifecycle SET pendingEventId=?").run("f".repeat(32));
    if (mutation === "authority") s.db.prepare("UPDATE case_lifecycle SET authorityId=?").run("f".repeat(32));
    if (mutation === "hold") s.db.prepare("UPDATE case_lifecycle SET holdReason='orphan'").run();
    if (mutation === "attestation") s.db.prepare("UPDATE case_lifecycle SET externalCopiesConfirmed=1").run();
    if (mutation === "identity") {
      expect(deletionEligibility(s.read(), dateOnly("2028-01-01"))).toBe("blocked");
      await expect(s.act({ kind: "review" })).rejects.toThrow("CASE_BLOCKED");
      expect(() => s.db.prepare("UPDATE case_lifecycle SET identityState='identifying'").run()).toThrow("MINIMIZED_CASE");
    } else expect(s.read).toThrow();
  });
  it("accepts scalar/UTF-8 reason boundary exactly and preserves meaningful spaces", async () => {
    const s = await setup();
    await s.act({ kind: "manual-case", category: "other", reason: "😀".repeat(500) });
    expect(s.db.prepare("SELECT length(CAST(reason AS BLOB)) AS bytes FROM lifecycle_audit").get()).toEqual({ bytes: 2000 });
    await s.act({ kind: "manual-case", category: "withdrawn", reason: "  Meaningful text  " });
    expect(s.db.prepare("SELECT reason FROM lifecycle_audit ORDER BY sequence DESC LIMIT 1").get()).toEqual({ reason: "  Meaningful text  " });
  });
  it.each(["2026-10-09", "2026-11-10"])("rejects hold review outside today through +30: %s", async reviewOn => {
    const s = await setup(); await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    await expect(s.act({ kind: "hold", reviewOn: dateOnly(reviewOn), reason: "Review" })).rejects.toThrow("CASE_DATE_INVALID");
    expect(s.read().version).toBe(2);
  });
  it.each([
    { kind: "reopen", reason: "Reason" }, { kind: "correct-date", closedOn: "2026-10-10", reason: "Reason" },
    { kind: "hold", reviewOn: "2026-10-10", reason: "Reason" }, { kind: "release-hold", reason: "Reason" },
  ])("rejects illegal open-state transition %#", async action => {
    const s = await setup(); await expect(s.act(action as CaseAction)).rejects.toThrow("CASE_TRANSITION_INVALID");
    expect(s.read().version).toBe(1);
  });
  it("rolls back real business/audit/grant together but retains acknowledged invalidation, then requires exact witness and fresh successor", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action);
    s.db.exec("CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON lifecycle_audit BEGIN SELECT RAISE(ABORT,'private synthetic failure detail'); END;");
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow("CASE_STORAGE_FAILED");
    expect(s.read()).toMatchObject({ version: 1, caseState: "open", lifecycle: { safetyRevision: 2 } });
    expect(deletionEligibility(s.read(), dateOnly("2028-01-01"))).toBe("blocked");
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM auth_grants").get()).toEqual({ n: 1 });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_audit").get()).toEqual({ n: 0 });
    const pending = s.read().lifecycle.pendingEventId!;
    s.db.exec("DROP TRIGGER synthetic_audit_failure;");
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session, recoveryEventId: pending })).rejects.toThrow("CASE_FRESH_GRANT_REQUIRED");
    await expect(s.act({ kind: "review" })).rejects.toThrow("CASE_BLOCKED");
    const fresh = await s.grant(action);
    await expect(applyCaseAction(s.accepted.id, action, fresh, { repository: s.repository, session: s.logged.session, recoveryEventId: "f".repeat(32) })).rejects.toThrow("CASE_BLOCKED");
    const result = await applyCaseAction(s.accepted.id, action, fresh, { repository: s.repository, session: s.logged.session, recoveryEventId: pending });
    expect(result).toMatchObject({ version: 2, caseState: "rejected_closed", lifecycle: { pendingEventId: null } });
    expect(result.lifecycle.authorityId).not.toBe(pending);
    const proposals = s.db.prepare("SELECT event,phase,entry FROM lifecycle_proposals ORDER BY rowid").all() as { event: string; phase: string; entry: string }[];
    expect(proposals.map(p => p.phase)).toEqual(["superseded", "applied"]);
    expect(JSON.parse(proposals[1].event)[4]).toEqual([s.accepted.id, "fence", pending, "1", "reject"]);
    for (const p of proposals) expect(JSON.parse(p.entry)[0][7]).toEqual(JSON.parse(p.event));
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_audit").get()).toEqual({ n: 1 });
    await expect(applyCaseAction(s.accepted.id, action, fresh, { repository: s.repository, session: s.logged.session })).rejects.toThrow("AUTH_DENIED");
    expect(s.read().version).toBe(2); // Lost success response: refresh is read-only.
  });
  it.each(["logout", "disable", "epoch", "expiry", "stale", "safety", "journal"] as const)("rechecks %s after awaiting signed journal acknowledgement", async mode => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action);
    const append = s.fixture.port.append;
    s.fixture.port.append = async event => {
      const receipt = await append(event);
      if (event[3] === "case_fence") {
        expect(s.db.inTransaction).toBe(false);
        if (mode === "logout") s.service.logout(s.logged.token);
        if (mode === "disable") s.db.prepare("UPDATE auth_staff SET enabled=0").run();
        if (mode === "epoch") s.setEpoch(digest("c".repeat(64)));
        if (mode === "expiry") s.advance(300000);
        if (mode === "stale") s.db.prepare("UPDATE cases SET version=version+1 WHERE id=?").run(s.accepted.id);
        if (mode === "safety") s.db.prepare("UPDATE case_lifecycle SET safetyRevision=safetyRevision+1 WHERE caseId=?").run(s.accepted.id);
        if (mode === "journal") s.advance(60000);
      }
      return receipt;
    };
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow();
    expect(s.db.prepare("SELECT caseState FROM cases WHERE id=?").get(s.accepted.id)).toEqual({ caseState: "open" });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_audit").get()).toEqual({ n: 0 });
    expect(s.db.prepare("SELECT pendingEventId FROM case_lifecycle WHERE caseId=?").get(s.accepted.id)).toMatchObject({ pendingEventId: expect.stringMatching(/^[a-f0-9]{32}$/) });
  });
  it("distinguishes authentic stale version only after exact consuming session, action, case and epoch are verified", async () => {
    const s = await setup(), action: CaseAction = { kind: "review" }, proof = await s.grant(action);
    s.db.prepare("UPDATE cases SET version=2 WHERE id=?").run(s.accepted.id);
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: { ...s.logged.session, sessionId: digest("f".repeat(64)) } })).rejects.toThrow("AUTH_DENIED");
    await expect(applyCaseAction(s.accepted.id, { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow("AUTH_DENIED");
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow("CASE_STALE");
    s.setEpoch(null);
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow("AUTH_DENIED");
  });
  it("uses Berlin date at final commit and refuses a hold whose today-only review expired across midnight", async () => {
    const s = await setup("2026-10-10T21:57:00.000Z");
    await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    const action: CaseAction = { kind: "hold", reviewOn: dateOnly("2026-10-10"), reason: "Today only" }, proof = await s.grant(action), append = s.fixture.port.append;
    await s.journal.refresh("refresh");
    s.fixture.port.append = async event => { const receipt = await append(event); if (event[3] === "case_fence") s.setTime(Date.parse("2026-10-10T22:00:00.000Z")); return receipt; };
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow("CASE_DATE_INVALID");
    expect(s.read().lifecycle.hold).toBeNull(); expect(s.read().lifecycle.pendingEventId).not.toBeNull();
  });
  it("holds the original case exclusion across append; queued consumers read committed current authority and stale grants fail", async () => {
    const s = await setup(); await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    const action: CaseAction = { kind: "reopen", reason: "Interview resumed" }, proof = await s.grant(action);
    await s.journal.refresh("refresh");
    let release!: () => void, entered!: () => void;
    const waiting = new Promise<void>(resolve => { entered = resolve; }), wait = new Promise<void>(resolve => { release = resolve; }), append = s.fixture.port.append;
    s.fixture.port.append = async event => { if (event[3] === "case_fence") { entered(); await wait; } return append(event); };
    const applying = applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session });
    await waiting;
    let observed = false;
    const consumer = s.repository.withCaseLock(s.accepted.id, async row => { observed = true; expect(row.caseState).toBe("reviewing"); expect(row.version).toBe(3); expect(deletionEligibility(row, dateOnly("2028-01-01"))).toBe("not_due"); });
    await Promise.resolve(); expect(observed).toBe(false); release(); await applying; await consumer;
  });
  it("revalidates expiry after waiting for the case lock before any fence is staged", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action);
    let release!: () => void;
    const held = s.repository.withCaseLock(s.accepted.id, async () => new Promise<void>(resolve => { release = resolve; })); await Promise.resolve();
    const applying = applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session });
    s.advance(300000); release(); await held; await expect(applying).rejects.toThrow("AUTH_DENIED");
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_proposals").get()).toEqual({ n: 0 });
  });
  it("recovers the exact lost acknowledgement after owner restart, never applies stored operands, and leaves abandonment blocked", async () => {
    const s = await setup(), action: CaseAction = { kind: "reject", closedOn: dateOnly("2026-10-10") }, proof = await s.grant(action), append = s.fixture.port.append;
    s.fixture.port.append = async event => { const receipt = await append(event); if (event[3] === "case_fence") throw new Error("synthetic lost acknowledgement"); return receipt; };
    await expect(applyCaseAction(s.accepted.id, action, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow();
    const pending = s.read().lifecycle.pendingEventId!;
    expect(s.db.prepare("SELECT phase FROM lifecycle_proposals WHERE eventId=?").get(pending)).toEqual({ phase: "proposed" });
    s.reopenOwner(true); s.fixture.port.append = append;
    const progress = await s.repository.recoverLifecyclePending();
    expect(progress).toEqual({ cases: [{ id: s.accepted.id, eventId: pending, phase: "acknowledged", outcome: "acknowledged" }], continuation: null });
    expect(s.read()).toMatchObject({ caseState: "open", version: 1, lifecycle: { pendingEventId: pending } });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_audit").get()).toEqual({ n: 0 });
    expect(deletionEligibility(s.read(), dateOnly("2028-01-01"))).toBe("blocked");
    const raw = s.db.prepare("SELECT event,actionBytes,grantHash,entry,head FROM lifecycle_proposals").get();
    expect(JSON.stringify(raw)).not.toContain(proof.nonce); expect(JSON.stringify(raw)).not.toContain(s.logged.token);
    expect(() => s.db.prepare("UPDATE lifecycle_proposals SET actionBytes=? WHERE eventId=?").run(JSON.stringify({ kind: "reject", closedOn: "2026-10-11" }), pending)).toThrow("IMMUTABLE_LIFECYCLE_PROPOSAL");
    const fresh = await s.grant(action);
    await expect(applyCaseAction(s.accepted.id, action, fresh, { repository: s.repository, session: s.logged.session })).rejects.toThrow("CASE_BLOCKED");
  });
  it("enforces the graph, preserves holds across reopen/manual classification and invalidates only material copy attestations", async () => {
    const s = await setup();
    expect(lifecycleIndicators(s.read(), dateOnly("2026-11-08")).openReminder).toBe(false);
    expect(lifecycleIndicators(s.read(), dateOnly("2026-11-09")).openReminder).toBe(true);
    await s.act({ kind: "review" });
    await expect(s.act({ kind: "review" })).rejects.toThrow("CASE_NO_OP");
    await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    await expect(s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") })).rejects.toThrow("CASE_TRANSITION_INVALID");
    await s.act({ kind: "confirm-external-copies", confirmed: true, reason: "Copies handled" });
    await s.act({ kind: "hold", reviewOn: dateOnly("2026-10-10"), reason: "Pending review" });
    expect(lifecycleIndicators(s.read(), dateOnly("2026-10-10")).holdReviewDue).toBe(true);
    expect(deletionEligibility(s.read(), dateOnly("2028-01-01"))).toBe("held");
    await expect(s.act({ kind: "hold", reviewOn: dateOnly("2026-10-10"), reason: "Pending review" })).rejects.toThrow("CASE_NO_OP");
    await s.act({ kind: "hold", reviewOn: dateOnly("2026-11-09"), reason: "Renewed review" });
    await s.act({ kind: "reopen", reason: "Further discussion" });
    expect(s.read()).toMatchObject({ caseState: "reviewing", closedOn: null, lifecycle: { deadline: null, deleteFrom: null, externalCopiesConfirmed: false, hold: { reason: "Renewed review" } } });
    await s.act({ kind: "manual-case", category: "hired", reason: "Separate process" });
    expect(s.read().lifecycle.hold).not.toBeNull();
    await s.act({ kind: "release-hold", reason: "Separate process resolved hold" });
    expect(s.read().lifecycle.hold).toBeNull();
    await expect(s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") })).rejects.toThrow("CASE_TRANSITION_INVALID");
    await expect(s.act({ kind: "manual-case", category: "hired", reason: "Again" })).rejects.toThrow("CASE_NO_OP");
    await s.act({ kind: "manual-case", category: "other", reason: "Updated classification" });
    expect(s.read().caseState).toBe("manual_case");
    expect(lifecycleIndicators(s.read(), dateOnly("2026-11-09")).openReminder).toBe(true);
    const fences = s.db.prepare("SELECT event FROM lifecycle_proposals").all() as { event: string }[];
    expect(fences.map(item => JSON.parse(item.event)[4][4])).toContain("renew-hold");
  });
  it("corrects dates with exact old/new audit, retains dated copy confirmation and records explicit withdrawal", async () => {
    const s = await setup("2026-10-10T21:56:00.000Z");
    await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    await s.act({ kind: "confirm-external-copies", confirmed: true, reason: "Checked copies" });
    const attestation = s.read().lifecycle.externalCopiesAt;
    s.advance(150000);
    await s.act({ kind: "correct-date", closedOn: dateOnly("2026-10-11"), reason: "Actual closure" });
    expect(s.read().lifecycle).toMatchObject({ deadline: "2027-04-11", deleteFrom: "2027-04-12", externalCopiesConfirmed: true, externalCopiesAt: attestation });
    expect(s.db.prepare("SELECT oldClosedOn,newClosedOn,oldDeadline,newDeadline,reason FROM lifecycle_audit WHERE kind='correct-date'").get()).toEqual({ oldClosedOn: "2026-10-10", newClosedOn: "2026-10-11", oldDeadline: "2027-04-10", newDeadline: "2027-04-11", reason: "Actual closure" });
    await s.act({ kind: "confirm-external-copies", confirmed: false, reason: "New copy found" });
    expect(s.read().lifecycle.externalCopiesConfirmed).toBe(false);
    await expect(s.act({ kind: "confirm-external-copies", confirmed: false, reason: "Again" })).rejects.toThrow("CASE_NO_OP");
  });
  it.each([
    { kind: "reject", closedOn: "2026-10-09" }, { kind: "reject", closedOn: "2026-10-11" },
    { kind: "reject", closedOn: "2026-02-29" }, { kind: "reject", closedOn: "2026-10-10", deadline: "2099-01-01" },
    { kind: "manual-case", category: "unknown", reason: "Reason" }, { kind: "manual-case", category: "hired", reason: " " },
    { kind: "manual-case", category: "hired", reason: "a\nb" }, { kind: "manual-case", category: "hired", reason: "x".repeat(501) },
    { kind: "manual-case", category: "hired", reason: "\ud800" }, { kind: "manual-case", category: "hired", reason: "x\u007f" },
  ])("rejects invalid fixed action without fence or consumption %#", async action => {
    const s = await setup(), proof = await s.grant({ kind: action.kind } as CaseAction);
    const before = s.read();
    await expect(applyCaseAction(s.accepted.id, action as CaseAction, proof, { repository: s.repository, session: s.logged.session })).rejects.toThrow();
    expect(s.read()).toEqual(before); expect(s.db.prepare("SELECT COUNT(*) AS n FROM auth_grants").get()).toEqual({ n: 1 });
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM lifecycle_proposals").get()).toEqual({ n: 0 });
  });
  it("creates immutable acceptance authority, preserves replay and commits real rejection after durable proposal and receipt", async () => {
    const s = await setup(), before = s.read();
    expect(before.lifecycle.initialAuthority).toMatch(/^[a-f0-9]{32}$/);
    s.repository.commitIntake(s.accepted.input);
    expect(s.read().lifecycle.initialAuthority).toBe(before.lifecycle.initialAuthority);
    const append = s.fixture.port.append;
    s.fixture.port.append = async event => {
      if (event[3] === "case_fence") {
        expect(s.db.inTransaction).toBe(false);
        expect(s.db.prepare("SELECT event FROM lifecycle_proposals WHERE eventId=?").get(event[1])).toEqual({ event: JSON.stringify(event) });
        expect(s.read().caseState).toBe("open");
      }
      return append(event);
    };
    const result = await s.act({ kind: "reject", closedOn: dateOnly("2026-10-10") });
    expect(result).toMatchObject({ caseState: "rejected_closed", version: 2, closedOn: "2026-10-10", lifecycle: { deadline: "2027-04-10", deleteFrom: "2027-04-11", pendingEventId: null, externalCopiesConfirmed: false } });
    expect(result.payloadDeleteAfter).toBe(before.payloadDeleteAfter); expect(result.contactDeleteAfter).toBe(before.contactDeleteAfter);
    expect(result).not.toHaveProperty("deleteAfter");
    expect(s.db.prepare("SELECT phase FROM lifecycle_proposals").all()).toEqual([{ phase: "applied" }]);
    expect(s.db.prepare("SELECT kind,actor,oldClosedOn,newClosedOn FROM lifecycle_audit").all()).toEqual([{ kind: "reject", actor: s.logged.session.staffId, oldClosedOn: null, newClosedOn: "2026-10-10" }]);
    expect(deletionEligibility(result, dateOnly("2027-04-10"))).toBe("not_due");
    expect(deletionEligibility(result, dateOnly("2027-04-11"))).toBe("eligible");
    expect(lifecycleIndicators(result, dateOnly("2027-04-03")).deletionWarning).toBe(false);
    expect(lifecycleIndicators(result, dateOnly("2027-04-04")).deletionWarning).toBe(true);
    const events = s.fixture.calls.filter(call => call.method === "append").map(call => call.value as JournalEvent).filter(event => event[3] === "case_fence");
    expect(events).toHaveLength(1); expect(events[0][4]).toEqual([result.id, "initial", before.lifecycle.initialAuthority, "1", "reject"]);
  });
});
