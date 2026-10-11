import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Partyplaner — Getränkebedarf in Litern",
  description: "Berechne für deine Feier den Literbedarf an Bier, Wein, Softdrinks, Spirituosen und Wasser – nach Gästezahl, Dauer und Getränkeverteilung.",
  path: "/partyplaner",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
