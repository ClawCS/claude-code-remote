"use client";
import { usePathname } from "next/navigation";
import CinematicHeader from "@/components/cinematic/CinematicHeader";
import LocationFooter from "@/components/cinematic/LocationFooter";

export default function PublicChrome({ slot, nowIso }: {
  slot: "header" | "footer"; nowIso: string;
}) {
  const pathname = usePathname();
  // Landing pages already own their localized landmark tree.
  if (pathname === "/" || pathname === "/nl") return null;
  if (slot === "header") return <CinematicHeader nowIso={nowIso} hasActions />;
  if (slot === "footer") return <LocationFooter />;
  return null;
}
