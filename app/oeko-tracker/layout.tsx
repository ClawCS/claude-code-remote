import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/search-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Öko-Tracker — Nachhaltige Verpackungen ",
  description: "Tracking nachhaltiger Verpackungen und Mehrweg-Systeme bei Trinkgut Jammers Goch.",
  path: "/oeko-tracker",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
