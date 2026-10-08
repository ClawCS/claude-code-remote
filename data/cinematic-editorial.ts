import type { StaticImageData } from "next/image";
import { getRentalItem } from "@/data/rentals";

import heroTeam from "@/public/images/home/cinematic/hero-team.webp";
import posterCaramello from "@/public/images/home/cinematic/poster-caramello.webp";
import posterPralleKirsche from "@/public/images/home/cinematic/poster-pralle-kirsche.webp";
import posterSchwarzerTeufel from "@/public/images/home/cinematic/poster-schwarzer-teufel.webp";
import teamGroup from "@/public/images/home/cinematic/team-group.webp";
import teamJasmin from "@/public/images/home/cinematic/team-jasmin.webp";
import teamNiko from "@/public/images/home/cinematic/team-niko.webp";
import teamSven from "@/public/images/home/cinematic/team-sven.webp";
import teamJanNiklas from "@/public/images/home/cinematic/team-jan-niklas.webp";
import teamHanna from "@/public/images/home/cinematic/team-hanna.webp";
import teamHenri from "@/public/images/home/cinematic/team-henri.webp";
import teamHannah from "@/public/images/home/cinematic/team-hannah.webp";

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
  releaseBasis: "user-approved-canva-pool-2026-09-30";
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
    caption: "Sven & Niko",
    reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  group: {
    id: "team-group",
    image: teamGroup,
    alt: "Mitarbeiterinnen und Mitarbeiter von Trinkgut Jammers",
    caption: "",
    reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  niko: {
    id: "team-niko",
    image: teamNiko,
    alt: "Nikolaos Jammers im Markt",
    caption: "Niko",
    reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  jasmin: {
    id: "team-jasmin",
    image: teamJasmin,
    alt: "Jasmin von Trinkgut Jammers",
    caption: "Jasmin",
    reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  sven: {
    id: "team-sven", image: teamSven, alt: "Sven von Trinkgut Jammers",
    caption: "Sven", reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  janNiklas: {
    id: "team-jan-niklas", image: teamJanNiklas, alt: "Jan Niklas von Trinkgut Jammers",
    caption: "Jan Niklas", reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  hanna: {
    id: "team-hanna", image: teamHanna, alt: "Hanna von Trinkgut Jammers",
    caption: "Hanna", reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  henri: {
    id: "team-henri", image: teamHenri, alt: "Henri von Trinkgut Jammers",
    caption: "Henri", reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
  hannah: {
    id: "team-hannah", image: teamHannah, alt: "Hannah von Trinkgut Jammers",
    caption: "Hannah", reviewedAt: "2026-09-30",
    releaseBasis: "user-approved-canva-pool-2026-09-30",
  },
} as const satisfies Readonly<Record<string, EditorialImage>>);

export const PEOPLE_STORY = deepFreeze([
  EDITORIAL_IMAGES.group,
  EDITORIAL_IMAGES.niko,
  EDITORIAL_IMAGES.sven,
  EDITORIAL_IMAGES.jasmin,
  EDITORIAL_IMAGES.janNiklas,
  EDITORIAL_IMAGES.hanna,
  EDITORIAL_IMAGES.henri,
  EDITORIAL_IMAGES.hannah,
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
    text: "Ein guter Wein zum Essen? Etwas Neues für den Feierabend? Frag uns – wir nehmen uns Zeit für dich.",
    href: "/kontakt",
  },
  {
    number: "02",
    title: "Partybedarf",
    text: "Geburtstag, Vereinsfest oder große Runde: Plane deine Getränkemengen und stimme die Auswahl mit uns ab.",
    href: "/partyplaner",
  },
  {
    number: "03",
    title: "Vermietung",
    text: "Kühlanhänger, Zapfanlage, Tische und Gläser: Frag den passenden Leihartikel für deinen Termin an.",
    href: "/vermietung",
  },
] as const);

export const RENTAL_HIGHLIGHTS = deepFreeze([20001,20002,20003,20004,20007].map(id => {
  const item = getRentalItem(id)!;
  return { name: item.name, price: item.price === null ? "Preis auf Anfrage" : `${new Intl.NumberFormat("de-DE").format(item.price)} €`, stock: item.physicalStock };
}));

export const RENTAL_SOURCES = deepFreeze({
  price: { label: "Leihartikel-Preisliste", asOf: "01.01.2026" },
  inventory: { label: "Bestandsprüfung", asOf: "06.03.2026" },
} as const);
