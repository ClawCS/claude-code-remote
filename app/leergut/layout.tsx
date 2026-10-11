import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Leergut-Rückgabe — Pfand zurück ",
  description: "Rückgabe und Pfand-Service bei Trinkgut Jammers Goch — alle Pfandflaschen, einfach und schnell.",
  path: "/leergut",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
