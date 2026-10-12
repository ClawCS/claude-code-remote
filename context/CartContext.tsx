"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@/lib/utils";
import { removeLegacyPersonalData } from "@/lib/legacy-storage";
import { addCartItem, assertRentalStock, cartLineKey, parseStoredCart, updateCartQuantity } from "@/lib/cart-items";
import { useSessionList } from "@/lib/use-session-list";

export type RentalInfo = {
  startDate: string;
  endDate: string;
  workdays: number;
  periods: number;
  basePrice: number;
  totalRentalPrice: number;
  /** Zeroed price fields are not a free rental or a quote. */
  priceStatus?: "personal-confirmation-required";
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
  quantityError: string;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useSessionList("trinkgut-cart", parseStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quantityError, setQuantityError] = useState("");

  useEffect(() => {
    try {
      removeLegacyPersonalData(localStorage);
    } catch {
      // Browser storage may be unavailable.
    }
  }, []);

  const addItem = (product: Product, quantity = 1, rental?: RentalInfo) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    try { assertRentalStock([...items, {product, quantity, rental}]); }
    catch (cause) {
      setQuantityError(cause instanceof Error ? cause.message : "Bitte die gewünschte Menge prüfen.");
      setIsCartOpen(true);
      return;
    }
    setQuantityError("");
    setItems((prev) => addCartItem(prev,product,quantity,rental));
    setIsCartOpen(true);
  };

  const removeItem = (lineKey: string) => {
    setQuantityError("");
    setItems((prev) => prev.filter((item) => cartLineKey(item) !== lineKey));
  };

  const updateQuantity = (lineKey: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      removeItem(lineKey);
      return;
    }
    try { assertRentalStock(items.map(item => cartLineKey(item) === lineKey ? {...item, quantity} : item)); }
    catch (cause) {
      setQuantityError(cause instanceof Error ? cause.message : "Bitte die gewünschte Menge prüfen.");
      return;
    }
    setQuantityError("");
    setItems((prev) => updateCartQuantity(prev,lineKey,quantity));
  };

  const clearCart = () => { setItems([]); setQuantityError(""); };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => {
      if (item.rental) {
        return sum;
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
        quantityError,
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
