"use client";

import PageIntro from "@/components/editorial/PageIntro";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { rentalCartQuote } from "@/lib/rental-cart";
import { forgetRentalSubmission, rentalSubmissionKey } from "@/lib/rental-submission";
import type { RentalCustomer, RentalPaymentMethod, RentalPublicConfig } from "@/lib/rental-orders/types";
import InquiryCheckout from "./InquiryCheckout";

const money = (cents: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
const fields: { key: keyof RentalCustomer; label: string; auto: string; type?: string; max: number; optional?: boolean }[] = [
  { key: "name", label: "Vor- und Nachname", auto: "name", max: 160 },
  { key: "company", label: "Firma (optional)", auto: "organization", max: 160, optional: true },
  { key: "email", label: "E-Mail-Adresse", auto: "email", type: "email", max: 254 },
  { key: "phone", label: "Telefon für Terminabsprachen", auto: "tel", type: "tel", max: 50 },
  { key: "street", label: "Straße und Hausnummer", auto: "street-address", max: 200 },
  { key: "postalCode", label: "Postleitzahl", auto: "postal-code", max: 20 },
  { key: "city", label: "Ort", auto: "address-level2", max: 100 },
  { key: "country", label: "Land", auto: "country-name", max: 100 },
];

export default function RentalCheckout() {
  const { items, clearCart, setIsCartOpen } = useCart();
  const { selection, quote, error: quoteError, onlyRentals } = rentalCartQuote(items);
  const [config, setConfig] = useState<RentalPublicConfig | null>(null);
  const [loadError, setLoadError] = useState("");
  const [customer, setCustomer] = useState<RentalCustomer>({ name: "", email: "", phone: "", street: "", postalCode: "", city: "", country: "Deutschland", notes: "", company: "" });
  const [method, setMethod] = useState<RentalPaymentMethod>("cash");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/rentals/config", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("Die Bestellfunktion konnte nicht geladen werden.");
      const value = await response.json(); if (active) setConfig(value);
    }).catch(cause => { if (active) setLoadError(cause.message); });
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !config?.enabled || quote?.totalCents == null) return;
    setBusy(true); setError("");
    const payload = JSON.stringify({ items: selection, customer, paymentMethod: method, expectedTotalCents: quote.totalCents, termsVersion: config.termsVersion, acceptedTerms: terms });
    try {
      const submission = await rentalSubmissionKey(payload, window.sessionStorage);
      const response = await fetch("/api/rentals/orders", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": submission.key }, body: payload });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Bestellung konnte nicht gespeichert werden.");
      const target = new URL(result.statusUrl, window.location.origin);
      if (target.origin !== window.location.origin) throw new Error("Bitte den Markt kontaktieren: Bestelladresse stimmt nicht überein.");
      try { forgetRentalSubmission(submission, window.sessionStorage); } catch { /* A confirmed order must still open if storage becomes unavailable. */ }
      setCompleted(true); clearCart(); setIsCartOpen(false); window.location.assign(target.href);
    } catch (cause) { setError(cause instanceof TypeError ? "Verbindung unterbrochen. Bitte in diesem Tab mit unveränderten Angaben erneut versuchen. Wenn du unsicher bist, kontaktiere den Markt vor einer neuen Bestellung." : cause instanceof Error ? cause.message : "Bestellung konnte nicht bestätigt werden. Bitte den Markt kontaktieren."); }
    finally { setBusy(false); }
  }

  if (completed) return <><PageIntro title="Deine Mietbestellung" /><div className={styles.body}><p role="status" className={styles.notice}>Bestellung gespeichert. Deine Bestellübersicht wird geöffnet …</p></div></>;
  if (!items.length) return <InquiryCheckout />;
  if (!onlyRentals || (quote && !quote.allPriced)) return <><p className="max-w-4xl mx-auto px-6 pt-8 text-sm">Gemischte Warenkörbe und Leihartikel ohne festgelegten Preis stimmen wir persönlich mit dir ab.</p><InquiryCheckout /></>;
  if (quoteError) return <><PageIntro title="Bitte die Auswahl prüfen" /><div className={styles.body}><p role="alert" className={styles.error}>{quoteError}</p><Link href="/warenkorb" className={editorial.secondaryLink}>Warenkorb bearbeiten</Link></div></>;
  if (loadError) return <><PageIntro title="Deine Mietauswahl" /><div className={styles.body}><p role="alert" className={styles.error}>{loadError}</p><button onClick={() => window.location.reload()} className={editorial.secondaryLink}>Erneut laden</button></div></>;
  if (!config) return <><PageIntro title="Deine Mietauswahl" /><div className={styles.body}><p role="status" className={styles.notice}>Bestellfunktion wird geladen …</p></div></>;
  if (!config.enabled) return <><p className="max-w-4xl mx-auto px-6 pt-8 text-sm">{config.message}</p><InquiryCheckout /></>;
  if (!quote || quote.totalCents === null) return null;
  return <><PageIntro title="Deine Mietbestellung"><Link href="/warenkorb" className={editorial.secondaryLink}>Warenkorb bearbeiten</Link></PageIntro><div className={styles.body} data-service="rental-checkout">
    {config.testMode && <div role="note" className={styles.notice}>Testbetrieb – keine echte Bestellung, Zahlung oder E-Mail. Bitte nur erfundene Kundendaten eingeben.</div>}
    <p className="mb-8 max-w-3xl">Du gibst eine zahlungspflichtige Bestellung ab. Erst wenn wir Termin und Verfügbarkeit ausdrücklich bestätigen, kommt der Mietvertrag zustande. Danach erhältst du deinen Zahlungslink oder bezahlst bei Abholung bar.</p>
    <form onSubmit={submit} className={styles.formLayout}>
      <div className={styles.form}>
        <h2 className="text-xl font-bold">Deine Rechnungs- und Kontaktdaten</h2>
        {fields.map(field => <label key={field.key} className="block font-medium" htmlFor={`rental-${field.key}`}>{field.label}<input id={`rental-${field.key}`} name={field.key} autoComplete={field.auto} type={field.type || "text"} maxLength={field.max} required={!field.optional} value={customer[field.key] || ""} onChange={event => setCustomer({ ...customer, [field.key]: event.target.value })} className={styles.field} /></label>)}
        <label className="block font-medium" htmlFor="rental-notes">Anmerkungen (optional)<textarea id="rental-notes" maxLength={2000} rows={3} value={customer.notes} onChange={event => setCustomer({ ...customer, notes: event.target.value })} className={styles.field} /></label>
      </div>
      <aside className={styles.summary}>
        <h2 className="text-xl font-bold">Vollständige Preisübersicht</h2>
        <ul className="space-y-4">{quote.lines.map(line => <li key={`${line.id}:${line.startDate}:${line.endDate}`} className="border-b border-border pb-4"><div className="flex gap-4 justify-between font-semibold"><span>{line.quantity} × {line.name}</span><span className="whitespace-nowrap">{money(line.lineTotalCents!)}</span></div><p className="text-sm mt-2">{line.startDate.split("-").reverse().join(".")} bis {line.endDate.split("-").reverse().join(".")}</p><p className="text-sm text-muted">{line.workdays} Werktage · {line.periods} Dreierblock{line.periods === 1 ? "" : "e"} · {money(line.unitPriceCents!)} je Stück und Block</p></li>)}</ul>
        <p className="text-sm">Abhol- und Rückgabetag zählen mit. Werktage: Mo–Sa, ohne Sonn- und NRW-Feiertage. Jeder angefangene Dreierblock wird vollständig berechnet.</p>
        <div className="flex justify-between gap-4 text-xl font-bold"><span>Gesamtsumme<br/><span className="text-sm font-normal">inkl. MwSt.</span></span><span>{money(quote.totalCents)}</span></div>
        <p className="text-sm">Selbstabholung im Markt. Keine Versandkosten oder weiteren Vorauszahlungen.</p>
        <fieldset className="space-y-3"><legend className="font-bold mb-3">Zahlung nach unserer Bestätigung</legend><label className="flex gap-3 items-start"><input type="radio" name="paymentMethod" value="cash" checked={method === "cash"} onChange={() => setMethod("cash")} className="mt-1"/><span>Bar bei Abholung</span></label>{config.onlinePayment && <label className="flex gap-3 items-start"><input type="radio" name="paymentMethod" value="online" checked={method === "online"} onChange={() => setMethod("online")} className="mt-1"/><span>Sicherer Online-Zahlungslink<span className="block text-sm text-muted">Die verfügbaren Zahlungsarten werden auf der Zahlungsseite angezeigt.</span></span></label>}</fieldset>
        <details className="text-sm"><summary className="cursor-pointer font-semibold">Mietbedingungen lesen</summary><p className="whitespace-pre-wrap mt-3">{config.termsText}</p></details>
        <details className="text-sm"><summary className="cursor-pointer font-semibold">Datenschutz zur Bestellung</summary><p className="whitespace-pre-wrap mt-3">{config.privacyText}</p></details>
        <label className="flex gap-3 items-start text-sm"><input type="checkbox" required checked={terms} onChange={event => setTerms(event.target.checked)} className="mt-1"/><span>Ich akzeptiere die Mietbedingungen und habe den Datenschutzhinweis gelesen.</span></label>
        <button type="submit" disabled={busy} className={editorial.primaryLink}>{busy ? "Bestellung wird gespeichert …" : config.testMode ? "Zahlungspflichtig bestellen (Test)" : "Zahlungspflichtig bestellen"}</button>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <p className="text-xs text-muted">Die Eingangsbestätigung ist noch keine Annahme. Bestellübersicht und später verfügbare Belege erhältst du per E-Mail.</p>
      </aside>
    </form>
  </div></>;
}
