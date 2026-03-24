"use client";

import { useState } from "react";
import Image from "next/image";
import { galleryItems, galleryCategories } from "@/data/gallery";

type CategoryFilter = "alle" | "team" | "markt" | "neuheiten" | "aktionen" | "gewinnspiel" | "angebote";

export default function GaleriePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("alle");
  const [lightboxItem, setLightboxItem] = useState<typeof galleryItems[0] | null>(null);

  const filtered = activeCategory === "alle"
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10 animate-fade-in-up">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Galerie</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">Bilder aus dem Markt</h1>
        <p className="text-muted max-w-xl mx-auto">
          {galleryItems.length} Bilder aus unserem Markt, unserem Team und unseren Aktionen.
          Folge uns auf{" "}
          <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
            Instagram
          </a>{" "}
          für tägliche Updates!
        </p>
      </div>

      {/* Category Filter — Gewinnspiel highlighted */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {galleryCategories.map((cat) => {
          const count = cat.value === "alle" ? galleryItems.length : galleryItems.filter(i => i.category === cat.value).length;
          const isGewinnspiel = cat.value === "gewinnspiel";
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value as CategoryFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.value
                  ? isGewinnspiel
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                    : "bg-primary text-white shadow-md"
                  : isGewinnspiel
                    ? "bg-amber-50 text-amber-700 border-2 border-amber-300 hover:bg-amber-100"
                    : "bg-light text-muted hover:bg-border"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Gewinnspiel Banner — when filtered */}
      {activeCategory === "gewinnspiel" && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 mb-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-1">Unsere Monatsgewinnspiele</h2>
          <p className="text-white/80 text-sm">Jeden Monat ein neues Gewinnspiel — nach Datum sortiert. Erkennbar an "Gewinnspiel / Winactie".</p>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightboxItem(item)}
            className="group bg-white border border-border/60 rounded-2xl overflow-hidden card-hover-glow text-left"
          >
            {/* Image */}
            <div className="aspect-square relative bg-gradient-to-br from-light to-gray-100 overflow-hidden">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {item.date && (
                <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full ${
                  item.category === "gewinnspiel"
                    ? "bg-amber-500 text-white"
                    : "bg-primary text-white"
                }`}>
                  {item.date}
                </span>
              )}
              {item.category === "gewinnspiel" && (
                <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Gewinnspiel
                </span>
              )}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-bold text-white text-sm drop-shadow-lg line-clamp-2">{item.title}</h3>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-primary font-semibold uppercase tracking-wide">
                {galleryCategories.find(c => c.value === item.category)?.label}
              </p>
              <p className="text-xs text-muted mt-0.5 line-clamp-2">{item.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" onClick={() => setLightboxItem(null)} />
          <div className="fixed inset-4 md:inset-12 z-50 flex items-center justify-center">
            <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="relative aspect-video">
                <Image
                  src={lightboxItem.image}
                  alt={lightboxItem.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    lightboxItem.category === "gewinnspiel" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                  }`}>
                    {galleryCategories.find(c => c.value === lightboxItem.category)?.label}
                  </span>
                  {lightboxItem.date && <span className="text-xs text-muted">{lightboxItem.date}</span>}
                </div>
                <h2 className="text-xl font-bold text-secondary">{lightboxItem.title}</h2>
                <p className="text-sm text-muted mt-1">{lightboxItem.description}</p>
                <a
                  href="https://www.instagram.com/trinkgutjammers_goch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                >
                  Auf Instagram ansehen →
                </a>
              </div>
              <button
                onClick={() => setLightboxItem(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Instagram CTA */}
      <div className="mt-12 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Mehr Bilder auf Instagram</h2>
        <p className="text-white/70 mb-4 max-w-md mx-auto">
          217 Beiträge · 4.558 Follower · Täglich neue Einblicke
        </p>
        <a
          href="https://www.instagram.com/trinkgutjammers_goch/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          @trinkgutjammers_goch
        </a>
      </div>
    </div>
  );
}
