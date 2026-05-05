import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout — Bestellung absenden ",
  description: " Trinkgut Jammers|Bestellabschluss bei Trinkgut Jammers Goch — Abholung oder Lieferung in Goch und Umgebung.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
