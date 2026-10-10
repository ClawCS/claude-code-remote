"use client";

import PageIntro from "@/components/editorial/PageIntro";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
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
      <>
        <PageIntro title="Deine Anfrageliste ist leer" description="Füge Produkte hinzu, um loszulegen." />
        <div className={styles.body} data-service="cart-empty">
        <Link href="/produkte" className={editorial.primaryLink}>
          Produkte entdecken
        </Link>
      </div></>
    );
  }

  return (
    <>
      <PageIntro title={canOrder ? "Deine Mietauswahl" : "Deine Anfrageliste"} description={canOrder ? "Der Mietpreis ist berechnet. Deine Auswahl bleibt eine unverbindliche Anfrage. Termin und Verfügbarkeit bestätigen wir persönlich." : "Diese Liste bleibt eine unverbindliche Anfrage. Gemischte Listen oder Artikel mit offenem Preis haben keinen vollständigen Bestellgesamtpreis."} />
      <div className={styles.body} data-service="cart">
      {rentalQuote.error && <p role="alert" className={styles.error}>{rentalQuote.error} Bitte Leihzeitraum und Mengen prüfen.</p>}
      {quantityError && <p role="alert" className={styles.error}>{quantityError}</p>}
      <div className={styles.cartList}>
        {items.map((item) => {
          const isRental = !!item.rental;
          const quoted = rentalQuote.quote?.lines.find(line => line.id === item.product.id && line.startDate === item.rental?.startDate && line.endDate === item.rental?.endDate);
          return (
            <div key={cartLineKey(item)} className={styles.cartLine}>
              <div className={styles.cartRow}>
                {item.product.image && item.product.image !== "/images/home/brand-logo.webp" && <div className={styles.thumbnail}>
                  <Image src={item.product.image} alt={isRental ? `KI-Beispielbild: ${item.product.name}` : item.product.name} fill sizes="64px" className="object-contain p-1" />
                </div>}
                <div className={styles.itemTitle}>
                  {isRental ? (
                    <span className="font-semibold text-secondary">{item.product.name}</span>
                  ) : (
                    <Link href={`/produkte/${item.product.slug}`} className="font-semibold text-secondary hover:text-primary transition-colors">{item.product.name}</Link>
                  )}
                  {!isRental && <p className="text-sm text-muted">{item.product.unit}</p>}
                  {isRental && <p className="text-xs text-muted">KI-Beispielbild · Modell und Ausführung können abweichen.</p>}
                </div>
                <div className={styles.quantityControl}>
                  <button aria-label={`Menge für ${item.product.name} verringern`} onClick={() => updateQuantity(cartLineKey(item), item.quantity - 1)} className={styles.iconButton}>-</button>
                  <span className="px-3 py-1.5 font-medium text-sm min-w-[2.5rem] text-center">{item.quantity}</span>
                  <button aria-label={`Menge für ${item.product.name} erhöhen`} onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)} className={styles.iconButton}>+</button>
                </div>
                <button onClick={() => removeItem(cartLineKey(item))} className={styles.iconButton} aria-label="Entfernen">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {/* Rental info line */}
              {isRental && (
                <div className={styles.lineQuote}>
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
      <div className={styles.summary}>
        {rentalQuote.quote && (rentalQuote.quote.allPriced ? <p className="mb-3 text-2xl font-bold">{rentalQuote.onlyRentals ? "Mietgesamtpreis" : "Summe der Mietpositionen"}: {money(rentalQuote.quote.totalCents)} <span className="text-sm font-normal">inkl. MwSt.{!rentalQuote.onlyRentals && " · kein Gesamtpreis der gemischten Liste"}</span></p> : <div className="mb-4">
          <p className="font-semibold">Kein vollständiger Gesamtpreis: Mindestens ein Mietpreis ist offen.</p>
          <p className="text-sm">Bekannte Mietpositionen: {money(rentalQuote.quote.knownSubtotalCents)} inkl. MwSt. (nur Teilsumme).</p>
        </div>)}
        <p className="text-sm text-muted mb-4">{canOrder ? "Nur Abholung im Markt von 9–19 Uhr. Zahlung bei Abholung, keine Kaution." : "Keine zahlbare Bestellung: Preise und weitere Konditionen klären wir bei deiner unverbindlichen Anfrage persönlich."}</p>
        <div className={styles.actions}>
          <button onClick={clearCart} className={editorial.secondaryLink}>
            Liste leeren
          </button>
          <Link href="/checkout" className={editorial.primaryLink}>
            Unverbindlich anfragen
          </Link>
        </div>
      </div>
    </div></>
  );
}
