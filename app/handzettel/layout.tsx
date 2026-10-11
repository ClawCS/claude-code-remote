import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Handzettel — Aktuelle Prospekte",
  description: "Die aktuellen deutschen und niederländischen Originalhandzettel von Trinkgut Jammers: vollständige Wochenangebote mit Preisen, Pfand und Aktionsbedingungen.",
  path: "/angebote",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
