import { runMaintenanceCycle, restoredAuthenticationLocked } from "./retention";
import { maintenanceOrigin } from "./worker-maintenance";
import type { RestoreResult, WorkerOwner } from "./types";

export function reconcileRestore(owner: WorkerOwner): Promise<RestoreResult> {
  if (maintenanceOrigin(owner) !== "cold-maintenance") throw new Error("AUTH_RESTORE_LOCK_UNAVAILABLE");
  return runMaintenanceCycle(owner).then(report => Object.freeze({ ...report, authLocked: restoredAuthenticationLocked(owner) }));
}
