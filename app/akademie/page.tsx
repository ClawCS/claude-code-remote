import Link from "next/link";
import AcademyCover from "@/components/AcademyCover";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/learning.module.css";
import editorial from "@/components/editorial/editorial.module.css";
import { courses } from "@/data/akademie";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";
import { academyCertificates } from "@/data/academy-certificates";

export const metadata: Metadata = buildPageMetadata({
  title: "Getränkeakademie",
  description: "Lernen rund um Bier, Wein und Spirituosen: kostenlose Lektionen, Quiz und Abschlusstests sowie Hinweise auf externe Weiterbildungen.",
  path: "/akademie",
});

export default function AkademiePage() {
  return <>
    <PageIntro theme="learning" media={{ src: "/images/akademie/wein-editorial.webp", alt: "Weißwein, Rotwein und Rosé zur Verkostung · Themenbild", width: 1200, height: 800 }} eyebrow="Entdecken & Verstehen" title={<>Getränke<wbr />akademie</>} description={`${courses.length} Kurse mit ${courses.reduce((sum, c) => sum + c.lessons.length, 0)} Lektionen. Entdecke Getränkewissen in deinem Tempo – von Bierwissen bis Likör-Herstellung.`} breadcrumbs={[{ label: "Start", href: "/" }, { label: "Getränkeakademie" }]}>
      <a href="#academy-courses" className={editorial.secondaryLink}>Kurse entdecken</a>
    </PageIntro>
    <div data-learning="academy" className={styles.body}>
      <div id="academy-courses" className={styles.grid}>
        {courses.map((course, index) => <Link key={course.slug} href={`/akademie/${course.slug}`} className={styles.card} data-featured={index === 0 ? true : undefined}>
          <div className={styles.courseImage}><AcademyCover slug={course.slug} featured={index === 0} /><span className={styles.courseNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></div>
          <div className={styles.cardBody}>
            <p className={styles.meta}>{course.difficulty} · {course.duration} · {course.lessons.length} Lektionen</p>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <span className={`${styles.textLink} inline-block mt-4`}>Kurs starten</span>
          </div>
        </Link>)}
      </div>
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
