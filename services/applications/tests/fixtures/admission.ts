import { randomBytes } from "node:crypto";
import { digest, type AdmissionScope, type ApplicationRepository, type SafetyJournal } from "../../src/types";
import { openRepository } from "../../src/repository";
import { createSafetyJournal } from "../../src/ledger";
import { syntheticJournal } from "./ledger";
import type Database from "better-sqlite3";
// Explicit synthetic configuration used only by local legacy test fixtures.
export const testAdmissionScope: AdmissionScope = ["a".repeat(32), "application", null, "2020-01-01T00:00:00.000Z", "2035-01-01T00:00:00.000Z"];
const journals=new WeakMap<ApplicationRepository,SafetyJournal>();
export function openTestRepository(path: string, clock = { now: () => new Date("2026-10-09T10:00:00.000Z") }, options: Parameters<typeof openRepository>[2] = {}) {
  if (process.env.NODE_ENV !== "test") throw new Error("TEST_ONLY");
  const fixture=syntheticJournal();let journal!:SafetyJournal;
  const repo=openRepository(path, clock, { admissionScope: { currentScope: () => testAdmissionScope },deletionScope:{currentScope:()=>({ledgerId:fixture.context.ledgerId,historyEpoch:fixture.context.historyEpoch,associationKeyId:"fixture-erasure",associationKey:Buffer.alloc(32,17),approvedScopes:[testAdmissionScope]})},...options,
    journalFactory:projection=>journal=options.journalFactory?options.journalFactory(projection):createSafetyJournal({port:fixture.port,trust:{currentContext:()=>fixture.context},clock:{wallNow:()=>clock.now(),monotonicNow:()=>Date.now()},projection}),
  });journals.set(repo,journal);return repo;
}
export async function refreshTestRepository(repo:ApplicationRepository):Promise<void>{
  const journal=journals.get(repo);if(!journal)throw new Error("FIXTURE_JOURNAL_REQUIRED");
  const result=await journal.refresh("startup");if(result.kind!=="observed")throw new Error("FIXTURE_JOURNAL_INCOMPLETE");
}
export async function openReadyTestRepository(...args:Parameters<typeof openTestRepository>){
  const repo=openTestRepository(...args);try{await refreshTestRepository(repo);return repo;}catch(error){repo.close();throw error;}
}
export function removeTask11Schema(db:Database.Database):void{
  removeTask11B1Schema(db);
  db.exec("DROP INDEX erasure_positive_audit;DROP INDEX erasure_invalidated_audit;");
  db.exec("DROP TABLE erasure_manifests;DROP TABLE erasure_inventory_objects;DROP TABLE erasure_inventory_journals;DROP TABLE erasure_scans;DROP TABLE erasure_safety_carry;DROP TABLE erasure_maintenance;DROP TABLE erasure_progress;DROP TABLE erasure_scopes;DROP TABLE erasure_obligations;DROP TABLE erasure_replay;DROP TABLE erasure_events;DROP INDEX erasure_status_proofs;DROP INDEX erasure_audit;DROP INDEX erasure_grants;DROP INDEX erasure_lifecycle_audit;DROP INDEX erasure_lifecycle_proposals;DROP INDEX erasure_mail_events;DROP INDEX erasure_diagnostics;DROP INDEX erasure_reservations;");
}
export function removeTask11B1Schema(db: Database.Database): void {
  removeTask11B1bNSchema(db);
  db.exec("DROP INDEX erasure_inventory_case; DROP INDEX erasure_manifest_execution; DROP INDEX erasure_inventory_identity;");
  db.exec("DROP TABLE maintenance_pending_cursors; DROP TABLE maintenance_due_cursors; DROP TABLE maintenance_selectors; DROP INDEX maintenance_payload_due; DROP INDEX maintenance_contact_due; DROP INDEX maintenance_accepted_due; DROP INDEX maintenance_cleanup_due; DROP INDEX maintenance_invalid_due; DROP INDEX maintenance_proposed; DROP INDEX maintenance_completed; DROP INDEX maintenance_diagnostics_expiry; DROP INDEX maintenance_searches_expiry; DROP INDEX maintenance_auth_expiry;");
}
export function removeTask11B1bNSchema(db: Database.Database): void {
  db.exec("DROP TABLE cleanup_prune_cursors; DROP TABLE cleanup_maintenance; DROP TABLE cleanup_manifests; DROP INDEX cleanup_inventory_reservation; DROP INDEX cleanup_replay_winner; DROP INDEX erasure_manifest_inventory; DROP TRIGGER cleanup_source_monotonic; DROP TRIGGER cleanup_source_binding_immutable; DROP TRIGGER cleanup_disposition_immutable; DROP TRIGGER cleanup_disposition_valid;");
  db.exec("ALTER TABLE reservations DROP COLUMN cleanupWinner; ALTER TABLE reservations DROP COLUMN cleanupDomain; ALTER TABLE reservations DROP COLUMN cleanupGeneration; ALTER TABLE reservations DROP COLUMN cleanupDisposition; ALTER TABLE reservations DROP COLUMN custodyStarted;");
}
// Produce actual pre7 schemas for existing historical-migration regressions.
export function removeTask10Schema(db: Database.Database): void {
  removeTask11Schema(db);
  db.exec("DROP TABLE deletion_diagnostics; DROP TABLE deletion_searches; DROP TABLE deletion_events; DROP TABLE deletion_state; DROP TABLE deletion_progress; DROP INDEX deletion_due; DROP TABLE journal_fences; DROP TABLE journal_facts; DROP TABLE journal_projection; DROP TRIGGER case_acceptance_epoch_immutable; ALTER TABLE cases DROP COLUMN acceptanceEpochId;");
}
// Unrelated capacity/custody regressions use independent local quota subjects.
// Application identity remains the original sessionHash/idempotencyKey.
export function testAdmission() {
  if (process.env.NODE_ENV !== "test") throw new Error("TEST_ONLY");
  return { abuse: { sessionKey: digest(randomBytes(32).toString("hex")), ipKey: digest(randomBytes(32).toString("hex")) }, submission: { kind: "application" as const } };
}
export const testReadiness = { getIntakeReadiness: () => ({ ready: true }) };
