import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bier-Weltkarte — Internationale Biersorten ",
  description: " Trinkgut Jammers|Entdecke Biersorten aus aller Welt — Belgien, Tschechien, USA und mehr. Verfügbar bei Trinkgut Jammers Goch.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
