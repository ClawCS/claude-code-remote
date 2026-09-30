import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aktionen & Gewinnspiele",
  description: "Originalbeiträge und Teilnahmebedingungen zu Aktionen von Trinkgut Jammers findest du auf unserem Instagram-Kanal.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
