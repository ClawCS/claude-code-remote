import { createHash, randomUUID } from "node:crypto";
import { getRentalItem } from "@/data/rentals";
import { quoteRentals, type RentalQuote, type RentalSelection } from "@/lib/rental-pricing";
import type { RentalRuntimeConfig } from "./config";
import { RentalOrderStore } from "./store";
import type { RentalCustomer, RentalGatewayPayment, RentalMailEvent, RentalMailMessage, RentalMailSender, RentalOrder, RentalOutboxJob, RentalPaymentGateway, RentalSubmitInput } from "./types";

export class RentalOrderError extends Error {
  constructor(message: string, public readonly code: string = "validation", public readonly status: number = 400) { super(message); this.name = "RentalOrderError"; }
}
export type RentalMessageContext = { marketEmail: string; statusUrl: string; termsText: string; privacyText: string };
export type RentalServiceDependencies = {
  gateway?: RentalPaymentGateway; sender: RentalMailSender;
  /** Runtime supplies a real invoice-render check; no state, number or payment is created by it. */
  preflightDocument?: (order: RentalOrder) => Promise<void>;
  buildMessage: (order: RentalOrder, event: RentalMailEvent, recipient: "customer" | "market", context: RentalMessageContext) => Promise<RentalMailMessage>;
  statusUrl: (orderId: string) => string; now?: () => Date;
};

