"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { categories, type Product } from "@/lib/utils";
import productsData from "@/data/products.json";

const products = productsData as Product[];

export default function KategoriePage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);
  const filtered = products.filter((p) => p.categorySlug === slug);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-secondary mb-2">Kategorie nicht gefunden</h1>
        <Link href="/produkte" className="text-primary hover:underline">
          Alle Produkte ansehen
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-sm text-muted mb-6 flex gap-2">
        <Link href="/" className="hover:text-primary">Start</Link>
        <span>/</span>
        <Link href="/produkte" className="hover:text-primary">Produkte</Link>
        <span>/</span>
        <span className="text-secondary">{category.name}</span>
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">{category.icon}</span>
        <h1 className="text-3xl font-bold text-secondary">{category.name}</h1>
        <span className="text-sm text-muted">({filtered.length} Produkte)</span>
      </div>

      <ProductGrid products={filtered} />
    </div>
  );
}
