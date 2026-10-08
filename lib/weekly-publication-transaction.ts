import { randomUUID } from "node:crypto";
import { mkdir, open, realpath, unlink } from "node:fs/promises";
import path from "node:path";

const lockRelative = "data/editorial/.weekly-offers.lock";
const interrupted = () => new Error("Weekly publication transaction is active or interrupted; inspect and recover it before retrying");

export { assertWeeklyPublicationIdle } from "./weekly-publication-idle";

export type WeeklyPublicationTransaction = { beginBinding(): Promise<void>; commit(): Promise<void> };

/** One owner covers mutable reads, verification and final binding. Never auto-recover an interrupted write. */
export async function withWeeklyPublicationTransaction<T>(root: string, operation: (transaction: WeeklyPublicationTransaction) => Promise<T>): Promise<T> {
  root = await realpath(root);
  for (const relative of ["data","data/editorial"]) {
    await mkdir(path.join(root,relative),{recursive:true});
    const resolved=await realpath(path.join(root,relative)),within=path.relative(root,resolved);
    if (within === ".." || within.startsWith(`..${path.sep}`) || path.isAbsolute(within)) throw new Error("Transaction directory escapes editorial root");
  }
  const lock=path.join(root,lockRelative);
  const handle=await open(lock,"wx").catch(error=>{if((error as NodeJS.ErrnoException).code==="EEXIST")throw interrupted();throw error;});
  const owner={id:randomUUID(),pid:process.pid,startedAt:new Date().toISOString()};
  let binding=false,committed=false,initialized=false;
  const phase=async (name:string)=>{
    const bytes=Buffer.from(`${JSON.stringify({...owner,phase:name})}\n`);
    await handle.truncate(0);await handle.write(bytes,0,bytes.length,0);await handle.sync();
  };
  try {
    await phase("preparing");initialized=true;
    return await operation({
      async beginBinding(){binding=true;await phase("binding");},
      async commit(){await phase("committed");committed=true;},
    });
  } finally {
    await handle.close();
    // Errors before root binding leave old bindings intact; failures afterward retain the durable marker.
    if (initialized && (!binding || committed)) await unlink(lock);
  }
}
