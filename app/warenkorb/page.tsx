"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function WarenkorbPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold text-secondary mb-2">Dein Warenkorb ist leer</h1>
        <p className="text-muted mb-6">Füge Produkte hinzu, um loszulegen.</p>
        <Link href="/produkte" className="inline-flex px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">
          Produkte entdecken
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-8">Warenkorb</h1>
      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl">
            <div className="w-16 h-16 bg-light rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image src={item.product.image} alt={item.product.name} fill sizes="64px" className="object-contain p-1" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/produkte/${item.product.slug}`} className="font-semibold text-secondary hover:text-primary transition-colors">{item.product.name}</Link>
              <p className="text-sm text-muted">{item.product.unit}</p>
            </div>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-light transition-colors font-bold text-sm">-</button>
              <span className="px-3 py-1.5 font-medium text-sm min-w-[2.5rem] text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-light transition-colors font-bold text-sm">+</button>
            </div>
            <div className="text-right flex-shrink-0 w-24">
              <p className="font-bold text-primary">{formatPrice(item.product.price * item.quantity)}</p>
              <p className="text-xs text-muted">{formatPrice(item.product.price)} / Stk.</p>
            </div>
            <button onClick={() => removeItem(item.product.id)} className="p-1.5 text-muted hover:text-primary transition-colors flex-shrink-0" aria-label="Entfernen">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="bg-light rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-secondary">Gesamtsumme:</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
        </div>
        <p className="text-xs text-muted mb-4">zzgl. Pfand, inkl. MwSt.</p>
        <div className="flex gap-3">
          <button onClick={clearCart} className="px-4 py-3 border border-border text-muted hover:border-primary hover:text-primary rounded-lg transition-colors text-sm font-medium">
            Warenkorb leeren
          </button>
          <Link href="/checkout" className="flex-1 text-center py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg">
            Zur Kasse
          </Link>
        </div>
      </div>
    </div>
  );
}
