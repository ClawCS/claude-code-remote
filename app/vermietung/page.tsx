"use client";

import Link from "next/link";
import { useState } from "react";
import { rentalCategories, rentalItems, rentalToProduct } from "@/data/rentals";
import { useCart, type RentalInfo } from "@/context/CartContext";
import { maxRentalQuantity, validRentalRange, rentalFurnitureConflict } from "@/lib/cart-items";
import { calculateWorkdays, formatPrice } from "@/lib/utils";
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
    if (!datesValid || !selectedCount) return;
    const rental: RentalInfo = {...range,workdays:calculateWorkdays(startDate,endDate),periods:0,basePrice:0,totalRentalPrice:0,priceStatus:"personal-confirmation-required"};
    for (const item of rentalItems) {
      const count = quantity(item.id);
      if (count) addItem(rentalToProduct(item),count,rental);
    }
    setQuantities({});
    setMessage("Dein Artikelwunsch wurde zur Anfrageliste hinzugefügt. Noch keine Reservierung – die Verfügbarkeit bestätigen wir persönlich.");
  }

  return (
    <div className="public-page rental-page">
      <section className="category-intro" data-rental-intro>
        <div>
          <p className="text-sm uppercase tracking-widest mb-4">Trinkgut Jammers · Party &amp; Miete</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-5">Deine Feier. Unser Leihsortiment.</h1>
          <p className="text-lg max-w-2xl leading-relaxed">Kühlung, Ausschank, Mobiliar und Gläser: Wähle deinen Artikelwunsch und Zeitraum. Wir besprechen die Details persönlich mit dir.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-14">
        <section aria-labelledby="rental-dates" className="mb-10">
          <h2 id="rental-dates" className="text-2xl font-bold mb-4">Dein gewünschter Zeitraum</h2>
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
                  {item.price !== null && <p className="text-xs mt-1">je 3 Werktage · Richtpreis laut Preisliste · 01.01.2026</p>}
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
                </article>
              ))}
            </div>
          </section>
        ))}

        <section aria-labelledby="rental-request" className="border-t border-border pt-8">
          <h2 id="rental-request" className="text-2xl font-bold mb-3">Unverbindlich anfragen</h2>
          <p className="mb-5">{selectedCount ? `${selectedCount} Stück ausgewählt.` : "Wähle Artikelmengen und deinen gewünschten Zeitraum aus."} Keine Reservierungsbestätigung und kein berechneter Mietgesamtpreis.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addSelected} disabled={!datesValid || !selectedCount} className="min-h-12 px-6 py-3 rounded-lg bg-primary text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed">Zur Anfrageliste</button>
            <Link href="/warenkorb" className="min-h-12 px-6 py-3 rounded-lg border border-border font-medium">Anfrageliste öffnen</Link>
            <a href={MARKET.phoneHref} className="min-h-12 px-6 py-3 underline">Persönlich beraten lassen</a>
          </div>
          <p role="status" aria-live="polite" className="mt-4 max-w-2xl">{message}</p>
        </section>
      </div>
    </div>
  );
}
