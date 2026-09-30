"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { cartLineKey } from "@/lib/cart-items";

export default function WarenkorbPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-6xl mb-4">🛒</p>
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
      <h1 className="text-3xl font-bold text-secondary mb-4">Deine Anfrageliste</h1><p className="text-muted mb-8">Noch keine Bestellung. Wir bestätigen Preise, Pfand und Verfügbarkeit persönlich.</p>
      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const isRental = !!item.rental;
          return (
            <div key={cartLineKey(item)} className={`p-4 bg-white border rounded-xl ${isRental ? "border-amber-300" : "border-border"}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-light rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image src={item.product.image} alt={item.product.name} fill sizes="64px" className="object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  {isRental ? (
                    <span className="font-semibold text-secondary">{item.product.name}</span>
                  ) : (
                    <Link href={`/produkte/${item.product.slug}`} className="font-semibold text-secondary hover:text-primary transition-colors">{item.product.name}</Link>
                  )}
                  <p className="text-sm text-muted">{item.product.unit}</p>
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
                <div className="mt-3 ml-20 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <p className="font-medium">
                    Leihzeitraum: {new Date(item.rental!.startDate).toLocaleDateString("de-DE")} – {new Date(item.rental!.endDate).toLocaleDateString("de-DE")} ({item.rental!.workdays} Werktage)
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="bg-light rounded-xl p-6">
        <p className="text-sm text-muted mb-4">Deine Artikelwünsche werden erst nach persönlicher Abstimmung verbindlich.</p>
        <div className="flex gap-3">
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
