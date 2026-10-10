import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bewerbung — Werde Teil unseres Teams ",
  description: "Verkauf Vollzeit oder Teilzeit bis zu 150 Stunden/Monat bei Trinkgut Jammers in Goch. Bewerbung und Kontakt zum Markt.",
  robots: { index: false, follow: false, nocache: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
