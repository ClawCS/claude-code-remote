import { afterEach,describe,expect,it,vi } from "vitest";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { createErasureRowSelector,validateInventoryJournal,validateInventoryObject,validateManifest,validateSafetyCarry } from "../src/erasure-storage";
import type { ErasureRowCursor,ErasureWork,JournalEvent } from "../src/types";
import { caseId,fence,instant,syntheticJournal } from "./fixtures/ledger";

const journal={pass:"a".repeat(32),journalId:"b".repeat(36),caseId:null,kind:"intake",version:3,state:"reserved",artifactKind:null,budget:200,cleanupAfter:instant,reservationId:"b".repeat(36),generation:"actual-generation",domain:"actual-domain",allowance:100} as const;
const reservation={id:journal.journalId,reservedBytes:200};
const config={intakeRoot:"/private/incoming",custodyRoot:"/private/custody",runtimeRoot:"/private/runtime",intakeUid:501,sharedGid:20,clock:{now:()=>new Date(instant)}};
const object={pass:journal.pass,journalId:journal.journalId,slot:"incoming-sealed",leaf:"",root:"incoming",presence:"present",device:1,inode:2,size:10,type:"file",uid:501,gid:20,mode:0o640,nlink:1,leaseState:"bounded",chargedBytes:10,leaseDevice:1,leaseInode:2} as const;
describe("closed normalized erasure inventory",()=>{
  it("retains actual custody IDs and lease strings and derives only a closed relative name",()=>{
    const j=validateInventoryJournal(journal,reservation),o=validateInventoryObject(object,j,config);
    expect(Object.isFrozen(j)).toBe(true);expect(Object.isFrozen(o)).toBe(true);
    expect(o.relativePath).toBe(`${journal.journalId}.enc`);
  });
  it.each([{kind:"unknown"},{journalId:"../private"},{allowance:101},{generation:""},{version:4},{budget:Number.MAX_SAFE_INTEGER},{caseId:journal.journalId},{artifactKind:"mime"},{path:"/private/canary"}])("rejects invalid journal fields %j",patch=>{
    expect(()=>validateInventoryJournal({...journal,...patch},reservation)).toThrow("ERASURE_INVENTORY_INVALID");
  });
  it.each([{slot:"artifact-sealed",root:"custody"},{slot:"processing-file",root:"runtime",leaf:"../canary"},{inode:Number.MAX_SAFE_INTEGER+1},{device:null},{uid:502},{mode:0o600},{nlink:2},{type:"directory"},{size:101},{chargedBytes:101},{leaseState:"released",chargedBytes:0},{presence:"absent"},{leaf:"canary"}])("rejects cross-slot, ownership, numeric and lease records %j",patch=>{
    expect(()=>validateInventoryObject({...object,...patch},validateInventoryJournal(journal,reservation),config)).toThrow("ERASURE_INVENTORY_INVALID");
  });
  it("validates fixed manifest binding without authorizing its phase advancement",()=>{
    const j=validateInventoryJournal(journal,reservation),o=validateInventoryObject(object,j,config);
    const m={eraseCommitId:"c".repeat(32),scanPass:j.pass,journalId:j.journalId,slot:o.slot,leaf:o.leaf,expectedDevice:1,expectedInode:2,expectedSize:10,remainingCharge:10,phase:"planned"};
    expect(validateManifest(m,j,o).phase).toBe("planned");
    for(const patch of [{scanPass:"d".repeat(32)},{expectedInode:3},{expectedDevice:null},{remainingCharge:101},{phase:"complete"},{path:"/canary"}])expect(()=>validateManifest({...m,...patch},j,o)).toThrow("ERASURE_INVENTORY_INVALID");
  });
  it("preserves only an exact unresolved minimal event and its original receipt binding",()=>{
    const event=fence(),receipt=syntheticJournal().commit(event),row={eventId:event[1],caseId,source:"lifecycle",event:JSON.stringify(event),phase:"proposed",entry:null,head:null,coveringCommit:"c".repeat(32)};
    expect(validateSafetyCarry(row).phase).toBe("proposed");
    expect(validateSafetyCarry({...row,phase:"acknowledged",...receipt}).phase).toBe("acknowledged");
    for(const patch of [{source:"mailbox"},{phase:"applied"},{actionBytes:"private canary"},{entry:receipt.entry},{event:JSON.stringify([...event,"private canary"])},{caseId:"22222222-2222-4222-8222-222222222222"}])expect(()=>validateSafetyCarry({...row,...patch})).toThrow("ERASURE_INVENTORY_INVALID");
  });
});

