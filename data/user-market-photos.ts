/** Approved operator-supplied motifs. Private originals and identity records are not served. */
export type EditorialPhoto = Readonly<{ src: string; width: number; height: number; alt: string }>;

function photo(name: string, width: number, alt: string): EditorialPhoto {
  return { src: `/images/editorial/user/${name}.webp`, width, height: 1400, alt };
}

export const USER_MARKET_PHOTOS = {
  bueble: photo("bueble-aufbau", 788, "Büble-Bieraufbau mit gestapelten Getränkekisten im Markt"),
  erdinger: photo("erdinger-aufbau", 788, "Erdinger-Weißbier in einem hohen Kistenaufbau bei Jammers"),
  wineShelf: photo("weinregal", 788, "Blick auf ein Weinregal mit verschiedenen Flaschen im Markt"),
  mixedBeer: photo("biermischgetraenke", 791, "Aufbau mit Desperados, Heineken und Gösser im Getränkemarkt"),
  schneiderWeisse: photo("schneider-weisse", 785, "Schneider-Weisse-Aufbau mit blauen Getränkekisten bei Jammers"),
  spezi: photo("spezi-regal", 788, "Paulaner-Spezi-Flaschen und Getränkekisten im Marktregal"),
  salitosPoster: photo("salitos-plakat", 989, "Vollständiges Jammers-Werbeplakat für Salitos"),
  liefmansPoster: photo("liefmans-plakat", 991, "Vollständiges Jammers-Werbeplakat für Liefmans"),
  gasExchange: photo("gasflaschen-tausch", 989, "Gasflaschen-Tauschwerbung von Jammers mit den Preisen 14,99 Euro und 25,99 Euro"),
} as const;

export const PRIZE_HANDOVER_PHOTOS: readonly EditorialPhoto[] = [
  photo("gewinnuebergabe-01", 1050, "Zwei Personen bei einer Gewinnübergabe mit Urkunde im Markt"),
  photo("gewinnuebergabe-02", 1050, "Drei Personen mit gewonnenen Eintrittskarten im Markt"),
  photo("gewinnuebergabe-03", 1050, "Zwei Personen bei der Übergabe eines Gewinns bei Jammers"),
  photo("gewinnuebergabe-04", 1050, "Zwei Personen mit Gewinnprodukten im Getränkemarkt"),
  photo("gewinnuebergabe-05", 1050, "Zwei Personen bei der Übergabe eines Pizzaofens im Karton"),
];

export const USER_JOB_POSTERS = {
  fulltime: photo("jobs-vollzeit", 986, "Stellenanzeige Verkauf in Vollzeit, m/w/d, Bewerbung an info@trinkgut-jammers.de"),
  parttime: photo("jobs-teilzeit", 987, "Stellenanzeige Verkauf in Teilzeit bis zu 150 Stunden im Monat, m/w/d, Bewerbung an info@trinkgut-jammers.de"),
  apprentice: photo("jobs-ausbildung", 1120, "Ausbildungsanzeige von Trinkgut Jammers, Bewerbung an info@trinkgut-jammers.de"),
} as const;
