import type { StaticImageData } from "next/image";

import heroTeam from "@/public/images/home/cinematic/hero-team.webp";
import posterCaramello from "@/public/images/home/cinematic/poster-caramello.webp";
import posterPralleKirsche from "@/public/images/home/cinematic/poster-pralle-kirsche.webp";
import posterSchwarzerTeufel from "@/public/images/home/cinematic/poster-schwarzer-teufel.webp";
import teamGabriella from "@/public/images/home/cinematic/team-gabriella.webp";
import teamGroup from "@/public/images/home/cinematic/team-group.webp";
import teamJasmin from "@/public/images/home/cinematic/team-jasmin.webp";
import teamNiko from "@/public/images/home/cinematic/team-niko.webp";

function deepFreeze<T extends object>(value: T): T {
  for (const entry of Object.values(value)) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      !Object.isFrozen(entry)
    ) {
      deepFreeze(entry);
    }
  }
  return Object.freeze(value);
}

type EditorialImage = Readonly<{
  id: string;
  image: StaticImageData;
  alt: string;
  caption: string;
  reviewedAt: string;
  releaseBasis: "user-approved-local-employee-pool-2026-07-14";
}>;

export type InstagramSelectionItem = Readonly<{
  id: string;
  image: StaticImageData;
  date: string;
  dateKind: "captured" | "published";
  caption: string;
  href: string;
  sourceUrl: string;
  releaseBasis: string;
}>;

export const EDITORIAL_IMAGES = deepFreeze({
  hero: {
    id: "hero-team",
    image: heroTeam,
    alt: "Sven und Niko von Trinkgut Jammers",
    caption: "Sven & Niko · vor Ort in Goch",
    reviewedAt: "2026-07-14",
    releaseBasis: "user-approved-local-employee-pool-2026-07-14",
  },
  group: {
    id: "team-group",
    image: teamGroup,
    alt: "Mitarbeiterinnen und Mitarbeiter von Trinkgut Jammers",
    caption: "Team Jammers",
    reviewedAt: "2026-07-14",
    releaseBasis: "user-approved-local-employee-pool-2026-07-14",
  },
  niko: {
    id: "team-niko",
    image: teamNiko,
    alt: "Nikolaos Jammers im Markt",
    caption: "Niko · Inhaber",
    reviewedAt: "2026-07-14",
    releaseBasis: "user-approved-local-employee-pool-2026-07-14",
  },
  jasmin: {
    id: "team-jasmin",
    image: teamJasmin,
    alt: "Jasmin von Trinkgut Jammers",
    caption: "Jasmin · Team Jammers",
    reviewedAt: "2026-07-14",
    releaseBasis: "user-approved-local-employee-pool-2026-07-14",
  },
  gabriella: {
    id: "team-gabriella",
    image: teamGabriella,
    alt: "Gabriella von Trinkgut Jammers",
    caption: "Gabriella · Team Jammers",
    reviewedAt: "2026-07-14",
    releaseBasis: "user-approved-local-employee-pool-2026-07-14",
  },
} as const satisfies Readonly<Record<string, EditorialImage>>);

export const PEOPLE_STORY = deepFreeze([
  EDITORIAL_IMAGES.group,
  EDITORIAL_IMAGES.hero,
  EDITORIAL_IMAGES.niko,
  EDITORIAL_IMAGES.jasmin,
  EDITORIAL_IMAGES.gabriella,
] as const);

export const INSTAGRAM_SELECTION: readonly InstagramSelectionItem[] = deepFreeze(
  [] as InstagramSelectionItem[],
);

export const SPOTLIGHT_POSTERS = deepFreeze([
  {
    number: "01",
    name: "Pralle Kirsche",
    label: "Originalposter",
    copy: "Rot im Bild. Goch im Rücken.",
    image: posterPralleKirsche,
    alt: "Originalposter Pralle Kirsche",
    href: "/eigenmarke",
  },
  {
    number: "02",
    name: "Schwarzer Teufel",
    label: "Originalposter",
    copy: "Schwarz gerahmt. Direkt ins Licht.",
    image: posterSchwarzerTeufel,
    alt: "Originalposter Schwarzer Teufel",
    href: "/eigenmarke",
  },
  {
    number: "03",
    name: "Caramello",
    label: "Originalposter",
    copy: "Goldener Auftritt. Teil der Jammers-Serie.",
    image: posterCaramello,
    alt: "Originalposter Caramello",
    href: "/eigenmarke",
  },
] as const);

export const SERVICE_ITEMS = deepFreeze([
  {
    number: "01",
    title: "Persönliche Beratung",
    text: "Direkter Kontakt mit dem Team im Markt.",
    href: "/kontakt",
  },
  {
    number: "02",
    title: "Partybedarf",
    text: "Partybedarf bei Trinkgut Jammers in Goch.",
    href: "/partyplaner",
  },
  {
    number: "03",
    title: "Vermietung",
    text: "Mietartikel anfragen und Verfügbarkeit bestätigen lassen.",
    href: "/vermietung",
  },
] as const);

export const RENTAL_HIGHLIGHTS = deepFreeze([
  { name: "Kühlanhänger", price: "150 €", stock: 3 },
  { name: "Kühltruhe", price: "35 €", stock: 4 },
  { name: "Stehtisch", price: "12 €", stock: 20 },
  { name: "Zapfanlage", price: "25 €", stock: 3 },
  { name: "Bierzeltgarnitur", price: "15 €", stock: 13 },
] as const);

export const RENTAL_SOURCES = deepFreeze({
  price: { label: "Leihartikel-Preisliste", asOf: "01.01.2026" },
  inventory: { label: "Bestandsprüfung", asOf: "06.03.2026" },
} as const);
