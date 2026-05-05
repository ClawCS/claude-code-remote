import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community — Stempelkarte & Belohnungen ",
  description: " Trinkgut Jammers|Sammle Stempel und sichere dir Vorteile bei Trinkgut Jammers Goch — Treue zahlt sich aus.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
