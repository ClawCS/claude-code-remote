import { randomBytes } from "node:crypto";
import { digest, type AdmissionScope } from "../../src/types";
import { openRepository } from "../../src/repository";
import type Database from "better-sqlite3";
// Explicit synthetic configuration used only by local legacy test fixtures.
export const testAdmissionScope: AdmissionScope = ["a".repeat(32), "application", null, "2020-01-01T00:00:00.000Z", "2035-01-01T00:00:00.000Z"];
export function openTestRepository(path: string, clock = { now: () => new Date("2026-10-09T10:00:00.000Z") }, options: Parameters<typeof openRepository>[2] = {}) {
  if (process.env.NODE_ENV !== "test") throw new Error("TEST_ONLY");
  return openRepository(path, clock, { admissionScope: { currentScope: () => testAdmissionScope }, ...options });
}
// Produce actual pre7 schemas for existing historical-migration regressions.
export function removeTask10Schema(db: Database.Database): void {
  db.exec("DROP TABLE deletion_diagnostics; DROP TABLE deletion_searches; DROP TABLE deletion_events; DROP TABLE deletion_state; DROP TABLE deletion_progress; DROP INDEX deletion_due; DROP TABLE journal_fences; DROP TABLE journal_facts; DROP TABLE journal_projection; DROP TRIGGER case_acceptance_epoch_immutable; ALTER TABLE cases DROP COLUMN acceptanceEpochId;");
}
// Unrelated capacity/custody regressions use independent local quota subjects.
// Application identity remains the original sessionHash/idempotencyKey.
export function testAdmission() {
  if (process.env.NODE_ENV !== "test") throw new Error("TEST_ONLY");
  return { abuse: { sessionKey: digest(randomBytes(32).toString("hex")), ipKey: digest(randomBytes(32).toString("hex")) }, submission: { kind: "application" as const } };
}
export const testReadiness = { getIntakeReadiness: () => ({ ready: true }) };
