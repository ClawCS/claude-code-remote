import { describe,expect,it } from "vitest";
import { validateInventoryJournal,validateInventoryObject,validateManifest,validateSafetyCarry } from "../src/erasure-storage";
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
