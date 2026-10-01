import { describe, expect, it } from "vitest";
import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { syntheticMessageContext as context, syntheticMultipageOrder, syntheticRentalOrder } from "./documents.test-fixtures";

async function documents() {
  const implementation = await import("./documents").catch(() => null);
  expect(implementation, "rental documents and message builder must exist").not.toBeNull(); return implementation!;
}

// Decode the real embedded font's Unicode map and page operators, not a mocked renderer.
async function pdfText(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes); const texts: string[] = [];
  for (const page of pdf.getPages()) {
    const resources = page.node.Resources()!; const fonts = resources.lookup(PDFName.of("Font"), PDFDict);
    const maps = new Map<string, Map<string, string>>();
    for (const [name, reference] of fonts.entries()) {
      const font = pdf.context.lookup(reference, PDFDict); const unicodeReference = font.get(PDFName.of("ToUnicode"));
      if (!unicodeReference) continue;
      const unicode = pdf.context.lookup(unicodeReference); if (!(unicode instanceof PDFRawStream)) continue;
      const cmap = Buffer.from(decodePDFRawStream(unicode).decode()).toString(); const values = new Map<string, string>();
      for (const section of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) for (const match of section[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi)) {
        const codepoints = match[2].match(/.{4}/g)!.map(hex => parseInt(hex, 16)); values.set(match[1].toUpperCase(), String.fromCharCode(...codepoints));
      }
      maps.set(name.asString().replace(/^\//, ""), values);
    }
    const contents = page.node.Contents(); const streams = contents instanceof PDFArray ? contents.asArray() : [contents];
    let currentFont = "";
    for (const reference of streams) {
      const stream = pdf.context.lookup(reference); if (!(stream instanceof PDFRawStream)) continue;
      const operators = Buffer.from(decodePDFRawStream(stream).decode()).toString();
      for (const match of operators.matchAll(/\/(\S+)\s+[\d.]+\s+Tf|<([0-9a-f]+)>\s*Tj/gi)) {
        if (match[1]) currentFont = match[1];
        else { const map = maps.get(currentFont); texts.push((match[2].match(/.{4}/g) ?? []).map(hex => map?.get(hex.toUpperCase()) ?? "?").join("")); }
      }
    }
  }
  return {pdf, text: texts.join("\n")};
}

describe("real rental PDF documents", () => {
  it("renders the assigned invoice number, real Unicode names, dates, quantities, blocks, inclusive tax and unpaid cash state", async () => {
    const {renderRentalDocument} = await documents(); const result = await pdfText(await renderRentalDocument(syntheticRentalOrder(), "invoice"));
    expect(result.pdf.getPageCount()).toBe(1); const {width, height} = result.pdf.getPage(0).getSize(); expect(width).toBeCloseTo(595.28, 1); expect(height).toBeCloseTo(841.89, 1);
    for (const value of ["TEST-R-2026-001", "Łukasz Đorđe Müller", "TEST-Kühlanhänger", "23.10.2026", "27.10.2026", "75,00", "300,00", "252,10", "47,90", "19", "Barzahlung", "Offen", "TEST", "Seite 1 / 1"]) expect(result.text).toContain(value);
    expect(result.text).not.toContain("Zahlung eingegangen");
  });
  it("keeps the same assigned number after payment and truthfully marks paid", async () => {
    const {renderRentalDocument} = await documents(); const order = syntheticRentalOrder({payment: {status: "paid", attempt: 0}});
    const {text} = await pdfText(await renderRentalDocument(order, "invoice")); expect(text).toContain("TEST-R-2026-001"); expect(text).toContain("Zahlung eingegangen");
  });
  it("rounds inclusive VAT in integer cents even at safe-integer boundaries", async () => {
    const {renderRentalDocument} = await documents(); const order = syntheticRentalOrder(); const gross = 9007199254740990;
    const line = {...order.quote.lines[0], quantity: 1, periods: 1, workdays: 1, endDate: order.quote.lines[0].startDate, unitPriceCents: gross, lineTotalCents: gross};
    const {text} = await pdfText(await renderRentalDocument({...order, quote: {...order.quote, lines: [line], totalCents: gross, knownSubtotalCents: gross}}, "invoice"));
    expect(text).toContain("Nettosumme: 75.690.750.039.840,25 EUR");
    expect(text).toContain("Enthaltene MwSt. (19 %): 14.381.242.507.569,65 EUR");
  });
  it.each(["submitted", "declined"] as const)("refuses an invoice before acceptance: %s", async status => {
    const {renderRentalDocument} = await documents(); await expect(renderRentalDocument(syntheticRentalOrder({status}), "invoice")).rejects.toThrow();
  });
  it("refuses to invent an invoice number or issuer/tax details", async () => {
    const {renderRentalDocument} = await documents();
    await expect(renderRentalDocument(syntheticRentalOrder({invoice: undefined}), "invoice")).rejects.toThrow();
    await expect(renderRentalDocument(syntheticRentalOrder({issuer: {...syntheticRentalOrder().issuer, taxNumber: ""}}), "invoice")).rejects.toThrow();
  });
  it("refuses unpriced or inconsistent totals rather than converting unknown to zero", async () => {
    const {renderRentalDocument} = await documents(); const order = syntheticRentalOrder();
    for (const quote of [{...order.quote, totalCents: null, allPriced: false}, {...order.quote, totalCents: 30001}, {...order.quote, lines: [{...order.quote.lines[0], unitPriceCents: null}]}]) await expect(renderRentalDocument({...order, quote}, "invoice")).rejects.toThrow();
  });
  it("requires an actual handover state, event and assigned delivery-note record", async () => {
    const {renderRentalDocument} = await documents(); const order = syntheticRentalOrder();
    await expect(renderRentalDocument(order, "delivery_note")).rejects.toThrow();
    await expect(renderRentalDocument({...order, status: "handed_over", deliveryNote: {number: "TEST-L-001", issuedAt: order.updatedAt}}, "delivery_note")).rejects.toThrow();
    const handover = {...order, status: "handed_over" as const, deliveryNote: {number: "TEST-L-001", issuedAt: order.updatedAt}, events: [...order.events, {type: "handed_over", at: order.updatedAt}]};
    const {text} = await pdfText(await renderRentalDocument(handover, "delivery_note")); expect(text).toContain("Lieferschein"); expect(text).toContain("TEST-L-001"); expect(text).toContain("Tatsächliche Übergabe"); expect(text).not.toContain("Zahlung eingegangen");
  });
  it("wraps long names and paginates many positions with page numbers and TEST mark on every page", async () => {
    const {renderRentalDocument} = await documents();
    const {pdf, text} = await pdfText(await renderRentalDocument(syntheticMultipageOrder(), "invoice"));
    expect(pdf.getPageCount()).toBeGreaterThan(2); expect(text).toContain("Artikel 41"); expect(text.match(/Seite \d+ \/ \d+/g)).toHaveLength(pdf.getPageCount()); expect(text.match(/TEST - KEINE ECHTE RECHNUNG/g)).toHaveLength(pdf.getPageCount());
  });
  it("fails explicitly for unsupported glyphs instead of silently losing a customer name", async () => {
    const {renderRentalDocument} = await documents(); const order = syntheticRentalOrder();
    await expect(renderRentalDocument({...order, customer: {...order.customer, name: "Test 😀"}}, "invoice")).rejects.toThrow(/Zeichen|Schrift|Unicode/);
  });
  it("never includes unbounded customer free-text notes in a billing document", async () => {
    const {renderRentalDocument} = await documents(); const order = syntheticRentalOrder();
    const {pdf, text} = await pdfText(await renderRentalDocument({...order, customer: {...order.customer, notes: "PRIVATE-NOTE-NOT-FOR-INVOICE ".repeat(10000)}}, "invoice"));
    expect(pdf.getPageCount()).toBe(1); expect(text).not.toContain("PRIVATE-NOTE-NOT-FOR-INVOICE");
  });
});

describe("status-specific plain-text rental messages", () => {
  it("states received is not accepted, includes the terms/privacy snapshot and attaches no premature invoice", async () => {
    const {buildRentalMessage} = await documents(); const order = syntheticRentalOrder({status: "submitted", invoice: undefined});
    const message = await buildRentalMessage(order, "received", "customer", context);
    expect(message.to).toBe("customer@example.invalid"); expect(message.text).toMatch(/keine Annahme/i); expect(message.text).toContain(context.termsText); expect(message.text).toContain(context.privacyText); expect(message.attachments).toEqual([]); expect(message.text).not.toContain("https://www.mollie.com");
  });
  it("uses stored agreement/privacy snapshots even if later context text changes", async () => {
    const {buildRentalMessage} = await documents(); const order = syntheticRentalOrder({status: "submitted", invoice: undefined});
    const message = await buildRentalMessage(order, "received", "customer", {...context, termsText: "CHANGED NEW TERMS", privacyText: "CHANGED NEW PRIVACY"});
    expect(message.text).toContain(order.termsText); expect(message.text).toContain(order.privacyText); expect(message.text).not.toContain("CHANGED NEW");
  });
  it("isolates customer and market recipients with stable, distinct message IDs", async () => {
    const {buildRentalMessage} = await documents(); const order = syntheticRentalOrder({status: "submitted", invoice: undefined});
    const customer = await buildRentalMessage(order, "received", "customer", context); const again = await buildRentalMessage(order, "received", "customer", context); const market = await buildRentalMessage(order, "received", "market", context);
    expect(customer.messageId).toBe(again.messageId); expect(market.messageId).not.toBe(customer.messageId); expect(market.to).toBe("market@example.invalid"); expect(customer.to).not.toContain(","); expect(market.to).not.toContain(",");
  });
  it("attaches a real invoice after acceptance and distinguishes cash pickup from unpaid online payment", async () => {
    const {buildRentalMessage} = await documents(); const cash = await buildRentalMessage(syntheticRentalOrder(), "accepted", "customer", context);
    expect(cash.text).toContain("Barzahlung bei Abholung"); expect(cash.text).not.toContain("Zahlung eingegangen"); expect((await PDFDocument.load(cash.attachments[0].content)).getPageCount()).toBe(1);
    const online = await buildRentalMessage(syntheticRentalOrder({paymentMethod: "online", payment: {status: "pending", attempt: 1, id: "tr_test", url: "https://www.mollie.com/checkout/select-method/test"}}), "accepted", "customer", context);
    expect(online.text).toContain("https://www.mollie.com/checkout/select-method/test"); expect(online.text).toContain("ausstehend"); expect(online.text).not.toContain("Zahlung eingegangen");
  });
  it("never confirms paid from an unpaid snapshot", async () => {
    const {buildRentalMessage} = await documents(); await expect(buildRentalMessage(syntheticRentalOrder(), "paid", "customer", context)).rejects.toThrow();
    const paid = await buildRentalMessage(syntheticRentalOrder({payment: {status: "paid", attempt: 0}}), "paid", "customer", context); expect(paid.text).toContain("Zahlung eingegangen"); expect(paid.attachments).toHaveLength(1);
  });
  it("attaches only the recorded delivery note at actual handover", async () => {
    const {buildRentalMessage} = await documents(); const order = syntheticRentalOrder();
    await expect(buildRentalMessage(order, "handed_over", "market", context)).rejects.toThrow();
    const handed = {...order, status: "handed_over" as const, deliveryNote: {number: "TEST-L-001", issuedAt: order.updatedAt}, events: [...order.events, {type: "handed_over", at: order.updatedAt}]};
    const result = await buildRentalMessage(handed, "handed_over", "market", context); expect(result.attachments).toHaveLength(1); expect(result.attachments[0].filename).toContain("Lieferschein");
  });
  it("rejects header injection, untrusted live payment links and missing contract text", async () => {
    const {buildRentalMessage} = await documents(); const order = syntheticRentalOrder();
    await expect(buildRentalMessage({...order, number: "TEST\r\nBcc: attacker"}, "accepted", "customer", context)).rejects.toThrow();
    await expect(buildRentalMessage(order, "received", "market", {...context, marketEmail: "market@example.invalid,attacker@example.invalid"})).rejects.toThrow();
    await expect(buildRentalMessage({...order, termsText: ""}, "received", "customer", {...context, termsText: undefined})).rejects.toThrow();
    await expect(buildRentalMessage({...order, testMode: false, paymentMethod: "online", payment: {status: "pending", attempt: 1, url: "http://evil.invalid/pay"}}, "accepted", "customer", {...context, statusUrl: "https://rentals.example.invalid/status"})).rejects.toThrow();
  });
});
