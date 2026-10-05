import catalogue from "@/data/cocktail-photo-candidates.json";

export type CocktailPhoto = (typeof catalogue.photos)[number];

// Only individually reviewed, locally served photographs enter public pages.
const approvedPhotos = new Map(catalogue.photos
  .filter((photo) => photo.status === "approved")
  .map((photo) => [photo.name, photo]));

export function getCocktailPhoto(name: string): CocktailPhoto | undefined {
  return approvedPhotos.get(name);
}
