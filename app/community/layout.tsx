import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Community — Einblicke aus dem Markt",
  description: "Team, Aktionen und Neuigkeiten von Trinkgut Jammers in Goch auf unserem Instagram-Kanal.",
  path: "/community",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
