import type { Metadata } from "next";

const description =
  "Persoonlijk advies, feestbenodigdheden en verhuur bij Trinkgut Jammers, Jurgensstraße 20 in Goch. Ma–za 08:00–20:00 uur.";

export const metadata: Metadata = {
  title: {
    absolute: "Informatie voor Nederlandse klanten | Trinkgut Jammers",
  },
  description,
  openGraph: {
    title: "Informatie voor Nederlandse klanten | Trinkgut Jammers",
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
