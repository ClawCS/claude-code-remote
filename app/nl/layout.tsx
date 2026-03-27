import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jammers Getränkemarkt Goch — Bespaar tot 40% op dranken | 3 km van de grens",
  description:
    "Duitse dranken tot 40% goedkoper dan in Nederland! 7.000+ producten: bier, wijn, sterke drank en meer. Slechts 3 km over de grens in Goch. Gratis parkeren, wij spreken Nederlands.",
  keywords: [
    "goedkoop bier Duitsland",
    "dranken kopen Goch",
    "grenswinkel Goch",
    "Duitse dranken grens",
    "bier kopen Duitsland",
    "wijn kopen Duitsland",
    "sterke drank Duitsland",
    "grenshandel Nederland Duitsland",
    "trinkgut Goch",
    "Jammers Goch",
    "drankenmarkt grens",
    "goedkoop whisky Duitsland",
    "Getränkemarkt Goch",
  ],
  openGraph: {
    title: "Jammers Goch — Bespaar tot 40% op dranken over de grens!",
    description:
      "7.000+ producten, Duitse prijzen. Bier, wijn, sterke drank tot 40% goedkoper. Slechts 3 km van de grens. Gratis parkeren!",
    locale: "nl_NL",
    type: "website",
    siteName: "Jammers Getränkemarkt Goch",
  },
  alternates: {
    languages: {
      de: "/",
      nl: "/nl",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function NlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="nl">
      {children}
    </div>
  );
}
