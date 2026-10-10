import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import type { IntakeConfig } from "./config";
import type { IntakeWorkerPort } from "./types";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { digest, utcInstant, type Reservation } from "./types";
import { bootstrapSession, readSession, requireForm, activePilot, sessionAdmission } from "./intake-session";
import { parseMultipart, preflightMultipart } from "./intake-multipart";
import { encodePayload, payloadDigest, sealIncoming, sealName, MAX_SEALED_BYTES } from "./crypto";
import { RateLimitedError } from "./intake-admission";

function singleHeader(request: IncomingMessage, name: string): string | undefined {
  const values: string[] = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) if (request.rawHeaders[index].toLowerCase() === name) values.push(request.rawHeaders[index + 1]);
  if (values.length > 1) throw new Error("FORBIDDEN");
  return values[0];
}
function json(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", "connection": "close", ...headers });
  response.end(JSON.stringify(body));
}
function sameOrigin(request: IncomingMessage, config: IntakeConfig) {
  const origin = singleHeader(request, "origin");
  if ((request.method === "POST" && origin !== config.origin) || (origin !== undefined && origin !== config.origin) || singleHeader(request, "sec-fetch-site") !== "same-origin" || !["cors", "same-origin"].includes(singleHeader(request, "sec-fetch-mode") ?? "") || singleHeader(request, "sec-fetch-dest") !== "empty") throw new Error("FORBIDDEN");
}
function canonicalIp(request: IncomingMessage, config: IntakeConfig): string {
  if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress ?? "")) throw new Error("FORBIDDEN");
  const value = singleHeader(request, config.proxy.clientIpHeader);
  if (!value || value.length > 45 || value.includes("%") || !isIP(value)) throw new Error("FORBIDDEN");
  if (isIP(value) === 6 && (new URL(`http://[${value}]/`).hostname !== `[${value}]` || value.startsWith("::ffff:"))) throw new Error("FORBIDDEN");
  return value;
}
async function bounded<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw signal.reason;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => finish(() => reject(new Error("WORKER_UNAVAILABLE"))), 5000);
    const abort = () => finish(() => reject(signal.reason));
    const finish = (action: () => void) => { clearTimeout(timer); signal.removeEventListener("abort", abort); action(); };
    signal.addEventListener("abort", abort, { once: true });
    promise.then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
  });
}
async function emptyBody(request: IncomingMessage, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw signal.reason;
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { request.pause(); request.removeListener("data", data); request.removeListener("end", end); signal.removeEventListener("abort", abort); };
    const data = () => { cleanup(); reject(new Error("INVALID_REQUEST")); };
    const end = () => { cleanup(); resolve(); };
    const abort = () => { cleanup(); reject(signal.reason); };
    request.on("data", data); request.on("end", end); signal.addEventListener("abort", abort, { once: true }); request.resume();
  });
}
function errorResponse(response: ServerResponse, error: unknown) {
  const message = error instanceof Error ? error.message : "WORKER_UNAVAILABLE";
  const statuses: Record<string, number> = { FORBIDDEN: 403, INVALID_REQUEST: 400, PAYLOAD_TOO_LARGE: 413, RATE_LIMITED: 429, CAPACITY_EXCEEDED: 429, UPLOAD_IN_PROGRESS: 409, IDEMPOTENCY_CONFLICT: 409, REQUEST_TIMEOUT: 408 };
  const status = statuses[message] ?? 503;
  const code = message === "REQUEST_TIMEOUT" ? "INVALID_REQUEST" : statuses[message] ? message : "WORKER_UNAVAILABLE";
  const retry = error instanceof RateLimitedError ? error.retryAfterSeconds : message === "CAPACITY_EXCEEDED" || message === "UPLOAD_IN_PROGRESS" || status === 503 ? 60 : undefined;
  json(response, status, { error: status === 503 ? "Annahme nicht verfügbar." : "Anfrage konnte nicht angenommen werden.", code, ...(retry === undefined ? {} : { retryAfterSeconds: retry }) }, retry === undefined ? {} : { "retry-after": String(retry) });
}
export function createIntakeServer(config: IntakeConfig, worker: IntakeWorkerPort): Server {
  const server = createServer({ maxHeaderSize: 16384, requestTimeout: 60000, headersTimeout: 10000, connectionsCheckingInterval: 1000 }, (request, response) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const error = new Error("REQUEST_TIMEOUT"); controller.abort(error);
      // Respond at the deadline even if a filesystem operation is still pending.
      // Its writer must settle before worker-authoritative terminal release.
      errorResponse(response, error);
    }, 60000);
    const disconnected = () => controller.abort(new Error("INVALID_REQUEST"));
    request.on("aborted", disconnected); request.on("error", disconnected);
    response.on("close", () => { if (!response.writableFinished) disconnected(); });
    const cleanupReservation = async (reservation: Reservation, sessionHash: import("./types").Digest) => {
      // Only worker custody can release this lease; no forced unlink on timeout.
      try { await bounded(worker.abortIntake(reservation.id, sessionHash), new AbortController().signal); } catch { /* Worker journal/lifetime recovery retains authority. */ }
    };
    const handle = async () => {
      // Closed disabled fallback: no admission, body read, identity or worker
      // action. Enabled/pilot routes retain all original origin/proof gates.
      if (request.method === "POST" && request.url === "/api/bewerbung" && (!config.acceptance || config.mode === "disabled")) throw new Error("WORKER_UNAVAILABLE");
      sameOrigin(request, config);
      for (const name of ["authorization", "cookie", "x-application-form-token", "idempotency-key", "x-application-synthetic", config.proxy.clientIpHeader, "content-type", "content-length", "transfer-encoding"]) singleHeader(request, name);
      if (!request.url || request.url.includes("?") || request.url.includes("#") || request.url.includes("%")) throw new Error("INVALID_REQUEST");
      const session = readSession(config, singleHeader(request, "cookie"));
      const readiness = async () => config.acceptance !== null && config.mode !== "disabled" && (await bounded(worker.getIntakeReadiness(), controller.signal)).ready === true;
      if (request.method === "GET" && request.url === "/api/bewerbung/config") {
        let enabled = false;
        try { enabled = (config.mode === "enabled" || (config.mode === "pilot" && activePilot(config, session))) && await readiness(); } catch { /* Truthful public fallback, never a successful admission. */ }
        json(response, 200, { enabled, mode: config.mode, limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Verkauf Vollzeit (m/w/d)" }, { id: "sales-parttime", label: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" }] }); return;
      }
      if (request.method === "GET" && request.url === "/api/bewerbung/status") {
        const auth = singleHeader(request, "authorization");
        if (!auth || !/^Bearer [A-Za-z0-9_-]{43}$/.test(auth) || Buffer.from(auth.slice(7), "base64url").toString("base64url") !== auth.slice(7)) throw new Error("FORBIDDEN");
        const status = await bounded(worker.getPublicStatus(digest(createHash("sha256").update(auth.slice(7)).digest("hex")), utcInstant(config.clock.now().toISOString())), controller.signal);
        if (!status) throw new Error("FORBIDDEN");
        json(response, 200, { reference: status.reference, state: status.state, acceptedAt: status.acceptedAt }); return;
      }
      if (request.method === "POST" && request.url === "/api/bewerbung/session") {
        if (singleHeader(request, "x-application-synthetic") !== undefined) throw new Error("FORBIDDEN");
        if (!(await readiness())) throw new Error("WORKER_UNAVAILABLE");
        await emptyBody(request, controller.signal);
        const bootstrap = bootstrapSession(config, singleHeader(request, "cookie"), singleHeader(request, "authorization"));
        json(response, 200, { formToken: bootstrap.formToken }, { "set-cookie": bootstrap.cookie }); return;
      }
      if (request.method !== "POST" || request.url !== "/api/bewerbung") throw new Error("INVALID_REQUEST");
      if (!config.acceptance || config.mode === "disabled") throw new Error("WORKER_UNAVAILABLE");
      const proven = requireForm(config, session, singleHeader(request, "x-application-form-token"));
      if (singleHeader(request, "authorization") !== undefined) throw new Error("FORBIDDEN");
      const marker = singleHeader(request, "x-application-synthetic");
      if (config.mode === "pilot" ? !activePilot(config, proven) || marker !== "1" : marker !== undefined || proven.pilot !== undefined) throw new Error("FORBIDDEN");
      const key = singleHeader(request, "idempotency-key");
      if (!key || !/^[A-Za-z0-9_-]{1,128}$/.test(key)) throw new Error("INVALID_REQUEST");
      const admission = sessionAdmission(config, proven, canonicalIp(request, config));
      const transport = preflightMultipart(request);
      if (!(await readiness())) throw new Error("WORKER_UNAVAILABLE");
      let reservation: Reservation | undefined, commitStarted = false, reserveAbandoned = false;
      const pending = worker.reserve({ ...admission, idempotencyKey: key, reservedBytes: 2 * MAX_SEALED_BYTES, now: utcInstant(config.clock.now().toISOString()), submission: config.mode === "pilot" ? { kind: "synthetic", pilotRunId: proven.pilot!.runId } : { kind: "application" } });
      // A late reserve result still needs worker-authoritative terminal release.
      void pending.then(value => { if (reserveAbandoned) void cleanupReservation(value, admission.sessionHash); }, () => {});
      try {
        reservation = await bounded(pending, controller.signal);
        const payload = await parseMultipart(request, controller.signal, transport);
        const hash = payloadDigest(payload), bytes = encodePayload(payload);
        const source = (async function* () { for (let offset = 0; offset < bytes.length; offset += 65536) { if (controller.signal.aborted) throw controller.signal.reason; yield bytes.subarray(offset, offset + 65536); } })();
        const sealed = await sealIncoming(source, { root: config.acceptance.privateRoot, maxBytes: reservation.reservedBytes / 2, reservationId: reservation.id, sharedGid: config.acceptance.sharedGid }, config.acceptance.publicKey);
        if (controller.signal.aborted) throw controller.signal.reason;
        commitStarted = true;
        const accepted = await bounded(worker.commitIntake({ reservationId: reservation.id, digest: hash, encryptedPayloadPath: sealed.path, actualBytes: sealed.bytes, encryptedName: sealName(payload.input.name, config.acceptance.publicKey), job: payload.input.job, now: utcInstant(config.clock.now().toISOString()) }), controller.signal);
        json(response, 202, { reference: accepted.reference, state: "processing", statusToken: accepted.statusProof });
      } catch (error) {
        reserveAbandoned = reservation === undefined;
        if (reservation && !commitStarted) await cleanupReservation(reservation, admission.sessionHash);
        // Once commit starts, a timeout/disconnect is ambiguous: same-key/content retry recovers.
        throw error;
      }
    };
    void handle().catch(error => errorResponse(response, error)).finally(() => { clearTimeout(timer); request.removeListener("aborted", disconnected); request.removeListener("error", disconnected); });
  });
  server.maxConnections = 64;
  const expectation = (request: IncomingMessage, response: ServerResponse) => { request.pause(); json(response, 400, { error: "Anfrage nicht erlaubt.", code: "INVALID_REQUEST" }); };
  server.on("checkContinue", expectation); server.on("checkExpectation", expectation);
  server.on("clientError", (error, socket) => {
    if (socket.destroyed || !socket.writable) return;
    const status = "code" in error && error.code === "ERR_HTTP_REQUEST_TIMEOUT" ? 408 : 400;
    const body = JSON.stringify({ error: "Anfrage nicht erlaubt.", code: "INVALID_REQUEST" });
    socket.end(`HTTP/1.1 ${status} ${status === 408 ? "Request Timeout" : "Bad Request"}\r\nContent-Type: application/json; charset=utf-8\r\nCache-Control: private, no-store\r\nReferrer-Policy: no-referrer\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  });
  return server;
}
