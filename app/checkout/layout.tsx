import type { Metadata } from "next";
import ShoppingLayout from "@/components/ShoppingLayout";

export const metadata: Metadata = {
  title: "Reservierung unverbindlich anfragen",
  description: "Stelle eine unverbindliche Anfrage an Trinkgut Jammers zusammen.",
  robots: {index: false, follow: true},
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShoppingLayout>{children}</ShoppingLayout>;
}
