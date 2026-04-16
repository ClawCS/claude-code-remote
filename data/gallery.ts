export type GalleryItem = {
  id: number;
  title: string;
  description: string;
  category: "team";
  image: string;
  date?: string;
};

const teamImg = (name: string) => `/images/gallery/team-${name}.jpg`;

export const galleryItems: GalleryItem[] = [
  // ═══ TEAM (echte Portrait-Fotos) ═══
  { id: 1, title: "Team Jammers — Gruppenfoto", description: "Das sind wir: Team Jammers! 10 Mitarbeiter mit Leidenschaft fuer Getraenke.", category: "team", image: teamImg("gruppenfoto") },
  { id: 2, title: "Sven & Niko — Geschaeftsfuehrer", description: "Die beiden Geschaeftsfuehrer von Trinkgut Jammers Goch.", category: "team", image: teamImg("sven-niko") },
  { id: 3, title: "Niko — Inhaber", description: "Niko, der Inhaber. Bekannt aus Funk & Fernsehen #VSS.", category: "team", image: teamImg("niko") },
  { id: 4, title: "Sven — Geschaeftsfuehrer", description: "Waere als Getraenk definitiv ein POWERade!", category: "team", image: teamImg("sven") },
  { id: 6, title: "Jasmin — Spirituosen & Wein", description: "Unsere Spirituosen- und Weinschubserin.", category: "team", image: teamImg("jasmin") },
  { id: 8, title: "Gabriella — Verkauf", description: "Unsere Verkaufsallrounderin. Kann alles, weiss alles.", category: "team", image: teamImg("gabriella") },
  { id: 9, title: "Jan Niklas — Lager", description: "Der fleissigste Ameisenfahrer im Team.", category: "team", image: teamImg("jan-niklas") },
  { id: 10, title: "Hanna — Marketing", description: "Die Marketing Tante hinter unserem Instagram-Auftritt.", category: "team", image: teamImg("hanna") },
  { id: 11, title: "Nico — Aushilfe", description: "Unser fleissigster Rekrut. Die Zukunft von Trinkgut Jammers.", category: "team", image: teamImg("nico") },
  { id: 12, title: "Nils — Verkauf", description: "Teil des Teams bei Trinkgut Jammers.", category: "team", image: teamImg("nils") },
  { id: 13, title: "Henri — Mitarbeiter", description: "Teil des Teams bei Trinkgut Jammers.", category: "team", image: teamImg("henri") },
  { id: 14, title: "Tim — Stimmungskanone", description: "Unsere Stimmungskanone im Team.", category: "team", image: teamImg("tim") },
  { id: 15, title: "Hannah — Aushilfe", description: "Wenn's bei uns mal brennt, loescht Hannah das Feuer.", category: "team", image: teamImg("hannah") },
];

export const galleryCategories = [
  { value: "alle" as const, label: "Alle", icon: "📸" },
  { value: "team" as const, label: "Mitarbeiter", icon: "👥" },
];
