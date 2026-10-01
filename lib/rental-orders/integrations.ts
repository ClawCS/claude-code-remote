import nodemailer from "nodemailer";
import type { RentalGatewayPayment, RentalMailEvent, RentalMailMessage, RentalMailSender, RentalOrder, RentalPaymentGateway, RentalPaymentStatus } from "./types";

const PROVIDER_ORIGIN = "https://api.mollie.com";
const PAYMENT_ID = /^tr_[A-Za-z0-9]{1,64}$/;
const ORDER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;
const HEADER_KEY = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;

/** Single bare address only: no display names, lists, quoted fields or header injection. */
export function assertRentalEmail(value: string): void {
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@<>,;:"\\\[\]()]+@[^\s@<>,;:"\\\[\]()]+\.[^\s@<>,;:"\\\[\]()]+$/.test(value) || CONTROL.test(value)) throw new Error("Ungültige einzelne E-Mail-Adresse.");
}
export function assertRentalHeader(value: string, max = 200): void {
  if (typeof value !== "string" || !value.trim() || value.length > max || CONTROL.test(value)) throw new Error("Ungültiger E-Mail-/Zahlungsheader.");
}
/** A checkout URL is a provider-controlled HTTPS page, never an arbitrary returned URL. */
export function trustedRentalCheckout(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hostname !== "www.mollie.com" || !url.pathname.startsWith("/checkout/")) throw new Error();
    return url.href;
  } catch { throw new Error("Ungültiger sicherer Zahlungslink."); }
}
function callback(value: string): string {
  try { const url = new URL(value); if (url.protocol !== "https:" || url.username || url.password || url.hash) throw new Error(); return url.href; }
  catch { throw new Error("Ungültige HTTPS-Zahlungsrückmeldung."); }
}
function cents(value: unknown): number {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d{0,12})\.\d{2}$/.test(value)) throw new Error("Zahlungsanbieter lieferte einen ungültigen Betrag.");
  const [whole, fraction] = value.split("."); const result = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error("Zahlungsanbieter lieferte einen ungültigen Betrag.");
  return result;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Zahlungsanbieter lieferte ungültige Daten."); return value as Record<string, unknown>;
}
function canonicalPayment(value: unknown): RentalGatewayPayment {
  const source = record(value); const amount = record(source.amount); const metadata = record(source.metadata);
  const states: Record<string, RentalPaymentStatus> = {open: "pending", pending: "pending", authorized: "pending", paid: "paid", failed: "failed", canceled: "canceled", expired: "expired"};
  if (source.resource !== "payment" || typeof source.id !== "string" || !PAYMENT_ID.test(source.id) || typeof source.status !== "string" || !Object.hasOwn(states, source.status) || amount.currency !== "EUR" || typeof metadata.orderId !== "string" || !ORDER_ID.test(metadata.orderId)) throw new Error("Zahlungsanbieter lieferte ungültige Zahlungsdaten.");
  const links = record(source._links); const checkout = links.checkout;
  const url = checkout == null ? "" : trustedRentalCheckout(String(record(checkout).href));
  const status = states[source.status]; if (status === "pending" && !url) throw new Error("Zahlungsanbieter lieferte keinen sicheren Zahlungslink.");
  return {id: source.id, url, status, orderId: metadata.orderId, amountCents: cents(amount.value), currency: "EUR"};
}

