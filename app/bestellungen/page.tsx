"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";

export type OrderItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  date: string;
  items: OrderItem[];
  totalPrice: number;
};

const ORDERS_KEY = "trinkgut-bestellungen";

export default function BestellungenPage() {
  const { addItem } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (stored) {
      try {
        setOrders(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
    setHydrated(true);
  }, []);

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem(item.product, item.quantity);
    });
  };

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-secondary mb-8">Meine Bestellungen</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-light rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h1 className="text-2xl font-bold text-secondary mb-2">Noch keine Bestellungen</h1>
        <p className="text-muted mb-6">
          Du hast noch keine Bestellungen aufgegeben. Entdecke unser Sortiment!
        </p>
        <Link
          href="/produkte"
          className="inline-flex px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
        >
          Produkte entdecken
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-8">Meine Bestellungen</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const orderDate = new Date(order.date);
          const formattedDate = orderDate.toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={order.id} className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide font-medium">
                    Bestellung vom
                  </p>
                  <p className="font-semibold text-secondary">{formattedDate}</p>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>

              <ul className="divide-y divide-border mb-4">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between py-2 text-sm">
                    <span className="text-muted">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-medium text-secondary">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleReorder(order)}
                className="w-full sm:w-auto px-5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors"
              >
                Erneut bestellen
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
