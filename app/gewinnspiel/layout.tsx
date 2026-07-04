import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monatsgewinnspiel — Jetzt mitmachen ",
  description: "Aktuelle Gewinnspiele bei Trinkgut Jammers in Goch. Tolle Preise, einfache Teilnahme.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
