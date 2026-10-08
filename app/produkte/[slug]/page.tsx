import {notFound,redirect} from "next/navigation";
import products from "@/data/products.json";
// Retired historical examples are never rendered as current products.
export default async function RetiredProductPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const former=products.find(product=>product.slug===slug);
  if(!former)notFound();
  redirect(`/kategorie/${former.categorySlug}`);
}
