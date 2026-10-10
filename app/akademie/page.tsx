import Link from "next/link";
import AcademyCover from "@/components/AcademyCover";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/learning.module.css";
import editorial from "@/components/editorial/editorial.module.css";
import { courses } from "@/data/akademie";
import type { Metadata } from "next";
import { academyCertificates } from "@/data/academy-certificates";

export const metadata: Metadata = {
  title: "Getränkeakademie",
  description: "Lernen rund um Bier, Wein und Spirituosen: kostenlose Lektionen, Quiz und Abschlusstests sowie Hinweise auf externe Weiterbildungen.",
  alternates: { canonical: "/akademie" },
};

export default function AkademiePage() {
  return <>
    <PageIntro eyebrow="Entdecken & Verstehen" title="Getränkeakademie" description={`${courses.length} Kurse mit ${courses.reduce((sum, c) => sum + c.lessons.length, 0)} Lektionen. Entdecke Getränkewissen in deinem Tempo – von Bierwissen bis Likör-Herstellung.`} breadcrumbs={[{ label: "Start", href: "/" }, { label: "Getränkeakademie" }]} />
    <div data-learning="academy" className={styles.body}>
      <div className={styles.grid}>
        {courses.map(course => <Link key={course.slug} href={`/akademie/${course.slug}`} className={styles.card}>
          <AcademyCover slug={course.slug} />
          <div className={styles.cardBody}>
            <p className={styles.meta}>{course.difficulty} · {course.duration} · {course.lessons.length} Lektionen</p>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <span className={`${styles.textLink} inline-block mt-4`}>Kurs starten</span>
          </div>
        </Link>)}
      </div>
      <p className={styles.credit}>KI-generierte Themenbilder zur Illustration der Kursinhalte.</p>
      <section className={styles.related} aria-labelledby="external-courses">
        <h2 id="external-courses">Professionelle Zertifikatskurse</h2>
        <p>IHK-Zertifikate, WSET-Diplome und Sommelier-Ausbildungen — {academyCertificates.length} Weiterbildungshinweise für deine Karriere. Termine, Preise und Anmeldung bitte beim Anbieter prüfen.</p>
        <Link href="/akademie/zertifikate" className={editorial.primaryLink}>Alle Zertifikatskurse ansehen</Link>
      </section>
      <section className={`${editorial.section} ${editorial.grid}`} aria-label="Lernen und genießen">
        <div><h2 className="text-xl mb-3">In deinem Tempo</h2><p className={styles.reading}>Kurze Lektionen, Quiz und ein Abschlusstest helfen dir, dein Wissen zu vertiefen.</p></div>
        <div><h2 className="text-xl mb-3">Besser einkaufen</h2><p className={styles.reading}>Wer versteht, was er kauft, trifft bessere Entscheidungen und entdeckt Neues.</p></div>
        <div><h2 className="text-xl mb-3">Mehr genießen</h2><p className={styles.reading}>Hintergrundwissen macht jedes Glas zum Erlebnis — ob Bier, Wein oder Whisky.</p></div>
      </section>
    </div>
  </>;
}
