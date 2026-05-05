import type { Metadata } from "next";
import { courses } from "@/data/akademie";

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
    title: `${course.title} — ${course.lessons.length} Lektionen | Trinkgut Akademie`,
    description: course.description,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
