"use client";

import { useState } from "react";
import Image from "next/image";
import { cocktails, cocktailCategories, type Cocktail } from "@/data/cocktails";
import { cocktailImages } from "@/data/cocktail-images";
import ShimmerParticles from "@/components/ShimmerParticles";

export default function CocktailsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null);

  const filtered = activeCategory
    ? cocktails.filter((c) => c.category === activeCategory)
    : cocktails;

  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <ShimmerParticles />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Cocktail-Rezepte</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Cocktail-Rezepte</h1>
        <p className="text-white/80 max-w-lg mx-auto text-lg">
          {cocktails.length} Rezepte in {cocktailCategories.length} Kategorien — von Klassikern bis Trend-Drinks.
          Mit Zutaten aus deinem trinkgut Jammers Markt!
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !activeCategory ? "bg-primary text-white" : "bg-light text-muted hover:bg-border"
          }`}
        >
          Alle ({cocktails.length})
        </button>
        {cocktailCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat ? "bg-primary text-white" : "bg-light text-muted hover:bg-border"
            }`}
          >
            {cat} ({cocktails.filter(c => c.category === cat).length})
          </button>
        ))}
      </div>

      {/* Cocktail Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {filtered.map((cocktail) => {
          const imgUrl = cocktailImages[cocktail.name];
          return (
            <button
              key={cocktail.name}
              onClick={() => setSelectedCocktail(cocktail)}
              className="group bg-white border border-border/60 rounded-2xl overflow-hidden text-left card-hover-glow"
            >
              {/* Image */}
              <div className="aspect-[4/3] relative bg-gradient-to-br from-light to-gray-100 overflow-hidden">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={cocktail.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">{cocktail.image}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-bold text-white text-lg drop-shadow-lg">{cocktail.name}</h3>
                </div>
                <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm ${
                  cocktail.difficulty === "Einfach" ? "bg-green-500/80 text-white" :
                  cocktail.difficulty === "Mittel" ? "bg-amber-500/80 text-white" :
                  "bg-red-500/80 text-white"
                }`}>{cocktail.difficulty}</span>
              </div>
              {/* Info */}
              <div className="p-4">
                <p className="text-xs text-muted">{cocktail.category} · {cocktail.ingredients.length} Zutaten</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedCocktail && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setSelectedCocktail(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-white rounded-2xl z-50 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Modal Image */}
            {cocktailImages[selectedCocktail.name] && (
              <div className="relative h-48 rounded-t-2xl overflow-hidden">
                <Image
                  src={cocktailImages[selectedCocktail.name]}
                  alt={selectedCocktail.name}
                  fill
                  sizes="500px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedCocktail.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded">{selectedCocktail.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      selectedCocktail.difficulty === "Einfach" ? "bg-green-500/80 text-white" :
                      selectedCocktail.difficulty === "Mittel" ? "bg-amber-500/80 text-white" :
                      "bg-red-500/80 text-white"
                    }`}>{selectedCocktail.difficulty}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Header without image */}
              {!cocktailImages[selectedCocktail.name] && (
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-4xl">{selectedCocktail.image}</span>
                    <h2 className="text-2xl font-bold text-secondary mt-2">{selectedCocktail.name}</h2>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-light text-muted px-2 py-0.5 rounded">{selectedCocktail.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        selectedCocktail.difficulty === "Einfach" ? "bg-green-100 text-green-700" :
                        selectedCocktail.difficulty === "Mittel" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{selectedCocktail.difficulty}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Close button */}
              <button onClick={() => setSelectedCocktail(null)} className="absolute top-4 right-4 p-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-5">
                <h3 className="font-semibold text-secondary mb-2">Zutaten</h3>
                <ul className="space-y-1.5">
                  {selectedCocktail.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-5">
                <h3 className="font-semibold text-secondary mb-2">Zubereitung</h3>
                <p className="text-sm text-muted leading-relaxed">{selectedCocktail.instructions}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">💡 <strong>Tipp:</strong> {selectedCocktail.tip}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
