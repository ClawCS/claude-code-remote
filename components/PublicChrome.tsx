"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import CinematicHeader from "@/components/cinematic/CinematicHeader";
import LocationFooter from "@/components/cinematic/LocationFooter";

const CartDrawer = dynamic(() => import("@/components/CartDrawer"));
const WishlistDrawer = dynamic(() => import("@/components/WishlistDrawer"));

export default function PublicChrome({ slot, nowIso }: {
  slot: "header" | "footer" | "drawers"; nowIso: string;
}) {
  const pathname = usePathname();
  // Landing pages already own their localized landmark tree.
  if (pathname === "/" || pathname === "/nl") return null;
  if (slot === "header") return <CinematicHeader nowIso={nowIso} hasActions />;
  if (slot === "footer") return <LocationFooter />;
  return <><CartDrawer /><WishlistDrawer /></>;
}
