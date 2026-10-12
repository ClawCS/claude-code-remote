import type { Metadata } from "next";
import ShoppingLayout from "@/components/ShoppingLayout";

export const metadata: Metadata = {
  title: "Warenkorb für deine Anfrage",
  description: "Dein Warenkorb bei Trinkgut Jammers Goch.",
  robots: {index: false, follow: true},
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShoppingLayout>{children}</ShoppingLayout>;
}
