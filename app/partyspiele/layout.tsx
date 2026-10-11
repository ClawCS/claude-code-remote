import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Party-Spiele — 8 digitale Trinkspiele ",
  description: "Trink-Roulette, Bier-Pong, Kings Cup, Wahrheit oder Pflicht — 8 digitale Party-Spiele für deine nächste Feier.",
  path: "/partyspiele",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
