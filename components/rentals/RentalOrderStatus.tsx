"use client";
import { useEffect, useRef, useState } from "react";
import type { RentalOrder } from "@/lib/rental-orders/types";
const money = (cents: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
const statuses: Record<RentalOrder["status"], string> = { submitted: "Bestellung eingegangen", accepted: "Vom Markt bestätigt", declined: "Nicht angenommen", handed_over: "Artikel übergeben", returned: "Rückgabe erfasst" };

/** Order versions are monotonic only within the same order identity. */
export function chooseRentalOrderSnapshot(current: RentalOrder | null, incoming: RentalOrder): RentalOrder {
  return current?.id === incoming.id && incoming.version <= current.version ? current : incoming;
}

export default function RentalOrderStatus({ id, token }: { id: string; token: string }) {
  const [order, setOrder] = useState<RentalOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const currentOrder = useRef<RentalOrder | null>(null);
  const generation = useRef(0);
  const lifecycle = useRef<AbortController | null>(null);
  const mutationActive = useRef(false);
  const endpoint = `/api/rentals/orders/${encodeURIComponent(id)}`;
  const query = `?token=${encodeURIComponent(token)}`;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    lifecycle.current = controller;
    const update = async () => {
      if (mutationActive.current) return;
      const requestGeneration = ++generation.current;
      try {
        const response = await fetch(endpoint + query, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Bestellung konnte nicht geladen werden.");
        if (active) {
          const next = chooseRentalOrderSnapshot(currentOrder.current, data.order);
          currentOrder.current = next; setOrder(next);
          if (requestGeneration === generation.current) setError("");
        }
      } catch (cause) {
        if (active && requestGeneration === generation.current) setError(cause instanceof Error ? cause.message : "Verbindung fehlgeschlagen.");
      }
    };
    void update(); const interval = setInterval(() => { if (!document.hidden) void update(); }, 20000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [endpoint, query]);
  async function testPayment() {
    if (mutationActive.current) return;
    const controller = lifecycle.current;
    if (!controller || controller.signal.aborted) return;
    mutationActive.current = true;
    const requestGeneration = ++generation.current;
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint + "/test-payment" + query, { method: "POST", signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Testzahlung fehlgeschlagen.");
      if (!controller.signal.aborted) {
        const next = chooseRentalOrderSnapshot(currentOrder.current, data.order);
        currentOrder.current = next; setOrder(next);
      }
    } catch (cause) {
      if (!controller.signal.aborted && requestGeneration === generation.current) setError(cause instanceof Error ? cause.message : "Testzahlung fehlgeschlagen.");
    } finally { mutationActive.current = false; setBusy(false); }
  }
  return <div className="max-w-4xl mx-auto px-5 py-10">
    <h1 className="text-3xl md:text-4xl font-bold mb-6">Deine Bestellübersicht</h1>
    {error && <div role="alert" className="p-4 bg-red-50 rounded-lg mb-5">{error}<button onClick={() => window.location.reload()} className="underline block mt-3">Erneut laden</button></div>}
    {!order && !error && <p role="status">Bestellung wird geladen …</p>}
    {order && <>
      {order.testMode && <p className="p-4 bg-amber-50 border border-amber-400 rounded-lg mb-5 font-bold">Testbetrieb – kein echter Vertrag, keine echte Zahlung, keine E-Mail versendet.</p>}
      <section className="bg-white rounded-xl border border-border p-6 mb-6">
        <p className="text-sm text-muted">{order.number}</p><h2 className="text-2xl font-bold my-3" aria-live="polite">{statuses[order.status]}</h2>
        {order.status === "submitted" && <p>Wir prüfen deinen Termin und die Verfügbarkeit. Diese Eingangsbestätigung ist noch keine Annahme. Du musst jetzt noch nichts bezahlen.</p>}
        {order.status === "declined" && <p>Für diese Bestellung ist kein Mietvertrag zustande gekommen. Bitte kontaktiere uns für einen anderen Termin oder eine Alternative.</p>}
        {order.status === "accepted" && <p>Deine Bestellung wurde ausdrücklich angenommen. {order.payment.status === "paid" ? "Die Zahlung ist erfasst. Deine Artikel können zum vereinbarten Termin abgeholt werden." : order.paymentMethod === "cash" ? "Bitte bezahle den Gesamtbetrag bei Abholung bar." : "Bitte bezahle über den sicheren Zahlungslink, sobald er verfügbar ist."}</p>}
        {order.status === "handed_over" && <p>Die Übergabe wurde vom Markt erfasst. Deinen Lieferschein findest du unten.</p>}
        {order.status === "returned" && <p>Der Markt hat die Rückgabe erfasst. Danke!</p>}
        <p aria-live="polite" className="font-semibold mt-4">Zahlung: {order.payment.status === "paid" ? "bezahlt" : order.status === "declined" ? "nicht erforderlich" : order.paymentMethod === "cash" ? "bar bei Abholung" : order.payment.status === "not_requested" ? "noch nicht angefordert" : "noch nicht bezahlt"}</p>
        {order.status === "accepted" && order.paymentMethod === "online" && order.payment.status !== "paid" && <div className="mt-5">{order.payment.url && order.payment.status === "pending" ? order.testMode ? <button type="button" disabled={busy} onClick={testPayment} className="p-3 rounded-lg bg-primary text-white font-bold disabled:opacity-50">{busy ? "Test wird verarbeitet …" : "Zahlung lokal simulieren (Test)"}</button> : <a href={order.payment.url} referrerPolicy="no-referrer" rel="noreferrer" className="inline-flex p-3 rounded-lg bg-primary text-white font-bold">Sicher online bezahlen</a> : <p>Der Zahlungslink wird vom Markt vorbereitet. Bei einer abgelaufenen oder fehlgeschlagenen Zahlung erhältst du nach Prüfung einen neuen Link.</p>}</div>}
      </section>
      <section className="bg-white rounded-xl border border-border p-6 mb-6"><h2 className="text-xl font-bold mb-5">Artikel und Mietsumme</h2><ul className="space-y-4">{order.quote.lines.map(line => <li key={`${line.id}:${line.startDate}:${line.endDate}`} className="border-b border-border pb-4"><div className="flex gap-3 justify-between font-semibold"><span>{line.quantity} × {line.name}</span><span className="whitespace-nowrap">{money(line.lineTotalCents!)}</span></div><p className="text-sm mt-2">{line.startDate.split("-").reverse().join(".")} – {line.endDate.split("-").reverse().join(".")} · {line.workdays} Werktage · {line.periods} Dreierblock{line.periods === 1 ? "" : "e"}</p><p className="text-sm text-muted">{money(line.unitPriceCents!)} je Stück und Dreierblock, inkl. MwSt.</p></li>)}</ul><p className="text-xl font-bold flex justify-between gap-4 mt-6"><span>Gesamt inkl. MwSt.</span><span>{money(order.quote.totalCents!)}</span></p></section>
      <section className="bg-white rounded-xl border border-border p-6"><h2 className="text-xl font-bold mb-3">Deine Belege</h2><div className="flex flex-wrap gap-4">{order.invoice && <a href={endpoint + "/documents/invoice" + query} className="text-primary underline">Rechnung als PDF</a>}{order.deliveryNote && <a href={endpoint + "/documents/delivery_note" + query} className="text-primary underline">Lieferschein als PDF</a>}{!order.invoice && <p>Die Rechnung wird nach der Marktbestätigung bereitgestellt; der Lieferschein nach der tatsächlichen Übergabe.</p>}</div><p className="text-sm text-muted mt-4">Belege gehen zusätzlich an deine E-Mail-Adresse und den Markt. Bei Versandproblemen kann das Team den Versand erneut anstoßen.</p><details className="mt-5 text-sm"><summary className="cursor-pointer">Vereinbarte Mietbedingungen</summary><p className="whitespace-pre-wrap mt-3">{order.termsText}</p></details></section>
      <p className="text-sm text-muted mt-6">Dieser Link ist dein persönlicher Zugang. Bitte nicht öffentlich teilen. Die Ansicht aktualisiert sich automatisch.</p>
    </>}
  </div>;
}
