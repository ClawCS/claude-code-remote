import { USER_JOB_POSTERS, type EditorialPhoto } from "@/data/user-market-photos";

export type PublicJob = Readonly<{
  slug: string;
  title: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "OTHER";
  schedule: string;
  introduction: string;
  benefits: readonly string[];
  start: string;
  emailSubject: string;
  poster: EditorialPhoto;
  confirmedAt: string;
  /** Publication of these new detail pages; not the original job-ad posting date. */
  publishedAt: string;
}>;

/** Only the currently confirmed operator posters establish vacancy facts. */
export const PUBLIC_JOBS: readonly PublicJob[] = [
  {
    slug: "verkauf-vollzeit",
    title: "Verkäuferin / Verkäufer (m/w/d) – Vollzeit",
    employmentType: "FULL_TIME",
    schedule: "Vollzeit",
    introduction: "Verstärke unser Verkaufsteam im Getränkemarkt Trinkgut Jammers in Goch.",
    benefits: ["Vollzeitstelle", "Freundliches Team", "Sofortiger Einstieg möglich"],
    start: "Sofortiger Einstieg möglich",
    emailSubject: "Bewerbung Verkauf Vollzeit",
    poster: USER_JOB_POSTERS.fulltime,
    confirmedAt: "2026-10-10",
    publishedAt: "2026-10-12",
  },
  {
    slug: "verkauf-teilzeit",
    title: "Verkäuferin / Verkäufer (m/w/d) – Teilzeit",
    employmentType: "PART_TIME",
    schedule: "Teilzeit bis zu 150 Stunden im Monat",
    introduction: "Verstärke unser Verkaufsteam in Goch in Teilzeit mit bis zu 150 Stunden im Monat.",
    benefits: ["Teilzeit bis zu 150 Stunden im Monat", "Freundliches Team", "Sofortiger Einstieg möglich"],
    start: "Sofortiger Einstieg möglich",
    emailSubject: "Bewerbung Verkauf Teilzeit",
    poster: USER_JOB_POSTERS.parttime,
    confirmedAt: "2026-10-10",
    publishedAt: "2026-10-12",
  },
  {
    slug: "ausbildung",
    title: "Ausbildung im Getränkehandel / Einzelhandel (m/w/d)",
    employmentType: "OTHER",
    schedule: "Ausbildung",
    introduction: "Starte deine Ausbildung im Getränkehandel / Einzelhandel bei Trinkgut Jammers in Goch.",
    benefits: [
      "Ausbildungsvergütung laut Anzeige: 1. Jahr 1.250 €, 2. Jahr 1.350 €, 3. Jahr 1.450 €",
      "Spannende Ausbildung in einem familiären Team",
      "Abwechslungsreiche Aufgaben im Markt",
      "Direkter Kundenkontakt und Verantwortung",
      "Gute Übernahmechancen",
    ],
    start: "Den Ausbildungsbeginn besprechen wir persönlich mit dir.",
    emailSubject: "Bewerbung Ausbildung",
    poster: USER_JOB_POSTERS.apprentice,
    confirmedAt: "2026-10-10",
    publishedAt: "2026-10-12",
  },
];

export function findPublicJob(slug: string): PublicJob | undefined {
  return PUBLIC_JOBS.find(job => job.slug === slug);
}
