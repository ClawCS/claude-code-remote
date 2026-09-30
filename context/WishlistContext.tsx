"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@/lib/utils";
import { assortmentProducts as products } from "@/lib/catalog";

type WishlistContextType = {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
  totalItems: number;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("trinkgut-wishlist") ?? localStorage.getItem("trinkgut-wishlist");
      const parsed:unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setItems(products.filter(product=>parsed.some(item=>item?.id === product.id)) as Product[]);
      localStorage.removeItem("trinkgut-wishlist");
    } catch { /* Browser storage is optional for using the list. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { if (items.length) sessionStorage.setItem("trinkgut-wishlist", JSON.stringify(items)); else sessionStorage.removeItem("trinkgut-wishlist"); } catch { /* Browser storage unavailable. */ }
    }
  }, [items, hydrated]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  };

  const toggleItem = (product: Product) => {
    setItems((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: number) => {
    return items.some((p) => p.id === productId);
  };

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleItem,
        isInWishlist,
        clearWishlist,
        totalItems: items.length,
        isWishlistOpen,
        setIsWishlistOpen,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
