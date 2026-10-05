import Link from "next/link";
import { courses } from "@/data/akademie";
import styles from "./academy-entry.module.css";

const categoryCourses: Readonly<Record<string, readonly string[]>> = {
  bier: ["bier"],
  alkoholfrei: ["mineralwasser", "saft"],
  wein: ["wein"],
  sekt: ["schaumwein"],
  spirituosen: ["whiskey", "rum", "likoere"],
  eigenmarke: ["likoere"],
};

export default function AcademyEntry({ category }: { category?: string }) {
  if (!category) return <aside className={styles.entry} aria-label="Getränkeakademie">
    <div>
      <p className={styles.title}>Mehr wissen. Bewusster auswählen.</p>
      <p>{courses.length} Kurse mit Getränkewissen, kurzen Quiz und praktischen Tipps.</p>
    </div>
    <Link href="/akademie" prefetch={false}>Getränkeakademie entdecken <span aria-hidden="true">→</span></Link>
  </aside>;

  const relevant = (categoryCourses[category] ?? []).flatMap(slug => {
    const course = courses.find(item => item.slug === slug);
    return course ? [course] : [];
  });
  if (relevant.length === 0) return null;

  return <aside className={styles.context} data-academy-context aria-label="Passendes Getränkewissen">
    <h2 className={styles.title}>Passendes Getränkewissen</h2>
    <ul>
      {relevant.map(course => <li key={course.slug}>
        <Link href={`/akademie/${course.slug}`} prefetch={false}>{course.title} <span aria-hidden="true">→</span></Link>
        <span>{course.lessons.length} Lektionen · {course.duration}</span>
      </li>)}
    </ul>
    <Link href="/akademie" prefetch={false} className={styles.overview}>Alle Kurse der Getränkeakademie <span aria-hidden="true">→</span></Link>
  </aside>;
}
