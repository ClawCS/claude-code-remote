import type Database from "better-sqlite3";
import { createHash, randomBytes } from "node:crypto";
import { lstatSync, type Stats } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { decodeJournalEvent, encodeJournalEvent } from "./ledger-contract";
import { maintenanceBarrierCredits } from "./ledger";
import { admissionScopeAccepts, registrationAssociation } from "./deletion-association";
import { externalAttestationAssociation, replayAssociation } from "./erasure-association";
import { createErasureRowSelector, createCustodyInventoryStorage, validateSafetyCarry, type PhysicalVerifier } from "./erasure-storage";
import type { CustodyConfig, CustodyLedger } from "./types";
import { berlinDate, operatorReason } from "./lifecycle";
import { assertDatabaseSanitationBaseline, assertMaintenance, assertMaintenanceSettled, maintenanceCommand, maintenanceRemaining, maintenanceReadPhase, originalMaintenanceCustody, selectMaintenance, type MaintenanceRun } from "./worker-maintenance";
import type { DatabaseIncarnation } from "./types";
import { advanceAuthMaintenanceClock } from "./auth-repository";
import { readIncidentResolution } from "./incident-resolution";
import type { IncidentResolutionRetention } from "./types";
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
  bindCustody(custody: CustodyLedger, config: CustodyConfig): ReturnType<typeof createCustodyInventoryStorage>;
  readonly journal: SafetyJournal | undefined;
  pending(id: ApplicationId): EraseJournalEvent | null;
  prepareCommit(id: ApplicationId, scope: EraseScope): EraseJournalEvent;
  prepareIncidentResolution(id: ApplicationId): void;
  incidentResolutionRetention(id: ApplicationId): IncidentResolutionRetention;
  adminRetention(id: ApplicationId): import("./types").AdminCaseDetail["retention"];
  acknowledge(event: EraseJournalEvent, receipt: DurableReceipt): void;
  currentFinalEvidence(id: ApplicationId): FinalErasureEvidence | null;
  withErasureGuard<T>(commitEventId: string, action: (work: ErasureWork) => Promise<T>): Promise<T>;
  listWork(remainingItems: number): ErasureWorkPage;
  rowPage(commitEventId: string, cursor: ErasureRowCursor | null, remainingItems: number): ErasureRowPage;
  lockRestoredAuthentication(): void;
  listDue(run: MaintenanceRun): Promise<DuePage>;
  prepareDue(candidate: DueCandidate, run: MaintenanceRun): Promise<Readonly<{ event: EraseJournalEvent; consumedItems: number }>>;
  prepareDueBatch(run: MaintenanceRun): Promise<Readonly<{ prepared: number; consumedItems: number }>>;
  acknowledgeCommit(event: EraseJournalEvent, receipt: DurableReceipt, run: MaintenanceRun): Promise<Readonly<{ consumedItems: number }>>;
  finalWorkBatch(run: MaintenanceRun): Promise<Readonly<{ complete: boolean; hasWork: boolean; nextWakeAt: string | null; consumedItems: number }>>;
  assertFinalWork(): void;
  assertSanitizedFinalWork(): void;
  checkpointFinalDatabase(run: MaintenanceRun): Promise<Readonly<{ complete: boolean; consumedItems: number }>>;
  expireGlobalBatch(run: MaintenanceRun): Promise<Readonly<{ deleted: number; hasMore: boolean; consumedItems: number }>>;
  listPending(run: MaintenanceRun): Promise<Readonly<{ items: readonly PendingMaintenance[]; hasMore: boolean; consumedItems: number }>>;
  listCommitted(run: MaintenanceRun): Promise<ErasureWorkPage>;
  reconcileClaim(commitEventId: string, run: MaintenanceRun): Promise<Readonly<{ changed: boolean; consumedItems: number }>>;
  applyRowBatch(commitEventId: string, cursor: ErasureRowCursor | null, run: MaintenanceRun): Promise<Readonly<{ next: ErasureRowCursor | null; complete: boolean; consumedItems: number }>>;
  checkpointDatabase(run: MaintenanceRun): Promise<Readonly<{ complete: boolean; consumedItems: number }>>;
  prepareDone(commitEventId: string, run: MaintenanceRun): Promise<Readonly<{ event: EraseJournalEvent | null; consumedItems: number }>>;
  acknowledgeDone(event: EraseJournalEvent, receipt: DurableReceipt, run: MaintenanceRun): Promise<Readonly<{ consumedItems: number }>>;
}
export type PendingMaintenance = Readonly<{ kind: "proposed"; event: EraseJournalEvent }> | Readonly<{ kind: "needs-done"; work: ErasureWork }>;
export interface DueCandidate { readonly caseId: ApplicationId; readonly scope: EraseScope; readonly dueAt: string }
export interface DuePage { readonly items: readonly DueCandidate[]; readonly hasMore: boolean; readonly consumedItems: number }
const owners = new WeakMap<ApplicationRepository, ErasureOwner>();
export function bindErasureOwner(repository: ApplicationRepository, owner: ErasureOwner): void { if (owners.has(repository)) throw new Error("ERASURE_ALREADY_OWNED"); owners.set(repository, owner); }
export function erasureOwner(repository: ApplicationRepository): ErasureOwner { const owner = owners.get(repository); if (!owner) throw new Error("ERASURE_UNAVAILABLE"); return owner; }
function fail(code = "ERASURE_STORAGE_INVALID"): never { throw new Error(code); }
// Shared exact early-cleanup validation for erasure and the pure admin read.
export function validatedEarlyCleanup(row: CaseRecord, delivery: DeliveryRecord): number | null {
  if (delivery.confirmedAt || delivery.category === "invalid") {
    const determined = delivery.confirmedAt ?? delivery.determinedAt;
    if (!determined || determined < row.acceptedAt || !delivery.cleanupDueAt) fail();
    const expected = Math.min(Date.parse(determined) + 23 * 3600000, Date.parse(row.payloadDeleteAfter) - 3600000, Date.parse(row.contactDeleteAfter) - 3600000);
    if (Date.parse(delivery.cleanupDueAt) !== expected) fail();
    return expected;
  }
  if (delivery.cleanupDueAt !== null) fail();
  return null;
}
const scopes: readonly EraseScope[] = ["processing_payload", "processing_contact", "incident_identity", "public_token", "identifying_register"];
type Phase = { eventId: string; caseId: ApplicationId; event: string; phase: "proposed" | "acknowledged"; entry: DurableReceipt["entry"] | null; head: DurableReceipt["head"] | null };
interface Dependencies {
  readonly databasePath: string;
  readonly repository: ApplicationRepository;
  readonly journal: SafetyJournal | undefined;
  readonly now: () => string;
  readonly guard: (id: ApplicationId) => object;
  readonly guarded: <T>(id: ApplicationId, action: () => Promise<T>) => Promise<T>;
  readonly readCase: (id: ApplicationId) => CaseRecord;
  readonly delivery: (id: ApplicationId) => DeliveryRecord;
  readonly currentClear: (id: ApplicationId) => CurrentMailboxClear | null;
  readonly scope: () => DeletionScope;
  readonly lockAuthentication: () => void;
}
export function createErasureRepository(db: Database.Database, deps: Dependencies): ErasureOwner {
  const boundCustodies = new WeakSet<CustodyLedger>();
  const physicalVerifiers = new WeakMap<CustodyLedger, PhysicalVerifier>();
  const selectRows=createErasureRowSelector(db);
  const candidates = new WeakMap<DueCandidate, { run: MaintenanceRun; used: boolean }>();
  // Captured from the original connection/configuration, never an operation
  // operand. These stats are identity checks, NOT pre-open exclusion evidence.
  const databasePath = deps.databasePath;
  const originalFile = lstatSync(databasePath);
  const originalWal = lstatSync(`${databasePath}-wal`);
  const ancestry: { path: string; stat: Stats }[] = [];
  for (let path = dirname(databasePath); ; path = dirname(path)) {
    ancestry.push({ path, stat: lstatSync(path) });
    if (path === dirname(path)) break;
  }
  const incarnation = Object.freeze({ canonicalPath: databasePath, device: originalFile.dev, inode: originalFile.ino }) as DatabaseIncarnation;
  function safeDatabase(run: MaintenanceRun, truncated = false): void {
    const deny = () => fail("ERASURE_SANITATION_REQUIRED");
    try {
      assertDatabaseSanitationBaseline(run, deps.repository, incarnation);
      if (!isAbsolute(databasePath) || resolve(databasePath) !== databasePath) deny();
      const attached = db.pragma("database_list") as { name: string; file: string }[];
      if (attached.length !== 1 || attached[0].name !== "main" || attached[0].file !== databasePath) deny();
      const file = lstatSync(databasePath);
      if (!file.isFile() || file.isSymbolicLink() || file.nlink !== 1 || file.uid !== process.getuid?.() || (file.mode & 0o077) !== 0 || file.dev !== incarnation.device || file.ino !== incarnation.inode || !Number.isSafeInteger(file.dev) || !Number.isSafeInteger(file.ino)) deny();
      for (const original of ancestry) {
        const current = lstatSync(original.path);
        if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== original.stat.dev || current.ino !== original.stat.ino || current.uid !== original.stat.uid || current.mode !== original.stat.mode) deny();
      }
      const root = ancestry[0].stat;
      if (root.uid !== process.getuid?.() || (root.mode & 0o077) !== 0 || db.pragma("secure_delete", { simple: true }) !== 1) deny();
      try {
        const wal = lstatSync(`${databasePath}-wal`);
        if (!wal.isFile() || wal.isSymbolicLink() || wal.nlink !== 1 || wal.uid !== process.getuid?.() || (wal.mode & 0o077) !== 0 || wal.dev !== file.dev || wal.dev !== originalWal.dev || wal.ino !== originalWal.ino || !Number.isSafeInteger(wal.ino) || (truncated && wal.size !== 0)) deny();
      } catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
      assertDatabaseSanitationBaseline(run, deps.repository, incarnation);
    } catch { deny(); }
  }
  let checkpointKey = "";
  // This records original-connection checkpoint provenance only. Done commands
  // must still acquire and consume fresh current-stage physical evidence.
  const locallyCompleted = new Map<string, string>();
  async function checkpointDatabase(run: MaintenanceRun) {
    assertMaintenanceSettled(run, deps.repository);
    const verifier = physicalVerifiers.get(originalMaintenanceCustody(run, deps.repository));
    if (!verifier) fail("ERASURE_UNVERIFIED");
    // Key selection/work/guard24 + inspector + consume99 + three safe fixed
    // DB/WAL/ancestry sweeps + fresh row selector64 + transition/lookahead8.
    const maximum = 24 + verifier.inspectionMaximum + 99 + 3 * (ancestry.length + 10) + 64 + 8;
    if (maintenanceRemaining(run,deps.repository).items < maximum) return Object.freeze({complete:false,consumedItems:0});
    const result = await maintenanceCommand(run,deps.repository,maximum,"filesystem",async () => {
      safeDatabase(run);
      let used = ancestry.length + 12;
      const selected = db.prepare("SELECT commitEventId FROM erasure_obligations WHERE commitEventId>? ORDER BY commitEventId LIMIT 1").get(checkpointKey) as {commitEventId:string}|undefined;
      if (!selected) { checkpointKey=""; return {value:false,consumedItems:used}; }
      return owner.withErasureGuard(selected.commitEventId,async initial => {
        used += 20;
        selectMaintenance(run,deps.repository,`case:${initial.caseId}`);
        if (initial.stage !== "database-maintenance-pending") { checkpointKey=initial.commitEventId; return {value:false,consumedItems:used}; }
        const inspected=await verifier.inspect(initial.commitEventId,run); used+=inspected.consumedItems;
        assertMaintenance(run,deps.repository);
        if (!inspected.proof) return {value:false,consumedItems:used};
        const page=owner.rowPage(initial.commitEventId,null,64); used+=page.consumedItems;
        if (page.targets.length || page.next) fail("ERASURE_PENDING");
        safeDatabase(run); used+=ancestry.length+10;
        let checkpoint: {busy:number;log:number;checkpointed:number}[];
        used++;
        try { checkpoint=db.pragma("wal_checkpoint(TRUNCATE)") as typeof checkpoint; }
        catch(error) {
          if(error instanceof Error && "code" in error && (error.code==="SQLITE_BUSY"||error.code==="SQLITE_LOCKED"))return {value:false,consumedItems:used};
          throw error;
        }
        if (checkpoint.length!==1 || checkpoint[0].busy!==0 || checkpoint[0].log!==0 || checkpoint[0].checkpointed!==0) return {value:false,consumedItems:used};
        // No await between actual checkpoint, exact current proof consumption,
        // held baseline checks and the original connection's fixed transition.
        safeDatabase(run,true); used+=ancestry.length+10;
        used+=verifier.consumeInspection(inspected.proof,initial.commitEventId,run);
        const current=work(initial.commitEventId); used+=4;
        if(JSON.stringify(current)!==JSON.stringify(initial))fail("ERASURE_UNVERIFIED");
        db.transaction(()=>db.prepare("UPDATE erasure_obligations SET stage='locally-complete' WHERE commitEventId=? AND stage='database-maintenance-pending'").run(initial.commitEventId)).immediate(); used++;
        locallyCompleted.set(initial.commitEventId,JSON.stringify({...current,stage:"locally-complete"}));
        checkpointKey=initial.commitEventId;
        return {value:true,consumedItems:used};
      });
    });
    return Object.freeze({complete:result.value,consumedItems:result.consumedItems});
  }
  async function prepareDone(commitEventId: string,run:MaintenanceRun) {
    assertMaintenanceSettled(run,deps.repository);
    const verifier=physicalVerifiers.get(originalMaintenanceCustody(run,deps.repository));
    if(!verifier)fail("ERASURE_UNVERIFIED");
    // Guard/work/phase40 + actual fresh inspection + consume99 + original
    // sanitation sweeps 2*(D+10) + fixed current row-exhaustion selector64.
    const maximum=40+verifier.inspectionMaximum+99+2*(ancestry.length+10)+64;
    const result=await maintenanceCommand(run,deps.repository,maximum,"filesystem",()=>owner.withErasureGuard(commitEventId,async current=>{
      assertMaintenance(run,deps.repository); selectMaintenance(run,deps.repository,`case:${current.caseId}`);
      if(current.stage!=="locally-complete" || locallyCompleted.get(commitEventId)!==JSON.stringify(current))fail("ERASURE_PENDING");
      safeDatabase(run);
      const inspected=await verifier.inspect(commitEventId,run);
      assertMaintenance(run,deps.repository);
      if(!inspected.proof)return {value:null,consumedItems:maximum};
      const page=owner.rowPage(commitEventId,null,64);
      if(page.targets.length||page.next)fail("ERASURE_PENDING");
      safeDatabase(run);
      // No await from exact one-use consumption through the fixed transaction.
      verifier.consumeInspection(inspected.proof,commitEventId,run);
      const event=db.transaction(()=>{
        const pendingEvent=pending(current.caseId);
        if(pendingEvent){if(pendingEvent[3]!=="erase_done"||pendingEvent[4][1]!==commitEventId)fail("ERASURE_PENDING");return pendingEvent;}
        const historical=db.prepare("SELECT historicalDone FROM erasure_obligations WHERE commitEventId=?").get(commitEventId) as {historicalDone:string|null};
        if(historical.historicalDone){
          const fact=db.prepare("SELECT f.event FROM journal_facts f JOIN journal_projection p ON p.pass=f.pass WHERE p.singleton=1 AND f.eventId=?").get(historical.historicalDone) as {event:string}|undefined;
          if(!fact)fail("ERASURE_UNVERIFIED");
          const done=decodeJournalEvent(fact.event);
          if(done[3]!=="erase_done"||done[4][0]!==current.caseId||done[4][1]!==commitEventId)fail();
          db.prepare("INSERT INTO erasure_events(eventId,caseId,event,phase) VALUES(?,?,?,'proposed') ON CONFLICT DO NOTHING").run(done[1],current.caseId,fact.event);
          return done;
        }
        const done:EraseJournalEvent=["tj-journal-event-v1",randomBytes(16).toString("hex"),utcInstant(deps.now()),"erase_done",[current.caseId,commitEventId]];
        db.prepare("INSERT INTO erasure_events(eventId,caseId,event,phase) VALUES(?,?,?,'proposed')").run(done[1],current.caseId,encodeJournalEvent(done));
        return done;
      }).immediate();
      return {value:event,consumedItems:maximum};
    }));
    return Object.freeze({event:result.value,consumedItems:result.consumedItems});
  }
  async function acknowledgeDone(event:EraseJournalEvent,receipt:DurableReceipt,run:MaintenanceRun) {
    if(event[3]!=="erase_done")fail();
    assertMaintenanceSettled(run,deps.repository);
    const verifier=physicalVerifiers.get(originalMaintenanceCustody(run,deps.repository));
    if(!verifier)fail("ERASURE_UNVERIFIED");
    const maximum=40+verifier.inspectionMaximum+99+2*(ancestry.length+10)+64;
    const result=await maintenanceCommand(run,deps.repository,maximum,"filesystem",()=>owner.withErasureGuard(event[4][1],async current=>{
      assertMaintenance(run,deps.repository); selectMaintenance(run,deps.repository,`case:${current.caseId}`);
      if(current.caseId!==event[4][0] || current.stage!=="locally-complete" || locallyCompleted.get(current.commitEventId)!==JSON.stringify(current))fail("ERASURE_PENDING");
      safeDatabase(run);
      const inspected=await verifier.inspect(current.commitEventId,run);
      assertMaintenance(run,deps.repository);
      if(!inspected.proof)fail("ERASURE_PENDING");
      const page=owner.rowPage(current.commitEventId,null,64);
      if(page.targets.length||page.next)fail("ERASURE_PENDING");
      safeDatabase(run);
      verifier.consumeInspection(inspected.proof,current.commitEventId,run);
      db.transaction(()=>{
        const phase=db.prepare("SELECT * FROM erasure_events WHERE eventId=?").get(event[1]) as Phase|undefined;
        const fact=db.prepare("SELECT f.event,f.sequence,f.entryHash FROM journal_facts f JOIN journal_projection p ON p.pass=f.pass WHERE p.singleton=1 AND f.eventId=?").get(event[1]) as {event:string;sequence:string;entryHash:string}|undefined;
        if(!phase || phase.event!==encodeJournalEvent(event) || phase.caseId!==current.caseId || !fact || fact.event!==phase.event)fail("ERASURE_UNVERIFIED");
        validateReceipt(event,receipt,current.ledgerId,current.historyEpoch,fact.sequence,fact.entryHash);
        if(phase.phase==="acknowledged"){if(phase.entry!==receipt.entry||phase.head!==receipt.head)fail();}
        else db.prepare("UPDATE erasure_events SET phase='acknowledged',entry=?,head=? WHERE eventId=? AND phase='proposed'").run(receipt.entry,receipt.head,event[1]);
      }).immediate();
      return {value:null,consumedItems:maximum};
    }));
    return Object.freeze({consumedItems:result.consumedItems});
  }
  function validateReceipt(event:import("./types").JournalEvent,receipt:DurableReceipt,ledger:string,history:string,sequence:string,hash:string) {
    if(typeof receipt.entry!=="string"||typeof receipt.head!=="string"||Buffer.byteLength(receipt.entry)>4096||Buffer.byteLength(receipt.head)>1024)fail();
    let entry,head;
    try {entry=JSON.parse(receipt.entry);head=JSON.parse(receipt.head);}catch{fail();}
    if(!Array.isArray(entry)||!Array.isArray(head)||entry.length!==2||head.length!==2||!Array.isArray(entry[0])||!Array.isArray(head[0])||entry[0].length!==8||head[0].length!==9||typeof entry[1]!=="string"||typeof head[1]!=="string"||!/^[A-Za-z0-9_-]{86}$/.test(entry[1])||!/^[A-Za-z0-9_-]{86}$/.test(head[1])||JSON.stringify(entry)!==receipt.entry||JSON.stringify(head)!==receipt.head)fail();
    const e=entry[0],h=head[0];
    if(e[0]!=="tj-journal-entry-v1"||h[0]!=="tj-journal-head-v1"||e[1]!==ledger||e[2]!==history||h[1]!==ledger||h[2]!==history||encodeJournalEvent(e[7])!==encodeJournalEvent(event)||e[4]!==sequence||h[4]!==sequence||h[5]!==hash||h[6]!==event[1]||h[7]!==event[2]||e[3]!==h[3]||e[6]!==h[8]||createHash("sha256").update("tj-journal-entry-hash-v1\n"+JSON.stringify(e)).digest("hex")!==hash)fail();
  }
  // Examined-key streams use the global composite PK before case filtering.
  // No all-pass case predicate is hidden behind LIMIT or a pass-first index.
  let retirement: { commit: string; fingerprint: string; objectsDone: boolean; objectKey: [string,string,string,string]; journalKey: [string,string] } | undefined;
  function retireAccepted(current: ErasureWork): boolean {
    const fingerprint = JSON.stringify(current);
    if (!retirement || retirement.commit !== current.commitEventId || retirement.fingerprint !== fingerprint) retirement = { commit: current.commitEventId, fingerprint, objectsDone: false, objectKey: ["","","",""], journalKey: ["",""] };
    const before = retirement;
    const state = { ...before, objectKey: [...before.objectKey] as [string,string,string,string], journalKey: [...before.journalKey] as [string,string] };
    const streams = [current.commitEventId];
    if (current.scope === "identifying_register") {
      const predecessor = db.prepare("SELECT eventId FROM erasure_scopes WHERE caseId=? AND scope='processing_payload' AND committed=1").get(current.caseId) as { eventId: string } | undefined;
      if (predecessor) streams.push(predecessor.eventId);
    }
    for (const commit of streams) {
      const manifest = db.prepare("SELECT * FROM erasure_manifests WHERE eraseCommitId=? ORDER BY journalId,slot,leaf LIMIT 1").get(commit) as { scanPass: string; journalId: string; slot: string; leaf: string; phase: string; remainingCharge: number } | undefined;
      if (!manifest) continue;
      if (manifest.phase !== "metadata-finalized" || manifest.remainingCharge !== 0) fail("ERASURE_UNVERIFIED");
      const journal = db.prepare("SELECT caseId FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(manifest.scanPass, manifest.journalId) as { caseId: string } | undefined;
      if (!journal || journal.caseId !== current.caseId) fail();
      if (db.prepare("SELECT 1 FROM cleanup_manifests WHERE scanPass=? AND journalId=? AND slot=? AND leaf=? LIMIT 1").get(manifest.scanPass, manifest.journalId, manifest.slot, manifest.leaf)) fail("ERASURE_PENDING");
      db.prepare("DELETE FROM erasure_manifests WHERE eraseCommitId=? AND journalId=? AND slot=? AND leaf=?").run(commit, manifest.journalId, manifest.slot, manifest.leaf);
      return false;
    }
    if (!state.objectsDone) {
      const object = db.prepare("SELECT pass,journalId,slot,leaf FROM erasure_inventory_objects WHERE (pass,journalId,slot,leaf)>(?,?,?,?) ORDER BY pass,journalId,slot,leaf LIMIT 1").get(...state.objectKey) as { pass: string; journalId: string; slot: string; leaf: string } | undefined;
      if (!object) state.objectsDone = true;
      else {
        const journal = db.prepare("SELECT caseId FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(object.pass, object.journalId) as { caseId: string } | undefined;
        if (!journal) fail();
        if (journal.caseId === current.caseId) {
          if (db.prepare("SELECT 1 FROM erasure_manifests INDEXED BY erasure_manifest_inventory WHERE scanPass=? AND journalId=? AND slot=? AND leaf=? LIMIT 1").get(object.pass, object.journalId, object.slot, object.leaf) || db.prepare("SELECT 1 FROM cleanup_manifests INDEXED BY cleanup_manifest_inventory WHERE scanPass=? AND journalId=? AND slot=? AND leaf=? LIMIT 1").get(object.pass, object.journalId, object.slot, object.leaf)) fail("ERASURE_PENDING");
          db.prepare("DELETE FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").run(object.pass, object.journalId, object.slot, object.leaf);
        }
        state.objectKey = [object.pass, object.journalId, object.slot, object.leaf];
      }
    } else {
      const journal = db.prepare("SELECT pass,journalId,caseId FROM erasure_inventory_journals WHERE (pass,journalId)>(?,?) ORDER BY pass,journalId LIMIT 1").get(...state.journalKey) as { pass: string; journalId: string; caseId: string | null } | undefined;
      if (!journal) return true;
      if (journal.caseId === current.caseId) {
        if (db.prepare("SELECT 1 FROM erasure_inventory_objects WHERE pass=? AND journalId=? LIMIT 1").get(journal.pass, journal.journalId)) fail("ERASURE_PENDING");
        db.prepare("DELETE FROM erasure_inventory_journals WHERE pass=? AND journalId=?").run(journal.pass, journal.journalId);
      }
      state.journalKey = [journal.pass, journal.journalId];
    }
    // Publication is performed only by the caller after its actual COMMIT.
    pendingRetirement = state; return false;
  }
  let pendingRetirement: typeof retirement;
  function preserveSource(current:ErasureWork,source:"lifecycle"|"mailbox",eventId:string):void {
    const table=source==="lifecycle"?"lifecycle_proposals":"deletion_events";
    const row=db.prepare(`SELECT eventId,caseId,event,phase,entry,head FROM ${table} WHERE eventId=? AND caseId=?`).get(eventId,current.caseId) as {eventId:string;caseId:string;event:string;phase:string;entry:string|null;head:string|null}|undefined;
    if(!row)fail();
    const unresolved=row.phase==="proposed"||row.phase==="acknowledged";
    const carry=validateSafetyCarry({...row,source,phase:row.phase==="proposed"?"proposed":"acknowledged",coveringCommit:current.commitEventId});
    const fact=db.prepare("SELECT f.event,f.sequence,f.entryHash FROM journal_facts f JOIN journal_projection p ON p.pass=f.pass WHERE p.singleton=1 AND f.eventId=?").get(eventId) as {event:string;sequence:string;entryHash:string}|undefined;
    if(fact && fact.event!==row.event)fail();
    if(row.phase!=="proposed" && fact) {
      validateReceipt(decodeJournalEvent(row.event),{entry:row.entry!,head:row.head!} as DurableReceipt,current.ledgerId,current.historyEpoch,fact.sequence,fact.entryHash);
      // An acknowledged mutation marker is NOT an observed outcome. Its
      // current independently verified result, if any, is the only resolving
      // fact. Keep an unknown external effect minimal and non-executable.
      const event=decodeJournalEvent(row.event);
      if(source==="mailbox") {
        if(event[3]!=="copy_mutation_started")return;
        const result=db.prepare("SELECT f.event FROM journal_facts f JOIN journal_projection p ON p.pass=f.pass WHERE p.singleton=1 AND f.resultFor=?").get(eventId) as {event:string}|undefined;
        if(result) {
          const outcome=decodeJournalEvent(result.event);
          if(outcome[3]!=="copy_result"||outcome[4][0]!==current.caseId||outcome[4][1]!==eventId)fail();
          return;
        }
      } else if(!unresolved)return;
    } else if(!unresolved)fail("ERASURE_UNVERIFIED");
    const old=db.prepare("SELECT * FROM erasure_safety_carry WHERE caseId=? AND source=?").get(current.caseId,source);
    if(old) {
      const previous=validateSafetyCarry(old);
      if(Object.keys(carry).some(key=>previous[key as keyof typeof carry]!==carry[key as keyof typeof carry]))fail();
    }
    if(!old)db.prepare("INSERT INTO erasure_safety_carry(eventId,caseId,source,event,phase,entry,head,coveringCommit) VALUES(@eventId,@caseId,@source,@event,@phase,@entry,@head,@coveringCommit)").run(carry);
  }
  function expireCommittedPayload(current:ErasureWork,run:MaintenanceRun):void {
    if(current.scope!=="processing_payload")return;
    // Fixed point-only transition. It remains reachable after retireOriginal
    // cleared path/bytes, and when no sendDueAt target remains. It conveys no
    // mailbox absence or delivery-success evidence.
    if(!db.prepare("SELECT 1 FROM cases WHERE id=?").get(current.caseId))return;
    const row=deps.readCase(current.caseId),delivery=deps.delivery(current.caseId);
    const now=utcInstant(maintenanceRemaining(run,deps.repository).now);
    if(row.claimToken!==null||row.claimOwner!==null||row.claimedAt!==null||row.claimKind!==null)fail("ERASURE_CLAIM_ACTIVE");
    if(now<row.payloadDeleteAfter||row.deliveryState==="delivered"||row.deliveryState==="needs_attention"||delivery.confirmedAt!==null||delivery.category==="invalid")return;
    if(!["queued","scanning","ready","sending","smtp_accepted","uncertain"].includes(row.deliveryState)||row.version>=Number.MAX_SAFE_INTEGER)fail();
    const changed=db.prepare("UPDATE cases SET deliveryState='needs_attention',version=version+1 WHERE id=? AND version=? AND deliveryState=? AND claimToken IS NULL AND claimOwner IS NULL AND claimedAt IS NULL AND claimKind IS NULL").run(row.id,row.version,row.deliveryState);
    if(changed.changes!==1)fail("ERASURE_UNVERIFIED");
    if(db.prepare("UPDATE deliveries SET category='operational',reason='PROCESSING_EXPIRED',determinedAt=?,sendDueAt=NULL WHERE caseId=? AND confirmedAt IS NULL AND (category IS NULL OR category!='invalid')").run(now,row.id).changes!==1)fail("ERASURE_UNVERIFIED");
    db.prepare("INSERT INTO audit(caseId,event,version,at) VALUES(?,'delivery:failure:PROCESSING_EXPIRED',?,?)").run(row.id,row.version+1,now);
  }
  async function applyRowBatch(commitEventId: string, cursor: ErasureRowCursor | null, run: MaintenanceRun) {
    assertMaintenanceSettled(run, deps.repository);
    const verifier = physicalVerifiers.get(originalMaintenanceCustody(run, deps.repository));
    if (!verifier) fail("ERASURE_UNVERIFIED");
    // Guard20 + inspector + consume99 + selection32 + <=11 targets *15
    // (source/fact/carry probes, validation, carry+delete), secure_delete1,
    // fresh selector64, retirement50, stage1, pre-carry/current-work44;
    // expiry64 covers live point2 + validated case12/delivery24 + three
    // statement/changed-row pairs6 (=44), including applied/pending fences.
    const maximum = 20 + verifier.inspectionMaximum + 99 + 32 + 165 + 1 + 64 + 50 + 1 + 44 + 64;
    if (maintenanceRemaining(run, deps.repository).items < maximum) return Object.freeze({ next: cursor, complete: false, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, maximum, "filesystem", () => owner.withErasureGuard(commitEventId, async initial => {
      assertMaintenance(run, deps.repository);
      selectMaintenance(run, deps.repository, `case:${initial.caseId}`);
      const checked = await verifier.inspect(commitEventId, run);
      assertMaintenance(run, deps.repository);
      let consumed = 20 + checked.consumedItems;
      if (!checked.proof) return {value:{next:cursor,complete:false},consumedItems:consumed};
      pendingRetirement = undefined;
      try {
        const value = db.transaction(() => {
          consumed += verifier.consumeInspection(checked.proof!, commitEventId, run);
          const current = work(commitEventId); consumed += 4;
          if (JSON.stringify(current) !== JSON.stringify(initial)) fail("ERASURE_UNVERIFIED");
          if (db.pragma("secure_delete", { simple: true }) !== 1) fail("ERASURE_SANITATION_REQUIRED"); consumed++;
          expireCommittedPayload(current,run); consumed+=64;
          if(current.scope==="incident_identity"||current.scope==="identifying_register") {
            const lifecycle=db.prepare("SELECT pendingEventId FROM case_lifecycle WHERE caseId=?").get(current.caseId) as {pendingEventId:string|null}|undefined;
            if(lifecycle?.pendingEventId)preserveSource(current,"lifecycle",lifecycle.pendingEventId);
            const mail=db.prepare("SELECT eventId FROM deletion_events WHERE caseId=? AND phase='proposed'").get(current.caseId) as {eventId:string}|undefined;
            if(mail)preserveSource(current,"mailbox",mail.eventId);
            consumed+=32;
          }
          const page = owner.rowPage(commitEventId, cursor, 32); consumed += page.consumedItems;
          for (const target of page.targets) {
            switch (target.phase) {
              case "scope-contact": db.prepare("UPDATE deliveries SET contactEnvelope=NULL WHERE caseId=?").run(current.caseId); break;
              case "scope-proofs": db.prepare("DELETE FROM status_proofs WHERE caseId=? AND proofHash=?").run(current.caseId,target.key); break;
              case "payload-artifacts": case "payload-reservations": {
                const key = target.key as readonly [string,string];
                db.prepare(`DELETE FROM ${target.phase === "payload-artifacts" ? "artifacts" : "artifact_reservations"} WHERE caseId=? AND kind=?`).run(current.caseId,key[1]); break;
              }
              case "payload-case": db.prepare("UPDATE cases SET encryptedPayloadPath=NULL,payloadBytes=0 WHERE id=?").run(current.caseId); break;
              case "payload-send": db.prepare("UPDATE deliveries SET sendDueAt=NULL WHERE caseId=?").run(current.caseId); break;
              case "identity-grants": db.prepare("DELETE FROM auth_grants WHERE caseId=? AND hash=?").run(current.caseId,target.key); break;
              case "identity-incident-resolution": db.prepare("DELETE FROM delivery_incident_resolutions WHERE caseId=?").run(current.caseId); break;
              case "identity-lifecycle-audit": case "identity-audit":
                db.prepare(`DELETE FROM ${target.phase === "identity-audit" ? "audit" : "lifecycle_audit"} WHERE caseId=? AND sequence=?`).run(current.caseId,target.key); break;
              case "identity-lifecycle-proposals": {
                preserveSource(current,"lifecycle",target.key as string); consumed+=13;
                db.prepare("UPDATE case_lifecycle SET pendingEventId=NULL WHERE caseId=? AND pendingEventId=?").run(current.caseId,target.key); consumed++;
                db.prepare("DELETE FROM lifecycle_proposals WHERE caseId=? AND eventId=?").run(current.caseId,target.key); break;
              }
              case "identity-searches": {
                const key = target.key as readonly [string,string];
                db.prepare("DELETE FROM deletion_searches WHERE attemptId=? AND round=?").run(...key); break;
              }
              case "identity-diagnostics": db.prepare("DELETE FROM deletion_diagnostics WHERE caseId=? AND eventId=?").run(current.caseId,target.key); break;
              case "identity-mail-events": {
                preserveSource(current,"mailbox",target.key as string); consumed+=13;
                db.prepare("DELETE FROM deletion_events WHERE caseId=? AND eventId=?").run(current.caseId,target.key); break;
              }
              case "identity-mail-state": case "identity-delivery": case "identity-lifecycle":
                db.prepare(`DELETE FROM ${target.phase === "identity-mail-state" ? "deletion_state" : target.phase === "identity-delivery" ? "deliveries" : "case_lifecycle"} WHERE caseId=?`).run(current.caseId); break;
              case "identity-delivery-attempts": {
                const key = target.key as readonly [string,number];
                db.prepare("DELETE FROM delivery_attempts WHERE caseId=? AND ordinal=?").run(...key); break;
              }
              case "identity-replay-reservations": fail("ERASURE_PENDING");
              case "identity-case-reservation": {
                const key = target.key as readonly [string,string];
                if (db.prepare("SELECT 1 FROM reservations INDEXED BY cleanup_replay_winner WHERE cleanupWinner=? LIMIT 1").get(key[1]) || db.prepare("SELECT 1 FROM cleanup_manifests WHERE reservationId=? LIMIT 1").get(key[1])) fail("ERASURE_PENDING");
                consumed += 4;
                if(db.prepare("DELETE FROM cases WHERE id=? AND reservationId=?").run(...key).changes !== 1 || db.prepare("DELETE FROM reservations WHERE id=? AND active=0").run(key[1]).changes !== 1)fail();
                consumed++; break;
              }
            }
            consumed++;
          }
          if (page.next) return { next: page.next, complete: false };
          const fresh = owner.rowPage(commitEventId, null, 64); consumed += fresh.consumedItems;
          if (fresh.next || fresh.targets.length) return { next: null, complete: false };
          const retired = current.scope === "processing_contact" || current.scope === "public_token" || current.scope === "incident_identity" ? true : retireAccepted(current); consumed += 50;
          if (!retired) return { next: null, complete: false };
          assertMaintenance(run, deps.repository);
          db.prepare("UPDATE erasure_obligations SET stage='database-maintenance-pending' WHERE commitEventId=? AND stage='rows-pending'").run(commitEventId); consumed++;
          return { next: null, complete: true };
        }).immediate();
        if (pendingRetirement) retirement = pendingRetirement;
        return { value, consumedItems: consumed };
      } finally { pendingRetirement = undefined; }
    }));
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  const dueStreams = [
    ["cases", "payloadDeleteAfter", "id", "maintenance_payload_due", "processing_payload", 0],
    ["cases", "contactDeleteAfter", "id", "maintenance_contact_due", "processing_contact", 0],
    ["cases", "acceptedAt", "id", "maintenance_accepted_due", "public_token", 7],
    ["cases", "acceptedAt", "id", "maintenance_accepted_due", "incident_identity", 30],
    ["deliveries", "cleanupDueAt", "caseId", "maintenance_cleanup_due", "processing_payload", 0],
    ["deliveries", "cleanupDueAt", "caseId", "maintenance_cleanup_due", "processing_contact", 0],
    ["deliveries", "determinedAt", "caseId", "maintenance_invalid_due", "incident_identity", 1],
    ["case_lifecycle", "deleteFrom", "caseId", "deletion_due", "identifying_register", 0],
    ["delivery_incident_resolutions", "recordedAt", "caseId", "maintenance_incident_resolution_due", "incident_identity", 0],
  ] as const;
  async function listDue(run: MaintenanceRun, maximumCandidates = 20): Promise<DuePage> {
    const remaining = maintenanceRemaining(run, deps.repository);
    // State query+row(2), cursor query+row(2), key query(1), lookahead(1),
    // two fairness writes(2); per parent row(1), two point queries+rows(4),
    // fixed resolution presence query+row(2) for contact-to-identity continuation.
    const limit = Math.min(maximumCandidates, remaining.selections, Math.floor((remaining.items - 8) / 7));
    if (limit < 1) return Object.freeze({ items: Object.freeze([]), hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, 8 + 7 * limit, "scalar", () => db.transaction(() => {
      assertMaintenance(run, deps.repository);
      const phase = (db.prepare("SELECT duePhase FROM maintenance_selectors WHERE singleton=1").get() as { duePhase: number }).duePhase;
      const cursor = db.prepare("SELECT keyAt,keyId FROM maintenance_due_cursors WHERE stream=?").get(phase) as { keyAt: string; keyId: string };
      const [table, column, id, index, scope, days] = dueStreams[phase];
      const cutoff = phase === 7 ? berlinDate(new Date(remaining.now)) : new Date(Date.parse(remaining.now) - days * 86400000).toISOString();
      const selected = db.prepare(`SELECT ${column} AS keyAt,${id} AS caseId FROM ${table} INDEXED BY ${index} WHERE ${phase === 6 ? "category='invalid' AND " : ""}${column}<=? AND (${column},${id})>(?,?) ORDER BY ${column},${id} LIMIT ?`).all(cutoff, cursor.keyAt, cursor.keyId, limit + 1) as { keyAt: string; caseId: ApplicationId }[];
      const page = selected.slice(0, limit), items: DueCandidate[] = []; let consumed = 7 + selected.length;
      for (const row of page) {
        applicationId(row.caseId); selectMaintenance(run, deps.repository, `case:${row.caseId}`);
        let target: EraseScope = scope;
        if (scope === "processing_contact") {
          consumed++;
          if (db.prepare("SELECT 1 FROM delivery_incident_resolutions WHERE caseId=?").get(row.caseId)) { consumed++; target = "incident_identity"; }
        }
        const covering = target === "processing_contact" || target === "public_token" ? [target, "incident_identity", "identifying_register"] : [target, "identifying_register"];
        consumed++;
        const covered = db.prepare(`SELECT 1 FROM erasure_scopes WHERE caseId=? AND scope IN(${covering.map(() => "?").join(",")}) LIMIT 1`).get(row.caseId, ...covering);
        if (covered) { consumed++; continue; }
        consumed++;
        if (db.prepare("SELECT 1 FROM erasure_events WHERE caseId=? AND phase='proposed' LIMIT 1").get(row.caseId)) { consumed++; continue; }
        const candidate = Object.freeze({ caseId: row.caseId, scope: target, dueAt: phase === 7 ? row.keyAt : new Date(Date.parse(row.keyAt) + days * 86400000).toISOString() });
        candidates.set(candidate, { run, used: false }); items.push(candidate);
      }
      const last = selected.length > limit ? page.at(-1) : undefined;
      db.prepare("UPDATE maintenance_due_cursors SET keyAt=?,keyId=? WHERE stream=?").run(last?.keyAt ?? "", last?.caseId ?? "", phase);
      // Rotate after EVERY bounded page; a large/blocked stream cannot monopolize.
      db.prepare("UPDATE maintenance_selectors SET duePhase=? WHERE singleton=1").run((phase + 1) % dueStreams.length);
      return { value: Object.freeze({ items: Object.freeze(items), hasMore: true }), consumedItems: consumed };
    }).immediate());
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  function reconcileSelectedClaim(id: ApplicationId, run: MaintenanceRun): boolean {
    assertMaintenance(run, deps.repository); deps.guard(id);
    const row = db.prepare("SELECT claimOwner,claimedAt,claimToken,claimKind,deliveryState FROM cases WHERE id=?").get(id) as { claimOwner: string | null; claimedAt: string | null; claimToken: string | null; claimKind: string | null; deliveryState: string } | undefined;
    if (!row || [row.claimOwner, row.claimedAt, row.claimToken, row.claimKind].every(value => value === null)) return false;
    if (!row.claimOwner || !/^[A-Za-z0-9_-]{1,128}$/.test(row.claimOwner) || !row.claimToken || !/^[a-f0-9]{64}$/.test(row.claimToken) || !row.claimedAt || !["prepare", "send", "reconcile"].includes(row.claimKind ?? "")) fail("ERASURE_CLAIM_ACTIVE");
    try { utcInstant(row.claimedAt); } catch { fail("ERASURE_CLAIM_ACTIVE"); }
    if ((row.claimKind === "prepare" && row.deliveryState !== "scanning") || (row.claimKind === "send" && !["ready", "sending"].includes(row.deliveryState)) || (row.claimKind === "reconcile" && !["smtp_accepted", "uncertain"].includes(row.deliveryState))) fail("ERASURE_CLAIM_ACTIVE");
    // Same continuous runtime hold includes prior workers. Full scopes/senders
    // were settled at begin; no ordinary producer may have started since.
    assertMaintenance(run, deps.repository);
    const changed = db.prepare("UPDATE cases SET claimOwner=NULL,claimedAt=NULL,claimToken=NULL,claimKind=NULL WHERE id=? AND claimOwner=? AND claimedAt=? AND claimToken=? AND claimKind=? AND deliveryState=?").run(id, row.claimOwner, row.claimedAt, row.claimToken, row.claimKind, row.deliveryState).changes;
    if (changed !== 1) fail("ERASURE_CLAIM_ACTIVE");
    assertMaintenance(run, deps.repository); return true;
  }
  async function prepareDue(candidate: DueCandidate, run: MaintenanceRun) {
    const record = candidates.get(candidate);
    if (!record || record.run !== run || record.used) fail("ERASURE_CANDIDATE_INVALID");
    record.used = true;
    assertMaintenanceSettled(run, deps.repository);
    // prepareCommit256 + original guard20 + claim query/row2 + exact CAS1.
    const result = await maintenanceCommand(run, deps.repository, 279, "scalar", () => deps.guarded(candidate.caseId, async () => {
      assertMaintenance(run, deps.repository);
      return db.transaction(() => { reconcileSelectedClaim(candidate.caseId, run); const event = prepareCommit(candidate.caseId, candidate.scope); assertMaintenance(run, deps.repository); return { value: event, consumedItems: 279 }; }).immediate();
    }));
    return Object.freeze({ event: result.value, consumedItems: result.consumedItems });
  }
  async function prepareDueBatch(run: MaintenanceRun) {
    // Three candidates plus their complete guarded preparation fit one shared
    // run (29 + 3*279 = 866). Candidate provenance never escapes to a later run.
    if (maintenanceRemaining(run, deps.repository).items < 866) return Object.freeze({ prepared: 0, consumedItems: 0 });
    const page = await listDue(run, 3);
    let consumedItems = page.consumedItems;
    for (const candidate of page.items) consumedItems += (await prepareDue(candidate, run)).consumedItems;
    return Object.freeze({ prepared: page.items.length, consumedItems });
  }
  async function acknowledgeCommit(event: EraseJournalEvent, receipt: DurableReceipt, run: MaintenanceRun) {
    if (event[3] !== "erase_commit") fail();
    assertMaintenanceSettled(run, deps.repository);
    const result = await maintenanceCommand(run, deps.repository, 215, "scalar", () => deps.guarded(event[4][0], async () => {
      selectMaintenance(run, deps.repository, `case:${event[4][0]}`);
      reconcileSelectedClaim(event[4][0], run);
      acknowledgeRecorded(event, receipt);
      return { value: undefined, consumedItems: 215 };
    }));
    return Object.freeze({ consumedItems: result.consumedItems });
  }
  // Release evidence is built by the original connection from examined keys,
  // never by LIMIT after an unbounded uncovered-row filter. This read-only
  // continuation is invalidated by ANY intervening original/external DB write
  // or independently applied journal head change.
  let finalCheck: { stamp: string; phase: number; at: string; id: string; nextWakeAt: string | null; hasWork: boolean; complete: boolean } | undefined;
  let finalSanitation: string | undefined;
  function finalStamp(): string {
    if (!deps.journal) fail("ERASURE_UNVERIFIED");
    const credit = maintenanceBarrierCredits(deps.journal);
    const changes = (db.prepare("SELECT total_changes() AS value").get() as { value: number }).value;
    return JSON.stringify([changes - credit, db.pragma("data_version", { simple: true })]);
  }
  async function finalWorkBatch(run: MaintenanceRun) {
    const phase = maintenanceReadPhase(run, deps.repository);
    const now = maintenanceRemaining(run, deps.repository, phase).now;
    const result = await maintenanceCommand(run, deps.repository, 200, phase, async () => {
      const stamp = finalStamp();
      if (!finalCheck || finalCheck.stamp !== stamp || (finalCheck.nextWakeAt !== null && finalCheck.nextWakeAt <= now)) finalCheck = { stamp, phase: 0, at: "", id: "", nextWakeAt: null, hasWork: false, complete: false };
      const state = finalCheck;
      if (phase === "post-release" && finalSanitation !== stamp) { state.hasWork = true; state.complete = true; }
      const advance = () => { state.phase++; state.at = ""; state.id = ""; };
      const future = (at: string) => { if (state.nextWakeAt === null || at < state.nextWakeAt) state.nextWakeAt = at; };
      if (!state.complete && state.phase < dueStreams.length) {
        const [table, column, id, index, scope, days] = dueStreams[state.phase];
        const row = db.prepare(`SELECT ${column} AS keyAt,${id} AS caseId FROM ${table} INDEXED BY ${index} WHERE ${state.phase === 6 ? "category='invalid' AND " : ""}(${column},${id})>(?,?) ORDER BY ${column},${id} LIMIT 1`).get(state.at, state.id) as { keyAt: string; caseId: ApplicationId } | undefined;
        if (!row) advance();
        else {
          selectMaintenance(run, deps.repository, `case:${row.caseId}`, phase);
          state.at = row.keyAt; state.id = row.caseId;
          const covering = scope === "processing_contact" || scope === "public_token" ? [scope, "incident_identity", "identifying_register"] : [scope, "identifying_register"];
          const covered = db.prepare(`SELECT 1 FROM erasure_scopes WHERE caseId=? AND scope IN(${covering.map(() => "?").join(",")}) LIMIT 1`).get(row.caseId, ...covering);
          if (!covered) {
            const dueAt = state.phase === 7 ? new Date(Date.parse(row.keyAt) - 2 * 3600000).toISOString() : new Date(Date.parse(row.keyAt) + days * 86400000).toISOString();
            if (state.phase === 7 ? row.keyAt > berlinDate(new Date(now)) : dueAt > now) { future(dueAt); advance(); }
            else if (scope !== "identifying_register" || await deps.guarded(row.caseId, async () => currentFinalEvidence(row.caseId) !== null)) state.hasWork = true;
          }
        }
      } else if (!state.complete && state.phase === dueStreams.length) {
        const row = db.prepare("SELECT commitEventId,stage,historicalDone FROM erasure_obligations WHERE commitEventId>? ORDER BY commitEventId LIMIT 1").get(state.id) as { commitEventId: string; stage: string; historicalDone: string | null } | undefined;
        if (!row) advance();
        else {
          state.id = row.commitEventId;
          const current = work(row.commitEventId);
          selectMaintenance(run, deps.repository, `case:${current.caseId}`, phase);
          if (row.stage !== "locally-complete" || row.historicalDone === null || locallyCompleted.get(row.commitEventId) !== JSON.stringify(current)) state.hasWork = true;
        }
      } else if (!state.complete && state.phase === dueStreams.length + 1) {
        if (db.prepare("SELECT 1 FROM erasure_events INDEXED BY maintenance_proposed WHERE phase='proposed' LIMIT 1").get() || db.prepare("SELECT 1 FROM erasure_manifests LIMIT 1").get() || db.prepare("SELECT 1 FROM cleanup_manifests LIMIT 1").get()) state.hasWork = true;
        advance();
      } else if (!state.complete && state.phase === dueStreams.length + 2) {
        const row = db.prepare("SELECT id,active,expiresAt,cleanupDisposition FROM reservations WHERE id>? ORDER BY id LIMIT 1").get(state.id) as { id: string; active: number; expiresAt: string; cleanupDisposition: string | null } | undefined;
        if (!row) advance();
        else {
          state.id = row.id; selectMaintenance(run, deps.repository, `reservation:${row.id}`, phase);
          if (row.active === 1) {
            if (row.cleanupDisposition !== null || row.expiresAt <= now) state.hasWork = true;
            else future(row.expiresAt);
          }
        }
      } else if (!state.complete && state.phase < dueStreams.length + 7) {
        const [table, column, index] = [["abuse_events", "expiresAt", "abuse_events_expiry"], ["deletion_diagnostics", "expiresAt", "maintenance_diagnostics_expiry"], ["deletion_searches", "expiresAt", "maintenance_searches_expiry"], ["auth_attempts", "at", "maintenance_auth_expiry"]][state.phase - dueStreams.length - 3];
        const row = db.prepare(`SELECT ${column} AS at FROM ${table} INDEXED BY ${index} ORDER BY ${column},rowid LIMIT 1`).get() as { at: string } | undefined;
        if (row) { const dueAt = new Date(Date.parse(row.at) + (state.phase === dueStreams.length + 6 ? 900000 : 0)).toISOString(); if (dueAt <= now) state.hasWork = true; else future(dueAt); }
        advance();
      }
      if (state.hasWork || state.phase >= dueStreams.length + 7) state.complete = true;
      if (finalStamp() !== state.stamp) fail("ERASURE_UNVERIFIED");
      return { value: { complete: state.complete, hasWork: state.hasWork, nextWakeAt: state.nextWakeAt }, consumedItems: 200 };
    });
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  function assertFinalWork(): void {
    if (!deps.journal?.observation() || !finalCheck?.complete || finalCheck.hasWork || finalCheck.stamp !== finalStamp() || (finalCheck.nextWakeAt !== null && finalCheck.nextWakeAt <= deps.now())) fail("ERASURE_PENDING");
  }
  function assertSanitizedFinalWork(): void {
    assertFinalWork();
    if (!finalSanitation || finalSanitation !== finalStamp()) fail("ERASURE_SANITATION_REQUIRED");
  }
  async function checkpointFinalDatabase(run: MaintenanceRun) {
    const maximum = 3 * (ancestry.length + 10) + 20;
    const result = await maintenanceCommand(run, deps.repository, maximum, "filesystem", () => {
      assertFinalWork(); safeDatabase(run);
      let checkpoint: { busy: number; log: number; checkpointed: number }[];
      try { checkpoint = db.pragma("wal_checkpoint(TRUNCATE)") as typeof checkpoint; }
      catch (error) {
        if (error instanceof Error && "code" in error && (error.code === "SQLITE_BUSY" || error.code === "SQLITE_LOCKED")) return { value: false, consumedItems: maximum };
        throw error;
      }
      if (checkpoint.length !== 1 || checkpoint[0].busy !== 0 || checkpoint[0].log !== 0 || checkpoint[0].checkpointed !== 0) return { value: false, consumedItems: maximum };
      safeDatabase(run, true); assertFinalWork(); finalSanitation = finalStamp();
      return { value: true, consumedItems: maximum };
    });
    return Object.freeze({ complete: result.value, consumedItems: result.consumedItems });
  }
  async function expireGlobalBatch(run: MaintenanceRun) {
    const remaining = maintenanceRemaining(run, deps.repository);
    // Fixed state query/row2, secure_delete1, select1, fairness write1;
    // auth clock query/row+write3. Each selected row and exact delete cost2.
    const limit = Math.min(100, Math.floor((remaining.items - 8) / 2));
    if (limit < 1) return Object.freeze({ deleted: 0, hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, 8 + 2 * limit, "scalar", () => db.transaction(() => {
      assertMaintenance(run, deps.repository);
      if (db.pragma("secure_delete", { simple: true }) !== 1) fail("ERASURE_SANITATION_REQUIRED");
      const phase = (db.prepare("SELECT globalPhase FROM maintenance_selectors WHERE singleton=1").get() as { globalPhase: number }).globalPhase;
      const [table, column, index] = [["abuse_events", "expiresAt", "abuse_events_expiry"], ["deletion_diagnostics", "expiresAt", "maintenance_diagnostics_expiry"], ["deletion_searches", "expiresAt", "maintenance_searches_expiry"], ["auth_attempts", "at", "maintenance_auth_expiry"]][phase];
      let consumed = 5;
      if (phase === 3) { advanceAuthMaintenanceClock(db, utcInstant(remaining.now)); consumed += 3; }
      const cutoff = phase === 3 ? new Date(Date.parse(remaining.now) - 900000).toISOString() : remaining.now;
      const rows = db.prepare(`SELECT rowid FROM ${table} INDEXED BY ${index} WHERE ${column}<=? ORDER BY ${column},rowid LIMIT ?`).all(cutoff, limit) as { rowid: number }[];
      let deleted = 0;
      for (const row of rows) {
        if (!Number.isSafeInteger(row.rowid)) fail();
        deleted += db.prepare(`DELETE FROM ${table} WHERE rowid=? AND ${column}<=?`).run(row.rowid, cutoff).changes; consumed += 2;
      }
      assertMaintenance(run, deps.repository);
      db.prepare("UPDATE maintenance_selectors SET globalPhase=? WHERE singleton=1").run((phase + 1) % 4);
      return { value: Object.freeze({ deleted, hasMore: true }), consumedItems: consumed };
    }).immediate());
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  async function listPending(run: MaintenanceRun) {
    const remaining = maintenanceRemaining(run, deps.repository);
    // Two state/cursor query+row pairs4, optional projection query+row2,
    // <=4 disjoint indexed range queries/lookahead1/two writes2. Each key1 + phase
    // point query/row2 + verified work's two fixed join pairs4 + original
    // same-case proposed-event point query/row2 = at most9.
    const limit = Math.min(20, remaining.selections, Math.floor((remaining.items - 13) / 9));
    if (limit < 1) return Object.freeze({ items: Object.freeze([]), hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, 13 + 9 * limit, "scalar", () => db.transaction(() => {
      const phase = (db.prepare("SELECT pendingPhase FROM maintenance_selectors WHERE singleton=1").get() as { pendingPhase: number }).pendingPhase;
      const cursor = db.prepare("SELECT keyAt,keyCase,keyEvent FROM maintenance_pending_cursors WHERE stream=?").get(phase) as { keyAt: string; keyCase: string; keyEvent: string };
      const selected: { keyAt: string; caseId: ApplicationId; eventId: string }[] = []; let consumed = 6;
      const select = (sql: string, args: readonly unknown[]) => {
        if (selected.length >= limit + 1) return;
        consumed++; selected.push(...db.prepare(sql).all(...args, limit + 1 - selected.length) as typeof selected);
      };
      if (phase === 0) {
        // SQLite does not seek a row-value bound beginning with an expression.
        // Disjoint prefix ranges avoid scanning equal-time predecessors.
        const prefix = "SELECT json_extract(event,'$[2]') AS keyAt,caseId,eventId FROM erasure_events INDEXED BY maintenance_proposed WHERE phase='proposed' AND ";
        const order = " ORDER BY json_extract(event,'$[2]'),caseId,eventId LIMIT ?";
        select(prefix + "json_extract(event,'$[2]')=? AND caseId=? AND eventId>? ORDER BY eventId LIMIT ?", [cursor.keyAt, cursor.keyCase, cursor.keyEvent]);
        select(prefix + "json_extract(event,'$[2]')=? AND caseId>? ORDER BY caseId,eventId LIMIT ?", [cursor.keyAt, cursor.keyCase]);
        select(prefix + "json_extract(event,'$[2]')>?" + order, [cursor.keyAt]);
      } else {
        const projection = db.prepare("SELECT pass FROM journal_projection WHERE singleton=1").get() as { pass: string }; consumed += 2;
        const prefix = "SELECT sequence AS keyAt,caseId,commitEventId AS eventId FROM erasure_obligations INDEXED BY maintenance_completed WHERE stage='locally-complete' AND inspectionGeneration=? AND ";
        const order = " ORDER BY length(sequence),sequence,caseId,commitEventId LIMIT ?", length = cursor.keyAt.length;
        select(prefix + "length(sequence)=? AND sequence=? AND caseId=? AND commitEventId>? ORDER BY commitEventId LIMIT ?", [projection.pass, length, cursor.keyAt, cursor.keyCase, cursor.keyEvent]);
        select(prefix + "length(sequence)=? AND sequence=? AND caseId>? ORDER BY caseId,commitEventId LIMIT ?", [projection.pass, length, cursor.keyAt, cursor.keyCase]);
        select(prefix + "length(sequence)=? AND sequence>? ORDER BY sequence,caseId,commitEventId LIMIT ?", [projection.pass, length, cursor.keyAt]);
        select(prefix + "length(sequence)>?" + order, [projection.pass, length]);
      }
      consumed += selected.length;
      const page = selected.slice(0, limit), items: PendingMaintenance[] = [];
      for (const key of page) {
        applicationId(key.caseId); selectMaintenance(run, deps.repository, `case:${key.caseId}`); consumed += 2;
        if (phase === 0) {
          const row = db.prepare("SELECT event FROM erasure_events WHERE eventId=? AND caseId=? AND phase='proposed'").get(key.eventId, key.caseId) as { event: string } | undefined;
          if (!row) fail(); const event = decodeJournalEvent(row.event);
          if ((event[3] !== "erase_commit" && event[3] !== "erase_done") || event[1] !== key.eventId || event[4][0] !== key.caseId || event[2] !== key.keyAt) fail();
          items.push(Object.freeze({ kind: "proposed", event }));
        } else {
          const row = db.prepare("SELECT historicalDone FROM erasure_obligations WHERE commitEventId=?").get(key.eventId) as { historicalDone: string | null };
          if (row.historicalDone !== null) continue;
          const proposed=db.prepare("SELECT eventId,event FROM erasure_events INDEXED BY erasure_one_pending WHERE caseId=? AND phase='proposed'").get(key.caseId) as {eventId:string;event:string}|undefined;
          consumed+=2;
          if(proposed){
            const event=decodeJournalEvent(proposed.event);
            if((event[3]!=="erase_commit"&&event[3]!=="erase_done")||event[1]!==proposed.eventId||event[4][0]!==key.caseId)fail();
            items.push(Object.freeze({kind:"proposed",event}));continue;
          }
          const current = work(key.eventId); consumed += 4;
          if (current.caseId !== key.caseId || current.stage !== "locally-complete") fail();
          items.push(Object.freeze({ kind: "needs-done", work: current }));
        }
      }
      const last = selected.length > limit ? page.at(-1) : undefined;
      db.prepare("UPDATE maintenance_pending_cursors SET keyAt=?,keyCase=?,keyEvent=? WHERE stream=?").run(last?.keyAt ?? "", last?.caseId ?? "", last?.eventId ?? "", phase);
      db.prepare("UPDATE maintenance_selectors SET pendingPhase=? WHERE singleton=1").run(1 - phase);
      assertMaintenance(run, deps.repository);
      return { value: Object.freeze({ items: Object.freeze(items), hasMore: true }), consumedItems: consumed };
    }).immediate());
    return Object.freeze({ ...result.value, consumedItems: result.consumedItems });
  }
  async function listCommitted(run: MaintenanceRun): Promise<ErasureWorkPage> {
    const remaining = maintenanceRemaining(run, deps.repository), maximum = Math.min(remaining.items, 4 + 6 * remaining.selections);
    if (maximum < 10) return Object.freeze({ items: Object.freeze([]), hasMore: true, consumedItems: 0 });
    const result = await maintenanceCommand(run, deps.repository, maximum, "scalar", () => {
      const page = owner.listWork(maximum);
      for (const work of page.items) selectMaintenance(run, deps.repository, `commit:${work.commitEventId}`);
      return { value: page, consumedItems: page.consumedItems };
    });
    return result.value;
  }
  async function reconcileClaim(commitEventId: string, run: MaintenanceRun) {
    assertMaintenanceSettled(run, deps.repository);
    // Existing guard resolution reserve20 + selected claim query/row/CAS3.
    const result = await maintenanceCommand(run, deps.repository, 23, "scalar", async () => {
      const initial = work(commitEventId); selectMaintenance(run, deps.repository, `commit:${commitEventId}`);
      return deps.guarded(initial.caseId, async () => {
        assertMaintenance(run, deps.repository);
        return db.transaction(() => { const current = work(commitEventId); if (current.caseId !== initial.caseId) fail(); return { value: reconcileSelectedClaim(current.caseId, run), consumedItems: 23 }; }).immediate();
      });
    });
    return Object.freeze({ changed: result.value, consumedItems: result.consumedItems });
  }
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
    const early = validatedEarlyCleanup(row, delivery);
    // Fixed proof+parent point reads (4 credits) fit the original conservative
    // prepare256/ack192 admission reserves; no history scan or nested budget.
    const resolution = scope === "incident_identity" ? readIncidentResolution(db, row.id) : null;
    const deadline = scope === "processing_payload" ? Math.min(Date.parse(row.payloadDeleteAfter), early ?? Infinity)
      : scope === "processing_contact" ? Math.min(Date.parse(row.contactDeleteAfter), early ?? Infinity)
      : delivery.confirmedAt ? Infinity : delivery.category === "invalid" ? Math.min(Date.parse(row.contactDeleteAfter), Date.parse(delivery.determinedAt!) + day) : Math.min(at + 30 * day, resolution ? Date.parse(resolution.recordedAt) : Infinity);
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
    if (event[3] !== "erase_commit") fail();
    deps.guard(event[4][0]);
    const raw=deps.readCase(event[4][0]), scope=deps.scope();
    const identity=db.prepare("SELECT sessionHash,idempotencyKey FROM cases WHERE id=?").get(event[4][0]) as {sessionHash:import("./types").Digest;idempotencyKey:string}|undefined;
    if(raw.claimToken!==null)fail("ERASURE_CLAIM_ACTIVE");
    if(!identity||replayAssociation(scope,identity.sessionHash,identity.idempotencyKey)!==event[4][3])fail();
    if(event[4][1]!=="identifying_register")due(raw,deps.delivery(event[4][0]),event[4][1],utcInstant(deps.now()));
    if (event[4][1] === "identifying_register") {
      const evidence=currentFinalEvidence(event[4][0]),payload=event[4];
      if (!evidence || String(evidence.caseVersion)!==payload[6] || evidence.clear.clearEvent[1]!==payload[7] || evidence.externalAttestationAssociation!==payload[8]) fail("ERASURE_FINAL_EVIDENCE_REQUIRED");
    }
    acknowledgeRecorded(event,receipt);
  }
  // A replay-verified commit is deletion authority even after its parent was
  // minimized. Recovery validates the exact original event/receipt and current
  // projection, without re-running pre-commit business eligibility.
  function acknowledgeRecorded(event: EraseJournalEvent, receipt: DurableReceipt): void {
    deps.guard(event[4][0]);
    const p = db.prepare("SELECT * FROM erasure_events WHERE eventId=?").get(event[1]) as Phase | undefined;
    if (!p || p.caseId !== event[4][0] || p.event !== encodeJournalEvent(event) || event[3] !== "erase_commit") fail();
    const current = work(event[1]), scope = deps.scope();
    if (scope.ledgerId !== current.ledgerId || scope.historyEpoch !== current.historyEpoch || scope.associationKeyId !== current.associationKeyId) fail();
    if (typeof receipt.entry !== "string" || typeof receipt.head !== "string" || Buffer.byteLength(receipt.entry)>4096 || Buffer.byteLength(receipt.head)>1024) fail();
    let entry: unknown, head: unknown; try { entry = JSON.parse(receipt.entry); head = JSON.parse(receipt.head); } catch { fail(); }
    if (!Array.isArray(entry) || !Array.isArray(head) || entry.length!==2 || head.length!==2 || !Array.isArray(entry[0]) || !Array.isArray(head[0]) || entry[0].length!==8 || head[0].length!==9 || typeof entry[1]!=="string" || typeof head[1]!=="string" || !/^[A-Za-z0-9_-]{86}$/.test(entry[1]) || !/^[A-Za-z0-9_-]{86}$/.test(head[1]) || JSON.stringify(entry)!==receipt.entry || JSON.stringify(head)!==receipt.head) fail();
    const e=entry[0],h=head[0];
    if (e[0]!=="tj-journal-entry-v1" || h[0]!=="tj-journal-head-v1" || e[1]!==scope.ledgerId || e[2]!==scope.historyEpoch || h[1]!==e[1] || h[2]!==e[2] || encodeJournalEvent(e[7])!==p.event || e[4]!==current.sequence || h[4]!==current.sequence || h[5]!==current.entryHash || h[6]!==event[1] || h[7]!==event[2] || createHash("sha256").update("tj-journal-entry-hash-v1\n"+JSON.stringify(e)).digest("hex")!==current.entryHash) fail();
    if(p.phase==="acknowledged") { if(p.entry!==receipt.entry||p.head!==receipt.head) fail(); return; }
    db.prepare("UPDATE erasure_events SET phase='acknowledged',entry=?,head=? WHERE eventId=? AND phase='proposed'").run(receipt.entry,receipt.head,event[1]);
  }
  function budget(value:number):void { if(!Number.isSafeInteger(value)||value<1||value>1000) fail("ERASURE_BUDGET_INVALID"); }
  function incidentCoverage(id: ApplicationId, target: "processing_payload" | "incident_identity"): ErasureWork | null {
    const scope = deps.scope();
    const selected = db.prepare("SELECT eventId FROM erasure_scopes WHERE caseId=? AND scope IN(?, 'identifying_register') AND committed=1 ORDER BY scope LIMIT 1").get(id, target) as { eventId: string } | undefined;
    if (!selected) return null;
    const current = work(selected.eventId);
    if (current.caseId !== id || current.scope !== target && current.scope !== "identifying_register" || current.ledgerId !== scope.ledgerId || current.historyEpoch !== scope.historyEpoch || current.associationKeyId !== scope.associationKeyId) fail("ERASURE_UNVERIFIED");
    const identity = db.prepare("SELECT sessionHash,idempotencyKey FROM cases WHERE id=?").get(id) as { sessionHash: import("./types").Digest; idempotencyKey: string } | undefined;
    if (!identity || replayAssociation(scope, identity.sessionHash, identity.idempotencyKey) !== current.replayAssociation) fail("ERASURE_UNVERIFIED");
    return current;
  }
  function prepareIncidentResolution(id: ApplicationId): void {
    deps.guard(id);
    if (!readIncidentResolution(db, id)) fail();
    // Reuse only original independently verified coverage, never local flags.
    if (!incidentCoverage(id, "processing_payload")) prepareCommit(id, "processing_payload");
    else if (!incidentCoverage(id, "incident_identity")) prepareCommit(id, "incident_identity");
  }
  function incidentResolutionRetention(id: ApplicationId): IncidentResolutionRetention {
    // Unavailable/stale independent observation cannot strengthen the result.
    if (!deps.journal?.observation()) return "commit_pending";
    const payload = incidentCoverage(id, "processing_payload"), identity = incidentCoverage(id, "incident_identity");
    if (!payload || !identity) return "commit_pending";
    return [payload, identity].every(value => value.stage === "locally-complete" && locallyCompleted.get(value.commitEventId) === JSON.stringify(value)) ? "local_scopes_complete" : "committed_cleanup_pending";
  }
  function adminRetention(id: ApplicationId): import("./types").AdminCaseDetail["retention"] {
    const scope = deps.scope();
    const identity = db.prepare("SELECT sessionHash,idempotencyKey FROM cases WHERE id=?").get(id) as { sessionHash: import("./types").Digest; idempotencyKey: string } | undefined;
    if (!identity) fail();
    const association = replayAssociation(scope, identity.sessionHash, identity.idempotencyKey);
    const observed = new Map<EraseScope, import("./types").AdminScopeState>();
    const selectedEvents = new Set<string>();
    for (const target of scopes) {
      const selected = db.prepare("SELECT eventId,committed FROM erasure_scopes WHERE caseId=? AND scope=?").get(id, target) as { eventId: string; committed: number } | undefined;
      if (!selected) { observed.set(target, "not_committed"); continue; }
      selectedEvents.add(selected.eventId);
      if (![0, 1].includes(selected.committed)) fail();
      if (selected.committed === 0) {
        const p = db.prepare("SELECT event,phase FROM erasure_events WHERE eventId=? AND caseId=?").get(selected.eventId, id) as { event: string; phase: string } | undefined;
        if (!p || p.phase !== "proposed") fail();
        const event = decodeJournalEvent(p.event);
        if (event[1] !== selected.eventId || event[3] !== "erase_commit" || event[4][0] !== id || event[4][1] !== target || event[4][2] !== scope.associationKeyId || event[4][3] !== association) fail();
        observed.set(target, "commit_pending"); continue;
      }
      const current = work(selected.eventId);
      if (current.caseId !== id || current.scope !== target || current.ledgerId !== scope.ledgerId || current.historyEpoch !== scope.historyEpoch || current.associationKeyId !== scope.associationKeyId || current.replayAssociation !== association || !["rows-pending", "database-maintenance-pending", "locally-complete"].includes(current.stage)) fail();
      observed.set(target, current.stage === "locally-complete" && locallyCompleted.get(current.commitEventId) === JSON.stringify(current) ? "local_complete" : "committed_cleanup_pending");
    }
    const pending = db.prepare("SELECT eventId,event FROM erasure_events WHERE caseId=? AND phase='proposed' LIMIT 2").all(id) as { eventId: string; event: string }[];
    if (pending.length > 1) fail();
    if (pending.length) {
      const event = decodeJournalEvent(pending[0].event);
      if (event[1] !== pending[0].eventId || event[4][0] !== id) fail();
      if (event[3] === "erase_commit") { if (!selectedEvents.has(event[1])) fail(); }
      else if (event[3] === "erase_done") { if (!selectedEvents.has(event[4][1])) fail(); }
      else fail();
    }
    const covering = observed.get("identifying_register")!;
    const state = (target: EraseScope) => covering === "local_complete" || covering === "committed_cleanup_pending" ? covering : observed.get(target)!;
    return Object.freeze({ payload: state("processing_payload"), contact: state("processing_contact"), publicToken: state("public_token"), incidentIdentity: state("incident_identity"), identifyingRegister: covering });
  }
  const owner: ErasureOwner = Object.freeze({ journal:deps.journal,pending,prepareCommit,prepareIncidentResolution,incidentResolutionRetention,adminRetention,acknowledge,currentFinalEvidence,listDue: (run: MaintenanceRun) => listDue(run),prepareDue,prepareDueBatch,acknowledgeCommit,finalWorkBatch,assertFinalWork,assertSanitizedFinalWork,checkpointFinalDatabase,expireGlobalBatch,listPending,listCommitted,reconcileClaim,applyRowBatch,checkpointDatabase,prepareDone,acknowledgeDone,
    bindCustody(custody: CustodyLedger, config: CustodyConfig) {
      if (boundCustodies.has(custody)) fail("ERASURE_ALREADY_OWNED");
      // Captured only by this original composition. Future fixed 1c commands
      // invoke verify under their existing guard and consume immediately before
      // their synchronous transaction; no public getter/callback is exposed.
      const storage = createCustodyInventoryStorage(db, deps.repository, custody, config, { resolve: work, guard: deps.guard,
        locallyComplete: current => current.stage === "locally-complete" && locallyCompleted.get(current.commitEventId) === JSON.stringify(current),
        matchesReservation(current,identity) {
          const scope=deps.scope();
          if(scope.ledgerId!==current.ledgerId||scope.historyEpoch!==current.historyEpoch||scope.associationKeyId!==current.associationKeyId)fail("ERASURE_UNVERIFIED");
          return replayAssociation(scope,identity.sessionHash as import("./types").Digest,identity.idempotencyKey)===current.replayAssociation;
        },
        registerPhysicalVerifier(verifier) {
          if (physicalVerifiers.has(custody) || !boundCustodies.has(custody)) fail("ERASURE_ALREADY_OWNED");
          physicalVerifiers.set(custody, verifier);
        },
      }); boundCustodies.add(custody); return storage;
    },
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
  return owner;
}
