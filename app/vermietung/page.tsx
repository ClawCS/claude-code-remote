"use client";

import PageIntro from "@/components/editorial/PageIntro";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { rentalCategories, rentalItems, rentalToProduct } from "@/data/rentals";
import { useCart, type RentalInfo } from "@/context/CartContext";
import { maxRentalQuantity, validRentalRange, rentalFurnitureConflict } from "@/lib/cart-items";
import { calculateWorkdays, formatPrice } from "@/lib/utils";
import { quoteRentals, type RentalQuote } from "@/lib/rental-pricing";
import { money } from "@/lib/rental-cart";
import { MARKET } from "@/lib/cinematic/site";
import { RENTAL_QUANTITY_UNAVAILABLE } from "@/lib/rental-messages";

export default function VermietungPage() {
  const { items, addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<number,number>>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<number,string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const range = {startDate,endDate};
  const datesValid = validRentalRange(range);
  const capacity = (id: number) => maxRentalQuantity(items,id,datesValid ? range : undefined);
  const quantity = (id: number) => quantities[id] ?? 0;
  const quantityError = (id: number) => quantity(id) > capacity(id) ? RENTAL_QUANTITY_UNAVAILABLE : quantityErrors[id];
  const hasInvalidQuantity = rentalItems.some(item => quantity(item.id) > capacity(item.id));
  const selectedCount = rentalItems.reduce((sum,item) => sum + quantity(item.id),0);
  let selectedQuote: RentalQuote | null = null;
  let quoteError = "";
  if (datesValid && selectedCount) {
    try {
      selectedQuote = quoteRentals(rentalItems.filter(item => quantity(item.id) > 0).map(item => ({
        id: item.id, quantity: quantity(item.id), startDate, endDate,
      })));
    } catch (cause) { quoteError = cause instanceof Error ? cause.message : "Bitte Auswahl und Zeitraum prüfen."; }
  }

  function selectQuantity(id: number, value: number) {
    if (!Number.isInteger(value) || value < 0) {
      setQuantityErrors(previous => ({...previous, [id]: "Bitte eine ganze Menge ab 0 auswählen."}));
      return;
    }
    if (value > capacity(id) && value >= quantity(id)) {
      setQuantityErrors(previous => ({...previous, [id]: RENTAL_QUANTITY_UNAVAILABLE}));
      return;
    }
    setQuantityErrors(previous => ({...previous, [id]: ""}));
    setQuantities(previous => {
      const next = {...previous, [id]: value};
      if (next[id] > 0) {
        for (const other of rentalItems) {
          if (rentalFurnitureConflict(id, other.id)) next[other.id] = 0;
        }
      }
      return next;
    });
    setMessage("");
  }

  function addSelected() {
    if (!datesValid || !selectedCount || !selectedQuote || hasInvalidQuantity) return;
    const rental: RentalInfo = {...range,workdays:calculateWorkdays(startDate,endDate),periods:0,basePrice:0,totalRentalPrice:0,priceStatus:"personal-confirmation-required"};
    for (const item of rentalItems) {
      const count = quantity(item.id);
      if (count) addItem(rentalToProduct(item),count,rental);
    }
    setQuantities({});
    setQuantityErrors({});
    setMessage("Deine Auswahl wurde zur Liste hinzugefügt. Noch keine Reservierung – ein Vertrag entsteht erst, wenn der Markt deinen Termin bestätigt.");
  }

  return (
    <div className="public-page rental-page">
      <section data-rental-intro><PageIntro eyebrow="Trinkgut Jammers · Party & Miete" title="Deine Feier. Unser Leihsortiment." description="Kühlung, Ausschank, Mobiliar und Gläser: Wähle Menge und Zeitraum und sieh deinen Mietpreis. Termin und Verfügbarkeit bestätigen wir persönlich." /></section>

      <div className={styles.body}>
        <section aria-labelledby="rental-dates" className={styles.dates}>
          <h2 id="rental-dates" className="text-2xl font-bold mb-4">Dein gewünschter Zeitraum</h2>
          <p className="mb-5 max-w-3xl">Der Grundpreis gilt je Stück für jeden angefangenen Block von drei Werktagen. Mo–Sa zählen, außer NRW-Feiertagen; Abholung und Rückgabe zählen mit. 1–3 Werktage = ein Block, 4–6 = zwei, 7–9 = drei. Alle Mietpreise inklusive MwSt.</p>
          <div className={styles.dateGrid}>
            <label className="block font-medium">Gewünschte Abholung
              <input type="date" value={startDate} onChange={event=>{setStartDate(event.target.value);setMessage("");}} className={styles.field} />
            </label>
            <label className="block font-medium">Gewünschte Rückgabe
              <input type="date" value={endDate} min={startDate || undefined} onChange={event=>{setEndDate(event.target.value);setMessage("");}} className={styles.field} />
            </label>
          </div>
          {startDate && endDate && !datesValid && <p role="alert" className={styles.error}>Bitte einen gültigen Zeitraum auswählen; die Rückgabe darf nicht vor der Abholung liegen.</p>}
        </section>

        {rentalCategories.map(category=>(
          <section key={category} aria-labelledby={`rental-${category === "Gläser" ? "glass" : category === "Kühlung & Ausschank" ? "cooling" : "furniture"}`} className={styles.section}>
            <h2 id={`rental-${category === "Gläser" ? "glass" : category === "Kühlung & Ausschank" ? "cooling" : "furniture"}`} className="text-2xl font-bold mb-5">{category}</h2>
            <div className={styles.rentalGrid}>
              {rentalItems.filter(item=>item.category === category).map(item=>(
                <article key={item.id} data-rental-name={item.name} className={styles.rentalCard}>
                  <figure className="mb-4"><Image src={item.image} alt={`Beispielabbildung: ${item.name}`} width={960} height={640} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={styles.rentalImage} /><figcaption className="text-xs text-muted mt-2">Beispielbild · Modell und Ausführung können abweichen.</figcaption></figure>
                  <h3 className="text-xl font-bold mb-3">{item.name}</h3>
                  <p className={styles.price}>{item.price === null ? "Preis auf Anfrage" : formatPrice(item.price)}</p>
                  {item.price !== null && <p className="text-xs mt-1">je Stück / angefangenem 3-Werktage-Block · inkl. MwSt.</p>}
                  {item.breakagePrice !== null && <p className="text-sm mt-1">Bruchersatz: {formatPrice(item.breakagePrice)} je Stück</p>}
                  <div className="mt-auto pt-5">
                    <label htmlFor={`rental-quantity-${item.id}`} className="block text-sm font-medium">Gewünschte Menge</label>
                    <div className={styles.quantityControl}>
                      <button type="button" aria-label={`Menge für ${item.name} verringern`} disabled={quantity(item.id) === 0} onClick={() => selectQuantity(item.id, quantity(item.id) - 1)} className={styles.iconButton}>−</button>
                      <input id={`rental-quantity-${item.id}`} type="number" inputMode="numeric" aria-label={`Menge für ${item.name}`} aria-invalid={Boolean(quantityError(item.id))} aria-describedby={quantityError(item.id) ? `rental-quantity-error-${item.id}` : undefined} min={0} max={capacity(item.id)} step={1} value={quantity(item.id)} onChange={event => selectQuantity(item.id, Number(event.target.value))} className={styles.quantityInput} />
                      <button type="button" aria-label={`Menge für ${item.name} erhöhen`} onClick={() => selectQuantity(item.id, quantity(item.id) + 1)} className={styles.iconButton}>+</button>
                    </div>
                    {quantityError(item.id) && <p id={`rental-quantity-error-${item.id}`} role="alert" className={styles.error}>{quantityError(item.id)}</p>}
                  </div>
                  {selectedQuote?.lines.filter(line => line.id === item.id).map(line => <div key={line.id} className={styles.lineQuote}>
                    <p>{line.workdays} Werktage · {line.periods} {line.periods === 1 ? "Mietblock" : "Mietblöcke"} · {line.quantity} Stück</p>
                    <p className="mt-1 font-bold">Positionssumme: {money(line.lineTotalCents)}</p>
                  </div>)}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section aria-labelledby="rental-request" className={styles.summary}>
          <h2 id="rental-request" className="text-2xl font-bold mb-3">Deine Mietauswahl</h2>
          <p className="mb-4">{selectedCount ? `${selectedCount} Stück ausgewählt.` : "Wähle Artikelmengen und deinen gewünschten Zeitraum aus."} Deine Auswahl reserviert noch keine Artikel. Verbindliche Absprachen treffen wir persönlich.</p>
          {quoteError && <p role="alert" className={styles.error}>{quoteError}</p>}
          {selectedQuote && (selectedQuote.allPriced ? <p className="mb-5 text-2xl font-bold">Mietgesamtpreis: {money(selectedQuote.totalCents)} <span className="text-sm font-normal">inkl. MwSt.</span></p> : <div className="mb-5">
            <p className="font-semibold">Kein vollständiger Mietgesamtpreis: Mindestens ein Artikel hat einen Preis auf Anfrage.</p>
            <p>Bekannte Mietpositionen: {money(selectedQuote.knownSubtotalCents)} inkl. MwSt. (nur Teilsumme). Bitte unverbindlich anfragen.</p>
          </div>)}
          <div className={styles.actions}>
            <button type="button" onClick={addSelected} disabled={!datesValid || !selectedCount || !selectedQuote || hasInvalidQuantity} className={editorial.primaryLink}>In den Warenkorb</button>
            <Link href="/warenkorb" data-cart-focus-return className={editorial.secondaryLink}>Warenkorb öffnen</Link>
            <a href={MARKET.phoneHref} className={styles.textLink}>Persönlich beraten lassen</a>
          </div>
          <p role="status" aria-live="polite" className="mt-4 max-w-2xl">{message}</p>
        </section>
      </div>
    </div>
  );
}
