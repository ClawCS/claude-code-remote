import type { Metadata } from "next";
import RentalAdmin from "@/components/rentals/RentalAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Leihbestellungen · Marktzugang",
  robots: { index: false, follow: false },
};

export default function RentalOrdersAdminPage() {
  return <RentalAdmin />;
}
