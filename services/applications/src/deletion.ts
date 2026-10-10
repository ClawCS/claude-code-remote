import { KeyObject, randomBytes } from "node:crypto";
import { createMailboxRunBudget } from "./imap";
import { admissionScopeAccepts, copyAssociation, registrationAssociation, sameDeletionScope, snapshotDeletionScope } from "./deletion-association";
import { deletionOwner } from "./deletion-repository";
import { decodeJournalEvent, encodeJournalEvent } from "./ledger-contract";
import { berlinDate, deletionEligibility } from "./lifecycle";
import type { ApplicationRepository, DeletionCaseResult, DeletionDependencies, DeletionReason, DeletionReport, DeleteResult, MailboxJournalEvent, MailboxPort, MailboxSearch, RegisteredMail, VerifiedCopy } from "./types";

const ISSUES = ["INVALID_IDENTITY", "DEPENDENCY_UNAVAILABLE", "CONNECTION_FAILED", "OPERATION_TIMEOUT", "PROTOCOL_LIMIT", "LIST_LIMIT", "FOLDER_UNAVAILABLE", "CANDIDATE_LIMIT", "INCOMPLETE_CONTENT", "CONTENT_MISMATCH", "UIDVALIDITY_CHANGED", "UNSAFE_DELETE_CAPABILITY", "WRITE_UNAVAILABLE", "IDENTITY_CHANGED", "DELETE_UNCERTAIN"] as const;
const CONTRADICTIONS = ["INVALID_IDENTITY", "CONTENT_MISMATCH", "IDENTITY_CHANGED"];
interface RetainedRun {
  runId: string; report: Promise<DeletionReport>; work: Promise<void>;
  results: DeletionCaseResult[]; hasMore: boolean; expired: boolean; reported: boolean;
}
const runs = new WeakMap<ApplicationRepository, RetainedRun>();
class Stop extends Error {
  constructor(readonly reason: DeletionReason, readonly status: DeletionCaseResult["status"] = "blocked") { super(reason); }
}
const id = () => randomBytes(16).toString("hex");
function exact(value: unknown, keys: readonly string[]): void {
  if (!value || typeof value !== "object" || Array.isArray(value) || Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) throw new Stop("INVALID_EVIDENCE");
}
function keys(deps: DeletionDependencies, mail: RegisteredMail): string {
  const values = deps.verificationKeys();
  if (!(values instanceof Map) || !values.has(mail.keyId)) throw new Stop("AUTHORITY_UNAVAILABLE");
  const snapshot: [string, string][] = [];
  for (const [name, key] of values) {
    if (typeof name !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(name) || !(key instanceof KeyObject) || key.type !== "secret" || key.symmetricKeySize !== 32) throw new Stop("AUTHORITY_UNAVAILABLE");
    snapshot.push([name, key.export().toString("hex")]);
  }
  return JSON.stringify(snapshot.sort(([a], [b]) => a.localeCompare(b)));
}
export function hasRetainedDeletion(repository: ApplicationRepository): boolean { return runs.has(repository); }
export async function awaitDeletionSettlement(repository: ApplicationRepository): Promise<void> { await runs.get(repository)?.work; }

