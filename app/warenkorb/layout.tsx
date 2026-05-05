import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Warenkorb — Bestellung abschließen ",
  description: " Trinkgut Jammers|Dein Warenkorb bei Trinkgut Jammers Goch.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
