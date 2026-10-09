import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { decodeJournalEvent, encodeJournalEvent, verifyJournalEntry, verifyJournalHead, verifyJournalReceipt, verifyJournalCheckpoint, verifyNextJournalEntry } from "../src/ledger-contract";
import { entryHash, fence, instant, syntheticJournal } from "./fixtures/ledger";
import type { JournalEvent, LedgerCursor, SignedEntry } from "../src/types";

describe("bounded canonical journal contract", () => {
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
