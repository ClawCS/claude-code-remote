import { createHash, generateKeyPairSync, sign } from "node:crypto";
import type { DurableReceipt, JournalEvent, LedgerCursor, LedgerTrustContext, SignedEntry, SignedHead } from "../../src/types";
import { applicationId } from "../../src/types";

export const instant = "2026-10-10T12:00:00.000Z";
export const caseId = applicationId("11111111-1111-4111-8111-111111111111");
export function fence(id = "a".repeat(32)): JournalEvent {
  return ["tj-journal-event-v1", id, instant, "case_fence", [caseId, "initial", "b".repeat(32), "1", "reject"]] as JournalEvent;
}
export function hash(domain: string, value: unknown): string { return createHash("sha256").update(domain + "\n").update(JSON.stringify(value)).digest("hex"); }
export function syntheticJournal() {
  const keys = generateKeyPairSync("ed25519");
  const genesis = "0".repeat(64);
  const context: LedgerTrustContext = {
    ledgerId: "1".repeat(32), historyEpoch: "2".repeat(32), writerEpoch: "3".repeat(32), keyId: "synthetic-key", publicKey: keys.publicKey,
    genesisHash: genesis, operationalStart: "2026-01-01T00:00:00.000Z", operationalEnd: "2030-01-01T00:00:00.000Z",
    anchor: { cursor: JSON.stringify(["tj-journal-cursor-v1", "1".repeat(32), "2".repeat(32), "0", genesis]) as LedgerCursor, receipt: null },
  };
  const receipts: DurableReceipt[] = [];
  const calls: { method: "append" | "readSince"; value: JournalEvent | LedgerCursor }[] = [];
  function envelope(body: unknown[], kind: "entry" | "head"): string {
    const digest = hash(`tj-journal-${kind}-hash-v1`, body);
    const signature = sign(null, Buffer.concat([Buffer.from(`tj-journal-${kind}-sign-v1\n`), Buffer.from(digest, "hex")]), keys.privateKey).toString("base64url");
    return JSON.stringify([body, signature]);
  }
  function receipt(event: JournalEvent, sequence = String(receipts.length + 1), previousHash = receipts.length ? entryHash(receipts.at(-1)!.entry) : genesis): DurableReceipt {
    const body = ["tj-journal-entry-v1", context.ledgerId, context.historyEpoch, context.writerEpoch, sequence, previousHash, context.keyId, event];
    const entry = envelope(body, "entry") as SignedEntry;
    const head = envelope(["tj-journal-head-v1", context.ledgerId, context.historyEpoch, context.writerEpoch, sequence, entryHash(entry), event[1], event[2], context.keyId], "head") as SignedHead;
    return { entry, head };
  }
  function commit(event: JournalEvent) {
    const old = receipts.find(r => JSON.parse(r.entry)[0][7][1] === event[1]);
    if (old) {
      if (JSON.stringify(JSON.parse(old.entry)[0][7]) !== JSON.stringify(event)) throw new Error("conflict");
      return old;
    }
    const next = receipt(event); receipts.push(next); return next;
  }
  const port = {
    async append(event: JournalEvent) { calls.push({ method: "append", value: event }); return commit(event); },
    async *readSince(cursor: LedgerCursor) {
      calls.push({ method: "readSince", value: cursor });
      const sequence = BigInt(JSON.parse(cursor)[3]);
      for (const r of receipts) if (BigInt(JSON.parse(r.entry)[0][4]) > sequence) yield r.entry;
    },
  };
  return { context, keys, receipts, calls, receipt, envelope, commit, port };
}
export function entryHash(entry: SignedEntry): string { return hash("tj-journal-entry-hash-v1", JSON.parse(entry)[0]); }
