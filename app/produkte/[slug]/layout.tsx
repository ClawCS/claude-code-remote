import type {Metadata} from "next";
import {notFound} from "next/navigation";
import products from "@/data/products.json";
export async function generateMetadata():Promise<Metadata> { return {title:"Aktuelle Handzettelangebote",description:"Die früheren Sortimentsbeispiele wurden durch aktuelle Handzettelangebote ersetzt.",robots:{index:false,follow:true}}; }
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{slug:string}>}) {
  const {slug}=await params;
  if(!products.some(product=>product.slug===slug))notFound();
  return children;
}
