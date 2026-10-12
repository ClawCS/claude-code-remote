import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageIntro from "@/components/editorial/PageIntro";
import { PUBLIC_JOBS } from "@/data/jobs";
import { buildPageMetadata } from "@/lib/search-metadata";
import { APPLICATION_EMAIL } from "@/lib/application-contact";
import styles from "@/components/editorial/transaction.module.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Karriere – Offene Stellen in Goch",
  description: "Verkauf in Vollzeit, Teilzeit bis zu 150 Stunden im Monat oder Ausbildung bei Trinkgut Jammers in Goch. Entdecke unsere Stellen und bewirb dich per E-Mail.",
  path: "/karriere",
});

export default function CareerIndexPage() {
  return <>
    <PageIntro eyebrow="Team & Karriere" title="Dein nächster Schritt. Bei Jammers." description="Getränke, Menschen und ein Markt voller Leben: Entdecke unsere offenen Stellen in Goch." breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Karriere" }]} />
    <div className={styles.body} data-service="career">
      <div className={styles.jobGrid}>{PUBLIC_JOBS.map(job => <article key={job.slug} className={styles.jobCard}>
        <Link href={`/karriere/${job.slug}`} aria-label={`${job.title} – Stellenbeschreibung ansehen`} className={styles.jobPoster}><Image {...job.poster} alt={job.poster.alt} sizes="(max-width:640px) 85vw, (max-width:1024px) 42vw, 330px" className="w-full h-auto" /></Link>
        <h2 className="text-2xl font-bold">{job.title}</h2>
        <p className="mt-3">{job.introduction}</p>
        <Link href={`/karriere/${job.slug}`} className={styles.textLink}>Stellenbeschreibung ansehen →</Link>
        <a href={`mailto:${APPLICATION_EMAIL}?subject=${encodeURIComponent(job.emailSubject)}`} className={styles.textLink}>Per E-Mail bewerben</a>
      </article>)}</div>
      <section className={styles.application}>
        <h2 className="text-2xl font-bold">Wir freuen uns auf dich.</h2>
        <p className="my-4">Sende deine Bewerbung an <a href={`mailto:${APPLICATION_EMAIL}`} className={styles.textLink}>{APPLICATION_EMAIL}</a> oder sprich uns persönlich im Markt an.</p>
        <Link href="/bewerbung" className={styles.textLink}>Zum Bewerbungskontakt →</Link>
      </section>
    </div>
  </>;
}
