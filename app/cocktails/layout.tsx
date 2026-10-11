import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "65 Cocktail-Rezepte — Klassisch bis modern ",
  description: "65 ausgewählte Cocktail-Rezepte mit Schritt-für-Schritt-Anleitung. Klassiker und moderne Drinks.",
  path: "/cocktails",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
