"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { cartLineKey } from "@/lib/cart-items";
import { rentalCartQuote, money } from "@/lib/rental-cart";

export default function WarenkorbPage() {
  const { items, removeItem, updateQuantity, clearCart, quantityError } = useCart();
  const rentalQuote = rentalCartQuote(items);
  const canOrder = rentalQuote.onlyRentals && rentalQuote.quote?.allPriced && !rentalQuote.error;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary mb-2">Deine Anfrageliste ist leer</h1>
        <p className="text-muted mb-6">Füge Produkte hinzu, um loszulegen.</p>
        <Link href="/produkte" className="inline-flex px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">
          Produkte entdecken
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-4">{canOrder ? "Deine Mietauswahl" : "Deine Anfrageliste"}</h1>
      <p className="text-muted mb-8">{canOrder ? "Der Mietpreis ist berechnet. Deine Auswahl bleibt eine unverbindliche Anfrage. Termin und Verfügbarkeit bestätigen wir persönlich." : "Diese Liste bleibt eine unverbindliche Anfrage. Gemischte Listen oder Artikel mit offenem Preis haben keinen vollständigen Bestellgesamtpreis."}</p>
      {rentalQuote.error && <p role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-primary">{rentalQuote.error} Bitte Leihzeitraum und Mengen prüfen.</p>}
      {quantityError && <p role="alert" className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-primary">{quantityError}</p>}
      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const isRental = !!item.rental;
          const quoted = rentalQuote.quote?.lines.find(line => line.id === item.product.id && line.startDate === item.rental?.startDate && line.endDate === item.rental?.endDate);
          return (
            <div key={cartLineKey(item)} className={`p-4 bg-white border rounded-xl ${isRental ? "border-amber-300" : "border-border"}`}>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {item.product.image && item.product.image !== "/images/home/brand-logo.webp" && <div className="w-16 h-16 bg-light rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image src={item.product.image} alt={isRental ? `KI-Beispielbild: ${item.product.name}` : item.product.name} fill sizes="64px" className="object-contain p-1" />
                </div>}
                <div className="flex-1 min-w-0">
                  {isRental ? (
                    <span className="font-semibold text-secondary">{item.product.name}</span>
                  ) : (
                    <Link href={`/produkte/${item.product.slug}`} className="font-semibold text-secondary hover:text-primary transition-colors">{item.product.name}</Link>
                  )}
                  {!isRental && <p className="text-sm text-muted">{item.product.unit}</p>}
                  {isRental && <p className="text-xs text-muted">KI-Beispielbild · Modell und Ausführung können abweichen.</p>}
                </div>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button aria-label={`Menge für ${item.product.name} verringern`} onClick={() => updateQuantity(cartLineKey(item), item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-light transition-colors font-bold text-sm">-</button>
                  <span className="px-3 py-1.5 font-medium text-sm min-w-[2.5rem] text-center">{item.quantity}</span>
                  <button aria-label={`Menge für ${item.product.name} erhöhen`} onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-light transition-colors font-bold text-sm">+</button>
                </div>
                <button onClick={() => removeItem(cartLineKey(item))} className="p-1.5 text-muted hover:text-primary transition-colors flex-shrink-0" aria-label="Entfernen">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {/* Rental info line */}
              {isRental && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <p className="font-medium">
                    Leihzeitraum: {item.rental!.startDate.split("-").reverse().join(".")} – {item.rental!.endDate.split("-").reverse().join(".")}
                  </p>
                  {quoted ? <>
                    <p className="mt-1">{quoted.workdays} Werktage · {quoted.periods} {quoted.periods === 1 ? "Mietblock" : "Mietblöcke"} · {quoted.quantity} Stück</p>
                    <p>{money(quoted.unitPriceCents)} je Stück / angefangenem 3-Werktage-Block, inkl. MwSt.</p>
                    <p className="mt-2 text-sm font-bold">Positionssumme: {money(quoted.lineTotalCents)}</p>
                  </> : <p className="mt-1">Mietpreis derzeit nicht berechenbar. Bitte Auswahl prüfen.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="bg-light rounded-xl p-6">
        {rentalQuote.quote && (rentalQuote.quote.allPriced ? <p className="mb-3 text-2xl font-bold">{rentalQuote.onlyRentals ? "Mietgesamtpreis" : "Summe der Mietpositionen"}: {money(rentalQuote.quote.totalCents)} <span className="text-sm font-normal">inkl. MwSt.{!rentalQuote.onlyRentals && " · kein Gesamtpreis der gemischten Liste"}</span></p> : <div className="mb-4">
          <p className="font-semibold">Kein vollständiger Gesamtpreis: Mindestens ein Mietpreis ist offen.</p>
          <p className="text-sm">Bekannte Mietpositionen: {money(rentalQuote.quote.knownSubtotalCents)} inkl. MwSt. (nur Teilsumme).</p>
        </div>)}
        <p className="text-sm text-muted mb-4">{canOrder ? "Nur Abholung im Markt von 9–19 Uhr. Zahlung bei Abholung, keine Kaution." : "Keine zahlbare Bestellung: Preise und weitere Konditionen klären wir bei deiner unverbindlichen Anfrage persönlich."}</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={clearCart} className="px-4 py-3 border border-border text-muted hover:border-primary hover:text-primary rounded-lg transition-colors text-sm font-medium">
            Liste leeren
          </button>
          <Link href="/checkout" className="flex-1 text-center py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg">
            Unverbindlich anfragen
          </Link>
        </div>
      </div>
    </div>
  );
}
