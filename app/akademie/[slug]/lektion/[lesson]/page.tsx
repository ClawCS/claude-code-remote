import { notFound, permanentRedirect } from "next/navigation";
import { courses } from "@/data/akademie";
import LessonContent from "@/components/academy/LessonContent";
import { lessonHref, parseLessonIndex } from "@/lib/academy-routes";
import { buildPageMetadata } from "@/lib/search-metadata";

type Params = { slug: string; lesson: string };
function resolveLesson({ slug, lesson }: Params) {
  const course = courses.find(course => course.slug === slug);
  if (!course) notFound();
  const index = parseLessonIndex(lesson, course.lessons.length);
  if (index === undefined) notFound();
  if (index === 0) permanentRedirect(lessonHref(slug, 0));
  return { course, index };
}

export const dynamicParams = false;
export function generateStaticParams({ params }: { params: { slug: string } }) {
  const course = courses.find(course => course.slug === params.slug);
  // Include the lesson-one alias so static routing can issue its 308.
  return course?.lessons.map((_, index) => ({ lesson: String(index + 1) })) ?? [];
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { course, index } = resolveLesson(await params);
  const lesson = course.lessons[index];
  return buildPageMetadata({
    title: `${lesson.title} — ${course.title}`,
    description: `Lektion ${index + 1} von ${course.lessons.length} im Kurs ${course.title}: ${lesson.title}.`,
    path: lessonHref(course.slug, index),
  });
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { course, index } = resolveLesson(await params);
  return <LessonContent course={course} index={index} />;
}
