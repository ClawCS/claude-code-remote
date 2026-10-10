"use client";

import Link from "next/link";
import { useCallback } from "react";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { cartLineKey } from "@/lib/cart-items";
import { useModalA11y } from "@/lib/useModalA11y";
import { rentalCartQuote, money } from "@/lib/rental-cart";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, quantityError } = useCart();
  const close = useCallback(() => setIsCartOpen(false), [setIsCartOpen]);
  const returnFocusFallback = useCallback(() => document.querySelector<HTMLElement>("[data-cart-focus-return]"), []);
  const panelRef = useModalA11y(isCartOpen, close, returnFocusFallback);
  const rentalQuote = rentalCartQuote(items);
  const canOrder = rentalQuote.onlyRentals && rentalQuote.quote?.allPriced && !rentalQuote.error;

  if (!isCartOpen) return null;

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={() => setIsCartOpen(false)} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={styles.drawerPanel}
      >
        <div className={styles.drawerHeader}>
          <h2 id="cart-drawer-title" className="text-lg font-bold text-secondary">{canOrder ? "Dein Mietwarenkorb" : "Deine Anfrageliste"}</h2>
          <button onClick={() => setIsCartOpen(false)} className={styles.iconButton} aria-label="Schließen">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.drawerBody}>
          {quantityError && <p role="alert" className={styles.error}>{quantityError}</p>}
          {items.length === 0 ? (
            <div className={editorial.emptyState}>
              <p>Deine Anfrageliste ist leer.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const isRental = !!item.rental;
                const quoted = rentalQuote.quote?.lines.find(line => line.id === item.product.id && line.startDate === item.rental?.startDate && line.endDate === item.rental?.endDate);
                return (
                  <li key={cartLineKey(item)} className={styles.drawerItem}>
                    <div className="flex gap-3">
                      {item.product.image && item.product.image !== "/images/home/brand-logo.webp" && <div className={styles.thumbnail}>
                        <Image src={item.product.image} alt={item.product.name} fill sizes="56px" className="object-contain p-1" />
                      </div>}
                      <div className="flex-1 min-w-0">
                        <p className={styles.itemName}>{item.product.name}</p>
                        {!isRental && <p className="text-xs text-muted">{item.product.unit}</p>}
                        <div className={styles.drawerControls}>
                          <button aria-label={`Menge für ${item.product.name} verringern`} onClick={() => updateQuantity(cartLineKey(item), item.quantity - 1)} className={editorial.secondaryLink}>-</button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button aria-label={`Menge für ${item.product.name} erhöhen`} onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)} className={editorial.secondaryLink}>+</button>
                          <button onClick={() => removeItem(cartLineKey(item))} className={styles.textLink}>Entfernen</button>
                        </div>
                      </div>
                    </div>
                    {isRental && (
                      <div className={styles.lineQuote}>
                        <p>{item.rental!.startDate.split("-").reverse().join(".")} – {item.rental!.endDate.split("-").reverse().join(".")}</p>
                        {quoted ? <>
                          <p className="mt-1">{quoted.workdays} Werktage · {quoted.periods} {quoted.periods === 1 ? "Mietblock" : "Mietblöcke"} · {quoted.quantity} Stück</p>
                          <p>{money(quoted.unitPriceCents)} je Stück / angefangenem 3-Werktage-Block, inkl. MwSt.</p>
                          <p className="mt-1 font-bold">Positionssumme: {money(quoted.lineTotalCents)}</p>
                        </> : <p>Mietpreis nicht berechenbar.</p>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            {rentalQuote.error && <p role="alert" className="text-sm text-primary">{rentalQuote.error}</p>}
            {rentalQuote.quote && (rentalQuote.quote.allPriced ? <p className="font-bold">{rentalQuote.onlyRentals ? "Mietgesamtpreis" : "Summe der Mietpositionen"}: {money(rentalQuote.quote.totalCents)} <span className="text-xs font-normal">inkl. MwSt.{!rentalQuote.onlyRentals && " · nur Mietpositionen"}</span></p> : <div className="text-sm">
              <p className="font-semibold">Gesamtpreis offen · unverbindliche Anfrage</p>
              <p>Bekannte Mietpositionen: {money(rentalQuote.quote.knownSubtotalCents)} inkl. MwSt. (nur Teilsumme).</p>
            </div>)}
            <p className="text-sm text-muted">{canOrder ? "Unverbindliche Anfrage. Termin und Verfügbarkeit bestätigen wir persönlich. Zahlung bei Abholung." : "Unverbindliche Anfrage: Für Waren und offene Mietpreise gibt es noch keinen zahlbaren Gesamtpreis."}</p>
            <Link
              href={canOrder ? "/checkout" : "/warenkorb"}
              onClick={() => setIsCartOpen(false)}
              className={editorial.primaryLink}
            >
              {canOrder ? "Unverbindlich anfragen" : "Anfrage vorbereiten"}
            </Link>
            {canOrder && <Link href="/warenkorb" onClick={() => setIsCartOpen(false)} className="block py-2 text-center text-sm underline">Liste prüfen</Link>}
          </div>
        )}
      </div>
    </>
  );
}
