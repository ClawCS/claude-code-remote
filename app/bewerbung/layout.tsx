import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bewerbung — Werde Teil unseres Teams ",
  description: "Interesse am Team von Trinkgut Jammers in Goch? Sprich uns persönlich an oder kontaktiere uns per E-Mail.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
