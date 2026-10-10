import { afterEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRepository } from "../src/repository";
import { createSafetyJournal } from "../src/ledger";
import { encodeJournalEvent } from "../src/ledger-contract";
import { erasureOwner } from "../src/erasure-repository";
import { replayAssociation } from "../src/erasure-association";
import { createHash } from "node:crypto";
import { removeTask11Schema, removeTask11B1Schema, removeTask11B1bNSchema, removeTask11CSchema, testAdmission, testAdmissionScope } from "./fixtures/admission";
import { applicationId,digest, utcInstant } from "../src/types";
import { caseId, instant, syntheticJournal } from "./fixtures/ledger";
import type { EraseJournalEvent, JournalEvent,SafetyJournal } from "../src/types";

const connection = vi.hoisted(() => ({ current: undefined as Database.Database | undefined }));
vi.mock("better-sqlite3", async original => {
  const actual = await original<{ default: typeof Database }>();
  return { default: class extends actual.default { constructor(...args: ConstructorParameters<typeof actual.default>) { super(...args); connection.current = this; } } };
});
const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });
function setup() {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "erasure-synthetic-")), fixture = syntheticJournal();
  let journal!: SafetyJournal;
  let time = Date.parse(instant), startup: "ordinary" | "cold-maintenance" = "ordinary";
  const scope = { ledgerId: fixture.context.ledgerId, historyEpoch: fixture.context.historyEpoch, associationKeyId: "erase-key", associationKey: Buffer.alloc(32, 7), approvedScopes: [testAdmissionScope] };
  const open = () => openRepository(join(dir, "registry.sqlite"), { now: () => new Date(time) }, { startup, admissionScope: { currentScope: () => testAdmissionScope }, deletionScope: { currentScope: () => scope }, journalFactory: projection => journal = createSafetyJournal({ port: { append: event => fixture.port.append(event), readSince: cursor => fixture.port.readSince(cursor) }, trust: { currentContext: () => fixture.context }, clock: { wallNow: () => new Date(time), monotonicNow: () => time - Date.parse(instant) }, projection }) });
  let repository = open();
  cleanups.push(() => { repository.close(); rmSync(dir, { recursive: true, force: true }); });
  return { fixture, dir, scope, get repository() { return repository; }, get journal() { return journal; }, get db() { return connection.current!; }, advance(ms: number) { time += ms; }, restart(mode: typeof startup = "ordinary") { repository.close(); startup = mode; repository = open(); } };
}
const commit: EraseJournalEvent = ["tj-journal-event-v1", "c".repeat(32), instant, "erase_commit", [caseId, "processing_payload", "erase-key", "d".repeat(64)]];
const done: EraseJournalEvent = ["tj-journal-event-v1", "e".repeat(32), instant, "erase_done", [caseId, commit[1]]];
describe("original erasure owner foundations", () => {
  it("stages due erasure under the original guard before replay suppression and exact acknowledgement", async () => {
    const s = setup(), now = utcInstant(instant);
    await s.journal.refresh("startup");
    const reservation = s.repository.reserve({ ...testAdmission(), sessionHash: digest("a".repeat(64)), idempotencyKey: "accepted", reservedBytes: 1, now });
    const accepted = s.repository.commitIntake({ reservationId: reservation.id, digest: digest("b".repeat(64)), encryptedPayloadPath: join(s.dir, "payload.enc"), actualBytes: 1, encryptedName: "synthetic", job: "sales-fulltime", now });
    const owner = erasureOwner(s.repository);
    expect(() => owner.prepareCommit(accepted.id, "processing_payload")).toThrow("ERASURE_GUARD_REQUIRED");
    await expect(s.repository.withCaseLock(accepted.id, async () => owner.prepareCommit(accepted.id, "processing_payload"))).rejects.toThrow("ERASURE_NOT_DUE");
    s.advance(7 * 86400000); await s.journal.refresh("refresh");
    await s.repository.withCaseLock(accepted.id, async () => {
      const event = owner.prepareCommit(accepted.id, "processing_payload");
      expect(owner.pending(accepted.id)).toEqual(event);
      expect(owner.prepareCommit(accepted.id, "processing_payload")).toEqual(event);
      expect(() => s.repository.commitIntake({ reservationId: reservation.id, digest: digest("b".repeat(64)), encryptedPayloadPath: join(s.dir, "payload.enc"), actualBytes: 1, encryptedName: "synthetic", job: "sales-fulltime", now })).toThrow("ERASURE_REPLAY_DENIED");
      owner.acknowledge(event, await s.journal.append(event));
      expect(owner.pending(accepted.id)).toBeNull();
    });
    expect(s.repository.getCommittedIntake(accepted.id)).toBeNull();
    expect(s.repository.listRetainedIntakes()).toEqual([]);
    expect(s.repository.listArtifactReservations()).toEqual([]);
    expect(s.repository.getArtifact(accepted.id,"bundle")).toBeNull();
    expect((await s.repository.withCaseLock(accepted.id,async row=>row)).encryptedPayloadPath).toBeNull();
    await expect(s.repository.adoptArtifact({caseId:accepted.id,kind:"bundle"} as never,1)).rejects.toThrow("PAYLOAD_ERASED");
    expect(owner.listWork(1000).items).toHaveLength(1);
    await owner.withErasureGuard(owner.listWork(1000).items[0].commitEventId,async work=>{
      expect(()=>owner.rowPage(work.commitEventId,null,0)).toThrow("ERASURE_BUDGET_INVALID");
      const page=owner.rowPage(work.commitEventId,null,1000);
      expect(page.targets.map(item=>item.phase)).toEqual(["payload-reservations","payload-reservations"]);
      expect(page.consumedItems).toBeLessThanOrEqual(1000);
      expect(()=>owner.rowPage(work.commitEventId,[work.commitEventId,"identity-audit",null],1000)).toThrow();
    });
    const tokenEvent:EraseJournalEvent=["tj-journal-event-v1","f".repeat(32),"2026-10-17T12:00:00.000Z","erase_commit",[accepted.id,"public_token","erase-key",replayAssociation(s.scope,digest("a".repeat(64)),"accepted")]];
    await s.journal.append(tokenEvent);
    const insert=s.db.prepare("INSERT INTO status_proofs VALUES(?,?,?)");
    s.db.transaction(()=>{for(let i=0;i<1000;i++)insert.run(i.toString(16).padStart(64,"0"),accepted.id,"2026-10-18T12:00:00.000Z");})();
    await owner.withErasureGuard(tokenEvent[1],async work=>{
      const first=owner.rowPage(work.commitEventId,null,1000),second=owner.rowPage(work.commitEventId,first.next,1000),end=owner.rowPage(work.commitEventId,second.next,1000);
      expect(first.targets).toHaveLength(979);expect(first.consumedItems).toBe(1000);
      expect(new Set([...first.targets,...second.targets].map(item=>item.key)).size).toBe(1001);
      expect(end.targets).toEqual([]);expect(end.next).toBeNull();
    });
  });
  it("migrates fresh and genuine schema8/9/10/11 owners to exactly schema13", () => {
    const s = setup(); expect(s.db.pragma("user_version", { simple: true })).toBe(13);
    removeTask11B1bNSchema(s.db); s.db.pragma("user_version=11");
    s.db.prepare("INSERT INTO reservations(id,sessionHash,idempotencyKey,reservedBytes,expiresAt,active) VALUES(?,?,?,?,?,1)").run("historical-source", "a".repeat(64), "historical", 20000, instant);
    s.restart();
    expect(s.db.pragma("user_version", { simple: true })).toBe(13);
    expect(s.db.prepare("SELECT custodyStarted,cleanupDisposition,active FROM reservations WHERE id='historical-source'").get()).toEqual({ custodyStarted: null, cleanupDisposition: null, active: 1 });
    expect(() => s.db.prepare("UPDATE reservations SET custodyStarted=0 WHERE id='historical-source'").run()).toThrow("IMMUTABLE_CLEANUP_SOURCE");
    expect(() => s.db.prepare("UPDATE reservations SET custodyStarted=1 WHERE id='historical-source'").run()).toThrow("IMMUTABLE_CLEANUP_SOURCE");
    removeTask11B1bNSchema(s.db);
    s.db.exec("DROP INDEX erasure_inventory_case; DROP INDEX erasure_manifest_execution; DROP INDEX erasure_inventory_identity; PRAGMA user_version=10;"); s.restart();
    expect(s.db.pragma("user_version", { simple: true })).toBe(13);
    removeTask11B1Schema(s.db); s.db.pragma("user_version=9"); s.restart();
    expect(s.db.pragma("user_version", { simple: true })).toBe(13);
    removeTask11Schema(s.db);s.db.pragma("user_version=8");s.restart();
    expect(s.db.pragma("user_version",{simple:true})).toBe(13);
    expect(s.db.prepare("SELECT name FROM sqlite_master WHERE name='deletion_contradictory_result'").get()).toBeDefined();
  });
  it("migrates genuine schema12 preserving existing fixed cursors and adding the indexed ninth stream exactly once", () => {
    const s = setup(); removeTask11CSchema(s.db); s.db.pragma("user_version=12");
    s.db.prepare("UPDATE maintenance_selectors SET duePhase=7,pendingPhase=1,globalPhase=3").run();
    s.db.prepare("UPDATE maintenance_due_cursors SET keyAt=?,keyId=? WHERE stream=7").run(instant, caseId);
    s.restart();
    expect(s.db.pragma("user_version", { simple: true })).toBe(13);
    expect(s.db.prepare("SELECT duePhase,pendingPhase,globalPhase FROM maintenance_selectors").get()).toEqual({ duePhase: 7, pendingPhase: 1, globalPhase: 3 });
    expect(s.db.prepare("SELECT * FROM maintenance_due_cursors WHERE stream>=7 ORDER BY stream").all()).toEqual([{ stream: 7, keyAt: instant, keyId: caseId }, { stream: 8, keyAt: "", keyId: "" }]);
    const plan = s.db.prepare("EXPLAIN QUERY PLAN SELECT recordedAt,caseId FROM delivery_incident_resolutions INDEXED BY maintenance_incident_resolution_due WHERE recordedAt<=? AND (recordedAt,caseId)>(?,?) ORDER BY recordedAt,caseId LIMIT 4").all(instant, "", "") as { detail: string }[];
    expect(plan.map(row => row.detail).join(" ")).toContain("SEARCH delivery_incident_resolutions USING COVERING INDEX maintenance_incident_resolution_due");
    s.restart(); expect(s.db.prepare("SELECT count(*) n FROM maintenance_due_cursors").get()).toEqual({ n: 9 });
  });
  it("rejects incomplete present-object and cross-kind inventory rows at the schema boundary",()=>{
    const s=setup(),pass="a".repeat(32),id="b".repeat(36);
    s.db.prepare("INSERT INTO erasure_inventory_journals VALUES(?,?,NULL,'processing',2,'reserved',NULL,1,?,NULL,NULL,NULL,NULL)").run(pass,id,instant);
    const insert=s.db.prepare("INSERT INTO erasure_inventory_objects(pass,journalId,slot,root,presence) VALUES(?,?,?,?,?)");
    expect(()=>insert.run(pass,id,"processing-directory","runtime","present")).toThrow();
    expect(()=>insert.run(pass,id,"artifact-sealed","custody","absent")).toThrow();
  });
  it("cold construction preserves reservations and corrupt delivery rows without exposing ordinary capabilities",async()=>{
    const s=setup();await s.journal.refresh("startup");
    const now=utcInstant(instant),first=s.repository.reserve({...testAdmission(),sessionHash:digest("a".repeat(64)),idempotencyKey:"cold",reservedBytes:1,now});
    const accepted=s.repository.commitIntake({reservationId:first.id,digest:digest("b".repeat(64)),encryptedPayloadPath:join(s.dir,"payload.enc"),actualBytes:1,encryptedName:"synthetic",job:"sales-fulltime",now});
    const reservation=s.repository.reserve({...testAdmission(),sessionHash:digest("a".repeat(64)),idempotencyKey:"cold-pending",reservedBytes:1,now});
    s.db.prepare("UPDATE deliveries SET receiptSchedule='corrupt' WHERE caseId=?").run(accepted.id);
    s.restart("cold-maintenance");
    expect(s.db.prepare("SELECT active FROM reservations WHERE id=?").get(reservation.id)).toEqual({active:1});
    expect(s.db.prepare("SELECT receiptSchedule FROM deliveries WHERE caseId=?").get(accepted.id)).toEqual({receiptSchedule:"corrupt"});
    for(const operation of [()=>s.repository.getArtifact(caseId,"bundle"),()=>s.repository.listRetainedIntakes(),()=>s.repository.getDelivery(caseId),()=>s.repository.createAuthentication({} as never),()=>s.repository.claimNext("owner",utcInstant(instant))])expect(operation).toThrow("REPOSITORY_COLD");
    await s.journal.refresh("restore");expect(s.journal.observation()).not.toBeNull();
    expect(()=>s.repository.listRetainedIntakes()).toThrow("REPOSITORY_COLD");
    expect(()=>s.restart()).toThrow("INVALID_DELIVERY_METADATA");
  });
  it("locks restored auth atomically and preserves staff/counter state without an unlock",async()=>{
    const s=setup(),staff="123e4567-e89b-42d3-a456-426614174000";
    await s.journal.refresh("startup");const now=utcInstant(instant),reservation=s.repository.reserve({...testAdmission(),sessionHash:digest("a".repeat(64)),idempotencyKey:"auth-lock",reservedBytes:1,now});
    const accepted=s.repository.commitIntake({reservationId:reservation.id,digest:digest("b".repeat(64)),encryptedPayloadPath:join(s.dir,"payload.enc"),actualBytes:1,encryptedName:"synthetic",job:"sales-fulltime",now});
    s.db.prepare("INSERT INTO auth_staff VALUES(?,'niko','Nikolaos Jammers',1,3,'password-canary','factor-canary',42)").run(staff);
    s.db.prepare("INSERT INTO auth_sessions VALUES('session',?,3,'epoch','csrf',?,?,?,0)").run(staff,instant,instant,instant);
    s.db.prepare("INSERT INTO auth_grants VALUES('grant',?,'session',3,'epoch','review',?,1,?,?)").run(staff,accepted.id,instant,instant);
    s.db.prepare("INSERT INTO auth_recovery VALUES('recovery',?,3)").run(staff);
    s.db.prepare("INSERT INTO auth_attempts VALUES('staff','rate',?)").run(instant);
    s.db.prepare("INSERT INTO auth_clock VALUES(1,?)").run(instant);
    const original=s.db.prepare("SELECT * FROM auth_staff").get();
    expect(()=>erasureOwner(s.repository).lockRestoredAuthentication()).toThrow("AUTH_RESTORE_LOCK_UNAVAILABLE");
    s.restart();expect(s.db.prepare("SELECT 1 FROM auth_sessions").get()).toBeDefined();
    s.restart("cold-maintenance");
    s.db.exec("CREATE TRIGGER synthetic_lock_fault BEFORE DELETE ON auth_recovery BEGIN SELECT RAISE(ABORT,'synthetic fault');END;");
    expect(()=>erasureOwner(s.repository).lockRestoredAuthentication()).toThrow();
    expect(s.db.prepare("SELECT authLocked FROM erasure_maintenance").get()).toEqual({authLocked:0});
    expect(s.db.prepare("SELECT 1 FROM auth_sessions").get()).toBeDefined();
    expect(()=>s.repository.createAuthentication({} as never)).toThrow("REPOSITORY_COLD");
    s.db.exec("DROP TRIGGER synthetic_lock_fault;");erasureOwner(s.repository).lockRestoredAuthentication();
    expect(s.db.prepare("SELECT * FROM auth_staff").get()).toEqual(original);
    expect(s.db.prepare("SELECT 1 FROM auth_grants UNION ALL SELECT 1 FROM auth_sessions UNION ALL SELECT 1 FROM auth_recovery").all()).toEqual([]);
    expect(s.db.prepare("SELECT 1 FROM auth_attempts").get()).toBeDefined();
    expect(s.db.prepare("SELECT lastAt FROM auth_clock").get()).toEqual({lastAt:instant});
    s.restart();expect(()=>s.repository.createAuthentication({} as never)).toThrow("AUTH_DENIED");
    expect(()=>s.db.prepare("UPDATE erasure_maintenance SET authLocked=0").run()).toThrow("AUTH_RESTORE_LOCKED");
  });
  it("projects absent-case commit and historical done without inventing a live parent or physical completion", async () => {
    const s = setup(); s.fixture.commit(commit); s.fixture.commit(done);
    await s.journal.refresh("restore");
    expect(s.db.prepare("SELECT 1 FROM cases WHERE id=?").get(caseId)).toBeUndefined();
    expect(s.db.prepare("SELECT scope,stage,historicalDone FROM erasure_obligations WHERE commitEventId=?").get(commit[1])).toEqual({ scope: "processing_payload", stage: "rows-pending", historicalDone: done[1] });
    expect(s.db.prepare("SELECT replayAssociation FROM erasure_replay").get()).toEqual({ replayAssociation: "d".repeat(64) });
    s.db.prepare("UPDATE erasure_obligations SET stage='database-maintenance-pending' WHERE commitEventId=?").run(commit[1]);
    await s.journal.refresh("refresh");
    expect(s.db.prepare("SELECT stage FROM erasure_obligations").get()).toEqual({ stage: "database-maintenance-pending" });
    s.restart(); await s.journal.refresh("restore");
    expect(s.db.prepare("SELECT stage FROM erasure_obligations").get()).toEqual({ stage: "rows-pending" });
  });
  it("rejects orphan completion before advancing the applied checkpoint", async () => {
    const s = setup(); s.fixture.commit(done);
    await expect(s.journal.refresh("restore")).rejects.toThrow();
    expect(s.journal.observation()).toBeNull();
    expect(s.db.prepare("SELECT sequence FROM journal_projection").get()).toEqual({ sequence: "0" });
  });
  it.each(["cross-case","second-completion"])("rejects %s completion binding",async variant=>{
    const s=setup();s.fixture.commit(commit);
    if(variant==="second-completion")s.fixture.commit(done);
    s.fixture.commit(["tj-journal-event-v1","f".repeat(32),instant,"erase_done",[variant==="cross-case"?applicationId("22222222-2222-4222-8222-222222222222"):caseId,commit[1]]]);
    await expect(s.journal.refresh("restore")).rejects.toThrow();
    expect(s.db.prepare("SELECT sequence FROM journal_projection").get()).toEqual({sequence:variant==="cross-case"?"1":"2"});
    expect(s.db.prepare("SELECT historicalDone FROM erasure_obligations").get()).toEqual({historicalDone:variant==="cross-case"?null:done[1]});
  });
  it.each(["orphan","wrong-kind","cross-case","later-intent","later-fence"])("rejects %s final clear causality",async variant=>{
    const s=setup(),other=applicationId("22222222-2222-4222-8222-222222222222");
    const intent:JournalEvent=["tj-journal-event-v1","1".repeat(32),instant,"attempt_intent",[caseId,"3".repeat(32),"initial","2".repeat(32),"1","4".repeat(32),"erase-key","5".repeat(64)]];
    const clear:JournalEvent=["tj-journal-event-v1","6".repeat(32),instant,"mailbox_clear_observed",[caseId,intent[1],"1",instant,instant,"listed-selectable-v1"]];
    expect(()=>encodeJournalEvent(intent)).not.toThrow();expect(()=>encodeJournalEvent(clear)).not.toThrow();
    if(variant!=="orphan"){s.fixture.commit(intent);s.fixture.commit(clear);}
    if(variant==="later-intent")s.fixture.commit([...intent.slice(0,1),"7".repeat(32),...intent.slice(2)] as unknown as JournalEvent);
    if(variant==="later-fence")s.fixture.commit(["tj-journal-event-v1","8".repeat(32),instant,"case_fence",[caseId,"initial","2".repeat(32),"2","hold"]]);
    s.fixture.commit(["tj-journal-event-v1","9".repeat(32),instant,"erase_commit",[variant==="cross-case"?other:caseId,"identifying_register","erase-key","a".repeat(64),"initial","2".repeat(32),"1",variant==="wrong-kind"?intent[1]:clear[1],"b".repeat(64)]]);
    await expect(s.journal.refresh("restore")).rejects.toThrow();expect(s.db.prepare("SELECT 1 FROM erasure_obligations").get()).toBeUndefined();
    expect(s.db.prepare("SELECT sequence FROM journal_projection").get()).toEqual({sequence:variant==="orphan"?"0":variant.startsWith("later-")?"3":"2"});
  });
  it("rolls back erasure index, obligation and checkpoint together on projection failure",async()=>{
    const s=setup();s.fixture.commit(commit);
    s.db.exec("CREATE TRIGGER synthetic_projection_fault BEFORE INSERT ON journal_facts BEGIN SELECT RAISE(ABORT,'synthetic failure');END;");
    await expect(s.journal.refresh("restore")).rejects.toThrow();
    expect(s.db.prepare("SELECT sequence FROM journal_projection").get()).toEqual({sequence:"0"});
    for(const table of ["erasure_scopes","erasure_replay","erasure_obligations"])expect(s.db.prepare(`SELECT 1 FROM ${table}`).get()).toBeUndefined();
  });
  it.each(["processing_payload","public_token","incident_identity"] as const)("denies reacceptance but keeps only permitted proof visibility for %s",async scope=>{
    const s=setup(),now=utcInstant(instant),sessionHash=digest("a".repeat(64)),idempotencyKey="proof";
    const request={...testAdmission(),sessionHash,idempotencyKey,reservedBytes:1,now};
    expect(()=>s.repository.reserve(request)).toThrow("ERASURE_ADMISSION_UNAVAILABLE");await s.journal.refresh("startup");
    const reservation=s.repository.reserve({...request,...testAdmission()}),input={reservationId:reservation.id,digest:digest("b".repeat(64)),encryptedPayloadPath:join(s.dir,"payload.enc"),actualBytes:1,encryptedName:"synthetic",job:"sales-fulltime" as const,now};
    const accepted=s.repository.commitIntake(input),proof=digest(createHash("sha256").update(accepted.statusProof).digest("hex"));
    s.fixture.commit(["tj-journal-event-v1","d".repeat(32),instant,"erase_commit",[accepted.id,scope,"erase-key",replayAssociation(s.scope,sessionHash,idempotencyKey)]]);await s.journal.refresh("refresh");
    expect(()=>s.repository.reserve({...request,...testAdmission()})).toThrow("ERASURE_REPLAY_DENIED");
    expect(()=>s.repository.commitIntake(input)).toThrow("ERASURE_REPLAY_DENIED");
    expect(s.repository.getPublicStatus(proof,now)===null).toBe(scope!=="processing_payload");
    expect(s.repository.getPublicStatus(proof,utcInstant("2026-10-17T12:00:00.000Z"))).toBeNull();
    expect(s.repository.claimNext("worker",now)===null).toBe(scope!=="public_token");
    if(scope==="processing_payload")expect(s.repository.getDelivery(accepted.id).payloadErased).toBe(true);
  });
  it("rejects stale coverage and permanently changed independently supplied association keys",async()=>{
    const s=setup(),request=()=>({...testAdmission(),sessionHash:digest("a".repeat(64)),idempotencyKey:"key",reservedBytes:1,now:utcInstant(instant)});
    await s.journal.refresh("startup");const reservation=s.repository.reserve(request());s.repository.releaseReservation(reservation.id);
    s.advance(61000);expect(()=>s.repository.reserve(request())).toThrow("ERASURE_ADMISSION_UNAVAILABLE");
    await s.journal.refresh("refresh");s.scope.associationKey[0]^=1;expect(()=>s.repository.reserve(request())).toThrow("ERASURE_ADMISSION_UNAVAILABLE");
    s.scope.associationKey[0]^=1;expect(()=>s.repository.reserve(request())).toThrow("ERASURE_ADMISSION_UNAVAILABLE");
  });
  it("bounds replay-scope consistency to indexed existence probes despite a large current history",async()=>{
    const s=setup();await s.journal.refresh("startup");
    const insert=s.db.prepare("INSERT INTO erasure_replay VALUES(?,?,?,?,?,NULL)");
    s.db.transaction(()=>{for(let i=0;i<2001;i++)insert.run(s.scope.ledgerId,s.scope.historyEpoch,s.scope.associationKeyId,i.toString(16).padStart(64,"0"),"c".repeat(32));})();
    const prepare=s.db.prepare.bind(s.db),calls=vi.spyOn(s.db,"prepare");
    const now=utcInstant(instant),reservation=s.repository.reserve({...testAdmission(),sessionHash:digest("a".repeat(64)),idempotencyKey:"bounded-scope",reservedBytes:1,now});
    s.repository.commitIntake({reservationId:reservation.id,digest:digest("b".repeat(64)),encryptedPayloadPath:join(s.dir,"payload.enc"),actualBytes:1,encryptedName:"synthetic",job:"sales-fulltime",now});
    const checks=calls.mock.calls.map(([sql])=>sql).filter(sql=>sql.startsWith("SELECT 1 FROM erasure_replay WHERE")&&(sql.match(/\?/g)?.length===3));
    calls.mockRestore();
    expect(checks.length).toBeGreaterThan(0);
    for(const sql of checks){
      const plan=prepare(`EXPLAIN QUERY PLAN ${sql}`).all(s.scope.ledgerId,s.scope.historyEpoch,s.scope.associationKeyId) as {detail:string}[];
      expect(plan.map(row=>row.detail).join(" ")).toMatch(/^SEARCH erasure_replay USING COVERING INDEX .+\(\(ledgerId,historyEpoch,associationKeyId\)[<>]/);
      expect(sql).toMatch(/LIMIT 1$/);
    }
    expect(checks).toHaveLength(4); // Two bounded probes at reserve and at commit.
  });
  it.each(["ledgerId","historyEpoch","associationKeyId"] as const)("denies incompatible restored %s on either side of the current tuple",async field=>{
    for(const foreign of ["", "z".repeat(64)]){
      const s=setup();await s.journal.refresh("startup");
      const tuple={...s.scope,[field]:foreign};
      s.db.prepare("INSERT INTO erasure_replay VALUES(?,?,?,?,?,NULL)").run(tuple.ledgerId,tuple.historyEpoch,tuple.associationKeyId,"d".repeat(64),"c".repeat(32));
      expect(()=>s.repository.reserve({...testAdmission(),sessionHash:digest("a".repeat(64)),idempotencyKey:"foreign-scope",reservedBytes:1,now:utcInstant(instant)})).toThrow("ERASURE_ADMISSION_UNAVAILABLE");
      expect(s.db.prepare("SELECT 1 FROM reservations").get()).toBeUndefined();
    }
  });
  it("restored absent-case erasure blocks the original request before any new acceptance",async()=>{
    const s=setup(),sessionHash=digest("a".repeat(64)),idempotencyKey="restore";
    s.fixture.commit(["tj-journal-event-v1","d".repeat(32),instant,"erase_commit",[caseId,"processing_payload","erase-key",replayAssociation(s.scope,sessionHash,idempotencyKey)]]);
    await s.journal.refresh("restore");
    expect(()=>s.repository.reserve({...testAdmission(),sessionHash,idempotencyKey,reservedBytes:1,now:utcInstant(instant)})).toThrow("ERASURE_REPLAY_DENIED");
    expect(s.db.prepare("SELECT 1 FROM cases").get()).toBeUndefined();
  });
  it.each([["processing_payload",23],["processing_contact",23],["incident_identity",24],["public_token",168]] as const)("uses the existing actual invalid-data deadline for %s",async(scope,hours)=>{
    const s=setup(),now=utcInstant(instant);await s.journal.refresh("startup");
    const reservation=s.repository.reserve({...testAdmission(),sessionHash:digest("a".repeat(64)),idempotencyKey:"invalid",reservedBytes:1,now});
    const accepted=s.repository.commitIntake({reservationId:reservation.id,digest:digest("b".repeat(64)),encryptedPayloadPath:join(s.dir,"payload.enc"),actualBytes:1,encryptedName:"synthetic",job:"sales-fulltime",now});
    const claim=s.repository.claimNext("worker",now)!,owner=erasureOwner(s.repository);
    await expect(s.repository.withCaseLock(accepted.id,async()=>owner.prepareCommit(accepted.id,scope))).rejects.toThrow("ERASURE_CLAIM_ACTIVE");
    await s.repository.recordDeliveryFailure({id:claim.id,version:claim.version,token:claim.claimToken},{category:"invalid",reason:"INVALID_INPUT"},now);
    s.advance(hours*3600000-1);await s.journal.refresh("refresh");
    await expect(s.repository.withCaseLock(accepted.id,async()=>owner.prepareCommit(accepted.id,scope))).rejects.toThrow("ERASURE_NOT_DUE");
    s.advance(1);await s.journal.refresh("refresh");
    expect((await s.repository.withCaseLock(accepted.id,async()=>owner.prepareCommit(accepted.id,scope)))[4][1]).toBe(scope);
  });
  it("selects at most twenty fairly with bounded lookahead and charged fixed overhead",async()=>{
    const s=setup();for(let i=1;i<=25;i++)s.fixture.commit(["tj-journal-event-v1",i.toString(16).padStart(32,"0"),instant,"erase_commit",[caseId,"processing_payload","erase-key",i.toString(16).padStart(64,"0")]]);
    await s.journal.refresh("restore");const owner=erasureOwner(s.repository);
    const first=owner.listWork(1000),second=owner.listWork(1000);expect(first.items).toHaveLength(20);expect(first.hasMore).toBe(true);expect(second.items).toHaveLength(5);
    expect(new Set([...first.items,...second.items].map(item=>item.commitEventId)).size).toBe(25);
    expect(first.consumedItems).toBe(124);expect(second.consumedItems).toBe(34);
    const small=owner.listWork(12);expect(small.items.length).toBeLessThanOrEqual(2);expect(small.consumedItems).toBeLessThanOrEqual(12);
    for(const invalid of [0,1001,1.5,NaN])expect(()=>owner.listWork(invalid)).toThrow("ERASURE_BUDGET_INVALID");
  });
});
