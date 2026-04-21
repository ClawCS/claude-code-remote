export type PublicationKind = "weekly" | "daily";

export interface City {
  name: string;
  lat: number;
  lng: number;
  /** true = Stadt liegt in Deutschland (Grenznah) */
  de?: boolean;
}

export interface Publication {
  id: string;
  title: string;
  kind: PublicationKind;
  /** Hex-Farbe fuer Layer, Badges, Linien */
  color: string;
  /** Gesamtauflage (Mittelwert falls Range) */
  circulation: number;
  /** Originale Auflage-Angabe als String (kann "47.500-54.500" o.ae. sein) */
  circulationLabel: string;
  /** Erscheinungsrhythmus-Text */
  rhythm: string;
  /** Herausgeber / Region */
  publisher: string;
  /** Kurze Notiz (Sprache, Besonderheit) */
  note?: string;
  cities: City[];
}

export const STORE = {
  name: "Trinkgut Jammers Goch",
  address: "Jurgensstrasse 20, 47574 Goch",
  lat: 51.677,
  lng: 6.16,
} as const;

export const PUBLICATIONS: Publication[] = [
  {
    id: "rozet",
    title: "De Rozet",
    kind: "weekly",
    color: "#d97706",
    circulation: 25000,
    circulationLabel: "25.000",
    rhythm: "14-taeglich (Sa)",
    publisher: "Berg en Dal + DE-Grenzdoerfer",
    note: "Zweisprachig NL/DE, direkt an der Grenze",
    cities: [
      { name: "Groesbeek", lat: 51.778, lng: 5.943 },
      { name: "Berg en Dal", lat: 51.822, lng: 5.927 },
      { name: "Millingen a.d. Rijn", lat: 51.867, lng: 6.037 },
      { name: "Ooij", lat: 51.843, lng: 5.93 },
      { name: "Ubbergen", lat: 51.832, lng: 5.918 },
      { name: "Leuth", lat: 51.843, lng: 5.987 },
      { name: "Kekerdom", lat: 51.852, lng: 6.018 },
      { name: "Nijmegen-Oost", lat: 51.825, lng: 5.878 },
      { name: "Kranenburg", lat: 51.79, lng: 6.008, de: true },
      { name: "Wyler", lat: 51.82, lng: 6.01, de: true },
      { name: "Zyfflich", lat: 51.832, lng: 6.04, de: true },
      { name: "Bimmen", lat: 51.857, lng: 6.067, de: true },
      { name: "Keeken", lat: 51.848, lng: 6.132, de: true },
      { name: "Frasselt", lat: 51.78, lng: 6.02, de: true },
      { name: "Schottheide", lat: 51.775, lng: 5.985, de: true },
    ],
  },
  {
    id: "brug",
    title: "De Brug Nijmegen",
    kind: "weekly",
    color: "#0891b2",
    circulation: 66000,
    circulationLabel: "66.000",
    rhythm: "Woechentlich (Fr)",
    publisher: "Stadt Nijmegen + Wijchen",
    cities: [
      { name: "Nijmegen", lat: 51.8126, lng: 5.8372 },
      { name: "Lent", lat: 51.852, lng: 5.87 },
      { name: "Wijchen", lat: 51.805, lng: 5.725 },
      { name: "Oosterhout-Gld", lat: 51.868, lng: 5.842 },
    ],
  },
  {
    id: "bossche",
    title: "Bossche Omroep",
    kind: "weekly",
    color: "#7c3aed",
    circulation: 66000,
    circulationLabel: "66.000",
    rhythm: "Woechentlich",
    publisher: "'s-Hertogenbosch + Umgebung",
    cities: [
      { name: "'s-Hertogenbosch", lat: 51.698, lng: 5.304 },
      { name: "Rosmalen", lat: 51.72, lng: 5.367 },
      { name: "Nuland", lat: 51.728, lng: 5.425 },
      { name: "Vinkel", lat: 51.717, lng: 5.445 },
      { name: "Empel", lat: 51.735, lng: 5.307 },
      { name: "Hintham", lat: 51.712, lng: 5.343 },
    ],
  },
  {
    id: "udens",
    title: "Udens Weekblad",
    kind: "weekly",
    color: "#16a34a",
    circulation: 31000,
    circulationLabel: "31.000",
    rhythm: "Woechentlich (Mi)",
    publisher: "Uden + Umgebung",
    cities: [
      { name: "Uden", lat: 51.66, lng: 5.616 },
      { name: "Boekel", lat: 51.6, lng: 5.685 },
      { name: "Nistelrode", lat: 51.693, lng: 5.566 },
      { name: "Odiliapeel", lat: 51.671, lng: 5.714 },
      { name: "Venhorst", lat: 51.633, lng: 5.72 },
      { name: "Volkel", lat: 51.663, lng: 5.712 },
      { name: "Zeeland-NB", lat: 51.702, lng: 5.703 },
    ],
  },
  {
    id: "losser",
    title: "De Week van Losser",
    kind: "weekly",
    color: "#db2777",
    circulation: 12000,
    circulationLabel: "12.000",
    rhythm: "Woechentlich (Mi)",
    publisher: "Twente, Grenze Gronau/Enschede",
    note: "Weit weg von Goch (~150 km) - Reichweite pruefen",
    cities: [
      { name: "Losser", lat: 52.259, lng: 7.008 },
      { name: "Glane", lat: 52.232, lng: 7.038 },
      { name: "Overdinkel", lat: 52.23, lng: 7.067 },
      { name: "De Lutte", lat: 52.32, lng: 6.985 },
      { name: "Lonneker", lat: 52.255, lng: 6.917 },
      { name: "Beuningen-Tw", lat: 52.3, lng: 6.92 },
    ],
  },
  {
    id: "maasduinen",
    title: "Maasduinen Courant",
    kind: "weekly",
    color: "#ea580c",
    circulation: 6000,
    circulationLabel: "6.000",
    rhythm: "14-taeglich",
    publisher: "Gemeente Bergen (Limburg)",
    cities: [
      { name: "Nieuw-Bergen", lat: 51.59, lng: 6.052 },
      { name: "Afferden", lat: 51.632, lng: 5.997 },
      { name: "Siebengewald", lat: 51.614, lng: 6.032 },
      { name: "Well", lat: 51.555, lng: 6.088 },
      { name: "Wellerlooi", lat: 51.525, lng: 6.095 },
      { name: "Aijen", lat: 51.6, lng: 6.075 },
    ],
  },
  {
    id: "maasdriehoek",
    title: "De Maasdriehoek",
    kind: "weekly",
    color: "#0284c7",
    circulation: 51000,
    circulationLabel: "47.500-54.500",
    rhythm: "Woechentlich",
    publisher: "Land van Cuijk + Kop Limburg",
    note: "Kern-Einzugsgebiet: Boxmeer/Cuijk/Gennep",
    cities: [
      { name: "Boxmeer", lat: 51.646, lng: 5.948 },
      { name: "Cuijk", lat: 51.725, lng: 5.878 },
      { name: "Gennep", lat: 51.697, lng: 5.973 },
      { name: "Mill", lat: 51.683, lng: 5.783 },
      { name: "Grave", lat: 51.757, lng: 5.74 },
      { name: "Sint Anthonis", lat: 51.613, lng: 5.88 },
      { name: "Ottersum", lat: 51.72, lng: 5.998 },
      { name: "Milsbeek", lat: 51.733, lng: 5.998 },
      { name: "Heijen", lat: 51.677, lng: 5.987 },
      { name: "Mook", lat: 51.773, lng: 5.89 },
      { name: "Molenhoek", lat: 51.782, lng: 5.89 },
      { name: "Vierlingsbeek", lat: 51.597, lng: 5.998 },
      { name: "Overloon", lat: 51.568, lng: 5.94 },
    ],
  },
  {
    id: "delimburger",
    title: "De Limburger (Noord-Limburg)",
    kind: "daily",
    color: "#1e293b",
    circulation: 148000,
    circulationLabel: "~148.000 gesamt",
    rhythm: "Mo-Sa",
    publisher: "Mediahuis",
    cities: [
      { name: "Venlo", lat: 51.37, lng: 6.172 },
      { name: "Venray", lat: 51.527, lng: 5.975 },
      { name: "Horst", lat: 51.452, lng: 6.05 },
      { name: "Panningen", lat: 51.347, lng: 5.99 },
      { name: "Deurne", lat: 51.467, lng: 5.795 },
      { name: "Beesel", lat: 51.27, lng: 6.042 },
      { name: "Gennep-L", lat: 51.697, lng: 5.973 },
      { name: "Nieuw-Bergen-L", lat: 51.59, lng: 6.052 },
    ],
  },
  {
    id: "gelderlander",
    title: "De Gelderlander",
    kind: "daily",
    color: "#991b1b",
    circulation: 121000,
    circulationLabel: "~121.000 + 500k Print+Online",
    rhythm: "Mo-Sa",
    publisher: "DPG Media",
    note: "Edition: Nijmegen/Land van Cuijk",
    cities: [
      { name: "Nijmegen-Gld", lat: 51.8126, lng: 5.8372 },
      { name: "Arnhem", lat: 51.983, lng: 5.913 },
      { name: "Beuningen-Gld", lat: 51.863, lng: 5.77 },
      { name: "Wijchen-Gld", lat: 51.805, lng: 5.725 },
      { name: "Tiel", lat: 51.888, lng: 5.432 },
      { name: "Cuijk-Lvc", lat: 51.725, lng: 5.878 },
      { name: "Doetinchem", lat: 51.967, lng: 6.283 },
    ],
  },
];

export const WEEKLIES = PUBLICATIONS.filter((p) => p.kind === "weekly");
export const DAILIES = PUBLICATIONS.filter((p) => p.kind === "daily");
