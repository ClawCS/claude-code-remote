import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sortiment — Über 100 Produkte ",
  description: " Trinkgut Jammers|Aktuelle Wochenangebote: Bier, Wein, Spirituosen, Softdrinks und mehr aus deutschen und niederländischen Handzetteln.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