export function runDeletionOnce(deps: DeletionDependencies): Promise<DeletionReport> {
  const retained = runs.get(deps.repository); if (retained) return retained.report;
  let deliver!: (report: DeletionReport) => void;
  const slot: RetainedRun = { runId: "", report: new Promise(resolve => { deliver = resolve; }), work: Promise.resolve(), results: [], hasMore: false, expired: false, reported: false };
  // Install before any event ID, budget, enumeration, adapter or await.
  runs.set(deps.repository, slot);
  slot.runId = id(); const budget = createMailboxRunBudget(); let rounds = 0;
  let monoHigh = -Infinity, wallHigh = -Infinity, deadline = Infinity, timer: ReturnType<typeof setTimeout> | undefined;
  function time() {
    const wall = deps.clock.wallNow(), mono = deps.clock.monotonicNow(), value = wall.getTime();
    if (!Number.isFinite(value) || !Number.isFinite(mono) || mono < 0 || mono < monoHigh || value < wallHigh || !/^\d{4}-/.test(wall.toISOString())) throw new Stop("CONTEXT_CHANGED");
    monoHigh = mono; wallHigh = value; return { mono, wall: wall.toISOString() };
  }
  function report(ownership: "settled" | "retained", stopReason: DeletionReport["stopReason"]) {
    if (slot.reported) return; slot.reported = true;
    const cases = Object.freeze(slot.results.map(result => Object.freeze({ ...result })));
    deliver(Object.freeze({ runId: slot.runId, ownership, stopReason, hasMore: slot.hasMore || cases.some(result => result.status !== "mailbox_cleared" && result.status !== "not_due"), cases }));
  }
  function expire() { slot.expired = true; report("retained", "deadline"); }
  function timerAt(value: number) { clearTimeout(timer); deadline = value; timer = setTimeout(expire, Math.max(0, value - time().mono)); }
  function reserve(ms = 0) {
    const current = time(); if (current.mono >= deadline) expire();
    if (slot.expired || deadline - current.mono < ms) throw new Stop("DEFERRED"); return current;
  }
  async function work() {
    const runDeadline = time().mono + 900000; timerAt(runDeadline);
    const owner = deletionOwner(deps.repository), selected = owner.listWork(); slot.hasMore = selected.hasMore;
    slot.results = selected.ids.map(value => ({ id: value, status: "blocked", reason: "DEFERRED", externalCopiesConfirmed: false }));
    for (let index = 0; index < selected.ids.length; index++) {
      reserve(); if (rounds >= 3) break;
      const caseId = selected.ids[index];
      await deps.repository.withCaseLock(caseId, async () => {
        let mailbox: MailboxPort | undefined;
        let result: DeletionCaseResult = slot.results[index];
        try {
          reserve(); timerAt(Math.min(runDeadline, time().mono + 600000)); owner.start(caseId);
          const initial = owner.snapshot(caseId); result = { ...result, externalCopiesConfirmed: initial.row.lifecycle.externalCopiesConfirmed };
          const journal = owner.journal; if (!journal) throw new Stop("JOURNAL_UNAVAILABLE");
          const scope = snapshotDeletionScope(deps.scope?.currentScope()), mail = initial.delivery.registered;
          if (!mail || !initial.row.acceptanceEpochId) throw new Stop("AUTHORITY_UNAVAILABLE");
          const epoch = initial.row.acceptanceEpochId, approved = scope.approvedScopes.find(s => s[0] === epoch);
          if (!approved || !admissionScopeAccepts(approved, initial.row.submission, initial.row.acceptedAt)) throw new Stop("AUTHORITY_UNAVAILABLE");
          const registration = registrationAssociation(scope, epoch, mail), key = keys(deps, mail);
          const binding = (row: typeof initial.row) => JSON.stringify([row.version, row.lifecycle.safetyRevision, row.lifecycle.authorityKind, row.lifecycle.authorityId, row.lifecycle.pendingEventId, row.acceptedAt, row.acceptanceEpochId, row.submission, row.caseState, row.closedOn, row.lifecycle.hold, row.lifecycle.deadline, row.lifecycle.deleteFrom]);
          const baseline = binding(initial.row);
          function check(requireAuthority = true) {
            const current = reserve(), fresh = owner.snapshot(caseId), row = fresh.row;
            const eligibility = deletionEligibility(row, berlinDate(new Date(current.wall)));
            if (eligibility !== "eligible") throw new Stop("AUTHORITY_UNAVAILABLE", eligibility);
            if (row.claimToken || row.claimOwner || row.claimedAt || row.claimKind || fresh.contradictory) throw new Stop("AUTHORITY_UNAVAILABLE");
            if (binding(row) !== baseline || !fresh.delivery.registered || registrationAssociation(scope, epoch, fresh.delivery.registered) !== registration || keys(deps, fresh.delivery.registered) !== key || !sameDeletionScope(scope, snapshotDeletionScope(deps.scope?.currentScope()))) throw new Stop("CONTEXT_CHANGED");
            if (requireAuthority) {
              const proof = journal!.caseAuthority(caseId), cursor = proof ? JSON.parse(proof.head.cursor) : null;
              if (!proof || cursor[1] !== scope.ledgerId || cursor[2] !== scope.historyEpoch || (row.lifecycle.authorityKind === "initial" ? proof.latestFence !== null : proof.latestFence?.eventId !== row.lifecycle.authorityId)) throw new Stop("AUTHORITY_UNAVAILABLE");
            }
            return fresh;
          }
          async function freshness() {
            check(false);
            if (!journal!.observation()) { reserve(55000); const refreshed = await journal!.refresh("refresh"); reserve(); if (refreshed.kind !== "observed") throw new Stop("JOURNAL_UNAVAILABLE"); }
            check();
          }
          const pending = owner.pending(caseId);
          if (pending) {
            // Recover only exact safety facts, never old IMAP commands or business
            // decisions. A later separately scheduled run plans fresh discovery.
            reserve(55000); const progress = await journal.recover(pending); reserve();
            if (progress.kind !== "observed") throw new Stop("JOURNAL_UNAVAILABLE");
            reserve(55000); const receipt = await journal.append(pending); owner.acknowledge(caseId, pending, receipt); reserve();
            throw new Stop("DEFERRED");
          }
          await freshness();
          const event = <K extends MailboxJournalEvent[3]>(kind: K, payload: Extract<MailboxJournalEvent, readonly [string, string, string, K, unknown]>[4]): MailboxJournalEvent => decodeJournalEvent(encodeJournalEvent(["tj-journal-event-v1", id(), time().wall, kind, payload] as MailboxJournalEvent)) as MailboxJournalEvent;
          async function append(phase: MailboxJournalEvent) {
            check(); reserve(55000); owner.prepare(caseId, phase); check(); reserve(55000);
            const receipt = await journal!.append(phase); owner.acknowledge(caseId, phase, receipt); check();
          }
          const intent = event("attempt_intent", [caseId, slot.runId, initial.row.lifecycle.authorityKind!, initial.row.lifecycle.authorityId!, String(initial.row.version), epoch, scope.associationKeyId, registration]);
          await append(intent); check(); mailbox = deps.createMailbox(budget);
          let hadMutation = false;
          while (rounds < 3) {
            reserve(160000); await freshness(); check();
            const startedAt = reserve(160000).wall, round = String(++rounds) as "1" | "2" | "3";
            const found: MailboxSearch = await mailbox.findVerified(mail), finishedAt = time().wall;
            // Preserve bounded observed facts even after expiry. Never use them
            // to start a new external effect in an expired invocation.
            exact(found, ["copies", "complete", "issues"]);
            if (typeof found.complete !== "boolean" || !Array.isArray(found.copies) || found.copies.length > 20 || Object.keys(found.copies).length !== found.copies.length || !Array.isArray(found.issues) || found.issues.length > 15 || Object.keys(found.issues).length !== found.issues.length || found.issues.some(issue => !ISSUES.includes(issue))) throw new Stop("INVALID_EVIDENCE");
            const seen = new Set<string>(), folders = new Map<string, string>();
            const copies: VerifiedCopy[] = found.copies.map(copy => {
              const association = copyAssociation(scope, registration, copy);
              if (copy.fingerprint !== mail.fingerprint || seen.has(association) || (folders.has(copy.mailbox) && folders.get(copy.mailbox) !== copy.uidValidity)) throw new Stop("INVALID_EVIDENCE");
              seen.add(association); folders.set(copy.mailbox, copy.uidValidity); return { ...copy };
            });
            const issues = [...new Set(found.issues)]; owner.search(caseId, intent[1], round, startedAt, finishedAt, found.complete, issues, [...seen]); check(false);
            if (!found.complete || issues.length) throw new Stop(issues[0] ?? "INVALID_EVIDENCE", issues.some(issue => CONTRADICTIONS.includes(issue)) ? "blocked" : "partial");
            await freshness();
            if (!copies.length) {
              const clear = event("mailbox_clear_observed", [caseId, intent[1], round, startedAt, finishedAt, "listed-selectable-v1"]);
              await append(clear); check(); owner.clear(caseId, clear[1]); result = { ...result, status: "mailbox_cleared", reason: null }; return;
            }
            for (const copy of copies) {
              reserve(250000); await freshness();
              const marker = event("copy_mutation_started", [caseId, intent[1], round, copyAssociation(scope, registration, copy)]);
              await append(marker); check();
              let outcome: DeleteResult;
              try { outcome = await mailbox.deleteVerified(copy, mail); } catch { throw new Stop("ORCHESTRATION_FAILED"); }
              exact(outcome, outcome?.kind === "deleted" || outcome?.kind === "not-found" ? ["kind"] : ["kind", "issue"]);
              const completed = event("copy_result", [caseId, marker[1], outcome.kind, "issue" in outcome ? outcome.issue : null] as Extract<MailboxJournalEvent, readonly [string, string, string, "copy_result", unknown]>[4]);
              owner.prepare(caseId, completed); // Exact observed result before another possible mutation, including late return.
              if ("issue" in outcome && CONTRADICTIONS.includes(outcome.issue)) owner.diagnostic(caseId, outcome.issue);
              check(false); await freshness(); reserve(55000);
              const receipt = await journal.append(completed); owner.acknowledge(caseId, completed, receipt); check();
              if (outcome.kind === "deleted") hadMutation = true;
              else if (outcome.kind === "not-found") break;
              else throw new Stop(outcome.issue, CONTRADICTIONS.includes(outcome.issue) ? "blocked" : "partial");
            }
            result = { ...result, status: "partial", reason: hadMutation ? "DEFERRED" : "INVALID_EVIDENCE" };
          }
          if (result.status === "partial") owner.diagnostic(caseId, result.reason!, "partial");
        } catch (error) {
          const stopped = error instanceof Stop ? error : new Stop("ORCHESTRATION_FAILED");
          result = { ...result, status: stopped.status, reason: stopped.reason };
          try { owner.diagnostic(caseId, stopped.reason, stopped.status === "partial" ? "partial" : "blocked"); } catch { result = { ...result, status: "blocked", reason: "STORAGE_FAILED" }; }
        } finally {
          // Timed reports do not settle this callback. Actual admitted network,
          // replay and cleanup owners keep the original case guard alive.
          if (!slot.reported) slot.results[index] = result;
          try { if (mailbox) await mailbox.disconnect(); } catch { /* Stop request is not settlement. */ }
          const settled = await Promise.allSettled([Promise.resolve().then(() => mailbox?.settle()), Promise.resolve().then(() => owner.journal?.settle())]);
          if (settled.some(value => value.status === "rejected")) {
            if (!slot.reported) slot.results[index] = { ...result, status: "blocked", reason: "ORCHESTRATION_FAILED" };
            throw new Stop("ORCHESTRATION_FAILED");
          }
        }
      });
      reserve(); timerAt(runDeadline);
    }
  }
  slot.work = Promise.resolve().then(work).catch(() => { if (!slot.expired) report("settled", "blocked"); }).then(() => {
    clearTimeout(timer); if (!slot.reported) report("settled", slot.expired ? "deadline" : "finished");
    if (runs.get(deps.repository) === slot) runs.delete(deps.repository);
  });
  return slot.report;
}
