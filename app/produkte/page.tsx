import AcademyEntry from "@/components/AcademyEntry";
import ProductCatalogue from "@/components/ProductCatalogue";
import { getWeeklyOfferContent } from "@/lib/weekly-offer-content";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
export const dynamic="force-dynamic";
export default async function ProduktePage() {
  return <ProductCatalogue content={await getWeeklyOfferContent(resolveHomepageNow())}><AcademyEntry/></ProductCatalogue>;
}
