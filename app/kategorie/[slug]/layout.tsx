import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";
import { categories } from "@/lib/utils";

// Nur existierende Kategorie-Slugs sind gültig → sonst echtes 404
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return {
      title: "Kategorie nicht gefunden",
      description: "Diese Kategorie ist aktuell nicht verfügbar.",
    };
  }
  return buildPageMetadata({
    title: `${category.name} — Sortiment`,
    description: `${category.name} aus unserem Sortiment bei Trinkgut Jammers Goch — Top-Marken auf einen Blick.`,
    path: `/kategorie/${category.slug}`,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
