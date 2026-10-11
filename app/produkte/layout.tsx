import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sortiment & aktuelle Wochenangebote",
  description: "Unsere Warengruppen und ausgewählte Angebote aus den gültigen deutschen und niederländischen Handzetteln. Das vollständige Sortiment findest du im Markt.",
  path: "/produkte",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
