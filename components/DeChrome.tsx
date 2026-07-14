"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { shouldHideLegacyChrome } from "@/lib/chrome-visibility";

const Header = dynamic(() => import("@/components/Header"));
const Footer = dynamic(() => import("@/components/Footer"));
const CartDrawer = dynamic(() => import("@/components/CartDrawer"));
const WishlistDrawer = dynamic(() => import("@/components/WishlistDrawer"));
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"));
const AIAssistant = dynamic(() => import("@/components/AIAssistant"));

type LegacySlot = "header" | "footer" | "drawers" | "floating";

export default function DeChrome({ slot }: { slot: LegacySlot }) {
  const pathname = usePathname();
  if (shouldHideLegacyChrome(pathname)) return null;
  if (slot === "header") return <Header />;
  if (slot === "footer") return <Footer />;
  if (slot === "drawers") {
    return (
      <>
        <CartDrawer />
        <WishlistDrawer />
      </>
    );
  }
  return (
    <>
      <WhatsAppButton />
      <AIAssistant />
    </>
  );
}
