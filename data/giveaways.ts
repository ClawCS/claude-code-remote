type GiveawayBase = Readonly<{
  id: string;
  year: number;
  title: string;
  description: string;
  sourceURL: string;
  /** Local Europe/Berlin date, inclusive through 23:59:59.999. */
  verifiedEndsDate: string;
}>;

export type Giveaway = GiveawayBase & (
  | Readonly<{ kind: "monthly"; month: number }>
  | Readonly<{ kind: "special"; verifiedAt: string }>
);

/** Original Instagram captions read on 30.09.2026. No publication dates or winner names inferred. */
export const GIVEAWAYS_2026: readonly Giveaway[] = [
  { id: "2026-01", kind: "monthly", year: 2026, month: 1, title: "Salitos SUP-Paket", description: "Ein Stand-up-Paddle-Board sowie je ein Salitos 4er-Pack Blue und Sunrise.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DT0ZAQEDOc9/", verifiedEndsDate: "2026-02-08" },
  { id: "2026-02", kind: "monthly", year: 2026, month: 2, title: "Ott Sports Sportpaket", description: "Ein Sportpaket für zu Hause von Ott Sports im Wert von 250 Euro.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DUQ-IgEjMMv/", verifiedEndsDate: "2026-02-28" },
  { id: "2026-03", kind: "monthly", year: 2026, month: 3, title: "Monster Energy Mini Cooler", description: "Ein Monster Energy Mini Cooler, gefüllt mit der Wunsch-Sorte.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DVWA1xvDN-J/", verifiedEndsDate: "2026-03-29" },
  { id: "2026-04", kind: "monthly", year: 2026, month: 4, title: "Edifier MP230 + Ballantine’s", description: "Edifier MP230 Lautsprecher und Ballantine’s Special Kiss Edition; laut Originalbeitrag gibt es zwei Gewinner.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DW09zp_jCcO/", verifiedEndsDate: "2026-05-02" },
  { id: "2026-05", kind: "monthly", year: 2026, month: 5, title: "Erdinger Sommer-Set", description: "Zwei Gewinnsets: jeweils ein Schirm, eine Kiste Erdinger und ein Dartspiel.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DX81IbTMW-M/", verifiedEndsDate: "2026-05-31" },
  { id: "2026-06", kind: "monthly", year: 2026, month: 6, title: "Monster BMX", description: "Ein BMX von Monster.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DZFhvs5s7a7/", verifiedEndsDate: "2026-06-30" },
  { id: "2026-07", kind: "monthly", year: 2026, month: 7, title: "Enders E Urban Pro 2 Turbo", description: "Der Enders E Urban Pro 2 Turbo Grill.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DaSlTlAM1-y/", verifiedEndsDate: "2026-08-01" },
  { id: "2026-08", kind: "monthly", year: 2026, month: 8, title: "Salitos SUP Wood Edition", description: "Das Salitos SUP in der Wood Edition.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DbRH2Tds4dc/", verifiedEndsDate: "2026-08-30" },
  { id: "2026-09", kind: "monthly", year: 2026, month: 9, title: "Veltins Helles Lager", description: "Ein Mini Cooler und zwei Kisten Veltins Helles Lager.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DcsoYTBMQLJ/", verifiedEndsDate: "2026-09-30" },
  { id: "2026-guinness", kind: "special", year: 2026, title: "Guinness Tasche + 4er-Pack", description: "Eine Guinness Tasche und ein 4er-Pack Guinness.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DdQ8_8hsWYB/", verifiedEndsDate: "2026-10-03", verifiedAt: "2026-09-30" },
  { id: "2026-easter", kind: "special", year: 2026, title: "Oberdorfer Oster-Picknick-Paket", description: "Ein Oberdorfer Bollerwagen mit Sitzkissen und vier Kisten Oberdorfer Helles.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DWenSq4DHsM/", verifiedEndsDate: "2026-04-04", verifiedAt: "2026-09-30" },
  { id: "2026-faxe", kind: "special", year: 2026, title: "Faxe Bollerwagen", description: "Zwei Faxe Bollerwagen für zwei Gewinner zum Vatertag.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DXuV2NMDO7e/", verifiedEndsDate: "2026-05-10", verifiedAt: "2026-09-30" },
  { id: "2026-wm", kind: "special", year: 2026, title: "WM-Tippspiel mit JBL", description: "JBL Tune 520BT, JBL Go 4 und JBL Clip 5: drei Gewinnchancen beim WM-Tippspiel.", sourceURL: "https://www.instagram.com/trinkgutjammers_goch/p/DZc5M8LMmNG/", verifiedEndsDate: "2026-06-25", verifiedAt: "2026-09-30" },
];
