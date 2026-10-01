import type { RentalOrder } from "./types";

export const syntheticMessageContext = {
  marketEmail: "market@example.invalid",
  statusUrl: "http://localhost:3000/mietbestellung/token",
  termsText: "TEST-BEDINGUNGEN SNAPSHOT: Selbstabholung, nur synthetischer Test.",
  privacyText: "TEST-DATENSCHUTZ SNAPSHOT: Keine echten Daten.",
};

export function syntheticRentalOrder(overrides: Partial<RentalOrder> = {}): RentalOrder {
  return {id: "order-123", number: "TEST-2026-001", createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T11:00:00Z", version: 2,
    status: "accepted", paymentMethod: "cash", payment: {status: "not_requested", attempt: 0}, testMode: true,
    customer: {name: "Łukasz Đorđe Müller", email: "customer@example.invalid", phone: "+4900000", street: "Teststraße 1", postalCode: "00000", city: "Testort", country: "DE", company: "Nur erfundene Testfirma"},
    quote: {lines: [{id: 20001, name: "TEST-Kühlanhänger", quantity: 2, startDate: "2026-10-23", endDate: "2026-10-27", workdays: 4, periods: 2, unitPriceCents: 7500, lineTotalCents: 30000}], totalCents: 30000, knownSubtotalCents: 30000, allPriced: true, currency: "EUR", pricingVersion: "test-v1"},
    issuer: {name: "TESTBETRIEB - keine echte Rechnung", address: ["Testweg 9", "00000 Teststadt"], taxNumber: "TEST-KEINE-STEUERNUMMER", vatRateBps: 1900, invoicePrefix: "TEST"},
    invoice: {number: "TEST-R-2026-001", issuedAt: "2026-10-01T11:00:00Z"}, termsVersion: "test-terms-v1",
    termsText: syntheticMessageContext.termsText, privacyText: syntheticMessageContext.privacyText,
    events: [{type: "submitted", at: "2026-10-01T10:00:00Z"}, {type: "accepted", at: "2026-10-01T11:00:00Z"}], ...overrides};
}

export function syntheticMultipageOrder(): RentalOrder {
  const order = syntheticRentalOrder();
  const lines = Array.from({length: 42}, (_, index) => ({...order.quote.lines[0], id: 30000 + index, name: `Artikel ${index}: ${"lange ungekürzte Beschreibung für den Leihartikel ".repeat(5)}`}));
  return {...order, customer: {...order.customer, name: "Łukasz Đorđe "+"Müller ".repeat(25)}, quote: {...order.quote, lines, totalCents: 1260000, knownSubtotalCents: 1260000}};
}

export function syntheticHandoverOrder(): RentalOrder {
  const order = syntheticRentalOrder();
  return {...order, status: "handed_over", deliveryNote: {number: "TEST-L-2026-001", issuedAt: "2026-10-23T08:00:00Z"}, events: [...order.events, {type: "handed_over", at: "2026-10-23T08:00:00Z", note: "TEST: Gerät und Zubehör am dokumentierten Abholtermin übergeben."}]};
}
