import type Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { decodeJournalEvent, encodeJournalEvent } from "./ledger-contract";
import { applicationId, type JournalCheckpoint, type JournalEvent, type JournalFenceFact, type JournalSafetyProjection } from "./types";

interface State extends JournalCheckpoint { pass: string; ledgerId: string; historyEpoch: string }
interface Fact { eventId: string; sequence: string; entryHash: string; event: string }
function fail(): never { throw new Error("JOURNAL_PROJECTION_UNAVAILABLE"); }
const sameHead = (a: JournalCheckpoint, b: JournalCheckpoint) => a.sequence === b.sequence && a.hash === b.hash && a.cursor === b.cursor && a.observedAt === b.observedAt;

/** Fixed synchronous sink of the sole original repository. No case guards,
 * business writes, network calls or restored-current shortcut are permitted. */
export function createJournalProjection(db: Database.Database): JournalSafetyProjection {
  const pass = randomBytes(16).toString("hex"); let begun = false;
  function state(): State {
    const value = db.prepare("SELECT * FROM journal_projection WHERE singleton=1 AND pass=?").get(pass) as State | undefined;
    if (!begun || !value) fail(); return value;
  }
  function latest(caseId: string): JournalFenceFact | null {
    const derived = db.prepare("SELECT eventId,sequence,entryHash FROM journal_fences WHERE pass=? AND caseId=?").get(pass, caseId) as JournalFenceFact | undefined;
    const fact = db.prepare("SELECT eventId,sequence,entryHash,event FROM journal_facts WHERE pass=? AND caseId=? AND kind='case_fence' ORDER BY length(sequence) DESC,sequence DESC LIMIT 1").get(pass, caseId) as Fact | undefined;
    if (!fact) { if (derived) fail(); return null; }
    const event = decodeJournalEvent(fact.event);
    if (!derived || event[3] !== "case_fence" || event[1] !== fact.eventId || event[4][0] !== caseId || derived.eventId !== fact.eventId || derived.sequence !== fact.sequence || derived.entryHash !== fact.entryHash || BigInt(fact.sequence) > BigInt(state().sequence)) fail();
    return derived;
  }
  function referenced(eventId: string, caseId: string, kind: JournalEvent[3]): JournalEvent {
    const fact = db.prepare("SELECT event FROM journal_facts WHERE pass=? AND eventId=? AND caseId=? AND kind=?").get(pass, eventId, caseId, kind) as { event: string } | undefined;
    if (!fact) fail(); return decodeJournalEvent(fact.event);
  }
  function authority(event: JournalEvent): void {
    if (event[3] !== "attempt_intent") fail();
    const p = event[4], fence = latest(p[0]);
    if (p[2] === "initial" ? fence !== null : fence?.eventId !== p[3]) fail();
  }
  return Object.freeze<JournalSafetyProjection>({
    beginProjection(anchor) {
      if (begun) fail(); begun = true;
      // A non-genesis anchor cannot authenticate the prior current-case base.
      let cursor: unknown;
      try { cursor = JSON.parse(anchor.cursor); } catch { fail(); }
      if (!Array.isArray(cursor) || cursor.length !== 5 || cursor[0] !== "tj-journal-cursor-v1" || cursor[3] !== "0" || anchor.receipt !== null || JSON.stringify(cursor) !== anchor.cursor || !/^[a-f0-9]{32}$/.test(cursor[1]) || !/^[a-f0-9]{32}$/.test(cursor[2]) || !/^[a-f0-9]{64}$/.test(cursor[4])) return;
      db.prepare("INSERT INTO journal_projection(singleton,pass,ledgerId,historyEpoch,sequence,hash,observedAt,cursor) VALUES(1,?,?,?,'0',?,NULL,?) ON CONFLICT(singleton) DO UPDATE SET pass=excluded.pass,ledgerId=excluded.ledgerId,historyEpoch=excluded.historyEpoch,sequence=excluded.sequence,hash=excluded.hash,observedAt=NULL,cursor=excluded.cursor").run(pass, cursor[1], cursor[2], cursor[4], anchor.cursor);
    },
    applyVerifiedEntry(previous, entry) {
      db.transaction(() => {
        const current = state(), event = decodeJournalEvent(encodeJournalEvent(entry.event)), wire = encodeJournalEvent(event);
        if (entry.sequence !== String(BigInt(previous.sequence) + BigInt(1)) || JSON.parse(entry.cursor)[1] !== current.ledgerId || JSON.parse(entry.cursor)[2] !== current.historyEpoch) fail();
        if (BigInt(entry.sequence) <= BigInt(current.sequence)) {
          const old = db.prepare("SELECT eventId,sequence,entryHash,event FROM journal_facts WHERE pass=? AND sequence=?").get(pass, entry.sequence) as Fact | undefined;
          if (!old || old.eventId !== event[1] || old.entryHash !== entry.hash || old.event !== wire) fail();
          return;
        }
        if (!sameHead(previous, current)) fail();
        let caseId: string | null = null, resultFor: string | null = null;
        if (event[3] !== "barrier") { caseId = applicationId(event[4][0]); }
        if (event[3] === "case_fence") {
          const old = latest(caseId!);
          if (old ? event[4][1] !== "fence" || event[4][2] !== old.eventId : event[4][1] !== "initial") fail();
          if (old) {
            const prior = referenced(old.eventId, caseId!, "case_fence");
            if (prior[3] !== "case_fence" || Number(event[4][3]) < Number(prior[4][3])) fail();
          }
          db.prepare("INSERT INTO journal_fences(pass,caseId,eventId,sequence,entryHash) VALUES(?,?,?,?,?) ON CONFLICT(pass,caseId) DO UPDATE SET eventId=excluded.eventId,sequence=excluded.sequence,entryHash=excluded.entryHash").run(pass, caseId, event[1], entry.sequence, entry.hash);
        } else if (event[3] === "attempt_intent") authority(event);
        else if (event[3] === "copy_mutation_started" || event[3] === "mailbox_clear_observed") authority(referenced(event[4][1], caseId!, "attempt_intent"));
        else if (event[3] === "copy_result") { referenced(event[4][1], caseId!, "copy_mutation_started"); resultFor = event[4][1]; }
        else if (event[3] === "erase_commit") {
          const payload = event[4];
          if (payload[1] === "identifying_register") {
            const clear = referenced(payload[7], caseId!, "mailbox_clear_observed");
            if (clear[3] !== "mailbox_clear_observed") fail();
            const intent = referenced(clear[4][1], caseId!, "attempt_intent"); authority(intent);
            if (intent[3] !== "attempt_intent" || intent[4][2] !== payload[4] || intent[4][3] !== payload[5] || intent[4][4] !== payload[6] || intent[4][6] !== payload[2]) fail();
            const clearFact = db.prepare("SELECT sequence FROM journal_facts WHERE pass=? AND eventId=?").get(pass, clear[1]) as { sequence: string };
            for (const kind of ["attempt_intent", "copy_mutation_started", "copy_result", "mailbox_clear_observed"]) {
              const later = db.prepare("SELECT sequence FROM journal_facts WHERE pass=? AND caseId=? AND kind=? ORDER BY length(sequence) DESC,sequence DESC LIMIT 1").get(pass, caseId, kind) as { sequence: string } | undefined;
              if (later && BigInt(later.sequence) > BigInt(clearFact.sequence)) fail();
            }
          }
          const values = { commitEventId: event[1], caseId, scope: payload[1], ledgerId: current.ledgerId, historyEpoch: current.historyEpoch, associationKeyId: payload[2], replayAssociation: payload[3], sequence: entry.sequence, entryHash: entry.hash };
          const old = db.prepare("SELECT * FROM erasure_obligations WHERE commitEventId=?").get(event[1]) as (typeof values & { inspectionGeneration: string }) | undefined;
          if (old) {
            if (Object.keys(values).some(key => old[key as keyof typeof values] !== values[key as keyof typeof values])) fail();
            if (old.inspectionGeneration !== pass) db.prepare("UPDATE erasure_obligations SET inspectionGeneration=?,stage='rows-pending',historicalDone=NULL WHERE commitEventId=?").run(pass, event[1]);
          } else db.prepare("INSERT INTO erasure_obligations(commitEventId,caseId,scope,ledgerId,historyEpoch,associationKeyId,replayAssociation,sequence,entryHash,inspectionGeneration) VALUES(@commitEventId,@caseId,@scope,@ledgerId,@historyEpoch,@associationKeyId,@replayAssociation,@sequence,@entryHash,@inspectionGeneration)").run({ ...values, inspectionGeneration: pass });
          db.prepare("INSERT INTO erasure_scopes(caseId,scope,eventId,committed) VALUES(?,?,?,1) ON CONFLICT(caseId,scope) DO UPDATE SET committed=1").run(caseId, payload[1], event[1]);
          db.prepare("INSERT INTO erasure_replay(ledgerId,historyEpoch,associationKeyId,replayAssociation,stagedEventId,committedEventId) VALUES(?,?,?,?,?,?) ON CONFLICT(ledgerId,historyEpoch,associationKeyId,replayAssociation) DO UPDATE SET committedEventId=COALESCE(committedEventId,excluded.committedEventId)").run(current.ledgerId, current.historyEpoch, payload[2], payload[3], event[1], event[1]);
        } else if (event[3] === "erase_done") {
          const committed = referenced(event[4][1], caseId!, "erase_commit");
          if (committed[3] !== "erase_commit") fail();
          const obligation = db.prepare("SELECT historicalDone FROM erasure_obligations WHERE commitEventId=? AND inspectionGeneration=? AND caseId=? AND ledgerId=? AND historyEpoch=?").get(committed[1], pass, caseId, current.ledgerId, current.historyEpoch) as { historicalDone: string | null } | undefined;
          if (!obligation || (obligation.historicalDone !== null && obligation.historicalDone !== event[1])) fail();
          db.prepare("UPDATE erasure_obligations SET historicalDone=? WHERE commitEventId=?").run(event[1], committed[1]);
        }
        db.prepare("INSERT INTO journal_facts(pass,eventId,sequence,entryHash,event,caseId,kind,resultFor) VALUES(?,?,?,?,?,?,?,?)").run(pass, event[1], entry.sequence, entry.hash, wire, caseId, event[3], resultFor);
        db.prepare("UPDATE journal_projection SET sequence=?,hash=?,observedAt=?,cursor=? WHERE singleton=1 AND pass=?").run(entry.sequence, entry.hash, entry.observedAt, entry.cursor, pass);
      }).immediate();
    },
    readCaseAuthority(caseId, expectedAppliedHead) {
      applicationId(caseId); if (!sameHead(state(), expectedAppliedHead)) fail();
      const fact = latest(caseId); return fact === null ? null : Object.freeze({ ...fact });
    },
  });
}