const databases:Database.Database[]=[];
afterEach(()=>{while(databases.length)databases.pop()!.close();});
function searchStorage(parentCount:number,searches:readonly (readonly [number,string])[]){
  // Real schema/constraints and signed synthetic records; this private selector
  // fixture supplies no original-owner authority or physical-erasure evidence.
  const db=new Database(":memory:");databases.push(db);db.exec(readFileSync(new URL("../src/schema.sql",import.meta.url),"utf8"));
  db.prepare("INSERT INTO reservations(id,sessionHash,idempotencyKey,reservedBytes,expiresAt,active) VALUES(?,'synthetic','searches',0,?,0)").run(caseId,instant);
  db.prepare("INSERT INTO cases(id,reference,reservationId,sessionHash,idempotencyKey,digest,encryptedName,job,acceptedAt,deliveryState,caseState,version,payloadBytes,payloadDeleteAfter,contactDeleteAfter) VALUES(?,'synthetic',?,'synthetic','searches','synthetic','synthetic','sales-fulltime',?,'queued','open',1,0,?,?)").run(caseId,caseId,instant,instant,instant);
  const fixture=syntheticJournal(),eventId=(n:number)=>n.toString(16).padStart(32,"0");
  const insert=db.prepare("INSERT INTO deletion_events VALUES(?,?,?,NULL,'acknowledged',?,?)");
  db.transaction(()=>{
    for(let n=1;n<=parentCount;n++){
      const event:JournalEvent=["tj-journal-event-v1",eventId(n),instant,"attempt_intent",[caseId,"b".repeat(32),"initial","c".repeat(32),"1","d".repeat(32),"erase-key","e".repeat(64)]];
      const receipt=fixture.receipt(event);insert.run(eventId(n),caseId,JSON.stringify(event),receipt.entry,receipt.head);
    }
    const search=db.prepare("INSERT INTO deletion_searches VALUES(?,?,?,?,?,1,'[]','[]')");
    for(const [parent,round] of searches)search.run(eventId(parent),round,instant,instant,instant);
  })();
  const work:ErasureWork={commitEventId:"f".repeat(32),caseId,scope:"incident_identity",ledgerId:fixture.context.ledgerId,historyEpoch:fixture.context.historyEpoch,associationKeyId:"erase-key",replayAssociation:"e".repeat(64),sequence:"1",entryHash:"a".repeat(64),stage:"rows-pending"};
  const select=createErasureRowSelector(db),start=select(work,null,7);
  expect(start.next).toEqual([work.commitEventId,"identity-searches",null]);
  let visited=0,probes=0;const queries=new Set<string>(),prepare=db.prepare.bind(db);
  db.function("counted_parent",{varargs:true},()=>{visited++;return 1;});
  vi.spyOn(db,"prepare").mockImplementation((sql:string)=>{
    if(sql.startsWith("SELECT")&&sql.includes("INDEXED BY erasure_mail_events")){
      queries.add(sql);
      sql=sql.includes("WHERE e.caseId=?")?sql.replace("WHERE e.caseId=?","WHERE counted_parent(e.eventId) AND e.caseId=?"):sql.replace("WHERE caseId=?","WHERE counted_parent(eventId) AND caseId=?");
    }else if(sql.startsWith("SELECT")&&sql.includes("FROM deletion_searches")){queries.add(sql);probes++;}
    return prepare(sql);
  });
  return {db,select,work,start:start.next!,eventId,queries,prepare,reset(){visited=0;probes=0;},get visited(){return visited;},get probes(){return probes;}};
}
describe("bounded identity-search parent continuation",()=>{
  it("charges bounded empty-parent visits and eventually returns later search rounds exactly once",()=>{
    const s=searchStorage(2004,[[2002,"3"],[2002,"1"],[2004,"2"],[2004,"3"]]);
    let cursor:ErasureRowCursor|null=s.start,totalParents=0,pages=0;const targets:unknown[]=[];
    while(cursor?.[1]==="identity-searches"){
      const previous=cursor;s.reset();const page=s.select(s.work,cursor,26);pages++;
      expect(s.visited).toBeLessThanOrEqual(5);expect(s.probes).toBe(s.visited);
      const children=page.targets.filter(target=>target.phase==="identity-searches");
      expect(page.consumedItems).toBeGreaterThanOrEqual(1+2*s.visited+children.length);
      expect(page.consumedItems).toBeLessThanOrEqual(26);totalParents+=s.visited;targets.push(...children.map(target=>target.key));
      if(s.visited){
        expect(page.next?.[1]).toBe("identity-searches");expect(page.next?.[2]).not.toEqual(previous[2]);
        expect(Object.isFrozen(page.next)).toBe(true);expect(Object.isFrozen(page.next?.[2])).toBe(true);
        if(!children.length)expect(page.consumedItems).toBe(1+2*s.visited);
      }
      cursor=page.next;expect(pages).toBeLessThan(405);
    }
    expect(totalParents).toBe(2004);expect(pages).toBe(402);
    expect(targets).toEqual([[s.eventId(2002),"1"],[s.eventId(2002),"3"],[s.eventId(2004),"2"],[s.eventId(2004),"3"]]);
    for(const sql of s.queries){
      const args=sql.includes("FROM deletion_events")?[caseId,"",5]:[s.eventId(2002)];
      const plan=s.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as {detail:string}[];
      expect(plan.map(row=>row.detail).join(" ")).toMatch(/^SEARCH (?:deletion_events USING COVERING INDEX erasure_mail_events|deletion_searches USING COVERING INDEX sqlite_autoindex_deletion_searches_1)/);
      expect(plan.some(row=>/SCAN|TEMP B-TREE/.test(row.detail))).toBe(false);
    }
  });
  it("defers below the parent worst-case reserve and keeps examined-parent cursors private",()=>{
    const s=searchStorage(3,[[1,"3"],[1,"1"],[3,"3"],[3,"1"],[3,"2"]]);
    const deferred=s.select(s.work,s.start,5);
    expect(deferred.targets).toEqual([]);expect(deferred.next).toEqual(s.start);expect(deferred.consumedItems).toBe(0);expect(s.visited).toBe(0);expect(s.probes).toBe(0);
    const first=s.select(s.work,deferred.next,6);
    expect(first.targets.map(target=>target.key)).toEqual([[s.eventId(1),"1"],[s.eventId(1),"3"]]);
    expect(first.consumedItems).toBe(5);expect(first.next?.[2]).toEqual([s.eventId(1),"3"]);
    s.reset();const empty=s.select(s.work,first.next,6);
    expect(empty.targets).toEqual([]);expect(empty.next?.[2]).toEqual([s.eventId(2),"3"]);expect(empty.consumedItems).toBe(3);expect(s.visited).toBe(1);expect(s.probes).toBe(1);
    s.reset();const full=s.select(s.work,empty.next,6);
    expect(full.targets.map(target=>target.key)).toEqual([[s.eventId(3),"1"],[s.eventId(3),"2"],[s.eventId(3),"3"]]);
    expect(full.consumedItems).toBe(6);expect(s.visited).toBe(1);expect(s.probes).toBe(1);
    const issued=empty.next!;
    for(const forged of [[...issued],JSON.parse(JSON.stringify(issued))])expect(()=>s.select(s.work,forged as ErasureRowCursor,6)).toThrow("ERASURE_CURSOR_INVALID");
    expect(()=>s.select({...s.work,commitEventId:"a".repeat(32)},issued,6)).toThrow("ERASURE_CURSOR_INVALID");
    expect(()=>createErasureRowSelector(s.db)(s.work,issued,6)).toThrow("ERASURE_CURSOR_INVALID");
  });
});
