import { stat } from "node:fs/promises";
import path from "node:path";

/** Read-only runtime guard; writer setup must not enter the server dependency graph. */
export async function assertWeeklyPublicationIdle(root: string): Promise<void> {
  try { await stat(path.join(root,"data/editorial/.weekly-offers.lock")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw error; }
  throw new Error("Weekly publication transaction is active or interrupted; inspect and recover it before retrying");
}
