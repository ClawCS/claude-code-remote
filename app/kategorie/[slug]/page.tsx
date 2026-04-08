"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import CategoryBackground from "@/components/CategoryBackground";
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
    <div className="relative min-h-screen">
      {/* Immersiver Hintergrund: Video + Lottie + CSS-Partikel */}
      <CategoryBackground slug={slug} />

      {/* Hero-Section */}
      <div className="relative z-10 pt-16 pb-8 text-center">
        <nav className="text-sm text-white/60 mb-6 flex gap-2 justify-center">
          <Link href="/" className="hover:text-white transition-colors">Start</Link>
          <span>/</span>
          <Link href="/produkte" className="hover:text-white transition-colors">Produkte</Link>
          <span>/</span>
          <span className="text-white">{category.name}</span>
        </nav>

        <div className="animate-fade-in-up">
          <span className="text-6xl block mb-4 drop-shadow-lg">{category.icon}</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-2">
            {category.name}
          </h1>
          <p className="text-white/70 text-lg">{filtered.length} Produkte</p>
        </div>
      </div>

      {/* Produkte mit Glass-Hintergrund fuer Lesbarkeit */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="glass rounded-2xl p-4 sm:p-6 shadow-elevated">
          <ProductGrid products={filtered} />
        </div>
      </div>
    </div>
  );
}
