import type Database from "better-sqlite3";
import { applicationId, utcInstant, type CustodyConfig, type EraseScope, type ErasureRowCursor, type ErasureRowKey, type ErasureRowPage, type ErasureRowPhase, type ErasureRowTarget, type ErasureWork } from "./types";
import { MAX_SEALED_BYTES } from "./crypto";
import { artifactLimit,SCRATCH_RESERVE } from "./storage-budget";
import { createHash } from "node:crypto";
import { decodeJournalEvent,encodeJournalEvent } from "./ledger-contract";
import { consumeCustodyObservation, type CustodyObservation } from "./custody-erasure";
import { assertMaintenance, assertMaintenanceCustodyIdentity, assertOriginalMaintenanceCustody, selectMaintenance, type MaintenanceRun } from "./worker-maintenance";
import type { ApplicationRepository, CustodyLedger, ApplicationId } from "./types";

export interface InventoryJournal {
  pass:string;journalId:string;caseId:string|null;kind:"intake"|"artifact"|"processing";version:1|2|3;state:"reserved"|"committed"|"orphan";
  artifactKind:"bundle"|"mime"|null;budget:number;cleanupAfter:string;reservationId:string|null;generation:string|null;domain:string|null;allowance:number|null;
}
export interface InventoryObject {
  pass:string;journalId:string;slot:"incoming-sealed"|"original-sealed"|"artifact-staging"|"artifact-sealed"|"processing-directory"|"processing-file"|"journal"|"journal-temp";
  leaf:string;root:"incoming"|"custody"|"runtime";presence:"present"|"absent";device:number|null;inode:number|null;size:number|null;type:"file"|"directory"|null;
  uid:number|null;gid:number|null;mode:number|null;nlink:number|null;leaseState:"prepared"|"bounded"|"quiescent"|"released"|null;chargedBytes:number|null;leaseDevice:number|null;leaseInode:number|null;
}
export interface ErasureManifest {
  eraseCommitId:string;scanPass:string;journalId:string;slot:InventoryObject["slot"];leaf:string;expectedDevice:number|null;expectedInode:number|null;
  expectedSize:number;remainingCharge:number;phase:"planned"|"holders-released"|"absent-synced"|"metadata-finalized";
}
declare const acceptedBrand: unique symbol;
export interface AcceptedCandidate { readonly [acceptedBrand]: true }
export interface AcceptedOperands { readonly journal: Readonly<InventoryJournal>; readonly object: Readonly<InventoryObject>; readonly manifest: Readonly<ErasureManifest> | null; readonly relativePath: string }
interface AcceptedRecord extends Omit<AcceptedOperands, "manifest"> { manifest: Readonly<ErasureManifest> | null; run: MaintenanceRun; commit: string; request: string; authority: string | null; fingerprint: string }
declare const physicalBrand: unique symbol;
export interface PhysicalCompletion { readonly [physicalBrand]: true }
export interface PhysicalVerifier {
  readonly maximumItems: number;
  verify(commit: string, run: MaintenanceRun): Promise<Readonly<{ proof: PhysicalCompletion; consumedItems: number }>>;
  consume(proof: PhysicalCompletion, commit: string, run: MaintenanceRun): number;
}
interface AcceptedAuthority { resolve(commit: string): ErasureWork; guard(id: ApplicationId): object; registerPhysicalVerifier(verifier: PhysicalVerifier): void }
export interface SafetyCarry {eventId:string;caseId:string;source:"lifecycle"|"mailbox";event:string;phase:"proposed"|"acknowledged";entry:string|null;head:string|null;coveringCommit:string}
const journalFields="pass journalId caseId kind version state artifactKind budget cleanupAfter reservationId generation domain allowance";
const objectFields="pass journalId slot leaf root presence device inode size type uid gid mode nlink leaseState chargedBytes leaseDevice leaseInode";
const manifestFields="eraseCommitId scanPass journalId slot leaf expectedDevice expectedInode expectedSize remainingCharge phase";
function inventoryInvalid():never{throw new Error("ERASURE_INVENTORY_INVALID");}
function record(value:unknown,fields:string):Record<string,unknown>{
  if(!value||typeof value!=="object"||Array.isArray(value))inventoryInvalid();
  const keys=fields.split(" "),own=Reflect.ownKeys(value);
  if(own.length!==keys.length||own.some(key=>typeof key!=="string"||!keys.includes(key)))inventoryInvalid();
  for(const key of keys){const field=Object.getOwnPropertyDescriptor(value,key);if(!field||!("value" in field))inventoryInvalid();}
  return value as Record<string,unknown>;
}
function natural(value:unknown,max=Number.MAX_SAFE_INTEGER):value is number{return typeof value==="number"&&Number.isSafeInteger(value)&&value>=0&&value<=max;}
function token(value:unknown,size:number):value is string{return typeof value==="string"&&value.length===size&&/^[a-f0-9]+$/.test(value);}
function custodyId(value:unknown):value is string{return typeof value==="string"&&/^[a-f0-9-]{36}$/.test(value);}
export function validateSafetyCarry(value:unknown):Readonly<SafetyCarry>{
  try{
    const r=record(value,"eventId caseId source event phase entry head coveringCommit") as unknown as SafetyCarry;
    const event=decodeJournalEvent(r.event);applicationId(r.caseId);
    if(r.event!==encodeJournalEvent(event)||r.eventId!==event[1]||r.caseId!==event[4][0]||!token(r.coveringCommit,32)||!["proposed","acknowledged"].includes(r.phase))inventoryInvalid();
    if(r.source==="lifecycle"?event[3]!=="case_fence":r.source!=="mailbox"||!["attempt_intent","copy_mutation_started","copy_result","mailbox_clear_observed"].includes(event[3]))inventoryInvalid();
    if(r.phase==="proposed"){if(r.entry!==null||r.head!==null)inventoryInvalid();}
    else{
      if(typeof r.entry!=="string"||typeof r.head!=="string"||Buffer.byteLength(r.entry)>4096||Buffer.byteLength(r.head)>1024)inventoryInvalid();
      const e=JSON.parse(r.entry),h=JSON.parse(r.head);
      if(!Array.isArray(e)||!Array.isArray(h)||e.length!==2||h.length!==2||!Array.isArray(e[0])||!Array.isArray(h[0])||e[0].length!==8||h[0].length!==9||JSON.stringify(e)!==r.entry||JSON.stringify(h)!==r.head||typeof e[1]!=="string"||typeof h[1]!=="string"||!/^[A-Za-z0-9_-]{86}$/.test(e[1])||!/^[A-Za-z0-9_-]{86}$/.test(h[1]))inventoryInvalid();
      if(e[0][0]!=="tj-journal-entry-v1"||h[0][0]!=="tj-journal-head-v1"||e[0][1]!==h[0][1]||e[0][2]!==h[0][2]||e[0][3]!==h[0][3]||e[0][4]!==h[0][4]||e[0][6]!==h[0][8]||encodeJournalEvent(e[0][7])!==r.event||h[0][6]!==r.eventId||h[0][7]!==event[2]||createHash("sha256").update("tj-journal-entry-hash-v1\n"+JSON.stringify(e[0])).digest("hex")!==h[0][5])inventoryInvalid();
    }
    // Structural binding is not verification or authority to mark a proposal
    // committed. 11B must retain the source's phase and current owner evidence.
    return Object.freeze({...r});
  }catch{inventoryInvalid();}
}
// Pure structural evidence validation only. No DB mutation, filesystem access or
// holder/absence authority is minted here; 11B must supply actual observations.
export function validateInventoryJournal(value:unknown,reservation?:Readonly<{id:string;reservedBytes:number}>):Readonly<InventoryJournal>{
  return validateJournal(value, reservation?.id, reservation?.reservedBytes, false);
}
// Normalized recovery has an existing manifest/current-fact authority, not a
// fabricated live reservation document. Only the fixed storage below uses it.
function validateJournal(value:unknown,reservationId:string|undefined,reservedBytes:number|undefined,recovery:boolean):Readonly<InventoryJournal>{
  try{
    const r=record(value,journalFields) as unknown as InventoryJournal;
    if(!token(r.pass,32)||!custodyId(r.journalId)||!["intake","artifact","processing"].includes(r.kind)||![1,2,3].includes(r.version)||!["reserved","committed","orphan"].includes(r.state))inventoryInvalid();
    if(r.caseId!==null)applicationId(r.caseId);utcInstant(r.cleanupAfter);
    if(r.kind==="artifact"?!["bundle","mime"].includes(r.artifactKind!):r.artifactKind!==null)inventoryInvalid();
    const limit=r.kind==="processing"?SCRATCH_RESERVE:r.kind==="artifact"?artifactLimit(r.artifactKind!):2*MAX_SEALED_BYTES;
    if(!natural(r.budget,limit)||r.budget===0)inventoryInvalid();
    if(r.kind==="intake"){
      if(r.reservationId!==r.journalId||(!recovery&&(reservationId!==r.journalId||!natural(reservedBytes,2*MAX_SEALED_BYTES)||reservedBytes===0)))inventoryInvalid();
      const leased=r.generation!==null||r.domain!==null||r.allowance!==null;
      if(r.version>=2&&!leased)inventoryInvalid();
      if(leased&&(typeof r.generation!=="string"||!r.generation||typeof r.domain!=="string"||!r.domain||!natural(r.allowance,MAX_SEALED_BYTES)||r.allowance===0||(!recovery&&r.allowance!==reservedBytes!/2)))inventoryInvalid();
      if(recovery&&!leased)inventoryInvalid();
      if(Buffer.byteLength(JSON.stringify([r.generation,r.domain]))>4096)inventoryInvalid();
    }else if(r.reservationId!==null||r.generation!==null||r.domain!==null||r.allowance!==null)inventoryInvalid();
    return Object.freeze({...r});
  }catch{inventoryInvalid();}
}
export function validateInventoryObject(value:unknown,journal:Readonly<InventoryJournal>,config:CustodyConfig):Readonly<InventoryObject&{relativePath:string}>{
  try{
    const r=record(value,objectFields) as unknown as InventoryObject;
    if(r.pass!==journal.pass||r.journalId!==journal.journalId||typeof r.leaf!=="string"||!["present","absent"].includes(r.presence))inventoryInvalid();
    let root:InventoryObject["root"]="custody",name:string,limit:number;
    switch(r.slot){
      case "incoming-sealed":case "original-sealed":if(journal.kind!=="intake")inventoryInvalid();root=r.slot==="incoming-sealed"?"incoming":"custody";name=`${journal.journalId}.enc`;limit=journal.allowance??MAX_SEALED_BYTES;break;
      case "artifact-staging":case "artifact-sealed":if(journal.kind!=="artifact")inventoryInvalid();name=`${journal.journalId}.${journal.artifactKind}.${r.slot==="artifact-staging"?"staging":"enc"}`;limit=artifactLimit(journal.artifactKind!);break;
      case "processing-directory":case "processing-file":if(journal.kind!=="processing")inventoryInvalid();root="runtime";name=journal.journalId;limit=r.slot==="processing-directory"?Number.MAX_SAFE_INTEGER:SCRATCH_RESERVE;if(r.slot==="processing-file"){if(!/^(?:[0-4]\.data|document-[1-5]\.(?:pdf|jpg|png))$/.test(r.leaf))inventoryInvalid();name+=`/${r.leaf}`;}break;
      case "journal":name=`${journal.journalId}.journal`;limit=4096;break;
      case "journal-temp":if(!custodyId(r.leaf))inventoryInvalid();name=`${journal.journalId}.journal.${r.leaf}.tmp`;limit=4096;break;
      default:inventoryInvalid();
    }
    if(r.root!==root||(!["processing-file","journal-temp"].includes(r.slot)&&r.leaf!==""))inventoryInvalid();
    const observed=[r.device,r.inode,r.size,r.type,r.uid,r.gid,r.mode,r.nlink];
    if(r.presence==="absent"){if(observed.some(item=>item!==null))inventoryInvalid();}
    else{
      if(![r.device,r.inode,r.size,r.uid,r.gid,r.mode,r.nlink].every(item=>natural(item))||!natural(r.size,limit))inventoryInvalid();
      const directory=r.slot==="processing-directory",incoming=r.slot==="incoming-sealed";
      if(r.type!==(directory?"directory":"file")||(directory?r.nlink!<1:r.nlink!==1)||r.uid!==(incoming?config.intakeUid:process.getuid?.())||r.mode!==(incoming?0o640:directory?0o700:0o600)||(incoming&&r.gid!==config.sharedGid))inventoryInvalid();
    }
    if(r.leaseState===null){if([r.chargedBytes,r.leaseDevice,r.leaseInode].some(item=>item!==null))inventoryInvalid();}
    else{
      if(r.slot!=="incoming-sealed"||journal.allowance===null||!["prepared","bounded","quiescent","released"].includes(r.leaseState)||!natural(r.chargedBytes,journal.allowance))inventoryInvalid();
      if((r.leaseDevice===null)!==(r.leaseInode===null)||(r.leaseDevice!==null&&(!natural(r.leaseDevice)||!natural(r.leaseInode))))inventoryInvalid();
      if(r.leaseState==="released"&&(r.chargedBytes!==0||r.leaseDevice!==null))inventoryInvalid();
      if(r.presence==="present"&&r.leaseDevice!==null&&(r.device!==r.leaseDevice||r.inode!==r.leaseInode))inventoryInvalid();
    }
    return Object.freeze({...r,relativePath:name});
  }catch{inventoryInvalid();}
}
export function validateManifest(value:unknown,journal:Readonly<InventoryJournal>,object:Readonly<InventoryObject>):Readonly<ErasureManifest>{
  const r=record(value,manifestFields) as unknown as ErasureManifest;
  const limit = object.slot === "journal" || object.slot === "journal-temp" ? 4096 : object.slot === "incoming-sealed" || object.slot === "original-sealed" ? journal.allowance ?? MAX_SEALED_BYTES : object.slot === "artifact-sealed" || object.slot === "artifact-staging" ? artifactLimit(journal.artifactKind!) : SCRATCH_RESERVE;
  if(!token(r.eraseCommitId,32)||r.scanPass!==journal.pass||r.scanPass!==object.pass||r.journalId!==journal.journalId||r.journalId!==object.journalId||r.slot!==object.slot||r.leaf!==object.leaf||!["planned","holders-released","absent-synced","metadata-finalized"].includes(r.phase)||!natural(r.expectedSize)||!natural(r.remainingCharge,limit))inventoryInvalid();
  if((r.expectedDevice===null)!==(r.expectedInode===null)||(r.expectedDevice!==null&&(!natural(r.expectedDevice)||!natural(r.expectedInode))))inventoryInvalid();
  if(object.presence==="present"&&(r.expectedDevice!==object.device||r.expectedInode!==object.inode||r.expectedSize!==object.size))inventoryInvalid();
  return Object.freeze({...r});
}

