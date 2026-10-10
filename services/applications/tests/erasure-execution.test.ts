import { afterEach, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { rm } from "node:fs/promises";
import { lstatSync, linkSync, unlinkSync, renameSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { maintenanceFixture } from "./fixtures/maintenance";
import { refreshTestRepository } from "./fixtures/admission";
import { erasureOwner } from "../src/erasure-repository";
import { custodyErasureOwner } from "../src/custody-erasure";
import { beginMaintenance, bindMaintenance, settleMaintenance, maintenanceSnapshot, maintenanceCommand } from "../src/worker-maintenance";
import type { EraseScope, ErasureRowCursor, WorkerOwner } from "../src/types";

const connections = vi.hoisted(() => [] as Database.Database[]);
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default {
    constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connections.push(this); }
  } };
});
const fixtures: Awaited<ReturnType<typeof maintenanceFixture>>[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const f of fixtures) await settleMaintenance(f.owner).catch(() => {});
  for (const db of connections.splice(0)) if (db.open) db.close();
  for (const f of fixtures.splice(0)) await rm(f.root, { recursive: true, force: true });
});
async function setup(scope: EraseScope = "processing_payload", sanitation = false, withPredecessor = false) {
  const f = await maintenanceFixture("ordinary", sanitation); fixtures.push(f);
  const db = connections.at(-1)!;
  const accepted = await f.accept();
  if (scope === "identifying_register") await f.qualifySyntheticFinalScope(accepted);
  else f.advance((scope === "processing_contact" || scope === "incident_identity" ? 30 : 7) * 86400000);
  await refreshTestRepository(f.owner.repository);
  const erasure = erasureOwner(f.owner.repository);
  const predecessor = withPredecessor ? await f.owner.repository.withCaseLock(accepted.accepted.id,async()=>{
    const event=erasure.prepareCommit(accepted.accepted.id,"processing_payload");
    erasure.acknowledge(event,await erasure.journal!.append(event));return event;
  }):null;
  const event = await f.owner.repository.withCaseLock(accepted.accepted.id, async () => {
    const event = erasure.prepareCommit(accepted.accepted.id, scope);
    erasure.acknowledge(event, await erasure.journal!.append(event)); return event;
  });
  bindMaintenance(f.owner, f.services, f.monotonicNow);
  return { ...f, db, accepted, erasure, event, predecessor };
}
async function scan(owner: WorkerOwner) {
  for (let n = 0; n < 100; n++) {
    const run = await beginMaintenance(owner);
    try { if ((await custodyErasureOwner(owner.custody).scanBatch(run)).complete) return; }
    finally { await settleMaintenance(owner); }
  }
  throw new Error("SYNTHETIC_SCAN_DID_NOT_FINISH");
}
async function physical(owner: WorkerOwner, commit: string) {
  for (let n = 0; n < 200; n++) {
    const run = await beginMaintenance(owner);
    try { if ((await custodyErasureOwner(owner.custody).eraseScopeBatch(commit, run)).complete) return; }
    finally { await settleMaintenance(owner); }
  }
  throw new Error("SYNTHETIC_PHYSICAL_DID_NOT_FINISH");
}

