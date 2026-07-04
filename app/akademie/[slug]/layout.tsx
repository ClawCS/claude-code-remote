import type { Metadata } from "next";
import { courses } from "@/data/akademie";

// Nur existierende Kurs-Slugs sind gültig → sonst echtes 404
export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) {
    return {
      title: "Kurs nicht gefunden",
      description: "Dieser Akademie-Kurs ist aktuell nicht verfügbar.",
    };
  }
  return {
    title: `${course.title} — ${course.lessons.length} Lektionen`,
    description: course.description,
    alternates: { canonical: `/akademie/${course.slug}` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
