import { describe, expect, it } from "vitest";
import { createServer, type Socket } from "node:net";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import { createSmtpPort, sendMail } from "../src/smtp";
import { applicationId, digest, type RegisteredMail } from "../src/types";
const registered: RegisteredMail = { id: applicationId("11111111-1111-4111-8111-111111111111"), messageId: "<application-1111@trinkgut-jammers.de>", keyId: "mail-2026", profile: "tj-mail-1", fingerprint: digest("a".repeat(64)), shape: { kind: "text", parts: 1, attachments: [] } };
async function* raw() { yield Buffer.from("stored immutable MIME\r\n"); }
describe("conservative SMTP local port", () => {
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
