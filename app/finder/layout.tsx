import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Getränke-Finder — Finde dein perfektes Getränk ",
  description: " Trinkgut Jammers|Persönliche Empfehlungen aus über 100 Getränken — vom Aperitif bis zum Whisky-Klassiker.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
