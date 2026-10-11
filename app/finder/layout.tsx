import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Getränke-Finder — Finde dein perfektes Getränk ",
  description: "Getränke-Ideen nach deinem Geschmack — vom Aperitif bis zum Whisky-Klassiker. Die Vorschläge sind keine Aussage zum aktuellen Bestand im Markt.",
  path: "/finder",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
