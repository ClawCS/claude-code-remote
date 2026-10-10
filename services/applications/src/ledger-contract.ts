import { createHash, KeyObject, verify } from "node:crypto";
import { applicationId } from "./types";
import type { DurableReceipt, JournalCheckpoint, JournalEvent, LedgerAnchor, LedgerCursor, LedgerTrustContext, SignedEntry, SignedHead, VerifiedJournalEntry } from "./types";

const LIMIT = { event: 2048, entry: 4096, head: 1024, receipt: 6144, cursor: 512 } as const;
const id = /^[a-f0-9]{32}$/, digest = /^[a-f0-9]{64}$/;
function invalid(): never { throw new Error("JOURNAL_INVALID"); }
function requireValue(condition: unknown): asserts condition { if (!condition) invalid(); }
function tuple(value: unknown, length: number): unknown[] { requireValue(Array.isArray(value) && value.length === length); return value; }
function matches(value: unknown, pattern: RegExp): asserts value is string { requireValue(typeof value === "string" && pattern.test(value)); }
function sequence(value: unknown, genesis = false): asserts value is string {
  matches(value, genesis ? /^(0|[1-9][0-9]{0,19})$/ : /^[1-9][0-9]{0,19}$/);
  requireValue(BigInt(value) <= BigInt("18446744073709551615"));
}
function instant(value: unknown): asserts value is string {
  matches(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  requireValue(Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value);
}
function canonical(value: unknown, limit: number): string {
  const wire = JSON.stringify(value);
  requireValue(typeof wire === "string" && Buffer.byteLength(wire, "utf8") <= limit);
  return wire;
}
function parse(wire: unknown, limit: number): unknown {
  requireValue(typeof wire === "string" && Buffer.byteLength(wire, "utf8") <= limit);
  // Reject structural depth before JSON parsing; every accepted scalar is ASCII.
  let depth = 0, quoted = false, escaped = false;
  for (const char of wire) {
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && quoted) { escaped = true; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && (char === "[" || char === "{")) requireValue(++depth <= 4);
    if (!quoted && (char === "]" || char === "}")) depth--;
  }
  let value: unknown;
  try { value = JSON.parse(wire); } catch { invalid(); }
  requireValue(canonical(value, limit) === wire);
  return value;
}
function eventTuple(value: unknown): JournalEvent {
  const e = tuple(value, 5); requireValue(e[0] === "tj-journal-event-v1"); matches(e[1], id); instant(e[2]);
  if (e[3] === "case_fence") {
    const body = tuple(e[4], 5); requireValue(typeof body[0] === "string"); applicationId(body[0]);
    requireValue(body[1] === "initial" || body[1] === "fence"); matches(body[2], id); sequence(body[3]);
    requireValue(BigInt(body[3]) <= BigInt(Number.MAX_SAFE_INTEGER));
    requireValue(["reject", "correct-date", "reopen", "hold", "renew-hold", "release-hold", "manual-case"].includes(body[4] as string));
  } else if (e[3] === "barrier") {
    const body = tuple(e[4], 3); matches(body[0], digest); matches(body[1], digest);
    requireValue(["startup", "restore", "refresh"].includes(body[2] as string));
  } else if (e[3] === "attempt_intent") {
    const body = tuple(e[4], 8); requireValue(typeof body[0] === "string"); applicationId(body[0]);
    matches(body[1], id); requireValue(body[2] === "initial" || body[2] === "fence"); matches(body[3], id);
    sequence(body[4]); requireValue(BigInt(body[4]) <= BigInt(Number.MAX_SAFE_INTEGER));
    matches(body[5], id); matches(body[6], /^[a-z0-9-]{1,32}$/); matches(body[7], digest);
  } else if (e[3] === "copy_mutation_started" || e[3] === "mailbox_clear_observed") {
    const body = tuple(e[4], e[3] === "copy_mutation_started" ? 4 : 6);
    requireValue(typeof body[0] === "string"); applicationId(body[0]); matches(body[1], id);
    requireValue(body[2] === "1" || body[2] === "2" || body[2] === "3");
    if (e[3] === "copy_mutation_started") matches(body[3], digest);
    else {
      instant(body[3]); instant(body[4]);
      requireValue(body[3] <= body[4] && body[4] <= e[2] && body[5] === "listed-selectable-v1");
    }
  } else if (e[3] === "copy_result") {
    const body = tuple(e[4], 4); requireValue(typeof body[0] === "string"); applicationId(body[0]); matches(body[1], id);
    if (body[2] === "deleted" || body[2] === "not-found") requireValue(body[3] === null);
    else if (body[2] === "mismatch") requireValue(["INVALID_IDENTITY", "CONTENT_MISMATCH", "UIDVALIDITY_CHANGED", "IDENTITY_CHANGED"].includes(body[3] as string));
    else if (body[2] === "blocked") requireValue(["DEPENDENCY_UNAVAILABLE", "CONNECTION_FAILED", "OPERATION_TIMEOUT", "PROTOCOL_LIMIT", "FOLDER_UNAVAILABLE", "CANDIDATE_LIMIT", "INCOMPLETE_CONTENT", "UNSAFE_DELETE_CAPABILITY", "WRITE_UNAVAILABLE"].includes(body[3] as string));
    else if (body[2] === "uncertain") requireValue(body[3] === "DELETE_UNCERTAIN");
    else invalid();
  } else if (e[3] === "erase_commit") {
    requireValue(Array.isArray(e[4]));
    const body = tuple(e[4], e[4][1] === "identifying_register" ? 9 : 4);
    requireValue(typeof body[0] === "string"); applicationId(body[0]);
    matches(body[2], /^[a-z0-9-]{1,32}$/); matches(body[3], digest);
    if (body[1] === "identifying_register") {
      requireValue(body[4] === "initial" || body[4] === "fence"); matches(body[5], id);
      sequence(body[6]); requireValue(BigInt(body[6]) <= BigInt(Number.MAX_SAFE_INTEGER));
      matches(body[7], id); matches(body[8], digest);
    } else requireValue(["processing_payload", "processing_contact", "incident_identity", "public_token"].includes(body[1] as string));
  } else if (e[3] === "erase_done") {
    const body = tuple(e[4], 2); requireValue(typeof body[0] === "string"); applicationId(body[0]); matches(body[1], id);
  } else invalid();
  const payload = Object.freeze([...(e[4] as unknown[])]);
  return Object.freeze([e[0], e[1], e[2], e[3], payload]) as unknown as JournalEvent;
}
export function encodeJournalEvent(event: JournalEvent): string { return canonical(eventTuple(event), LIMIT.event); }
export function decodeJournalEvent(wire: string): JournalEvent { return eventTuple(parse(wire, LIMIT.event)); }
function hash(domain: string, body: unknown): string { return createHash("sha256").update(domain + "\n").update(JSON.stringify(body)).digest("hex"); }
export function journalEventDigest(event: JournalEvent): string { return hash("tj-journal-event-hash-v1", decodeJournalEvent(encodeJournalEvent(event))); }
export function validateJournalTrust(context: LedgerTrustContext): void {
  requireValue(context !== null && typeof context === "object");
  matches(context.ledgerId, id); matches(context.historyEpoch, id); matches(context.writerEpoch, id); matches(context.genesisHash, digest);
  matches(context.keyId, /^[a-z0-9-]{1,32}$/); instant(context.operationalStart); instant(context.operationalEnd);
  requireValue(context.operationalStart <= context.operationalEnd);
  requireValue(context.publicKey instanceof KeyObject && context.publicKey.type === "public" && context.publicKey.asymmetricKeyType === "ed25519");
}
function observed(value: unknown, context: LedgerTrustContext): asserts value is string {
  instant(value); requireValue(value >= context.operationalStart && value <= context.operationalEnd);
}
function signed(wire: unknown, kind: "entry" | "head", context: LedgerTrustContext): { body: unknown[]; hash: string } {
  validateJournalTrust(context);
  const envelope = tuple(parse(wire, LIMIT[kind]), 2), body = tuple(envelope[0], kind === "entry" ? 8 : 9);
  requireValue(body[0] === `tj-journal-${kind}-v1` && body[1] === context.ledgerId && body[2] === context.historyEpoch && body[3] === context.writerEpoch);
  sequence(body[4]); matches(body[5], digest);
  requireValue(body[kind === "entry" ? 6 : 8] === context.keyId);
  if (kind === "entry") {
    const event = eventTuple(body[7]); encodeJournalEvent(event); observed(event[2], context);
    if (event[3] === "mailbox_clear_observed") { observed(event[4][3], context); observed(event[4][4], context); }
    body[7] = event;
  }
  else { matches(body[6], id); observed(body[7], context); }
  matches(envelope[1], /^[A-Za-z0-9_-]{86}$/);
  const signature = Buffer.from(envelope[1], "base64url");
  requireValue(signature.length === 64 && signature.toString("base64url") === envelope[1]);
  const valueHash = hash(`tj-journal-${kind}-hash-v1`, body);
  requireValue(verify(null, Buffer.concat([Buffer.from(`tj-journal-${kind}-sign-v1\n`), Buffer.from(valueHash, "hex")]), context.publicKey, signature));
  return { body, hash: valueHash };
}
export function encodeJournalCursor(context: LedgerTrustContext, seq: string, entryHash: string): LedgerCursor {
  validateJournalTrust(context); sequence(seq, true); matches(entryHash, digest);
  return canonical(["tj-journal-cursor-v1", context.ledgerId, context.historyEpoch, seq, entryHash], LIMIT.cursor) as LedgerCursor;
}
export function verifyJournalEntry(wire: SignedEntry, context: LedgerTrustContext): VerifiedJournalEntry {
  const { body, hash: entryHash } = signed(wire, "entry", context), event = body[7] as JournalEvent;
  const seq = body[4] as string;
  return Object.freeze({ sequence: seq, hash: entryHash, event, observedAt: event[2], cursor: encodeJournalCursor(context, seq, entryHash), wire });
}
export function verifyJournalHead(wire: SignedHead, context: LedgerTrustContext) {
  const { body } = signed(wire, "head", context);
  return Object.freeze({ sequence: body[4] as string, hash: body[5] as string, eventId: body[6] as string, observedAt: body[7] as string });
}
export function verifyJournalReceipt(expected: JournalEvent, receipt: DurableReceipt, context: LedgerTrustContext): VerifiedJournalEntry {
  requireValue(receipt !== null && typeof receipt === "object" && Object.keys(receipt).sort().join(",") === "entry,head");
  requireValue(typeof receipt.entry === "string" && typeof receipt.head === "string");
  requireValue(Buffer.byteLength(receipt.entry, "utf8") <= LIMIT.entry && Buffer.byteLength(receipt.head, "utf8") <= LIMIT.head);
  canonical([receipt.entry, receipt.head], LIMIT.receipt);
  const entry = verifyJournalEntry(receipt.entry, context), head = verifyJournalHead(receipt.head, context);
  requireValue(encodeJournalEvent(expected) === encodeJournalEvent(entry.event));
  requireValue(head.sequence === entry.sequence && head.hash === entry.hash && head.eventId === entry.event[1] && head.observedAt === entry.observedAt);
  return entry;
}
export function verifyJournalCheckpoint(anchor: LedgerAnchor, context: LedgerTrustContext): JournalCheckpoint {
  validateJournalTrust(context);
  const c = tuple(parse(anchor.cursor, LIMIT.cursor), 5);
  requireValue(c[0] === "tj-journal-cursor-v1" && c[1] === context.ledgerId && c[2] === context.historyEpoch); sequence(c[3], true); matches(c[4], digest);
  if (c[3] === "0") {
    requireValue(anchor.receipt === null && c[4] === context.genesisHash);
    return Object.freeze({ sequence: "0", hash: context.genesisHash, observedAt: null, cursor: anchor.cursor });
  }
  requireValue(anchor.receipt !== null);
  const entry = verifyJournalEntry(anchor.receipt.entry, context);
  verifyJournalReceipt(entry.event, anchor.receipt, context);
  requireValue(c[3] === entry.sequence && c[4] === entry.hash);
  return entry;
}
export function verifyNextJournalEntry(checkpoint: JournalCheckpoint, wire: SignedEntry, context: LedgerTrustContext): VerifiedJournalEntry {
  // A checkpoint is worker-retained state, not an independently trusted DTO.
  sequence(checkpoint.sequence, true); matches(checkpoint.hash, digest);
  requireValue(checkpoint.cursor === encodeJournalCursor(context, checkpoint.sequence, checkpoint.hash));
  if (checkpoint.sequence === "0") requireValue(checkpoint.hash === context.genesisHash && checkpoint.observedAt === null);
  const entry = verifyJournalEntry(wire, context), body = (parse(wire, LIMIT.entry) as unknown[])[0] as unknown[];
  requireValue(BigInt(entry.sequence) === BigInt(checkpoint.sequence) + BigInt(1) && body[5] === checkpoint.hash);
  requireValue(checkpoint.observedAt === null || entry.observedAt! >= checkpoint.observedAt);
  return entry;
}
