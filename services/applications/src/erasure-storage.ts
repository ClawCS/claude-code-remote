import type Database from "better-sqlite3";
import { applicationId, utcInstant, type CustodyConfig, type EraseScope, type ErasureRowCursor, type ErasureRowKey, type ErasureRowPage, type ErasureRowPhase, type ErasureRowTarget, type ErasureWork } from "./types";
import { MAX_SEALED_BYTES } from "./crypto";
import { artifactLimit,SCRATCH_RESERVE } from "./storage-budget";
import { createHash } from "node:crypto";
import { decodeJournalEvent,encodeJournalEvent } from "./ledger-contract";
import { consumeCustodyObservation, type CustodyObservation } from "./custody-erasure";
import { assertMaintenance, assertMaintenanceCustodyIdentity, assertOriginalMaintenanceCustody, selectMaintenance, type MaintenanceRun } from "./worker-maintenance";
import type { ApplicationRepository, CustodyLedger } from "./types";

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
  try{
    const r=record(value,journalFields) as unknown as InventoryJournal;
    if(!token(r.pass,32)||!custodyId(r.journalId)||!["intake","artifact","processing"].includes(r.kind)||![1,2,3].includes(r.version)||!["reserved","committed","orphan"].includes(r.state))inventoryInvalid();
    if(r.caseId!==null)applicationId(r.caseId);utcInstant(r.cleanupAfter);
    if(r.kind==="artifact"?!["bundle","mime"].includes(r.artifactKind!):r.artifactKind!==null)inventoryInvalid();
    const limit=r.kind==="processing"?SCRATCH_RESERVE:r.kind==="artifact"?artifactLimit(r.artifactKind!):2*MAX_SEALED_BYTES;
    if(!natural(r.budget,limit)||r.budget===0)inventoryInvalid();
    if(r.kind==="intake"){
      if(!reservation||reservation.id!==r.journalId||r.reservationId!==r.journalId||!natural(reservation.reservedBytes,2*MAX_SEALED_BYTES)||reservation.reservedBytes===0)inventoryInvalid();
      const leased=r.generation!==null||r.domain!==null||r.allowance!==null;
      if(r.version>=2&&!leased)inventoryInvalid();
      if(leased&&(typeof r.generation!=="string"||!r.generation||typeof r.domain!=="string"||!r.domain||!natural(r.allowance,MAX_SEALED_BYTES)||r.allowance!==reservation.reservedBytes/2))inventoryInvalid();
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
  if(!token(r.eraseCommitId,32)||r.scanPass!==journal.pass||r.scanPass!==object.pass||r.journalId!==journal.journalId||r.journalId!==object.journalId||r.slot!==object.slot||r.leaf!==object.leaf||!["planned","holders-released","absent-synced","metadata-finalized"].includes(r.phase)||!natural(r.expectedSize)||!natural(r.remainingCharge,journal.allowance??journal.budget))inventoryInvalid();
  if((r.expectedDevice===null)!==(r.expectedInode===null)||(r.expectedDevice!==null&&(!natural(r.expectedDevice)||!natural(r.expectedInode))))inventoryInvalid();
  if(object.presence==="present"&&(r.expectedDevice!==object.device||r.expectedInode!==object.inode||r.expectedSize!==object.size))inventoryInvalid();
  return Object.freeze({...r});
}

// The original erasure repository retains this fixed writer. No connection,
// query operand, caller phase or structural DTO grants write authority.
export function createCustodyInventoryStorage(db: Database.Database, repository: ApplicationRepository, custody: CustodyLedger, config: CustodyConfig) {
  assertOriginalMaintenanceCustody(custody, repository, config);
  function pass(): string {
    const row = db.prepare("SELECT scanPass FROM erasure_maintenance WHERE singleton=1").get() as { scanPass: string };
    if (!token(row.scanPass, 32)) inventoryInvalid(); return row.scanPass;
  }
  function recordObservation(observation: CustodyObservation, run: MaintenanceRun) {
    assertMaintenanceCustodyIdentity(run, repository, custody);
    assertMaintenance(run, repository);
    const value = consumeCustodyObservation(observation, custody, run);
    if (value.kind === "invalidate") inventoryInvalid();
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
      if (db.prepare("UPDATE erasure_scans SET itemCount=itemCount+1 WHERE pass=? AND root=? AND state='scanning'").run(value.pass, value.root).changes !== 1) inventoryInvalid(); consumedItems++;
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
  return Object.freeze({ pass, record: recordObservation, invalidate });
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
