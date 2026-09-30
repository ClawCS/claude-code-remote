"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@/lib/utils";
import { removeLegacyPersonalData } from "@/lib/reservation-inquiry";
import { addCartItem, cartLineKey, parseStoredCart } from "@/lib/cart-items";

export type RentalInfo = {
  startDate: string;
  endDate: string;
  workdays: number;
  periods: number;
  basePrice: number;
  totalRentalPrice: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
  rental?: RentalInfo;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, rental?: RentalInfo) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      removeLegacyPersonalData(localStorage);
      const stored = sessionStorage.getItem("trinkgut-cart") ?? localStorage.getItem("trinkgut-cart");
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      setItems(parseStoredCart(parsed));
      localStorage.removeItem("trinkgut-cart");
    } catch {
      // Browser storage may be unavailable.
    } finally { setHydrated(true); }
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { if (items.length) sessionStorage.setItem("trinkgut-cart", JSON.stringify(items)); else sessionStorage.removeItem("trinkgut-cart"); } catch { /* Private browsing/storage quota. */ }
    }
  }, [items, hydrated]);

  const addItem = (product: Product, quantity = 1, rental?: RentalInfo) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    setItems((prev) => addCartItem(prev,product,quantity,rental));
    setIsCartOpen(true);
  };

  const removeItem = (lineKey: string) => {
    setItems((prev) => prev.filter((item) => cartLineKey(item) !== lineKey));
  };

  const updateQuantity = (lineKey: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      removeItem(lineKey);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        cartLineKey(item) === lineKey ? { ...item, quantity: Math.min(999, quantity) } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => {
      if (item.rental) {
        return sum + item.rental.totalRentalPrice * item.quantity;
      }
      return sum + item.product.price * item.quantity;
    },
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
