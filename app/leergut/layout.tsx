import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leergut-Rückgabe — Pfand zurück ",
  description: " Trinkgut Jammers|Rückgabe und Pfand-Service bei Trinkgut Jammers Goch — alle Pfandflaschen, einfach und schnell.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
