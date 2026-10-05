import instagramCovers from "@/data/editorial/giveaway-instagram-covers.json";

type GiveawayBase = Readonly<{
  id: string;
  year: number;
  title: string;
  description: string;
  sourceURL: string;
  /** Exact original post timestamp when verified; older entries retain calendar classification. */
  publishedAt?: string;
  /** Reviewed local original-post export from Canva or the approved own-Instagram source; never cropped. */
  cover?: Readonly<{ src: string; width: number; height: number; alt: string }>;
  /** Local Europe/Berlin date, inclusive through 23:59:59.999. */
  verifiedEndsDate: string;
}>;

export type Giveaway = GiveawayBase & (
  | Readonly<{ kind: "monthly"; month: number }>
  | Readonly<{ kind: "special"; verifiedAt: string }>
);

export const GIVEAWAYS_UPDATED_ON = "05.10.2026";

/** Original captions checked 30.09.2026; October additions checked 05.10.2026. No winner names inferred. */
const giveawayDetails: readonly Giveaway[] = [
  { id: "2026-01", kind: "monthly", year: 2026, month: 1, title: "Salitos SUP-Paket", description: "Ein Stand-up-Paddle-Board sowie je ein Salitos 4er-Pack Blue und Sunrise.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DT0ZAQEDOc9/", verifiedEndsDate: "2026-02-08" },
  { id: "2026-02", kind: "monthly", year: 2026, month: 2, title: "Ott Sports Sportpaket", description: "Ein Sportpaket für zu Hause von Ott Sports im Wert von 250 Euro.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DUQ-IgEjMMv/", verifiedEndsDate: "2026-02-28" },
  { id: "2026-03", kind: "monthly", year: 2026, month: 3, title: "Monster Energy Mini Cooler", description: "Ein Monster Energy Mini Cooler, gefüllt mit der Wunsch-Sorte.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DVWA1xvDN-J/", verifiedEndsDate: "2026-03-29" },
  { id: "2026-04", kind: "monthly", year: 2026, month: 4, title: "Edifier MP230 + Ballantine’s", description: "Edifier MP230 Lautsprecher und Ballantine’s Special Kiss Edition; laut Originalbeitrag gibt es zwei Gewinner.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DW09zp_jCcO/", verifiedEndsDate: "2026-05-02" },
  { id: "2026-05", kind: "monthly", year: 2026, month: 5, title: "Erdinger Sommer-Set", description: "Zwei Gewinnsets: jeweils ein Schirm, eine Kiste Erdinger und ein Dartspiel.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DX81IbTMW-M/", verifiedEndsDate: "2026-05-31" },
  { id: "2026-06", kind: "monthly", year: 2026, month: 6, title: "Monster BMX", description: "Ein BMX von Monster.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DZFhvs5s7a7/", verifiedEndsDate: "2026-06-30" },
  { id: "2026-07", kind: "monthly", year: 2026, month: 7, title: "Enders E Urban Pro 2 Turbo", description: "Der Enders E Urban Pro 2 Turbo Grill.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DaSlTlAM1-y/", verifiedEndsDate: "2026-08-01" },
  { id: "2026-08", kind: "monthly", year: 2026, month: 8, title: "Salitos SUP Wood Edition", description: "Das Salitos SUP in der Wood Edition.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DbRH2Tds4dc/", verifiedEndsDate: "2026-08-30" },
  { id: "2026-09", kind: "monthly", year: 2026, month: 9, title: "Veltins Helles Lager", description: "Ein Mini Cooler und zwei Kisten Veltins Helles Lager.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DcsoYTBMQLJ/", verifiedEndsDate: "2026-09-30" },
  { id: "2026-10", kind: "monthly", year: 2026, month: 10, title: "Everdure KILN R – Staropramen Edition", description: "Ein Everdure KILN R Pizzaofen in der Limited Edition Staropramen, laut Originalbeitrag im Wert von 799 Euro. Abholung bei uns im Markt in Goch.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/Dd8boPORyPU/", publishedAt: "2026-10-01T08:04:13.000Z", verifiedEndsDate: "2026-10-31" },
  { id: "2026-disaronno", kind: "special", year: 2026, title: "Disaronno Liegestuhl + Flasche", description: "Ein Disaronno Liegestuhl inklusive einer Flasche Disaronno. Abholung bei uns im Markt in Goch.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DeERgI8xx-O/", publishedAt: "2026-10-04T09:08:12.000Z", verifiedEndsDate: "2026-10-18", verifiedAt: "2026-10-05" },
  { id: "2026-guinness", kind: "special", year: 2026, title: "Guinness Tasche + 4er-Pack", description: "Eine Guinness Tasche und ein 4er-Pack Guinness.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DdQ8_8hsWYB/", verifiedEndsDate: "2026-10-03", verifiedAt: "2026-09-30" },
  { id: "2026-easter", kind: "special", year: 2026, title: "Oberdorfer Oster-Picknick-Paket", description: "Ein Oberdorfer Bollerwagen mit Sitzkissen und vier Kisten Oberdorfer Helles.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DWenSq4DHsM/", verifiedEndsDate: "2026-04-04", verifiedAt: "2026-09-30" },
  { id: "2026-faxe", kind: "special", year: 2026, title: "Faxe Bollerwagen", description: "Zwei Faxe Bollerwagen für zwei Gewinner zum Vatertag.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DXuV2NMDO7e/", verifiedEndsDate: "2026-05-10", verifiedAt: "2026-09-30" },
  { id: "2026-wm", kind: "special", year: 2026, title: "WM-Tippspiel mit JBL", description: "JBL Tune 520BT, JBL Go 4 und JBL Clip 5: drei Gewinnchancen beim WM-Tippspiel.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DZc5M8LMmNG/", verifiedEndsDate: "2026-06-25", verifiedAt: "2026-09-30" },
];

