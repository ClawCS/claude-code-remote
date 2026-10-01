"use client";

import Link from "next/link";
import { useState } from "react";
import { rentalCategories, rentalItems, rentalToProduct } from "@/data/rentals";
import { useCart, type RentalInfo } from "@/context/CartContext";
import { maxRentalQuantity, validRentalRange, rentalFurnitureConflict } from "@/lib/cart-items";
import { calculateWorkdays, formatPrice } from "@/lib/utils";
import { quoteRentals, type RentalQuote } from "@/lib/rental-pricing";
import { money } from "@/lib/rental-cart";
import { MARKET } from "@/lib/cinematic/site";

export default function VermietungPage() {
  const { items, addItem } = useCart();
  const [quantities, setQuantities] = useState<Record<number,number>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const range = {startDate,endDate};
  const datesValid = validRentalRange(range);
  const capacity = (id: number) => maxRentalQuantity(items,id,datesValid ? range : undefined);
  const quantity = (id: number) => Math.min(quantities[id] ?? 0,capacity(id));
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
    if (!Number.isInteger(value)) return;
    setQuantities(previous => {
      const next = {...previous, [id]: Math.max(0, Math.min(value, capacity(id)))};
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
    if (!datesValid || !selectedCount || !selectedQuote) return;
    const rental: RentalInfo = {...range,workdays:calculateWorkdays(startDate,endDate),periods:0,basePrice:0,totalRentalPrice:0,priceStatus:"personal-confirmation-required"};
    for (const item of rentalItems) {
      const count = quantity(item.id);
      if (count) addItem(rentalToProduct(item),count,rental);
    }
    setQuantities({});
    setMessage("Deine Auswahl wurde zur Liste hinzugefügt. Noch keine Reservierung – ein Vertrag entsteht erst, wenn der Markt deinen Termin bestätigt.");
  }

  return (
    <div className="public-page rental-page">
      <section className="category-intro" data-rental-intro>
        <div>
          <p className="text-sm uppercase tracking-widest mb-4">Trinkgut Jammers · Party &amp; Miete</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-5">Deine Feier. Unser Leihsortiment.</h1>
          <p className="text-lg max-w-2xl leading-relaxed">Kühlung, Ausschank, Mobiliar und Gläser: Wähle Menge und Zeitraum und sieh deinen Mietpreis. Die Verfügbarkeit bestätigen wir nach deiner Bestellung.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-14">
        <section aria-labelledby="rental-dates" className="mb-10">
          <h2 id="rental-dates" className="text-2xl font-bold mb-4">Dein gewünschter Zeitraum</h2>
          <p className="mb-5 max-w-3xl">Der Grundpreis gilt je Stück für jeden angefangenen Block von drei Werktagen. Mo–Sa zählen, außer NRW-Feiertagen; Abholung und Rückgabe zählen mit. 1–3 Werktage = ein Block, 4–6 = zwei, 7–9 = drei. Alle Mietpreise inklusive MwSt.</p>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
            <label className="block font-medium">Gewünschte Abholung
              <input type="date" value={startDate} onChange={event=>{setStartDate(event.target.value);setMessage("");}} className="block w-full border border-border rounded-lg px-3 min-h-12 mt-2 bg-white text-secondary" />
            </label>
            <label className="block font-medium">Gewünschte Rückgabe
              <input type="date" value={endDate} min={startDate || undefined} onChange={event=>{setEndDate(event.target.value);setMessage("");}} className="block w-full border border-border rounded-lg px-3 min-h-12 mt-2 bg-white text-secondary" />
            </label>
          </div>
          {startDate && endDate && !datesValid && <p role="alert" className="text-primary mt-3">Bitte einen gültigen Zeitraum auswählen; die Rückgabe darf nicht vor der Abholung liegen.</p>}
        </section>

        {rentalCategories.map(category=>(
          <section key={category} aria-labelledby={`rental-${category === "Gläser" ? "glass" : category === "Kühlung & Ausschank" ? "cooling" : "furniture"}`} className="mb-10">
            <h2 id={`rental-${category === "Gläser" ? "glass" : category === "Kühlung & Ausschank" ? "cooling" : "furniture"}`} className="text-2xl font-bold mb-5">{category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rentalItems.filter(item=>item.category === category).map(item=>(
                <article key={item.id} data-rental-name={item.name} data-physical-stock={item.physicalStock} className="bg-white border border-border rounded-xl p-5 flex flex-col">
                  <h3 className="text-xl font-bold mb-3">{item.name}</h3>
                  <p className="text-primary font-bold text-lg">{item.price === null ? "Preis auf Anfrage" : formatPrice(item.price)}</p>
                  {item.price !== null && <p className="text-xs mt-1">je Stück / angefangenem 3-Werktage-Block · inkl. MwSt. · 01.01.2026</p>}
                  <p className="text-sm mt-3">Physischer Bestand: {item.physicalStock} Stück</p>
                  {item.breakagePrice !== null && <p className="text-sm mt-1">Bruchersatz: {formatPrice(item.breakagePrice)} je Stück</p>}
                  <div className="mt-auto pt-5">
                    <label htmlFor={`rental-quantity-${item.id}`} className="block text-sm font-medium">Gewünschte Menge</label>
                    <div className="flex items-stretch mt-2 rounded-lg border border-border overflow-hidden">
                      <button type="button" aria-label={`Menge für ${item.name} verringern`} disabled={quantity(item.id) === 0} onClick={() => selectQuantity(item.id, quantity(item.id) - 1)} className="w-12 min-h-12 shrink-0 bg-light font-bold text-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-50">−</button>
                      <input id={`rental-quantity-${item.id}`} type="number" inputMode="numeric" aria-label={`Menge für ${item.name}`} min={0} max={capacity(item.id)} step={1} value={quantity(item.id)} onChange={event => selectQuantity(item.id, Number(event.target.value))} className="min-w-0 w-full min-h-12 border-x border-border px-2 text-center text-secondary font-semibold" />
                      <button type="button" aria-label={`Menge für ${item.name} erhöhen`} disabled={quantity(item.id) >= capacity(item.id)} onClick={() => selectQuantity(item.id, quantity(item.id) + 1)} className="w-12 min-h-12 shrink-0 bg-light font-bold text-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-50">+</button>
                    </div>
                  </div>
                  {datesValid && capacity(item.id) < item.physicalStock && <p className="text-xs mt-2">Für diesen Zeitraum noch höchstens {capacity(item.id)} Stück zusätzlich in deiner Anfrageliste.</p>}
                  {selectedQuote?.lines.filter(line => line.id === item.id).map(line => <div key={line.id} className="mt-4 rounded-lg bg-light p-3 text-sm">
                    <p>{line.workdays} Werktage · {line.periods} {line.periods === 1 ? "Mietblock" : "Mietblöcke"} · {line.quantity} Stück</p>
                    <p className="mt-1 font-bold">Positionssumme: {money(line.lineTotalCents)}</p>
                  </div>)}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section aria-labelledby="rental-request" className="border-t border-border pt-8">
          <h2 id="rental-request" className="text-2xl font-bold mb-3">Deine Mietauswahl</h2>
          <p className="mb-4">{selectedCount ? `${selectedCount} Stück ausgewählt.` : "Wähle Artikelmengen und deinen gewünschten Zeitraum aus."} Die Bestellung wird erst mit der Terminbestätigung des Markts verbindlich.</p>
          {quoteError && <p role="alert" className="mb-4 text-primary">{quoteError}</p>}
          {selectedQuote && (selectedQuote.allPriced ? <p className="mb-5 text-2xl font-bold">Mietgesamtpreis: {money(selectedQuote.totalCents)} <span className="text-sm font-normal">inkl. MwSt.</span></p> : <div className="mb-5">
            <p className="font-semibold">Kein vollständiger Mietgesamtpreis: Mindestens ein Artikel hat einen Preis auf Anfrage.</p>
            <p>Bekannte Mietpositionen: {money(selectedQuote.knownSubtotalCents)} inkl. MwSt. (nur Teilsumme). Bitte unverbindlich anfragen.</p>
          </div>)}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addSelected} disabled={!datesValid || !selectedCount || !selectedQuote} className="min-h-12 px-6 py-3 rounded-lg bg-primary text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed">In den Warenkorb</button>
            <Link href="/warenkorb" className="min-h-12 px-6 py-3 rounded-lg border border-border font-medium">Warenkorb öffnen</Link>
            <a href={MARKET.phoneHref} className="min-h-12 px-6 py-3 underline">Persönlich beraten lassen</a>
          </div>
          <p role="status" aria-live="polite" className="mt-4 max-w-2xl">{message}</p>
        </section>
      </div>
    </div>
  );
}
