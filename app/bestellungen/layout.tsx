import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meine Bestellungen — Bestellverlauf ",
  description: " Trinkgut Jammers|Übersicht deiner Bestellungen bei Trinkgut Jammers Goch.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
