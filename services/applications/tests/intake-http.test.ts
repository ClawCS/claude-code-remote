import { afterEach, describe, expect, it, vi } from "vitest";
import { request as httpRequest, type Server } from "node:http";
import { once } from "node:events";
import { readIntakeConfig } from "../src/config";
import { createIntakeServer } from "../src/intake-http";
import type { IntakeWorkerPort } from "../src/types";
import type { IntakeConfig } from "../src/config";
import { createHmac, generateKeyPairSync } from "node:crypto";
import { mkdtemp, realpath, mkdir, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openRepository } from "../src/repository";
import { createTestCustodyLedger } from "./fixtures/ingress-authority";
import { testReadiness } from "./fixtures/admission";
import { createWorkerRpc, createWorkerRpcClient } from "../src/worker-rpc";
import { spawnSync } from "node:child_process";
import * as fsPromises from "node:fs/promises";
vi.mock("node:fs/promises", async importOriginal => ({ ...await importOriginal<typeof import("node:fs/promises")>() }));

let server: Server;
let rpc: import("node:net").Server | undefined, root: string | undefined, repo: ReturnType<typeof openRepository> | undefined;
let config: IntakeConfig, time: Date;
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const unavailable: IntakeWorkerPort = {
  getIntakeReadiness: async () => { throw new Error("WORKER_UNAVAILABLE"); },
  reserve: async () => { throw new Error("WORKER_UNAVAILABLE"); },
  commitIntake: async () => { throw new Error("WORKER_UNAVAILABLE"); },
  getPublicStatus: async () => { throw new Error("WORKER_UNAVAILABLE"); },
  abortIntake: async () => { throw new Error("WORKER_UNAVAILABLE"); },
};
const origin = "http://localhost";
const metadata = { origin, "sec-fetch-site": "same-origin", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty" };
afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (server?.listening) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  if (rpc?.listening) await new Promise<void>(resolve => rpc!.close(() => resolve()));
  rpc = undefined; repo?.close(); repo = undefined;
  if (root) await rm(root, { recursive: true, force: true }); root = undefined;
});
async function start() {
  server = createIntakeServer(readIntakeConfig({ NODE_ENV: "test", APPLICATIONS_ORIGIN: origin }), unavailable);
  server.listen(0, "127.0.0.1"); await once(server, "listening");
}
async function request(path: string, method = "GET", headers: Record<string, string | string[] | undefined> = metadata, body?: Buffer) {
  const address = server.address(); if (!address || typeof address === "string") throw new Error("TEST_ADDRESS");
  return new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; body: unknown }>((resolve, reject) => {
    const request = httpRequest({ host: "127.0.0.1", port: address.port, path, method, headers: Object.fromEntries(Object.entries(headers).filter(([, value]) => value !== undefined)) }, response => {
      const chunks: Buffer[] = []; response.on("data", chunk => chunks.push(chunk)); response.on("end", () => {
        const text = Buffer.concat(chunks).toString(); resolve({ status: response.statusCode!, headers: response.headers, body: text ? JSON.parse(text) : null });
      });
    }); request.on("error", reject); request.end(body);
  });
}
async function active(mode: "enabled" | "pilot" = "enabled", wrap?: (port: IntakeWorkerPort) => IntakeWorkerPort) {
  root = await mkdtemp(join(await realpath(tmpdir()), "synthetic-intake-http-"));
  const intakeRoot = join(root, "intake"), custodyRoot = join(root, "custody"), runtimeRoot = join(root, "run");
  await Promise.all([intakeRoot, custodyRoot, runtimeRoot].map(path => mkdir(path, { mode: 0o700 })));
  time = new Date("2026-10-09T10:00:00.000Z");
  const clock = { now: () => new Date(time) };
  config = { mode, origin, clock, host: "127.0.0.1", port: 3105, proxy: { peer: "loopback", clientIpHeader: "x-application-client-ip" }, lifetimes: { sessionSeconds: 604800, formSeconds: 900, pilotSeconds: 3600 }, acceptance: { privateRoot: intakeRoot, socketPath: join(root, "worker.sock"), ownerUid: process.getuid!(), sharedGid: process.getgid!(), publicKey: keys.publicKey, keys: { cookieSignature: Buffer.alloc(32, 1), formSignature: Buffer.alloc(32, 2), sessionHash: Buffer.alloc(32, 3), sessionRate: Buffer.alloc(32, 4), ipRate: Buffer.alloc(32, 5), pilotSignature: Buffer.alloc(32, 6) } } };
  repo = openRepository(join(root, "registry.sqlite"));
  // Explicit synthetic controlled-holder fixture; never a production readiness adapter.
  const custody = createTestCustodyLedger(repo, { intakeRoot, custodyRoot, runtimeRoot, intakeUid: process.getuid!(), sharedGid: process.getgid!(), clock });
  await custody.reconcile();
  rpc = createWorkerRpc(repo, { socketPath: config.acceptance!.socketPath, custody, sharedGid: process.getgid!(), clock, readiness: testReadiness });
  rpc.listen(config.acceptance!.socketPath); await once(rpc, "listening");
  const port = createWorkerRpcClient(config.acceptance!.socketPath);
  server = createIntakeServer(config, wrap ? wrap(port) : port); server.listen(0, "127.0.0.1"); await once(server, "listening");
}
async function bootstrap(cookie?: string, authorization?: string) {
  const response = await request("/api/bewerbung/session", "POST", { ...metadata, ...(cookie ? { cookie } : {}), ...(authorization ? { authorization } : {}) });
  expect(response.status).toBe(200);
  return { cookie: (response.headers["set-cookie"] as string[])[0].split(";")[0], token: (response.body as { formToken: string }).formToken, response };
}
const boundary = "synthetic-intake-boundary";
function multipart(fields: [string, Buffer | string][] = [["name", "Synthetic Applicant"], ["email", "synthetic@example.invalid"], ["job", "sales-fulltime"]], files: { name?: string; data: Buffer; type?: string; field?: string }[] = []) {
  const chunks: Buffer[] = [];
  for (const [name, value] of fields) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n`), Buffer.isBuffer(value) ? value : Buffer.from(value), Buffer.from("\r\n"));
  for (const file of files) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.field ?? "files"}"; filename="${file.name ?? "synthetic.png"}"\r\nContent-Type: ${file.type ?? "image/png"}\r\n\r\n`), file.data, Buffer.from("\r\n"));
  chunks.push(Buffer.from(`--${boundary}--\r\n`)); return Buffer.concat(chunks);
}
function uploadHeaders(session: { cookie: string; token: string }, key = "synthetic-key") {
  return { ...metadata, cookie: session.cookie, "x-application-form-token": session.token, "idempotency-key": key, "x-application-client-ip": "192.0.2.1", "content-type": `multipart/form-data; boundary=${boundary}` };
}
describe("disabled intake", () => {
  it("returns private JSON errors even for Node-rejected malformed request headers", async () => {
    await start(); const response = await request("/api/bewerbung/session", "POST", { ...metadata, "content-length": "-1" });
    expect(response.status).toBe(400); expect(response.body).toMatchObject({ code: "INVALID_REQUEST" }); expect(response.headers["cache-control"]).toBe("private, no-store");
  });
  it("allows absent Origin on ordinary same-origin GET but not POST or cross-site metadata", async () => {
    await start(); expect((await request("/api/bewerbung/config", "GET", { ...metadata, origin: undefined })).status).toBe(200);
    expect((await request("/api/bewerbung/session", "POST", { ...metadata, origin: undefined })).status).toBe(403);
    expect((await request("/api/bewerbung/config", "GET", { ...metadata, "sec-fetch-site": "cross-site" })).status).toBe(403);
  });
  it("imports compiled factories and startup module without opening an HTTP listener", () => {
    const result = spawnSync(process.execPath, ["--eval", "const net=require('node:net'); net.Server.prototype.listen=()=>{throw new Error('UNEXPECTED_LISTEN')}; const root='./.build/applications/services/applications/src/'; const {readIntakeConfig}=require(root+'config.js'); const {createIntakeWorkerClient}=require(root+'intake-client.js'); require(root+'intake-main.js'); require(root+'intake-http.js'); const c=readIntakeConfig({NODE_ENV:'test',APPLICATIONS_ORIGIN:'http://localhost'}); createIntakeWorkerClient(c).reserve({}).then(()=>process.exit(2),e=>{if(e.message!=='WORKER_UNAVAILABLE')process.exit(3)});"], { timeout: 5000, encoding: "utf8" });
    expect(result.status).toBe(0); expect(result.stdout).toBe(""); expect(result.stderr).toBe(""); expect(result.error).toBeUndefined();
  });
  it("boots without acceptance secrets and returns truthful disabled config with private headers", async () => {
    await start(); const response = await request("/api/bewerbung/config");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ enabled: false, mode: "disabled", limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 } });
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
  it("rejects cross-origin POST before admitting an unbounded body", async () => {
    await start(); const response = await request("/api/bewerbung", "POST", { ...metadata, origin: "https://attacker.invalid" });
    expect(response.status).toBe(403); expect(response.body).toMatchObject({ code: "FORBIDDEN" });
  });
});
describe("authenticated synthetic HTTP streams", () => {
  it("responds at total deadline while a real handoff writer remains blocked, then releases only after writer settles", async () => {
    let started!: () => void, release!: () => void, aborted!: () => void;
    const writing = new Promise<void>(resolve => { started = resolve; }), gate = new Promise<void>(resolve => { release = resolve; }), terminal = new Promise<void>(resolve => { aborted = resolve; });
    await active("enabled", port => ({ ...port, abortIntake: async (...args) => { await port.abortIntake(...args); aborted(); } }));
    const session = await bootstrap(); const realOpen = fsPromises.open;
    vi.spyOn(fsPromises, "open").mockImplementation(async (...args) => {
      const fd = await realOpen(...args);
      if (String(args[0]).startsWith(config.acceptance!.privateRoot + "/")) {
        const write = fd.write.bind(fd);
        vi.spyOn(fd, "write").mockImplementationOnce((async (...writeArgs: unknown[]) => { started(); await gate; return Reflect.apply(write, fd, writeArgs); }) as typeof fd.write);
      }
      return fd;
    });
    let outgoing: import("node:http").ServerResponse | undefined;
    server.on("request", (_req, res) => { outgoing = res; });
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const response = request("/api/bewerbung", "POST", uploadHeaders(session), multipart());
    await writing; vi.advanceTimersByTime(60000);
    try {
      expect(outgoing!.writableEnded).toBe(true);
      expect(await readdir(config.acceptance!.privateRoot)).toHaveLength(1); expect(repo!.listRetainedIntakes()).toEqual([]);
    } finally { release(); await terminal; expect((await response).status).toBe(408); }
    expect(await readdir(config.acceptance!.privateRoot)).toEqual([]);
  });
  it("allows only two parallel unbounded streams and releases disconnected leases through worker", async () => {
    let count = 0, aborts = 0, slots!: () => void, released!: () => void;
    const filled = new Promise<void>(resolve => { slots = resolve; }), terminal = new Promise<void>(resolve => { released = resolve; });
    await active("enabled", port => ({ ...port, reserve: async input => { const result = await port.reserve(input); if (++count === 2) slots(); return result; }, abortIntake: async (...args) => { await port.abortIntake(...args); if (++aborts === 2) released(); } }));
    const session = await bootstrap(), address = server.address() as import("node:net").AddressInfo;
    const clients = ["one", "two"].map(key => {
      const client = httpRequest({ host: "127.0.0.1", port: address.port, path: "/api/bewerbung", method: "POST", headers: { ...uploadHeaders(session, key), "transfer-encoding": "chunked" } });
      client.on("error", () => {}); client.write(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nSynthetic`)); return client;
    });
    await filled;
    const denied = await request("/api/bewerbung", "POST", uploadHeaders(session, "three"), multipart());
    expect(denied.status).toBe(429); expect(denied.body).toMatchObject({ code: "CAPACITY_EXCEEDED", retryAfterSeconds: 60 }); expect(denied.headers["retry-after"]).toBe("60");
    clients.forEach(client => client.destroy()); await terminal;
    expect(repo!.listRetainedIntakes()).toEqual([]); expect(await readdir(config.acceptance!.privateRoot)).toEqual([]);
    expect(repo!.pruneAdmissionEvents("2026-10-09T11:00:00.000Z" as import("../src/types").Instant)).toBe(6);
  });
  it("releases a late reserve result after absolute RPC timeout without local deletion", async () => {
    let obtained!: () => void, release!: () => void, aborted!: () => void;
    const reservation = new Promise<void>(resolve => { obtained = resolve; }), gate = new Promise<void>(resolve => { release = resolve; }), terminal = new Promise<void>(resolve => { aborted = resolve; });
    await active("enabled", port => ({ ...port, reserve: async input => { const result = await port.reserve(input); obtained(); await gate; return result; }, abortIntake: async (...args) => { await port.abortIntake(...args); aborted(); } }));
    const session = await bootstrap(); vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const response = request("/api/bewerbung", "POST", uploadHeaders(session), multipart());
    await reservation; vi.advanceTimersByTime(5000); expect((await response).status).toBe(503);
    release(); await terminal; expect(repo!.listRetainedIntakes()).toEqual([]); expect(await readdir(config.acceptance!.privateRoot)).toEqual([]);
  });
  it("does not abort or unlink after an absolute commit RPC timeout and retry recovers accepted reference", async () => {
    let accepted!: () => void, release!: () => void, finished!: () => void, first = true;
    const durable = new Promise<void>(resolve => { accepted = resolve; }), gate = new Promise<void>(resolve => { release = resolve; }), completion = new Promise<void>(resolve => { finished = resolve; });
    await active("enabled", port => ({ ...port, commitIntake: async input => { const result = await port.commitIntake(input); if (first) { first = false; accepted(); await gate; finished(); } return result; } }));
    const session = await bootstrap(), body = multipart(); vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const response = request("/api/bewerbung", "POST", uploadHeaders(session), body);
    await durable; const retained = repo!.listRetainedIntakes(); expect(retained).toHaveLength(1);
    const reference = await repo!.withCaseLock(retained[0].id, async row => row.reference);
    vi.advanceTimersByTime(5000); expect((await response).status).toBe(503);
    release(); await completion; vi.useRealTimers();
    const replay = await request("/api/bewerbung", "POST", uploadHeaders(session), body);
    expect(replay.status).toBe(202); expect(replay.body).toMatchObject({ reference }); expect(repo!.listRetainedIntakes()).toEqual(retained);
  });
  it("maps malformed unquoted multipart boundary to 400", async () => {
    await active(); const session = await bootstrap();
    expect((await request("/api/bewerbung", "POST", { ...uploadHeaders(session), "content-type": "multipart/form-data; boundary=a:b" }, multipart())).status).toBe(400);
  });
  it("terminates an unbounded empty-session body at the total deadline", async () => {
    let ready!: () => void; const readiness = new Promise<void>(resolve => { ready = resolve; });
    await active("enabled", port => ({ ...port, getIntakeReadiness: async () => { const result = await port.getIntakeReadiness(); ready(); return result; } }));
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const address = server.address() as import("node:net").AddressInfo;
    let client!: ReturnType<typeof httpRequest>;
    const response = new Promise<number>((resolve, reject) => {
      client = httpRequest({ host: "127.0.0.1", port: address.port, path: "/api/bewerbung/session", method: "POST", headers: { ...metadata, "transfer-encoding": "chunked" } }, res => { res.resume(); res.on("end", () => resolve(res.statusCode!)); });
      client.on("error", reject); client.flushHeaders();
    });
    await readiness; await new Promise<void>(resolve => setImmediate(resolve));
    vi.advanceTimersByTime(60000);
    expect(await response).toBe(408); client.destroy();
    expect(repo!.listRetainedIntakes()).toEqual([]);
  });
  it("aborts a disconnected chunked upload through worker custody and keeps its admission charged", async () => {
    let reserved!: () => void, aborted!: () => void;
    const reservation = new Promise<void>(resolve => { reserved = resolve; }), terminal = new Promise<void>(resolve => { aborted = resolve; });
    await active("enabled", port => ({ ...port, reserve: async input => { const result = await port.reserve(input); reserved(); return result; }, abortIntake: async (...args) => { await port.abortIntake(...args); aborted(); } }));
    const session = await bootstrap(), address = server.address() as import("node:net").AddressInfo;
    const client = httpRequest({ host: "127.0.0.1", port: address.port, path: "/api/bewerbung", method: "POST", headers: { ...uploadHeaders(session), "transfer-encoding": "chunked" } });
    client.on("error", () => {}); client.write(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nSynthetic`));
    await reservation; client.destroy(); await terminal;
    expect(repo!.listRetainedIntakes()).toEqual([]); expect(await readdir(config.acceptance!.privateRoot)).toEqual([]);
    expect(repo!.pruneAdmissionEvents("2026-10-09T11:00:00.000Z" as import("../src/types").Instant)).toBe(2);
  });
  it("preserves durable acceptance after unknown RPC result and recovers exact same-key/content retry", async () => {
    let first = true;
    await active("enabled", port => ({ ...port, commitIntake: async input => { const accepted = await port.commitIntake(input); if (first) { first = false; throw new Error("WORKER_UNAVAILABLE"); } return accepted; } }));
    const session = await bootstrap(), body = multipart(undefined, [{ data: Buffer.from("synthetic uncertain") }]);
    expect((await request("/api/bewerbung", "POST", uploadHeaders(session), body)).status).toBe(503);
    const retained = repo!.listRetainedIntakes(); expect(retained).toHaveLength(1);
    const replay = await request("/api/bewerbung", "POST", uploadHeaders(session), body); expect(replay.status).toBe(202);
    const reference = await repo!.withCaseLock(retained[0].id, async row => row.reference);
    expect(repo!.listRetainedIntakes()).toEqual(retained); expect(replay.body).toMatchObject({ reference });
    expect((await request("/api/bewerbung/status", "GET", { ...metadata, authorization: "Bearer " + (replay.body as { statusToken: string }).statusToken })).body).toEqual({ reference, state: "processing", acceptedAt: "2026-10-09T10:00:00.000Z" });
  });
  it("rejects signed but malformed pilot grant without treating attacker input as outage", async () => {
    await active("pilot");
    const data = Buffer.from(JSON.stringify({ v: 1, runId: "synthetic-run", issuedAt: 1791540000, expiresAt: 1791543600, unknown: true })).toString("base64url");
    const grant = data + "." + createHmac("sha256", config.acceptance!.keys.pilotSignature).update("TJ-PILOT-1\0" + data).digest("base64url");
    expect((await request("/api/bewerbung/session", "POST", { ...metadata, authorization: "Bearer " + grant })).status).toBe(403);
  });
  it.each(["origin", "cookie", "x-application-form-token", "idempotency-key", "x-application-client-ip", "x-application-synthetic"])("rejects duplicate %s security headers", async name => {
    await active(); const session = await bootstrap(), headers = uploadHeaders(session);
    expect((await request("/api/bewerbung", "POST", { ...headers, [name]: [name === "x-application-synthetic" ? "1" : headers[name as keyof typeof headers], name === "x-application-synthetic" ? "1" : headers[name as keyof typeof headers]] }, multipart())).status).toBe(403);
    expect(repo!.listRetainedIntakes()).toEqual([]);
  });
  it("rejects bad session/form proof, mode marker, proxy chain and expired form before charging admission", async () => {
    await active(); const first = await bootstrap(), second = await bootstrap();
    for (const extra of [{ "x-application-form-token": second.token }, { cookie: first.cookie.slice(0, -1) + "x" }, { "x-application-synthetic": "1" }, { "x-application-synthetic": "true" }, { "x-application-client-ip": "192.0.2.1, 192.0.2.2" }, { "x-application-client-ip": "192.000.2.1" }, { "sec-fetch-site": "cross-site" }, { "sec-fetch-mode": "navigate" }, { "sec-fetch-dest": "document" }]) {
      expect((await request("/api/bewerbung", "POST", { ...uploadHeaders(first), ...extra }, multipart())).status).toBe(403);
    }
    time = new Date("2026-10-09T10:15:00.000Z"); expect((await request("/api/bewerbung", "POST", uploadHeaders(first), multipart())).status).toBe(403);
    expect(repo!.pruneAdmissionEvents("2026-10-09T11:15:00.000Z" as import("../src/types").Instant)).toBe(0);
  });
  it("charges invalid bodies durably and returns worker-authoritative Retry-After on seventh attempt", async () => {
    await active(); const session = await bootstrap();
    for (let index = 0; index < 6; index++) expect((await request("/api/bewerbung", "POST", uploadHeaders(session, "invalid-" + index), multipart([["unknown", "synthetic"]]))).status).toBe(400);
    const denied = await request("/api/bewerbung", "POST", uploadHeaders(session, "seventh"), multipart());
    expect(denied.status).toBe(429); expect(denied.body).toMatchObject({ code: "RATE_LIMITED", retryAfterSeconds: 3600 }); expect(denied.headers["retry-after"]).toBe("3600");
    expect(repo!.listRetainedIntakes()).toEqual([]);
  });
  it.each([
    ["five files", Array.from({ length: 5 }, () => ({ data: Buffer.from("synthetic") })), 202],
    ["six files", Array.from({ length: 6 }, () => ({ data: Buffer.from("synthetic") })), 413],
    ["exact 5 MiB file", [{ data: Buffer.alloc(5242880) }], 202],
    ["over 5 MiB file", [{ data: Buffer.alloc(5242881) }], 413],
    ["exact 10 MiB aggregate", [{ data: Buffer.alloc(5242880) }, { data: Buffer.alloc(5242880) }], 202],
    ["over 10 MiB aggregate", [{ data: Buffer.alloc(5242880) }, { data: Buffer.alloc(5242880) }, { data: Buffer.from("x") }], 413],
  ] as const)("enforces inclusive boundary %s on real streams", async (_label, files, expected) => {
    await active(); const session = await bootstrap();
    expect((await request("/api/bewerbung", "POST", uploadHeaders(session), multipart(undefined, [...files]))).status).toBe(expected);
    expect(repo!.listRetainedIntakes()).toHaveLength(expected === 202 ? 1 : 0);
    expect(await readdir(config.acceptance!.privateRoot)).toEqual([]);
  });
  it.each([
    ["duplicate", [["name", "Synthetic"], ["email", "synthetic@example.invalid"], ["job", "sales-fulltime"], ["name", "again"]]],
    ["unknown", [["name", "Synthetic"], ["email", "synthetic@example.invalid"], ["job", "sales-fulltime"], ["unknown", "x"]]],
    ["bad UTF8", [["name", Buffer.from([0xc3, 0x28])], ["email", "synthetic@example.invalid"], ["job", "sales-fulltime"]]],
    ["missing", [["name", "Synthetic"], ["email", "synthetic@example.invalid"]]],
  ] as [string, [string, string | Buffer][]][])("rejects %s fields without accepted data", async (_label, fields) => {
    await active(); const session = await bootstrap();
    expect((await request("/api/bewerbung", "POST", uploadHeaders(session), multipart(fields))).status).toBe(400);
    expect(repo!.listRetainedIntakes()).toEqual([]); expect(await readdir(config.acceptance!.privateRoot)).toEqual([]);
  });
  it("refreshes form proof under the fixed session and durably accepts/replays with private bearer status", async () => {
    await active(); const session = await bootstrap(); const fresh = await bootstrap(session.cookie);
    expect(fresh.cookie).toBe(session.cookie); expect(fresh.token).not.toBe(session.token);
    expect(session.response.headers["set-cookie"]![0]).toContain("HttpOnly; SameSite=Strict");
    const body = multipart(); const accepted = await request("/api/bewerbung", "POST", uploadHeaders(session), body);
    expect(accepted.status).toBe(202); const result = accepted.body as { reference: string; statusToken: string; state: string };
    expect(Object.keys(result).sort()).toEqual(["reference", "state", "statusToken"]);
    expect(result.state).toBe("processing"); expect(repo!.listRetainedIntakes()).toHaveLength(1);
    const replay = await request("/api/bewerbung", "POST", uploadHeaders(fresh), body);
    expect(replay.status).toBe(202); expect(replay.body).toMatchObject({ reference: result.reference }); expect(repo!.listRetainedIntakes()).toHaveLength(1);
    const status = await request("/api/bewerbung/status", "GET", { ...metadata, authorization: "Bearer " + result.statusToken });
    expect(status.status).toBe(200); expect(status.body).toEqual({ reference: result.reference, state: "processing", acceptedAt: "2026-10-09T10:00:00.000Z" });
    expect((await request("/api/bewerbung/status?statusToken=" + result.statusToken)).status).toBe(400);
    expect((await request("/api/bewerbung/status", "GET", { ...metadata, authorization: "Bearer " + "a".repeat(43) })).status).toBe(403);
    time = new Date("2026-10-16T10:00:00.000Z");
    expect((await request("/api/bewerbung/status", "GET", { ...metadata, authorization: "Bearer " + result.statusToken })).status).toBe(403);
  });
  it("does not merge cross-session keys and conflicts on changed retry content", async () => {
    await active(); const first = await bootstrap(), second = await bootstrap();
    const one = await request("/api/bewerbung", "POST", uploadHeaders(first), multipart()); expect(one.status).toBe(202);
    const two = await request("/api/bewerbung", "POST", uploadHeaders(second), multipart()); expect(two.status).toBe(202);
    expect(two.body).not.toMatchObject({ reference: (one.body as { reference: string }).reference });
    expect((await request("/api/bewerbung", "POST", uploadHeaders(first), multipart(undefined, [{ data: Buffer.from("synthetic changed") }]))).status).toBe(409);
    expect(repo!.listRetainedIntakes()).toHaveLength(2);
    // Existing reviewed custody behavior: an ordinary conflict latches global
    // readiness false. This availability concern is handed off, not bypassed.
    expect((await request("/api/bewerbung/config")).body).toMatchObject({ enabled: false });
    expect((await request("/api/bewerbung", "POST", uploadHeaders(second, "after-conflict"), multipart())).status).toBe(503);
  });
  it("fails closed on unavailable readiness without accepting or reserving", async () => {
    await active("enabled", port => ({ ...port, getIntakeReadiness: unavailable.getIntakeReadiness }));
    expect((await request("/api/bewerbung/config")).body).toMatchObject({ enabled: false });
    expect((await request("/api/bewerbung/session", "POST")).status).toBe(503);
    expect(await readdir(config.acceptance!.privateRoot)).toEqual([]);
  });
  it("bootstraps pilot only with a bounded signed grant and exact explicit synthetic marker", async () => {
    await active("pilot"); expect((await request("/api/bewerbung/config")).body).toMatchObject({ enabled: false, mode: "pilot" });
    expect((await request("/api/bewerbung/session", "POST")).status).toBe(403);
    const data = Buffer.from(JSON.stringify({ v: 1, runId: "synthetic-run", issuedAt: 1791540000, expiresAt: 1791543600 })).toString("base64url");
    const grant = data + "." + createHmac("sha256", config.acceptance!.keys.pilotSignature).update("TJ-PILOT-1\0" + data).digest("base64url");
    const session = await bootstrap(undefined, "Bearer " + grant);
    expect((await request("/api/bewerbung/config", "GET", { ...metadata, cookie: session.cookie })).body).toMatchObject({ enabled: true });
    expect((await request("/api/bewerbung", "POST", uploadHeaders(session), multipart())).status).toBe(403);
    const accepted = await request("/api/bewerbung", "POST", { ...uploadHeaders(session), "x-application-synthetic": "1" }, multipart());
    expect(accepted.status).toBe(202); expect(repo!.getSubmissionKind(repo!.listRetainedIntakes()[0].id)).toEqual({ kind: "synthetic", pilotRunId: "synthetic-run" });
    time = new Date("2026-10-09T11:00:00.000Z");
    expect((await request("/api/bewerbung/session", "POST", { ...metadata, cookie: session.cookie })).status).toBe(403);
  });
});
