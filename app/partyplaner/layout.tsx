import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partyplaner — Getränke & Equipment kalkulieren ",
  description: " Trinkgut Jammers|Berechne den Bedarf an Getränken und Equipment für deine nächste Party. Persönliche Empfehlungen für jeden Anlass.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
