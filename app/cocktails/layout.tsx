import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "65 Cocktail-Rezepte — Klassisch bis modern ",
  description: " Trinkgut Jammers|65 ausgewählte Cocktail-Rezepte mit Schritt-für-Schritt-Anleitung. Klassiker und moderne Drinks.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
