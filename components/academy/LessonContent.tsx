import type { Course } from "@/data/akademie";
import JsonLdScript from "@/components/JsonLdScript";
import { buildBreadcrumbJsonLd } from "@/lib/recipe-structured-data";
import { lessonHref } from "@/lib/academy-routes";
import styles from "@/components/editorial/learning.module.css";

export default function LessonContent({ course, index }: { course: Course; index: number }) {
  const lesson = course.lessons[index];
  return <>
    <JsonLdScript value={buildBreadcrumbJsonLd([
      { name: "Start", path: "/" }, { name: "Akademie", path: "/akademie" },
      { name: course.title, path: lessonHref(course.slug, 0) },
      ...(index ? [{ name: lesson.title, path: lessonHref(course.slug, index) }] : []),
    ])} />
    <section id="course-lesson" tabIndex={-1} className={styles.lesson} aria-label="Lektion">
      <h2 className="text-xl font-bold text-secondary mb-6">{lesson.title}</h2>
      <div className={styles.lessonText}>
        {lesson.content.split(/\n\n+/).map((block, index) => {
          const heading = block.match(/^(#{2,3}) (.+)$/);
          const text = heading ? heading[2] : block;
          const content = text.split("**").map((part, i) => i % 2 === 0
            ? <span key={i}>{part}</span>
            : <strong key={i} className="text-secondary font-semibold">{part}</strong>);
          if (heading?.[1] === "##") return <h3 key={index}>{text}</h3>;
          if (heading?.[1] === "###") return <h4 key={index}>{text}</h4>;
          return <p key={index}>{content}</p>;
        })}
      </div>
    </section>
  </>;
}
