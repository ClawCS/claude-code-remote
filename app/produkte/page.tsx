"use client";
import Link from "next/link";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductGrid from "@/components/ProductGrid";
import SearchBar from "@/components/SearchBar";
import { categories } from "@/lib/utils";
import { assortmentProducts as products } from "@/lib/catalog";

type Origin = "alle" | "DE" | "NL";

function ProdukteContent() {
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchFromUrl);
  const [origin, setOrigin] = useState<Origin>("alle");

  useEffect(() => {
    if (searchFromUrl) {
      setSearch(searchFromUrl);
    }
  }, [searchFromUrl]);

  const deProducts = useMemo(() => products.filter(p => p.origin === "DE"), []);
  const nlProducts = useMemo(() => products.filter(p => p.origin === "NL"), []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesOrigin = origin === "alle" || p.origin === origin;
      return matchesSearch && matchesOrigin;
    });
  }, [search, origin]);

  return (
    <>
    <div className="page-hero-banner py-16 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> <span className="text-white">Sortiment</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Alle Produkte</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          Entdecke unsere Warengruppen und eine Auswahl aus dem Markt. Preise und Verfügbarkeit bestätigen wir persönlich.
        </p>
        <Link
          href="/angebote"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:border-white/50 hover:bg-white/10"
        >
          Datierte Wochenangebote im Handzettel
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* DE / NL Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { key: "alle" as Origin, label: "Alle Artikel", icon: "🛒", count: products.length },
          { key: "DE" as Origin, label: "Deutschland", icon: "🇩🇪", count: deProducts.length },
          { key: "NL" as Origin, label: "Nederland", icon: "🇳🇱", count: nlProducts.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setOrigin(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              origin === tab.key
                ? "bg-[#DC2626] text-white shadow-lg shadow-red-500/20"
                : "bg-white border border-[#F0D5CF] text-[#1F2937] hover:border-[#DC2626]/40"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              origin === tab.key ? "bg-black/10" : "bg-[#F0D5CF]/60"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="sm:w-80">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/produkte" className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-white" aria-current="page">
            Alle
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/kategorie/${cat.slug}`}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-light text-muted hover:bg-border"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted mb-4">{filtered.length} Produkte</p>

      <ProductGrid products={filtered} headingLevel={2} />
    </div>
    </>
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
