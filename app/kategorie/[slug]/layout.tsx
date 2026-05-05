import type { Metadata } from "next";
import { categories } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return {
      title: "Kategorie nicht gefunden",
      description: "Diese Kategorie ist aktuell nicht verfügbar.",
    };
  }
  return {
    title: `${category.name} — Sortiment | Trinkgut Jammers`,
    description: `Alle ${category.name}-Angebote bei Trinkgut Jammers Goch. Aktuelle Wochenpreise und Top-Marken auf einen Blick.`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
