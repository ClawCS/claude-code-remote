import type Database from "better-sqlite3";
import { createHash, randomBytes } from "node:crypto";
import { decodeJournalEvent, encodeJournalEvent } from "./ledger-contract";
import { berlinDate } from "./lifecycle";
import { applicationId, utcInstant, type ApplicationId, type ApplicationRepository, type CaseRecord, type CurrentMailboxClear, type DeletionReason, type DeliveryRecord, type DurableReceipt, type JournalEvent, type MailboxJournalEvent, type SafetyJournal } from "./types";

type Phase = { eventId: string; caseId: ApplicationId; event: string; phase: "proposed" | "acknowledged"; entry: DurableReceipt["entry"] | null; head: DurableReceipt["head"] | null };
const owners = new WeakMap<ApplicationRepository, ReturnType<typeof createDeletionRepository>>();
export function bindDeletionOwner(repository: ApplicationRepository, owner: ReturnType<typeof createDeletionRepository>): void { if (owners.has(repository)) throw new Error("DELETION_ALREADY_OWNED"); owners.set(repository, owner); }
export function deletionOwner(repository: ApplicationRepository) { const owner = owners.get(repository); if (!owner) throw new Error("DELETION_UNAVAILABLE"); return owner; }
const contradictory = ["INVALID_IDENTITY", "CONTENT_MISMATCH", "IDENTITY_CHANGED"];
function fail(): never { throw new Error("DELETION_STORAGE_INVALID"); }
export function createDeletionRepository(db: Database.Database, readCase: (id: ApplicationId) => CaseRecord, getDelivery: (id: ApplicationId) => DeliveryRecord, guard: (id: ApplicationId) => void, journal: SafetyJournal | undefined, now: () => string) {
  function isContradictoryResult(event: JournalEvent): boolean {
    return event[3] === "copy_result" && event[4][2] === "mismatch" && contradictory.includes(event[4][3]);
  }
  function latchContradiction(id: ApplicationId): void {
    db.prepare("INSERT INTO deletion_state(caseId,contradictory,status) VALUES(?,1,'blocked') ON CONFLICT(caseId) DO UPDATE SET contradictory=1,status='blocked',clearEventId=NULL,clearVersion=NULL,clearSafetyRevision=NULL").run(id);
  }
  function phase(eventId: string): Phase {
    const p = db.prepare("SELECT * FROM deletion_events WHERE eventId=?").get(eventId) as Phase | undefined;
    if (!p || !["proposed", "acknowledged"].includes(p.phase)) fail(); const event = decodeJournalEvent(p.event);
    if (event[1] !== p.eventId || !["attempt_intent", "copy_mutation_started", "copy_result", "mailbox_clear_observed"].includes(event[3]) || event[4][0] !== p.caseId) fail();
    return p;
  }
  function predecessor(id: ApplicationId, eventId: string, kind: JournalEvent[3]): JournalEvent {
    const p = phase(eventId), event = decodeJournalEvent(p.event);
    if (p.caseId !== id || p.phase !== "acknowledged" || event[3] !== kind) fail(); return event;
  }
  function contradictoryEvidence(id: ApplicationId): { restricted: boolean; needsLatch: boolean } {
    const state = db.prepare("SELECT contradictory FROM deletion_state WHERE caseId=?").get(id) as { contradictory: number } | undefined;
    if (state && ![0, 1].includes(state.contradictory)) fail();
    let restricted = state?.contradictory === 1;
    if (!restricted) {
      // Older proposed/acknowledged outcomes may predate the atomic latch.
      // The partial index bounds this conservative evidence lookup by case.
      const found = db.prepare("SELECT eventId FROM deletion_events WHERE caseId=? AND json_extract(event,'$[3]')='copy_result' AND json_extract(event,'$[4][2]')='mismatch' AND json_extract(event,'$[4][3]') IN ('INVALID_IDENTITY','CONTENT_MISMATCH','IDENTITY_CHANGED') LIMIT 1").get(id) as { eventId: string } | undefined;
      if (found) {
        const evidence = phase(found.eventId);
        if (evidence.caseId !== id || !isContradictoryResult(decodeJournalEvent(evidence.event))) fail();
        restricted = true;
      }
    }
    return { restricted, needsLatch: restricted && state?.contradictory !== 1 };
  }
  function snapshot(id: ApplicationId) {
    guard(id); const row = readCase(id), delivery = getDelivery(id), { restricted, needsLatch } = contradictoryEvidence(id);
    if (needsLatch) latchContradiction(id);
    return { row, delivery, contradictory: restricted };
  }
  function readPending(id: ApplicationId): MailboxJournalEvent | null {
    const p = db.prepare("SELECT eventId FROM deletion_events WHERE caseId=? AND phase='proposed' LIMIT 2").all(id) as { eventId: string }[];
    if (p.length > 1) fail(); return p.length ? decodeJournalEvent(phase(p[0].eventId).event) as MailboxJournalEvent : null;
  }
  function pending(id: ApplicationId): MailboxJournalEvent | null { guard(id); return readPending(id); }
  function prepare(id: ApplicationId, event: MailboxJournalEvent): void {
    guard(id); const wire = encodeJournalEvent(event); if (event[4][0] !== id) fail();
    db.transaction(() => {
      if (pending(id)) fail();
      if (event[3] === "attempt_intent") {
        const row = readCase(id), p = event[4];
        if (row.version !== Number(p[4]) || row.lifecycle.authorityKind !== p[2] || row.lifecycle.authorityId !== p[3] || row.acceptanceEpochId !== p[5]) fail();
      } else if (event[3] === "copy_result") {
        predecessor(id, event[4][1], "copy_mutation_started");
        const duplicate = db.prepare("SELECT 1 FROM deletion_events WHERE resultFor=?").get(event[4][1]); if (duplicate) fail();
      } else {
        predecessor(id, event[4][1], "attempt_intent");
        if (event[3] === "mailbox_clear_observed") {
          const search = db.prepare("SELECT * FROM deletion_searches WHERE attemptId=? AND round=?").get(event[4][1], event[4][2]) as { complete: number; issues: string; associations: string; startedAt: string; finishedAt: string } | undefined;
          if (!search || !search.complete || search.issues !== "[]" || search.associations !== "[]" || search.startedAt !== event[4][3] || search.finishedAt !== event[4][4] || snapshot(id).contradictory) fail();
        }
      }
      db.prepare("INSERT INTO deletion_events(eventId,caseId,event,resultFor,phase) VALUES(?,?,?,?,'proposed')").run(event[1], id, wire, event[3] === "copy_result" ? event[4][1] : null);
      if (isContradictoryResult(event)) latchContradiction(id);
    }).immediate();
  }
  function checkedReceipt(p: Phase, event: MailboxJournalEvent, receipt: DurableReceipt): void {
    if (typeof receipt.entry !== "string" || typeof receipt.head !== "string" || Buffer.byteLength(receipt.entry) > 4096 || Buffer.byteLength(receipt.head) > 1024 || Buffer.byteLength(JSON.stringify([receipt.entry, receipt.head])) > 6144) fail();
    let e: unknown,h: unknown;try{e=JSON.parse(receipt.entry);h=JSON.parse(receipt.head);}catch{fail();}
    if(!Array.isArray(e)||!Array.isArray(h)||e.length!==2||h.length!==2||!Array.isArray(e[0])||!Array.isArray(h[0])||e[0].length!==8||h[0].length!==9||typeof e[1]!=="string"||typeof h[1]!=="string"||!/^[A-Za-z0-9_-]{86}$/.test(e[1])||!/^[A-Za-z0-9_-]{86}$/.test(h[1]))fail();
    const fact = db.prepare("SELECT f.sequence,f.entryHash,f.event,p.ledgerId,p.historyEpoch FROM journal_facts f JOIN journal_projection p ON p.pass=f.pass WHERE p.singleton=1 AND f.eventId=?").get(event[1]) as { sequence: string; entryHash: string; event: string; ledgerId: string; historyEpoch: string } | undefined;
    if (!fact || JSON.stringify(e) !== receipt.entry || JSON.stringify(h) !== receipt.head || e[0]?.[0] !== "tj-journal-entry-v1" || h[0]?.[0] !== "tj-journal-head-v1" || encodeJournalEvent(e[0][7]) !== p.event || fact.event !== p.event || e[0][4] !== fact.sequence || h[0][4] !== fact.sequence || h[0][5] !== fact.entryHash || h[0][6] !== event[1] || h[0][7] !== event[2] || e[0][1] !== h[0][1] || e[0][2] !== h[0][2]) fail();
    if (e[0][1] !== fact.ledgerId || e[0][2] !== fact.historyEpoch || createHash("sha256").update("tj-journal-entry-hash-v1\n" + JSON.stringify(e[0])).digest("hex") !== fact.entryHash) fail();
  }
  function acknowledge(id: ApplicationId, event: MailboxJournalEvent, receipt: DurableReceipt): void {
    guard(id); const p = phase(event[1]); if (p.caseId !== id || p.event !== encodeJournalEvent(event)) fail();
    checkedReceipt(p, event, receipt);
    db.transaction(() => {
      if (p.phase === "acknowledged") { if (p.entry !== receipt.entry || p.head !== receipt.head) fail(); }
      else db.prepare("UPDATE deletion_events SET phase='acknowledged',entry=?,head=? WHERE eventId=? AND phase='proposed'").run(receipt.entry, receipt.head, event[1]);
      if (isContradictoryResult(event)) latchContradiction(id);
    }).immediate();
  }
  function validatedClear(id: ApplicationId, current: { row: CaseRecord; contradictory: boolean }): CurrentMailboxClear | null {
    const state = db.prepare("SELECT status,clearEventId,clearVersion,clearSafetyRevision FROM deletion_state WHERE caseId=?").get(id) as { status: string; clearEventId: string | null; clearVersion: number | null; clearSafetyRevision: number | null } | undefined;
    if (state && !["open", "partial", "blocked", "mailbox_cleared"].includes(state.status)) fail();
    if (!state || state.status !== "mailbox_cleared" || current.contradictory || !state.clearEventId || state.clearVersion !== current.row.version || state.clearSafetyRevision !== current.row.lifecycle.safetyRevision || readPending(id)) return null;
    const clear = phase(state.clearEventId), clearEvent = decodeJournalEvent(clear.event);
    if (clear.caseId !== id || clear.phase !== "acknowledged" || clearEvent[3] !== "mailbox_clear_observed" || !clear.entry || !clear.head) fail();
    const intent = phase(clearEvent[4][1]), intentEvent = decodeJournalEvent(intent.event);
    if (intent.caseId !== id || intent.phase !== "acknowledged" || intentEvent[3] !== "attempt_intent" || !intent.entry || !intent.head) fail();
    const clearReceipt = Object.freeze({ entry: clear.entry, head: clear.head }), intentReceipt = Object.freeze({ entry: intent.entry, head: intent.head });
    checkedReceipt(clear, clearEvent, clearReceipt); checkedReceipt(intent, intentEvent, intentReceipt);
    const authority = journal?.caseAuthority(id), payload = intentEvent[4], row = current.row;
    if (!authority || payload[2] !== row.lifecycle.authorityKind || payload[3] !== row.lifecycle.authorityId || Number(payload[4]) !== row.version || payload[5] !== row.acceptanceEpochId || (payload[2] === "initial" ? authority.latestFence !== null : authority.latestFence?.eventId !== payload[3])) return null;
    return Object.freeze({ caseId: id, caseVersion: row.version, safetyRevision: row.lifecycle.safetyRevision, head: Object.freeze({ ...authority.head }), clearEvent, clearReceipt, intentEvent, intentReceipt });
  }
  function currentClear(id: ApplicationId): CurrentMailboxClear | null { return validatedClear(id, snapshot(id)); }
  function adminMailbox(row: CaseRecord): import("./types").AdminCaseDetail["mailbox"] {
    const state = db.prepare("SELECT status FROM deletion_state WHERE caseId=?").get(row.id) as { status: string } | undefined;
    if (state && !["open", "partial", "blocked", "mailbox_cleared"].includes(state.status)) fail();
    const { restricted: contradictory } = contradictoryEvidence(row.id), outstanding = readPending(row.id);
    if (contradictory) return Object.freeze({ state: "blocked" });
    if (!state) { if (outstanding) fail(); return Object.freeze({ state: "not_observed" }); }
    if (state.status === "blocked" || state.status === "partial") return Object.freeze({ state: state.status });
    return Object.freeze({ state: validatedClear(row.id, { row, contradictory }) ? "currently_cleared" : "open" });
  }
  const selector = `FROM cases c JOIN case_lifecycle l ON l.caseId=c.id LEFT JOIN deletion_state d ON d.caseId=c.id WHERE l.deleteFrom IS NOT NULL AND l.deleteFrom<=? AND (d.clearVersion IS NULL OR d.clearVersion!=c.version OR d.clearSafetyRevision!=l.safetyRevision) AND COALESCE(d.selectedCycle,0)<?`;
  return Object.freeze({
    journal, snapshot, pending, prepare, acknowledge, currentClear, adminMailbox,
    listWork() {
      const today = berlinDate(new Date(now()));
      return db.transaction(() => {
        let cycle = (db.prepare("SELECT cycle FROM deletion_progress WHERE singleton=1").get() as { cycle: number }).cycle;
        const select = () => db.prepare(`SELECT c.id ${selector} ORDER BY l.deleteFrom,COALESCE(d.lastAttempt,''),c.id LIMIT 20`).all(today, cycle) as { id: ApplicationId }[];
        let rows = select();
        if (!rows.length) { if (!Number.isSafeInteger(cycle + 1)) fail(); cycle++; db.prepare("UPDATE deletion_progress SET cycle=? WHERE singleton=1").run(cycle); rows = select(); }
        for (const { id } of rows) { applicationId(id); db.prepare("INSERT INTO deletion_state(caseId,selectedCycle) VALUES(?,?) ON CONFLICT(caseId) DO UPDATE SET selectedCycle=excluded.selectedCycle").run(id, cycle); }
        const hasMore = !!db.prepare(`SELECT 1 ${selector} LIMIT 1`).get(today, cycle);
        return { ids: rows.map(row => row.id), hasMore };
      }).immediate();
    },
    start(id: ApplicationId) { guard(id); db.prepare("UPDATE deletion_state SET lastAttempt=? WHERE caseId=?").run(utcInstant(now()), id); },
    search(id: ApplicationId, attemptId: string, round: "1" | "2" | "3", startedAt: string, finishedAt: string, complete: boolean, issues: readonly string[], associations: readonly string[]) {
      guard(id); predecessor(id, attemptId, "attempt_intent"); utcInstant(startedAt); utcInstant(finishedAt);
      if (startedAt > finishedAt || issues.length > 15 || associations.length > 20 || associations.some(value => !/^[a-f0-9]{64}$/.test(value))) fail();
      db.transaction(() => {
        db.prepare("INSERT INTO deletion_searches VALUES(?,?,?,?,?,?,?,?)").run(attemptId, round, startedAt, finishedAt, new Date(Date.parse(finishedAt) + 30 * 86400000).toISOString(), Number(complete), JSON.stringify(issues), JSON.stringify(associations));
        if (issues.some(code => contradictory.includes(code))) db.prepare("UPDATE deletion_state SET contradictory=1,status='blocked' WHERE caseId=?").run(id);
      }).immediate();
    },
    diagnostic(id: ApplicationId, code: DeletionReason, status: "blocked" | "partial" = "blocked") {
      guard(id); const at = utcInstant(now());
      db.transaction(() => {
        db.prepare("INSERT INTO deletion_diagnostics VALUES(?,?,?,?,?)").run(randomBytes(16).toString("hex"), id, code, at, new Date(Date.parse(at) + 30 * 86400000).toISOString());
        db.prepare("UPDATE deletion_state SET status=?,contradictory=MAX(contradictory,?) WHERE caseId=?").run(contradictory.includes(code) ? "blocked" : status, Number(contradictory.includes(code)), id);
      }).immediate();
    },
    clear(id: ApplicationId, eventId: string) {
      guard(id); const row = snapshot(id); predecessor(id, eventId, "mailbox_clear_observed"); if (row.contradictory) fail();
      db.prepare("UPDATE deletion_state SET status='mailbox_cleared',clearEventId=?,clearVersion=?,clearSafetyRevision=? WHERE caseId=?").run(eventId, row.row.version, row.row.lifecycle.safetyRevision, id);
    },
  });
}
