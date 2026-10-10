import { afterEach, describe, expect, it, vi } from "vitest";
import { createSafetyJournal, maintenanceJournal } from "../src/ledger";
import { maintenanceFixture } from "./fixtures/maintenance";
import { beginMaintenance, bindMaintenance, maintenanceSnapshot, settleMaintenance } from "../src/worker-maintenance";
import { entryHash, fence, instant, syntheticJournal } from "./fixtures/ledger";
import type { DeletionLedgerPort, DurableReceipt, JournalEvent, LedgerTrustContext } from "../src/types";

function harness(portOverride?: (s: ReturnType<typeof syntheticJournal>) => DeletionLedgerPort) {
  const s = syntheticJournal(); let wall = Date.parse(instant), mono = 0;
  let context: LedgerTrustContext | null = s.context;
  const clock = { wallNow: () => new Date(wall), monotonicNow: () => mono };
  const service = createSafetyJournal({ port: portOverride?.(s) ?? s.port, trust: { currentContext: () => context }, clock });
  return { ...s, service, clock, setContext(value: LedgerTrustContext | null) { context = value; }, advance(ms: number) { mono += ms; wall += ms; }, setWall(value: number) { wall = value; } };
}
function deferred<T>() { let resolve!: (value: T) => void, reject!: (error: Error) => void; const promise = new Promise<T>((a,b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
afterEach(() => vi.useRealTimers());

describe("one bounded worker journal owner", () => {
  it("replays a greater-than-1000 backlog through fixed original-owner maintenance slices without bypassing projection", async () => {
    const f = await maintenanceFixture("ordinary", true);
    bindMaintenance(f.owner, f.services, f.monotonicNow);
    try {
      for (let i = 1; i <= 1001; i++) f.journalFixture.commit(["tj-journal-event-v1", i.toString(16).padStart(32, "0"), instant, "barrier", ["a".repeat(64), "0".repeat(64), "refresh"]]);
      const before = f.journalFixture.receipts.length;
      let run = await beginMaintenance(f.owner);
      let result = await maintenanceJournal(run, f.owner.repository, { kind: "refresh", purpose: "refresh" });
      expect(result.value).toMatchObject({ kind: "continuation", next: "continue-replay" });
      expect(result.consumedItems).toBe(544);
      expect(maintenanceSnapshot(f.owner).consumedItems).toBe(544);
      await expect(maintenanceJournal(run, f.owner.repository, { kind: "continue-replay" })).rejects.toThrow("MAINTENANCE_BUDGET_INSUFFICIENT");
      let slices = 1;
      while ("kind" in result.value && result.value.kind === "continuation") {
        await settleMaintenance(f.owner); run = await beginMaintenance(f.owner);
        result = await maintenanceJournal(run, f.owner.repository, { kind: "continue-replay" });
        expect(result.consumedItems).toBe(544);
        expect(++slices).toBeLessThan(130);
      }
      expect(result.value).toMatchObject({ kind: "observed", checkpoint: { sequence: String(before + 1) } });
      expect(slices).toBe(126);
      // The original projection rejects contradictory signed causal history;
      // replay slicing must not replace it with merely advancing a cursor.
      await settleMaintenance(f.owner);
      f.journalFixture.commit(fence()); f.journalFixture.commit(fence("f".repeat(32)));
      run = await beginMaintenance(f.owner);
      await expect(maintenanceJournal(run, f.owner.repository, { kind: "refresh", purpose: "refresh" })).rejects.toThrow("MAINTENANCE_COMMAND_FAILED");
    } finally { await settleMaintenance(f.owner); await f.close(); }
  });
  it("settlement observes real admitted append ownership after the caller times out", async () => {
    vi.useFakeTimers(); const gate = deferred<DurableReceipt>(); let blocked = false;
    const h = harness(s => ({ ...s.port, append: event => blocked ? gate.promise : s.port.append(event) }));
    await h.service.refresh("startup"); blocked = true;
    const event = fence(), reply = h.service.append(event).catch(() => undefined); let settled = false;
    const settlement = h.service.settle().then(() => { settled = true; });
    h.advance(15000); await vi.advanceTimersByTimeAsync(15000); await reply;
    expect(settled).toBe(false); expect(h.service.observation()).toBeNull();
    gate.resolve(h.commit(event)); await settlement;
    expect(settled).toBe(true); expect(h.service.observation()).toBeNull();
  });
  it("requires a newly committed challenge and exact replay, not bootstrap self-claims", async () => {
    const h = harness(); expect(h.service.observation()).toBeNull();
    await expect(h.service.append(fence())).rejects.toThrow("JOURNAL_UNAVAILABLE");
    const result = await h.service.refresh("startup");
    expect(result.kind).toBe("observed"); expect(h.service.observation()?.sequence).toBe("1");
    expect(h.calls.map(c => c.method)).toEqual(["append", "readSince"]);
    const challenge = h.calls[0].value as JournalEvent;
    expect(challenge[3]).toBe("barrier"); expect(challenge[4][0]).toMatch(/^[a-f0-9]{64}$/);
    expect(challenge[4][1]).toBe("0".repeat(64));
    await h.service.refresh("refresh");
    expect((h.calls[2].value as JournalEvent)[4][0]).not.toBe(challenge[4][0]);
  });
  it("uses one global head for fences and returns same-proposal receipt without renewing freshness", async () => {
    const h = harness(); await h.service.refresh("startup");
    const r = await h.service.append(fence());
    expect(JSON.parse(r.entry)[0][4]).toBe("2");
    h.advance(60_000);
    expect(await h.service.append(fence())).toEqual(r);
    expect(h.service.observation()).toBeNull();
    const changed = [...fence()] as unknown as JournalEvent;
    (changed as unknown as unknown[])[2] = "2026-10-10T12:00:01.000Z";
    await expect(h.service.append(changed)).rejects.toThrow("JOURNAL_CONFLICT");
    expect(h.calls.filter(c => c.method === "append")).toHaveLength(2);
  });
  it("allows one running and two waiting, expires waiters and retains timed-out underlying ownership", async () => {
    vi.useFakeTimers(); const gate = deferred<DurableReceipt>(); let blocked = false;
    const h = harness(s => ({ ...s.port, append: async event => { if (blocked) { s.calls.push({ method: "append", value: event }); return gate.promise; } return s.port.append(event); } }));
    await h.service.refresh("startup"); blocked = true;
    const first = h.service.append(fence()).catch(e => e.message);
    const second = h.service.append(fence("b".repeat(32))).catch(e => e.message);
    const third = h.service.append(fence("c".repeat(32))).catch(e => e.message);
    await expect(h.service.append(fence("d".repeat(32)))).rejects.toThrow("JOURNAL_QUEUE_FULL");
    h.advance(15_000); await vi.advanceTimersByTimeAsync(15_000);
    expect(await first).toBe("JOURNAL_UNKNOWN"); expect(await second).toBe("JOURNAL_QUEUE_EXPIRED"); expect(await third).toBe("JOURNAL_QUEUE_EXPIRED");
    await expect(h.service.append(fence("e".repeat(32)))).rejects.toThrow("JOURNAL_UNKNOWN");
    await expect(h.service.recover(fence())).rejects.toThrow("JOURNAL_BUSY");
    expect(h.calls.filter(c => c.method === "append")).toHaveLength(2);
    gate.resolve(h.commit(fence())); await vi.advanceTimersByTimeAsync(0);
    expect(h.service.observation()).toBeNull(); blocked = false;
    await expect(h.service.append(fence("e".repeat(32)))).rejects.toThrow("JOURNAL_UNKNOWN");
    expect((await h.service.recover(fence())).kind).toBe("observed");
    expect(h.service.observation()?.sequence).toBe("3");
  });
  it("does not treat a lost commit reply as rejection or silently choose a new event ID", async () => {
    let lost = false;
    const h = harness(s => ({ ...s.port, append: async event => { const result = await s.port.append(event); if (lost) { lost = false; throw new Error("private transport details"); } return result; } }));
    await h.service.refresh("startup"); lost = true;
    await expect(h.service.append(fence())).rejects.toThrow("JOURNAL_UNKNOWN");
    await expect(h.service.recover(fence("f".repeat(32)))).rejects.toThrow("JOURNAL_CONFLICT");
    expect((await h.service.recover(fence())).kind).toBe("observed");
    const events = h.calls.filter(c => c.method === "append").map(c => c.value as JournalEvent);
    expect(events[1]).toEqual(events[2]); expect(events[3][3]).toBe("barrier");
  });
  it.each(["empty", "gap", "duplicate", "reorder", "fork", "wrong-target"])("rejects %s replay instead of declaring a head current", async defect => {
    const h = harness(s => ({ ...s.port, async *readSince(cursor) {
      const entries = s.receipts.map(r => r.entry);
      if (defect === "empty") return;
      if (defect === "gap") { yield entries[1]; return; }
      if (defect === "duplicate") { yield entries[0]; yield entries[0]; return; }
      if (defect === "reorder") { yield entries[1]; yield entries[0]; return; }
      if (defect === "fork") { yield s.receipt(fence("d".repeat(32)), "1", "f".repeat(64)).entry; return; }
      if (defect === "wrong-target") { yield entries[0]; yield s.receipt(fence("e".repeat(32)), "2", entryHash(entries[0])).entry; return; }
      yield* s.port.readSince(cursor);
    } }));
    h.commit(fence());
    await expect(h.service.refresh("startup")).rejects.toThrow();
    expect(h.service.observation()).toBeNull();
  });
  it("rejects replayed old challenges and orphan signed objects", async () => {
    const response: { replay?: DurableReceipt } = {};
    const h = harness(s => ({ ...s.port, append: event => response.replay ? Promise.resolve(response.replay) : s.port.append(event) }));
    await h.service.refresh("startup"); response.replay = h.receipts[0];
    await expect(h.service.refresh("refresh")).rejects.toThrow("JOURNAL_UNKNOWN");
    expect(h.service.observation()).toBeNull();
    const orphan = harness(s => ({ ...s.port, append: async event => s.receipt(event) }));
    await expect(orphan.service.refresh("startup")).rejects.toThrow();
    expect(orphan.service.observation()).toBeNull();
  });
  it("keeps a large backlog offline and consumes at most one bounded contiguous batch", async () => {
    let yielded = 0;
    const h = harness(s => ({ ...s.port, async *readSince(cursor) { for await (const entry of s.port.readSince(cursor)) { yielded++; yield entry; } } }));
    for (let i = 1; i <= 1001; i++) h.commit(fence(i.toString(16).padStart(32, "0")));
    const first = await h.service.refresh("startup");
    expect(first.kind).toBe("continuation"); expect(first.checkpoint.sequence).toBe("1000"); expect(yielded).toBe(1000); expect(h.service.observation()).toBeNull();
    expect((await h.service.continueReplay()).kind).toBe("observed");
    expect(yielded).toBe(1002); expect(h.service.observation()?.sequence).toBe("1002");
  });
  it.each(["refresh", "append"] as const)("preserves the backlog continuation when a queued %s fails preflight", async command => {
    let yielded = 0;
    const h = harness(s => ({ ...s.port, async *readSince(cursor) { for await (const entry of s.port.readSince(cursor)) { yielded++; yield entry; } } }));
    for (let i = 1; i <= 1001; i++) h.commit(fence(i.toString(16).padStart(32, "0")));
    const first = h.service.refresh("startup");
    const queued = (command === "refresh" ? h.service.refresh("refresh") : h.service.append(fence())).catch(error => error.message);
    const prefix = await first;
    expect(prefix).toMatchObject({ kind: "continuation", next: "continue-replay", checkpoint: { sequence: "1000" } });
    expect(await queued).toBe("JOURNAL_UNKNOWN");
    expect(yielded).toBe(1000); expect(h.service.observation()).toBeNull();
    expect(h.calls.filter(call => call.method === "append")).toHaveLength(1);
    const completion = await h.service.continueReplay();
    expect(completion).toMatchObject({ kind: "observed", checkpoint: { sequence: "1002" } });
    expect(yielded).toBe(1002);
    expect(h.calls.filter(call => call.method === "readSince").map(call => JSON.parse(call.value as string)[3])).toEqual(["0", "1000"]);
    expect(h.calls.filter(call => call.method === "append")).toHaveLength(1);
    expect(h.service.observation()?.sequence).toBe("1002");
  });
  it("rejects missing/changed trust and clock rollback after an await without forgetting pending ownership", async () => {
    const gate = deferred<DurableReceipt>(); let pause = false;
    const h = harness(s => ({ ...s.port, append: event => pause ? gate.promise : s.port.append(event) }));
    await h.service.refresh("startup"); pause = true;
    const result = h.service.append(fence()).catch(e => e.message);
    h.setContext({ ...h.context, writerEpoch: "f".repeat(32) });
    gate.resolve(h.commit(fence()));
    expect(await result).toBe("JOURNAL_UNKNOWN"); expect(h.service.observation()).toBeNull();
    h.setContext(h.context); pause = false;
    await expect(h.service.append(fence("c".repeat(32)))).rejects.toThrow("JOURNAL_UNKNOWN");
    await h.service.recover(fence()); h.setWall(Date.parse(instant) - 1);
    expect(h.service.observation()).toBeNull();
    await expect(h.service.refresh("refresh")).rejects.toThrow();
  });
  it("does not bootstrap a restored signed checkpoint without current independent context", () => {
    const s = syntheticJournal(), r = s.commit(fence());
    const anchor = { cursor: JSON.stringify(["tj-journal-cursor-v1", s.context.ledgerId, s.context.historyEpoch, "1", entryHash(r.entry)]) as typeof s.context.anchor.cursor, receipt: r };
    expect(() => createSafetyJournal({ port: s.port, trust: { currentContext: () => null }, clock: { wallNow: () => new Date(instant), monotonicNow: () => 0 } })).toThrow("JOURNAL_UNAVAILABLE");
    const service = createSafetyJournal({ port: s.port, trust: { currentContext: () => ({ ...s.context, anchor }) }, clock: { wallNow: () => new Date(instant), monotonicNow: () => 0 } });
    expect(service.observation()).toBeNull();
  });
  it("does not accept an orphan fence signed with an exact head but absent from committed reads", async () => {
    let orphan = false;
    const h = harness(s => ({ ...s.port, append: async event => orphan ? s.receipt(event) : s.port.append(event) }));
    await h.service.refresh("startup"); orphan = true;
    await expect(h.service.append(fence())).rejects.toThrow("JOURNAL_UNKNOWN");
    expect(h.service.observation()).toBeNull();
  });
  it("applies the 30-second replay deadline to blocked reads and retains ownership through late settlement", async () => {
    vi.useFakeTimers(); const gate = deferred<IteratorResult<DurableReceipt["entry"]>>(); let block = true, reads = 0, returns = 0;
    const h = harness(s => ({ ...s.port, readSince: cursor => block ? { [Symbol.asyncIterator]() { return { next() { reads++; return gate.promise; }, async return() { returns++; return { done: true as const, value: undefined }; } }; } } : s.port.readSince(cursor) }));
    const result = h.service.refresh("startup");
    await vi.advanceTimersByTimeAsync(0);
    h.advance(15_000); await vi.advanceTimersByTimeAsync(15_000);
    expect(reads).toBe(1); expect(returns).toBe(0);
    h.advance(15_000); await vi.advanceTimersByTimeAsync(15_000);
    expect((await result).kind).toBe("continuation");
    await expect(h.service.continueReplay()).rejects.toThrow("JOURNAL_BUSY");
    expect(returns).toBe(0); gate.resolve({ done: false, value: h.receipts[0].entry });
    await vi.advanceTimersByTimeAsync(0); expect(returns).toBe(1);
    block = false; expect((await h.service.continueReplay()).kind).toBe("observed");
  });
  it("checks an absolute queued deadline even when the timer callback has not run", async () => {
    const gate = deferred<DurableReceipt>(); let pause = false;
    const h = harness(s => ({ ...s.port, append: async event => pause ? gate.promise : s.port.append(event) }));
    await h.service.refresh("startup"); pause = true;
    const first = h.service.append(fence()).catch(e => e.message);
    const queued = h.service.append(fence("c".repeat(32))).catch(e => e.message);
    h.advance(15_000); gate.resolve(h.commit(fence()));
    expect(await first).toBe("JOURNAL_UNKNOWN"); expect(await queued).toBe("JOURNAL_QUEUE_EXPIRED");
    expect(h.receipts).toHaveLength(2);
  });
  it("requires a new barrier after offline replay exceeds freshness, not merely finishing a historic target", async () => {
    const h = harness();
    for (let i = 1; i <= 1001; i++) h.commit(fence(i.toString(16).padStart(32, "0")));
    await h.service.refresh("restore"); h.advance(60_000);
    const end = await h.service.continueReplay();
    expect(end).toMatchObject({ kind: "continuation", next: "refresh" }); expect(h.service.observation()).toBeNull();
    expect((await h.service.refresh("restore")).kind).toBe("observed");
  });
  it("recovers a restart's exact old event only through membership and a new current barrier", async () => {
    const h = harness(); h.commit(fence());
    expect((await h.service.recover(fence())).kind).toBe("observed");
    expect(h.service.observation()?.sequence).toBe("2");
    expect(h.calls.map(c => c.method)).toEqual(["append", "append", "readSince"]);
  });
  it("denies stale event times before touching storage and rejects wall and monotonic rollback", async () => {
    const h = harness(); await h.service.refresh("startup"); h.advance(30_001);
    await expect(h.service.append(fence())).rejects.toThrow("JOURNAL_UNAVAILABLE");
    expect(h.calls.filter(c => c.method === "append")).toHaveLength(1);
    h.advance(-1); expect(h.service.observation()).toBeNull();
  });
  it("deduplicates same proposals already waiting behind their first append", async () => {
    const gate = deferred<DurableReceipt>(); let pause = false;
    const h = harness(s => ({ ...s.port, append: async event => { if (pause) { s.calls.push({ method: "append", value: event }); return gate.promise; } return s.port.append(event); } }));
    await h.service.refresh("startup"); pause = true;
    const a = h.service.append(fence()), b = h.service.append(fence());
    const changed = JSON.parse(JSON.stringify(fence())) as JournalEvent;
    (changed as unknown as unknown[])[2] = "2026-10-10T12:00:01.000Z";
    const conflict = h.service.append(changed).catch(e => e.message);
    gate.resolve(h.commit(fence()));
    const first = await a; expect(await b).toEqual(first); expect(await conflict).toBe("JOURNAL_CONFLICT");
    expect(h.calls.filter(c => c.method === "append")).toHaveLength(2);
  });
  it("proves non-last idempotent receipt membership without refreshing its observation time", async () => {
    const h = harness(); await h.service.refresh("startup");
    const original = await h.service.append(fence());
    await h.service.refresh("refresh"); h.advance(20_000);
    expect(await h.service.append(fence())).toEqual(original);
    expect(h.service.observation()?.sequence).toBe("3");
    h.advance(40_000); expect(h.service.observation()).toBeNull();
    expect(h.calls.filter(c => c.method === "readSince").at(-1)?.value).toBe(h.context.anchor.cursor);
  });
  it("recovers interrupted non-last idempotency with a new target rather than its previous head", async () => {
    let missing = false;
    const h = harness(s => ({ ...s.port, async *readSince(cursor) { if (!missing) yield* s.port.readSince(cursor); } }));
    await h.service.refresh("startup"); await h.service.append(fence()); await h.service.refresh("refresh");
    missing = true; await expect(h.service.append(fence())).rejects.toThrow("JOURNAL_UNKNOWN");
    missing = false; expect((await h.service.recover(fence())).kind).toBe("observed");
    expect(h.service.observation()?.sequence).toBe("4");
  });
  it("cannot recover an orphan event merely by obtaining a later current head", async () => {
    const h = harness(s => ({ ...s.port, append: async event => event[3] === "case_fence" ? s.receipt(event, "1") : s.port.append(event) }));
    await expect(h.service.recover(fence())).rejects.toThrow("JOURNAL_UNKNOWN");
    expect(h.service.observation()).toBeNull();
  });
  it("rejects a withdrawn trust context after a blocked read before advancing the checkpoint", async () => {
    const gate = deferred<void>(); let blocked = false;
    const h = harness(s => ({ ...s.port, async *readSince(cursor) { for await (const entry of s.port.readSince(cursor)) { if (blocked) await gate.promise; yield entry; } } }));
    await h.service.refresh("startup"); blocked = true;
    const result = h.service.refresh("refresh").catch(e => e.message);
    await Promise.resolve(); h.setContext(null); gate.resolve();
    expect(await result).toBe("JOURNAL_UNKNOWN"); expect(h.service.observation()).toBeNull();
    h.setContext(h.context); blocked = false;
    expect((await h.service.recover()).kind).toBe("observed");
  });
  it("refuses a second coordinator for the same adapter instead of creating another head", () => {
    const h = harness();
    expect(() => createSafetyJournal({ port: h.port, trust: { currentContext: () => h.context }, clock: h.clock })).toThrow("JOURNAL_ALREADY_OWNED");
  });
  it.each(["ledgerId", "historyEpoch", "writerEpoch", "keyId", "genesisHash", "operationalEnd"] as const)("invalidates observation on an in-place %s context transition", async field => {
    const h = harness(); await h.service.refresh("startup");
    const mutable = h.context as unknown as Record<string, unknown>;
    mutable[field] = field === "keyId" ? "different-key" : field === "operationalEnd" ? "2031-01-01T00:00:00.000Z" : field === "genesisHash" ? "f".repeat(64) : "f".repeat(32);
    expect(h.service.observation()).toBeNull();
    await expect(h.service.refresh("refresh")).rejects.toThrow("JOURNAL_UNAVAILABLE");
  });
  it("times out iterator cleanup without releasing its actual running slot", async () => {
    vi.useFakeTimers(); const cleanup = deferred<void>(); let block = true;
    const h = harness(s => ({ ...s.port, readSince: cursor => {
      const iterator = s.port.readSince(cursor)[Symbol.asyncIterator]();
      return { [Symbol.asyncIterator]() { return { next: () => iterator.next(), async return() { if (block) await cleanup.promise; return { done: true as const, value: undefined }; } }; } };
    } }));
    const result = h.service.refresh("startup"); await vi.advanceTimersByTimeAsync(0);
    h.advance(30_000); await vi.advanceTimersByTimeAsync(30_000);
    expect((await result).kind).toBe("continuation"); expect(h.service.observation()).toBeNull();
    await expect(h.service.continueReplay()).rejects.toThrow("JOURNAL_BUSY");
    block = false; cleanup.resolve(); await vi.advanceTimersByTimeAsync(0);
    expect((await h.service.continueReplay()).kind).toBe("observed");
  });
  it("charges queue waiting against the subsequent append's absolute fifteen seconds", async () => {
    vi.useFakeTimers(); const first = deferred<DurableReceipt>(), second = deferred<DurableReceipt>(); let count = 0, paused = false;
    const h = harness(s => ({ ...s.port, append: async event => {
      if (!paused) return s.port.append(event);
      s.calls.push({ method: "append", value: event }); return ++count === 1 ? first.promise : second.promise;
    } }));
    await h.service.refresh("startup"); paused = true;
    const a = h.service.append(fence()), b = h.service.append(fence("c".repeat(32))).catch(e => e.message);
    h.advance(10_000); await vi.advanceTimersByTimeAsync(10_000); first.resolve(h.commit(fence())); await a;
    expect(count).toBe(2); h.advance(5_000); await vi.advanceTimersByTimeAsync(5_000);
    expect(await b).toBe("JOURNAL_UNKNOWN");
    second.resolve(h.commit(fence("c".repeat(32)))); await vi.advanceTimersByTimeAsync(0);
  });
  it("expires observations on monotonic time even when wall time is unchanged", async () => {
    const h = harness(); await h.service.refresh("startup");
    h.clock.monotonicNow = () => 60_000;
    expect(h.service.observation()).toBeNull();
  });
  it("rejects throwing and malformed trust dependencies without manufacturing bootstrap evidence", () => {
    const s = syntheticJournal(), clock = { wallNow: () => new Date(instant), monotonicNow: () => 0 };
    expect(() => createSafetyJournal({ port: s.port, clock, trust: { currentContext() { throw new Error("private"); } } })).toThrow("JOURNAL_UNAVAILABLE");
    expect(() => createSafetyJournal({ port: s.port, clock, trust: { currentContext: () => ({ ...s.context, anchor: undefined } as unknown as LedgerTrustContext) } })).toThrow("JOURNAL_UNAVAILABLE");
  });
});
