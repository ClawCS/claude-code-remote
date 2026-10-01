import { afterEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import type { RentalMailMessage } from "./types";

async function adapters() {
  const implementation = await import("./integrations").catch(() => null);
  expect(implementation, "payment and SMTP adapters must exist").not.toBeNull();
  return implementation!;
}
const input = { orderId: "order-123", orderNumber: "TEST-2026-001", amountCents: 30001,
  redirectUrl: "https://rentals.example.invalid/status/token", webhookUrl: "https://rentals.example.invalid/api/payment",
  idempotencyKey: "order-123:payment:1" };
function payment(overrides: Record<string, unknown> = {}) {
  return { resource: "payment", id: "tr_1234567890", status: "open", mode: "test",
    amount: { currency: "EUR", value: "300.01" }, metadata: { orderId: "order-123" },
    _links: { checkout: { href: "https://www.mollie.com/checkout/select-method/test123", type: "text/html" } }, ...overrides };
}
afterEach(() => vi.restoreAllMocks());

describe("Mollie rental payment boundary", () => {
  it("posts exact cents, order metadata, German locale and provider idempotency without selecting a nonexistent method", async () => {
    const { createMollieGateway } = await adapters();
    const requests: {url: string; options?: RequestInit}[] = [];
    const fetcher = async (url: string | URL | Request, options?: RequestInit) => {
      requests.push({ url: String(url), options }); return Response.json(payment(), { status: 201 });
    };
    const result = await createMollieGateway("test_PRIVATE_KEY", fetcher).createPayment(input);
    expect(result).toMatchObject({ id: "tr_1234567890", status: "pending", orderId: "order-123", amountCents: 30001, currency: "EUR" });
    expect(requests[0].url).toBe("https://api.mollie.com/v2/payments");
    expect(requests[0].options?.method).toBe("POST");
    const headers = new Headers(requests[0].options?.headers);
    expect(headers.get("Authorization")).toBe("Bearer test_PRIVATE_KEY");
    expect(headers.get("Idempotency-Key")).toBe("order-123:payment:1");
    expect(JSON.parse(String(requests[0].options?.body))).toEqual({ amount: {currency: "EUR", value: "300.01"},
      description: "Mietbestellung TEST-2026-001", metadata: {orderId: "order-123"}, locale: "de_DE",
      redirectUrl: input.redirectUrl, webhookUrl: input.webhookUrl });
    expect(requests[0].options?.redirect).toBe("error");
    expect(requests[0].options?.signal).toBeInstanceOf(AbortSignal);
  });
  it.each([
    { amount: {currency: "EUR", value: "300.02"} }, { amount: {currency: "USD", value: "300.01"} },
    { metadata: {orderId: "another-order"} }, { amount: {currency: "EUR", value: "3e2"} },
    { _links: {checkout: {href: "https://www.mollie.com.evil.invalid/checkout"}} },
    { _links: {checkout: {href: "http://www.mollie.com/checkout"}} },
    { _links: {checkout: {href: "https://user:secret@www.mollie.com/checkout"}} },
    { status: "refunded" }, { resource: "customer" },
  ])("rejects mismatched or untrusted provider output %j", async override => {
    const { createMollieGateway } = await adapters();
    await expect(createMollieGateway("test_PRIVATE_KEY", async () => Response.json(payment(override))).createPayment(input)).rejects.toThrow();
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])("never requests an invalid amount %s", async amountCents => {
    const { createMollieGateway } = await adapters(); let calls = 0;
    const gateway = createMollieGateway("test_PRIVATE_KEY", async () => { calls++; return Response.json(payment()); });
    await expect(gateway.createPayment({...input, amountCents})).rejects.toThrow(); expect(calls).toBe(0);
  });
  it.each(["http://rentals.example.invalid/status", "https://user:pass@rentals.example.invalid/status", "javascript:alert(1)"])("rejects an unsafe callback before HTTP: %s", async redirectUrl => {
    const { createMollieGateway } = await adapters(); let calls = 0;
    const gateway = createMollieGateway("test_PRIVATE_KEY", async () => { calls++; return Response.json(payment()); });
    await expect(gateway.createPayment({...input, redirectUrl})).rejects.toThrow(); expect(calls).toBe(0);
  });
  it("gets canonical state from the fixed API and rejects a different response ID", async () => {
    const { createMollieGateway } = await adapters(); const urls: string[] = [];
    const gateway = createMollieGateway("test_PRIVATE_KEY", async url => { urls.push(String(url)); return Response.json(payment({status: "paid", _links: {checkout: null}})); });
    expect(await gateway.getPayment("tr_1234567890")).toMatchObject({status: "paid", amountCents: 30001, orderId: "order-123", url: ""});
    expect(urls).toEqual(["https://api.mollie.com/v2/payments/tr_1234567890"]);
    await expect(gateway.getPayment("tr_DIFFERENT")).rejects.toThrow();
    await expect(gateway.getPayment("tr_../../secrets")).rejects.toThrow();
  });
  it("recovers an idempotent creation that is already paid and no longer has a checkout link", async () => {
    const { createMollieGateway } = await adapters();
    const gateway = createMollieGateway("test_PRIVATE_KEY", async () => Response.json(payment({status: "paid", _links: {checkout: null}})));
    expect(await gateway.createPayment(input)).toMatchObject({id: "tr_1234567890", status: "paid", orderId: input.orderId, amountCents: input.amountCents, currency: "EUR", url: ""});
  });
  it.each([["open", "pending"], ["pending", "pending"], ["authorized", "pending"], ["paid", "paid"], ["failed", "failed"], ["canceled", "canceled"], ["expired", "expired"]])("maps %s to %s without treating authorization as payment", async (status, expected) => {
    const { createMollieGateway } = await adapters();
    const result = await createMollieGateway("test_PRIVATE_KEY", async () => Response.json(payment({status}))).getPayment("tr_1234567890");
    expect(result.status).toBe(expected);
  });
  it("sanitizes provider and transport errors instead of leaking secrets or response bodies", async () => {
    const { createMollieGateway } = await adapters();
    for (const fetcher of [async () => new Response("PRIVATE CUSTOMER test_PRIVATE_KEY", {status: 422}), async () => { throw new Error("private-url?token=SECRET"); }]) {
      await expect(createMollieGateway("test_PRIVATE_KEY", fetcher).createPayment(input)).rejects.toThrow(/Zahlungsanbieter/);
      try { await createMollieGateway("test_PRIVATE_KEY", fetcher).createPayment(input); } catch (error) { expect(String(error)).not.toMatch(/PRIVATE|SECRET|test_PRIVATE_KEY|private-url/); }
    }
  });
  it("rejects header injection in API keys and idempotency keys", async () => {
    const { createMollieGateway } = await adapters();
    expect(() => createMollieGateway("test_x\r\nInjected: secret")).toThrow();
    await expect(createMollieGateway("test_PRIVATE_KEY", async () => Response.json(payment())).createPayment({...input, idempotencyKey: "x\r\nInjected: secret"})).rejects.toThrow();
  });
});

const smtpOptions = {host: "smtp.example.invalid", port: 587, secure: false, user: "operator", pass: "SECRET", from: "sender@example.invalid"};
const message: RentalMailMessage = {to: "customer@example.invalid", subject: "Bestellung TEST-001", text: "Nur Text", messageId: "<rental-abc@example.invalid>", attachments: [{filename: "rechnung.pdf", content: new Uint8Array([1,2,3])}]};
describe("isolated SMTP boundary", () => {
  it("uses verified TLS, bounded timeouts, one envelope recipient and bytes-only attachments", async () => {
    const { createSmtpSender } = await adapters(); const sent: Record<string, unknown>[] = [];
    const create = vi.spyOn(nodemailer, "createTransport").mockReturnValue({sendMail: async (mail: Record<string, unknown>) => { sent.push(mail); return {messageId: message.messageId, accepted: [message.to], rejected: []}; }} as never);
    expect(await createSmtpSender(smtpOptions).send(message)).toEqual({id: message.messageId});
    expect(create.mock.calls[0][0]).toMatchObject({host: smtpOptions.host, port: 587, secure: false, requireTLS: true,
      tls: {rejectUnauthorized: true}, disableFileAccess: true, disableUrlAccess: true});
    expect(sent[0]).toMatchObject({from: smtpOptions.from, to: message.to, envelope: {from: smtpOptions.from, to: [message.to]}, subject: message.subject, text: message.text, messageId: message.messageId});
    expect(sent[0]).not.toHaveProperty("cc"); expect(sent[0]).not.toHaveProperty("bcc"); expect(sent[0]).not.toHaveProperty("html");
    const attachments = sent[0].attachments as {content: Buffer}[]; expect(attachments[0].content).toEqual(Buffer.from([1,2,3]));
  });
  it.each(["customer@example.invalid,other@example.invalid", "customer@example.invalid\r\nBcc: other@example.invalid"])("rejects multiple/injected recipients before SMTP: %s", async to => {
    const { createSmtpSender } = await adapters(); let sends = 0;
    vi.spyOn(nodemailer, "createTransport").mockReturnValue({sendMail: async () => { sends++; return {}; }} as never);
    await expect(createSmtpSender(smtpOptions).send({...message, to})).rejects.toThrow(); expect(sends).toBe(0);
  });
  it.each([{subject: "Hello\r\nBcc: attacker@example.invalid"}, {messageId: "<ok@example.invalid>\r\nBcc: x"}, {attachments: [{filename: "bad\r\nname.pdf", content: new Uint8Array()}]}])("rejects injected headers %j", async override => {
    const { createSmtpSender } = await adapters(); let sends = 0;
    vi.spyOn(nodemailer, "createTransport").mockReturnValue({sendMail: async () => { sends++; return {}; }} as never);
    await expect(createSmtpSender(smtpOptions).send({...message, ...override})).rejects.toThrow(); expect(sends).toBe(0);
  });
  it("reports SMTP failure without exposing credentials and does not claim failed delivery succeeded", async () => {
    const { createSmtpSender } = await adapters();
    vi.spyOn(nodemailer, "createTransport").mockReturnValue({sendMail: async () => { throw new Error("SECRET customer@example.invalid"); }} as never);
    await expect(createSmtpSender(smtpOptions).send(message)).rejects.toThrow(/SMTP/);
    try { await createSmtpSender(smtpOptions).send(message); } catch (error) {expect(String(error)).not.toMatch(/SECRET|customer@example/);}
  });
});
