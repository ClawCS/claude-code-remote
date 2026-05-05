import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Öko-Tracker — Nachhaltige Verpackungen ",
  description: " Trinkgut Jammers|Tracking nachhaltiger Verpackungen und Mehrweg-Systeme bei Trinkgut Jammers Goch.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
