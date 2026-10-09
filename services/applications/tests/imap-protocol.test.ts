import { afterEach, describe, expect, it, vi } from "vitest";
import { ImapFlow, type ImapFlowOptions } from "imapflow";
import { createHmac, createSecretKey } from "node:crypto";
import { Readable } from "node:stream";
import { createMailbox, createMailboxRunBudget } from "../src/imap";
import { fingerprintMime, MIME_LIMITS } from "../src/mail-manifest";
import { applicationId, type MailboxRunBudget, type RegisteredMail } from "../src/types";
import { imapServer, type ServerOptions, type TestFolder, type TestMessage } from "./helpers/imap-server";
const key = createSecretKey(Buffer.alloc(32, 7));
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
async function mailFixture() {
  const id = applicationId("11111111-1111-4111-8111-111111111111");
  const unsigned = Buffer.from(`From: info@trinkgut-jammers.de\r\nTo: info@trinkgut-jammers.de\r\nReply-To: test@example.invalid\r\nSubject: Synthetic\r\nDate: Fri, 09 Oct 2026 12:00:00 +0000\r\nMessage-ID: <imap-test@trinkgut-jammers.de>\r\nX-TJ-Application-ID: ${id}\r\nX-TJ-Profile: tj-mail-1\r\nX-TJ-Key-ID: test-key\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\nSGVsbG8=\r\n`);
  const fp = await fingerprintMime(Readable.from([unsigned]), MIME_LIMITS);
  const mail: RegisteredMail = { id, messageId: "<imap-test@trinkgut-jammers.de>", keyId: "test-key", profile: "tj-mail-1", fingerprint: fp.fingerprint, shape: fp.shape };
  const framed = ["tj-application-mail-signature-1", mail.profile, mail.keyId, mail.id, mail.messageId, mail.fingerprint].map(value => { const bytes = Buffer.from(value), length = Buffer.alloc(4); length.writeUInt32BE(bytes.length); return Buffer.concat([length, bytes]); });
  const signature = createHmac("sha256", key).update(Buffer.concat(framed)).digest("hex");
  const raw = Buffer.concat([Buffer.from(`X-TJ-Fingerprint: ${mail.fingerprint}\r\nX-TJ-Signature: ${signature}\r\n`), unsigned]);
  return { mail, raw };
}
function message(raw: Buffer, uid = 123): TestMessage { return { uid, raw, flags: new Set() }; }
const foreign = () => ({ uid: 999, raw: Buffer.from("Subject: foreign\r\n\r\nunrelated"), flags: new Set(["\\Deleted"]) });
async function setup(options: ServerOptions, budget?: MailboxRunBudget, timeout?: number, disconnectTimeout?: number) {
  const server = await imapServer(options); cleanups.push(() => server.close());
  let captured: ImapFlowOptions | undefined;
  const adapter = createMailbox({ user: "synthetic", pass: "synthetic", keys: new Map([["test-key", key]]), budget: budget ?? createMailboxRunBudget() }, { operationTimeoutMs: timeout, disconnectTimeoutMs: disconnectTimeout, createClient(config) { captured = config; return new ImapFlow({ ...config, host: "127.0.0.1", port: server.port, secure: false, doSTARTTLS: false, tls: undefined }); } });
  cleanups.push(() => adapter.disconnect());
  return { adapter, server, options: () => captured };
}
function safeCommands(commands: { verb: string; args: string }[]) { expect(commands.filter(c => ["EXPUNGE", "CLOSE", "UNSELECT"].includes(c.verb))).toEqual([]); expect(commands.filter(c => c.verb === "UID EXPUNGE").every(c => c.args === "123")).toBe(true); expect(commands.filter(c => c.verb === "UID STORE").every(c => c.args === "123 +FLAGS (\\Deleted)")).toBe(true); }
describe("bounded mailbox using real loopback IMAP", () => {
  it("verifies all selectable folders, PEEKs only eligible candidates and deletes exactly one fresh UID", async () => {
    const timers = vi.spyOn(globalThis, "setTimeout");
    const { mail, raw } = await mailFixture(), other = foreign();
    const folders = ["INBOX", "Sent", "Trash", "Archive"].map(path => ({ path, messages: [message(raw), { ...other, flags: new Set(other.flags) }] }));
    const { adapter, server, options } = await setup({ folders });
    const found = await adapter.findVerified(mail); expect(found.complete).toBe(true); expect(found.copies.map(c => c.mailbox).sort()).toEqual(["Archive", "INBOX", "Sent", "Trash"]);
    expect(folders.every(folder => folder.messages[0].flags.size === 0)).toBe(true);
    expect(await adapter.deleteVerified(found.copies[0], mail)).toEqual({ kind: "deleted" });
    await adapter.disconnect(); safeCommands(server.commands);
    expect(timers.mock.calls.some(call => call[1] === 60000)).toBe(true); expect(timers.mock.calls.some(call => call[1] === 10000)).toBe(true);
    expect(folders[0].messages.map(m => m.uid)).toEqual([999]);
    for (const folder of folders) expect(folder.messages.find(m => m.uid === 999)).toEqual(other);
    expect(server.commands.filter(c => c.verb === "UID FETCH").every(c => c.args.startsWith("123 ") && c.args.includes("BODY.PEEK"))).toBe(true);
    expect(server.commands.filter(c => c.verb === "UID SEARCH").every(c => c.args.includes("HEADER X-TJ-APPLICATION-ID") && !c.args.includes(" ALL"))).toBe(true);
    expect(options()).toMatchObject({ host: "imap.ionos.de", port: 993, secure: true, disableCompression: true, logger: false, logRaw: false, emitLogs: false, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, maxLineLength: 65536, maxLiteralSize: 262144, maxResponseSize: 524288, tls: { rejectUnauthorized: true, minVersion: "TLSv1.2", servername: "imap.ionos.de" } });
  });
  it.each([undefined, "untagged", "tagged"] as const)("never expunges foreign flags with absent/withdrawn UIDPLUS: %s", async withdrawal => {
    const { mail, raw } = await mailFixture(), other = foreign(), folder = { path: "INBOX", messages: [message(raw), other] };
    const { adapter, server } = await setup({ folders: [folder], uidplus: withdrawal ? true : false, withdrawal });
    const copy = (await adapter.findVerified(mail)).copies[0];
    expect(await adapter.deleteVerified(copy, mail)).toEqual(withdrawal ? { kind: "uncertain", issue: "DELETE_UNCERTAIN" } : { kind: "blocked", issue: "UNSAFE_DELETE_CAPABILITY" });
    expect(server.commands.filter(c => c.verb === "UID STORE")).toHaveLength(withdrawal ? 1 : 0);
    expect(folder.messages[0].flags).toEqual(new Set(withdrawal ? ["\\Deleted"] : []));
    expect(server.commands.filter(c => c.verb === "UID EXPUNGE")).toHaveLength(0); safeCommands(server.commands); expect(folder.messages).toContainEqual(other);
  });
  it("marks unreadable folders incomplete without downloading foreign bodies", async () => {
    const { mail, raw } = await mailFixture(); const { adapter, server } = await setup({ folders: [{ path: "INBOX", messages: [message(raw)] }, { path: "Trash", messages: [], denied: true }] });
    expect(await adapter.findVerified(mail)).toMatchObject({ complete: false, issues: ["FOLDER_UNAVAILABLE"] }); safeCommands(server.commands);
  });
  it.each(["header", "duplicate", "body", "uidvalidity", "missing", "readonly", "flags"])("revalidates before deletion: %s", async change => {
    const { mail, raw } = await mailFixture(), target = message(raw), folder: TestFolder = { path: "INBOX", messages: [target, foreign()] };
    const { adapter, server } = await setup({ folders: [folder] }); const copy = (await adapter.findVerified(mail)).copies[0];
    if (change === "header") target.raw = Buffer.from(raw.toString().replace("test-key", "wrong-key"));
    if (change === "duplicate") target.raw = Buffer.concat([Buffer.from(`X-TJ-Application-ID: ${mail.id}\r\n`), raw]);
    if (change === "body") target.raw = Buffer.from(raw.toString().replace("SGVsbG8=", "QnlldGU="));
    if (change === "uidvalidity") folder.uidValidity = "78";
    if (change === "missing") folder.messages = folder.messages.filter(m => m.uid !== 123);
    if (change === "readonly") folder.readOnly = true;
    if (change === "flags") folder.noFlags = true;
    const start = server.commands.length; expect((await adapter.deleteVerified(copy, mail)).kind).toBe(change === "missing" ? "not-found" : ["readonly", "flags"].includes(change) ? "blocked" : "mismatch");
    expect(server.commands.filter(c => c.verb === "UID STORE")).toHaveLength(0);
    if (["header", "duplicate"].includes(change)) expect(server.commands.slice(start).filter(c => c.verb === "UID FETCH" && c.args.includes("BODY.PEEK[]"))).toHaveLength(0);
    safeCommands(server.commands);
  });
  it("reserves one shared credit per validation across calls and new clients", async () => {
    const { mail, raw } = await mailFixture(), budget = createMailboxRunBudget();
    const { adapter } = await setup({ folders: [{ path: "INBOX", messages: [message(raw)] }] }, budget);
    for (let i = 0; i < 20; i++) expect((await adapter.findVerified(mail)).complete).toBe(true);
    await adapter.disconnect(); const next = await setup({ folders: [{ path: "INBOX", messages: [message(raw)] }] }, budget);
    expect(await next.adapter.findVerified(mail)).toMatchObject({ complete: false, issues: ["CANDIDATE_LIMIT"] });
    expect(next.server.commands.filter(c => c.verb === "UID FETCH")).toHaveLength(0);
  });
  it("rejects candidate and folder overflow before bodies", async () => {
    const { mail, raw } = await mailFixture();
    for (const folders of [[{ path: "INBOX", messages: Array.from({ length: 21 }, (_, i) => message(raw, i + 1)) }], Array.from({ length: 257 }, (_, i) => ({ path: i ? `Folder${i}` : "INBOX", messages: [message(raw)] }))]) {
      const { adapter, server } = await setup({ folders }); expect((await adapter.findVerified(mail)).complete).toBe(false); expect(server.commands.filter(c => c.verb === "UID FETCH")).toHaveLength(0);
    }
  });
  it("closes an active slow-drip operation at its absolute deadline", async () => {
    const { mail } = await mailFixture(); let interval: ReturnType<typeof setInterval> | undefined;
    const { adapter, server } = await setup({ folders: [], intercept(command, socket) { if (command.verb !== "LIST") return false; interval = setInterval(() => socket.write("* OK alive\r\n"), 5); socket.on("close", () => clearInterval(interval)); return true; } }, undefined, 75);
    const start = performance.now(); expect(await adapter.findVerified(mail)).toMatchObject({ complete: false, issues: ["OPERATION_TIMEOUT"] }); expect(performance.now() - start).toBeLessThan(1500); safeCommands(server.commands);
  });
  it.each(["line", "literal", "response"])("terminates a protocol %s cap violation without bodies or mutation", async mode => {
    const { mail, raw } = await mailFixture();
    const { adapter, server } = await setup({ folders: [{ path: "INBOX", messages: [message(raw), foreign()] }], intercept(c, socket) {
      if (c.verb !== "UID FETCH") return false;
      if (mode === "line") socket.write(`* OK ${"x".repeat(65536)}\r\n`);
      if (mode === "literal") socket.write("* 1 FETCH (UID 123 BODY[HEADER] {262145}\r\n");
      if (mode === "response") {
        socket.write("* 1 FETCH (UID 123 BODY[HEADER] {262000}\r\n"); socket.write(Buffer.alloc(262000, 65));
        socket.write(" BODY[1] {262000}\r\n"); socket.write(Buffer.alloc(262000, 65)); socket.write(" BODY[2] {1000}\r\n"); socket.write(Buffer.alloc(1000, 65)); socket.write(")\r\n");
      }
      return true;
    } });
    expect(await adapter.findVerified(mail)).toMatchObject({ complete: false, issues: ["PROTOCOL_LIMIT"] });
    expect(server.commands.filter(c => c.verb === "UID STORE")).toHaveLength(0); safeCommands(server.commands);
  });
  it.each(["search", "body", "store", "expunge"])("does not infer success after disconnect at %s", async phase => {
    const { mail, raw } = await mailFixture(), folder = { path: "INBOX", messages: [message(raw), foreign()] }; let armed = false;
    const { adapter, server } = await setup({ folders: [folder], intercept(c, socket) {
      const match = phase === "search" ? c.verb === "UID SEARCH" : phase === "body" ? c.verb === "UID FETCH" && c.args.includes("BODY.PEEK[]") : phase === "store" ? c.verb === "UID STORE" : c.verb === "UID EXPUNGE";
      if (!armed || !match) return false; socket.destroy(); return true;
    } });
    const copy = (await adapter.findVerified(mail)).copies[0]; armed = true;
    if (phase === "search" || phase === "body") expect((await adapter.findVerified(mail)).complete).toBe(false);
    else expect(await adapter.deleteVerified(copy, mail)).toEqual({ kind: "uncertain", issue: "DELETE_UNCERTAIN" });
    expect(folder.messages).toContainEqual(foreign()); safeCommands(server.commands);
  });
  it.each(["duplicate-signature", "partial-header", "wrong-id", "no-signature"])("rejects ineligible %s before full raw content", async change => {
    const { mail, raw } = await mailFixture(); let changed = raw;
    if (change === "duplicate-signature") changed = Buffer.concat([Buffer.from(`X-TJ-Signature: ${"a".repeat(64)}\r\n`), raw]);
    if (change === "partial-header") changed = Buffer.concat([Buffer.from(`Received: ${"x".repeat(16384)}\r\n`), raw]);
    if (change === "wrong-id") changed = Buffer.from(raw.toString().replace(`X-TJ-Application-ID: ${mail.id}`, `X-TJ-Application-ID: ${mail.id}-copied`));
    if (change === "no-signature") changed = Buffer.from(raw.toString().replace(/X-TJ-Signature:[^\r]+\r\n/, ""));
    const { adapter, server } = await setup({ folders: [{ path: "INBOX", messages: [message(changed), foreign()] }] });
    const result = await adapter.findVerified(mail); expect(result.complete).toBe(false); expect(result.copies).toHaveLength(0);
    expect(server.commands.filter(c => c.verb === "UID FETCH" && c.args.includes("BODY.PEEK[]"))).toHaveLength(0); safeCommands(server.commands);
  });
  it("accepts the exact 16 MiB raw boundary only after an extra EOF probe; rejects a lying oversized stream", async () => {
    const { mail, raw } = await mailFixture();
    const exact = Buffer.concat([raw, Buffer.alloc(16777216 - raw.length, 10)]);
    const first = await setup({ folders: [{ path: "INBOX", messages: [message(exact)] }] });
    expect(await first.adapter.findVerified(mail)).toMatchObject({ complete: true, copies: [{ uid: 123 }] });
    expect(first.server.commands.some(c => c.args.includes("BODY.PEEK[]<16777216.1>"))).toBe(true);
    const over = Buffer.concat([exact, Buffer.from("\n")]);
    const second = await setup({ folders: [{ path: "INBOX", messages: [message(over)] }], intercept(c, socket) {
      if (c.verb !== "UID FETCH" || !c.args.includes("BODY.PEEK[HEADER]")) return false;
      const header = raw.subarray(0, raw.indexOf("\r\n\r\n") + 4);
      socket.write(`* 1 FETCH (UID 123 RFC822.SIZE 16777216 BODY[HEADER]<0> {${header.length}}\r\n`); socket.write(header); socket.write(`)\r\n${c.tag} OK complete\r\n`); return true;
    } });
    expect(await second.adapter.findVerified(mail)).toMatchObject({ complete: false, copies: [], issues: ["INCOMPLETE_CONTENT"] });
    expect(second.server.commands.filter(c => c.args.includes("BODY.PEEK[]<16777216.1>"))).toHaveLength(1);
  }, 15000);
  it("rejects a missing body response and size-lied truncated stream", async () => {
    const { mail, raw } = await mailFixture();
    for (const missing of [true, false]) {
      const { adapter } = await setup({ folders: [{ path: "INBOX", messages: [message(raw)] }], intercept(c, socket) {
        if (c.verb !== "UID FETCH" || !c.args.includes("BODY.PEEK[]")) return false;
        if (!missing) { const short = raw.subarray(0, raw.length - 3); socket.write(`* 1 FETCH (UID 123 BODY[]<0> {${short.length}}\r\n`); socket.write(short); socket.write(")\r\n"); }
        socket.write(`${c.tag} OK complete\r\n`); return true;
      } });
      expect(await adapter.findVerified(mail)).toMatchObject({ complete: false, copies: [], issues: ["INCOMPLETE_CONTENT"] });
    }
  });
  it("serializes concurrent discovery/delete and consumes revalidation credits", async () => {
    const { mail, raw } = await mailFixture(), budget = createMailboxRunBudget();
    const { adapter, server } = await setup({ folders: [{ path: "INBOX", messages: [message(raw), foreign()] }] }, budget);
    const copies = await Promise.all(Array.from({ length: 19 }, () => adapter.findVerified(mail)));
    expect(copies.every(result => result.complete && result.copies.length === 1)).toBe(true);
    expect(await adapter.deleteVerified(copies[0].copies[0], mail)).toEqual({ kind: "deleted" });
    expect(await adapter.deleteVerified(copies[0].copies[0], mail)).toEqual({ kind: "blocked", issue: "CANDIDATE_LIMIT" }); safeCommands(server.commands);
  });
  it("requires registered identities, an authentic runner budget and test-only bounded constructor overrides", async () => {
    const { mail } = await mailFixture(); const { adapter, server } = await setup({ folders: [] });
    expect(await adapter.findVerified({ ...mail, messageId: "" })).toEqual({ copies: [], complete: false, issues: ["INVALID_IDENTITY"] }); expect(server.commands).toHaveLength(0);
    const config = { user: "test", pass: "test", keys: new Map(), budget: {} as MailboxRunBudget };
    expect(() => createMailbox(config)).toThrow("INVALID_IMAP_RUN_BUDGET"); config.budget = createMailboxRunBudget();
    const dependencies = { operationTimeoutMs: 60001, createClient: (options: ImapFlowOptions) => new ImapFlow(options) };
    expect(() => createMailbox(config, dependencies)).toThrow("INVALID_IMAP_TEST_LIMIT");
    vi.stubEnv("NODE_ENV", "production"); expect(() => createMailbox(config, dependencies)).toThrow("IMAP_TEST_ONLY");
  });
  it("uses the complete namespace LIST path including INBOX fixup, not subscribed-only scope", async () => {
    const { mail, raw } = await mailFixture();
    const { adapter, server } = await setup({ namespacePrefix: "INBOX.", folders: [{ path: "INBOX", messages: [message(raw)] }, { path: "INBOX.Archive", messages: [message(raw)] }, { path: "INBOX.Container", messages: [], noSelect: true }] });
    const result = await adapter.findVerified(mail); expect(result.complete).toBe(true); expect(result.copies.map(copy => copy.mailbox).sort()).toEqual(["INBOX", "INBOX.Archive"]);
    expect(server.commands.some(c => c.verb === "LIST" && /INBOX"?$/.test(c.args))).toBe(true);
    expect(server.commands.filter(c => c.verb === "EXAMINE").some(c => c.args.includes("Container"))).toBe(false); safeCommands(server.commands);
  });
  it.each(["missing", "0"])("rejects missing/nonpositive UIDVALIDITY %s before any candidate access", async validity => {
    const { mail, raw } = await mailFixture();
    const { adapter, server } = await setup({ folders: [{ path: "INBOX", uidValidity: validity, messages: [message(raw)] }] });
    expect(await adapter.findVerified(mail)).toMatchObject({ complete: false, copies: [] }); expect(server.commands.filter(c => c.verb === "UID FETCH")).toHaveLength(0);
  });
  it("bounds unresponsive LOGOUT and never uses CLOSE as a fallback", async () => {
    const { mail, raw } = await mailFixture(); const other = foreign(), folder = { path: "INBOX", messages: [message(raw), other] };
    const { adapter, server } = await setup({ folders: [folder], intercept: c => c.verb === "LOGOUT" }, undefined, undefined, 50);
    expect((await adapter.findVerified(mail)).complete).toBe(true); const start = performance.now(); await adapter.disconnect();
    expect(performance.now() - start).toBeLessThan(1000); expect(folder.messages).toContainEqual(other); safeCommands(server.commands);
  });
  it("settles active and queued work when disconnected without issuing more commands", async () => {
    const { mail, raw } = await mailFixture(); let searching!: () => void; const seen = new Promise<void>(resolve => { searching = resolve; });
    const { adapter, server } = await setup({ folders: [{ path: "INBOX", messages: [message(raw)] }], intercept(c) { if (c.verb !== "UID SEARCH") return false; searching(); return true; } });
    const pending = adapter.findVerified(mail), queued = adapter.findVerified(mail); await seen; await adapter.disconnect();
    expect((await pending).complete).toBe(false); expect((await queued).complete).toBe(false); expect(server.commands.filter(c => c.verb === "UID SEARCH")).toHaveLength(1); safeCommands(server.commands);
  });
  it("keeps a STORE timeout uncertain and never clears the target or unrelated flags", async () => {
    const { mail, raw } = await mailFixture(), target = message(raw), other = foreign(), folder = { path: "INBOX", messages: [target, other] };
    const { adapter, server } = await setup({ folders: [folder], intercept(c, socket) {
      if (c.verb !== "UID STORE") return false;
      target.flags.add("\\Deleted"); const timer = setInterval(() => socket.write("* OK alive\r\n"), 5); socket.on("close", () => clearInterval(timer)); return true;
    } }, undefined, 100);
    const copy = (await adapter.findVerified(mail)).copies[0];
    expect(await adapter.deleteVerified(copy, mail)).toEqual({ kind: "uncertain", issue: "DELETE_UNCERTAIN" });
    expect(target.flags).toEqual(new Set(["\\Deleted"])); expect(folder.messages).toContainEqual(other); safeCommands(server.commands);
  });
  it.each(["", "UIDVALIDITY 77"])("requires explicit tagged READ-WRITE, not a different SELECT response code: %s", async selectCode => {
    const { mail, raw } = await mailFixture(); const folder = { path: "INBOX", messages: [message(raw), foreign()], selectCode };
    const { adapter, server } = await setup({ folders: [folder] }); const copy = (await adapter.findVerified(mail)).copies[0];
    expect(await adapter.deleteVerified(copy, mail)).toEqual({ kind: "blocked", issue: "WRITE_UNAVAILABLE" });
    expect(server.commands.filter(c => c.verb === "UID STORE")).toHaveLength(0); expect(folder.messages).toContainEqual(foreign()); safeCommands(server.commands);
  });
});
