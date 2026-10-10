import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { openReadyTestRepository } from "./fixtures/admission";
import { digest, utcInstant, type ApplicationRepository } from "../src/types";

let root: string, repo: ApplicationRepository;
const now = utcInstant("2026-10-09T10:00:00.000Z");
const sessionHash = digest("a".repeat(64));
const abuse = { sessionKey: digest("b".repeat(64)), ipKey: digest("c".repeat(64)) };
function input(key: string, at = now) { return { sessionHash, idempotencyKey: key, reservedBytes: 1, now: at, abuse, submission: { kind: "application" as const } }; }
beforeEach(async () => { root = mkdtempSync(join(realpathSync(tmpdir()), "admission-")); repo = await openReadyTestRepository(join(root, "registry.sqlite")); });
afterEach(() => { repo.close(); rmSync(root, { recursive: true, force: true }); });
function attempt(key: string, at = now) { const reservation = repo.reserve(input(key, at)); repo.releaseReservation(reservation.id); }
describe("durable admission", () => {
  it("charges aborted bodies and preserves exact hour eligibility across restart", async () => {
    for (let i = 0; i < 6; i++) attempt(`attempt-${i}`);
    repo.close(); repo = await openReadyTestRepository(join(root, "registry.sqlite"));
    expect(() => attempt("denied")).toThrow("RATE_LIMITED");
    let denial: unknown;
    try { attempt("denied", utcInstant("2026-10-09T10:59:59.001Z")); } catch (error) { denial = error; }
    expect(denial).toMatchObject({ message: "RATE_LIMITED", retryAfterSeconds: 1 });
    expect(() => attempt("boundary", utcInstant("2026-10-09T11:00:00.000Z"))).not.toThrow();
  });
  it("charges expected capacity denial without inserting reservations", () => {
    const first = repo.reserve(input("one")); repo.reserve(input("two"));
    for (let i = 0; i < 4; i++) expect(() => repo.reserve(input(`capacity-${i}`))).toThrow("CAPACITY_EXCEEDED");
    repo.releaseReservation(first.id);
    expect(() => repo.reserve(input("rate-denied"))).toThrow("RATE_LIMITED");
  });
  it("rejects changed synthetic run before accepting an identical-content replay", async () => {
    repo.close(); repo = await openReadyTestRepository(join(root, "registry.sqlite"), { now: () => new Date(now) }, { admissionScope: { currentScope: () => ["b".repeat(32), "synthetic", "run-one", "2026-01-01T00:00:00.000Z", "2027-01-01T00:00:00.000Z"] } });
    const original = repo.reserve({ ...input("pilot"), submission: { kind: "synthetic" as const, pilotRunId: "run-one" } });
    repo.commitIntake({ reservationId: original.id, digest: sessionHash, encryptedPayloadPath: join(root, "original.enc"), actualBytes: 1, encryptedName: "encrypted", job: "sales-fulltime", now });
    expect(() => repo.reserve({ ...input("pilot"), submission: { kind: "synthetic" as const, pilotRunId: "run-two" } })).toThrow("IDEMPOTENCY_CONFLICT");
    expect(() => repo.reserve(input("pilot"))).toThrow("IDEMPOTENCY_CONFLICT");
    const same = repo.reserve({ ...input("pilot"), submission: { kind: "synthetic" as const, pilotRunId: "run-one" } });
    expect(same.submission).toEqual({ kind: "synthetic", pilotRunId: "run-one" });
  });
  it("checks both budgets before inserting either and rate denial never slides expiry", () => {
    for (let i = 0; i < 6; i++) attempt(`session-${i}`);
    const otherIp = digest("d".repeat(64));
    expect(() => repo.reserve({ ...input("denied", utcInstant("2026-10-09T10:20:00.001Z")), abuse: { ...abuse, ipKey: otherIp } })).toThrow("RATE_LIMITED");
    for (let i = 0; i < 30; i++) {
      const key = digest(i.toString(16).padStart(64, "0"));
      const reserved = repo.reserve({ ...input(`ip-${i}`), sessionHash: key, abuse: { sessionKey: key, ipKey: otherIp } }); repo.releaseReservation(reserved.id);
    }
    expect(() => repo.reserve({ ...input("ip-over"), abuse: { sessionKey: digest("e".repeat(64)), ipKey: otherIp } })).toThrow("RATE_LIMITED");
    expect(() => attempt("original-expiry", utcInstant("2026-10-09T11:00:00.000Z"))).not.toThrow();
  });
  it("charges private physical denial and same-key contention", () => {
    expect(() => repo.reserve(input("physical"), "exhausted")).toThrow("CAPACITY_EXCEEDED");
    const first = repo.reserve(input("active"));
    for (let i = 0; i < 4; i++) expect(() => repo.reserve(input("active"))).toThrow("UPLOAD_IN_PROGRESS");
    repo.releaseReservation(first.id);
    expect(() => attempt("exhausted")).toThrow("RATE_LIMITED");
  });
  it("prunes exactly expired records and does not retain them beyond an hour", () => {
    attempt("one");
    expect(repo.pruneAdmissionEvents(utcInstant("2026-10-09T10:59:59.999Z"))).toBe(0);
    expect(repo.pruneAdmissionEvents(utcInstant("2026-10-09T11:00:00.000Z"))).toBe(2);
    expect(repo.pruneAdmissionEvents(utcInstant("2026-10-09T11:00:00.000Z"))).toBe(0);
  });
  it("uses only the exact rolling window when trusted wall time moves backwards", () => {
    for (let i = 0; i < 6; i++) attempt(`future-${i}`);
    expect(() => attempt("earlier", utcInstant("2026-10-09T09:59:59.999Z"))).not.toThrow();
  });
  it("fails closed at the event bound instead of evicting live subjects", async () => {
    repo.close(); const db = new Database(join(root, "registry.sqlite"));
    db.transaction(() => { const insert = db.prepare("INSERT INTO abuse_events VALUES ('session',?,?,?)"); for (let i = 0; i < 100000; i++) insert.run(i.toString(16).padStart(64, "0"), now, "2026-10-09T11:00:00.000Z"); })(); db.close();
    repo = await openReadyTestRepository(join(root, "registry.sqlite"));
    expect(() => attempt("bounded")).toThrow("ADMISSION_UNAVAILABLE");
    expect(repo.pruneAdmissionEvents(utcInstant("2026-10-09T11:00:00.000Z"))).toBe(100000);
    expect(() => attempt("after-prune", utcInstant("2026-10-09T11:00:00.000Z"))).not.toThrow();
  });
  it("rolls back the first scope charge if persistence of the second fails", async () => {
    repo.close(); const db = new Database(join(root, "registry.sqlite"));
    db.exec("CREATE TRIGGER reject_ip BEFORE INSERT ON abuse_events WHEN NEW.scope='ip' BEGIN SELECT RAISE(ABORT,'SYNTHETIC_SQL_FAILURE'); END;"); db.close();
    repo = await openReadyTestRepository(join(root, "registry.sqlite"));
    expect(() => attempt("sql-failed")).toThrow("SYNTHETIC_SQL_FAILURE");
    repo.close(); const inspect = new Database(join(root, "registry.sqlite"));
    expect(inspect.prepare("SELECT COUNT(*) AS count FROM abuse_events").get()).toEqual({ count: 0 }); inspect.exec("DROP TRIGGER reject_ip"); inspect.close();
    repo = await openReadyTestRepository(join(root, "registry.sqlite"));
    for (let i = 0; i < 6; i++) attempt(`successful-${i}`);
    expect(() => attempt("seventh")).toThrow("RATE_LIMITED");
  });
});
