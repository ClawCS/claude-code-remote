import { Readable } from "node:stream";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import type { MailEnvelope, SendOutcome, SmtpPort, SmtpResult, StoredMailForSend } from "./types";
import { MAIL_ADDRESS } from "./mime-structure";
export interface SmtpCredentials { readonly user: string; readonly pass: string }
export type SmtpConnectionFactory = (options: SMTPConnection.Options) => Pick<SMTPConnection, "connect" | "login" | "send" | "close"> & { on(event: "error", listener: (error: Error) => void): unknown };
// Worker-only dependency. Construction does not connect; no credential logging.
export function createSmtpPort(credentials: SmtpCredentials, factory: SmtpConnectionFactory = options => new SMTPConnection(options)): SmtpPort {
  const connection = factory({ host: "smtp.ionos.de", port: 587, secure: false, requireTLS: true, opportunisticTLS: false, tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 30000, dnsTimeout: 10000, maxResponseSize: 16384, logger: false, debug: false, transactionLog: false });
  let terminalError: unknown, activeReject: ((error: unknown) => void) | undefined, closed = false;
  const closeConnection = () => { if (!closed) { closed = true; try { connection.close(); } catch { /* Outcome is already settled; close remains one-shot. */ } } };
  connection.on("error", error => {
    // Connect/login may emit only this event. Latch errors in phase gaps too,
    // so no later client operation can proceed on a failed connection.
    terminalError ??= error ?? new Error("SMTP_UNKNOWN");
    activeReject?.(terminalError); closeConnection();
  });
  const operation = <T>(start: (finish: (error: unknown, result: T) => void) => void, cleanup: () => void = () => {}): Promise<T> => new Promise<T>((resolve, reject) => {
    if (terminalError !== undefined || closed) { reject(terminalError ?? new Error("SMTP_CLOSED")); return; }
    if (activeReject) { reject(new Error("SMTP_OPERATION_BUSY")); return; }
    let settled = false;
    const finish = (error: unknown, result: T) => {
      if (settled) return; settled = true; activeReject = undefined; cleanup();
      if (error != null) { terminalError ??= error; closeConnection(); reject(error); } else resolve(result);
    };
    activeReject = error => finish(error, undefined as T);
    try { start(finish); } catch (error) { finish(error, undefined as T); }
  });
  return {
    connect: () => operation<void>(finish => connection.connect(error => finish(error, undefined))),
    login: () => operation<void>(finish => connection.login({ user: credentials.user, pass: credentials.pass }, error => finish(error, undefined))),
    send: (envelope, raw) => {
      let source: Readable | undefined;
      return operation<SmtpResult>(finish => {
        source = Readable.from(raw);
        connection.send({ from: envelope.from, to: [...envelope.to] }, source, (error, result) => {
          finish(error ?? (!result ? new Error("SMTP_UNKNOWN") : undefined), result ? { accepted: result.accepted, rejected: result.rejected, response: result.response } : undefined as never);
        });
      }, () => source?.destroy());
    },
    close: () => { terminalError ??= new Error("SMTP_CLOSED"); activeReject?.(terminalError); closeConnection(); },
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
