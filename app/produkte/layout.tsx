import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sortiment & aktuelle Wochenangebote",
  description: "Unsere Warengruppen und ausgewählte Angebote aus den gültigen deutschen und niederländischen Handzetteln. Das vollständige Sortiment findest du im Markt.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
