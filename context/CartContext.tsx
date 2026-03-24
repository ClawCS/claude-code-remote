"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@/lib/utils";

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
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
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
    const stored = localStorage.getItem("trinkgut-cart");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("trinkgut-cart", JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addItem = (product: Product, quantity = 1, rental?: RentalInfo) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, ...(rental ? { rental } : {}) }
            : item
        );
      }
      return [...prev, { product, quantity, ...(rental ? { rental } : {}) }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
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
