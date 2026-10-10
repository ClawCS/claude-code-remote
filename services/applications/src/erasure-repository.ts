import type Database from "better-sqlite3";
import { createHash, randomBytes } from "node:crypto";
import { decodeJournalEvent, encodeJournalEvent } from "./ledger-contract";
import { admissionScopeAccepts, registrationAssociation } from "./deletion-association";
import { externalAttestationAssociation, replayAssociation } from "./erasure-association";
import { createErasureRowSelector } from "./erasure-storage";
import { berlinDate, operatorReason } from "./lifecycle";
import { applicationId, staffId, utcInstant, type ApplicationId, type ApplicationRepository, type CaseRecord, type CurrentExternalAttestation, type CurrentMailboxClear, type DeletionScope, type DeliveryRecord, type DurableReceipt, type EraseJournalEvent, type EraseScope, type ErasureRowCursor, type ErasureRowPage, type ErasureWork, type ErasureWorkPage, type FinalErasureEvidence, type SafetyJournal } from "./types";

// Private 11B admission contract for commands without a consumedItems DTO.
// Reserve BEFORE calling; these bounds include nested fixed owner validation,
// bounded lookahead and bookkeeping. Any throw stops new-work admission.
// withErasureGuard is already included in every rowPage's twenty-item charge;
// reserve it separately when its callback does not call rowPage.
// Bounds: raw case/lifecycle <=7 rows; delivery <=16; currentClear <=41
// including I1 latch, pending lookahead, receipts and projection authority.
// Scope consistency adds two composite-PK range probes (<=1 row each),
// including when the current replay history is large; no history traversal.
// currentFinalEvidence <=93: case7 + scope3 + delivery16 + clear64 + audit2
// + one spare. prepare <=144: reserved final128 + pending2 + scope3 + case7
// + identity1 + writes3. acknowledge <=147: final128 + phase1 + work4 +
// scope3 + case7 + identity1 + update1 + two spare bookkeeping credits.
// Rounded reserves below deliberately charge empty fixed queries as well.
// R92: lockRestoredAuthentication is instead one mandatory cold bootstrap
// transaction BEFORE authentication/bounded erasure invocations. Existing auth
// rows have no total cap, so it has no claimed item/latency bound. Task14 must
// qualify its exclusive startup/resource/DB cleanup window; never split it or
// treat a JavaScript timeout as interruption. Failure remains cold/denied.
export const ERASURE_COMMAND_ITEMS=Object.freeze({pending:2,currentClear:64,currentFinalEvidence:128,prepareCommit:256,acknowledge:192,withErasureGuard:20});

