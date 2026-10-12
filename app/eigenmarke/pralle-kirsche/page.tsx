import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";
import PralleKirscheDetail from "@/components/eigenmarken/PralleKirscheDetail";

export const metadata: Metadata = buildPageMetadata({
  title: "Pralle Kirsche — Kirsch-Mandel-Likör",
  description: "Pralle Kirsche von Trinkgut Jammers: Kirsch-Mandel-Likör mit 15% Vol. und 700 ml Flascheninhalt. Produktinformationen und Kontakt zum Markt.",
  path: "/eigenmarke/pralle-kirsche",
  image: "/images/eigenmarken-bottles/pralle-kirsche.png",
});

export default function PralleKirschePage() { return <PralleKirscheDetail />; }
