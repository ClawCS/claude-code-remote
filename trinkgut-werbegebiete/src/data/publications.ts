export type LatLng = { lat: number; lng: number };

export type City = {
  name: string;
  country: "NL" | "DE";
  lat: number;
  lng: number;
};

export type PublicationType = "weekly" | "daily";

export type Publication = {
  id: string;
  name: string;
  type: PublicationType;
  circulation: number;
  circulationNote?: string;
  rhythm: string;
  publisher: string;
  region: string;
  color: string;
  cities: City[];
};

export const STORE_LOCATION = {
  name: "Trinkgut Jammers Goch",
  address: "Jurgensstraße 20, 47574 Goch",
  lat: 51.677,
  lng: 6.16,
} as const;

export const PUBLICATIONS: Publication[] = [
  {
    id: "rozet",
    name: "De Rozet",
    type: "weekly",
    circulation: 25000,
    rhythm: "14-täglich (Sa)",
    publisher: "Berg en Dal + DE-Grenzdörfer",
    region: "Grenzgebiet Berg en Dal / Kleve, zweisprachig",
    color: "#e07a3c",
    cities: [
      { name: "Groesbeek", country: "NL", lat: 51.778, lng: 5.943 },
      { name: "Berg en Dal", country: "NL", lat: 51.822, lng: 5.927 },
      { name: "Millingen a.d. Rijn", country: "NL", lat: 51.867, lng: 6.037 },
      { name: "Ooij", country: "NL", lat: 51.843, lng: 5.93 },
      { name: "Ubbergen", country: "NL", lat: 51.832, lng: 5.918 },
      { name: "Leuth", country: "NL", lat: 51.843, lng: 5.987 },
      { name: "Kekerdom", country: "NL", lat: 51.852, lng: 6.018 },
      { name: "Nijmegen-Oost", country: "NL", lat: 51.825, lng: 5.878 },
      { name: "Kranenburg", country: "DE", lat: 51.79, lng: 6.008 },
      { name: "Wyler", country: "DE", lat: 51.82, lng: 6.01 },
      { name: "Zyfflich", country: "DE", lat: 51.832, lng: 6.04 },
      { name: "Bimmen", country: "DE", lat: 51.857, lng: 6.067 },
      { name: "Keeken", country: "DE", lat: 51.848, lng: 6.132 },
      { name: "Frasselt", country: "DE", lat: 51.78, lng: 6.02 },
      { name: "Schottheide", country: "DE", lat: 51.775, lng: 5.985 },
    ],
  },
  {
    id: "brug-nijmegen",
    name: "De Brug Nijmegen",
    type: "weekly",
    circulation: 66000,
    rhythm: "Wöchentlich (Fr)",
    publisher: "De Brug",
    region: "Stadt Nijmegen + Wijchen",
    color: "#2c7a7b",
    cities: [
      { name: "Nijmegen", country: "NL", lat: 51.8126, lng: 5.8372 },
      { name: "Lent", country: "NL", lat: 51.852, lng: 5.87 },
      { name: "Wijchen", country: "NL", lat: 51.805, lng: 5.725 },
      { name: "Oosterhout-Gld", country: "NL", lat: 51.868, lng: 5.842 },
    ],
  },
  {
    id: "bossche-omroep",
    name: "Bossche Omroep",
    type: "weekly",
    circulation: 66000,
    rhythm: "Wöchentlich",
    publisher: "Bossche Omroep",
    region: "’s-Hertogenbosch + Umgebung",
    color: "#7c3aed",
    cities: [
      { name: "’s-Hertogenbosch", country: "NL", lat: 51.698, lng: 5.304 },
      { name: "Rosmalen", country: "NL", lat: 51.72, lng: 5.367 },
      { name: "Nuland", country: "NL", lat: 51.728, lng: 5.425 },
      { name: "Vinkel", country: "NL", lat: 51.717, lng: 5.445 },
      { name: "Empel", country: "NL", lat: 51.735, lng: 5.307 },
      { name: "Hintham", country: "NL", lat: 51.712, lng: 5.343 },
    ],
  },
  {
    id: "udens-weekblad",
    name: "Udens Weekblad",
    type: "weekly",
    circulation: 31000,
    rhythm: "Wöchentlich (Mi)",
    publisher: "Udens Weekblad",
    region: "Uden + Umgebung",
    color: "#0ea5e9",
    cities: [
      { name: "Uden", country: "NL", lat: 51.66, lng: 5.616 },
      { name: "Boekel", country: "NL", lat: 51.6, lng: 5.685 },
      { name: "Nistelrode", country: "NL", lat: 51.693, lng: 5.566 },
      { name: "Odiliapeel", country: "NL", lat: 51.671, lng: 5.714 },
      { name: "Venhorst", country: "NL", lat: 51.633, lng: 5.72 },
      { name: "Volkel", country: "NL", lat: 51.663, lng: 5.712 },
      { name: "Zeeland-NB", country: "NL", lat: 51.702, lng: 5.703 },
    ],
  },
  {
    id: "week-van-losser",
    name: "De Week van Losser",
    type: "weekly",
    circulation: 12000,
    rhythm: "Wöchentlich (Mi)",
    publisher: "De Week van Losser",
    region: "Twente, Grenze Gronau/Enschede",
    color: "#ca8a04",
    cities: [
      { name: "Losser", country: "NL", lat: 52.259, lng: 7.008 },
      { name: "Glane", country: "NL", lat: 52.232, lng: 7.038 },
      { name: "Overdinkel", country: "NL", lat: 52.23, lng: 7.067 },
      { name: "De Lutte", country: "NL", lat: 52.32, lng: 6.985 },
      { name: "Lonneker", country: "NL", lat: 52.255, lng: 6.917 },
      { name: "Beuningen-Tw", country: "NL", lat: 52.3, lng: 6.92 },
    ],
  },
  {
    id: "maasduinen-courant",
    name: "Maasduinen Courant",
    type: "weekly",
    circulation: 6000,
    rhythm: "14-täglich",
    publisher: "Maasduinen Courant",
    region: "Gemeente Bergen (Limburg)",
    color: "#16a34a",
    cities: [
      { name: "Nieuw-Bergen", country: "NL", lat: 51.59, lng: 6.052 },
      { name: "Afferden", country: "NL", lat: 51.632, lng: 5.997 },
      { name: "Siebengewald", country: "NL", lat: 51.614, lng: 6.032 },
      { name: "Well", country: "NL", lat: 51.555, lng: 6.088 },
      { name: "Wellerlooi", country: "NL", lat: 51.525, lng: 6.095 },
      { name: "Aijen", country: "NL", lat: 51.6, lng: 6.075 },
    ],
  },
  {
    id: "maasdriehoek",
    name: "De Maasdriehoek",
    type: "weekly",
    circulation: 51000,
    circulationNote: "47.500–54.500",
    rhythm: "Wöchentlich",
    publisher: "De Maasdriehoek",
    region: "Land van Cuijk + Kop Limburg (Boxmeer/Cuijk/Gennep)",
    color: "#db2777",
    cities: [
      { name: "Boxmeer", country: "NL", lat: 51.646, lng: 5.948 },
      { name: "Cuijk", country: "NL", lat: 51.725, lng: 5.878 },
      { name: "Gennep", country: "NL", lat: 51.697, lng: 5.973 },
      { name: "Mill", country: "NL", lat: 51.683, lng: 5.783 },
      { name: "Grave", country: "NL", lat: 51.757, lng: 5.74 },
      { name: "Sint Anthonis", country: "NL", lat: 51.613, lng: 5.88 },
      { name: "Ottersum", country: "NL", lat: 51.72, lng: 5.998 },
      { name: "Milsbeek", country: "NL", lat: 51.733, lng: 5.998 },
      { name: "Heijen", country: "NL", lat: 51.677, lng: 5.987 },
      { name: "Mook", country: "NL", lat: 51.773, lng: 5.89 },
      { name: "Molenhoek", country: "NL", lat: 51.782, lng: 5.89 },
      { name: "Vierlingsbeek", country: "NL", lat: 51.597, lng: 5.998 },
      { name: "Overloon", country: "NL", lat: 51.568, lng: 5.94 },
    ],
  },
  {
    id: "de-limburger",
    name: "De Limburger (Ed. Noord-Limburg)",
    type: "daily",
    circulation: 148000,
    circulationNote: "Gesamtauflage Mediahuis",
    rhythm: "Mo–Sa",
    publisher: "Mediahuis",
    region: "Noord-Limburg (Venlo/Venray/Horst)",
    color: "#1e3a8a",
    cities: [
      { name: "Venlo", country: "NL", lat: 51.37, lng: 6.172 },
      { name: "Venray", country: "NL", lat: 51.527, lng: 5.975 },
      { name: "Horst", country: "NL", lat: 51.452, lng: 6.05 },
      { name: "Panningen", country: "NL", lat: 51.347, lng: 5.99 },
      { name: "Deurne", country: "NL", lat: 51.467, lng: 5.795 },
      { name: "Beesel", country: "NL", lat: 51.27, lng: 6.042 },
      { name: "Gennep-L", country: "NL", lat: 51.697, lng: 5.973 },
      { name: "Nieuw-Bergen-L", country: "NL", lat: 51.59, lng: 6.052 },
    ],
  },
  {
    id: "de-gelderlander",
    name: "De Gelderlander",
    type: "daily",
    circulation: 121000,
    circulationNote: "+500k Print+Online",
    rhythm: "Mo–Sa",
    publisher: "DPG Media",
    region: "Nijmegen / Land van Cuijk / Arnhem",
    color: "#b91c1c",
    cities: [
      { name: "Nijmegen-Gld", country: "NL", lat: 51.8126, lng: 5.8372 },
      { name: "Arnhem", country: "NL", lat: 51.983, lng: 5.913 },
      { name: "Beuningen-Gld", country: "NL", lat: 51.863, lng: 5.77 },
      { name: "Wijchen-Gld", country: "NL", lat: 51.805, lng: 5.725 },
      { name: "Tiel", country: "NL", lat: 51.888, lng: 5.432 },
      { name: "Cuijk-Lvc", country: "NL", lat: 51.725, lng: 5.878 },
      { name: "Doetinchem", country: "NL", lat: 51.967, lng: 6.283 },
    ],
  },
];

export const WEEKLY_PUBLICATIONS = PUBLICATIONS.filter(
  (p) => p.type === "weekly",
);
export const DAILY_PUBLICATIONS = PUBLICATIONS.filter(
  (p) => p.type === "daily",
);

export function getPublicationById(id: string): Publication | undefined {
  return PUBLICATIONS.find((p) => p.id === id);
}
