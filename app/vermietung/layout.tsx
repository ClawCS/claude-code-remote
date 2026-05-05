import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vermietung — Zapfanlagen, Bierzelte & mehr ",
  description: " Trinkgut Jammers|Mietartikel für deine Veranstaltung in Goch: Zapfanlagen, Stehtische, Bänke, Gläser. Faire Preise und persönliche Beratung.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
