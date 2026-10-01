import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RentalOrder, RentalSubmitInput } from "../types";

const origin = "http://localhost:3000";
let dir: string;
let handlers: typeof import("../handlers");
let runtime: typeof import("../runtime");
let fetchSpy: ReturnType<typeof vi.fn>;
const customer = { name: "API Testkunde", email: "api-customer@example.invalid", phone: "0123456789", street: "Testweg 1", postalCode: "00000", city: "Teststadt", country: "DE" };

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
  dir = mkdtempSync(join(tmpdir(), "rental-handler-test-"));
  vi.stubEnv("RENTAL_MODE", "test"); vi.stubEnv("RENTAL_DATA_DIR", dir); vi.stubEnv("RENTAL_PUBLIC_ORIGIN", origin);
  vi.stubEnv("RENTAL_ADMIN_SECRET", "TEST-ONLY-isolated-api-admin-secret"); vi.stubEnv("RENTAL_SESSION_SECRET", "TEST-ONLY-isolated-api-session-secret");
  fetchSpy = vi.fn(async () => { throw new Error("External network forbidden in handler tests"); }); vi.stubGlobal("fetch", fetchSpy);
  handlers = await import("../handlers"); runtime = await import("../runtime");
});
afterEach(() => {
  const shared = globalThis as typeof globalThis & { jammersRentalRuntimes?: Map<string, { service: { close(): void } }> };
  for (const cached of shared.jammersRentalRuntimes?.values() || []) cached.service.close(); shared.jammersRentalRuntimes?.clear();
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers();
  rmSync(dir, { recursive: true, force: true });
});

function request(path: string, options: { body?: unknown; raw?: string; method?: string; cookie?: string; origin?: string | null; headers?: Record<string, string> } = {}): Request {
  const method = options.method || (options.body !== undefined || options.raw !== undefined ? "POST" : "GET");
  const headers: Record<string, string> = { ...(method === "GET" ? {} : { "Content-Type": "application/json", Origin: options.origin === null ? "" : options.origin || origin }), ...options.headers };
  if (options.origin === null) delete headers.Origin;
  if (options.cookie) headers.Cookie = options.cookie;
  return new Request(`${origin}${path}`, { method, headers, ...(options.raw !== undefined ? { body: options.raw } : options.body !== undefined ? { body: JSON.stringify(options.body) } : {}) });
}
function payload(method: "online" | "cash" = "online"): RentalSubmitInput {
  return { items: [{ id: 20012, quantity: 1, startDate: "2026-10-05", endDate: "2026-10-07" }], customer, paymentMethod: method, expectedTotalCents: 3000, acceptedTerms: true, termsVersion: "test-v1" };
}
async function login(): Promise<string> {
  const response = await handlers.rentalLoginHandler(request("/api/rental-admin/session", { body: { password: process.env.RENTAL_ADMIN_SECRET } }));
  expect(response.status).toBe(200); const cookie = response.headers.get("set-cookie")!;
  expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=Strict");
  return cookie.split(";")[0];
}
async function submit(method: "online" | "cash" = "online", nonce = "isolated-api-nonce-0001"): Promise<{ order: RentalOrder; statusUrl: string }> {
  const response = await handlers.rentalSubmitHandler(request("/api/rentals/orders", { body: payload(method), headers: { "Idempotency-Key": nonce } }));
  expect(response.status).toBe(201); return response.json();
}
async function action(order: RentalOrder, name: string, cookie: string): Promise<RentalOrder> {
  const response = await handlers.rentalAdminActionHandler(request(`/api/rental-admin/orders/${order.id}`, { body: { action: name, version: order.version }, cookie }), order.id);
  expect(response.status).toBe(200); return (await response.json()).order;
}
function syntheticLiveConfig(): string {
  const file = join(dir, "settings.json"), dataDir = join(dir, "private");
  writeFileSync(file, JSON.stringify({ issuer: { name: "Synthetic market", address: ["Test street 1"], taxNumber: "TEST TAX", vatRateBps: 1900, invoicePrefix: "RE" }, termsVersion: "v1", termsText: "Synthetic terms", privacyText: "Synthetic privacy", marketEmail: "market@example.invalid", publicOrigin: "https://rentals.example.invalid", selfPickupOnly: true, noExtraUpfrontCharges: true, onlinePayment: false }), { mode: 0o600 });
  for (const [name, value] of Object.entries({ RENTAL_MODE: "live", RENTAL_DATA_DIR: dataDir, RENTAL_SETTINGS_FILE: file, RENTAL_ADMIN_SECRET: "a".repeat(40), RENTAL_SESSION_SECRET: "s".repeat(40), SMTP_HOST: "smtp.example.invalid", SMTP_PORT: "465", SMTP_SECURE: "true", SMTP_USER: "synthetic", SMTP_PASS: "synthetic-password", SMTP_FROM: "sender@example.invalid" })) vi.stubEnv(name, value);
  return dataDir;
}

