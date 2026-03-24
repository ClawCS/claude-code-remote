"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setIsCartOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-secondary">Warenkorb</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-1 text-muted hover:text-secondary transition-colors" aria-label="Schließen">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">🛒</p>
              <p>Dein Warenkorb ist leer.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.product.id} className="flex gap-3 p-3 bg-light rounded-lg">
                  <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex-shrink-0 relative">
                    <Image src={item.product.image} alt={item.product.name} fill sizes="56px" className="object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-secondary truncate">{item.product.name}</p>
                    <p className="text-xs text-muted">{item.product.unit}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded bg-white border border-border text-xs font-bold hover:border-primary transition-colors">-</button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded bg-white border border-border text-xs font-bold hover:border-primary transition-colors">+</button>
                      <button onClick={() => removeItem(item.product.id)} className="ml-auto text-xs text-muted hover:text-primary transition-colors">Entfernen</button>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary flex-shrink-0">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-secondary">Gesamt:</span>
              <span className="text-xl font-bold text-primary">{formatPrice(totalPrice)}</span>
            </div>
            <Link
              href="/warenkorb"
              onClick={() => setIsCartOpen(false)}
              className="block w-full text-center py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
            >
              Zum Warenkorb
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
