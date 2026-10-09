import { describe, expect, it } from "vitest";
import { createServer, type Socket } from "node:net";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import { createSmtpPort, sendMail } from "../src/smtp";
import { applicationId, digest, type RegisteredMail } from "../src/types";
const registered: RegisteredMail = { id: applicationId("11111111-1111-4111-8111-111111111111"), messageId: "<application-1111@trinkgut-jammers.de>", keyId: "mail-2026", profile: "tj-mail-1", fingerprint: digest("a".repeat(64)), shape: { kind: "text", parts: 1, attachments: [] } };
async function* raw() { yield Buffer.from("stored immutable MIME\r\n"); }
// Public event/callback boundary only; no sockets or library-private state.
function eventConnection() {
  const events = new EventEmitter(), calls: string[] = [];
  let connectDone: Parameters<SMTPConnection["connect"]>[0], loginDone: Parameters<SMTPConnection["login"]>[1], sendDone: Parameters<SMTPConnection["send"]>[2];
  let source: Parameters<SMTPConnection["send"]>[1];
  const connection = {
    on: events.on.bind(events),
    connect(done: Parameters<SMTPConnection["connect"]>[0]) { calls.push("connect"); connectDone = done; },
    login(_auth: Parameters<SMTPConnection["login"]>[0], done: Parameters<SMTPConnection["login"]>[1]) { calls.push("login"); loginDone = done; },
    send(_envelope: Parameters<SMTPConnection["send"]>[0], rawSource: Parameters<SMTPConnection["send"]>[1], done: Parameters<SMTPConnection["send"]>[2]) { calls.push("send"); source = rawSource; sendDone = done; },
    close() { calls.push("close"); },
  };
  return { connection, events, calls, source: () => source, connect: () => connectDone?.(), login: () => loginDone(null, true), lateConnectFailure: () => connectDone?.(new Error("late callback")), accept: () => sendDone(null, { accepted: ["info@trinkgut-jammers.de"], rejected: [], response: "250 queued", envelopeTime: 0, messageTime: 0, messageSize: 1 }) };
}
async function flushOperations() { for (let i = 0; i < 6; i++) await Promise.resolve(); }
describe("conservative SMTP local port", () => {
  it.each(["connect", "login", "send"])("settles event-only %s failure without waiting for a callback", async phase => {
    const stub = eventConnection(), port = createSmtpPort({ user: "synthetic", pass: "synthetic" }, () => stub.connection);
    let outcome: unknown; const pending = sendMail({ registered, raw: raw() }, port).then(value => { outcome = value; });
    if (phase !== "connect") { stub.connect(); await flushOperations(); }
    if (phase === "send") { stub.login(); await flushOperations(); }
    stub.events.emit("error", new Error("event only")); await flushOperations();
    expect(outcome).toEqual(phase === "send" ? { kind: "uncertain" } : { kind: "definitely_failed", retryable: true });
    await pending; expect(stub.calls.filter(call => call === "close")).toHaveLength(1);
    if (phase === "send") { expect(stub.source()).toBeInstanceOf(Readable); expect((stub.source() as Readable).destroyed).toBe(true); stub.accept(); expect(outcome).toEqual({ kind: "uncertain" }); }
    stub.events.emit("error", new Error("late event")); stub.lateConnectFailure();
    expect(stub.calls.filter(call => call === "close")).toHaveLength(1);
  });
  it.each(["connect-login", "login-send"])("latches errors in the %s phase gap before invoking another client operation", async gap => {
    const stub = eventConnection(), port = createSmtpPort({ user: "synthetic", pass: "synthetic" }, () => stub.connection);
    let outcome: unknown; const pending = sendMail({ registered, raw: raw() }, port).then(value => { outcome = value; });
    stub.connect();
    if (gap === "login-send") { await flushOperations(); stub.login(); }
    stub.events.emit("error", new Error("gap failure")); await flushOperations();
    expect(outcome).toEqual(gap === "connect-login" ? { kind: "definitely_failed", retryable: true } : { kind: "uncertain" });
    await pending; expect(stub.calls).toEqual(gap === "connect-login" ? ["connect", "close"] : ["connect", "login", "close"]);
  });
  it("ignores an old operation callback while settling the current operation and preserves final acceptance", async () => {
    const stub = eventConnection(), port = createSmtpPort({ user: "synthetic", pass: "synthetic" }, () => stub.connection);
    const pending = sendMail({ registered, raw: raw() }, port);
    stub.connect(); await flushOperations(); stub.lateConnectFailure(); stub.login(); await flushOperations(); stub.accept();
    stub.events.emit("error", new Error("after final acceptance"));
    expect(await pending).toEqual({ kind: "accepted" }); expect(stub.calls).toEqual(["connect", "login", "send", "close"]);
  });
  it.each(["connect", "login"])("classifies failure before send at %s as definitely failed", async phase => {
    const port = { async connect() { if (phase === "connect") throw new Error("disconnect"); }, async login() { if (phase === "login") throw new Error("auth failed"); }, async send() { throw new Error("must not send"); }, close() {} };
    expect(await sendMail({ registered, raw: raw() }, port)).toEqual({ kind: "definitely_failed", retryable: true });
  });
  it.each(["DATA", "after terminator", "before envelope known", "stream"])("never retries an unproven failure after send enters: %s", async stage => {
    const port = { async connect() {}, async login() {}, async send() { throw Object.assign(new Error(stage), { command: "CONN", responseCode: 451 }); }, close() {} };
    expect(await sendMail({ registered, raw: raw() }, port)).toEqual({ kind: "uncertain" });
  });
  it.each([["MAIL FROM", 450, true], ["RCPT TO", 550, false], ["DATA", 451, true], ["DATA", 554, false]])("classifies a complete negative %s %s", async (command, responseCode, retryable) => {
    const port = { async connect() {}, async login() {}, async send() { throw Object.assign(new Error("rejected"), { command, responseCode, response: `${responseCode} rejected` }); }, close() {} };
    expect(await sendMail({ registered, raw: raw() }, port)).toEqual({ kind: "definitely_failed", retryable });
  });
  it("sends exactly stored bytes under the fixed envelope and accepts only final success", async () => {
    let bytes = "", envelope: unknown;
    const port = { async connect() {}, async login() {}, async send(value: unknown, source: AsyncIterable<Uint8Array>) { envelope = value; for await (const chunk of source) bytes += Buffer.from(chunk).toString(); return { accepted: ["info@trinkgut-jammers.de"], rejected: [], response: "250 queued" }; }, close() {} };
    expect(await sendMail({ registered, raw: raw() }, port)).toEqual({ kind: "accepted" });
    expect(envelope).toEqual({ from: "info@trinkgut-jammers.de", to: ["info@trinkgut-jammers.de"] }); expect(bytes).toBe("stored immutable MIME\r\n");
  });
  it.each(["accept", "disconnect-data", "disconnect-terminator", "reject-mail", "reject-recipient", "reject-data", "reject-final", "reject-login"])("uses the actual client against loopback SMTP stub: %s", async scenario => {
    const sockets = new Set<Socket>(), commands: string[] = [], received: string[] = [];
    const server = createServer(socket => {
      sockets.add(socket); socket.on("close", () => sockets.delete(socket)); socket.on("error", () => {});
      socket.write("220 synthetic.local ESMTP\r\n"); let input = "", inData = false;
      socket.on("data", chunk => {
        input += chunk.toString(); let end: number;
        while ((end = input.indexOf("\r\n")) !== -1) {
          const line = input.slice(0, end); input = input.slice(end + 2);
          if (inData) {
            if (line === ".") { inData = false; if (scenario === "disconnect-terminator") socket.destroy(); else socket.write(scenario === "reject-final" ? "554 content rejected\r\n" : "250 queued\r\n"); }
            else received.push(line); continue;
          }
          commands.push(line);
          if (line.startsWith("EHLO")) socket.write("250-synthetic.local\r\n250 AUTH PLAIN\r\n");
          else if (line.startsWith("AUTH")) socket.write(scenario === "reject-login" ? "535 auth rejected\r\n" : "235 authenticated\r\n");
          else if (line.startsWith("MAIL FROM")) socket.write(scenario === "reject-mail" ? "450 unavailable\r\n" : "250 sender OK\r\n");
          else if (line.startsWith("RCPT TO")) socket.write(scenario === "reject-recipient" ? "550 recipient rejected\r\n" : "250 recipient OK\r\n");
          else if (line === "DATA") { if (scenario === "reject-data") socket.write("451 busy\r\n"); else { inData = true; socket.write("354 send\r\n"); if (scenario === "disconnect-data") socket.destroy(); } }
        }
      });
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address(); if (!address || typeof address === "string") throw new Error("stub address");
    const port = createSmtpPort({ user: "synthetic", pass: "synthetic-not-a-real-secret" }, options => {
      expect(options).toMatchObject({ host: "smtp.ionos.de", port: 587, secure: false, requireTLS: true, opportunisticTLS: false, tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" }, logger: false, debug: false, transactionLog: false });
      // Test-only loopback transport; production factory remains fixed TLS IONOS.
      return new SMTPConnection({ ...options, host: "127.0.0.1", port: address.port, requireTLS: false, socketTimeout: 1000 });
    });
    try {
      const outcome = await sendMail({ registered, raw: raw() }, port);
      const expected = scenario === "accept" ? { kind: "accepted" } : scenario.startsWith("disconnect") ? { kind: "uncertain" } : { kind: "definitely_failed", retryable: ["reject-mail", "reject-data"].includes(scenario) };
      expect(outcome).toEqual(expected);
      if (scenario === "accept") { expect(received).toEqual(["stored immutable MIME"]); expect(commands.some(line => line === "MAIL FROM:<info@trinkgut-jammers.de>")).toBe(true); expect(commands.some(line => line === "RCPT TO:<info@trinkgut-jammers.de>")).toBe(true); }
    } finally { for (const socket of sockets) socket.destroy(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});