describe("rental handlers with real SQLite, captured mail and local test payments", () => {
  const rejectionProbes = [
    ["admin list", 401, () => handlers.rentalAdminListHandler(request("/api/rental-admin/orders"))],
    ["admin action", 401, () => handlers.rentalAdminActionHandler(request("/api/rental-admin/orders/unknown", { body: {} }), "unknown")],
    ["admin document", 401, () => handlers.rentalDocumentHandler(request("/api/rental-admin/orders/unknown/documents/invoice"), "unknown", "invoice", true)],
    ["outbox", 401, () => handlers.rentalOutboxHandler(request("/api/rental-admin/outbox", { body: {} }))],
    ["test inbox", 401, () => handlers.rentalTestMailsHandler(request("/api/rental-admin/test-mails"))],
    ["customer status", 404, () => handlers.rentalStatusHandler(request("/api/rentals/orders/unknown"), "unknown")],
    ["customer document", 404, () => handlers.rentalDocumentHandler(request("/api/rentals/orders/unknown/documents/invoice"), "unknown", "invoice")],
    ["test payment", 404, () => handlers.rentalTestPayHandler(request("/api/rentals/orders/unknown/test-payment", { body: {} }), "unknown")],
    ["missing submit origin", 403, () => handlers.rentalSubmitHandler(request("/api/rentals/orders", { body: payload(), origin: null, headers: { "Idempotency-Key": "no-origin-cold-runtime" } }))],
    ["non-loopback test request", 403, () => handlers.rentalAdminListHandler(new Request("https://public.example/api/rental-admin/orders"))],
    ["test-mode webhook", 404, () => handlers.rentalWebhookHandler(request("/api/rentals/webhook", { body: {} }))],
  ] as const;
  it.each(rejectionProbes)("rejects %s before creating private storage", async (_label, expectedStatus, probe) => {
    expect(readdirSync(dir)).toEqual([]);
    expect((await probe()).status).toBe(expectedStatus);
    expect(readdirSync(dir)).toEqual([]);
  });
  it.each(rejectionProbes)("preserves disabled 503 for %s without creating private storage", async (_label, _expectedStatus, probe) => {
    vi.stubEnv("RENTAL_MODE", "");
    expect((await probe()).status).toBe(503);
    expect(readdirSync(dir)).toEqual([]);
  });
  it.each([["missing ID", "{}", 400], ["invalid ID", "id=tr_bad%2Fid", 400], ["oversized body", "id=" + "x".repeat(2100), 413]] as const)("rejects malformed live webhook before creating private storage: %s", async (_label, body, expectedStatus) => {
    const dataDir = syntheticLiveConfig();
    expect(existsSync(dataDir)).toBe(false);
    const response = await handlers.rentalWebhookHandler(new Request("https://rentals.example.invalid/api/rentals/webhook", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }));
    expect(response.status).toBe(expectedStatus);
    expect(existsSync(dataDir)).toBe(false);
  });
  it("acknowledges a syntactically valid unknown webhook without creating orders or mail work", async () => {
    syntheticLiveConfig();
    const response = await handlers.rentalWebhookHandler(new Request("https://rentals.example.invalid/api/rentals/webhook", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "id=tr_unknown123" }));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ received: true });
    expect(runtime.rentalRuntime().service.list()).toEqual([]);
    expect(runtime.rentalRuntime().service.outbox()).toEqual([]);
  });
  it("rechecks the actual runtime session secret after request-body admission yields", async () => {
    const cookie = await login();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
    const pending = handlers.rentalAdminActionHandler(new Request(`${origin}/api/rental-admin/orders/unknown`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie }, body, duplex: "half" } as RequestInit), "unknown");
    vi.stubEnv("RENTAL_SESSION_SECRET", "TEST-ONLY-rotated-api-session-secret-long");
    controller.enqueue(new TextEncoder().encode(JSON.stringify({ action: "accept", version: 1 }))); controller.close();
    expect((await pending).status).toBe(401);
    expect(runtime.rentalRuntime().service.list()).toEqual([]);
    expect(runtime.rentalRuntime().service.outbox()).toEqual([]);
  });
  it("keeps ordering disabled by default without revealing secrets", async () => {
    vi.stubEnv("RENTAL_MODE", "");
    const config = await handlers.rentalConfigHandler(request("/api/rentals/config"));
    expect(config.status).toBe(200); expect(await config.json()).toMatchObject({ enabled: false, onlinePayment: false });
    const order = await handlers.rentalSubmitHandler(request("/api/rentals/orders", { body: payload(), headers: { "Idempotency-Key": "disabled-api-order" } }));
    expect(order.status).toBe(503); expect(await order.text()).not.toContain(process.env.RENTAL_ADMIN_SECRET!);
    expect((await handlers.rentalLoginHandler(request("/api/rental-admin/session", { body: { password: process.env.RENTAL_ADMIN_SECRET } }))).status).toBe(503);
  });
  it("returns 400 for malformed JSON in submit, login and authenticated actions", async () => {
    expect((await handlers.rentalSubmitHandler(request("/api/rentals/orders", { raw: "{", headers: { "Idempotency-Key": "malformed-json-nonce" } }))).status).toBe(400);
    expect((await handlers.rentalLoginHandler(request("/api/rental-admin/session", { raw: "{" }))).status).toBe(400);
    const cookie = await login();
    expect((await handlers.rentalAdminActionHandler(request("/api/rental-admin/orders/not-an-order", { raw: "{", cookie }), "not-an-order")).status).toBe(400);
    expect(runtime.rentalRuntime().service.list()).toEqual([]);
  });
  it("rejects oversized bodies without relying on Content-Length", async () => {
    const response = await handlers.rentalSubmitHandler(request("/api/rentals/orders", { raw: JSON.stringify({ notes: "x".repeat(33_000) }), headers: { "Idempotency-Key": "oversized-body-nonce" } }));
    expect(response.status).toBe(413); expect(runtime.rentalRuntime().service.list()).toEqual([]);
  });
  it.each(["customer(test)@example.invalid", "customer[alias]@example.invalid"])("rejects a mailbox unsupported by the actual delivery adapter: %s", async email => {
    const response = await handlers.rentalSubmitHandler(request("/api/rentals/orders", { body: { ...payload(), customer: { ...customer, email } }, headers: { "Idempotency-Key": "single-email-format-test" } }));
    expect(response.status).toBe(400); expect(runtime.rentalRuntime().service.list()).toEqual([]);
  });
  it("requires admin authentication independently of customer bearer links", async () => {
    const { order, statusUrl } = await submit(); const token = new URL(statusUrl).searchParams.get("token")!;
    expect((await handlers.rentalAdminListHandler(request("/api/rental-admin/orders"))).status).toBe(401);
    expect((await handlers.rentalAdminActionHandler(request(`/api/rental-admin/orders/${order.id}`, { body: { action: "accept", version: order.version }, cookie: `jammers-rental-admin=${token}` }), order.id)).status).toBe(401);
    expect((await handlers.rentalDocumentHandler(request(`/api/rental-admin/orders/${order.id}/documents/invoice?token=${token}`), order.id, "invoice", true)).status).toBe(401);
    expect((await handlers.rentalTestMailsHandler(request("/api/rental-admin/test-mails"))).status).toBe(401);
    expect(runtime.rentalRuntime().service.get(order.id).status).toBe("submitted");
  });
  it.each([null, "https://attacker.example"])("rejects authenticated cross-origin writes with Origin %s", async wrongOrigin => {
    const cookie = await login(); const { order } = await submit();
    const response = await handlers.rentalAdminActionHandler(request(`/api/rental-admin/orders/${order.id}`, { body: { action: "accept", version: order.version }, cookie, origin: wrongOrigin }), order.id);
    expect(response.status).toBe(403); expect(runtime.rentalRuntime().service.get(order.id).status).toBe("submitted");
    expect((await handlers.rentalOutboxHandler(request("/api/rental-admin/outbox", { body: {}, cookie, origin: wrongOrigin }))).status).toBe(403);
  });
  it("rejects a cross-site fetch hint even when Origin is supplied as the expected origin", async () => {
    const response = await handlers.rentalSubmitHandler(request("/api/rentals/orders", { body: payload(), headers: { "Idempotency-Key": "cross-site-hint-test", "Sec-Fetch-Site": "cross-site" } }));
    expect(response.status).toBe(403); expect(runtime.rentalRuntime().service.list()).toEqual([]);
  });
  it("requires a correct order-scoped token and never marks paid from redirect parameters", async () => {
    const { order, statusUrl } = await submit();
    expect((await handlers.rentalStatusHandler(request(`/api/rentals/orders/${order.id}`), order.id)).status).toBe(404);
    const valid = new URL(statusUrl); const wrong = new URL(valid); wrong.searchParams.set("token", "wrong-token");
    expect((await handlers.rentalStatusHandler(new Request(wrong), order.id)).status).toBe(404);
    expect((await handlers.rentalStatusHandler(new Request(valid), "other-order")).status).toBe(404);
    valid.searchParams.set("paid", "true"); valid.searchParams.set("payment_status", "paid");
    const response = await handlers.rentalStatusHandler(new Request(valid), order.id);
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store"); expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect((await response.json()).order.payment.status).toBe("not_requested");
  });
  it("refuses test-mode requests addressed to a non-loopback origin", async () => {
    expect((await handlers.rentalConfigHandler(new Request("https://public.example/api/rentals/config"))).status).toBe(403);
    expect((await handlers.rentalAdminListHandler(new Request("https://public.example/api/rental-admin/orders"))).status).toBe(403);
    expect((await handlers.rentalWebhookHandler(request("/api/rentals/webhook", { body: { id: "tr_fake" } }))).status).toBe(404);
  });
  it.each(["online", "cash"] as const)("completes the %s workflow through handlers with real PDFs and separate captured recipient messages", async method => {
    const cookie = await login(); const submitted = await submit(method); const tokenUrl = new URL(submitted.statusUrl);
    expect(submitted.order.status).toBe("submitted"); expect(submitted.order.invoice).toBeUndefined();
    const early = await handlers.rentalDocumentHandler(new Request(tokenUrl), submitted.order.id, "invoice"); expect(early.status).toBe(404);
    let order = await action(submitted.order, "accept", cookie); expect(order.status).toBe("accepted"); expect(order.invoice?.number).toBe("TEST-2026-000001"); expect(order.deliveryNote).toBeUndefined();
    const invoice = await handlers.rentalDocumentHandler(new Request(tokenUrl), order.id, "invoice"); expect(invoice.status).toBe(200); expect(invoice.headers.get("content-type")).toBe("application/pdf"); expect(Buffer.from(await invoice.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
    if (method === "online") {
      expect(order.payment.status).toBe("pending"); expect(order.payment.id).toMatch(/^test_/);
      const response = await handlers.rentalTestPayHandler(request(`/api/rentals/orders/${order.id}/test-payment${tokenUrl.search}`, { method: "POST" }), order.id);
      expect(response.status).toBe(200); order = (await response.json()).order;
    } else { expect(order.payment.id).toBeUndefined(); order = await action(order, "cash", cookie); }
    expect(order.payment.status).toBe("paid"); order = await action(order, "handover", cookie); expect(order.deliveryNote?.number).toBe("TEST-LS-2026-000001");
    const delivery = await handlers.rentalDocumentHandler(new Request(tokenUrl), order.id, "delivery_note"); expect(delivery.status).toBe(200);
    order = await action(order, "return", cookie); expect(order.status).toBe("returned");
    const inbox = await handlers.rentalTestMailsHandler(request("/api/rental-admin/test-mails", { cookie })); expect(inbox.status).toBe(200);
    const messages = (await inbox.json()).messages as { to: string; attachments: { filename: string; contentBase64?: string }[]; text: string }[];
    expect(messages.filter(message => message.to === customer.email)).toHaveLength(5); expect(messages.filter(message => message.to === "market@example.invalid")).toHaveLength(5);
    expect(messages.every(message => message.attachments.every(attachment => attachment.contentBase64 === undefined))).toBe(true);
    expect(runtime.rentalRuntime().service.outbox(order.id).every(job => job.state === "sent")).toBe(true);
  }, 20_000);
  it("uses real route wrappers and rejects tampered prices without storing an order", async () => {
    const { POST } = await import("@/app/api/rentals/orders/route");
    const response = await POST(request("/api/rentals/orders", { body: { ...payload(), expectedTotalCents: 1 }, headers: { "Idempotency-Key": "forged-price-route" } }));
    expect(response.status).toBe(409); expect(runtime.rentalRuntime().service.list()).toEqual([]);
    const { GET } = await import("@/app/api/rentals/orders/[id]/route");
    expect((await GET(request("/api/rentals/orders/unknown"), { params: Promise.resolve({ id: "unknown" }) })).status).toBe(404);
  });
  it("requires the actual runtime PDF preflight before accepting an unsupported customer name", async () => {
    const cookie = await login();
    const submitted = await handlers.rentalSubmitHandler(request("/api/rentals/orders", { body: { ...payload(), customer: { ...customer, name: "王小明" } }, headers: { "Idempotency-Key": "api-document-preflight" } }));
    expect(submitted.status).toBe(201); const order = (await submitted.json()).order as RentalOrder;
    const response = await handlers.rentalAdminActionHandler(request(`/api/rental-admin/orders/${order.id}`, { body: { action: "accept", version: order.version }, cookie }), order.id);
    expect(response.status).toBe(409);
    const saved = runtime.rentalRuntime().service.get(order.id);
    expect(saved.status).toBe("submitted"); expect(saved.invoice).toBeUndefined(); expect(saved.payment.status).toBe("not_requested"); expect(saved.customer.name).toBe("王小明");
    expect(runtime.rentalRuntime().service.outbox(order.id).map(job => job.event)).toEqual(["received", "received"]);
  });
});
