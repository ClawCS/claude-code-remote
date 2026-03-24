export type GalleryItem = {
  id: number;
  title: string;
  description: string;
  category: "team" | "markt" | "neuheiten" | "aktionen" | "gewinnspiel" | "angebote";
  image: string;
  date?: string;
};

const img = (n: number) => `/images/gallery/ig-${String(n).padStart(2, "0")}.jpg`;

export const galleryItems: GalleryItem[] = [
  // ═══ TEAM (aus TEAM-Highlight + Posts) ═══
  // Team-Fotos: Reihenfolge aus dem Instagram TEAM-Highlight (Stories)
  // Die echten Einzelportraits sind im Instagram TEAM-Highlight zu sehen
  { id: 1, title: "Team Jammers — Gruppenfoto", description: "Das sind wir: Team Jammers! 10 Mitarbeiter mit Leidenschaft fuer Getraenke.", category: "team", image: img(7) },
  { id: 2, title: "Sven & Niko — Geschaeftsfuehrer", description: "Die beiden Geschaeftsfuehrer von Trinkgut Jammers Goch.", category: "team", image: img(8) },
  { id: 3, title: "Nikolaos Jammers — Inhaber", description: "Niko, der Inhaber. Bekannt aus Funk & Fernsehen #VSS.", category: "team", image: img(9) },
  { id: 4, title: "Sven — Geschaeftsfuehrer", description: "Waere als Getraenk definitiv ein POWERade!", category: "team", image: img(10) },
  { id: 5, title: "Justin", description: "Zieht einmal im Jahr um. Immer da wenn man ihn braucht.", category: "team", image: img(1) },
  { id: 6, title: "Jasmin — Spirituosen & Wein", description: "Unsere Spirituosen- und Weinschubserin.", category: "team", image: img(2) },
  { id: 7, title: "Tim — Stimmungskanone", description: "Fuer gute Laune im Markt zustaendig.", category: "team", image: img(3) },
  { id: 8, title: "Gabriella — Verkauf", description: "Unsere Verkaufsallrounderin. Kann alles, weiss alles.", category: "team", image: img(4) },
  { id: 9, title: "Jan Niklas — Lager", description: "Der fleissigste Ameisenfahrer im Team.", category: "team", image: img(5) },
  { id: 10, title: "Hanna — Marketing", description: "Die Marketing Tante hinter unserem Instagram-Auftritt.", category: "team", image: img(6) },
  { id: 11, title: "Nico — Azubi", description: "Unser fleissigster Rekrut. Die Zukunft von Trinkgut Jammers.", category: "team", image: img(11) },

  // ═══ MARKT ═══
  { id: 31, title: "Deine Party. Unser Service.", description: "Über 7.000 Getränke, diverse Leihartikel, Beratung & Planung deiner Feier.", category: "markt", image: img(0) },
  { id: 12, title: "Malibu Rum Aktion", description: "Malibu Rum im Sortiment — perfekt für Sommer-Cocktails.", category: "markt", image: img(2) },
  { id: 13, title: "Stauder Privatbrauerei", description: "Stauder Bier frisch aus dem Ruhrgebiet bei uns im Sortiment.", category: "markt", image: img(5) },
  { id: 14, title: "WhatsApp Kanal", description: "Schreib uns ne WhatsApp! Fragen zum Sortiment, Verfügbarkeiten checken, Bestellungen aufgeben.", category: "markt", image: img(1) },
  { id: 15, title: "Bonuskarte — 6. Kiste GRATIS", description: "5 Kisten kaufen, die 6. gibt es GRATIS! Sammelspaß der sich lohnt.", category: "markt", image: img(3) },
  { id: 16, title: "BVB x Bolten Alt", description: "Borussia Dortmund meets Privatbrauerei Bolten — Niederrhein-Klassiker.", category: "markt", image: img(10) },
  { id: 17, title: "Warsteiner im Sortiment", description: "Warsteiner Premium Pilsener — das einzig Wahre.", category: "markt", image: img(15) },
  { id: 18, title: "Guinness bei Trinkgut", description: "Guinness Draught — der irische Klassiker frisch vom Fass.", category: "markt", image: img(61) },
  { id: 19, title: "Diageo Premium Spirits", description: "Premium-Spirituosen von Diageo — Johnnie Walker, Tanqueray und mehr.", category: "markt", image: img(59) },
  { id: 20, title: "Oktoberfest bei uns!", description: "O'zapft is! Die Wiesn-Saison bei Trinkgut Jammers mit bayerischen Spezialitäten.", category: "markt", image: img(63) },
  { id: 21, title: "Erdinger Weißbier", description: "Erdinger Weißbier — das Original aus Bayern, frisch bei uns.", category: "markt", image: img(53) },
  { id: 22, title: "JBL Audio Aktion", description: "JBL Lautsprecher und Kopfhörer — bei uns im Sortiment.", category: "markt", image: img(57) },
  { id: 23, title: "Teisseire Sirupe", description: "Teisseire Premium Sirupe aus Frankreich — perfekt für Cocktails und Limonaden.", category: "markt", image: img(67) },

  // ═══ NEUHEITEN ═══
  { id: 24, title: "Hype-Drinks aus Asien", description: "Japanische, koreanische und taiwanesische Getränke. Niko präsentiert das neue Regal.", category: "neuheiten", image: img(9), date: "2025" },
  { id: 25, title: "JBL Audio NEU", description: "JBL Lautsprecher, Kopfhörer und mehr — ab sofort bei uns.", category: "neuheiten", image: img(57), date: "2025" },
  { id: 26, title: "Heinrich Gils — Wein des Monats", description: "Premium Cabernet Sauvignon von Heinrich Gils. Exklusiv bei Trinkgut Jammers.", category: "neuheiten", image: img(52), date: "Dez. 2025" },
  { id: 27, title: "MBG Brands zu Besuch", description: "MBG Brands war bei uns zu Besuch mit einer Überraschung!", category: "neuheiten", image: img(67) },
  { id: 28, title: "Wein & Sekt Knüller", description: "Neue Wein- und Sekt-Angebote diese Woche.", category: "neuheiten", image: img(58), date: "2025" },

  // ═══ AKTIONEN ═══
  { id: 29, title: "St. Patrick's Day Special", description: "Feier den St. Patrick's Day mit irischem Whisky bei Trinkgut Jammers!", category: "aktionen", image: img(2), date: "Mär. 2026" },
  { id: 30, title: "Valentinstag — Happy Valentine's Day", description: "Sekt-Angebote für Verliebte — Happy Valentine's Day!", category: "aktionen", image: img(52), date: "Feb. 2026" },
  { id: 31, title: "Rosenmontag — HELAU!", description: "An Rosenmontag von 8:00 bis 14:00 für euch geöffnet!", category: "aktionen", image: img(1), date: "Feb. 2026" },
  { id: 32, title: "Karnevals-Angebote für Follower", description: "Exklusive Karnevals-Angebote nur für unsere Instagram-Follower!", category: "aktionen", image: img(0), date: "Feb. 2026" },
  { id: 33, title: "Black Week Deals", description: "Black Week bei Trinkgut Jammers — 5% Rabatt auf ausgewählte Artikel!", category: "aktionen", image: img(55), date: "Nov. 2025" },
  { id: 34, title: "Weihnachts-Öffnungszeiten", description: "Feiertags-Öffnungszeiten und Feuerwerksverkauf / Vuurwerkverkoop.", category: "aktionen", image: img(52), date: "Dez. 2025" },
  { id: 35, title: "Oktoberfest-Aktion", description: "O'zapft is — Wiesn-Feeling bei Trinkgut Jammers in Goch.", category: "aktionen", image: img(63), date: "Sep. 2025" },
  { id: 36, title: "Salitos 5€ Rabatt für Follower", description: "Exklusiv nur für unsere Instagram-Follower: 5€ Rabatt auf Salitos!", category: "aktionen", image: img(11), date: "2025" },
  { id: 37, title: "Likör-Verkostung HBB Bovenkerk", description: "HBB Liköre aus Bovenkerk — kostenlose Verkostung im Markt.", category: "aktionen", image: img(12), date: "2025" },

  // ═══ ANGEBOTE (Knüller der Woche etc.) ═══
  { id: 38, title: "Knüller der Woche", description: "Wöchentliche Top-Angebote bei Trinkgut Jammers — immer reinschauen lohnt sich!", category: "angebote", image: img(54) },
  { id: 39, title: "Knüller der Woche", description: "Diese Woche besonders günstig — schau vorbei!", category: "angebote", image: img(56) },
  { id: 40, title: "Knüller der Woche", description: "Top-Angebote diese Woche bei Trinkgut Jammers.", category: "angebote", image: img(60) },
  { id: 41, title: "Spirituosen Knüller", description: "Spirituosen zum Knüller-Preis diese Woche!", category: "angebote", image: img(64) },
  { id: 42, title: "Knüller der Woche", description: "Wöchentlich neue Angebote — jetzt zugreifen!", category: "angebote", image: img(62) },
  { id: 43, title: "Knüller der Woche", description: "Diese Woche bei Trinkgut Jammers im Angebot.", category: "angebote", image: img(66) },
  { id: 44, title: "Jim Beam Coupon — 2€ sparen", description: "Jim Beam Black 7 Years Bourbon für 13,99€ mit Instagram-Coupon.", category: "angebote", image: img(59) },
  { id: 45, title: "Erdinger App-Preis", description: "Erdinger Weißbier zum App-Preis — 13,99€.", category: "angebote", image: img(53) },

  // ═══ GEWINNSPIELE — nach Datum sortiert (neueste zuerst) ═══
  { id: 50, title: "Gewinnspiel — Monster Energy Cooler", description: "Gewinne einen exklusiven Monster Energy Kühlschrank! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(4), date: "Mär. 2026" },
  { id: 51, title: "Gewinnspiel — Weber Grill 600€", description: "Weber Spirit E-325S Gasgrill zu gewinnen! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(3), date: "Feb. 2026" },
  { id: 52, title: "Gewinnspiel — Salitos Sommer", description: "Salitos Überraschungspaket mit Beachzubehör! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(11), date: "Jan. 2026" },
  { id: 53, title: "Gewinnspiel — BVB Champions League VIP", description: "2x VIP-Tickets BVB vs. Bodø/Glimt (1.230€)! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(52), date: "Dez. 2025" },
  { id: 54, title: "Gewinnspiel — Monster BMX + 24 Dosen", description: "BMX-Rad im Wert von 300€ + 24 Monster Energy Dosen GRATIS! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(52), date: "Nov. 2025" },
  { id: 55, title: "Gewinnspiel — BVB vs. Hoffenheim Tickets", description: "2x Bundesliga-Tickets BVB vs. TSG Hoffenheim! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(55), date: "Okt. 2025" },
  { id: 56, title: "Gewinnspiel — Dartscheibe", description: "Gewinne eine hochwertige Dartscheibe! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(67), date: "Sep. 2025" },
  { id: 57, title: "Gewinnspiel — Warsteiner Fanshop 50€", description: "50€ Gutschein für den Warsteiner Fanshop! Gewinnspiel / Winactie / Giveaway", category: "gewinnspiel", image: img(67), date: "Aug. 2025" },
  { id: 58, title: "Gewinnspiel — Salitos Beachpaket", description: "Sommer, Sonne, Salitos! Komplettes Beachpaket! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(11), date: "Jul. 2025" },
  { id: 59, title: "Gewinnspiel — Grillpaket 150€", description: "Premium-Grillpaket mit Getränken im Wert von 150€! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(9), date: "Jun. 2025" },
  { id: 60, title: "Gewinnspiel — Vatertag Whisky-Set", description: "Jack Daniel's + Nosing-Gläser! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(59), date: "Mai 2025" },
  { id: 61, title: "Gewinnspiel — Oster-Gutschein 100€", description: "100€ Einkaufsgutschein + Osterkorb! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(7), date: "Apr. 2025" },
  { id: 62, title: "Gewinnspiel — Frauentag Prosecco", description: "Prosecco-Paket + Blumenstrauß! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(58), date: "Mär. 2025" },
  { id: 63, title: "Gewinnspiel — Karneval Partypaket", description: "Karnevals-Partypaket im Wert von 100€! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(0), date: "Feb. 2025" },
  { id: 64, title: "Gewinnspiel — Neujahr Detox-Paket", description: "Säfte, Wasser, Smoothies im Wert von 75€! Gewinnspiel / Winactie", category: "gewinnspiel", image: img(15), date: "Jan. 2025" },
];

export const galleryCategories = [
  { value: "alle" as const, label: "Alle", icon: "📸" },
  { value: "team" as const, label: "Mitarbeiter", icon: "👥" },
  { value: "markt" as const, label: "Markt", icon: "🏪" },
  { value: "neuheiten" as const, label: "Neuheiten", icon: "✨" },
  { value: "aktionen" as const, label: "Aktionen", icon: "🎉" },
  { value: "angebote" as const, label: "Angebote", icon: "🏷️" },
  { value: "gewinnspiel" as const, label: "Gewinnspiele", icon: "🏆" },
];
