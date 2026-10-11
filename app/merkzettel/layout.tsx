import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Dein Merkzettel",
    description: "Deine persönlich gemerkten Artikel und Ideen bei Trinkgut Jammers.",
    path: "/merkzettel",
  }),
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
