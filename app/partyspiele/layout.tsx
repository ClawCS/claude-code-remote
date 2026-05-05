import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Party-Spiele — 8 digitale Trinkspiele ",
  description: " Trinkgut Jammers|Trink-Roulette, Bier-Pong, Kings Cup, Wahrheit oder Pflicht — 8 digitale Party-Spiele für deine nächste Feier.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
