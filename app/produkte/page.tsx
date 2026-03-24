"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import SearchBar from "@/components/SearchBar";
import { categories, type Product } from "@/lib/utils";
import productsData from "@/data/products.json";

const products = productsData as Product[];

function ProdukteContent() {
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchFromUrl);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (searchFromUrl) {
      setSearch(searchFromUrl);
    }
  }, [searchFromUrl]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || p.categorySlug === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-6">Alle Produkte</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="sm:w-80">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? "bg-primary text-white"
                : "bg-light text-muted hover:bg-border"
            }`}
          >
            Alle
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() =>
                setActiveCategory(activeCategory === cat.slug ? null : cat.slug)
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.slug
                  ? "bg-primary text-white"
                  : "bg-light text-muted hover:bg-border"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted mb-4">{filtered.length} Produkte</p>

      <ProductGrid products={filtered} />
    </div>
  );
}

export default function ProduktePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-secondary mb-6">Alle Produkte</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-light rounded-lg w-80" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-light rounded-2xl" />)}
          </div>
        </div>
      </div>
    }>
      <ProdukteContent />
    </Suspense>
  );
}
