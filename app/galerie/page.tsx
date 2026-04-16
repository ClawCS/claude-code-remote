"use client";

import { useState } from "react";
import Image from "next/image";
import { galleryItems } from "@/data/gallery";

export default function GaleriePage() {
  const [lightboxItem, setLightboxItem] = useState<typeof galleryItems[0] | null>(null);

  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Galerie</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Unser Team</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          {galleryItems.length} Mitarbeiter mit Herz und Leidenschaft — wir beraten dich gerne!
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Gallery Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {galleryItems.map((item) => (
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
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-bold text-white text-sm drop-shadow-lg">
                  {item.title.split(" — ")[0]}
                </h3>
              </div>
            </div>
            {item.title.includes(" — ") && (
              <div className="p-2">
                <p className="text-xs text-muted text-center">{item.title.split(" — ")[1]}</p>
              </div>
            )}
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
                <h2 className="text-xl font-bold text-secondary">{lightboxItem.title.split(" — ")[0]}</h2>
                {lightboxItem.title.includes(" — ") && (
                  <p className="text-sm text-muted mt-1">{lightboxItem.title.split(" — ")[1]}</p>
                )}
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
          217 Beitraege · 4.558 Follower · Taeglich neue Einblicke
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
    </>
  );
}
