import { notFound } from "next/navigation";
import CourseShell from "@/components/academy/CourseShell";
import { courses } from "@/data/akademie";

// Nur existierende Kurs-Slugs sind gültig → sonst echtes 404
export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();
  const navigation = {
    slug: course.slug, title: course.title, description: course.description,
    difficulty: course.difficulty, duration: course.duration, finalExam: course.finalExam,
    lessons: course.lessons.map(({ title, quiz }) => ({ title, quiz })),
  };
  return <CourseShell key={course.slug} course={navigation}>{children}</CourseShell>;
}