export interface ErasureOwner {
  readonly journal: SafetyJournal | undefined;
  pending(id: ApplicationId): EraseJournalEvent | null;
  prepareCommit(id: ApplicationId, scope: EraseScope): EraseJournalEvent;
  acknowledge(event: EraseJournalEvent, receipt: DurableReceipt): void;
  currentFinalEvidence(id: ApplicationId): FinalErasureEvidence | null;
  withErasureGuard<T>(commitEventId: string, action: (work: ErasureWork) => Promise<T>): Promise<T>;
  listWork(remainingItems: number): ErasureWorkPage;
  rowPage(commitEventId: string, cursor: ErasureRowCursor | null, remainingItems: number): ErasureRowPage;
  lockRestoredAuthentication(): void;
}
const owners = new WeakMap<ApplicationRepository, ErasureOwner>();
export function bindErasureOwner(repository: ApplicationRepository, owner: ErasureOwner): void { if (owners.has(repository)) throw new Error("ERASURE_ALREADY_OWNED"); owners.set(repository, owner); }
export function erasureOwner(repository: ApplicationRepository): ErasureOwner { const owner = owners.get(repository); if (!owner) throw new Error("ERASURE_UNAVAILABLE"); return owner; }
function fail(code = "ERASURE_STORAGE_INVALID"): never { throw new Error(code); }
const scopes: readonly EraseScope[] = ["processing_payload", "processing_contact", "incident_identity", "public_token", "identifying_register"];
type Phase = { eventId: string; caseId: ApplicationId; event: string; phase: "proposed" | "acknowledged"; entry: DurableReceipt["entry"] | null; head: DurableReceipt["head"] | null };
interface Dependencies {
  readonly journal: SafetyJournal | undefined;
  readonly now: () => string;
  readonly guard: (id: ApplicationId) => void;
  readonly guarded: <T>(id: ApplicationId, action: () => Promise<T>) => Promise<T>;
  readonly readCase: (id: ApplicationId) => CaseRecord;
  readonly delivery: (id: ApplicationId) => DeliveryRecord;
  readonly currentClear: (id: ApplicationId) => CurrentMailboxClear | null;
  readonly scope: () => DeletionScope;
  readonly lockAuthentication: () => void;
}
export function createErasureRepository(db: Database.Database, deps: Dependencies): ErasureOwner {
  const selectRows=createErasureRowSelector(db);
  function pending(id: ApplicationId): EraseJournalEvent | null {
    deps.guard(id);
    const phase = db.prepare("SELECT event FROM erasure_events WHERE caseId=? AND phase='proposed'").get(id) as { event: string } | undefined;
    if (!phase) return null;
    const event = decodeJournalEvent(phase.event);
    if ((event[3] !== "erase_commit" && event[3] !== "erase_done") || event[4][0] !== id) fail();
    return event;
  }
  function attestation(row: CaseRecord): CurrentExternalAttestation | null {
    const l = row.lifecycle;
    if (!l.externalCopiesConfirmed) return null;
    const audit = db.prepare("SELECT sequence,version,actor,at,reason,newExternalConfirmed,newExternalAt,newExternalActor,newExternalReason FROM lifecycle_audit WHERE caseId=? AND kind='confirm-external-copies' ORDER BY sequence DESC LIMIT 1").get(row.id) as (CurrentExternalAttestation & { newExternalConfirmed: number; newExternalAt: string; newExternalActor: string; newExternalReason: string }) | undefined;
    if (!audit || audit.newExternalConfirmed !== 1 || audit.actor !== l.externalCopiesActor || audit.at !== l.externalCopiesAt || audit.reason !== l.externalCopiesReason || audit.newExternalAt !== audit.at || audit.newExternalActor !== audit.actor || audit.newExternalReason !== audit.reason) return null;
    if (!Number.isSafeInteger(audit.sequence) || audit.sequence < 1 || !Number.isSafeInteger(audit.version) || audit.version < 1 || audit.version > row.version) fail();
    staffId(audit.actor); utcInstant(audit.at); operatorReason(audit.reason);
    const invalidated = db.prepare("SELECT 1 FROM lifecycle_audit WHERE caseId=? AND sequence>? AND newExternalConfirmed=0 LIMIT 1").get(row.id, audit.sequence);
    if (invalidated) return null;
    return Object.freeze({ sequence: audit.sequence, version: audit.version, actor: audit.actor, at: audit.at, reason: audit.reason });
  }
  function currentFinalEvidence(id: ApplicationId): FinalErasureEvidence | null {
    deps.guard(id); const row = deps.readCase(id), now = utcInstant(deps.now());
    if (row.claimToken || row.caseState !== "rejected_closed" || row.lifecycle.hold || !row.lifecycle.deleteFrom || row.lifecycle.deleteFrom > berlinDate(new Date(now)) || row.lifecycle.pendingEventId || !row.acceptanceEpochId) return null;
    const scope = deps.scope(), delivery = deps.delivery(id), clear = deps.currentClear(id), audit = attestation(row);
    if (!clear || !audit || !delivery.registered || !scope.approvedScopes.some(item => item[0] === row.acceptanceEpochId && admissionScopeAccepts(item, row.submission, row.acceptedAt))) return null;
    const intent = clear.intentEvent[4];
    if (intent[6] !== scope.associationKeyId || intent[7] !== registrationAssociation(scope, row.acceptanceEpochId, delivery.registered)) return null;
    return Object.freeze({ caseId: id, caseVersion: row.version, safetyRevision: row.lifecycle.safetyRevision, clear, attestation: audit, externalAttestationAssociation: externalAttestationAssociation(scope, id, audit) });
  }
  function due(row: CaseRecord, delivery: DeliveryRecord, scope: EraseScope, now: string): void {
    const at = Date.parse(row.acceptedAt), time = Date.parse(now), day = 86400000;
    if (time < at) fail("ERASURE_NOT_DUE");
    if (scope === "public_token") { if (time < at + 7 * day) fail("ERASURE_NOT_DUE"); return; }
    let early: number | null = null;
    if (delivery.confirmedAt || delivery.category === "invalid") {
      const determined = delivery.confirmedAt ?? delivery.determinedAt;
      if (!determined || determined < row.acceptedAt || !delivery.cleanupDueAt) fail();
      const expected = Math.min(Date.parse(determined) + 23 * 3600000, Date.parse(row.payloadDeleteAfter) - 3600000, Date.parse(row.contactDeleteAfter) - 3600000);
      if (Date.parse(delivery.cleanupDueAt) !== expected) fail(); early = expected;
    } else if (delivery.cleanupDueAt !== null) fail();
    const deadline = scope === "processing_payload" ? Math.min(Date.parse(row.payloadDeleteAfter), early ?? Infinity)
      : scope === "processing_contact" ? Math.min(Date.parse(row.contactDeleteAfter), early ?? Infinity)
      : delivery.confirmedAt ? Infinity : delivery.category === "invalid" ? Math.min(Date.parse(row.contactDeleteAfter), Date.parse(delivery.determinedAt!) + day) : at + 30 * day;
    if (time < deadline) fail("ERASURE_NOT_DUE");
  }
  function prepareCommit(id: ApplicationId, target: EraseScope): EraseJournalEvent {
    deps.guard(id); applicationId(id); if (!scopes.includes(target)) fail();
    return db.transaction(() => {
      const old = pending(id); if (old) { if (old[3] !== "erase_commit" || old[4][1] !== target) fail("ERASURE_PENDING"); return old; }
      const scope = deps.scope(), row = deps.readCase(id), now = utcInstant(deps.now());
      if (row.claimToken !== null) fail("ERASURE_CLAIM_ACTIVE");
      const identity = db.prepare("SELECT sessionHash,idempotencyKey FROM cases WHERE id=?").get(id) as { sessionHash: import("./types").Digest; idempotencyKey: string } | undefined;
      if (!identity) fail();
      const association = replayAssociation(scope, identity.sessionHash, identity.idempotencyKey), eventId = randomBytes(16).toString("hex");
      let event: EraseJournalEvent;
      if (target === "identifying_register") {
        const evidence = currentFinalEvidence(id); if (!evidence) fail("ERASURE_FINAL_EVIDENCE_REQUIRED");
        const intent = evidence.clear.intentEvent[4];
        event = ["tj-journal-event-v1", eventId, now, "erase_commit", [id, target, scope.associationKeyId, association, intent[2], intent[3], String(evidence.caseVersion), evidence.clear.clearEvent[1], evidence.externalAttestationAssociation]];
      } else { due(row, deps.delivery(id), target, now); event = ["tj-journal-event-v1", eventId, now, "erase_commit", [id, target, scope.associationKeyId, association]]; }
      const wire = encodeJournalEvent(event);
      db.prepare("INSERT INTO erasure_events(eventId,caseId,event,phase) VALUES(?,?,?,'proposed')").run(eventId, id, wire);
      db.prepare("INSERT INTO erasure_replay(ledgerId,historyEpoch,associationKeyId,replayAssociation,stagedEventId) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING").run(scope.ledgerId, scope.historyEpoch, scope.associationKeyId, association, eventId);
      db.prepare("INSERT INTO erasure_scopes(caseId,scope,eventId,committed) VALUES(?,?,?,0) ON CONFLICT DO NOTHING").run(id, target, eventId);
      return decodeJournalEvent(wire) as EraseJournalEvent;
    }).immediate();
  }
  function work(commitEventId: string): ErasureWork {
    if (typeof commitEventId !== "string" || !/^[a-f0-9]{32}$/.test(commitEventId)) fail();
    const row = db.prepare("SELECT o.* FROM erasure_obligations o JOIN journal_projection p ON p.pass=o.inspectionGeneration WHERE o.commitEventId=? AND p.singleton=1 AND o.ledgerId=p.ledgerId AND o.historyEpoch=p.historyEpoch").get(commitEventId) as ErasureWork | undefined;
    const fact = db.prepare("SELECT f.event,f.sequence,f.entryHash FROM journal_facts f JOIN journal_projection p ON p.pass=f.pass WHERE p.singleton=1 AND f.eventId=?").get(commitEventId) as { event: string; sequence: string; entryHash: string } | undefined;
    if (!row || !fact) fail("ERASURE_UNVERIFIED");
    const event = decodeJournalEvent(fact.event);
    if (event[3] !== "erase_commit" || event[4][0] !== row.caseId || event[4][1] !== row.scope || event[4][2] !== row.associationKeyId || event[4][3] !== row.replayAssociation || row.sequence !== fact.sequence || row.entryHash !== fact.entryHash) fail();
    return Object.freeze({ commitEventId, caseId: row.caseId, scope: row.scope, ledgerId: row.ledgerId, historyEpoch: row.historyEpoch, associationKeyId: row.associationKeyId, replayAssociation: row.replayAssociation, sequence: row.sequence, entryHash: row.entryHash, stage: row.stage });
  }
  function acknowledge(event: EraseJournalEvent, receipt: DurableReceipt): void {
    deps.guard(event[4][0]);
    const p = db.prepare("SELECT * FROM erasure_events WHERE eventId=?").get(event[1]) as Phase | undefined;
    if (!p || p.caseId !== event[4][0] || p.event !== encodeJournalEvent(event) || event[3] !== "erase_commit") fail();
    const current = work(event[1]), scope = deps.scope();
    if (scope.ledgerId !== current.ledgerId || scope.historyEpoch !== current.historyEpoch || scope.associationKeyId !== current.associationKeyId) fail();
    const raw=deps.readCase(p.caseId),identity=db.prepare("SELECT sessionHash,idempotencyKey FROM cases WHERE id=?").get(p.caseId) as {sessionHash:import("./types").Digest;idempotencyKey:string}|undefined;
    if(raw.claimToken!==null)fail("ERASURE_CLAIM_ACTIVE");
    if(!identity||replayAssociation(scope,identity.sessionHash,identity.idempotencyKey)!==event[4][3])fail();
    if(event[4][1]!=="identifying_register")due(raw,deps.delivery(p.caseId),event[4][1],utcInstant(deps.now()));
    if (typeof receipt.entry !== "string" || typeof receipt.head !== "string" || Buffer.byteLength(receipt.entry)>4096 || Buffer.byteLength(receipt.head)>1024) fail();
    let entry: unknown, head: unknown; try { entry = JSON.parse(receipt.entry); head = JSON.parse(receipt.head); } catch { fail(); }
    if (!Array.isArray(entry) || !Array.isArray(head) || entry.length!==2 || head.length!==2 || !Array.isArray(entry[0]) || !Array.isArray(head[0]) || entry[0].length!==8 || head[0].length!==9 || typeof entry[1]!=="string" || typeof head[1]!=="string" || !/^[A-Za-z0-9_-]{86}$/.test(entry[1]) || !/^[A-Za-z0-9_-]{86}$/.test(head[1]) || JSON.stringify(entry)!==receipt.entry || JSON.stringify(head)!==receipt.head) fail();
    const e=entry[0],h=head[0];
    if (e[0]!=="tj-journal-entry-v1" || h[0]!=="tj-journal-head-v1" || e[1]!==scope.ledgerId || e[2]!==scope.historyEpoch || h[1]!==e[1] || h[2]!==e[2] || encodeJournalEvent(e[7])!==p.event || e[4]!==current.sequence || h[4]!==current.sequence || h[5]!==current.entryHash || h[6]!==event[1] || h[7]!==event[2] || createHash("sha256").update("tj-journal-entry-hash-v1\n"+JSON.stringify(e)).digest("hex")!==current.entryHash) fail();
    if (event[4][1] === "identifying_register") {
      const evidence=currentFinalEvidence(p.caseId),payload=event[4];
      if (!evidence || String(evidence.caseVersion)!==payload[6] || evidence.clear.clearEvent[1]!==payload[7] || evidence.externalAttestationAssociation!==payload[8]) fail("ERASURE_FINAL_EVIDENCE_REQUIRED");
    }
    if(p.phase==="acknowledged") { if(p.entry!==receipt.entry||p.head!==receipt.head) fail(); return; }
    db.prepare("UPDATE erasure_events SET phase='acknowledged',entry=?,head=? WHERE eventId=? AND phase='proposed'").run(receipt.entry,receipt.head,event[1]);
  }
  function budget(value:number):void { if(!Number.isSafeInteger(value)||value<1||value>1000) fail("ERASURE_BUDGET_INVALID"); }
  return Object.freeze({ journal:deps.journal,pending,prepareCommit,acknowledge,currentFinalEvidence,
    async withErasureGuard<T>(commitEventId:string,action:(value:ErasureWork)=>Promise<T>):Promise<T> {
      const initial=work(commitEventId);
      return deps.guarded(initial.caseId,async()=>{ const current=work(commitEventId); const claim=db.prepare("SELECT claimToken,claimOwner,claimedAt FROM cases WHERE id=?").get(current.caseId) as {claimToken:string|null;claimOwner:string|null;claimedAt:string|null}|undefined; if(claim&&Object.values(claim).some(value=>value!==null)) fail("ERASURE_CLAIM_ACTIVE"); return action(current); });
    },
    listWork(remainingItems:number):ErasureWorkPage {
      budget(remainingItems); if(remainingItems<10)return Object.freeze({items:Object.freeze([]),hasMore:true,consumedItems:0});
      return db.transaction(()=>{
        let cycle=(db.prepare("SELECT cycle FROM erasure_progress WHERE singleton=1").get() as {cycle:number}).cycle;
        // Selection + obligation/projection + fact/projection + fairness update:
        // six scalar rows per item; four more cover cycle/empty retry/lookahead.
        const limit=Math.min(20,Math.floor((remainingItems-4)/6));
        const select=()=>db.prepare("SELECT o.commitEventId FROM erasure_obligations o INDEXED BY erasure_work_order JOIN journal_projection p ON p.pass=o.inspectionGeneration WHERE p.singleton=1 AND o.stage!='locally-complete' AND o.selectedCycle<? ORDER BY o.selectedCycle,length(o.sequence),o.sequence,o.caseId,o.commitEventId LIMIT ?").all(cycle,limit+1) as {commitEventId:string}[];
        let selected=select(); if(!selected.length){if(!Number.isSafeInteger(cycle+1))fail();cycle++;db.prepare("UPDATE erasure_progress SET cycle=? WHERE singleton=1").run(cycle);selected=select();}
        const hasMore=selected.length>limit,items=selected.slice(0,limit).map(item=>{const result=work(item.commitEventId);db.prepare("UPDATE erasure_obligations SET selectedCycle=? WHERE commitEventId=?").run(cycle,item.commitEventId);return result;});
        return Object.freeze({items:Object.freeze(items),hasMore,consumedItems:4+6*items.length});
      }).immediate();
    },
    rowPage(commitEventId:string,cursor:ErasureRowCursor|null,remainingItems:number):ErasureRowPage {
      budget(remainingItems);if(remainingItems<22)fail("ERASURE_BUDGET_INSUFFICIENT");
      const current=work(commitEventId);deps.guard(current.caseId);
      // Twenty credits conservatively include BOTH withErasureGuard resolutions
      // and this page's obligation/fact/projection/claim/covering-scope reads.
      // Charge this even when the same guard spans several pages. 11B must stop
      // new-work admission after a failure and count its mutations separately.
      const claim=db.prepare("SELECT claimToken,claimOwner,claimedAt FROM cases WHERE id=?").get(current.caseId) as {claimToken:string|null;claimOwner:string|null;claimedAt:string|null}|undefined;
      if(claim&&Object.values(claim).some(value=>value!==null))fail("ERASURE_CLAIM_ACTIVE");
      if(current.scope==="incident_identity"&&!db.prepare("SELECT 1 FROM erasure_obligations o JOIN journal_projection p ON p.pass=o.inspectionGeneration WHERE o.caseId=? AND o.scope IN('processing_payload','identifying_register') AND o.stage='locally-complete' LIMIT 1").get(current.caseId))fail("ERASURE_PAYLOAD_COVERAGE_REQUIRED");
      const page=selectRows(current,cursor,remainingItems-20);return Object.freeze({...page,consumedItems:page.consumedItems+20});
    },
    lockRestoredAuthentication:deps.lockAuthentication,
  });
}
