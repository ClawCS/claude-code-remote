import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glücksrad — Drehe und gewinne ",
  description: " Trinkgut Jammers|Drehe das Glücksrad bei Trinkgut Jammers und gewinne Rabatte und Aktionen — viel Spaß!",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
