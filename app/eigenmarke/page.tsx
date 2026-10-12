import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";
import BrandWorld from "@/components/eigenmarken/BrandWorld";

export const metadata: Metadata = buildPageMetadata({
  title: "Unsere Eigenmarken — 6 exklusive Liköre",
  description: "Sechs Eigenmarken-Liköre von Trinkgut Jammers in Goch. Von Kirsch-Mandel bis Anis: Sorten und Produktinformationen entdecken.",
  path: "/eigenmarke",
});

export default function EigenmarkePage() { return <BrandWorld />; }
