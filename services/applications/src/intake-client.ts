import type { IntakeConfig } from "./config";
import type { IntakeWorkerPort } from "./types";
import { createWorkerRpcClient } from "./worker-rpc";

// Consume the reviewed five-operation client, without acquiring worker material.
// Disabled mode has no socket/storage/secrets requirement and cannot admit data.
export function createIntakeWorkerClient(config: IntakeConfig): IntakeWorkerPort {
  if (config.acceptance) return createWorkerRpcClient(config.acceptance.socketPath);
  const unavailable = async (): Promise<never> => { throw new Error("WORKER_UNAVAILABLE"); };
  return { reserve: unavailable, commitIntake: unavailable, getPublicStatus: unavailable, abortIntake: unavailable, getIntakeReadiness: unavailable };
}
