import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galerie — Markt, Team & Events ",
  description: " Trinkgut Jammers|Eindrücke aus dem Trinkgut Jammers Markt in Goch — unser Team, Events und Sortiment in Bildern.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
