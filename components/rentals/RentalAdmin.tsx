"use client";

import React, { useCallback, useEffect, useState, type FormEvent } from "react";
import type { RentalOrder, RentalOutboxJob } from "@/lib/rental-orders/types";

type Dashboard = { orders: RentalOrder[]; jobs: RentalOutboxJob[]; testMode: boolean };
type TestMessage = { to: string; subject: string; text: string; attachments: { filename: string }[]; messageId: string };
type Action = "accept" | "decline" | "cash" | "handover" | "return" | "retry_payment" | "sync_payment";
const buttonClass = "min-h-12 rounded-lg border border-border bg-white px-4 py-3 text-sm font-semibold hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = `${buttonClass} !border-primary !bg-primary !text-white hover:!bg-red-800`;
const money = (cents: number | null) => cents === null ? "Preis noch offen" : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
const dateOnly = (date: string) => date.split("-").reverse().join(".");
const timestamp = (value: string) => new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const orderLabels: Record<RentalOrder["status"], string> = {
  submitted: "Noch nicht bestätigt", accepted: "Termin bestätigt · Vertrag geschlossen",
  declined: "Abgelehnt", handed_over: "Ausgegeben", returned: "Zurückgegeben",
};
const paymentLabels: Record<RentalOrder["payment"]["status"], string> = {
  not_requested: "Noch nicht angefordert", pending: "Zahlung ausstehend", paid: "Bezahlt",
  failed: "Zahlung fehlgeschlagen", canceled: "Zahlung abgebrochen", expired: "Zahlung abgelaufen",
};
const eventLabels: Record<RentalOutboxJob["event"], string> = {
  received: "Eingang", accepted: "Terminbestätigung", declined: "Ablehnung",
  paid: "Zahlungsbestätigung", handed_over: "Ausgabe", returned: "Rückgabe",
};

class RequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new RequestError(typeof body?.error === "string" ? body.error :
      response.status === 401 ? "Bitte erneut mit dem Marktpasswort anmelden." : "Die Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen.", response.status);
  }
  return body as T;
}