// The original erasure repository retains this fixed writer. No connection,
// query operand, caller phase or structural DTO grants write authority.
export function createCustodyInventoryStorage(db: Database.Database, repository: ApplicationRepository, custody: CustodyLedger, config: CustodyConfig, acceptedAuthority?: AcceptedAuthority) {
  assertOriginalMaintenanceCustody(custody, repository, config);
  const accepted = new WeakMap<AcceptedCandidate, AcceptedRecord>();
  // Exact plans minted by this live composition only. Point membership is not
  // reconstructible from restored phase/charge columns and is never traversed.
  const initialZeroPlans = new Set<string>();
  const manifestKey = (commit: string, object: Pick<InventoryObject, "journalId" | "slot" | "leaf">) => JSON.stringify([commit, object.journalId, object.slot, object.leaf]);
  let recoveryCursor = ["", "", "", ""], recoveryComplete = false;
  const executionSlots: readonly InventoryObject["slot"][] = ["incoming-sealed", "original-sealed", "artifact-staging", "artifact-sealed", "processing-file", "processing-directory", "journal-temp", "journal"];
  let continuation: { commit: string; authority: string; streams: readonly string[]; stream: number; pass: string; journal: string; slot: string; leaf: string; currentJournal: string | null; planning: boolean; preflight: boolean; execution: number } | undefined;
  function pass(): string {
    const row = db.prepare("SELECT scanPass FROM erasure_maintenance WHERE singleton=1").get() as { scanPass: string };
    if (!token(row.scanPass, 32)) inventoryInvalid(); return row.scanPass;
  }
  function recordObservation(observation: CustodyObservation, run: MaintenanceRun) {
    assertMaintenanceCustodyIdentity(run, repository, custody);
    assertMaintenance(run, repository);
    const value = consumeCustodyObservation(observation, custody, run);
    if (value.kind === "invalidate" || value.kind === "accepted-plan" || value.kind === "accepted-rebind" || value.kind === "accepted-holders" || value.kind === "accepted-absent" || value.kind === "accepted-final" || value.kind === "accepted-recovery") inventoryInvalid();
    return db.transaction(() => {
      let consumedItems = 2;
      if (value.pass !== pass()) inventoryInvalid();
      if (value.kind === "root-open") {
        db.prepare("INSERT INTO erasure_scans(pass,root,state,itemCount) VALUES(?,?,'scanning',0)").run(value.pass, value.root);
        return { caseId: null, consumedItems: consumedItems + 1 };
      }
      if (value.kind === "root-eof") {
        if (db.prepare("UPDATE erasure_scans SET state='complete' WHERE pass=? AND root=? AND state='scanning'").run(value.pass, value.root).changes !== 1) inventoryInvalid();
        return { caseId: null, consumedItems: consumedItems + 1 };
      }
      if (value.kind === "recovered-native") {
        if (!recoveryComplete) inventoryInvalid();
        const stored = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(value.pass, value.object.journalId, value.object.slot, value.object.leaf);
        if (!stored || JSON.stringify(stored) !== JSON.stringify(value.object)) inventoryInvalid();
        if (db.prepare("UPDATE erasure_scans SET itemCount=itemCount+1 WHERE pass=? AND root=? AND state='scanning'").run(value.pass, value.root).changes !== 1) inventoryInvalid();
        return { caseId: null, consumedItems: consumedItems + 4 };
      }
      if (value.kind !== "object" && value.kind !== "incoming-lease-slot") inventoryInvalid();
      const entry = value.journal;
      let caseId: string | null = null, reservation: { id: string; reservedBytes: number } | undefined;
      if (entry.kind === "intake") {
        const stored = db.prepare("SELECT id,sessionHash,idempotencyKey,reservedBytes,expiresAt,submission FROM reservations WHERE id=?").get(entry.id) as (ReservationSource | undefined); consumedItems += 2;
        if (!stored || !entry.reservation || stored.sessionHash !== entry.reservation.sessionHash || stored.idempotencyKey !== entry.reservation.idempotencyKey || stored.reservedBytes !== entry.reservation.reservedBytes || stored.expiresAt !== entry.reservation.expiresAt || stored.submission !== JSON.stringify(entry.reservation.submission)) throw new Error("ERASURE_ASSOCIATION_INVALID");
        reservation = stored;
        const accepted = db.prepare("SELECT id,reservationId,encryptedPayloadPath,payloadBytes,submission FROM cases WHERE sessionHash=? AND idempotencyKey=?").get(stored.sessionHash, stored.idempotencyKey) as { id: string; reservationId: string; encryptedPayloadPath: string | null; payloadBytes: number; submission: string } | undefined; consumedItems += 2;
        // The session/key lookup covers lost replies AND replay reservations.
        // A replay of another accepted reservation is not orphan authority.
        if (accepted) {
          if (accepted.reservationId !== entry.id || accepted.submission !== stored.submission || (accepted.encryptedPayloadPath !== null && accepted.encryptedPayloadPath !== entry.workerPath) || (entry.caseId && accepted.id !== entry.caseId)) throw new Error("ERASURE_ASSOCIATION_INVALID");
          caseId = accepted.id;
        } else if (entry.caseId || entry.state === "committed") throw new Error("ERASURE_ASSOCIATION_INVALID");
      } else {
        if (!entry.caseId) throw new Error("ERASURE_ASSOCIATION_INVALID");
        const current = db.prepare("SELECT id FROM cases WHERE id=?").get(entry.caseId); consumedItems += 2;
        if (!current) throw new Error("ERASURE_ASSOCIATION_INVALID");
        caseId = entry.caseId;
        if (entry.kind === "artifact") {
          const reserve = db.prepare("SELECT bytes FROM artifact_reservations WHERE caseId=? AND kind=?").get(caseId, entry.artifactKind) as { bytes: number } | undefined; consumedItems += 2;
          const artifact = db.prepare("SELECT path,bytes FROM artifacts WHERE caseId=? AND kind=?").get(caseId, entry.artifactKind) as { path: string; bytes: number } | undefined; consumedItems += 2;
          if (!reserve || (artifact && (artifact.path !== entry.workerPath || artifact.bytes > reserve.bytes))) throw new Error("ERASURE_ASSOCIATION_INVALID");
        }
      }
      const journal = validateInventoryJournal({ pass: value.pass, journalId: entry.id, caseId, kind: entry.kind, version: entry.version, state: caseId && entry.kind === "intake" ? "committed" : entry.state, artifactKind: entry.artifactKind ?? null, budget: entry.budget, cleanupAfter: entry.cleanupAfter, reservationId: entry.reservation?.id ?? null, generation: entry.lease?.generation ?? null, domain: entry.lease?.domain ?? null, allowance: entry.lease?.allowance ?? null }, reservation);
      const object = validateInventoryObject(value.object, journal, config);
      consumedItems += 2; // Fixed journal and object validation.
      if (caseId) {
        consumedItems++; // Distinct selection admission, before any mutation.
        try { selectMaintenance(run, repository, `case:${caseId}`); }
        catch (error) {
          if (error instanceof Error && error.message === "MAINTENANCE_SELECTION_LIMIT") return { caseId, consumedItems, deferred: true };
          throw error;
        }
      }
      const old = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(value.pass, entry.id) as InventoryJournal | undefined; consumedItems += 2;
      if (old && journalFields.split(" ").some(key => old[key as keyof InventoryJournal] !== journal[key as keyof InventoryJournal])) throw new Error("ERASURE_ASSOCIATION_INVALID");
      if (!old) { db.prepare(`INSERT INTO erasure_inventory_journals(${journalFields.replaceAll(" ", ",")}) VALUES(${journalFields.split(" ").map(key => `@${key}`).join(",")})`).run(journal); consumedItems++; }
      const previous = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(value.pass, entry.id, object.slot, object.leaf) as InventoryObject | undefined; consumedItems += 2;
      if (previous && objectFields.split(" ").some(key => previous[key as keyof InventoryObject] !== object[key as keyof InventoryObject])) throw new Error("ERASURE_OWNERSHIP_INVALID");
      if (!previous) { db.prepare(`INSERT INTO erasure_inventory_objects(${objectFields.replaceAll(" ", ",")}) VALUES(${objectFields.split(" ").map(key => `@${key}`).join(",")})`).run(object); consumedItems++; }
      if (value.kind === "object") {
        if (db.prepare("UPDATE erasure_scans SET itemCount=itemCount+1 WHERE pass=? AND root=? AND state='scanning'").run(value.pass, value.root).changes !== 1) inventoryInvalid(); consumedItems++;
      }
      return { caseId, consumedItems };
    }).immediate();
  }
  function invalidate(observation: CustodyObservation, run: MaintenanceRun): number {
    assertMaintenanceCustodyIdentity(run, repository, custody);
    // Already-reserved denial only; deliberately no fresh admission/hold check.
    const value = consumeCustodyObservation(observation, custody, run);
    if (value.kind !== "invalidate") inventoryInvalid();
    db.transaction(() => {
      for (const root of ["custody", "incoming", "runtime"]) db.prepare("UPDATE erasure_scans SET state='blocked',error='STORAGE_FAILED' WHERE pass=? AND root=? AND state IN('scanning','complete')").run(value.pass, root);
    }).immediate();
    return 3;
  }
  function acceptedWork(commit: string, run: MaintenanceRun, guarded: boolean) {
    assertMaintenanceCustodyIdentity(run, repository, custody); assertMaintenance(run, repository);
    if (!acceptedAuthority) inventoryInvalid();
    const work = acceptedAuthority.resolve(commit);
    if (guarded) acceptedAuthority.guard(work.caseId);
    if (work.scope !== "processing_payload" && work.scope !== "identifying_register") throw new Error("ERASURE_UNVERIFIED");
    const claim = db.prepare("SELECT claimOwner,claimedAt,claimToken,claimKind FROM cases WHERE id=?").get(work.caseId) as Record<string, unknown> | undefined;
    if (claim && Object.values(claim).some(value => value !== null)) throw new Error("ERASURE_CLAIM_ACTIVE");
    selectMaintenance(run, repository, `case:${work.caseId}`);
    return work;
  }
  function acceptedScope(commit: string, run: MaintenanceRun) {
    const work = acceptedWork(commit, run, true);
    let predecessor: ErasureWork | undefined;
    if (work.scope === "identifying_register") {
      const source = db.prepare("SELECT eventId,committed FROM erasure_scopes WHERE caseId=? AND scope='processing_payload'").get(work.caseId) as { eventId: string; committed: number } | undefined;
      if (source) {
        if (source.committed !== 1) inventoryInvalid();
        predecessor = acceptedAuthority!.resolve(source.eventId);
        if (predecessor.scope !== "processing_payload" || ["caseId", "ledgerId", "historyEpoch", "associationKeyId", "replayAssociation"].some(field => predecessor![field as keyof ErasureWork] !== work[field as keyof ErasureWork]) || BigInt(predecessor.sequence) >= BigInt(work.sequence)) inventoryInvalid();
      }
    }
    return { work, predecessor, fingerprint: JSON.stringify([work, predecessor ?? null]), streams: predecessor ? [predecessor.commitEventId, commit] : [commit] };
  }
  function candidateWork(value: AcceptedRecord, run: MaintenanceRun) {
    const scope = acceptedScope(value.request, run);
    if (value.authority !== scope.fingerprint || !scope.streams.includes(value.commit)) inventoryInvalid();
    return scope.work;
  }
  function operands(journal: InventoryJournal, object: InventoryObject, manifest: ErasureManifest | null): AcceptedOperands {
    const j = validateJournal(journal, undefined, undefined, true), o = validateInventoryObject(object, j, config);
    if (manifest) validateManifest(manifest, j, object);
    return Object.freeze({ journal: j, object: Object.freeze({ ...object }), manifest: manifest && Object.freeze({ ...manifest }), relativePath: o.relativePath });
  }
  function candidate(commit: string, run: MaintenanceRun, value: AcceptedOperands, request = commit, authority: string | null = null): AcceptedCandidate {
    const key = Object.freeze({}) as AcceptedCandidate;
    accepted.set(key, { ...value, commit, request, authority, run, fingerprint: JSON.stringify(value) }); return key;
  }
  function readAccepted(key: AcceptedCandidate, run: MaintenanceRun): AcceptedOperands {
    const value = accepted.get(key);
    if (!value || value.run !== run) inventoryInvalid();
    assertMaintenanceCustodyIdentity(run, repository, custody);
    return value;
  }
  function readManifest(commit: string, journalId: string, slot: string, leaf: string): ErasureManifest | undefined {
    return db.prepare("SELECT * FROM erasure_manifests WHERE eraseCommitId=? AND journalId=? AND slot=? AND leaf=?").get(commit, journalId, slot, leaf) as ErasureManifest | undefined;
  }
  function manifestOperands(manifest: ErasureManifest): AcceptedOperands {
    const journal = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(manifest.scanPass, manifest.journalId) as InventoryJournal;
    const object = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(manifest.scanPass, manifest.journalId, manifest.slot, manifest.leaf) as InventoryObject;
    return operands(journal, object, manifest);
  }
  function nextRecovery(run: MaintenanceRun) {
    assertMaintenanceCustodyIdentity(run, repository, custody); assertMaintenance(run, repository);
    if (recoveryComplete) return { candidate: null, consumedItems: 0 };
    const manifest = db.prepare("SELECT * FROM erasure_manifests WHERE (eraseCommitId,journalId,slot,leaf)>(?,?,?,?) ORDER BY eraseCommitId,journalId,slot,leaf LIMIT 1").get(...recoveryCursor) as ErasureManifest | undefined;
    if (!manifest) { recoveryComplete = true; return { candidate: null, consumedItems: 2 }; }
    const value = manifestOperands(manifest), work = acceptedWork(manifest.eraseCommitId, run, false);
    if (value.journal.caseId !== work.caseId) inventoryInvalid();
    return { candidate: candidate(manifest.eraseCommitId, run, value), consumedItems: 19 };
  }
  function recordRecovery(observation: CustodyObservation, run: MaintenanceRun) {
    const proof = consumeCustodyObservation(observation, custody, run);
    if (proof.kind !== "accepted-recovery") inventoryInvalid();
    const value = accepted.get(proof.candidate);
    if (!value || value.run !== run || !value.manifest) inventoryInvalid();
    const result = db.transaction(() => {
      const work = acceptedWork(value.commit, run, false);
      if (work.caseId !== value.journal.caseId || proof.pass !== pass()) inventoryInvalid();
      const manifest = readManifest(value.commit, value.object.journalId, value.object.slot, value.object.leaf);
      if (!manifest || JSON.stringify(manifest) !== JSON.stringify(value.manifest)) inventoryInvalid();
      const journal = validateJournal({ ...value.journal, pass: proof.pass }, undefined, undefined, true);
      const object = proof.object; validateInventoryObject(object, journal, config);
      if (object.journalId !== manifest.journalId || object.slot !== manifest.slot || object.leaf !== manifest.leaf) inventoryInvalid();
      if (object.presence === "present" && (manifest.remainingCharge === 0 || object.device !== manifest.expectedDevice || object.inode !== manifest.expectedInode || object.uid !== value.object.uid || object.gid !== value.object.gid || object.mode !== value.object.mode || object.type !== value.object.type ||
        (object.slot === "processing-directory" ? object.size! > manifest.expectedSize || object.nlink! > value.object.nlink! : object.size !== manifest.expectedSize || object.nlink !== value.object.nlink))) inventoryInvalid();
      if (object.slot === "incoming-sealed" && manifest.remainingCharge === 0 && object.chargedBytes !== 0) inventoryInvalid();
      const priorJournal = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(proof.pass, journal.journalId) as InventoryJournal | undefined;
      if (priorJournal && JSON.stringify(priorJournal) !== JSON.stringify(journal)) inventoryInvalid();
      if (!priorJournal) db.prepare(`INSERT INTO erasure_inventory_journals(${journalFields.replaceAll(" ", ",")}) VALUES(${journalFields.split(" ").map(key => `@${key}`).join(",")})`).run(journal);
      const priorObject = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(proof.pass, object.journalId, object.slot, object.leaf) as InventoryObject | undefined;
      if (priorObject && JSON.stringify(priorObject) !== JSON.stringify(object)) inventoryInvalid();
      if (!priorObject) db.prepare(`INSERT INTO erasure_inventory_objects(${objectFields.replaceAll(" ", ",")}) VALUES(${objectFields.split(" ").map(key => `@${key}`).join(",")})`).run(object);
      return [manifest.eraseCommitId, manifest.journalId, manifest.slot, manifest.leaf];
    }).immediate();
    recoveryCursor = result; accepted.delete(proof.candidate); return 29;
  }
  // Only the completed all-manifest stream can supply a missing live journal.
  // Every historical candidate was checked, including zero/finalized rows;
  // conflicting normalized operands therefore never resolve by LIMIT 1 luck.
  function recoveredEntry(journalId: string, slot: InventoryObject["slot"], leaf: string, run: MaintenanceRun) {
    assertMaintenanceCustodyIdentity(run, repository, custody); assertMaintenance(run, repository);
    if (!recoveryComplete) inventoryInvalid();
    const currentPass = pass();
    const journal = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(currentPass, journalId) as InventoryJournal;
    const object = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(currentPass, journalId, slot, leaf) as InventoryObject;
    if (!journal || !object) inventoryInvalid();
    return { value: operands(journal, object, null), consumedItems: 8 };
  }
  function nextAccepted(commit: string, run: MaintenanceRun) {
    const scope = acceptedScope(commit, run), work = scope.work, scanPass = pass();
    // Requested work/claim/selection/pass13 plus predecessor scope point2,
    // original current fact/obligation8 and bounded association comparisons4.
    let consumedItems = 27;
    if (!continuation || continuation.commit !== commit || continuation.pass !== scanPass) continuation = { commit, authority: scope.fingerprint, streams: scope.streams, stream: 0, pass: scanPass, journal: "", slot: "", leaf: "", currentJournal: null, planning: true, preflight: true, execution: 0 };
    const state = continuation;
    if (state.authority !== scope.fingerprint) inventoryInvalid();
    if (state.preflight) {
      const old = db.prepare("SELECT * FROM erasure_manifests WHERE eraseCommitId=? AND (journalId,slot,leaf)>(?,?,?) ORDER BY journalId,slot,leaf LIMIT 1").get(state.streams[state.stream], state.journal, state.slot, state.leaf) as ErasureManifest | undefined; consumedItems += 2;
      if (old) {
        const value = manifestOperands(old); consumedItems += 6;
        if (value.journal.caseId !== work.caseId) inventoryInvalid();
        consumedItems += excludeMovedIdentity(old, scanPass);
        state.journal = old.journalId; state.slot = old.slot; state.leaf = old.leaf;
      } else { state.stream++; state.journal = ""; state.slot = ""; state.leaf = ""; if (state.stream === state.streams.length) { state.preflight = false; state.stream = 0; } }
      return { candidate: null, exhausted: false, planning: true, consumedItems };
    }
    if (state.planning) {
      if (!state.currentJournal) {
        const next = db.prepare("SELECT journalId FROM erasure_inventory_journals INDEXED BY erasure_inventory_case WHERE pass=? AND caseId=? AND journalId>? ORDER BY journalId LIMIT 1").get(scanPass, work.caseId, state.journal) as { journalId: string } | undefined; consumedItems += 2;
        if (!next) { consumedItems += verifySourceCoverage(work, scope.predecessor); state.planning = false; state.journal = ""; return { candidate: null, exhausted: false, planning: false, consumedItems }; }
        state.currentJournal = next.journalId; state.slot = ""; state.leaf = "";
      }
      const object = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND (slot,leaf)>(?,?) ORDER BY slot,leaf LIMIT 1").get(scanPass, state.currentJournal, state.slot, state.leaf) as InventoryObject | undefined; consumedItems += 2;
      if (!object) { state.journal = state.currentJournal; state.currentJournal = null; return { candidate: null, exhausted: false, planning: true, consumedItems }; }
      const journal = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(scanPass, state.currentJournal) as InventoryJournal; consumedItems += 2;
      const existing = readManifest(commit, object.journalId, object.slot, object.leaf) ?? (scope.predecessor && readManifest(scope.predecessor.commitEventId, object.journalId, object.slot, object.leaf)); consumedItems += 4;
      const value = operands(journal, object, null); consumedItems += 2;
      // Existing bindings are inspected during the separate all-manifest stream;
      // never overwrite their positive charge with a new absence observation.
      if (existing) { state.slot = object.slot; state.leaf = object.leaf; return { candidate: null, exhausted: false, planning: true, consumedItems }; }
      return { candidate: candidate(commit, run, value, commit, scope.fingerprint), exhausted: false, planning: true, consumedItems };
    }
    if (state.stream === state.streams.length) return { candidate: null, exhausted: true, planning: false, consumedItems };
    consumedItems += verifySourceCoverage(work, scope.predecessor);
    const source = state.streams[state.stream];
    const manifest = db.prepare("SELECT * FROM erasure_manifests INDEXED BY erasure_manifest_execution WHERE eraseCommitId=? AND slot=? AND (journalId,leaf)>(?,?) ORDER BY journalId,leaf LIMIT 1").get(source, executionSlots[state.execution], state.journal, state.leaf) as ErasureManifest | undefined; consumedItems += 2;
    if (!manifest) { state.execution++; state.journal = ""; state.leaf = ""; if (state.execution === executionSlots.length) { state.execution = 0; state.stream++; } return { candidate: null, exhausted: state.stream === state.streams.length, planning: false, consumedItems }; }
    const value = manifestOperands(manifest); consumedItems += 6;
    if (value.journal.caseId !== work.caseId) inventoryInvalid();
    return { candidate: candidate(source, run, value, commit, scope.fingerprint), exhausted: false, planning: false, consumedItems };
  }
  function verifySourceCoverage(work: ErasureWork, predecessor?: ErasureWork): number {
    const manifest = (id: string, slot: string) => readManifest(work.commitEventId, id, slot, "") ?? (predecessor && readManifest(predecessor.commitEventId, id, slot, ""));
    const row = db.prepare("SELECT reservationId,encryptedPayloadPath,payloadBytes FROM cases WHERE id=?").get(work.caseId) as { reservationId: string; encryptedPayloadPath: string | null; payloadBytes: number } | undefined;
    if (!row) {
      // An independently acknowledged retained manifest survives later parent
      // minimization. This does not authorize any new plan or positive rebind.
      if (!db.prepare("SELECT 1 FROM erasure_manifests WHERE eraseCommitId=? LIMIT 1").get(work.commitEventId) && (!predecessor || !db.prepare("SELECT 1 FROM erasure_manifests WHERE eraseCommitId=? LIMIT 1").get(predecessor.commitEventId))) inventoryInvalid();
      return 6;
    }
    let consumedItems = 2;
    if (row.encryptedPayloadPath !== null || row.payloadBytes !== 0) {
      const original = manifest(row.reservationId, "original-sealed"); consumedItems += 4;
      const incoming = manifest(row.reservationId, "incoming-sealed"); consumedItems += 4;
      if (!original || !incoming || row.encryptedPayloadPath !== `${config.custodyRoot}/${row.reservationId}.enc` || row.payloadBytes <= 0 || original.expectedSize !== row.payloadBytes) inventoryInvalid();
    }
    const artifacts = db.prepare("SELECT kind,path,bytes FROM artifacts WHERE caseId=? ORDER BY kind LIMIT 3").all(work.caseId) as { kind: string; path: string; bytes: number }[]; consumedItems += artifacts.length + 1;
    if (artifacts.length > 2) inventoryInvalid();
    for (const artifact of artifacts) {
      const suffix = `.${artifact.kind}.enc`, id = artifact.path.slice(config.custodyRoot.length + 1, -suffix.length);
      if (!custodyId(id) || !["bundle", "mime"].includes(artifact.kind) || artifact.path !== `${config.custodyRoot}/${id}${suffix}`) inventoryInvalid();
      const binding = manifest(id, "artifact-sealed"); consumedItems += 4;
      if (!binding || artifact.bytes <= 0 || binding.expectedSize !== artifact.bytes) inventoryInvalid();
    }
    return consumedItems + 6; // Per-artifact path/manifest validation plus fixed source validation.
  }
  function sourceCharge(value: AcceptedRecord): number {
    const { journal: j, object: o, relativePath } = value;
    if (o.slot === "incoming-sealed") { if (o.chargedBytes === null || o.leaseState === null) inventoryInvalid(); return o.chargedBytes; }
    if (o.presence !== "present" || o.size === null) inventoryInvalid();
    if (o.slot === "processing-file") {
      const leaves = db.prepare("SELECT leaf,size,presence FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot='processing-file' ORDER BY leaf LIMIT 21").all(o.pass, j.journalId) as { leaf: string; size: number | null; presence: string }[];
      if (leaves.length > 20) inventoryInvalid();
      let total = 0;
      for (const leaf of leaves) {
        if (leaf.presence === "absent") continue;
        if (!natural(leaf.size, SCRATCH_RESERVE)) inventoryInvalid();
        total += leaf.size;
      }
      if (total > j.budget || total > SCRATCH_RESERVE) inventoryInvalid();
    }
    if (o.slot === "original-sealed") {
      const row = db.prepare("SELECT reservationId,encryptedPayloadPath,payloadBytes FROM cases WHERE id=?").get(j.caseId) as { reservationId: string; encryptedPayloadPath: string; payloadBytes: number } | undefined;
      if (!row || row.reservationId !== j.reservationId || row.encryptedPayloadPath !== `${config.custodyRoot}/${relativePath}` || row.payloadBytes !== o.size || row.payloadBytes <= 0) inventoryInvalid();
      return row.payloadBytes;
    }
    if (o.slot === "artifact-sealed" || o.slot === "artifact-staging") {
      const reserve = db.prepare("SELECT bytes FROM artifact_reservations WHERE caseId=? AND kind=?").get(j.caseId, j.artifactKind) as { bytes: number } | undefined;
      if (!reserve || reserve.bytes !== artifactLimit(j.artifactKind!) || o.size > reserve.bytes) inventoryInvalid();
      const slots = db.prepare("SELECT size,presence FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot IN('artifact-staging','artifact-sealed') LIMIT 3").all(o.pass, j.journalId) as { size: number | null; presence: string }[];
      if (slots.length > 2 || slots.reduce((sum, slot) => sum + (slot.presence === "present" ? slot.size! : 0), 0) > reserve.bytes) inventoryInvalid();
      if (o.slot === "artifact-sealed") {
        const row = db.prepare("SELECT path,bytes FROM artifacts WHERE caseId=? AND kind=?").get(j.caseId, j.artifactKind) as { path: string; bytes: number } | undefined;
        if (!row || row.path !== `${config.custodyRoot}/${relativePath}` || row.bytes !== o.size || row.bytes <= 0) inventoryInvalid();
      }
    }
    return o.size;
  }
  function excludeMovedIdentity(manifest: Readonly<ErasureManifest>, currentPass: string): number {
    if (manifest.expectedDevice === null || manifest.expectedInode === null) return 1;
    const identities = db.prepare("SELECT journalId,slot,leaf FROM erasure_inventory_objects INDEXED BY erasure_inventory_identity WHERE pass=? AND device=? AND inode=? LIMIT 2").all(currentPass, manifest.expectedDevice, manifest.expectedInode) as { journalId: string; slot: string; leaf: string }[];
    if (identities.length > 1 || identities.some(value => value.journalId !== manifest.journalId || value.slot !== manifest.slot || value.leaf !== manifest.leaf)) inventoryInvalid();
    return 4;
  }
  function planAccepted(observation: CustodyObservation, run: MaintenanceRun): number {
    const proof = consumeCustodyObservation(observation, custody, run);
    if (proof.kind !== "accepted-plan") inventoryInvalid();
    const value = accepted.get(proof.candidate);
    if (!value || value.run !== run || value.manifest || proof.pass !== pass()) inventoryInvalid();
    const result = db.transaction(() => {
      const work = candidateWork(value, run);
      if (value.journal.caseId !== work.caseId || value.journal.pass !== proof.pass) inventoryInvalid();
      if (!db.prepare("SELECT 1 FROM cases WHERE id=?").get(work.caseId)) inventoryInvalid();
      const journal = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(proof.pass, value.journal.journalId) as InventoryJournal;
      const object = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(proof.pass, value.object.journalId, value.object.slot, value.object.leaf) as InventoryObject;
      if (JSON.stringify(operands(journal, object, null)) !== value.fingerprint || readManifest(value.commit, object.journalId, object.slot, object.leaf)) inventoryInvalid();
      const charge = sourceCharge(value), manifest: ErasureManifest = { eraseCommitId: value.commit, scanPass: proof.pass, journalId: object.journalId, slot: object.slot, leaf: object.leaf, expectedDevice: object.device, expectedInode: object.inode, expectedSize: object.size ?? 0, remainingCharge: charge, phase: "planned" };
      validateManifest(manifest, journal, object);
      db.prepare("INSERT INTO erasure_manifests(eraseCommitId,scanPass,journalId,slot,leaf,expectedDevice,expectedInode,expectedSize,remainingCharge,phase) VALUES(@eraseCommitId,@scanPass,@journalId,@slot,@leaf,@expectedDevice,@expectedInode,@expectedSize,@remainingCharge,@phase)").run(manifest);
      if (!continuation || continuation.commit !== value.request || !continuation.planning) inventoryInvalid();
      // Private cursor publication is after COMMIT; the100-credit block also
      // covers both authorities, the live source point and bounded aggregates.
      return { state: continuation, slot: object.slot, leaf: object.leaf, initialZero: charge === 0 && object.presence === "present" && object.size === 0 && object.slot !== "processing-directory" };
    }).immediate();
    result.state.slot = result.slot; result.state.leaf = result.leaf; accepted.delete(proof.candidate);
    if (result.initialZero) initialZeroPlans.add(manifestKey(value.commit, value.object));
    return 100; // Includes two-scope authority, scratch validations and source.
  }
  function advanceAccepted(observation: CustodyObservation, run: MaintenanceRun): number {
    const proof = consumeCustodyObservation(observation, custody, run);
    if (proof.kind !== "accepted-holders" && proof.kind !== "accepted-absent" && proof.kind !== "accepted-final") inventoryInvalid();
    const value = accepted.get(proof.candidate);
    if (!value || value.run !== run || !value.manifest) inventoryInvalid();
    const result = db.transaction(() => {
      const current = candidateWork(value, run);
      if (current.caseId !== value.journal.caseId || proof.pass !== pass()) inventoryInvalid();
      const old = readManifest(value.commit, value.object.journalId, value.object.slot, value.object.leaf);
      if (!old || JSON.stringify(old) !== JSON.stringify(value.manifest)) inventoryInvalid();
      const phase = proof.kind === "accepted-holders" ? "holders-released" : proof.kind === "accepted-absent" ? "absent-synced" : "metadata-finalized";
      // Historical finalization never bypasses the native executor. It still
      // supplies all three fresh observations, without resurrecting old charge.
      const order = ["planned", "holders-released", "absent-synced", "metadata-finalized"];
      let next = old;
      if (order.indexOf(old.phase) < order.indexOf(phase)) {
        if (order.indexOf(phase) !== order.indexOf(old.phase) + 1) inventoryInvalid();
        db.prepare("UPDATE erasure_manifests SET phase=?,remainingCharge=? WHERE eraseCommitId=? AND journalId=? AND slot=? AND leaf=?").run(phase, phase === "metadata-finalized" ? 0 : old.remainingCharge, value.commit, old.journalId, old.slot, old.leaf);
        next = { ...old, phase, remainingCharge: phase === "metadata-finalized" ? 0 : old.remainingCharge };
      }
      if (proof.kind === "accepted-final") {
        if (!continuation || continuation.commit !== value.request || continuation.planning) inventoryInvalid();
      }
      return { next, state: proof.kind === "accepted-final" ? continuation! : null };
    }).immediate();
    value.manifest = Object.freeze(result.next);
    if (result.state) { result.state.journal = result.next.journalId; result.state.leaf = result.next.leaf; accepted.delete(proof.candidate); initialZeroPlans.delete(manifestKey(value.commit, value.object)); }
    return 40; // Both current scope authorities plus fixed manifest transition.
  }
  function rebindAccepted(observation: CustodyObservation, run: MaintenanceRun): number {
    const proof = consumeCustodyObservation(observation, custody, run);
    if (proof.kind !== "accepted-rebind") inventoryInvalid();
    const old = accepted.get(proof.candidate);
    if (!old || old.run !== run || !old.manifest || old.manifest.remainingCharge <= 0 || old.object.slot === "processing-directory") inventoryInvalid();
    const oldManifest = old.manifest;
    const result = db.transaction(() => {
      const work = candidateWork(old, run);
      if (proof.pass !== pass() || old.journal.caseId !== work.caseId || oldManifest.scanPass === proof.pass) inventoryInvalid();
      if (!db.prepare("SELECT 1 FROM cases WHERE id=?").get(work.caseId)) inventoryInvalid();
      const stored = readManifest(old.commit, old.object.journalId, old.object.slot, old.object.leaf);
      if (!stored || JSON.stringify(stored) !== JSON.stringify(old.manifest)) inventoryInvalid();
      const current = recoveredEntry(old.object.journalId, old.object.slot, old.object.leaf, run).value;
      if (JSON.stringify({ ...current.journal, pass: old.journal.pass }) !== JSON.stringify(old.journal) || current.object.presence !== "present") inventoryInvalid();
      for (const field of ["device", "inode", "size", "type", "uid", "gid", "mode", "nlink"] as const) if (current.object[field] !== old.object[field]) inventoryInvalid();
      const identities = db.prepare("SELECT journalId,slot,leaf FROM erasure_inventory_objects INDEXED BY erasure_inventory_identity WHERE pass=? AND device=? AND inode=? LIMIT 2").all(proof.pass, current.object.device, current.object.inode) as { journalId: string; slot: string; leaf: string }[];
      if (identities.length !== 1 || identities[0].journalId !== old.object.journalId || identities[0].slot !== old.object.slot || identities[0].leaf !== old.object.leaf) inventoryInvalid();
      const next: AcceptedRecord = { ...current, run, commit: old.commit, request: old.request, authority: old.authority, fingerprint: "", manifest: null };
      if (sourceCharge(next) !== stored.remainingCharge) inventoryInvalid();
      const manifest = { ...stored, scanPass: proof.pass, phase: "planned" as const };
      validateManifest(manifest, current.journal, current.object);
      db.prepare("DELETE FROM erasure_manifests WHERE eraseCommitId=? AND journalId=? AND slot=? AND leaf=?").run(old.commit, stored.journalId, stored.slot, stored.leaf);
      db.prepare("INSERT INTO erasure_manifests(eraseCommitId,scanPass,journalId,slot,leaf,expectedDevice,expectedInode,expectedSize,remainingCharge,phase) VALUES(@eraseCommitId,@scanPass,@journalId,@slot,@leaf,@expectedDevice,@expectedInode,@expectedSize,@remainingCharge,@phase)").run(manifest);
      return { ...next, manifest, fingerprint: JSON.stringify(current) };
    }).immediate();
    accepted.set(proof.candidate, result);
    return 110; // Includes both authorities, scratch verification and source.
  }
  function directoryCompanions(key: AcceptedCandidate, run: MaintenanceRun) {
    const value = accepted.get(key);
    if (!value || value.run !== run || !value.manifest || value.object.slot !== "processing-directory") inventoryInvalid();
    candidateWork(value, run);
    const children = db.prepare("SELECT leaf,phase,remainingCharge FROM erasure_manifests WHERE eraseCommitId=? AND journalId=? AND slot='processing-file' ORDER BY leaf LIMIT 21").all(value.commit, value.object.journalId) as { leaf: string; phase: string; remainingCharge: number }[];
    const inspected = db.prepare("SELECT leaf FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot='processing-file' ORDER BY leaf LIMIT 21").all(pass(), value.object.journalId) as { leaf: string }[];
    if (children.length > 20 || children.length !== inspected.length || children.some((child, i) => child.leaf !== inspected[i].leaf || child.phase !== "metadata-finalized" || child.remainingCharge !== 0 || !/^(?:[0-4]\.data|document-[1-5]\.(?:pdf|jpg|png))$/.test(child.leaf))) inventoryInvalid();
    return { leaves: children.map(child => child.leaf), consumedItems: 36 + 2 * children.length + 2 * inspected.length };
  }
  function absentParent(key: AcceptedCandidate, run: MaintenanceRun) {
    const value = accepted.get(key);
    if (!value || value.run !== run || !value.manifest || value.object.slot !== "processing-file") inventoryInvalid();
    const work = candidateWork(value, run), manifest = readManifest(value.commit, value.object.journalId, "processing-directory", "");
    if (!manifest || manifest.expectedDevice === null || manifest.expectedInode === null) inventoryInvalid();
    const parent = manifestOperands(manifest), fresh = recoveredEntry(value.object.journalId, "processing-directory", "", run).value;
    if (parent.journal.caseId !== work.caseId || fresh.object.presence !== "absent") inventoryInvalid();
    return 47;
  }
  function bindPhysicalVerifier(verifier: PhysicalVerifier) {
    assertOriginalMaintenanceCustody(custody, repository, config);
    if (!acceptedAuthority) inventoryInvalid();
    acceptedAuthority.registerPhysicalVerifier(verifier);
  }
  function verifyCompletionWork(commit: string, run: MaintenanceRun) {
    const scope = acceptedScope(commit, run);
    return { pass: pass(), fingerprint: scope.fingerprint, guard: acceptedAuthority!.guard(scope.work.caseId), consumedItems: 32 };
  }
  function restartAccepted(commit: string, run: MaintenanceRun) { acceptedScope(commit, run); continuation = undefined; return 31; }
  function isInitialZero(key: AcceptedCandidate, run: MaintenanceRun) {
    const value = accepted.get(key); if (!value || value.run !== run || !value.manifest) inventoryInvalid();
    return value.manifest.scanPass === pass() && value.manifest.expectedSize === 0 && value.object.presence === "present" && value.object.size === 0 && ["planned", "holders-released"].includes(value.manifest.phase) && initialZeroPlans.has(manifestKey(value.commit, value.object));
  }
  function checkAcceptedSource(key: AcceptedCandidate, run: MaintenanceRun) {
    const value = accepted.get(key); if (!value || value.run !== run || !value.manifest) inventoryInvalid();
    candidateWork(value, run);
    excludeMovedIdentity(value.manifest, pass());
    if ((value.manifest.remainingCharge > 0 || isInitialZero(key, run)) && sourceCharge(value) !== value.manifest.remainingCharge) inventoryInvalid();
    return 85; // Both authorities and current-pass retained-identity exclusion.
  }
  return Object.freeze({ pass, record: recordObservation, invalidate, nextRecovery, recordRecovery, recoveredEntry, recoveryReady: () => recoveryComplete, nextAccepted, readAccepted, planAccepted, rebindAccepted, advanceAccepted, directoryCompanions, absentParent, bindPhysicalVerifier, verifyCompletionWork, restartAccepted, isInitialZero, checkAcceptedSource });
}
interface ReservationSource { id: string; sessionHash: string; idempotencyKey: string; reservedBytes: number; expiresAt: string; submission: string }

