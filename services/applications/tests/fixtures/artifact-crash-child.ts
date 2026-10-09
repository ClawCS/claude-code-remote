import { makeArtifactHarness } from "./artifacts";
import { createArtifactStore } from "../../src/artifact-store";
import { takePrivateSnapshot, withPrivateFiles } from "../../src/custody";
import { withReconstructedDocuments, type ReconstructionDependencies } from "../../src/reconstruction";
import fs from "node:fs/promises";

// Faults are at real filesystem/SQLite boundaries inside this disposable worker,
// not at mocked accounting totals. SIGKILL is sent by the parent after the IPC
// boundary; no production fault-injection hooks are present.
async function main(){
  if(process.env.NODE_ENV!=="test"||!process.send)throw new Error("TEST_ONLY");
  const stage=process.argv[2],h=await makeArtifactHarness();
  const pause=async()=>{process.send!({stage:"boundary",root:h.root,accepted:h.accepted});await new Promise(()=>{});};
  const realOpen=fs.open,realRename=fs.rename,realAdopt=h.repo.adoptArtifact;
  fs.open=async(...args:Parameters<typeof fs.open>)=>{
    const fd=await realOpen(...args);
    if(String(args[0]).endsWith(".bundle.staging")){
      const sync=fd.sync.bind(fd),write=fd.writeFile.bind(fd);
      fd.sync=async()=>{if(stage==="before-fsync")await pause();await sync();if(stage==="after-fsync")await pause();};
      if(stage==="enospc")fd.writeFile=async data=>{await write(Buffer.from(data as Buffer).subarray(0,100));throw Object.assign(new Error("ENOSPC"),{code:"ENOSPC"});};
    }
    return fd;
  };
  fs.rename=async(from,to)=>{if(String(from).endsWith(".bundle.staging")&&stage==="before-rename")await pause();await realRename(from,to);if(String(from).endsWith(".bundle.staging")&&stage==="after-rename")await pause();};
  h.repo.adoptArtifact=async(record,version)=>{if(stage==="before-db")await pause();const result=await realAdopt(record,version);if(stage==="after-db")await pause();return result;};
  const deps:ReconstructionDependencies={scope:h.keys.custody,monotonicNow:()=>0,scanner:{assurance:"qualified-local-engine",scan:async()=>{throw new Error("EMPTY_FIXTURE");}},inspector:{assurance:"local-test",inspect:async()=>{throw new Error("EMPTY_FIXTURE");}},raster:{render:async()=>{throw new Error("EMPTY_FIXTURE");}},output:{verify:async()=>{throw new Error("EMPTY_FIXTURE");}}};
  const snapshot=await takePrivateSnapshot(h.repo.getCommittedIntake(h.accepted.id)!,h.keys);
  try{
    await withPrivateFiles(snapshot,h.keys,processing=>withReconstructedDocuments(processing,deps,async bundle=>{
      await createArtifactStore(h.repo,h.keys,h.keys.custody).adoptBundle(bundle,1);
      if(stage==="after-retire"){await h.repo.retireOriginal(h.accepted.id,2);await pause();}
    }));
    throw new Error("BOUNDARY_NOT_REACHED");
  }catch(error){
    process.send({stage:"failure",root:h.root,accepted:h.accepted,error:error instanceof Error?error.message:"UNKNOWN"});
    await new Promise(()=>{});
  }
}
void main().catch(error=>{process.stderr.write(String(error));process.exit(1);});
