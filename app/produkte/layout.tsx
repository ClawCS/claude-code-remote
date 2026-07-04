import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sortiment — Über 100 Produkte",
  description: "Unser Sortiment: Bier, Wein, Spirituosen, Softdrinks und mehr — aus Deutschland und den Niederlanden. Tagesaktuelle Wochenangebote findest du im Handzettel.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