/** Complete original artworks, reviewed against the dated Instagram posts. */
const verifiedCovers: Readonly<Partial<Record<string, NonNullable<Giveaway["cover"]>>>> = {
  ...Object.fromEntries(instagramCovers.covers
    .filter(cover => cover.status === "approved")
    .map(({ id, src, width, height, alt }) => [id, { src, width, height, alt }])),
  "2026-01": { src: "/images/editorial/canva/giveaway-2026-01.webp", width: 1320, height: 1642, alt: "Originalbeitragsbild: Salitos SUP-Paket mit Blue und Sunrise" },
  "2026-02": { src: "/images/editorial/canva/giveaway-2026-02.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: Ott Sports Sportpaket im Wert von 250 Euro" },
  "2026-04": { src: "/images/editorial/canva/giveaway-2026-04.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: Edifier MP230 und Ballantine’s Special Kiss" },
  "2026-05": { src: "/images/editorial/canva/giveaway-2026-05.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: Erdinger Sommer-Set mit Schirm, Dartspiel und Kiste" },
  "2026-06": { src: "/images/editorial/canva/giveaway-2026-06.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: Monster Energy BMX" },
  "2026-07": { src: "/images/editorial/canva/giveaway-2026-07.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: Enders E Urban Pro 2 Turbo Grill" },
  "2026-easter": { src: "/images/editorial/canva/giveaway-2026-easter.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: Oberdorfer Oster-Picknick-Paket mit Bollerwagen" },
  "2026-faxe": { src: "/images/editorial/canva/giveaway-2026-faxe.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: Zwei Faxe Bollerwagen zum Vatertag" },
  "2026-wm": { src: "/images/editorial/canva/giveaway-2026-wm.webp", width: 1080, height: 1440, alt: "Originalbeitragsbild: WM-Tippspiel mit drei JBL-Gewinnen" },
};

export const GIVEAWAYS_2026: readonly Giveaway[] = giveawayDetails.map(giveaway => ({
  ...giveaway,
  cover: verifiedCovers[giveaway.id],
}));
