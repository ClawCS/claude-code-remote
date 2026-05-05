import type { Metadata } from "next";
import productsData from "@/data/products.json";

type Product = { slug: string; name: string; description?: string; category?: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const products = productsData as Product[];
  const product = products.find((p) => p.slug === slug);
  if (!product) {
    return {
      title: "Produkt nicht gefunden",
      description: "Dieses Produkt ist aktuell nicht verfügbar.",
    };
  }
  return {
    title: `${product.name} | Trinkgut Jammers`,
    description: product.description || `${product.name} – ${product.category || "Getränk"} bei Trinkgut Jammers Goch.`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
