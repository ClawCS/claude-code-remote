import { ImapFlow, type ImapFlowOptions, type ResponseEvent } from "imapflow";
import { assertImapDependency } from "./imap-dependency";
import { verifyMail } from "./mail-manifest";
import { applicationId, digest, type DeleteResult, type ImapConfig, type MailboxIssue, type MailboxPort, type MailboxRunBudget, type MailboxSearch, type RegisteredMail, type VerifiedCopy } from "./types";
export interface ImapTestDependencies { createClient(options: ImapFlowOptions): ImapFlow; operationTimeoutMs?: number; disconnectTimeoutMs?: number }
const budgets = new WeakMap<MailboxRunBudget, { remaining: number }>();
const RAW_LIMIT = 16777216, CHUNK = 65536, HEADER_LIMIT = 16384;
export function createMailboxRunBudget(): MailboxRunBudget {
  const budget = Object.freeze({}) as MailboxRunBudget; budgets.set(budget, { remaining: 20 }); return budget;
}
class Failure extends Error { constructor(readonly issue: MailboxIssue) { super(issue); } }
function issueOf(error: unknown): MailboxIssue {
  if (error instanceof Failure) return error.issue;
  if (error instanceof Error && error.message === "IMAP_DEPENDENCY_UNAVAILABLE") return "DEPENDENCY_UNAVAILABLE";
  if (error && typeof error === "object" && "code" in error && ["LineTooLarge", "LiteralTooLarge", "ResponseTooLarge"].includes(String(error.code))) return "PROTOCOL_LIMIT";
  return "CONNECTION_FAILED";
}
function uidValid(uid: number): boolean { return Number.isSafeInteger(uid) && uid > 0 && uid <= 4294967295; }
function pathValid(path: string): boolean { return typeof path === "string" && path.length > 0 && path.length <= 4096 && !/[\u0000-\u001f\u007f]/.test(path); }
function registered(mail: RegisteredMail): RegisteredMail {
  try {
    applicationId(mail.id); digest(mail.fingerprint);
    if (!/^<[A-Za-z0-9._-]{1,120}@trinkgut-jammers\.de>$/.test(mail.messageId) || !/^[A-Za-z0-9_-]{1,64}$/.test(mail.keyId) || mail.profile !== "tj-mail-1") throw new Error();
    return structuredClone(mail);
  } catch { throw new Failure("INVALID_IDENTITY"); }
}
function eligible(headers: Buffer, mail: RegisteredMail): boolean {
  const end = headers.indexOf("\r\n\r\n");
  if (end < 0 || end + 4 > HEADER_LIMIT || headers.length > HEADER_LIMIT + 1) throw new Failure("INCOMPLETE_CONTENT");
  const text = headers.subarray(0, end).toString("latin1");
  if (/[^\x09\x20-\x7e\r\n]/.test(text)) return false;
  const fields = new Map<string, string[]>();
  for (const line of text.replace(/\r\n(?=[ \t])/g, "").split("\r\n")) {
    const match = /^([A-Za-z0-9-]+): ?([^\r\n]*)$/.exec(line); if (!match) return false;
    const key = match[1].toLowerCase(); fields.set(key, [...(fields.get(key) ?? []), match[2]]);
  }
  const required: Record<string, string> = { "x-tj-application-id": mail.id, "message-id": mail.messageId, "x-tj-profile": mail.profile, "x-tj-key-id": mail.keyId, "x-tj-fingerprint": mail.fingerprint };
  return Object.entries(required).every(([name, value]) => fields.get(name)?.length === 1 && fields.get(name)?.[0] === value) && fields.get("x-tj-signature")?.length === 1 && /^[a-f0-9]{64}$/.test(fields.get("x-tj-signature")![0]);
}
function testDeadline(value: number | undefined, maximum: number): number {
  if (value === undefined) return maximum;
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) throw new Error("INVALID_IMAP_TEST_LIMIT");
  return value;
}
export function createMailbox(config: ImapConfig, test?: ImapTestDependencies): MailboxPort {
  if (test && process.env.NODE_ENV !== "test") throw new Error("IMAP_TEST_ONLY");
  const budget = budgets.get(config.budget); if (!budget) throw new Error("INVALID_IMAP_RUN_BUDGET");
  const keys = new Map(config.keys), user = config.user, pass = config.pass;
  const deadline = testDeadline(test?.operationTimeoutMs, 60000), disconnectDeadline = testDeadline(test?.disconnectTimeoutMs, 10000);
  let client: ImapFlow | undefined, connected = false, closed = false, fatal: MailboxIssue | undefined;
  let selectedWrite = false;
  let tail: Promise<void> = Promise.resolve(), rejectActive: ((error: Failure) => void) | undefined;
  const owners = new Set<Promise<void>>(); let children: Promise<void>[] | undefined;
  let disconnectWork: Promise<void> | undefined;
  function observe(work: Promise<unknown>): Promise<void> {
    const owned = work.then(() => {}, () => {}); owners.add(owned);
    void owned.then(() => { owners.delete(owned); }); return owned;
  }
  function fail(issue: MailboxIssue) { fatal ??= issue; rejectActive?.(new Failure(fatal)); client?.close(); }
  function healthy() { if (fatal || closed) throw new Failure(fatal ?? "CONNECTION_FAILED"); }
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const actual: Promise<void>[] = [];
    const next = tail.then(() => { children = actual; return action(); });
    tail = next.then(() => {}, () => {});
    observe(tail.then(async () => { await Promise.all(actual); }));
    return next;
  }
  async function operation<T>(action: () => Promise<T>): Promise<T> {
    healthy(); assertImapDependency();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const aborted = new Promise<never>((_resolve, reject) => { rejectActive = reject; timer = setTimeout(() => fail("OPERATION_TIMEOUT"), deadline); });
    try {
      const underlying = action(); children?.push(underlying.then(() => {}, () => {}));
      return await Promise.race([underlying, aborted]);
    }
    finally { clearTimeout(timer); rejectActive = undefined; }
  }
  async function connect() {
    healthy(); if (connected) return;
    const options: ImapFlowOptions = { host: "imap.ionos.de", port: 993, secure: true, servername: "imap.ionos.de", tls: { rejectUnauthorized: true, minVersion: "TLSv1.2", servername: "imap.ionos.de" }, auth: { user, pass }, disableCompression: true, disableAutoIdle: true, disableBinary: true, disableAutoEnable: true, disableIMAP4rev2: true, logger: false, logRaw: false, emitLogs: false, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, maxLineLength: 65536, maxLiteralSize: 262144, maxResponseSize: 524288 };
    client = test ? test.createClient(options) : new ImapFlow(options);
    client.on("error", error => fail(issueOf(error)));
    client.on("close", () => { if (!closed) fail("CONNECTION_FAILED"); });
    await client.connect(); healthy(); connected = true;
  }
  function selected(path: string, validity?: string): string {
    healthy(); const box = client?.mailbox;
    if (!box || box.path !== path || typeof box.uidValidity !== "bigint" || box.uidValidity <= BigInt(0) || box.uidValidity > BigInt(4294967295)) throw new Failure("IDENTITY_CHANGED");
    const value = box.uidValidity.toString(); if (validity !== undefined && value !== validity) throw new Failure("UIDVALIDITY_CHANGED"); return value;
  }
  async function select(path: string, write = false, validity?: string): Promise<string> {
    healthy(); if (!pathValid(path)) throw new Failure("INVALID_IDENTITY");
    selectedWrite = false;
    // The installed readOnly boolean treats any non-READ-ONLY response code as false.
    // With serialized operations and auto-IDLE disabled, the final tagged response
    // inside successful mailboxOpen is SELECT/EXAMINE, even after its metadata LIST.
    let taggedWrite = false;
    const response = (event: ResponseEvent) => { taggedWrite = event.response === "OK" && event.code === "READ-WRITE"; };
    client!.on("response", response);
    try { const box = await client!.mailboxOpen(path, { readOnly: !write }); if (!box || box.path !== path) throw new Error(); selectedWrite = write && taggedWrite; }
    catch { healthy(); throw new Failure("FOLDER_UNAVAILABLE"); }
    finally { client!.off("response", response); }
    return selected(path, validity);
  }
  async function validate(copy: VerifiedCopy, mail: RegisteredMail, write: boolean): Promise<"verified" | "missing" | "mismatch"> {
    if (budget!.remaining <= 0) throw new Failure("CANDIDATE_LIMIT"); budget!.remaining--;
    await select(copy.mailbox, write, copy.uidValidity);
    const row = await client!.fetchOne(String(copy.uid), { uid: true, size: true, bodyParts: [{ key: "HEADER", start: 0, maxLength: HEADER_LIMIT + 1 }] }, { uid: true, binary: false });
    selected(copy.mailbox, copy.uidValidity);
    if (!row) return "missing";
    if (row.uid !== copy.uid || !Buffer.isBuffer(row.headers) || !Number.isSafeInteger(row.size) || row.size! <= 0 || row.size! > RAW_LIMIT) throw new Failure("INCOMPLETE_CONTENT");
    if (!eligible(row.headers, mail)) return "mismatch";
    const expectedSize = row.size;
    let complete = false, streamFailure: unknown;
    const owner = client!;
    async function* source() {
      let total = 0;
      try {
        for (;;) {
          selected(copy.mailbox, copy.uidValidity);
          const length = Math.min(CHUNK, RAW_LIMIT + 1 - total);
          const part = await owner.fetchOne(String(copy.uid), { uid: true, source: { start: total, maxLength: length } }, { uid: true, binary: false });
          selected(copy.mailbox, copy.uidValidity);
          if (!part || part.uid !== copy.uid || !Buffer.isBuffer(part.source) || part.source.length > length) throw new Failure("INCOMPLETE_CONTENT");
          total += part.source.length;
          if (total > RAW_LIMIT) throw new Failure("INCOMPLETE_CONTENT");
          yield part.source;
          if (part.source.length < length) { if (total !== expectedSize) throw new Failure("INCOMPLETE_CONTENT"); complete = true; return; }
        }
      } catch (error) { streamFailure = error; throw error; }
    }
    const result = await verifyMail(source(), mail, keys);
    if (streamFailure) throw streamFailure;
    if (!complete) throw new Failure("INCOMPLETE_CONTENT");
    selected(copy.mailbox, copy.uidValidity);
    return result.kind;
  }
  return {
    findVerified(input) { return serial(async () => {
      const result: MailboxSearch = { copies: [], complete: true, issues: [] };
      const issue = (code: MailboxIssue) => { result.complete = false; if (!result.issues.includes(code)) result.issues.push(code); };
      try { const mail = registered(input); await operation(async () => {
        await connect(); const folders = await client!.list(); healthy();
        if (!Array.isArray(folders) || !folders.length) throw new Failure("FOLDER_UNAVAILABLE");
        if (folders.length > 256) throw new Failure("LIST_LIMIT");
        const candidates: VerifiedCopy[] = [];
        for (const folder of folders) {
          if (!(folder.flags instanceof Set) || !pathValid(folder.path)) { issue("FOLDER_UNAVAILABLE"); continue; }
          if (folder.flags.has("\\Noselect")) continue;
          try {
            const validity = await select(folder.path);
            const uids = await client!.search({ header: { "X-TJ-Application-ID": mail.id, "Message-ID": mail.messageId } }, { uid: true }); selected(folder.path, validity);
            if (!Array.isArray(uids) || uids.some(uid => !uidValid(uid)) || new Set(uids).size !== uids.length) throw new Failure("INCOMPLETE_CONTENT");
            if (candidates.length + uids.length > budget!.remaining) throw new Failure("CANDIDATE_LIMIT");
            for (const uid of uids) candidates.push({ mailbox: folder.path, uidValidity: validity, uid, fingerprint: mail.fingerprint });
          } catch (error) { const code = fatal ?? issueOf(error); if (code === "CANDIDATE_LIMIT" || fatal) throw new Failure(code); issue(code); }
        }
        for (const copy of candidates) {
          try { const verdict = await validate(copy, mail, false); if (verdict === "verified") result.copies.push(copy); else issue(verdict === "missing" ? "INCOMPLETE_CONTENT" : "CONTENT_MISMATCH"); }
          catch (error) { issue(fatal ?? issueOf(error)); if (fatal) throw error; }
        }
      }); } catch (error) { issue(fatal ?? issueOf(error)); }
      return result;
    }); },
    deleteVerified(copyInput, input) { return serial(async (): Promise<DeleteResult> => {
      let mutation = false;
      try {
        const mail = registered(input), copy = { ...copyInput };
        if (!uidValid(copy.uid) || !pathValid(copy.mailbox) || !/^[1-9][0-9]{0,9}$/.test(copy.uidValidity) || copy.fingerprint !== mail.fingerprint) return { kind: "mismatch", issue: "INVALID_IDENTITY" };
        return await operation(async (): Promise<DeleteResult> => {
          await connect();
          if (!client!.capabilities.has("UIDPLUS")) return { kind: "blocked", issue: "UNSAFE_DELETE_CAPABILITY" };
          const verdict = await validate(copy, mail, true);
          if (verdict === "missing") return { kind: "not-found" };
          if (verdict === "mismatch") return { kind: "mismatch", issue: "CONTENT_MISMATCH" };
          selected(copy.mailbox, copy.uidValidity);
          const box = client!.mailbox;
          if (!selectedWrite || !box || box.readOnly !== false || !(box.permanentFlags?.has("\\Deleted") || box.permanentFlags?.has("\\*"))) return { kind: "blocked", issue: "WRITE_UNAVAILABLE" };
          if (!client!.capabilities.has("UIDPLUS")) return { kind: "blocked", issue: "UNSAFE_DELETE_CAPABILITY" };
          assertImapDependency(); selected(copy.mailbox, copy.uidValidity);
          mutation = true;
          const deleted = await client!.messageDelete(String(copy.uid), { uid: true });
          selected(copy.mailbox, copy.uidValidity);
          return deleted === true ? { kind: "deleted" } : { kind: "uncertain", issue: "DELETE_UNCERTAIN" };
        });
      } catch (error) {
        if (mutation) return { kind: "uncertain", issue: "DELETE_UNCERTAIN" };
        const issue = fatal ?? issueOf(error);
        return { kind: ["UIDVALIDITY_CHANGED", "IDENTITY_CHANGED", "INVALID_IDENTITY"].includes(issue) ? "mismatch" : "blocked", issue };
      }
    }); },
    async disconnect() {
      if (closed) return; closed = true;
      if (rejectActive) { rejectActive(new Failure("CONNECTION_FAILED")); client?.close(); }
      disconnectWork = observe((async () => { await tail; if (client) await client.logout().catch(() => {}); })());
      let timer: ReturnType<typeof setTimeout> | undefined;
      try { await Promise.race([disconnectWork, new Promise<void>(resolve => { timer = setTimeout(() => { client?.close(); resolve(); }, disconnectDeadline); })]); }
      finally { clearTimeout(timer); client?.close(); }
    },
    settle() { return Promise.all([...owners]).then(() => {}); },
  };
}
