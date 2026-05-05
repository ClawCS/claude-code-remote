import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Getränke-Battle — Welches gewinnt? ",
  description: " Trinkgut Jammers|Spiele das Getränke-Duell und entdecke deine Favoriten — bei Trinkgut Jammers in Goch.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
