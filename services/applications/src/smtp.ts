import { Readable } from "node:stream";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import type { MailEnvelope, SendOutcome, SmtpPort, SmtpResult, StoredMailForSend } from "./types";
import { MAIL_ADDRESS } from "./mime-structure";
export interface SmtpCredentials { readonly user: string; readonly pass: string }
export type SmtpConnectionFactory = (options: SMTPConnection.Options) => Pick<SMTPConnection, "connect" | "login" | "send" | "close" | "on">;
// Worker-only dependency. Construction does not connect; no credential logging.
export function createSmtpPort(credentials: SmtpCredentials, factory: SmtpConnectionFactory = options => new SMTPConnection(options)): SmtpPort {
  const connection = factory({ host: "smtp.ionos.de", port: 587, secure: false, requireTLS: true, opportunisticTLS: false, tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 30000, dnsTimeout: 10000, maxResponseSize: 16384, logger: false, debug: false, transactionLog: false });
  connection.on("error", () => {});
  return {
    connect: () => new Promise<void>((resolve, reject) => connection.connect(error => error ? reject(error) : resolve())),
    login: () => new Promise<void>((resolve, reject) => connection.login({ user: credentials.user, pass: credentials.pass }, error => error ? reject(error) : resolve())),
    send: (envelope, raw) => new Promise<SmtpResult>((resolve, reject) => {
      const source = Readable.from(raw);
      connection.send({ from: envelope.from, to: [...envelope.to] }, source, (error, result) => {
        source.destroy(); if (error) reject(error); else if (result) resolve({ accepted: result.accepted, rejected: result.rejected, response: result.response }); else reject(new Error("SMTP_UNKNOWN"));
      });
    }), close: () => connection.close(),
  };
}
function negativeReply(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return;
  const { responseCode, response } = error as { responseCode?: unknown; response?: unknown };
  if (typeof responseCode !== "number" || responseCode < 400 || responseCode >= 600 || typeof response !== "string") return;
  const lines = response.split(/\r?\n/);
  if (!lines.length || !lines.every((line, i) => new RegExp(`^${responseCode}${i === lines.length - 1 ? " " : "-"}.+`).test(line))) return;
  return responseCode;
}
function explicitRejection(error: unknown): SendOutcome | undefined {
  const responseCode = negativeReply(error);
  if (responseCode === undefined || !error || typeof error !== "object" || !("command" in error) || !["MAIL FROM", "RCPT TO", "DATA"].includes(String(error.command))) return;
  return { kind: "definitely_failed", retryable: responseCode < 500 };
}
export async function sendMail(mail: StoredMailForSend, transport: SmtpPort): Promise<SendOutcome> {
  let enteredSend = false; const envelope: MailEnvelope = { from: MAIL_ADDRESS, to: [MAIL_ADDRESS] };
  try {
    // Task7 durably adopts/registers first. No composition or path here.
    if (mail.registered.profile !== "tj-mail-1" || !mail.registered.messageId || !mail.registered.fingerprint) return { kind: "definitely_failed", retryable: false };
    await transport.connect(); await transport.login(); enteredSend = true;
    const result = await transport.send(envelope, mail.raw);
    return result.accepted.length === 1 && result.accepted[0] === MAIL_ADDRESS && result.rejected.length === 0 && /^2\d\d /.test(result.response) ? { kind: "accepted" } : { kind: "uncertain" };
  } catch (error) { if (!enteredSend) return { kind: "definitely_failed", retryable: (negativeReply(error) ?? 400) < 500 }; return explicitRejection(error) ?? { kind: "uncertain" }; }
  finally { try { transport.close(); } catch { /* Cleanup cannot change SMTP outcome. */ } }
}
