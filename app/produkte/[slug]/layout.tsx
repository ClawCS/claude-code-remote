import type { Metadata } from "next";

import JsonLdScript from "@/components/JsonLdScript";
import productsData from "@/data/products.json";

type Product = {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  image?: string;
  inStock?: boolean;
};

const products = productsData as Product[];
const BASE = "https://trinkgut-jammers.de";

// Nur existierende Produkt-Slugs sind gültig → alles andere liefert echtes 404
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) {
    return {
      title: "Produkt nicht gefunden",
      description: "Dieses Produkt ist aktuell nicht verfügbar.",
    };
  }
  return {
    title: { absolute: `${product.name} – Trinkgut Jammers Goch` },
    description: product.description || `${product.name} – ${product.category || "Getränk"} bei Trinkgut Jammers Goch.`,
    alternates: { canonical: `/produkte/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} bei Trinkgut Jammers Goch.`,
      images: product.image ? [{ url: `${BASE}${product.image}` }] : undefined,
      type: "website",
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || `${product.name} bei Trinkgut Jammers Goch.`,
        image: product.image ? `${BASE}${product.image}` : undefined,
        category: product.category,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "EUR",
          availability: product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          url: `${BASE}/produkte/${product.slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && <JsonLdScript value={jsonLd} />}
      {children}
    </>
  );
}
