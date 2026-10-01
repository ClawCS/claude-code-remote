"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { cartLineKey } from "@/lib/cart-items";
import { buildInquiryText, buildInquiryUrls, type InquiryContact } from "@/lib/reservation-inquiry";
import { MARKET } from "@/lib/cinematic/site";

export default function InquiryCheckout() {
  const {items} = useCart();
  const [contact, setContact] = useState<InquiryContact>({name: "", method: "pickup", postalCode: "", city: "", notes: ""});
  const [handoff, setHandoff] = useState(false);
  const [error, setError] = useState("");
  const inputClass = "w-full border border-border rounded-lg p-3 bg-white text-secondary focus:outline-2 focus:outline-primary";
  if (!items.length) return <div className="max-w-3xl mx-auto px-6 py-16"><h1 className="text-3xl font-bold text-secondary">Deine Anfrageliste ist leer</h1><p className="my-4">Stelle eine Artikelauswahl für deine Anfrage zusammen.</p><Link href="/produkte" className="text-primary underline">Sortiment entdecken</Link></div>;

  function openDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const channel = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
    setError("");
    setHandoff(false);
    try {
      const urls = buildInquiryUrls(buildInquiryText(items, contact));
      setHandoff(true);
      if (channel === "whatsapp") window.open(urls.whatsapp, "_blank", "noopener,noreferrer");
      else window.location.href = urls.email;
    } catch (cause) {setError(cause instanceof Error ? cause.message : "Bitte deine Angaben prüfen.");}
  }

  return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
    <Link href="/warenkorb" className="text-primary underline">Zurück zur Anfrageliste</Link>
    <h1 className="text-3xl md:text-4xl font-bold text-secondary mt-6 mb-4">Reservierung unverbindlich anfragen</h1>
    <p className="text-muted mb-8">Du bereitest eine Nachricht an unser Team vor. Das Öffnen des Entwurfs versendet noch nichts und reserviert keine Ware. Wir bestätigen dir Verfügbarkeit, Preis und Termin persönlich.</p>
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={openDraft} className="space-y-5">
        <div><label htmlFor="inquiry-name" className="block font-semibold mb-2">Dein Name</label><input id="inquiry-name" autoComplete="name" maxLength={100} required value={contact.name} onChange={(e) => setContact({...contact, name:e.target.value})} className={inputClass}/></div>
        <div><label htmlFor="inquiry-method" className="block font-semibold mb-2">Gewünschte Bereitstellung</label><select id="inquiry-method" value={contact.method} onChange={(e) => setContact({...contact, method:e.target.value as InquiryContact["method"]})} className={inputClass}><option value="pickup">Abholung im Markt</option><option value="delivery">Lieferung nach Absprache anfragen</option></select></div>
        {contact.method === "delivery" && <div className="space-y-3"><p className="text-sm text-muted">Liefergebiet, Termin und Kosten stimmen wir individuell mit dir ab.</p><label htmlFor="inquiry-postal" className="block font-semibold">PLZ</label><input id="inquiry-postal" autoComplete="postal-code" required maxLength={10} value={contact.postalCode} onChange={(e) => setContact({...contact,postalCode:e.target.value})} className={inputClass}/><label htmlFor="inquiry-city" className="block font-semibold">Ort</label><input id="inquiry-city" autoComplete="address-level2" required maxLength={100} value={contact.city} onChange={(e) => setContact({...contact,city:e.target.value})} className={inputClass}/></div>}
        <div><label htmlFor="inquiry-notes" className="block font-semibold mb-2">Termin oder Anmerkungen (optional)</label><textarea id="inquiry-notes" rows={4} maxLength={500} value={contact.notes} onChange={(e) => setContact({...contact,notes:e.target.value})} className={inputClass}/></div>
        <p className="text-sm text-muted">Diese Angaben werden auf der Website nicht dauerhaft gespeichert. Beim Öffnen werden sie an dein Mailprogramm oder WhatsApp übergeben. Du prüfst und sendest die Nachricht selbst. <Link href="/datenschutz" className="text-primary underline">Datenschutz</Link></p>
        <div className="flex flex-wrap gap-3"><button name="channel" value="email" type="submit" className="px-5 py-3 bg-primary text-white font-bold rounded-lg">E-Mail-Entwurf öffnen</button><button name="channel" value="whatsapp" type="submit" className="px-5 py-3 border-2 border-primary text-primary font-bold rounded-lg">WhatsApp-Nachricht öffnen</button></div>
        {error && <p role="alert" className="p-4 bg-red-50 border border-red-300 rounded-lg text-secondary">{error}</p>}
        {handoff && <p role="status" className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-secondary">Nachrichtenentwurf angefordert – noch nicht versendet. Bitte sende die Nachricht selbst ab. Die Website kann den Versand nicht erkennen. Deine Anfrageliste bleibt erhalten; eine Reservierung bestätigen wir persönlich.</p>}
      </form>
      <aside className="bg-white border border-border rounded-xl p-6 h-fit"><h2 className="text-xl font-bold mb-5">Deine Anfrageübersicht</h2><ul className="space-y-4">{items.map((item) => <li key={cartLineKey(item)} className="border-b border-border pb-3"><span className="font-semibold">{item.quantity} × {item.product.name}</span>{item.rental && <p className="text-sm text-muted mt-1">Gewünschter Leihzeitraum: {item.rental.startDate} bis {item.rental.endDate}</p>}</li>)}</ul><p className="text-sm text-muted mt-5">Aktuelle Preise, Bestand, Pfand und gegebenenfalls Lieferkosten bestätigt unser Team vor einer Reservierung.</p><p className="mt-4 text-sm">Fragen? <a className="text-primary underline" href={MARKET.phoneHref}>{MARKET.phoneDisplay}</a></p></aside>
    </div>
  </div>;
}
