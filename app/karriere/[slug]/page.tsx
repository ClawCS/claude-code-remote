import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageIntro from "@/components/editorial/PageIntro";
import JsonLdScript from "@/components/JsonLdScript";
import { buildBreadcrumbJsonLd } from "@/lib/recipe-structured-data";
import { PUBLIC_JOBS, findPublicJob } from "@/data/jobs";
import { buildPageMetadata } from "@/lib/search-metadata";
import { APPLICATION_EMAIL } from "@/lib/application-contact";
import { MARKET } from "@/lib/cinematic/site";
import styles from "@/components/editorial/transaction.module.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => PUBLIC_JOBS.map(job => ({ slug: job.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = findPublicJob((await params).slug);
  if (!job) notFound();
  return buildPageMetadata({ title: `${job.title} in Goch`, description: `${job.introduction} ${job.start} Bewerbung an ${APPLICATION_EMAIL}.`, path: `/karriere/${job.slug}`, image: job.poster.src });
}

export default async function PublicJobPage({ params }: Props) {
  const job = findPublicJob((await params).slug);
  if (!job) notFound();
  return <>
    <JsonLdScript value={buildBreadcrumbJsonLd([{ name: "Start", path: "/" }, { name: "Karriere", path: "/karriere" }, { name: job.title, path: `/karriere/${job.slug}` }])} />
    <PageIntro theme="people" eyebrow="Team & Karriere · Goch" title={job.title} description={job.introduction} breadcrumbs={[{ label: "Startseite", href: "/" }, { label: "Karriere", href: "/karriere" }, { label: job.schedule }]} />
    <article className={styles.body} data-service="career">
      <div className={`${styles.jobGrid} ${styles.jobDetail}`}>
        <a href={job.poster.src} target="_blank" rel="noopener noreferrer" className={styles.jobPoster} aria-label={`${job.title} – vollständige Anzeige öffnen`}><Image {...job.poster} alt={job.poster.alt} sizes="(max-width:640px) 85vw, 450px" className="w-full h-auto" /></a>
        <div className={styles.jobCard}>
          <h2 className="text-2xl font-bold">Das erwartet dich</h2>
          <ul className="list-disc pl-5 my-5 space-y-3">{job.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
          <h2 className="text-xl font-bold mt-6">Dein Arbeitsort</h2>
          <p className="my-3">{MARKET.displayName}<br />{MARKET.street}, {MARKET.postalCode} {MARKET.city}</p>
          <h2 className="text-xl font-bold mt-6">Dein Einstieg</h2><p className="my-3">{job.start}</p>
          <h2 className="text-xl font-bold mt-6">Jetzt bewerben</h2>
          <p className="my-3">Schreib uns per E-Mail oder komm persönlich im Markt vorbei. Arbeitszeiten und weitere Einzelheiten besprechen wir mit dir.</p>
          <a href={`mailto:${APPLICATION_EMAIL}?subject=${encodeURIComponent(job.emailSubject)}`} className={styles.textLink}>Für diese Stelle bewerben →</a>
          <Link href="/karriere" className={styles.textLink}>Alle offenen Stellen →</Link>
        </div>
      </div>
    </article>
  </>;
}
