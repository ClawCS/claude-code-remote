import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wochenangebote — KW-Aktionen ",
  description: " Trinkgut Jammers|Aktuelle Wochenangebote aus den Trinkgut Jammers Handzetteln. Bier, Wein, Spirituosen und mehr — günstige Preise jede Woche neu.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