function OrderCard({ order, jobs, busy, act }: {
  order: RentalOrder; jobs: RentalOutboxJob[]; busy: boolean; act: (order: RentalOrder, action: Action) => void;
}) {
  const paid = order.payment.status === "paid";
  const reconciliation = order.events.filter(event => event.type.includes("reconciliation"));
  const documentBase = `/api/rental-admin/orders/${encodeURIComponent(order.id)}/documents`;
  return (
    <article aria-labelledby={`order-${order.id}`} className="min-w-0 rounded-2xl border border-border bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest">Eingegangen {timestamp(order.createdAt)}</p>
          <h2 id={`order-${order.id}`} className="mt-1 text-2xl font-bold">Bestellung {order.number}</h2>
          <p className="mt-2 font-semibold text-primary">{orderLabels[order.status]}</p>
        </div>
        <p className="text-2xl font-bold">{money(order.quote.totalCents)}</p>
      </div>
      {reconciliation.length > 0 && <div role="alert" className="mt-5 rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-amber-950">
        <p className="font-bold">Manueller Zahlungsabgleich erforderlich</p>
        <p className="mt-2 text-sm">Zahlungsversuche und Zahlungseingänge beim Zahlungsanbieter manuell prüfen und mit dieser Bestellung abgleichen. Keine automatische Erstattung oder Stornierung: Nötige Anbieteraktionen muss das Marktteam nach Prüfung selbst veranlassen.</p>
        <p className="mt-2 text-sm">Ein unklarer früherer Versuch ist keine Freigabe für eine weitere Zahlungsanforderung. Der angezeigte Zahlungsstatus stammt weiterhin aus der gespeicherten Bestellung, nicht aus diesem Hinweis.</p>
        <ul className="mt-3 space-y-2 text-sm">{reconciliation.map((event, index) => <li key={`${event.at}:${event.type}:${index}`} className="break-words">
          {timestamp(event.at)} · {event.type === "payment_manual_reconciliation_required" ? "Unklarer Ausgang einer Zahlungsanlage seit mindestens zwölf Stunden" : event.type === "payment_paid_previous_attempt_manual_reconciliation" ? "Zahlung eines früheren Versuchs bei gleichzeitig neuerem Zahlungsversuch" : "Abweichung beim Zahlungsabgleich"}{event.note && `: ${event.note}`}
        </li>)}</ul>
      </div>}
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <section aria-label={`Kundendaten für ${order.number}`} className="min-w-0">
          <h3 className="font-bold">Kunde / Kundin</h3>
          <p className="mt-2 break-words font-semibold">{order.customer.name}</p>
          {order.customer.company && <p className="break-words">{order.customer.company}</p>}
          <address className="mt-2 break-words not-italic">
            {order.customer.street}<br />{order.customer.postalCode} {order.customer.city}<br />{order.customer.country}
          </address>
          <p className="mt-3 break-all"><a className="underline underline-offset-4" href={`mailto:${order.customer.email}`}>{order.customer.email}</a></p>
          <p className="break-words"><a className="underline underline-offset-4" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></p>
          {order.customer.notes && <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-light p-3">{order.customer.notes}</p>}
        </section>
        <section aria-label={`Zahlung und Belege für ${order.number}`}>
          <h3 className="font-bold">Zahlung &amp; Belege</h3>
          <dl className="mt-2 space-y-2 text-sm">
            <div><dt className="inline font-semibold">Zahlungsart: </dt><dd className="inline">{order.paymentMethod === "cash" ? "Bar bei Abholung" : "Online"}</dd></div>
            <div><dt className="inline font-semibold">Zahlungsstatus: </dt><dd className="inline">{paymentLabels[order.payment.status]}</dd></div>
            <div><dt className="inline font-semibold">Rechnung: </dt><dd className="inline">{order.invoice?.number ?? "Noch nicht erstellt"}</dd></div>
            <div><dt className="inline font-semibold">Lieferschein: </dt><dd className="inline">{order.deliveryNote?.number ?? "Erst nach tatsächlicher Ausgabe"}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            {order.invoice && <a href={`${documentBase}/invoice`} className={buttonClass}>Rechnung als PDF</a>}
            {order.deliveryNote && <a href={`${documentBase}/delivery_note`} className={buttonClass}>Lieferschein als PDF</a>}
          </div>
        </section>
      </div>
      <section aria-label={`Leihartikel für ${order.number}`} className="mt-6">
        <h3 className="font-bold">Leihartikel</h3>
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {order.quote.lines.map(line => (
            <li key={`${line.id}:${line.startDate}:${line.endDate}`} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="break-words font-semibold">{line.quantity} × {line.name}</p>
                <p className="mt-1 text-sm">Abholung {dateOnly(line.startDate)} · Rückgabe {dateOnly(line.endDate)}</p>
                <p className="text-sm">{line.workdays} Werktage · {line.periods} {line.periods === 1 ? "Mietblock" : "Mietblöcke"} · {money(line.unitPriceCents)} je Stück / Block</p>
              </div>
              <p className="font-semibold sm:text-right">{money(line.lineTotalCents)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs">Ein Mietblock umfasst bis zu drei Werktage. Alle Preise inklusive Umsatzsteuer.</p>
      </section>
      <div role="group" className="mt-6 flex flex-wrap gap-3" aria-label={`Aktionen für Bestellung ${order.number}`} aria-busy={busy}>
        {order.status === "submitted" && <>
          <button type="button" disabled={busy} className={primaryClass} onClick={() => act(order, "accept")}>Termin bestätigen</button>
          <button type="button" disabled={busy} className={buttonClass} onClick={() => act(order, "decline")}>Ablehnen</button>
        </>}
        {order.status === "accepted" && order.paymentMethod === "cash" && !paid &&
          <button type="button" disabled={busy} className={primaryClass} onClick={() => act(order, "cash")}>Barzahlung erhalten</button>}
        {order.status === "accepted" && paid &&
          <button type="button" disabled={busy} className={primaryClass} onClick={() => act(order, "handover")}>Ausgabe bestätigen</button>}
        {order.status === "handed_over" &&
          <button type="button" disabled={busy} className={primaryClass} onClick={() => act(order, "return")}>Rückgabe bestätigen</button>}
        {order.status === "accepted" && order.paymentMethod === "online" && !paid &&
          <button type="button" disabled={busy} className={buttonClass} onClick={() => act(order, "retry_payment")}>Zahlungslink erneut bereitstellen</button>}
        {order.payment.id && order.paymentMethod === "online" &&
          <button type="button" disabled={busy} className={buttonClass} onClick={() => act(order, "sync_payment")}>Zahlungsstatus prüfen</button>}
      </div>
      {order.status === "submitted" && <p className="mt-3 text-sm">Mit „Termin bestätigen“ wird die Verfügbarkeit verbindlich zugesagt und der Vertrag geschlossen. Vorher keine Zahlungsanforderung.</p>}
      {order.status === "accepted" && !paid && <p className="mt-3 text-sm">Ausgabe erst nach bestätigter Zahlung. Barzahlung nur nach tatsächlichem Zahlungseingang erfassen.</p>}
      <details className="mt-5 border-t border-border pt-4">
        <summary className="cursor-pointer py-2 font-semibold">E-Mail-Status ({jobs.filter(job => job.state === "sent").length}/{jobs.length} versendet)</summary>
        {jobs.length === 0 ? <p className="mt-2 text-sm">Noch keine E-Mail-Aufträge.</p> : <ul className="mt-2 space-y-3">
          {jobs.map(job => <li key={job.id} className="break-words rounded-lg bg-light p-3 text-sm">
            <p className="font-semibold">{eventLabels[job.event]} · {job.recipient === "customer" ? "Kunde / Kundin" : "Markt"}</p>
            <p>{job.state === "sent" ? "Versendet" : job.state === "sending" ? "Versand läuft / Ergebnis noch offen" : "Wartet auf Versand"} · {job.attempts} Versuche</p>
            {job.state !== "sent" && <p>Nächster Versuch: {timestamp(job.nextAttemptAt)}</p>}
            {job.error && <p className="mt-1 text-primary">Hinweis: {job.error}</p>}
          </li>)}
        </ul>}
      </details>
    </article>
  );
}

export default function RentalAdmin() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [testMessages, setTestMessages] = useState<TestMessage[] | null>(null);

  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof RequestError && cause.status === 401) {
      setDashboard(null); setTestMessages(null);
    }
    setError(cause instanceof Error ? cause.message : "Die Verbindung ist fehlgeschlagen. Bitte erneut versuchen.");
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const result = await request<Dashboard>("/api/rental-admin/orders", { signal });
    setDashboard(result);
    return result;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal).catch(cause => {
      if (!controller.signal.aborted && !(cause instanceof RequestError && cause.status === 401)) handleError(cause);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh, handleError]);

  async function run(key: string, operation: () => Promise<unknown>, success = "") {
    if (busy) return;
    setBusy(key); setError(""); setNotice("");
    try { await operation(); setNotice(success); }
    catch (cause) { handleError(cause); }
    finally { setBusy(null); }
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run("login", async () => {
      await request("/api/rental-admin/session", { method: "POST", body: JSON.stringify({ password }) });
      setPassword(""); await refresh();
    });
  }

  function act(order: RentalOrder, action: Action) {
    void run(`${order.id}:${action}`, async () => {
      let actionError: unknown;
      try {
        await request(`/api/rental-admin/orders/${encodeURIComponent(order.id)}`, {
          method: "POST", body: JSON.stringify({ action, version: order.version }),
        });
      } catch (cause) { actionError = cause; }
      let latest: Dashboard;
      try { latest = await refresh(); }
      catch (cause) {
        if (cause instanceof RequestError && cause.status === 401) throw cause;
        if (actionError instanceof Error) throw new Error(`${actionError.message} Der aktuelle Bestellstatus konnte nicht geladen werden. Bitte aktualisieren; die Fehlermeldung macht eine bereits gespeicherte Aktion nicht rückgängig.`);
        throw cause;
      }
      if (actionError) {
        const accepted = action === "accept" && latest.orders.some(current => current.id === order.id && ["accepted", "handed_over", "returned"].includes(current.status));
        if (accepted) throw new Error(`${actionError instanceof Error ? actionError.message : "Die Zahlungsanlage ist fehlgeschlagen."} Der Termin ist trotzdem verbindlich bestätigt und der Vertrag geschlossen. Ein Zahlungsdienstfehler hebt diese Bestätigung nicht auf. Bitte Zahlungsstatus und Versandhinweise prüfen.`);
        throw actionError;
      }
    }, `Bestellung ${order.number} wurde aktualisiert.`);
  }

  function loadTestMessages() {
    void run("test-mails", async () => {
      const result = await request<{ messages: TestMessage[] }>("/api/rental-admin/test-mails");
      setTestMessages(result.messages);
    });
  }

  return (
    <div className="public-page min-h-[60vh] bg-light text-secondary">
      <section className="category-intro">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-widest">Trinkgut Jammers · Markt</p>
          <h1 className="break-words">Leihbestellungen</h1>
          <p>Verfügbarkeit bestätigen, Zahlung verfolgen und die tatsächliche Ausgabe dokumentieren.</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">{error}</p>}
        <p role="status" aria-live="polite" className={notice || busy || loading ? "mb-5" : "sr-only"}>
          {busy ? "Aktion wird verarbeitet …" : loading ? "Bestellungen werden geladen …" : notice}
        </p>
        {!loading && !dashboard && <section aria-labelledby="admin-login" className="max-w-lg rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 id="admin-login" className="text-2xl font-bold">Marktzugang</h2>
          <p className="mt-3">Dieser Bereich ist nur für das Marktteam. Für den lokalen Testzugang siehe Betriebsdokumentation.</p>
          <form onSubmit={login} className="mt-6">
            <label htmlFor="rental-admin-password" className="block font-semibold">Marktpasswort</label>
            <input id="rental-admin-password" name="password" type="password" autoComplete="current-password" required value={password}
              onChange={event => setPassword(event.target.value)} disabled={Boolean(busy)}
              className="mt-2 min-h-12 w-full rounded-lg border border-border bg-white px-3" />
            <button type="submit" disabled={Boolean(busy) || !password} className={`${primaryClass} mt-5 w-full`}>{busy === "login" ? "Anmeldung läuft …" : "Anmelden"}</button>
          </form>
        </section>}
        {dashboard && <>
          {dashboard.testMode && <div role="note" className="mb-6 rounded-xl border-2 border-amber-500 bg-amber-50 p-5 text-amber-950">
            <p className="text-lg font-bold">TESTMODUS · Keine echten Bestellungen</p>
            <p className="mt-1">Nur erfundene Kundendaten verwenden. E-Mails werden im Testpostfach erfasst; es werden keine echten Nachrichten versendet oder Zahlungen belastet.</p>
          </div>}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="font-semibold">{dashboard.orders.length} {dashboard.orders.length === 1 ? "Bestellung" : "Bestellungen"} · neueste zuerst</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={Boolean(busy)} className={buttonClass} onClick={() => void run("refresh", () => refresh(), "Bestellungen aktualisiert.")}>Aktualisieren</button>
              <button type="button" disabled={Boolean(busy)} className={buttonClass} onClick={() => void run("logout", async () => {
                await request("/api/rental-admin/session", { method: "DELETE" });
                setDashboard(null); setTestMessages(null); setPassword("");
              }, "Abgemeldet.")}>Abmelden</button>
            </div>
          </div>
          <section aria-labelledby="outbox-title" className="mb-7 rounded-xl border border-border bg-white p-5">
            <h2 id="outbox-title" className="text-xl font-bold">E-Mail-Ausgang</h2>
            <p className="mt-2 text-sm">{dashboard.jobs.filter(job => job.state === "sent").length} versendet · {dashboard.jobs.filter(job => job.state === "pending").length} ausstehend · {dashboard.jobs.filter(job => job.state === "sending").length} in Verarbeitung</p>
            <p className="mt-2 text-sm">Kunde und Markt werden getrennt versorgt. Offene Versandversuche bleiben sichtbar; bereits versendete E-Mails werden nicht erneut verschickt.</p>
            <button type="button" disabled={Boolean(busy)} className={`${buttonClass} mt-4`} onClick={() => void run("outbox", async () => {
              await request("/api/rental-admin/outbox", { method: "POST", body: "{}" }); await refresh();
            }, "Fällige E-Mail-Aufträge wurden verarbeitet. Status und Hinweise bitte prüfen.")}>Ausstehende E-Mails erneut versuchen</button>
          </section>
          {dashboard.orders.length === 0 ? <p className="rounded-xl border border-border bg-white p-6">Noch keine Leihbestellungen eingegangen.</p> :
            <div className="space-y-6">{dashboard.orders.map(order => <OrderCard key={order.id} order={order}
              jobs={dashboard.jobs.filter(job => job.orderId === order.id)} busy={Boolean(busy)} act={act} />)}</div>}
          {dashboard.testMode && <details className="mt-8 rounded-xl border border-border bg-white p-5" onToggle={event => {
            if (event.currentTarget.open && testMessages === null && !busy) loadTestMessages();
          }}>
            <summary className="cursor-pointer py-2 text-lg font-bold">Testpostfach ansehen</summary>
            <button type="button" disabled={Boolean(busy)} className={`${buttonClass} mt-3`} onClick={loadTestMessages}>Testpostfach aktualisieren</button>
            {testMessages?.length === 0 && <p className="mt-4">Noch keine Testnachrichten erfasst.</p>}
            {testMessages && <ul className="mt-5 space-y-4">{testMessages.map((message, index) => <li key={`${message.messageId}:${index}`} className="min-w-0 rounded-lg border border-border p-4">
              <p className="break-all text-sm">An: {message.to}</p>
              <h3 className="mt-2 break-words font-bold">{message.subject}</h3>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">{message.text}</p>
              <p className="mt-3 break-words text-sm">Anhänge: {message.attachments.length ? message.attachments.map(attachment => attachment.filename).join(", ") : "Keine"}</p>
            </li>)}</ul>}
          </details>}
        </>}
      </div>
    </div>
  );
}
