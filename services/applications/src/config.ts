import { lstatSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import type { ApplicationMode, PublicApplicationConfig } from "../../../lib/applications-contract";
import type { Clock } from "./types";

export interface WorkerSecrets { encryptionKey?: string; signingKey?: string }
export interface WorkerConfig { privateRoot: string; registryPath: string; custodyRoot: string; runtimeRoot: string; ownerUid: number; sharedGid: number; secrets: WorkerSecrets }
export interface ApplicationConfig {
  mode: ApplicationMode; origin: string; clock: Clock;
  intake: { host: "127.0.0.1"; port: 3105; privateRoot: string; socketPath: string; ownerUid: number; sharedGid: number };
  worker: WorkerConfig;
  admin: { host: "127.0.0.1"; port: 3106 };
  public: PublicApplicationConfig;
}
function inside(path: string, root: string): boolean { return path === root || path.startsWith(root + sep); }
function privatePath(value: string | undefined, policy?: { uid: number; gid?: number; mode: number }): string {
  if (!value || !isAbsolute(value) || value !== resolve(value) || value === sep || inside(value, process.cwd()) || value.split(sep).some(part => ["public", "releases", ".git", ".build"].includes(part))) throw new Error("UNSAFE_PATH");
  for (let part = value; part !== dirname(part); part = dirname(part)) {
    try {
      const stat = lstatSync(part);
      if (stat.isSymbolicLink() || (policy && part === value && (!stat.isDirectory() || (stat.mode & 0o7777) !== policy.mode || stat.uid !== policy.uid || (policy.gid !== undefined && stat.gid !== policy.gid)))) throw new Error("UNSAFE_PATH");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  return value;
}
export function readConfig(env: NodeJS.ProcessEnv): ApplicationConfig {
  const mode = env.APPLICATIONS_MODE ?? "disabled";
  if (mode !== "disabled" && mode !== "pilot" && mode !== "enabled") throw new Error("INVALID_MODE");
  let origin: URL;
  try { origin = new URL(env.APPLICATIONS_ORIGIN ?? ""); } catch { throw new Error("INVALID_ORIGIN"); }
  const localTest = env.NODE_ENV === "test" && ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (!["http:", "https:"].includes(origin.protocol) || origin.origin !== env.APPLICATIONS_ORIGIN || origin.username || origin.password || (!localTest && (origin.protocol !== "https:" || origin.hostname !== "trinkgut-jammers.de" || origin.port))) throw new Error("INVALID_ORIGIN");
  if (env.APPLICATIONS_TEST_NOW && !localTest) throw new Error("TEST_CLOCK_FORBIDDEN");
  const testDate = env.APPLICATIONS_TEST_NOW ? new Date(env.APPLICATIONS_TEST_NOW) : undefined;
  if (testDate && (!Number.isFinite(testDate.getTime()) || testDate.toISOString() !== env.APPLICATIONS_TEST_NOW)) throw new Error("INVALID_TEST_CLOCK");
  const identity = (value: string | undefined): number => { if (!value || !/^(0|[1-9]\d{0,9})$/.test(value) || Number(value) > 2147483647) throw new Error("INVALID_STORAGE_IDENTITY"); return Number(value); };
  const intakeUid = identity(env.APPLICATIONS_INTAKE_UID), workerUid = identity(env.APPLICATIONS_WORKER_UID), sharedGid = identity(env.APPLICATIONS_SHARED_GID);
  if ((!localTest && intakeUid === workerUid) || intakeUid === 0 || workerUid === 0) throw new Error("INVALID_STORAGE_IDENTITY");
  const intakeRoot = privatePath(env.APPLICATIONS_INTAKE_ROOT, { uid: intakeUid, gid: sharedGid, mode: 0o2770 });
  const workerRoot = privatePath(env.APPLICATIONS_WORKER_ROOT, { uid: workerUid, mode: 0o700 });
  const runtimeRoot = privatePath(env.APPLICATIONS_RUNTIME_ROOT, { uid: workerUid, mode: 0o700 });
  if (!localTest && !runtimeRoot.startsWith("/run/")) throw new Error("UNSAFE_PATH");
  const socketPath = privatePath(env.APPLICATIONS_SOCKET_PATH);
  const socketParent = dirname(socketPath);
  try { const stat = lstatSync(socketParent); if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== workerUid || stat.gid !== sharedGid || ![0o750, 0o2750].includes(stat.mode & 0o7777)) throw new Error("UNSAFE_PATH"); } catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
  if (inside(intakeRoot, workerRoot) || inside(workerRoot, intakeRoot) || inside(runtimeRoot, intakeRoot) || inside(intakeRoot, runtimeRoot) || inside(runtimeRoot, workerRoot) || inside(workerRoot, runtimeRoot) || inside(socketPath, workerRoot) || inside(socketPath, intakeRoot) || inside(socketPath, runtimeRoot)) throw new Error("UNSAFE_PATH");
  return {
    mode, origin: origin.origin, clock: { now: () => testDate ? new Date(testDate.getTime()) : new Date() },
    intake: { host: "127.0.0.1", port: 3105, privateRoot: intakeRoot, socketPath, ownerUid: intakeUid, sharedGid },
    worker: { privateRoot: workerRoot, registryPath: join(workerRoot, "registry.sqlite"), custodyRoot: join(workerRoot, "custody"), runtimeRoot, ownerUid: workerUid, sharedGid, secrets: { encryptionKey: env.APPLICATIONS_ENCRYPTION_KEY, signingKey: env.APPLICATIONS_SIGNING_KEY } },
    admin: { host: "127.0.0.1", port: 3106 },
    public: {
      enabled: mode === "enabled", mode,
      limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 },
      jobs: [{ id: "sales-fulltime", label: "Verkauf Vollzeit (m/w/d)" }, { id: "sales-parttime", label: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" }],
    },
  };
}
