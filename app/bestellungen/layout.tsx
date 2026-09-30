import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deine Reservierungsanfragen",
  description: "Informationen zu unverbindlichen Anfragen bei Trinkgut Jammers.",
  robots: {index: false, follow: true},
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
