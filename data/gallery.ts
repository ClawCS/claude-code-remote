import type { StaticImageData } from "next/image";
import { EDITORIAL_IMAGES } from "@/data/cinematic-editorial";

export type GalleryItem = Readonly<{
  id: number;
  title: string;
  description: string;
  category: "team";
  image: StaticImageData | null;
  alt: string;
}>;

// Named portraits are separate from the group introduction. Photo counts do
// not establish a current employee count or current employment status.
export const galleryItems: readonly GalleryItem[] = [
  { id: 3, title: "Niko", description: "Inhaber", category: "team", image: EDITORIAL_IMAGES.niko.image, alt: EDITORIAL_IMAGES.niko.alt },
  { id: 4, title: "Sven", description: "Team Jammers", category: "team", image: EDITORIAL_IMAGES.sven.image, alt: EDITORIAL_IMAGES.sven.alt },
  { id: 6, title: "Jasmin", description: "Team Jammers", category: "team", image: EDITORIAL_IMAGES.jasmin.image, alt: EDITORIAL_IMAGES.jasmin.alt },
  { id: 8, title: "Gabriella", description: "Team Jammers", category: "team", image: EDITORIAL_IMAGES.gabriella.image, alt: EDITORIAL_IMAGES.gabriella.alt },
  { id: 9, title: "Jan Niklas", description: "Team Jammers", category: "team", image: EDITORIAL_IMAGES.janNiklas.image, alt: EDITORIAL_IMAGES.janNiklas.alt },
  { id: 10, title: "Hanna", description: "Team Jammers", category: "team", image: EDITORIAL_IMAGES.hanna.image, alt: EDITORIAL_IMAGES.hanna.alt },
  { id: 13, title: "Henri", description: "Team Jammers", category: "team", image: EDITORIAL_IMAGES.henri.image, alt: EDITORIAL_IMAGES.henri.alt },
  { id: 15, title: "Hannah", description: "Team Jammers", category: "team", image: EDITORIAL_IMAGES.hannah.image, alt: EDITORIAL_IMAGES.hannah.alt },
];

export const galleryCategories = [
  { value: "alle" as const, label: "Alle", icon: "📸" },
  { value: "team" as const, label: "Team Jammers", icon: "👥" },
];
