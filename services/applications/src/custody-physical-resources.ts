import { constants } from "node:fs";
import { open, type FileHandle } from "node:fs/promises";
import type { InventoryJournal } from "./erasure-storage";
import type { IngressEvidence } from "./types";
import { closeCustodyHandle, observeCustodyHandle } from "./worker-maintenance";

export type PhysicalIO = <T>(action: () => Promise<T>) => Promise<T>;
// Shared native/resource lifetime only. No source, manifest, deletion, phase or
// accounting authority is supplied by this helper.
export function createPhysicalResources(hooks: { ingress(journal: Readonly<InventoryJournal>, operation: "observe" | "quiesce" | "released"): Promise<IngressEvidence> }) {
  let target: FileHandle | undefined, parent: FileHandle | undefined;
  let pending: { journal: Readonly<InventoryJournal>; operation: "quiesce" | "released" } | undefined;
  async function close(which: "target" | "parent", io: PhysicalIO) {
    const handle = which === "target" ? target : parent;
    if (!handle) return;
    await io(() => closeCustodyHandle(handle));
    if (which === "target") target = undefined; else parent = undefined;
  }
  async function ingress(journal: Readonly<InventoryJournal>, operation: "quiesce" | "released", io: PhysicalIO) {
    pending = { journal, operation };
    const evidence = await io(() => hooks.ingress(journal, operation));
    await io(async () => {
      if (operation === "released" ? evidence.state !== "released" : !["quiescent", "released"].includes(evidence.state)) throw new Error("INGRESS_RECOVERY_REQUIRED");
    });
    pending = undefined; return evidence;
  }
  return Object.freeze({
    idle: () => !target && !parent && !pending,
    async open(which: "target" | "parent", path: string, io: PhysicalIO) {
      if (which === "target" ? target : parent) throw new Error("MAINTENANCE_WORK_ACTIVE");
      const handle = observeCustodyHandle(await io(() => open(path, constants.O_RDONLY | constants.O_NOFOLLOW)));
      if (which === "target") target = handle; else parent = handle;
      return handle;
    },
    close, ingress,
    async finishIngress(io: PhysicalIO) {
      if (pending) await ingress(pending.journal, pending.operation, io);
    },
  });
}
