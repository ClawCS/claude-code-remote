import AcademyEntry from "@/components/AcademyEntry";
import ProductCatalogue from "@/components/ProductCatalogue";
import { getWeeklyOfferContent } from "@/lib/weekly-offer-content";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
export const dynamic="force-dynamic";
export default async function ProduktePage({ searchParams }: { searchParams: Promise<{ search?: string | string[] }> }) {
  const search = (await searchParams).search;
  const initialSearch = (Array.isArray(search) ? search[0] : search) ?? "";
  return <ProductCatalogue initialSearch={initialSearch} content={await getWeeklyOfferContent(resolveHomepageNow())}><AcademyEntry/></ProductCatalogue>;
}
