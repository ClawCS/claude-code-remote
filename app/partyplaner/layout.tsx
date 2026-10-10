import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partyplaner — Getränkebedarf in Litern",
  description: "Berechne für deine Feier den Literbedarf an Bier, Wein, Softdrinks, Spirituosen und Wasser – nach Gästezahl, Dauer und Getränkeverteilung.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
