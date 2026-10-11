import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Zapfanlagen & Partybedarf mieten in Goch",
  description: "Mietartikel für deine Veranstaltung in Goch: Zapfanlagen, Stehtische, Bänke, Gläser. Faire Preise und persönliche Beratung.",
  path: "/vermietung",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
