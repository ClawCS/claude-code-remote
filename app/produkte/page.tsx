import AcademyEntry from "@/components/AcademyEntry";
import ProductCatalogue from "@/components/ProductCatalogue";
import { getFlyerIndex } from "@/lib/flyer-index";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
export const dynamic="force-dynamic";
export default async function ProduktePage() {
  return <ProductCatalogue index={await getFlyerIndex(resolveHomepageNow())}><AcademyEntry/></ProductCatalogue>;
}
