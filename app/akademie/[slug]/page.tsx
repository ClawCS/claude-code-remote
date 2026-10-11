import { notFound } from "next/navigation";
import { courses } from "@/data/akademie";
import LessonContent from "@/components/academy/LessonContent";
import { buildPageMetadata } from "@/lib/search-metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = courses.find(course => course.slug === slug);
  if (!course) notFound();
  return buildPageMetadata({ title: `${course.title} — ${course.lessons.length} Lektionen`, description: course.description, path: `/akademie/${course.slug}` });
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = courses.find(course => course.slug === slug);
  if (!course) notFound();
  return <LessonContent course={course} index={0} />;
}
