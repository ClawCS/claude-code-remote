import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bewerbung — Werde Teil unseres Teams ",
  description: " Trinkgut Jammers|Offene Stellen bei Trinkgut Jammers in Goch. Bewerbung mit Lebenslauf direkt online — wir freuen uns auf dich.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
