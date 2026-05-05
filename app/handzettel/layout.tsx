import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Handzettel — Aktuelle Prospekte ",
  description: " Trinkgut Jammers|Aktuelle Trinkgut Jammers Handzettel als interaktives Blätter-Erlebnis. Wochenangebote DE und NL.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
