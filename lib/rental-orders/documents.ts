import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { degrees, PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import { assertRentalEmail, assertRentalHeader, trustedRentalCheckout } from "./integrations";
import type { RentalDocumentRecord, RentalMailEvent, RentalMailMessage, RentalOrder } from "./types";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 44, BODY_BOTTOM = 62, TEXT_WIDTH = A4[0] - MARGIN * 2;
const INK = rgb(0.12, 0.12, 0.14), RED = rgb(0.7, 0.08, 0.1);
let fontBytes: Promise<[Uint8Array, Uint8Array]> | undefined;
function fonts(): Promise<[Uint8Array, Uint8Array]> {
  const directory = path.join(process.cwd(), "assets/fonts/rental-document");
  return fontBytes ??= Promise.all([readFile(path.join(directory, "NotoSans-Regular.ttf")), readFile(path.join(directory, "NotoSans-Bold.ttf"))]);
}
function text(value: unknown, label: string, max = 2000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error(`Ungültiges Belegfeld: ${label}.`);
  return value.replace(/\r\n?/g, "\n").replace(/\t/g, " ").normalize("NFC");
}
function dateOnly(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error("Ungültiges Belegdatum.");
  return `${value.slice(8,10)}.${value.slice(5,7)}.${value.slice(0,4)}`;
}
function dateTime(value: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(new Date(value).valueOf())) throw new Error("Ungültiger Belegzeitpunkt.");
  return new Intl.DateTimeFormat("de-DE", {timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"}).format(new Date(value));
}
function money(cents: number): string { return `${Math.floor(cents / 100).toLocaleString("de-DE")},${String(cents % 100).padStart(2, "0")} EUR`; }
function paymentText(order: RentalOrder): string {
  if (order.payment.status === "paid") return `Zahlung eingegangen (${order.paymentMethod === "cash" ? "Barzahlung" : "Onlinezahlung"}).`;
  if (order.paymentMethod === "cash") return "Offen - Barzahlung bei Abholung; noch kein Zahlungseingang bestätigt.";
  return `Offen - Onlinezahlung ausstehend (${order.payment.status}); noch kein Zahlungseingang bestätigt.`;
}
function approved(order: RentalOrder): boolean { return ["accepted", "handed_over", "returned"].includes(order.status); }
function documentRecord(order: RentalOrder, kind: "invoice" | "delivery_note"): RentalDocumentRecord {
  if (!approved(order)) throw new Error("Beleg erst nach ausdrücklicher Marktannahme zulässig.");
  const record = kind === "invoice" ? order.invoice : order.deliveryNote;
  if (!record) throw new Error("Zugewiesene Belegnummer und Ausstellungszeit fehlen.");
  assertRentalHeader(record.number, 100); dateTime(record.issuedAt);
  if (kind === "delivery_note" && (!(["handed_over", "returned"].includes(order.status)) || !order.events.some(event => event.type === "handed_over" && Number.isFinite(new Date(event.at).valueOf())))) throw new Error("Lieferschein nur nach erfasster tatsächlicher Übergabe zulässig.");
  return record;
}
function validateDocument(order: RentalOrder): number {
  text(order.issuer.name, "Aussteller"); text(order.issuer.taxNumber, "Steuernummer");
  if (!order.issuer.address?.length || order.issuer.address.length > 8 || !Number.isInteger(order.issuer.vatRateBps) || order.issuer.vatRateBps < 0 || order.issuer.vatRateBps > 10000) throw new Error("Bestätigte Aussteller-/Steuerangaben fehlen.");
  order.issuer.address.forEach(value => text(value, "Ausstelleradresse"));
  text(order.customer.name, "Kundenname"); text(order.customer.street, "Kundenadresse"); text(order.customer.postalCode, "Postleitzahl", 30); text(order.customer.city, "Ort"); text(order.customer.country, "Land", 100);
  if (order.customer.company) text(order.customer.company, "Firma");
  assertRentalHeader(order.number, 120);
  const quote = order.quote;
  if (!quote.allPriced || quote.currency !== "EUR" || !quote.lines.length || quote.lines.length > 200 || !Number.isSafeInteger(quote.totalCents) || quote.totalCents === null || quote.totalCents < 0) throw new Error("Vollständig geprüfte Preise und Gesamtsumme erforderlich.");
  let total = 0;
  for (const line of quote.lines) {
    text(line.name, "Artikel"); dateOnly(line.startDate); dateOnly(line.endDate);
    if (line.startDate > line.endDate || !Number.isSafeInteger(line.quantity) || line.quantity <= 0 || !Number.isSafeInteger(line.periods) || line.periods <= 0 || !Number.isSafeInteger(line.workdays) || line.workdays <= 0 || line.periods !== Math.ceil(line.workdays / 3) || line.unitPriceCents === null || !Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0 || line.lineTotalCents === null || !Number.isSafeInteger(line.lineTotalCents) || line.lineTotalCents !== line.quantity * line.periods * line.unitPriceCents) throw new Error("Unvollständige oder widersprüchliche Belegposition.");
    total += line.lineTotalCents;
  }
  if (!Number.isSafeInteger(total) || total !== quote.totalCents || total !== quote.knownSubtotalCents) throw new Error("Positions- und Gesamtsummen stimmen nicht überein."); return total;
}
function wrap(value: string, font: PDFFont, size: number, supported: Set<number>): string[] {
  const normalized = text(value, "Text", 20_000);
  for (const char of normalized) if (char !== "\n" && !supported.has(char.codePointAt(0)!)) throw new Error(`Unicode-Zeichen U+${char.codePointAt(0)!.toString(16).toUpperCase()} wird von der Belegschrift nicht unterstützt; keine Zeichen werden entfernt.`);
  const result: string[] = [];
  for (const paragraph of normalized.split("\n")) {
    if (!paragraph) { result.push(""); continue; }
    let current = "";
    for (const word of paragraph.split(/ +/)) {
      if (font.widthOfTextAtSize(current ? `${current} ${word}` : word, size) <= TEXT_WIDTH) { current = current ? `${current} ${word}` : word; continue; }
      if (current) { result.push(current); current = ""; }
      // Split overlong words by Unicode codepoint rather than clipping or dropping text.
      for (const char of word) { if (font.widthOfTextAtSize(current + char, size) > TEXT_WIDTH && current) { result.push(current); current = ""; } current += char; }
    }
    if (current) result.push(current);
  }
  return result;
}

export async function renderRentalDocument(order: RentalOrder, kind: "invoice" | "delivery_note"): Promise<Uint8Array> {
  if (kind !== "invoice" && kind !== "delivery_note") throw new Error("Unbekannte Belegart.");
  const record = documentRecord(order, kind); const total = validateDocument(order);
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await fonts();
  const regular = await pdf.embedFont(regularBytes, {subset: true}), bold = await pdf.embedFont(boldBytes, {subset: true});
  const supported = new Set(regular.getCharacterSet()); const title = kind === "invoice" ? "Rechnung" : "Lieferschein";
  const issued = new Date(record.issuedAt); pdf.setTitle(`${order.testMode ? "TEST " : ""}${title} ${record.number}`); pdf.setAuthor(order.issuer.name); pdf.setSubject(`Mietbestellung ${order.number}`); pdf.setCreationDate(issued); pdf.setModificationDate(issued);
  let page: PDFPage; let y = 0;
  function newPage() {
    page = pdf.addPage(A4);
    if (order.testMode) {
      page.drawText("TEST", {x: 112, y: 295, size: 100, font: bold, color: RED, opacity: 0.08, rotate: degrees(38)});
      page.drawText(kind === "invoice" ? "TEST - KEINE ECHTE RECHNUNG" : "TEST - KEINE ECHTE ÜBERGABE", {x: MARGIN, y: 816, size: 10, font: bold, color: RED});
    }
    page.drawText(title, {x: MARGIN, y: 782, size: 24, font: bold, color: INK});
    const header = `${record.number} | Bestellung ${order.number}`;
    const lines = wrap(header, regular, 9, supported); let headerY = 761;
    for (const line of lines) { page.drawText(line, {x: MARGIN, y: headerY, size: 9, font: regular, color: INK}); headerY -= 13; }
    page.drawLine({start: {x: MARGIN, y: headerY - 3}, end: {x: A4[0] - MARGIN, y: headerY - 3}, thickness: 0.7, color: rgb(0.8,0.8,0.8)});
    y = headerY - 23;
  }
  function paragraph(value: string, options: {bold?: boolean; size?: number; gap?: number} = {}) {
    const font = options.bold ? bold : regular; const size = options.size ?? 10; const leading = size * 1.42;
    for (const line of wrap(value, font, size, supported)) { if (y - leading < BODY_BOTTOM) newPage(); if (line) page.drawText(line, {x: MARGIN, y, font, size, color: INK}); y -= leading; }
    y -= options.gap ?? 5;
  }
  function ensure(height: number) { if (y - height < BODY_BOTTOM) newPage(); }
  newPage();
  paragraph(order.issuer.name, {bold: true});
  for (const address of order.issuer.address) paragraph(address, {size: 9, gap: 0});
  paragraph(`Steuernummer / USt-ID: ${order.issuer.taxNumber}`, {size: 9, gap: 10});
  paragraph(kind === "invoice" ? "Rechnung an" : "Übergeben an", {bold: true});
  if (order.customer.company) paragraph(order.customer.company, {gap: 0});
  for (const line of [order.customer.name, order.customer.street, `${order.customer.postalCode} ${order.customer.city}`, order.customer.country]) paragraph(line, {gap: 0});
  paragraph(`Ausgestellt: ${dateTime(record.issuedAt)} (Europe/Berlin)`, {size: 9, gap: 10});
  if (kind === "delivery_note") { const handover = order.events.find(event => event.type === "handed_over")!; paragraph(`Tatsächliche Übergabe erfasst: ${dateTime(handover.at)} (Europe/Berlin)`, {bold: true}); if (handover.note) paragraph(`Übergabevermerk: ${handover.note}`); }
  paragraph("Mietpositionen", {bold: true, size: 12});
  for (const [index, line] of order.quote.lines.entries()) {
    ensure(88);
    paragraph(`${index + 1}. ${line.name}`, {bold: true});
    paragraph(`Zeitraum: ${dateOnly(line.startDate)} - ${dateOnly(line.endDate)} (Abholung / Rückgabe)`, {size: 9, gap: 1});
    paragraph(`Menge: ${line.quantity} | Werktage: ${line.workdays} | Dreierblöcke: ${line.periods}`, {size: 9, gap: 1});
    if (kind === "invoice") paragraph(`Einzelpreis je angefangenem Dreierblock (brutto): ${money(line.unitPriceCents!)} | Positionssumme: ${money(line.lineTotalCents!)}`, {size: 9, gap: 10});
    else y -= 7;
  }
  ensure(140);
  if (kind === "invoice") {
    // Round each line's net cents once; VAT is the gross/net difference, never added on top.
    const denominator = BigInt(10000 + order.issuer.vatRateBps);
    const net = order.quote.lines.reduce((sum, line) => sum + Number((BigInt(line.lineTotalCents!) * BigInt(10000) + denominator / BigInt(2)) / denominator), 0);
    paragraph(`Nettosumme: ${money(net)}`, {bold: true});
    paragraph(`Enthaltene MwSt. (${(order.issuer.vatRateBps / 100).toLocaleString("de-DE")} %): ${money(total - net)}`, {bold: true});
    paragraph(`Gesamtbetrag brutto: ${money(total)}`, {bold: true, size: 12});
    paragraph("Die bestätigten Mietpreise enthalten die ausgewiesene Mehrwertsteuer. Es wird keine zusätzliche Mehrwertsteuer aufgeschlagen.", {size: 9});
  }
  paragraph(`Zahlungsstatus: ${paymentText(order)}`, {bold: true});
  if (kind === "delivery_note") paragraph("Dieser Beleg dokumentiert die im System erfasste Übergabe; er ist keine vorweggenommene Übergabe- oder Zahlungsbestätigung.", {size: 9});
  for (const [index, currentPage] of pdf.getPages().entries()) currentPage.drawText(`Seite ${index + 1} / ${pdf.getPageCount()}`, {x: MARGIN, y: 28, font: regular, size: 9, color: INK});
  return pdf.save();
}

function statusLink(value: string, testMode: boolean): string {
  try { const url = new URL(value); const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname); if (url.username || url.password || (url.protocol !== "https:" && !(testMode && local && url.protocol === "http:")) || (testMode && !local)) throw new Error(); return url.href; }
  catch { throw new Error("Ungültiger Bestellstatus-Link."); }
}
function safeFilename(prefix: string, number: string): string { return `${prefix}-${number.replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`; }
function paymentLink(value: string, testMode: boolean): string {
  try { return trustedRentalCheckout(value); }
  catch { if (testMode) return statusLink(value, true); throw new Error("Ungültiger sicherer Zahlungslink."); }
}

export async function buildRentalMessage(order: RentalOrder, event: RentalMailEvent, recipient: "customer" | "market", context: {marketEmail: string; statusUrl: string; termsText?: string; privacyText?: string}): Promise<RentalMailMessage> {
  if (!["customer", "market"].includes(recipient) || !["received", "accepted", "declined", "paid", "handed_over", "returned"].includes(event)) throw new Error("Unbekannte Bestellnachricht.");
  assertRentalHeader(order.number, 120); assertRentalHeader(order.id, 100);
  const to = recipient === "customer" ? order.customer.email : context.marketEmail; assertRentalEmail(to);
  const link = statusLink(context.statusUrl, order.testMode);
  const labels: Record<RentalMailEvent, string> = {received: "Eingang Ihrer Mietbestellung", accepted: "Mietbestellung angenommen", declined: "Mietbestellung abgelehnt", paid: "Zahlung bestätigt", handed_over: "Übergabe dokumentiert", returned: "Rückgabe dokumentiert"};
  if ((event === "accepted" || event === "paid") && !approved(order)) throw new Error("Nachricht erst nach ausdrücklicher Marktannahme zulässig.");
  if (event === "paid" && order.payment.status !== "paid") throw new Error("Kein bestätigter Zahlungseingang.");
  if (event === "declined" && order.status !== "declined") throw new Error("Keine dokumentierte Ablehnung.");
  if (event === "returned" && (order.status !== "returned" || !order.events.some(item => item.type === "returned"))) throw new Error("Keine dokumentierte Rückgabe.");
  const body: string[] = [order.testMode ? "TESTMODUS - keine echte Bestellung, Rechnung, Zahlung oder E-Mail." : "Mietbestellung", `Bestellnummer: ${order.number}`, `Kunde: ${text(order.customer.name, "Kundenname")}`];
  if (recipient === "market") body.push(`Kundenkontakt: ${order.customer.email} | ${order.customer.phone}`, `Adresse: ${order.customer.street}, ${order.customer.postalCode} ${order.customer.city}, ${order.customer.country}`);
  const attachments: RentalMailMessage["attachments"] = [];
  if (event === "received") body.push("Ihre Bestellung ist eingegangen. Diese automatische Eingangsbestätigung ist keine Annahme, kein Mietvertrag und keine Reservierungsbestätigung. Der Markt prüft Termin und Verfügbarkeit und entscheidet ausdrücklich über die Annahme. Eine Zahlung wird jetzt nicht angefordert.");
  if (event === "accepted") body.push("Der Markt hat die Mietbestellung ausdrücklich angenommen. Die vereinbarten Positionen und Mietzeiträume stehen in der beigefügten Rechnung.");
  if (event === "declined") body.push("Der Markt hat die Mietbestellung abgelehnt. Es ist kein Mietvertrag zustande gekommen; eine Zahlung wird nicht angefordert.");
  if (event === "paid") body.push(paymentText(order));
  if (event === "handed_over") body.push("Die tatsächliche Übergabe wurde durch den Markt erfasst. Der zugehörige Lieferschein ist beigefügt.");
  if (event === "returned") body.push("Die tatsächliche Rückgabe wurde durch den Markt erfasst.");
  for (const line of order.quote.lines) body.push(`${line.quantity} x ${line.name} | ${dateOnly(line.startDate)} - ${dateOnly(line.endDate)} | ${line.workdays} Werktage / ${line.periods} Dreierblöcke | Einzelpreis: ${line.unitPriceCents === null ? "Preis auf Anfrage" : money(line.unitPriceCents)} | Summe: ${line.lineTotalCents === null ? "nicht vollständig bepreist" : money(line.lineTotalCents)}`);
  body.push(`Gesamtsumme: ${order.quote.totalCents === null ? "nicht vollständig bepreist" : money(order.quote.totalCents)}`);
  if (event === "accepted") {
    body.push(paymentText(order));
    if (order.paymentMethod === "online" && order.payment.status !== "paid") {
      if (order.payment.status === "pending" && order.payment.url) { const checkout = paymentLink(order.payment.url, order.testMode); body.push(`Sicherer Online-Zahlungslink: ${checkout}`, "Eine Weiterleitung vom Zahlungsanbieter ist kein Zahlungsnachweis. Eine ausstehende Bankzahlung bleibt bis zur bestätigten Zahlung offen."); }
      else body.push("Der sichere Online-Zahlungslink wird noch vorbereitet; bitte nicht über einen anderen Link bezahlen.");
    }
  }
  if (event === "accepted" || event === "paid") attachments.push({filename: safeFilename("Rechnung", order.invoice?.number ?? ""), content: await renderRentalDocument(order, "invoice")});
  if (event === "handed_over") attachments.push({filename: safeFilename("Lieferschein", order.deliveryNote?.number ?? ""), content: await renderRentalDocument(order, "delivery_note")});
  if (event === "received" || event === "accepted") {
    body.push(`Mietbedingungen - übermittelte Fassung ${text(order.termsVersion, "Bedingungsversion", 100)}:`, text(order.termsText, "Mietbedingungen-Snapshot", 100_000));
    body.push("Datenschutzhinweis - übermittelte Fassung:", text(order.privacyText, "Datenschutz-Snapshot", 100_000));
  }
  body.push(`Bestellstatus: ${link}`);
  const digest = createHash("sha256").update(`${order.id}\0${event}\0${recipient}`).digest("hex");
  return {to, subject: `${order.testMode ? "[TEST] " : ""}${labels[event]} - ${order.number}`, text: body.join("\n\n"), messageId: `<rental-${digest}@rental-orders.invalid>`, attachments};
}
