import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { loadRentalConfig } from "./config";
import { RentalOrderService } from "./service";
import { renderRentalDocument } from "./documents";
import type { RentalGatewayPayment, RentalMailMessage, RentalOrder, RentalPaymentGateway, RentalSubmitInput } from "./types";

const cleanup: (() => void)[] = [];
afterEach(() => { cleanup.splice(0).reverse().forEach(fn => fn()); });
const customer = { name: "Test Kunde", email: "kunde@example.invalid", phone: "0123456789", street: "Teststraße 1", postalCode: "12345", city: "Testort", country: "Deutschland" };
function input(patch: Partial<RentalSubmitInput> = {}): RentalSubmitInput {
  return { items: [{ id: 20012, quantity: 1, startDate: "2026-10-05", endDate: "2026-10-07" }], customer, expectedTotalCents: 3000, paymentMethod: "online", acceptedTerms: true, termsVersion: "test-v1", ...patch };
}
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "rental-store-")); cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
  const config = loadRentalConfig({ RENTAL_MODE: "test", RENTAL_DATA_DIR: dir });
  let clock = new Date("2026-10-01T12:00:00Z"); let failCustomer = false; let createFailure = false;
  const provider = new Map<string, RentalGatewayPayment>(); const keys: string[] = []; const messages: RentalMailMessage[] = [];
  const gateway: RentalPaymentGateway = {
    async createPayment(request) {
      keys.push(request.idempotencyKey);
      if (createFailure) throw new Error("secret-provider-error");
      const payment = { id: `tr_${request.idempotencyKey}`, url: `https://pay.example.invalid/${request.idempotencyKey}`, status: "pending" as const, orderId: request.orderId, amountCents: request.amountCents, currency: "EUR" };
      provider.set(payment.id, payment); return payment;
    },
    async getPayment(id) { const p = provider.get(id); if (!p) throw new Error("No payment"); return p; },
  };
  const deps = {
    gateway, now: () => clock, statusUrl: (id: string) => `http://localhost:3000/mietbestellung/${id}?token=test`,
    preflightDocument: undefined as ((order: RentalOrder) => Promise<void>) | undefined,
    sender: { async send(message: RentalMailMessage) { if (failCustomer && message.to === customer.email) throw new Error("smtp-password-secret"); messages.push(message); return { id: message.messageId }; } },
    buildMessage: async (order: RentalOrder, event: string, recipient: "customer" | "market") => ({ to: recipient === "customer" ? order.customer.email : config.marketEmail, subject: event, text: JSON.stringify(order), messageId: `${order.id}-${event}-${recipient}`, attachments: [] }),
  };
  const service = new RentalOrderService(config, deps); cleanup.push(() => service.close());
  return { service, config, deps, dir, provider, keys, messages, advance: (hours = 1) => { clock = new Date(clock.getTime() + hours * 3600_000); }, failCustomer: (v: boolean) => { failCustomer = v; }, failCreate: (v: boolean) => { createFailure = v; } };
}

