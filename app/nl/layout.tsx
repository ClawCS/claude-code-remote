import type { Metadata } from "next";
import { MARKET } from "@/lib/cinematic/site";

const description =
  `Bekijk de actuele folders van Trinkgut Jammers, ${MARKET.street} in Goch. Persoonlijk advies, feestbenodigdheden en verhuur. Plan je bezoek: ma–za 08:00–20:00 uur.`;

export const metadata: Metadata = {
  title: {
    absolute: "Jouw drankenadres in Goch | Trinkgut Jammers",
  },
  description,
  openGraph: {
    title: "Jouw drankenadres in Goch | Trinkgut Jammers",
    description,
    locale: "nl_NL",
    type: "website",
    siteName: "Trinkgut Jammers",
  },
  alternates: {
    canonical: "/nl",
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
  return <div lang="nl">{children}</div>;
}