it("minimizes actual payload sources and retires accepted ownership metadata before database maintenance", async () => {
  const f = await setup();
  await scan(f.owner); await physical(f.owner, f.event[1]);
  expect(f.db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(f.accepted.accepted.id)).toEqual({ payloadBytes: f.accepted.record.actualBytes });
  let cursor: ErasureRowCursor | null = null, complete = false;
  for (let n = 0; n < 100 && !complete; n++) {
    const run = await beginMaintenance(f.owner);
    try {
      const page = await f.erasure.applyRowBatch(f.event[1], cursor, run);
      cursor = page.next; complete = page.complete;
    } finally { await settleMaintenance(f.owner); }
  }
  expect(complete).toBe(true);
  expect(f.db.prepare("SELECT payloadBytes,encryptedPayloadPath FROM cases WHERE id=?").get(f.accepted.accepted.id)).toEqual({ payloadBytes: 0, encryptedPayloadPath: null });
  expect(f.db.prepare("SELECT * FROM artifacts WHERE caseId=?").all(f.accepted.accepted.id)).toEqual([]);
  expect(f.db.prepare("SELECT * FROM artifact_reservations WHERE caseId=?").all(f.accepted.accepted.id)).toEqual([]);
  expect(f.db.prepare("SELECT * FROM erasure_manifests").all()).toEqual([]);
  expect(f.db.prepare("SELECT * FROM erasure_inventory_journals WHERE caseId=?").all(f.accepted.accepted.id)).toEqual([]);
  expect(f.db.prepare("SELECT stage FROM erasure_obligations WHERE commitEventId=?").get(f.event[1])).toEqual({ stage: "database-maintenance-pending" });
  expect(f.db.pragma("foreign_key_check")).toEqual([]);
  const next = await f.restart();
  bindMaintenance(next.owner, next.services, f.monotonicNow);
  await scan(next.owner);
  let reinspected = false;
  for (let n = 0; n < 100 && !reinspected; n++) {
    const run = await beginMaintenance(next.owner);
    try { reinspected = (await erasureOwner(next.owner.repository).applyRowBatch(f.event[1], null, run)).complete; }
    finally { await settleMaintenance(next.owner); }
  }
  expect(reinspected).toBe(true);
});
it("requires the original baseline and rejects a later replacement method", async () => {
  const f=await setup(); await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  let run=await beginMaintenance(f.owner);
  await expect(f.erasure.checkpointDatabase(run)).rejects.toThrow("ERASURE_SANITATION_REQUIRED");
  await settleMaintenance(f.owner);
  // A changed method is not a substitute for the absent original binding.
  f.services.assertDatabaseSanitationBaseline=()=>{};
  run=await beginMaintenance(f.owner);
  await expect(f.erasure.checkpointDatabase(run)).rejects.toThrow("ERASURE_SANITATION_REQUIRED");
  await settleMaintenance(f.owner);
});
it("truncates the original WAL and recovers the exact done without the erased parent", async () => {
  const f=await setup("identifying_register",true); await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  expect(lstatSync(join(f.root,"registry.sqlite-wal")).size).toBeGreaterThan(0);
  await checkpoint(f);
  expect(f.db.prepare("SELECT stage FROM erasure_obligations WHERE commitEventId=?").get(f.event[1])).toEqual({stage:"locally-complete"});
  let run=await beginMaintenance(f.owner);
  const staged=await f.erasure.prepareDone(f.event[1],run);
  expect(staged.event?.[3]).toBe("erase_done");
  await settleMaintenance(f.owner);
  const receipt=await f.erasure.journal!.append(staged.event!);
  run=await beginMaintenance(f.owner);
  const retry=await f.erasure.prepareDone(f.event[1],run);
  expect(retry.event).toEqual(staged.event);
  await f.erasure.acknowledgeDone(staged.event!,receipt,run);
  await settleMaintenance(f.owner);
  expect(f.db.prepare("SELECT phase FROM erasure_events WHERE eventId=?").get(staged.event![1])).toEqual({phase:"acknowledged"});
  expect(f.db.prepare("SELECT * FROM cases").all()).toEqual([]);
  const next=await f.restart(); bindMaintenance(next.owner,next.services,f.monotonicNow);
  const restored=erasureOwner(next.owner.repository);
  run=await beginMaintenance(next.owner);
  await expect(restored.prepareDone(f.event[1],run)).rejects.toThrow("ERASURE_PENDING");
  await settleMaintenance(next.owner); await scan(next.owner);
  const recovered={...f,owner:next.owner,erasure:restored}; await rows(recovered); await checkpoint(recovered);
  run=await beginMaintenance(next.owner);
  expect((await restored.prepareDone(f.event[1],run)).event).toEqual(staged.event);
  await settleMaintenance(next.owner);
});
async function checkpoint(f: Pick<Awaited<ReturnType<typeof setup>>, "owner"|"erasure">) {
  for(let n=0;n<200;n++) {
    const run=await beginMaintenance(f.owner);
    try { if((await f.erasure.checkpointDatabase(run)).complete)return; }
    finally { await settleMaintenance(f.owner); }
  }
  throw new Error("SYNTHETIC_CHECKPOINT_DID_NOT_FINISH");
}

