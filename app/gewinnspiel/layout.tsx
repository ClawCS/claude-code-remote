import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Aktionen & Gewinnspiele",
  description: "Originalbeiträge und Teilnahmebedingungen zu Aktionen von Trinkgut Jammers findest du auf unserem Instagram-Kanal.",
  path: "/gewinnspiel",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