const payload: readonly ErasureRowPhase[]=["payload-artifacts","payload-reservations","payload-case","payload-send"];
const identity: readonly ErasureRowPhase[]=["identity-grants","identity-lifecycle-audit","identity-lifecycle-proposals","identity-audit","identity-searches","identity-diagnostics","identity-mail-events","identity-mail-state","identity-delivery-attempts","identity-delivery","identity-lifecycle","identity-replay-reservations","identity-case-reservation"];
const phases:Readonly<Record<EraseScope,readonly ErasureRowPhase[]>>={processing_payload:payload,processing_contact:["scope-contact"],public_token:["scope-proofs"],incident_identity:["scope-contact","scope-proofs",...identity],identifying_register:["scope-contact","scope-proofs",...payload,...identity]};
function fail():never{throw new Error("ERASURE_CURSOR_INVALID");}

// Fixed keysets only. No table/SQL/path operand crosses the original owner.
export function createErasureRowSelector(db:Database.Database){
  const cursors=new WeakSet<object>();
  function cursor(id:string,phase:ErasureRowPhase,key:ErasureRowKey|null):ErasureRowCursor{
    const result=Object.freeze([id,phase,Array.isArray(key)?Object.freeze([...key]) as readonly [string,string|number]:key]) as ErasureRowCursor;
    cursors.add(result);return result;
  }
  return function rowPage(work:ErasureWork,previous:ErasureRowCursor|null,remaining:number):ErasureRowPage{
    const allowed=phases[work.scope];
    if(previous&&(!cursors.has(previous)||previous[0]!==work.commitEventId||!allowed.includes(previous[1])))fail();
    let index=previous?allowed.indexOf(previous[1]):0,last=previous?.[2]??null,consumed=0;
    for(;index<allowed.length;index++,last=null){
      const phase=allowed[index],pair=phase==="identity-case-reservation",cost=pair?2:1;
      if(phase==="identity-searches"){
        // R94: admit parents, not joined output rows. Each parent costs one
        // row + one child point-probe + at most three schema-bounded rounds.
        // The cursor is the last fully examined parent, including empty ones.
        if(remaining-consumed<6)return Object.freeze({targets:Object.freeze([]),next:cursor(work.commitEventId,phase,last),consumedItems:consumed});
        consumed++;
        const parents=db.prepare("SELECT eventId FROM deletion_events INDEXED BY erasure_mail_events WHERE caseId=? AND eventId>? ORDER BY eventId LIMIT ?").all(work.caseId,Array.isArray(last)?last[0]:"",Math.floor((remaining-consumed)/5)) as {eventId:string}[];
        consumed+=parents.length;
        const targets:ErasureRowTarget[]=[];
        for(const parent of parents){
          if(!token(parent.eventId,32))fail();
          consumed++;
          const children=db.prepare("SELECT round FROM deletion_searches WHERE attemptId=? ORDER BY round LIMIT 3").all(parent.eventId) as {round:string}[];
          consumed+=children.length;
          for(const child of children){
            if(!["1","2","3"].includes(child.round))fail();
            targets.push(Object.freeze({phase,key:Object.freeze([parent.eventId,child.round]) as readonly [string,string]}));
          }
        }
        // 11B must continue empty-target pages and publish this high-water only
        // after all selected mutations commit; failures must reselect, not skip.
        if(parents.length)return Object.freeze({targets:Object.freeze(targets),next:cursor(work.commitEventId,phase,[parents.at(-1)!.eventId,"3"]),consumedItems:consumed});
        continue;
      }
      if(remaining-consumed<cost+1)return Object.freeze({targets:Object.freeze([]),next:cursor(work.commitEventId,phase,last),consumedItems:consumed});
      // Reserve one query/empty-phase credit in addition to all selected rows.
      consumed++;const limit=Math.floor((remaining-consumed)/cost),id=work.caseId;
      let sql:string,operands:unknown[],key:(row:Record<string,unknown>)=>ErasureRowKey;
      switch(phase){
        case "scope-contact":sql="SELECT caseId FROM deliveries WHERE caseId=? AND contactEnvelope IS NOT NULL AND caseId>? LIMIT ?";operands=[id,last??"",limit];key=r=>r.caseId as string;break;
        case "scope-proofs":sql="SELECT proofHash FROM status_proofs WHERE caseId=? AND proofHash>? ORDER BY proofHash LIMIT ?";operands=[id,last??"",limit];key=r=>r.proofHash as string;break;
        case "payload-artifacts":case "payload-reservations":{
          const table=phase==="payload-artifacts"?"artifacts":"artifact_reservations";
          sql=`SELECT caseId,kind FROM ${table} WHERE caseId=? AND kind>? ORDER BY kind LIMIT ?`;operands=[id,Array.isArray(last)?last[1]:"",limit];key=r=>[r.caseId as string,r.kind as string];break;
        }
        case "payload-case":sql="SELECT id FROM cases WHERE id=? AND (encryptedPayloadPath IS NOT NULL OR payloadBytes!=0) AND id>? LIMIT ?";operands=[id,last??"",limit];key=r=>r.id as string;break;
        case "payload-send":sql="SELECT caseId FROM deliveries WHERE caseId=? AND sendDueAt IS NOT NULL AND caseId>? LIMIT ?";operands=[id,last??"",limit];key=r=>r.caseId as string;break;
        case "identity-grants":sql="SELECT hash FROM auth_grants WHERE caseId=? AND hash>? ORDER BY hash LIMIT ?";operands=[id,last??"",limit];key=r=>r.hash as string;break;
        case "identity-lifecycle-audit":case "identity-audit":{
          const table=phase==="identity-audit"?"audit":"lifecycle_audit";
          sql=`SELECT sequence FROM ${table} WHERE caseId=? AND sequence>? ORDER BY sequence LIMIT ?`;operands=[id,last??0,limit];key=r=>r.sequence as number;break;
        }
        case "identity-lifecycle-proposals":case "identity-mail-events":case "identity-diagnostics":{
          const table=phase==="identity-lifecycle-proposals"?"lifecycle_proposals":phase==="identity-mail-events"?"deletion_events":"deletion_diagnostics";
          sql=`SELECT eventId FROM ${table} WHERE caseId=? AND eventId>? ORDER BY eventId LIMIT ?`;operands=[id,last??"",limit];key=r=>r.eventId as string;break;
        }
        case "identity-mail-state":case "identity-delivery":case "identity-lifecycle":{
          const table=phase==="identity-mail-state"?"deletion_state":phase==="identity-delivery"?"deliveries":"case_lifecycle";
          sql=`SELECT caseId FROM ${table} WHERE caseId=? AND caseId>? LIMIT ?`;operands=[id,last??"",limit];key=r=>r.caseId as string;break;
        }
        case "identity-delivery-attempts":sql="SELECT caseId,ordinal FROM delivery_attempts WHERE caseId=? AND ordinal>? ORDER BY ordinal LIMIT ?";operands=[id,Array.isArray(last)?last[1]:0,limit];key=r=>[r.caseId as string,r.ordinal as number];break;
        case "identity-replay-reservations":sql="SELECT r.id FROM cases c JOIN reservations r ON r.sessionHash=c.sessionHash AND r.idempotencyKey=c.idempotencyKey WHERE c.id=? AND r.id!=c.reservationId AND r.id>? ORDER BY r.id LIMIT ?";operands=[id,last??"",limit];key=r=>r.id as string;break;
        case "identity-case-reservation":sql="SELECT c.id,c.reservationId FROM cases c JOIN reservations r ON r.id=c.reservationId WHERE c.id=? AND c.id>? LIMIT ?";operands=[id,Array.isArray(last)?last[0]:"",limit];key=r=>[r.id as string,r.reservationId as string];break;
      }
      const rows=db.prepare(sql).all(...operands) as Record<string,unknown>[];
      consumed+=rows.length*cost;
      const targets=rows.map(row=>{
        const value=key(row);
        if(typeof value==="number"){if(!Number.isSafeInteger(value)||value<1)fail();}
        else if(typeof value==="string"){if(!value||value.length>128)fail();}
        else {
          if(value[0]!==id)fail();
          applicationId(value[0]);if(phase==="identity-case-reservation")applicationId(value[1] as string);else if(phase==="identity-delivery-attempts"){if(!Number.isSafeInteger(value[1])||Number(value[1])<1||Number(value[1])>3)fail();}else if(!["bundle","mime"].includes(value[1] as string))fail();
        }
        return Object.freeze({phase,key:Array.isArray(value)?Object.freeze([...value]) as readonly [string,string|number]:value}) as ErasureRowTarget;
      });
      if(targets.length)return Object.freeze({targets:Object.freeze(targets),next:cursor(work.commitEventId,phase,targets.at(-1)!.key),consumedItems:consumed});
    }
    return Object.freeze({targets:Object.freeze([]),next:null,consumedItems:consumed});
  };
}