export function createMollieGateway(apiKey: string, fetcher: typeof fetch = fetch): RentalPaymentGateway {
  if (typeof apiKey !== "string" || !/^(?:test|live)_[A-Za-z0-9_-]{6,200}$/.test(apiKey)) throw new Error("Ungültige Zahlungsanbieter-Konfiguration.");
  async function request(endpoint: string, options: RequestInit): Promise<RentalGatewayPayment> {
    try {
      const response = await fetcher(`${PROVIDER_ORIGIN}${endpoint}`, {...options, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000), headers: {...options.headers, Authorization: `Bearer ${apiKey}`, Accept: "application/json"}});
      if (!response.ok) throw new Error();
      // Bound untrusted response memory as well as network duration.
      const reader = response.body?.getReader(); if (!reader) throw new Error();
      const chunks: Uint8Array[] = []; let size = 0;
      try { for (;;) { const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > 128_000) { await reader.cancel(); throw new Error(); } chunks.push(value); } }
      finally { reader.releaseLock(); }
      return canonicalPayment(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    } catch { throw new Error("Zahlungsanbieter-Anfrage fehlgeschlagen oder Antwort nicht verifizierbar."); }
  }
  return {
    async createPayment(input) {
      if (!ORDER_ID.test(input.orderId) || !Number.isSafeInteger(input.amountCents) || input.amountCents <= 0 || !HEADER_KEY.test(input.idempotencyKey)) throw new Error("Ungültige Zahlungsanforderung.");
      assertRentalHeader(input.orderNumber, 120);
      const redirectUrl = callback(input.redirectUrl), webhookUrl = callback(input.webhookUrl);
      const amountValue = `${Math.floor(input.amountCents / 100)}.${String(input.amountCents % 100).padStart(2, "0")}`;
      const result = await request("/v2/payments", {method: "POST", headers: {"Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey}, body: JSON.stringify({amount: {currency: "EUR", value: amountValue}, description: `Mietbestellung ${input.orderNumber}`, metadata: {orderId: input.orderId}, locale: "de_DE", redirectUrl, webhookUrl})});
      if (result.orderId !== input.orderId || result.amountCents !== input.amountCents) throw new Error("Zahlungsanbieter-Zahlung stimmt nicht mit der Bestellung überein.");
      return result;
    },
    async getPayment(id) {
      if (!PAYMENT_ID.test(id)) throw new Error("Ungültige Zahlungs-ID.");
      const result = await request(`/v2/payments/${id}`, {method: "GET"});
      if (result.id !== id) throw new Error("Zahlungsanbieter-Zahlungs-ID stimmt nicht überein."); return result;
    },
  };
}

export function createSmtpSender(options: {host: string; port: number; secure: boolean; user: string; pass: string; from: string}): RentalMailSender {
  assertRentalEmail(options.from);
  if (!options.host || options.host.length > 253 || !/^[A-Za-z0-9.:[\]-]+$/.test(options.host) || !Number.isInteger(options.port) || options.port < 1 || options.port > 65535 || typeof options.secure !== "boolean" || !options.user || !options.pass || CONTROL.test(options.user) || CONTROL.test(options.pass)) throw new Error("Ungültige SMTP-Konfiguration.");
  const transporter = nodemailer.createTransport({host: options.host, port: options.port, secure: options.secure, requireTLS: !options.secure, auth: {user: options.user, pass: options.pass}, tls: {rejectUnauthorized: true}, connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 20_000, dnsTimeout: 10_000, disableFileAccess: true, disableUrlAccess: true});
  return {async send(message: RentalMailMessage) {
    assertRentalEmail(message.to); assertRentalHeader(message.subject); assertRentalHeader(message.messageId);
    if (!/^<[A-Za-z0-9._-]+@[A-Za-z0-9.-]+>$/.test(message.messageId) || typeof message.text !== "string" || message.text.length > 200_000 || !Array.isArray(message.attachments) || message.attachments.length > 4) throw new Error("Ungültige E-Mail-Nachricht.");
    const attachments = message.attachments.map(item => { assertRentalHeader(item.filename, 150); if (/[\/\\]/.test(item.filename) || !(item.content instanceof Uint8Array) || item.content.byteLength > 20_000_000) throw new Error("Ungültiger E-Mail-Anhang."); return {filename: item.filename, content: Buffer.from(item.content), contentType: "application/pdf"}; });
    try {
      const result = await transporter.sendMail({from: options.from, to: message.to, envelope: {from: options.from, to: [message.to]}, subject: message.subject, text: message.text, messageId: message.messageId, attachments, disableFileAccess: true, disableUrlAccess: true});
      if (!Array.isArray(result.accepted) || result.accepted.length !== 1 || String(result.accepted[0]).toLowerCase() !== message.to.toLowerCase() || result.rejected?.length) throw new Error();
      return {id: message.messageId};
    } catch { const error = new Error("SMTP-Versand nicht bestätigt; der Zustellungsstatus kann unklar sein.") as Error & {code: string}; error.code = "SMTP_OUTCOME_UNKNOWN"; throw error; }
  }};
}

/** Lazy document import keeps SMTP/payment clients usable without loading PDF fonts. */
export async function buildRentalMessage(order: RentalOrder, event: RentalMailEvent, recipient: "customer" | "market", context: {marketEmail: string; statusUrl: string; termsText?: string; privacyText?: string}): Promise<RentalMailMessage> {
  return (await import("./documents")).buildRentalMessage(order, event, recipient, context);
}
