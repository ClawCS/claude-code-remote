import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community — Einblicke aus dem Markt",
  description: "Team, Aktionen und Neuigkeiten von Trinkgut Jammers in Goch auf unserem Instagram-Kanal.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
