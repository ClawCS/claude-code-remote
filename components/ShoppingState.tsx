"use client";

import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function ShoppingState({ children }: { children: React.ReactNode }) {
  return <CartProvider><WishlistProvider>{children}</WishlistProvider></CartProvider>;
}
