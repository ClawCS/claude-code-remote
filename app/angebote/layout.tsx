import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wochenangebote — KW-Aktionen",
  description: "Die aktuellen deutschen und niederländischen Originalhandzettel von Trinkgut Jammers: vollständige Wochenangebote mit Preisen, Pfand und Aktionsbedingungen.",
  alternates: { canonical: "/angebote" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
