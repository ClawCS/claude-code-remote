"use client";
import PageIntro from "@/components/editorial/PageIntro";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
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
  const inputClass = styles.field;
  if (!items.length) return <><PageIntro title="Deine Anfrageliste ist leer" description="Stelle eine Artikelauswahl für deine Anfrage zusammen." /><div className={styles.body}><Link href="/produkte" className={editorial.primaryLink}>Sortiment entdecken</Link></div></>;

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

  return <><PageIntro title="Reservierung unverbindlich anfragen" description="Du bereitest eine Nachricht an unser Team vor. Das Öffnen des Entwurfs versendet noch nichts und reserviert keine Ware. Wir bestätigen dir Verfügbarkeit, Preis und Termin persönlich."><Link href="/warenkorb" className={editorial.secondaryLink}>Zurück zur Anfrageliste</Link></PageIntro>
    <div className={styles.body} data-service="inquiry">
    <div className={styles.formLayout}>
      <form onSubmit={openDraft} className={styles.form}>
        <div><label htmlFor="inquiry-name" className="block font-semibold mb-2">Dein Name</label><input id="inquiry-name" autoComplete="name" maxLength={100} required value={contact.name} onChange={(e) => setContact({...contact, name:e.target.value})} className={inputClass}/></div>
        <div><label htmlFor="inquiry-method" className="block font-semibold mb-2">Gewünschte Bereitstellung</label><select id="inquiry-method" value={contact.method} onChange={(e) => setContact({...contact, method:e.target.value as InquiryContact["method"]})} className={inputClass}><option value="pickup">Abholung im Markt</option><option value="delivery">Lieferung nach Absprache anfragen</option></select></div>
        {contact.method === "delivery" && <div className="space-y-3"><p className="text-sm text-muted">Liefergebiet, Termin und Kosten stimmen wir individuell mit dir ab.</p><label htmlFor="inquiry-postal" className="block font-semibold">PLZ</label><input id="inquiry-postal" autoComplete="postal-code" required maxLength={10} value={contact.postalCode} onChange={(e) => setContact({...contact,postalCode:e.target.value})} className={inputClass}/><label htmlFor="inquiry-city" className="block font-semibold">Ort</label><input id="inquiry-city" autoComplete="address-level2" required maxLength={100} value={contact.city} onChange={(e) => setContact({...contact,city:e.target.value})} className={inputClass}/></div>}
        <div><label htmlFor="inquiry-notes" className="block font-semibold mb-2">Termin oder Anmerkungen (optional)</label><textarea id="inquiry-notes" rows={4} maxLength={500} value={contact.notes} onChange={(e) => setContact({...contact,notes:e.target.value})} className={inputClass}/></div>
        <p className="text-sm text-muted">Diese Angaben werden auf der Website nicht dauerhaft gespeichert. Beim Öffnen werden sie an dein Mailprogramm oder WhatsApp übergeben. Du prüfst und sendest die Nachricht selbst. <Link href="/datenschutz" className="text-primary underline">Datenschutz</Link></p>
        <div className={styles.actions}><button name="channel" value="email" type="submit" className={editorial.primaryLink}>E-Mail-Entwurf öffnen</button><button name="channel" value="whatsapp" type="submit" className={editorial.secondaryLink}>WhatsApp-Nachricht öffnen</button></div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {handoff && <p role="status" className={styles.notice}>Nachrichtenentwurf angefordert – noch nicht versendet. Bitte sende die Nachricht selbst ab. Die Website kann den Versand nicht erkennen. Deine Anfrageliste bleibt erhalten; eine Reservierung bestätigen wir persönlich.</p>}
      </form>
      <aside className={styles.summary}><h2 className="text-xl font-bold mb-5">Deine Anfrageübersicht</h2><ul className="space-y-4">{items.map((item) => <li key={cartLineKey(item)} className="border-b border-border pb-3"><span className="font-semibold">{item.quantity} × {item.product.name}</span>{item.rental && <p className="text-sm text-muted mt-1">Gewünschter Leihzeitraum: {item.rental.startDate} bis {item.rental.endDate}</p>}</li>)}</ul><p className="text-sm text-muted mt-5">Aktuelle Preise, Bestand, Pfand und gegebenenfalls Lieferkosten bestätigt unser Team vor einer Reservierung.</p><p className="mt-4 text-sm">Fragen? <a className="text-primary underline" href={MARKET.phoneHref}>{MARKET.phoneDisplay}</a></p></aside>
    </div>
  </div></>;
}