describe("durable rental order workflow", () => {
  it("persists one submitted order per nonce, with no invoice or payment before explicit acceptance", async () => {
    const f = fixture(); const first = await f.service.submit(input(), "nonce-first-order");
    expect(first.status).toBe("submitted"); expect(first.invoice).toBeUndefined(); expect(first.payment.status).toBe("not_requested"); expect(f.keys).toEqual([]);
    expect(first.termsText).toContain("TESTMODUS"); expect(first.privacyText).toContain("erfundene");
    expect((await f.service.submit(input(), "nonce-first-order")).id).toBe(first.id);
    const second = new RentalOrderService(f.config, f.deps); cleanup.push(() => second.close());
    expect(second.get(first.id)).toEqual(first); expect(second.list()).toHaveLength(1);
    expect(second.outbox(first.id)).toHaveLength(2);
    await expect(second.submit(input({ customer: { ...customer, name: "Someone else" } }), "nonce-first-order")).rejects.toThrow(/Idempotenz/);
    expect(statSync(f.dir).mode & 0o077).toBe(0);
  });
  it.each([
    ["forged total", { expectedTotalCents: 1 }], ["missing terms", { acceptedTerms: false }],
    ["old terms", { termsVersion: "other" }], ["malformed email", { customer: { ...customer, email: "x\r\nBcc: victim@example.com" } }],
    ["multiple recipient separator", { customer: { ...customer, email: "other,kunde@example.invalid" } }],
    ["unknown item", { items: [{ id: 999, quantity: 1, startDate: "2026-10-05", endDate: "2026-10-07" }] }],
    ["unpriced item", { items: [{ id: 20008, quantity: 1, startDate: "2026-10-05", endDate: "2026-10-07" }] }],
    ["past date", { items: [{ id: 20012, quantity: 1, startDate: "2026-09-01", endDate: "2026-09-02" }] }],
  ])("rejects %s without storing a request", async (_label, patch) => {
    const { service } = fixture(); await expect(service.submit(input(patch), "validation-nonce")).rejects.toThrow(); expect(service.list()).toEqual([]);
  });
  it("cannot accept conflicting stock across two SQLite connections", async () => {
    const f = fixture(); const other = new RentalOrderService(f.config, f.deps); cleanup.push(() => other.close());
    const a = await f.service.submit(input({ paymentMethod: "cash" }), "concurrent-order-a"); const b = await other.submit(input({ paymentMethod: "cash" }), "concurrent-order-b");
    const results = await Promise.allSettled([f.service.accept(a.id, a.version), other.accept(b.id, b.version)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1); expect(f.service.list().filter(o => o.status === "accepted")).toHaveLength(1);
  });
  it("shares furniture pools across orders while allowing disjoint dates", async () => {
    const { service } = fixture();
    const set = await service.submit(input({ paymentMethod: "cash", items: [{ id: 20007, quantity: 1, startDate: "2026-10-05", endDate: "2026-10-07" }], expectedTotalCents: 1500 }), "furniture-set"); await service.accept(set.id, set.version);
    const table = await service.submit(input({ paymentMethod: "cash", items: [{ id: 20005, quantity: 1, startDate: "2026-10-07", endDate: "2026-10-07" }], expectedTotalCents: 700 }), "furniture-table");
    await expect(service.accept(table.id, table.version)).rejects.toThrow(/Bestand|verfügbar/);
    const later = await service.submit(input({ paymentMethod: "cash", items: [{ id: 20005, quantity: 1, startDate: "2026-10-08", endDate: "2026-10-08" }], expectedTotalCents: 700 }), "furniture-later"); expect((await service.accept(later.id, later.version)).status).toBe("accepted");
  });
  it("runs online acceptance, verified payment, actual handover and return with immutable numbers", async () => {
    const f = fixture(); const submitted = await f.service.submit(input(), "online-full-flow");
    const accepted = await f.service.accept(submitted.id, submitted.version);
    expect(accepted.invoice?.number).toBe("TEST-2026-000001"); expect(accepted.deliveryNote).toBeUndefined(); expect(accepted.payment.url).toMatch(/^https:/);
    await expect(f.service.handover(accepted.id, accepted.version)).rejects.toThrow(/bezahlt/);
    const payment = f.provider.get(accepted.payment.id!)!; f.provider.set(payment.id, { ...payment, status: "paid" });
    const paid = await f.service.syncPayment(payment.id); expect(paid.payment.status).toBe("paid");
    const handed = await f.service.handover(paid.id, paid.version); expect(handed.deliveryNote?.number).toBe("TEST-LS-2026-000001");
    const returned = await f.service.returned(handed.id, handed.version); expect(returned.status).toBe("returned");
    expect((await f.service.handover(handed.id, handed.version)).deliveryNote).toEqual(handed.deliveryNote);
    expect((await f.service.accept(handed.id, submitted.version)).invoice).toEqual(accepted.invoice);
    expect(f.keys).toHaveLength(1);
    f.provider.set(payment.id, { ...payment, status: "pending" }); expect((await f.service.syncPayment(payment.id)).payment.status).toBe("paid");
  });
  it("runs cash receipt only after acceptance, then delivery, and rejects stale writes", async () => {
    const { service, keys } = fixture(); const submitted = await service.submit(input({ paymentMethod: "cash" }), "cash-full-flow");
    await expect(service.recordCash(submitted.id, submitted.version)).rejects.toThrow();
    const accepted = await service.accept(submitted.id, submitted.version);
    await expect(service.returned(accepted.id, accepted.version)).rejects.toThrow();
    await expect(service.recordCash(accepted.id, 0)).rejects.toThrow(/geändert/);
    const paid = await service.recordCash(accepted.id, accepted.version); expect(paid.payment.status).toBe("paid");
    const handed = await service.handover(paid.id, paid.version); expect(handed.status).toBe("handed_over"); expect(keys).toEqual([]);
  });
  it("declines without allocating an invoice or initiating payment", async () => {
    const { service, keys } = fixture(); const order = await service.submit(input(), "decline-flow");
    const declined = await service.decline(order.id, order.version); expect(declined.status).toBe("declined"); expect(declined.invoice).toBeUndefined(); expect(keys).toEqual([]);
    expect((await service.decline(order.id, order.version)).version).toBe(declined.version);
    await expect(service.accept(order.id, declined.version)).rejects.toThrow();
  });
  it("retries an uncertain creation using the same provider idempotency key and holds accepted email until link exists", async () => {
    const f = fixture(); const order = await f.service.submit(input(), "payment-retry"); f.failCreate(true);
    const accepted = await f.service.accept(order.id, order.version); expect(accepted.status).toBe("accepted"); expect(accepted.invoice).toBeDefined();
    await f.service.dispatchOutbox(); expect(f.messages.filter(m => m.subject === "accepted" && m.to === customer.email)).toEqual([]);
    f.failCreate(false); f.advance(); const retry = await f.service.retryPayment(order.id); expect(retry.payment.id).toBeDefined();
    expect(f.keys).toHaveLength(2); expect(f.keys[0]).toBe(f.keys[1]);
    await f.service.dispatchOutbox(); expect(f.messages.filter(m => m.subject === "accepted" && m.to === customer.email)).toHaveLength(1);
    expect(JSON.stringify(f.service.outbox(order.id))).not.toContain("secret-provider-error");
  });
  it("rejects mismatched verified provider amounts before marking paid", async () => {
    const f = fixture(); const order = await f.service.submit(input(), "bad-payment"); const accepted = await f.service.accept(order.id, order.version);
    const p = f.provider.get(accepted.payment.id!)!; f.provider.set(p.id, { ...p, amountCents: 1, status: "paid" });
    await expect(f.service.syncPayment(p.id)).rejects.toThrow(/Zahlung/); expect(f.service.get(order.id).payment.status).toBe("pending");
  });
  it("delivers recipient jobs independently and preserves receipt snapshot without an invoice", async () => {
    const f = fixture(); const order = await f.service.submit(input({ paymentMethod: "cash" }), "mail-separate");
    await f.service.accept(order.id, order.version); f.failCustomer(true); await f.service.dispatchOutbox();
    expect(f.messages.filter(m => m.to === f.config.marketEmail)).toHaveLength(2);
    expect(f.service.outbox(order.id).filter(j => j.state === "pending")).toHaveLength(2);
    f.failCustomer(false); f.advance(); await f.service.dispatchOutbox();
    expect(f.messages.filter(m => m.to === f.config.marketEmail)).toHaveLength(2);
    expect(f.messages.filter(m => m.to === customer.email)).toHaveLength(2);
    const received = JSON.parse(f.messages.find(m => m.to === customer.email && m.subject === "received")!.text);
    expect(received.status).toBe("submitted"); expect(received.invoice).toBeUndefined();
    expect(f.service.outbox(order.id).every(j => j.state === "sent")).toBe(true);
    expect(JSON.stringify(f.service.outbox(order.id))).not.toContain("smtp-password-secret");
  });
  it("claims payment work before external I/O so simultaneous workers cannot create twice", async () => {
    const f = fixture(); const other = new RentalOrderService(f.config, f.deps); cleanup.push(() => other.close());
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    const create = f.deps.gateway.createPayment; let calls = 0;
    f.deps.gateway.createPayment = async request => { calls++; await gate; return create(request); };
    const order = await f.service.submit(input(), "payment-concurrent");
    const first = f.service.accept(order.id, order.version);
    await other.retryPayment(order.id); expect(calls).toBe(1);
    release(); await first; expect(f.service.get(order.id).payment.id).toBeDefined();
  });
  it("claims recipient jobs before I/O so simultaneous dispatches do not send the same job", async () => {
    const f = fixture(); const other = new RentalOrderService(f.config, f.deps); cleanup.push(() => other.close());
    const order = await f.service.submit(input({ paymentMethod: "cash" }), "mail-concurrent");
    await Promise.all([f.service.dispatchOutbox(), other.dispatchOutbox()]);
    expect(f.messages).toHaveLength(2); expect(new Set(f.messages.map(m => m.messageId)).size).toBe(2);
    expect(f.service.outbox(order.id).map(job => job.state)).toEqual(["sent", "sent"]);
  });
  it("refuses accepting a persisted price that no longer matches the canonical quote", async () => {
    const f = fixture(); const order = await f.service.submit(input(), "immutable-price");
    const db = new DatabaseSync(join(f.dir, "rental-orders.sqlite"));
    const tampered = { ...order, quote: { ...order.quote, totalCents: 1 } };
    db.prepare("UPDATE orders SET payload=? WHERE id=?").run(JSON.stringify(tampered), order.id); db.close();
    await expect(f.service.accept(order.id, order.version)).rejects.toThrow(/Mietpreis/);
    expect(f.service.get(order.id).invoice).toBeUndefined();
  });
  it("does not leak test mode into live storage or send externally when disabled", () => {
    const f = fixture();
    expect(() => new RentalOrderService({ ...f.config, enabled: false }, f.deps)).toThrow(/freigeschaltet/);
  });
  it("refuses to reuse a test database after switching to live mode", async () => {
    const f = fixture(); await f.service.submit(input(), "test-database-mode");
    expect(() => new RentalOrderService({ ...f.config, mode: "live" }, f.deps)).toThrow(/Test|Betriebsart/);
  });
  it("fails closed after twelve hours of an unresolved provider creation and records manual reconciliation", async () => {
    const f = fixture(); const order = await f.service.submit(input(), "uncertain-expired"); f.failCreate(true);
    await f.service.accept(order.id, order.version); f.advance(12); f.failCreate(false);
    await expect(f.service.retryPayment(order.id)).rejects.toThrow(/manuell/);
    expect(f.keys).toHaveLength(1);
    expect(f.service.get(order.id).events.some(event => event.type === "payment_manual_reconciliation_required")).toBe(true);
    expect(f.service.get(order.id).payment.status).toBe("pending");
  });
  it("uses the deployed rentals webhook route", async () => {
    const f = fixture(); let callback = ""; const create = f.deps.gateway.createPayment;
    f.deps.gateway.createPayment = async request => { callback = request.webhookUrl; return create(request); };
    const order = await f.service.submit(input(), "webhook-route-check"); await f.service.accept(order.id, order.version);
    expect(callback).toBe("http://localhost:3000/api/rentals/webhook");
  });
  it.each(["paid", "expired", "failed", "canceled"] as const)("accepts verified %s callbacks after provider removes checkout URL", async status => {
    const f = fixture(); const order = await f.service.submit(input(), `missing-checkout-${status}`); const accepted = await f.service.accept(order.id, order.version);
    const payment = f.provider.get(accepted.payment.id!)!;
    f.provider.set(payment.id, { ...payment, status, url: "" });
    const synced = await f.service.syncPayment(payment.id);
    expect(synced.payment.status).toBe(status); expect(synced.payment.url).toBe(accepted.payment.url);
  });
  it("remembers prior payment IDs durably and handles a late paid callback without exposing a second checkout", async () => {
    const f = fixture(); const submitted = await f.service.submit(input(), "late-prior-payment"); const first = await f.service.accept(submitted.id, submitted.version);
    const old = f.provider.get(first.payment.id!)!; f.provider.set(old.id, { ...old, status: "expired", url: "" }); await f.service.syncPayment(old.id);
    const latest = await f.service.retryPayment(first.id); expect(latest.payment.id).not.toBe(old.id); expect(f.keys).toHaveLength(2);
    const reopened = new RentalOrderService(f.config, f.deps); cleanup.push(() => reopened.close());
    f.provider.set(old.id, { ...old, status: "paid", url: "" }); const paid = await reopened.syncPayment(old.id);
    expect(paid.payment.status).toBe("paid"); expect(paid.payment.url).toBeUndefined();
    expect(paid.events.find(event => event.type === "payment_paid_previous_attempt_manual_reconciliation")?.note).toContain(latest.payment.id);
    await reopened.retryPayment(paid.id); expect(f.keys).toHaveLength(2);
    expect((await reopened.syncPayment(latest.payment.id!)).payment.status).toBe("paid");
    await reopened.dispatchOutbox(); expect(reopened.outbox(paid.id).filter(job => job.event === "accepted").every(job => job.state === "sent")).toBe(true);
    const version = reopened.get(paid.id).version; await reopened.syncPayment(old.id); expect(reopened.get(paid.id).version).toBe(version);
  });
  it("reports both payments needing reconciliation if a different attempt is also paid", async () => {
    const f = fixture(); const submitted = await f.service.submit(input(), "double-payment-review"); const first = await f.service.accept(submitted.id, submitted.version);
    const old = f.provider.get(first.payment.id!)!; f.provider.set(old.id, { ...old, status: "expired" }); await f.service.syncPayment(old.id);
    const latest = await f.service.retryPayment(first.id); const current = f.provider.get(latest.payment.id!)!;
    f.provider.set(current.id, { ...current, status: "paid" }); await f.service.syncPayment(current.id);
    f.provider.set(old.id, { ...old, status: "paid", url: "" }); const paid = await f.service.syncPayment(old.id);
    expect(paid.payment.status).toBe("paid"); expect(paid.payment.url).toBeUndefined();
    const event = paid.events.find(event => event.type === "payment_paid_previous_attempt_manual_reconciliation"); expect(event?.note).toContain(old.id); expect(event?.note).toContain(current.id);
    expect(f.service.outbox(paid.id).filter(job => job.event === "paid")).toHaveLength(2);
  });
  it("does not publish a new checkout if a previous payment settles while new creation is in flight", async () => {
    const f = fixture(); const submitted = await f.service.submit(input(), "inflight-older-payment"); const first = await f.service.accept(submitted.id, submitted.version);
    const old = f.provider.get(first.payment.id!)!; f.provider.set(old.id, { ...old, status: "expired" }); await f.service.syncPayment(old.id);
    const create = f.deps.gateway.createPayment; let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    f.deps.gateway.createPayment = async request => { await gate; return create(request); };
    const creation = f.service.retryPayment(first.id);
    f.provider.set(old.id, { ...old, status: "paid", url: "" }); await f.service.syncPayment(old.id);
    release(); const paid = await creation; expect(paid.payment.status).toBe("paid"); expect(paid.payment.url).toBeUndefined();
    const newPayment = [...f.provider.values()].find(payment => payment.id !== old.id)!;
    expect(paid.events.some(event => event.type === "payment_paid_previous_attempt_manual_reconciliation" && event.note?.includes(newPayment.id))).toBe(true);
    f.provider.set(newPayment.id, { ...newPayment, status: "paid" }); expect((await f.service.syncPayment(newPayment.id)).payment.status).toBe("paid");
    await f.service.retryPayment(first.id); expect(f.keys).toHaveLength(2);
  });
  it("keeps unsupported Unicode submitted without allocating invoice, payment or accepted mail", async () => {
    const f = fixture();
    f.deps.preflightDocument = async order => { await renderRentalDocument({ ...order, status: "accepted", invoice: { number: "PRUEFUNG", issuedAt: order.updatedAt } }, "invoice"); };
    const order = await f.service.submit(input({ customer: { ...customer, name: "王小明" } }), "unsupported-glyph-name");
    await expect(f.service.accept(order.id, order.version)).rejects.toMatchObject({ status: 409, code: "document_unavailable" });
    const unchanged = f.service.get(order.id); expect(unchanged.status).toBe("submitted"); expect(unchanged.version).toBe(order.version); expect(unchanged.invoice).toBeUndefined(); expect(f.keys).toEqual([]);
    expect(f.service.outbox(order.id).map(job => job.event)).toEqual(["received", "received"]);
    expect(unchanged.customer.name).toBe("王小明");
    const supported = await f.service.submit(input(), "supported-glyph-name");
    expect((await f.service.accept(supported.id, supported.version)).invoice?.number).toBe("TEST-2026-000001");
  });
  it("rechecks version and state after asynchronous document preflight", async () => {
    const f = fixture(); const other = new RentalOrderService(f.config, f.deps); cleanup.push(() => other.close());
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    f.deps.preflightDocument = async () => { await gate; };
    const order = await f.service.submit(input(), "preflight-racing-decline");
    const accepting = f.service.accept(order.id, order.version);
    const declined = await other.decline(order.id, order.version); expect(declined.status).toBe("declined");
    release(); await expect(accepting).rejects.toMatchObject({ status: 409 });
    expect(f.service.get(order.id).status).toBe("declined"); expect(f.service.get(order.id).invoice).toBeUndefined(); expect(f.keys).toEqual([]);
    expect(f.service.outbox(order.id).some(job => job.event === "accepted")).toBe(false);
  });
});
