import type { CustodyLedger } from "./types";
import type { ReconstructionScopePort } from "./reconstruction";

export function createReconstructionScope(custody: CustodyLedger): ReconstructionScopePort {
  return { withScope: (id, action) => custody.withScope(id, action) };
}
