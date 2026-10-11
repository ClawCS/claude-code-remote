import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Galerie — Markt, Team & Events ",
  description: "Eindrücke aus dem Trinkgut Jammers Markt in Goch — unser Team, Events und Sortiment in Bildern.",
  path: "/galerie",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
