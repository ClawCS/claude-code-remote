import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WM 2026 Tippspiel — Tippkick ",
  description: " Trinkgut Jammers|Tippe auf die WM 2026 Spiele bei Trinkgut Jammers — gewinne attraktive Preise mit deinem Fußballwissen.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
