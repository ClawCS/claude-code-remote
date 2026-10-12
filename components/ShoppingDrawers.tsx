"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const CartDrawer = dynamic(() => import("./CartDrawer"));
const WishlistDrawer = dynamic(() => import("./WishlistDrawer"));
const subscribe = () => () => {};
const getDrawerRoot = () => document.querySelector<HTMLElement>("[data-shopping-drawers-root]");

export default function ShoppingDrawers() {
  const { isCartOpen } = useCart();
  const { isWishlistOpen } = useWishlist();
  const root = useSyncExternalStore(subscribe, getDrawerRoot, () => null);
  // Preserve the original modal DOM ancestry and typography outside <main>,
  // while the portal keeps both drawers inside their actual React providers.
  return root ? createPortal(<>{isCartOpen && <CartDrawer />}{isWishlistOpen && <WishlistDrawer />}</>, root) : null;
}
