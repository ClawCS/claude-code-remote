import type { Server } from "node:http";
import { readIntakeConfig } from "./config";
import { createIntakeWorkerClient } from "./intake-client";
import { createIntakeServer } from "./intake-http";

export function startIntakeServer(env: NodeJS.ProcessEnv = process.env): Server {
  const config = readIntakeConfig(env);
  const server = createIntakeServer(config, createIntakeWorkerClient(config));
  server.listen(config.port, config.host);
  return server;
}
if (require.main === module) {
  try {
    const server = startIntakeServer();
    server.on("error", () => { process.stderr.write("APPLICATIONS_INTAKE_START_FAILED\n"); process.exitCode = 1; });
    const stop = () => { server.close(); };
    process.once("SIGTERM", stop); process.once("SIGINT", stop);
  } catch { process.stderr.write("APPLICATIONS_INTAKE_START_FAILED\n"); process.exitCode = 1; }
}
