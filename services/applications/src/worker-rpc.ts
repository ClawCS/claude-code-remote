import { createConnection, createServer, type Server } from "node:net";
import { chmodSync, chownSync, lstatSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import type { ApplicationRepository, RpcConfig, IntakeCommit, Digest, Instant, IntakeWorkerPort } from "./types";
import { digest, utcInstant } from "./types";
import { strictObject } from "./crypto";
import { admissionKeys, submissionKind, RateLimitedError } from "./intake-admission";

const MAX_REQUEST_BYTES = 16384;
const ERRORS = new Set(["METHOD_NOT_ALLOWED", "INVALID_REQUEST", "INVALID_RESERVATION", "CUSTODY_NOT_READY", "CUSTODY_UNACCOUNTED_FILE", "CUSTODY_ACCOUNTING_FAILED", "CAPACITY_EXCEEDED", "UPLOAD_IN_PROGRESS", "IDEMPOTENCY_CONFLICT", "RESERVATION_EXCEEDED", "RESERVATION_NOT_FOUND", "INVALID_PRIVATE_PAYLOAD", "SIZE_MISMATCH", "UNSAFE_PATH", "RATE_LIMITED", "WORKER_UNAVAILABLE"]);
function object(value: unknown, required: readonly string[]): Record<string, unknown> {
  try { return strictObject(value, required); } catch { throw new Error("INVALID_REQUEST"); }
}
function string(value: unknown, max: number): string { if (typeof value !== "string" || !value || value.length > max) throw new Error("INVALID_REQUEST"); return value; }
function integer(value: unknown): number { if (!Number.isSafeInteger(value) || (value as number) < 1) throw new Error("INVALID_REQUEST"); return value as number; }
function safeDigest(value: unknown): Digest { try { return digest(string(value, 64)); } catch { throw new Error("INVALID_REQUEST"); } }
function timestamp(value: unknown): Instant { try { return utcInstant(string(value, 24)); } catch { throw new Error("INVALID_REQUEST"); } }
function socketParent(config: RpcConfig) {
  if (!isAbsolute(config.socketPath) || resolve(config.socketPath) !== config.socketPath) throw new Error("UNSAFE_PATH");
  if (!Number.isSafeInteger(config.sharedGid) || config.sharedGid < 0) throw new Error("UNSAFE_PATH");
  const parent = lstatSync(dirname(config.socketPath));
  const fixture = process.env.NODE_ENV === "test" && (parent.mode & 0o7777) === 0o700;
  if (!parent.isDirectory() || parent.isSymbolicLink() || parent.uid !== process.getuid?.() || (!fixture && (![0o750, 0o2750].includes(parent.mode & 0o7777) || parent.gid !== config.sharedGid))) throw new Error("UNSAFE_PATH");
  for (let path = dirname(config.socketPath); path !== dirname(path); path = dirname(path)) if (lstatSync(path).isSymbolicLink()) throw new Error("UNSAFE_PATH");
}
export function createWorkerRpc(repo: ApplicationRepository, config: RpcConfig): Server {
  socketParent(config);
  // Bootstrap explicitly reconciles once, then shares this ledger with all worker processing.
  const custody = config.custody;
  const readiness = { getIntakeReadiness: () => {
    try { return { ready: custody.getIntakeReadiness().ready === true && config.readiness?.getIntakeReadiness().ready === true }; }
    catch { return { ready: false }; }
  } };
  async function dispatch(value: unknown): Promise<unknown> {
    const request = object(value, ["method", "params"]);
    if (!["reserve", "commitIntake", "getPublicStatus", "abortIntake", "getIntakeReadiness"].includes(String(request.method))) throw new Error("METHOD_NOT_ALLOWED");
    if (request.method === "getIntakeReadiness") { object(request.params, []); return readiness.getIntakeReadiness(); }
    if (request.method === "abortIntake") {
      const params = object(request.params, ["reservationId", "sessionHash"]);
      await custody.abortIntake(string(params.reservationId, 36), safeDigest(params.sessionHash)); return null;
    }
    if (request.method === "reserve") {
      const params = object(request.params, ["sessionHash", "idempotencyKey", "reservedBytes", "now", "abuse", "submission"]);
      timestamp(params.now);
      const idempotencyKey = string(params.idempotencyKey, 128);
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(idempotencyKey)) throw new Error("INVALID_REQUEST");
      let abuse, submission;
      try { abuse = admissionKeys(params.abuse); submission = submissionKind(params.submission); } catch { throw new Error("INVALID_REQUEST"); }
      const input = { sessionHash: safeDigest(params.sessionHash), idempotencyKey, reservedBytes: integer(params.reservedBytes), now: utcInstant(config.clock.now().toISOString()), abuse, submission };
      return custody.reserve(input, readiness);
    }
    if (request.method === "commitIntake") {
      const params = object(request.params, ["reservationId", "digest", "encryptedPayloadPath", "actualBytes", "encryptedName", "job", "now"]);
      if (params.job !== "sales-fulltime" && params.job !== "sales-parttime") throw new Error("INVALID_REQUEST");
      const input: IntakeCommit = { reservationId: string(params.reservationId, 36), digest: safeDigest(params.digest), encryptedPayloadPath: string(params.encryptedPayloadPath, 4096), actualBytes: integer(params.actualBytes), encryptedName: string(params.encryptedName, 4096), job: params.job, now: timestamp(params.now) };
      return custody.commitIntake(input);
    }
    const params = object(request.params, ["proofHash", "now"]); timestamp(params.now);
    return repo.getPublicStatus(safeDigest(params.proofHash), utcInstant(config.clock.now().toISOString()));
  }
  const server = createServer({ allowHalfOpen: true }, socket => {
    let buffer = Buffer.alloc(0), handled = false;
    socket.setTimeout(5000, () => socket.destroy());
    const fail = (error: string, retryAfterSeconds?: number) => { handled = true; socket.end(JSON.stringify({ ok: false, error, ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }) }) + "\n"); };
    socket.on("error", () => {});
    socket.on("data", chunk => {
      if (handled) return;
      if (buffer.length + chunk.length > MAX_REQUEST_BYTES) { fail("INVALID_REQUEST"); return; }
      buffer = Buffer.concat([buffer, chunk]);
      const newline = buffer.indexOf(10);
      if (newline < 0) return;
      handled = true;
      if (newline !== buffer.length - 1) { fail("INVALID_REQUEST"); return; }
      let request: unknown;
      try { request = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, newline))); } catch { fail("INVALID_REQUEST"); return; }
      void dispatch(request).then(result => socket.end(JSON.stringify({ ok: true, result }) + "\n"), error => fail(error instanceof Error && ERRORS.has(error.message) ? error.message : "WORKER_UNAVAILABLE", error instanceof RateLimitedError ? error.retryAfterSeconds : undefined));
    });
    socket.on("end", () => { if (!handled) fail("INVALID_REQUEST"); });
  });
  server.maxConnections = 8;
  server.prependListener("listening", () => {
    const address = server.address();
    if (address !== config.socketPath) { server.close(); server.emit("error", new Error("UNSAFE_SOCKET")); return; }
    const stat = lstatSync(config.socketPath);
    if (!stat.isSocket() || stat.uid !== process.getuid?.()) { server.close(); server.emit("error", new Error("UNSAFE_SOCKET")); return; }
    chownSync(config.socketPath, process.getuid!(), config.sharedGid); chmodSync(config.socketPath, 0o660);
  });
  return server;
}
export type WorkerRpcClient = IntakeWorkerPort;
export function createWorkerRpcClient(socketPath: string): WorkerRpcClient {
  async function call<T>(method: string, params: unknown): Promise<T> {
    const request = Buffer.from(JSON.stringify({ method, params }) + "\n");
    if (request.length > MAX_REQUEST_BYTES) throw new Error("INVALID_REQUEST");
    return new Promise<T>((resolve, reject) => {
      const socket = createConnection(socketPath); let buffer = Buffer.alloc(0), settled = false;
      const fail = (error: Error) => { if (!settled) { settled = true; reject(error); } socket.destroy(); };
      socket.setTimeout(5000, () => fail(new Error("WORKER_UNAVAILABLE")));
      socket.on("error", () => fail(new Error("WORKER_UNAVAILABLE")));
      socket.on("connect", () => socket.end(request));
      socket.on("data", chunk => {
        if (buffer.length + chunk.length > MAX_REQUEST_BYTES) { fail(new Error("WORKER_UNAVAILABLE")); return; }
        buffer = Buffer.concat([buffer, chunk]); if (!buffer.includes(10)) return;
        try {
          const response = JSON.parse(buffer.toString("utf8")) as { ok: boolean; result: T; error: string; retryAfterSeconds?: number };
          if (!response.ok) {
            const seconds = response.retryAfterSeconds;
            if (response.error === "RATE_LIMITED" && Number.isSafeInteger(seconds) && seconds! >= 1 && seconds! <= 3600) fail(new RateLimitedError(seconds!));
            else fail(new Error(response.error === "RATE_LIMITED" ? "WORKER_UNAVAILABLE" : ERRORS.has(response.error) ? response.error : "WORKER_UNAVAILABLE"));
            return;
          }
          settled = true; resolve(response.result); socket.destroy();
        } catch { fail(new Error("WORKER_UNAVAILABLE")); }
      });
      socket.on("close", () => { if (!settled) fail(new Error("WORKER_UNAVAILABLE")); });
    });
  }
  return { getIntakeReadiness: () => call("getIntakeReadiness", {}), reserve: input => call("reserve", input), commitIntake: input => call("commitIntake", input), getPublicStatus: (proofHash, now) => call("getPublicStatus", { proofHash, now }), abortIntake: async (reservationId, sessionHash) => { await call("abortIntake", { reservationId, sessionHash }); } };
}
