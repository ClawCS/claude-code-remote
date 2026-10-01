import type { Metadata } from "next";
import RentalOrderStatus from "@/components/rentals/RentalOrderStatus";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Deine Mietbestellung | Trinkgut Jammers", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string | string[] }> }) {
  const { id } = await params; const { token } = await searchParams;
  return <RentalOrderStatus key={`${id}:${typeof token === "string" ? token : ""}`} id={id} token={typeof token === "string" ? token : ""} />;
}
