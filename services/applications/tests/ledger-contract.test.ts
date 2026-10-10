import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { decodeJournalEvent, encodeJournalEvent, verifyJournalEntry, verifyJournalHead, verifyJournalReceipt, verifyJournalCheckpoint, verifyNextJournalEntry } from "../src/ledger-contract";
import { caseId, entryHash, fence, instant, syntheticJournal } from "./fixtures/ledger";
import type { JournalEvent, LedgerCursor, SignedEntry } from "../src/types";

describe("bounded canonical journal contract", () => {
  const erased = (kind: string, body: unknown[]): JournalEvent => ["tj-journal-event-v1", "e".repeat(32), instant, kind, body] as unknown as JournalEvent;
  it.each(["processing_payload", "processing_contact", "incident_identity", "public_token"])("authenticates the exact technical erasure scope %s", scope => {
    const event = erased("erase_commit", [caseId, scope, "association-key", "6".repeat(64)]), s = syntheticJournal();
    expect(decodeJournalEvent(JSON.stringify(event))).toEqual(event);
    expect(verifyJournalReceipt(event, s.commit(event), s.context).event).toEqual(event);
  });
  it("authenticates final erasure and its exact completion reference without changing signed receipt binding", () => {
    const s = syntheticJournal(), event = erased("erase_commit", [caseId, "identifying_register", "association-key", "6".repeat(64), "fence", "7".repeat(32), "9007199254740991", "8".repeat(32), "9".repeat(64)]);
    const receipt = s.commit(event);
    expect(verifyJournalReceipt(event, receipt, s.context).event).toEqual(event);
    const done = [...erased("erase_done", [caseId, event[1]])] as unknown as JournalEvent;
    (done as unknown as unknown[])[1] = "f".repeat(32);
    expect(verifyJournalReceipt(done, s.commit(done), s.context).event).toEqual(done);
    expect(() => verifyJournalReceipt(event, { entry: receipt.entry, head: s.receipts[1].head }, s.context)).toThrow();
  });
  it.each([
    [caseId, "all_deleted", "association-key", "6".repeat(64)],
    [caseId, "processing_payload", "association-key", "6".repeat(64), null],
    [caseId, "identifying_register", "association-key", "6".repeat(64)],
    [caseId, "public_token", "Association", "6".repeat(64)],
    [caseId, "public_token", "association-key", "G".repeat(64)],
    [caseId, "public_token", "association-key", "ü".repeat(64)],
    ...["0", "01", "-1", "1.0", "9007199254740992", 1].map(version => [caseId, "identifying_register", "association-key", "6".repeat(64), "fence", "7".repeat(32), version, "8".repeat(32), "9".repeat(64)]),
  ])("rejects unsupported or malformed erasure payload %j", (...body) => {
    expect(() => decodeJournalEvent(JSON.stringify(erased("erase_commit", body)))).toThrow();
  });
  it.each([[caseId], [caseId, "x"], [caseId, "a".repeat(32), "extra"], ["not-a-case", "a".repeat(32)]])("rejects malformed erase_done reference %j", (...body) => {
    expect(() => decodeJournalEvent(JSON.stringify(erased("erase_done", body)))).toThrow();
  });
  const intent = [caseId, "1".repeat(32), "fence", "2".repeat(32), "3", "4".repeat(32), "association-key", "5".repeat(64)];
  const marker = [caseId, "6".repeat(32), "1", "7".repeat(64)];
  const clear = [caseId, "6".repeat(32), "3", "2026-10-10T11:59:00.000Z", instant, "listed-selectable-v1"];
  const mailboxEvent = (kind: string, body: unknown[]): JournalEvent => ["tj-journal-event-v1", "a".repeat(32), instant, kind, body] as unknown as JournalEvent;
  it.each([
    ["attempt_intent", intent], ["copy_mutation_started", marker],
    ["copy_result", [caseId, "8".repeat(32), "deleted", null]], ["mailbox_clear_observed", clear],
  ])("accepts and signs the exact %s mailbox tuple", (kind, body) => {
    const event = mailboxEvent(kind as string, body as unknown[]), s = syntheticJournal();
    expect(decodeJournalEvent(JSON.stringify(event))).toEqual(event);
    expect(verifyJournalReceipt(event, s.commit(event), s.context).event).toEqual(event);
  });
  it.each([
    ["deleted", null], ["not-found", null],
    ...["INVALID_IDENTITY", "CONTENT_MISMATCH", "UIDVALIDITY_CHANGED", "IDENTITY_CHANGED"].map(issue => ["mismatch", issue] as const),
    ...["DEPENDENCY_UNAVAILABLE", "CONNECTION_FAILED", "OPERATION_TIMEOUT", "PROTOCOL_LIMIT", "FOLDER_UNAVAILABLE", "CANDIDATE_LIMIT", "INCOMPLETE_CONTENT", "UNSAFE_DELETE_CAPABILITY", "WRITE_UNAVAILABLE"].map(issue => ["blocked", issue] as const),
    ["uncertain", "DELETE_UNCERTAIN"],
  ] as const)("accepts only the reachable copy result %s/%s", (kind, issue) => {
    const event = mailboxEvent("copy_result", [caseId, "8".repeat(32), kind, issue]);
    expect(decodeJournalEvent(JSON.stringify(event))).toEqual(event);
  });
  it("rejects a signed clear observation whose search falls outside independent operating bounds", () => {
    const s = syntheticJournal(), event = mailboxEvent("mailbox_clear_observed", [...clear]);
    const context = { ...s.context, operationalStart: instant, operationalEnd: instant };
    expect(() => verifyJournalReceipt(event, s.receipt(event), context)).toThrow();
    const exact = mailboxEvent("mailbox_clear_observed", [caseId, clear[1], "1", instant, instant, "listed-selectable-v1"]);
    expect(verifyJournalReceipt(exact, s.receipt(exact), context).event).toEqual(exact);
  });
  it.each([
    ["attempt_intent", [...intent, "extra"]], ["attempt_intent", [caseId, ...intent.slice(1, 4), "01", ...intent.slice(5)]],
    ["attempt_intent", [caseId, ...intent.slice(1, 4), "9007199254740992", ...intent.slice(5)]],
    ["attempt_intent", [caseId, intent[1], "unknown", ...intent.slice(3)]],
    ["attempt_intent", [...intent.slice(0, 6), "Key", intent[7]]],
    ["attempt_intent", [...intent.slice(0, 5), "legacy", ...intent.slice(6)]],
    ["copy_mutation_started", [caseId, marker[1], "4", marker[3]]],
    ["copy_mutation_started", [caseId, marker[1], 1, marker[3]]],
    ["copy_mutation_started", ["not-a-case", ...marker.slice(1)]],
    ["copy_result", [caseId, "8".repeat(32), "deleted", "DELETE_UNCERTAIN"]],
    ["copy_result", [caseId, "8".repeat(32), "not-found", "INVALID_IDENTITY"]],
    ["copy_result", [caseId, "8".repeat(32), "blocked", "LIST_LIMIT"]],
    ["copy_result", [caseId, "8".repeat(32), "blocked", "CONTENT_MISMATCH"]],
    ["copy_result", [caseId, "8".repeat(32), "mismatch", "CONNECTION_FAILED"]],
    ["copy_result", [caseId, "8".repeat(32), "uncertain", null]],
    ["copy_result", [caseId, "8".repeat(32), "all_deleted", null]],
    ["mailbox_clear_observed", [caseId, clear[1], "3", instant, "2026-10-10T11:59:59.999Z", clear[5]]],
    ["mailbox_clear_observed", [caseId, clear[1], "3", instant, "2026-10-10T12:00:00.001Z", clear[5]]],
    ["mailbox_clear_observed", [...clear.slice(0, 5), "all-folders"]],
    ["mailbox_clear_observed", [caseId, clear[1], "3", "2026-10-10T12:00:00Z", instant, clear[5]]],
  ])("rejects malformed mailbox phase %s/%j", (kind, body) => {
    expect(() => decodeJournalEvent(JSON.stringify(mailboxEvent(kind as string, body as unknown[])))).toThrow();
  });
  it("round-trips the flat fence and barrier without normalizing caller bytes", () => {
    const event = fence();
    expect(encodeJournalEvent(event)).toBe('["tj-journal-event-v1","aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","2026-10-10T12:00:00.000Z","case_fence",["11111111-1111-4111-8111-111111111111","initial","bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","1","reject"]]');
    expect(decodeJournalEvent(encodeJournalEvent(event))).toEqual(event);
    const barrier: JournalEvent = ["tj-journal-event-v1", "c".repeat(32), instant, "barrier", ["d".repeat(64), "0".repeat(64), "startup"]];
    expect(decodeJournalEvent(encodeJournalEvent(barrier))).toEqual(barrier);
  });
  it("snapshots canonical events without freezing or retaining the caller's mutable tuple", () => {
    const event = fence(); encodeJournalEvent(event);
    expect(Object.isFrozen(event)).toBe(false); expect(Object.isFrozen(event[4])).toBe(false);
    const s = syntheticJournal(), verified = verifyJournalEntry(s.receipt(event).entry, s.context);
    expect(Object.isFrozen(verified.event)).toBe(true); expect(Object.isFrozen(verified.event[4])).toBe(true);
  });
  it.each([
    (s: string) => " " + s,
    (s: string) => s.replace('"1"', '"01"'),
    (s: string) => s.replace('"reject"', '"delete"'),
    (s: string) => s.replace('"case_fence"', '"attempt_intent"'),
    (s: string) => s.replace('"reject"]', '"reject",null]'),
    (s: string) => s.replace('"initial"', '["initial"]'),
    (s: string) => s.replace("2026-10-10", "2026-02-30"),
    (s: string) => s.replace(".000Z", "Z"),
    (s: string) => s.replace('"1"', '"9007199254740992"'),
    (s: string) => s.replace("aaaaaaaa", "AAAAAAAA"),
    (s: string) => s.replace("reject", "\\u0072eject"),
    () => '['.repeat(2049),
    () => JSON.stringify({ kind: "case_fence" }),
  ])("rejects malformed/noncanonical/deep/unsupported event %d", mutate => {
    expect(() => decodeJournalEvent(mutate(JSON.stringify(fence())))).toThrow();
  });
  it("verifies real signed entries, exact receipts and a contiguous pinned genesis delta", () => {
    const s = syntheticJournal(), event = fence(), receipt = s.commit(event);
    const entry = verifyJournalEntry(receipt.entry, s.context);
    expect(entry.sequence).toBe("1"); expect(entry.event).toEqual(event);
    expect(verifyJournalReceipt(event, receipt, s.context).hash).toBe(entryHash(receipt.entry));
    const checkpoint = verifyJournalCheckpoint(s.context.anchor, s.context);
    expect(verifyNextJournalEntry(checkpoint, receipt.entry, s.context).sequence).toBe("1");
    expect(() => verifyNextJournalEntry(checkpoint, s.receipt(fence("b".repeat(32)), "2").entry, s.context)).toThrow();
    expect(() => verifyJournalCheckpoint({ cursor: s.context.anchor.cursor.replace("00000000", "ffffffff") as LedgerCursor, receipt: null }, s.context)).toThrow();
  });
  it.each([1, 2, 3, 4, 5, 6, 7])("rejects altered signed entry field %d", index => {
    const s = syntheticJournal(), r = s.receipt(fence()), wire = JSON.parse(r.entry);
    wire[0][index] = index === 7 ? fence("e".repeat(32)) : "9".repeat(index === 5 ? 64 : 32);
    expect(() => verifyJournalEntry(JSON.stringify(wire) as SignedEntry, s.context)).toThrow();
  });
  it("rejects valid signatures under wrong pinned key/epoch and a noncanonical signature", () => {
    const s = syntheticJournal(), r = s.receipt(fence());
    expect(() => verifyJournalEntry(r.entry, { ...s.context, publicKey: generateKeyPairSync("ed25519").publicKey })).toThrow();
    expect(() => verifyJournalEntry(r.entry, { ...s.context, writerEpoch: "f".repeat(32) })).toThrow();
    const wire = JSON.parse(r.entry); wire[1] += "=";
    expect(() => verifyJournalEntry(JSON.stringify(wire) as SignedEntry, s.context)).toThrow();
    wire[1] = "A".repeat(86);
    expect(() => verifyJournalEntry(JSON.stringify(wire) as SignedEntry, s.context)).toThrow();
  });
  it("rejects same-ID different bytes, later heads, orphan mismatches and timestamp mismatch", () => {
    const s = syntheticJournal(), first = s.commit(fence()), second = s.commit(fence("c".repeat(32)));
    const changed = [...fence()] as unknown as JournalEvent;
    (changed as unknown as unknown[])[2] = "2026-10-10T12:00:01.000Z";
    expect(() => verifyJournalReceipt(changed, first, s.context)).toThrow();
    expect(() => verifyJournalReceipt(fence(), { entry: first.entry, head: second.head }, s.context)).toThrow();
    const body = JSON.parse(first.head)[0]; body[7] = "2026-10-10T12:00:01.000Z";
    expect(() => verifyJournalReceipt(fence(), { entry: first.entry, head: s.envelope(body, "head") as typeof first.head }, s.context)).toThrow();
  });
  it("rejects zero/overflow/noncanonical sequences, oversize envelopes and unanchored cursors", () => {
    const s = syntheticJournal();
    for (const seq of ["0", "01", "18446744073709551616", "1.0", "-1"]) expect(() => verifyJournalEntry(s.receipt(fence(), seq).entry, s.context)).toThrow();
    expect(verifyJournalEntry(s.receipt(fence(), "18446744073709551615").entry, s.context).sequence).toBe("18446744073709551615");
    expect(() => verifyJournalEntry(" ".repeat(4097) as SignedEntry, s.context)).toThrow();
    const r = s.commit(fence());
    const cursor = JSON.stringify(["tj-journal-cursor-v1", s.context.ledgerId, s.context.historyEpoch, "1", entryHash(r.entry)]) as LedgerCursor;
    expect(() => verifyJournalCheckpoint({ cursor, receipt: null }, s.context)).toThrow();
    expect(verifyJournalCheckpoint({ cursor, receipt: r }, s.context).sequence).toBe("1");
  });
  it("accepts inclusive equal operational bounds and rejects inverted, malformed or out-of-range dates", () => {
    const s = syntheticJournal(), r = s.receipt(fence());
    expect(verifyJournalEntry(r.entry, { ...s.context, operationalStart: instant, operationalEnd: instant }).sequence).toBe("1");
    for (const interval of [
      { operationalStart: "2026-10-11T00:00:00.000Z", operationalEnd: instant },
      { operationalStart: "2026-02-30T00:00:00.000Z", operationalEnd: instant },
      { operationalStart: "2026-10-11T00:00:00.000Z", operationalEnd: "2026-10-12T00:00:00.000Z" },
    ]) expect(() => verifyJournalEntry(r.entry, { ...s.context, ...interval })).toThrow();
  });
  it("refuses a fabricated genesis even when the cursor matches the fabricated hash", () => {
    const s = syntheticJournal(), fakeHash = "e".repeat(64);
    const fake = { sequence: "0", hash: fakeHash, observedAt: null, cursor: JSON.stringify(["tj-journal-cursor-v1", s.context.ledgerId, s.context.historyEpoch, "0", fakeHash]) as LedgerCursor };
    expect(() => verifyNextJournalEntry(fake, s.receipt(fence(), "1", fakeHash).entry, s.context)).toThrow();
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8])("rejects a genuinely signed but mismatched head field %d", field => {
    const s = syntheticJournal(), r = s.receipt(fence()), body = JSON.parse(r.head)[0];
    body[field] = field === 4 ? "2" : field === 5 ? "f".repeat(64) : field === 7 ? "2026-10-10T12:00:01.000Z" : field === 8 ? "other-key" : "f".repeat(32);
    expect(() => verifyJournalReceipt(fence(), { entry: r.entry, head: s.envelope(body, "head") as typeof r.head }, s.context)).toThrow();
  });
  it("rejects extra envelope fields, excessive nesting, noncanonical UTF-8 text and every oversized wire boundary", () => {
    const s = syntheticJournal(), r = s.receipt(fence()), envelope = JSON.parse(r.entry);
    envelope.push("extra"); expect(() => verifyJournalEntry(JSON.stringify(envelope) as SignedEntry, s.context)).toThrow();
    for (const wire of ['[[[[[0]]]]]', JSON.stringify(fence()).replace("reject", "rejéct"), JSON.stringify(fence()).replace("reject", "rej\ud800ct"), " ".repeat(2049)]) expect(() => decodeJournalEvent(wire)).toThrow();
    expect(() => verifyJournalHead(" ".repeat(1025) as typeof r.head, s.context)).toThrow();
    expect(() => verifyJournalCheckpoint({ cursor: " ".repeat(513) as LedgerCursor, receipt: null }, s.context)).toThrow();
    expect(() => verifyJournalReceipt(fence(), { entry: " ".repeat(6145) as SignedEntry, head: r.head }, s.context)).toThrow();
    expect(() => verifyJournalReceipt(fence(), { ...r, trusted: true } as typeof r, s.context)).toThrow();
    const entry = verifyJournalEntry(s.receipt(fence(), "1").entry, s.context);
    const older = JSON.parse(JSON.stringify(fence("e".repeat(32)))) as JournalEvent;
    (older as unknown as unknown[])[2] = "2026-10-10T11:59:59.999Z";
    expect(() => verifyNextJournalEntry(entry, s.receipt(older, "2", entry.hash).entry, s.context)).toThrow();
  });
  it("rejects non-string receipt members before attempting arbitrary serialization", () => {
    const s = syntheticJournal(), r = s.receipt(fence()); let serialized = false;
    const hostile = { entry: { toJSON() { serialized = true; return r.entry; } }, head: r.head } as unknown as typeof r;
    expect(() => verifyJournalReceipt(fence(), hostile, s.context)).toThrow(); expect(serialized).toBe(false);
  });
});