const fail = (message: string, code = "validation", status = 400): never => { throw new RentalOrderError(message, code, status); };
const terminalPayment = (status: string) => ["failed", "canceled", "expired"].includes(status);
function berlinDay(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)!.value).join("-");
}
function fingerprint(value: unknown): string {
  const canonical = (v: unknown, depth: number): unknown => {
    if (depth > 8) return fail("Ungültige Bestelldaten.");
    if (Array.isArray(v)) return v.map(x => canonical(x, depth + 1));
    if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map(key => [key, canonical((v as Record<string, unknown>)[key], depth + 1)]));
    return v;
  };
  const encoded = JSON.stringify(canonical(value, 0));
  if (!encoded || encoded.length > 64_000) fail("Bestelldaten sind zu umfangreich.");
  return createHash("sha256").update(encoded).digest("hex");
}
function customerData(value: unknown): RentalCustomer {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("Kontaktdaten fehlen.");
  const source = value as Record<string, unknown>;
  const field = (name: string, max: number, optional = false, multiline = false): string => {
    const raw = source[name];
    if (optional && raw === undefined) return "";
    if (typeof raw !== "string" || raw.length > max || (!optional && !raw.trim()) || (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(raw)) return fail("Kontaktdaten sind unvollständig oder ungültig.");
    return raw.trim();
  };
  const data = { name: field("name", 160), email: field("email", 254), phone: field("phone", 50), street: field("street", 200), postalCode: field("postalCode", 20), city: field("city", 100), country: field("country", 100), company: field("company", 160, true), notes: field("notes", 2000, true, true) };
  if (!/^[^\s@<>,;:"\\\[\]()]+@[^\s@<>,;:"\\\[\]()]+\.[^\s@<>,;:"\\\[\]()]+$/.test(data.email)) fail("Bitte eine gültige E-Mail-Adresse eingeben.");
  return data;
}

export class RentalOrderService {
  private readonly store: RentalOrderStore;
  private readonly now: () => Date;
  constructor(private readonly config: RentalRuntimeConfig, private readonly dependencies: RentalServiceDependencies) {
    if (!config.enabled || config.mode === "disabled") fail("Bestellungen sind nicht freigeschaltet.", "disabled", 503);
    this.store = new RentalOrderStore(config.dataDir, config.mode === "test" ? "test" : "live");
    this.now = dependencies.now || (() => new Date());
  }
  close(): void { this.store.close(); }
  get(id: string): RentalOrder { return this.store.get(id) || fail("Bestellung nicht gefunden.", "not_found", 404); }
  list(): RentalOrder[] { return this.store.list(); }
  outbox(orderId?: string): RentalOutboxJob[] { return this.store.outbox(orderId); }

  async submit(input: RentalSubmitInput, idempotencyKey: string): Promise<RentalOrder> {
    if (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) fail("Gültiger Idempotenzschlüssel erforderlich.");
    const hash = fingerprint(input);
    return this.store.transaction(() => {
      const existing = this.store.byNonce(idempotencyKey);
      if (existing) {
        if (existing.hash !== hash) fail("Idempotenzschlüssel wurde bereits für andere Bestelldaten verwendet.", "conflict", 409);
        return existing.order;
      }
      if (!input || typeof input !== "object" || input.acceptedTerms !== true || input.termsVersion !== this.config.termsVersion) fail("Bitte die aktuellen Mietbedingungen bestätigen.");
      if (!["online", "cash"].includes(input.paymentMethod) || (input.paymentMethod === "online" && (!this.config.onlinePayment || !this.dependencies.gateway))) fail("Diese Zahlungsart ist nicht verfügbar.");
      const customer = customerData(input.customer);
      let quote: RentalQuote;
      try { quote = quoteRentals(input.items, { requireFuture: true, today: berlinDay(this.now()) }); }
      catch { return fail("Artikel, Mengen oder Mietzeitraum sind ungültig oder nicht verfügbar."); }
      if (!quote.allPriced || quote.totalCents === null || quote.totalCents <= 0) fail("Für diese Auswahl kann noch kein vollständiger Mietpreis ermittelt werden.");
      if (!Number.isSafeInteger(input.expectedTotalCents) || input.expectedTotalCents !== quote.totalCents) fail("Der Mietpreis hat sich geändert. Bitte den aktuellen Gesamtpreis bestätigen.", "conflict", 409);
      const now = this.now().toISOString();
      const order: RentalOrder = { id: randomUUID(), number: this.store.nextNumber(this.config.mode === "test" ? "TEST-B" : "B", berlinDay(this.now()).slice(0, 4)), createdAt: now, updatedAt: now, version: 1, status: "submitted", paymentMethod: input.paymentMethod, payment: { status: "not_requested", attempt: 0 }, customer, quote, termsVersion: this.config.termsVersion, termsText: this.config.termsText, privacyText: this.config.privacyText, testMode: this.config.mode === "test", issuer: structuredClone(this.config.issuer), events: [{ at: now, type: "submitted" }] };
      this.store.insert(order, idempotencyKey, hash); this.store.queue(order, "received");
      return order;
    });
  }

  private version(order: RentalOrder, expected: number): void {
    if (!Number.isSafeInteger(expected) || expected !== order.version) fail("Bestellung wurde zwischenzeitlich geändert. Bitte neu laden.", "conflict", 409);
  }
  private saveEvent(order: RentalOrder, type: string, mail?: RentalMailEvent, note?: string): RentalOrder {
    order.version++; order.updatedAt = this.now().toISOString(); order.events.push({ at: order.updatedAt, type, ...(note ? { note } : {}) });
    this.store.save(order); if (mail) this.store.queue(order, mail); return order;
  }

  private assertReservation(order: RentalOrder): void {
    const candidates = order.quote.lines;
    const overlapping = (a: RentalSelection, b: RentalSelection) => a.startDate <= b.endDate && b.startDate <= a.endDate;
    const reserved = this.store.list().filter(other => other.id !== order.id && ["accepted", "handed_over", "returned"].includes(other.status)).flatMap(other => other.quote.lines).filter(line => candidates.some(candidate => overlapping(line, candidate)));
    const all = [...candidates, ...reserved];
    for (const line of candidates) {
      const conflicts = all.some(other => overlapping(line, other) && ((line.id === 20007 && [20005, 20006].includes(other.id)) || (other.id === 20007 && [20005, 20006].includes(line.id))));
      if (conflicts) fail("Gemeinsam genutztes Mobiliar ist im Mietzeitraum nicht verfügbar.", "conflict", 409);
    }
    for (const id of new Set(candidates.map(line => line.id))) {
      const stock = getRentalItem(id)?.physicalStock || 0;
      // Check every start boundary. All starts that fall on an inclusive return day still overlap.
      const lines = all.filter(line => line.id === id);
      for (const start of new Set(lines.map(line => line.startDate))) {
        const quantity = lines.filter(line => line.startDate <= start && line.endDate >= start).reduce((sum, line) => sum + line.quantity, 0);
        if (quantity > stock) fail("Der Bestand ist für diesen Mietzeitraum nicht mehr verfügbar.", "conflict", 409);
      }
    }
  }

  async accept(id: string, expectedVersion: number): Promise<RentalOrder> {
    const candidate = this.get(id);
    if (candidate.status === "submitted" && this.dependencies.preflightDocument) {
      this.version(candidate, expectedVersion);
      try { await this.dependencies.preflightDocument(structuredClone(candidate)); }
      catch { return fail("Die Rechnung kann für diese Angaben noch nicht erstellt werden. Bitte den Markt kontaktieren; die Bestellung wurde nicht angenommen und es wurde keine Zahlung angefordert.", "document_unavailable", 409); }
    }
    const accepted = this.store.transaction(() => {
      const order = this.get(id);
      if (["accepted", "handed_over", "returned"].includes(order.status)) return order;
      this.version(order, expectedVersion);
      if (order.status !== "submitted") return fail("Nur eingegangene Bestellungen können angenommen werden.", "conflict", 409);
      let canonical: RentalQuote;
      try { canonical = quoteRentals(order.quote.lines, { requireFuture: true, today: berlinDay(this.now()) }); }
      catch { return fail("Der gespeicherte Mietpreis oder Abholtermin ist nicht mehr gültig. Eine neue Bestellung ist erforderlich.", "conflict", 409); }
      if (JSON.stringify(canonical) !== JSON.stringify(order.quote)) fail("Der Mietpreis wurde geändert. Eine neue Bestellung ist erforderlich.", "conflict", 409);
      this.assertReservation(order);
      order.status = "accepted";
      order.invoice = { number: this.store.nextNumber(order.issuer.invoicePrefix, berlinDay(this.now()).slice(0, 4)), issuedAt: this.now().toISOString() };
      return this.saveEvent(order, "accepted", "accepted");
    });
    return accepted.paymentMethod === "online" && accepted.status === "accepted" && accepted.payment.status === "not_requested" ? this.retryPayment(id) : accepted;
  }

  async decline(id: string, expectedVersion: number): Promise<RentalOrder> {
    return this.store.transaction(() => {
      const order = this.get(id); if (order.status === "declined") return order; this.version(order, expectedVersion);
      if (order.status !== "submitted") return fail("Nur eingegangene Bestellungen können abgelehnt werden.", "conflict", 409);
      order.status = "declined"; return this.saveEvent(order, "declined", "declined");
    });
  }

  async recordCash(id: string, expectedVersion: number): Promise<RentalOrder> {
    return this.store.transaction(() => {
      const order = this.get(id);
      if (order.paymentMethod !== "cash") return fail("Diese Bestellung ist keine Barzahlung.", "conflict", 409);
      if (order.payment.status === "paid") return order;
      this.version(order, expectedVersion);
      if (order.status !== "accepted") return fail("Barzahlung erst nach Annahme erfassen.", "conflict", 409);
      order.payment.status = "paid"; return this.saveEvent(order, "cash_received", "paid");
    });
  }

  async handover(id: string, expectedVersion: number): Promise<RentalOrder> {
    return this.store.transaction(() => {
      const order = this.get(id); if (["handed_over", "returned"].includes(order.status)) return order; this.version(order, expectedVersion);
      if (order.status !== "accepted" || order.payment.status !== "paid") return fail("Übergabe erst nach Annahme und vollständig bezahlt möglich.", "conflict", 409);
      order.status = "handed_over";
      order.deliveryNote = { number: this.store.nextNumber(`${order.issuer.invoicePrefix}-LS`, berlinDay(this.now()).slice(0, 4)), issuedAt: this.now().toISOString() };
      return this.saveEvent(order, "handed_over", "handed_over");
    });
  }

  async returned(id: string, expectedVersion: number): Promise<RentalOrder> {
    return this.store.transaction(() => {
      const order = this.get(id); if (order.status === "returned") return order; this.version(order, expectedVersion);
      if (order.status !== "handed_over") return fail("Rückgabe erst nach tatsächlicher Übergabe erfassen.", "conflict", 409);
      order.status = "returned"; return this.saveEvent(order, "returned", "returned");
    });
  }

  private validatePayment(payment: RentalGatewayPayment, order: RentalOrder, expectedId?: string): void {
    if (!payment || !payment.id || (expectedId && payment.id !== expectedId) || payment.orderId !== order.id || payment.amountCents !== order.quote.totalCents || payment.currency !== "EUR" || !["pending", "paid", "failed", "canceled", "expired"].includes(payment.status)) fail("Zahlungsdaten stimmen nicht mit der Bestellung überein.", "payment", 502);
    // Providers may remove checkout links once no further checkout interaction is possible.
    if (!payment.url && payment.status !== "pending") return;
    try { const url = new URL(payment.url); if (url.username || url.password || (url.protocol !== "https:" && !(order.testMode && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new Error(); }
    catch { fail("Ungültiger Zahlungslink.", "payment", 502); }
  }

  async retryPayment(id: string): Promise<RentalOrder> {
    const gateway = this.dependencies.gateway;
    const claim = this.store.transaction(() => {
      const order = this.get(id);
      if (!gateway || order.paymentMethod !== "online" || order.status !== "accepted") return fail("Onlinezahlung ist für diese Bestellung nicht verfügbar.", "conflict", 409);
      if (order.payment.status === "paid" || (order.payment.id && !terminalPayment(order.payment.status))) return undefined;
      if (order.payment.attempt > 0 && !order.payment.id) {
        const requestedAt = order.events.findLast(event => event.type === "payment_requested")?.at;
        const elapsed = requestedAt ? this.now().getTime() - new Date(requestedAt).getTime() : Infinity;
        if (!Number.isFinite(elapsed) || elapsed >= 12 * 3600_000) {
          if (!order.events.some(event => event.type === "payment_manual_reconciliation_required")) this.saveEvent(order, "payment_manual_reconciliation_required");
          return { manualReconciliation: true as const };
        }
      }
      const nextAttempt = order.payment.attempt === 0 || (order.payment.id && terminalPayment(order.payment.status)) ? order.payment.attempt + 1 : order.payment.attempt;
      const work = this.store.claimPayment(id, nextAttempt, this.now().toISOString(), new Date(this.now().getTime() + 300_000).toISOString());
      if (!work) return undefined;
      if (order.payment.attempt !== nextAttempt) {
        order.payment = { status: "pending", attempt: nextAttempt }; this.saveEvent(order, "payment_requested");
      }
      return { ...work, order };
    });
    if (!claim) return this.get(id);
    if ("manualReconciliation" in claim) return fail("Zahlungsausgang seit mindestens zwölf Stunden unklar. Bitte manuell beim Zahlungsanbieter abgleichen; keine neue Zahlung anlegen.", "payment_reconciliation", 409);
    try {
      const payment = await gateway!.createPayment({ orderId: id, orderNumber: claim.order.number, amountCents: claim.order.quote.totalCents!, redirectUrl: this.dependencies.statusUrl(id), webhookUrl: `${this.config.publicOrigin}/api/rentals/webhook`, idempotencyKey: claim.key });
      this.validatePayment(payment, claim.order);
      this.store.transaction(() => {
        if (!this.store.paymentClaimValid(id, claim.token)) return;
        const order = this.get(id);
        this.store.recordPayment({ id: payment.id, orderId: id, attempt: claim.order.payment.attempt, status: payment.status });
        if (order.payment.status !== "paid") {
          order.payment = { id: payment.id, url: payment.url, status: payment.status, attempt: claim.order.payment.attempt };
          this.saveEvent(order, "payment_created", payment.status === "paid" ? "paid" : undefined);
        } else if (order.payment.id !== payment.id) {
          delete order.payment.url;
          this.saveEvent(order, "payment_paid_previous_attempt_manual_reconciliation", undefined, `Zahlung ${order.payment.id} ist bereits bezahlt. Weiteren Zahlungsversuch ${payment.id} manuell beim Anbieter prüfen und gegebenenfalls stornieren. Keine automatische Erstattung oder Stornierung.`);
        }
        this.store.releasePayment(id, claim.token);
      });
    } catch {
      // Unknown provider outcomes must reuse the same attempt/key. Never infer failure/cancellation.
      this.store.transaction(() => {
        if (!this.store.paymentClaimValid(id, claim.token)) return;
        const order = this.get(id); this.saveEvent(order, "payment_creation_pending");
        this.store.releasePayment(id, claim.token);
      });
    }
    return this.get(id);
  }

  async syncPayment(paymentId: string): Promise<RentalOrder> {
    const reference = this.store.paymentRecord(paymentId);
    if (!reference || !this.dependencies.gateway) return fail("Zahlung nicht gefunden.", "not_found", 404);
    const current = this.get(reference.orderId);
    let payment: RentalGatewayPayment;
    try { payment = await this.dependencies.gateway.getPayment(paymentId); }
    catch { return fail("Zahlungsstatus konnte nicht geprüft werden.", "payment", 502); }
    this.validatePayment(payment, current, paymentId);
    return this.store.transaction(() => {
      const order = this.get(current.id);
      const remembered = this.store.paymentRecord(paymentId)!;
      this.store.recordPayment({ ...remembered, status: payment.status });
      if (order.payment.id !== paymentId) {
        if (payment.status !== "paid" || remembered.status === "paid") return order;
        const otherId = order.payment.id;
        const alreadyPaid = order.payment.status === "paid";
        if (!alreadyPaid) order.payment = { id: payment.id, status: "paid", attempt: remembered.attempt };
        else delete order.payment.url;
        return this.saveEvent(order, "payment_paid_previous_attempt_manual_reconciliation", alreadyPaid ? undefined : "paid", `Zahlungsversuch ${payment.id} wurde nachträglich als bezahlt bestätigt. ${otherId ? `Weiteren Zahlungsversuch ${otherId}` : "Den neueren Zahlungsversuch"} manuell beim Anbieter prüfen und gegebenenfalls stornieren. Keine automatische Erstattung oder Stornierung.`);
      }
      if (order.payment.status === "paid") return order;
      if (order.payment.status === payment.status) return order;
      // A late pending notification must not resurrect an expired/failed attempt.
      if (terminalPayment(order.payment.status) && payment.status === "pending") return order;
      order.payment.status = payment.status; return this.saveEvent(order, `payment_${payment.status}`, payment.status === "paid" ? "paid" : undefined);
    });
  }

  async dispatchOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
    let sent = 0; let failed = 0;
    for (let i = 0; i < Math.min(Math.max(limit, 0), 100); i++) {
      const claim = this.store.claimMail(this.now().toISOString(), new Date(this.now().getTime() + 300_000).toISOString());
      if (!claim) break;
      const { job, token } = claim; let order = claim.snapshot;
      if (job.event === "accepted" && order.paymentMethod === "online") {
        const current = this.get(order.id);
        if (current.payment.status !== "paid" && (!current.payment.url || !current.payment.id)) {
          this.store.deferMail(job.id, token, new Date(this.now().getTime() + 60_000).toISOString(), "Zahlungslink steht noch aus; Annahme bleibt gültig."); continue;
        }
        order = { ...order, payment: current.payment };
      }
      try {
        const message = await this.dependencies.buildMessage(order, job.event, job.recipient, { marketEmail: this.config.marketEmail, statusUrl: this.dependencies.statusUrl(order.id), termsText: order.termsText, privacyText: order.privacyText });
        const expectedRecipient = job.recipient === "customer" ? order.customer.email : this.config.marketEmail;
        if (message.to !== expectedRecipient) throw new Error("Recipient mismatch");
        if (!this.store.mailClaimValid(job.id, token, this.now().toISOString())) continue;
        // PDF generation yields: a checkout can be paid or superseded while the message is built.
        // Rebuild from the current payment before handing a stale checkout to the mail transport.
        if (job.event === "accepted" && order.paymentMethod === "online" && JSON.stringify(this.get(order.id).payment) !== JSON.stringify(order.payment)) {
          this.store.deferMail(job.id, token, this.now().toISOString(), "Zahlungsstatus wurde während der Belegerstellung geändert; Nachricht wird aktualisiert.");
          continue;
        }
        await this.dependencies.sender.send({ ...message, messageId: `<rental-${job.id}@rental-orders.local>` });
        this.store.finishMail(job.id, token, this.now().toISOString()); sent++;
      } catch {
        const delay = Math.min(3600_000, 30_000 * 2 ** Math.min(job.attempts, 7));
        this.store.deferMail(job.id, token, new Date(this.now().getTime() + delay).toISOString(), "Versand fehlgeschlagen oder Ausgang unklar; Wiederholung mit derselben Nachrichten-ID vorgesehen."); failed++;
      }
    }
    return { sent, failed };
  }
}