async function rows(f: Awaited<ReturnType<typeof setup>>) {
  let cursor: ErasureRowCursor | null = null;
  for (let n=0;n<5000;n++) {
    const run=await beginMaintenance(f.owner);
    try { const page=await f.erasure.applyRowBatch(f.event[1],cursor,run); expect(maintenanceSnapshot(f.owner).consumedItems).toBeLessThanOrEqual(1000); cursor=page.next; if(page.complete)return; }
    finally { await settleMaintenance(f.owner); }
  }
  throw new Error("SYNTHETIC_ROWS_DID_NOT_FINISH");
}
it.each(["processing_contact","public_token"] as const)("executes independent %s without payload authority or erasure", async scope => {
  const f=await setup(scope); await scan(f.owner); await rows(f);
  expect(f.db.prepare("SELECT payloadBytes FROM cases WHERE id=?").get(f.accepted.accepted.id)).toEqual({payloadBytes:f.accepted.record.actualBytes});
  expect(f.db.prepare("SELECT 1 FROM erasure_manifests").get()).toBeUndefined();
  expect(f.db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE caseId=?").get(f.accepted.accepted.id)).toBeDefined();
});
it("erases the genuine final identity and original reservation atomically after physical proof", async () => {
  const f=await setup("identifying_register"); await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  expect(f.db.prepare("SELECT * FROM cases").all()).toEqual([]);
  expect(f.db.prepare("SELECT * FROM reservations").all()).toEqual([]);
  for(const table of ["lifecycle_audit","lifecycle_proposals","case_lifecycle","deliveries","deletion_events","deletion_searches","erasure_inventory_journals"])
    expect(f.db.prepare(`SELECT * FROM ${table}`).all()).toEqual([]);
  expect(f.db.pragma("foreign_key_check")).toEqual([]);
});
it("carries unresolved original minimal sources before removing private lifecycle/mail operands", async () => {
  const f=await setup("identifying_register"); await scan(f.owner); await physical(f.owner,f.event[1]);
  const id=f.accepted.accepted.id;
  const last=f.db.prepare("SELECT eventId,event FROM lifecycle_proposals WHERE caseId=? ORDER BY rowid DESC LIMIT 1").get(id) as {eventId:string;event:string};
  const fence=["tj-journal-event-v1","b".repeat(32),f.event[2],"case_fence",[id,"fence",last.eventId,"99","hold"]];
  const intent=f.db.prepare("SELECT eventId FROM deletion_events WHERE caseId=? AND json_extract(event,'$[3]')='attempt_intent'").get(id) as {eventId:string};
  const mail=["tj-journal-event-v1","c".repeat(32),f.event[2],"mailbox_clear_observed",[id,intent.eventId,"1",f.event[2],f.event[2],"listed-selectable-v1"]];
  f.db.prepare("INSERT INTO lifecycle_proposals VALUES(?,?,?,? ,?,'proposed',NULL,NULL)").run(fence[1],id,JSON.stringify(fence),"PRIVATE_ACTION_CANARY","PRIVATE_GRANT_CANARY");
  f.db.prepare("UPDATE case_lifecycle SET pendingEventId=? WHERE caseId=?").run(fence[1],id);
  f.db.prepare("INSERT INTO deletion_events VALUES(?,?,?,NULL,'proposed',NULL,NULL)").run(mail[1],id,JSON.stringify(mail));
  await rows(f);
  expect(f.db.prepare("SELECT event,phase,entry,head,source,coveringCommit FROM erasure_safety_carry ORDER BY source").all()).toEqual([
    {event:JSON.stringify(fence),phase:"proposed",entry:null,head:null,source:"lifecycle",coveringCommit:f.event[1]},
    {event:JSON.stringify(mail),phase:"proposed",entry:null,head:null,source:"mailbox",coveringCommit:f.event[1]},
  ]);
  expect(f.db.prepare("SELECT * FROM lifecycle_proposals").all()).toEqual([]);
  expect(f.db.prepare("SELECT * FROM cases").all()).toEqual([]);
  expect(JSON.stringify(f.db.prepare("SELECT * FROM erasure_safety_carry").all())).not.toContain("PRIVATE_");
});
it.each(["secure-delete","baseline","method","database","wal-hardlink"])("keeps sanitation pending when %s evidence changes", async kind => {
  const f=await setup("processing_payload",true); await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  const path=join(f.root,"registry.sqlite"), link=join(f.root,"wal-extra");
  if(kind==="secure-delete")f.db.pragma("secure_delete=OFF");
  if(kind==="baseline")f.losePathExclusion();
  if(kind==="method")f.services.assertDatabaseSanitationBaseline=()=>{};
  if(kind==="database")renameSync(path,`${path}.old`);
  if(kind==="wal-hardlink")linkSync(`${path}-wal`,link);
  const run=await beginMaintenance(f.owner);
  await expect(f.erasure.checkpointDatabase(run)).rejects.toThrow("ERASURE_SANITATION_REQUIRED");
  expect(f.db.prepare("SELECT stage FROM erasure_obligations").get()).toEqual({stage:"database-maintenance-pending"});
  if(kind==="database")renameSync(`${path}.old`,path);
  if(kind==="wal-hardlink")unlinkSync(link);
});
it("keeps an actual active-reader checkpoint pending and succeeds after its reader settles", async()=>{
  const f=await setup("processing_payload",true); await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  f.db.exec("BEGIN DEFERRED"); f.db.prepare("SELECT * FROM journal_facts").all();
  const run=await beginMaintenance(f.owner);
  expect((await f.erasure.checkpointDatabase(run)).complete).toBe(false);
  expect(f.db.prepare("SELECT stage FROM erasure_obligations").get()).toEqual({stage:"database-maintenance-pending"});
  f.db.exec("ROLLBACK"); await settleMaintenance(f.owner); await checkpoint(f);
});
it("rolls back failed fixed row writes and retries without publishing skipped targets", async()=>{
  const f=await setup(); await scan(f.owner); await physical(f.owner,f.event[1]);
  f.db.exec("CREATE TEMP TRIGGER reject_payload_delete BEFORE DELETE ON artifact_reservations BEGIN SELECT RAISE(ABORT,'SYNTHETIC_FAILURE'); END");
  const run=await beginMaintenance(f.owner);
  await expect(f.erasure.applyRowBatch(f.event[1],null,run)).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
  expect(f.db.prepare("SELECT count(*) AS n FROM artifact_reservations").get()).toEqual({n:2});
  await settleMaintenance(f.owner); f.db.exec("DROP TRIGGER reject_payload_delete"); await rows(f);
  expect(f.db.prepare("SELECT count(*) AS n FROM artifact_reservations").get()).toEqual({n:0});
});
it("does not mutate when the original shared allowance cannot fund the row command", async()=>{
  const f=await setup(); await scan(f.owner); await physical(f.owner,f.event[1]);
  const run=await beginMaintenance(f.owner);
  await maintenanceCommand(run,f.owner.repository,800,"scalar",()=>({value:null,consumedItems:800}));
  expect(await f.erasure.applyRowBatch(f.event[1],null,run)).toEqual({next:null,complete:false,consumedItems:0});
  expect(maintenanceSnapshot(f.owner).consumedItems).toBe(800);
  expect(f.db.prepare("SELECT count(*) AS n FROM artifact_reservations").get()).toEqual({n:2});
});
it("consumes genuine independently completed payload coverage for incident identity",async()=>{
  const f=await setup("incident_identity",true,true); await scan(f.owner);
  const run=await beginMaintenance(f.owner);
  await expect(f.erasure.applyRowBatch(f.event[1],null,run)).rejects.toThrow("ERASURE_PAYLOAD_COVERAGE_REQUIRED");
  await settleMaintenance(f.owner);
  await physical(f.owner,f.predecessor![1]); await rows({...f,event:f.predecessor!}); await checkpoint(f);
  await rows(f); await checkpoint(f);
  expect(f.db.prepare("SELECT * FROM cases").all()).toEqual([]);
  expect(f.db.prepare("SELECT * FROM reservations").all()).toEqual([]);
});
it("finishes later final scope after genuine payload retirement without resurrecting predecessor manifests",async()=>{
  const f=await setup("identifying_register",true,true); await scan(f.owner);
  await physical(f.owner,f.predecessor![1]); await rows({...f,event:f.predecessor!}); await checkpoint(f);
  expect(f.db.prepare("SELECT * FROM erasure_manifests").all()).toEqual([]);
  await rows(f); await checkpoint(f);
  expect(f.db.prepare("SELECT * FROM cases").all()).toEqual([]);
  expect(f.db.prepare("SELECT * FROM erasure_manifests").all()).toEqual([]);
});
it("retires over 1000 old-pass observed metadata objects through bounded examined-key continuations",async()=>{
  const f=await setup(); await scan(f.owner); await physical(f.owner,f.event[1]);
  const journal=f.db.prepare("SELECT * FROM erasure_inventory_journals LIMIT 1").get() as Record<string,unknown>;
  const object=f.db.prepare("SELECT * FROM erasure_inventory_objects WHERE slot='journal' LIMIT 1").get() as Record<string,unknown>;
  f.db.transaction(()=>{
    for(let n=1;n<=1001;n++) {
      const pass=n.toString(16).padStart(32,"0");
      f.db.prepare(`INSERT INTO erasure_inventory_journals(${Object.keys(journal).join(",")}) VALUES(${Object.keys(journal).map(k=>`@${k}`).join(",")})`).run({...journal,pass});
      f.db.prepare(`INSERT INTO erasure_inventory_objects(${Object.keys(object).join(",")}) VALUES(${Object.keys(object).map(k=>`@${k}`).join(",")})`).run({...object,pass});
    }
  }).immediate();
  const plans=f.db.prepare("EXPLAIN QUERY PLAN SELECT pass,journalId,slot,leaf FROM erasure_inventory_objects WHERE (pass,journalId,slot,leaf)>(?,?,?,?) ORDER BY pass,journalId,slot,leaf LIMIT 1").all("","","","") as {detail:string}[];
  expect(plans.some(p=>p.detail.includes("SEARCH")&&p.detail.includes("INDEX"))).toBe(true);
  await rows(f);
  expect(f.db.prepare("SELECT count(*) AS n FROM erasure_inventory_objects").get()).toEqual({n:0});
  expect(f.db.prepare("SELECT count(*) AS n FROM erasure_inventory_journals").get()).toEqual({n:0});
},30000);
it("rejects replacement of the original WAL by an empty otherwise-safe file",async()=>{
  const f=await setup("processing_payload",true); await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  const wal=join(f.root,"registry.sqlite-wal"); renameSync(wal,`${wal}.old`); writeFileSync(wal,"",{mode:0o600});
  try {
    const run=await beginMaintenance(f.owner);
    await expect(f.erasure.checkpointDatabase(run)).rejects.toThrow("ERASURE_SANITATION_REQUIRED");
  } finally {unlinkSync(wal);renameSync(`${wal}.old`,wal);}
});
it("does not stage done after losing the original sanitation exclusion",async()=>{
  const f=await setup("processing_payload",true); await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f); await checkpoint(f);
  f.losePathExclusion(); const run=await beginMaintenance(f.owner);
  await expect(f.erasure.prepareDone(f.event[1],run)).rejects.toThrow("ERASURE_SANITATION_REQUIRED");
  expect(f.db.prepare("SELECT 1 FROM erasure_events WHERE json_extract(event,'$[3]')='erase_done'").get()).toBeUndefined();
});
it("does not retain a private row canary in the database or WAL after actual sanitation",async()=>{
  const f=await setup("processing_contact",true); const canary="SYNTHETIC_CONTACT_CANARY_98fc04";
  f.db.prepare("UPDATE deliveries SET contactEnvelope=? WHERE caseId=?").run(canary,f.accepted.accepted.id);
  await scan(f.owner); await rows(f); await checkpoint(f);
  expect(readFileSync(join(f.root,"registry.sqlite")).includes(Buffer.from(canary))).toBe(false);
  expect(readFileSync(join(f.root,"registry.sqlite-wal")).includes(Buffer.from(canary))).toBe(false);
});
it("denies parentless terminal completion when an original associated reservation reappears",async()=>{
  const f=await setup("identifying_register",true);
  const reservation=f.db.prepare("SELECT * FROM reservations WHERE id=(SELECT reservationId FROM cases WHERE id=?)").get(f.accepted.accepted.id) as Record<string,unknown>;
  await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  f.db.prepare(`INSERT INTO reservations(${Object.keys(reservation).join(",")}) VALUES(${Object.keys(reservation).map(k=>`@${k}`).join(",")})`).run(reservation);
  const run=await beginMaintenance(f.owner);
  await expect(f.erasure.checkpointDatabase(run)).rejects.toThrow();
  expect(f.db.prepare("SELECT stage FROM erasure_obligations").get()).toEqual({stage:"database-maintenance-pending"});
});
it("charges original SQL selection, returned rows and mutations throughout row and sanitation commands",async()=>{
  const f=await setup("identifying_register",true); await scan(f.owner); await physical(f.owner,f.event[1]);
  let sqlItems=0, total=0; const prepare=f.db.prepare.bind(f.db);
  vi.spyOn(f.db,"prepare").mockImplementation(sql=>{
    const statement=prepare(sql), get=statement.get.bind(statement), all=statement.all.bind(statement), run=statement.run.bind(statement);
    vi.spyOn(statement,"get").mockImplementation((...args)=>{const value=get(...args);sqlItems+=1+(value?1:0);return value;});
    vi.spyOn(statement,"all").mockImplementation((...args)=>{const value=all(...args);sqlItems+=1+value.length;return value;});
    vi.spyOn(statement,"run").mockImplementation((...args)=>{const value=run(...args);sqlItems+=1+value.changes;return value;});
    return statement;
  });
  let cursor:ErasureRowCursor|null=null, complete=false;
  for(let n=0;n<200&&!complete;n++){
    const run=await beginMaintenance(f.owner); sqlItems=0;
    const result=await f.erasure.applyRowBatch(f.event[1],cursor,run);
    expect(result.consumedItems).toBeGreaterThanOrEqual(sqlItems); total+=sqlItems; cursor=result.next; complete=result.complete;
    await settleMaintenance(f.owner);
  }
  expect(complete).toBe(true); expect(total).toBeGreaterThan(100);
  complete=false;
  for(let n=0;n<200&&!complete;n++){
    const run=await beginMaintenance(f.owner); sqlItems=0;
    const result=await f.erasure.checkpointDatabase(run);
    expect(result.consumedItems).toBeGreaterThanOrEqual(sqlItems); complete=result.complete;
    await settleMaintenance(f.owner);
  }
  expect(complete).toBe(true);
});
it("carries an acknowledged mailbox mutation whose original result is still unknown",async()=>{
  const f=await setup("identifying_register");
  const intent=f.db.prepare("SELECT eventId FROM deletion_events WHERE caseId=? AND json_extract(event,'$[3]')='attempt_intent'").get(f.accepted.accepted.id) as {eventId:string};
  const marker:import("../src/types").MailboxJournalEvent=["tj-journal-event-v1","d".repeat(32),f.event[2],"copy_mutation_started",[f.accepted.accepted.id,intent.eventId,"1","a".repeat(64)]];
  const receipt=await f.erasure.journal!.append(marker);
  f.db.prepare("INSERT INTO deletion_events VALUES(?,?,?,NULL,'acknowledged',?,?)").run(marker[1],f.accepted.accepted.id,JSON.stringify(marker),receipt.entry,receipt.head);
  await scan(f.owner); await physical(f.owner,f.event[1]); await rows(f);
  expect(f.db.prepare("SELECT eventId,phase,entry,head FROM erasure_safety_carry WHERE source='mailbox'").get()).toEqual({eventId:marker[1],phase:"acknowledged",entry:receipt.entry,head:receipt.head});
});
