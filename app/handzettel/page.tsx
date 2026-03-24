"use client";

import { useState } from "react";
import Image from "next/image";
import ProductGrid from "@/components/ProductGrid";
import { type Product } from "@/lib/utils";
import productsData from "@/data/products.json";

const products = productsData as Product[];

type Country = "de" | "nl";

// Dutch product name mapping
const nlNames: Record<string, string> = {
  "Flensburger": "Flensburger",
  "Bitburger Pils": "Bitburger Pils",
  "Schlösser Alt": "Schlösser Alt",
  "König Pilsener": "König Pilsener",
  "Heineken": "Heineken",
  "Erdinger Weißbier": "Erdinger Weissbier",
  "Gerolsteiner Sprudel Kasten": "Gerolsteiner Bruiswater Krat",
  "Volvic Naturelle": "Volvic Naturel",
  "Coca-Cola Classic Kasten": "Coca-Cola Classic Krat",
  "Jack Daniel's Old No. 7": "Jack Daniel's Old No. 7",
  "Havana Club Añejo 3 Años": "Havana Club Añejo 3 Años",
};

const countryConfig = {
  de: {
    flag: "🇩🇪",
    label: "Deutschland",
    title: "Handzettel",
    subtitle: "Aktuelle Angebote für unsere deutschen Kunden",
    validText: "Gültig vom 23.03.2026 bis 28.03.2026",
    validSub: "Nur solange der Vorrat reicht.",
    prospektLabel: "📰 Prospekt online ansehen",
    starLabel: "STAR DER WOCHE",
    bierTitle: "🍺 Bier-Angebote",
    afTitle: "🥤 Alkoholfreie Getränke",
    weinTitle: "🍷 Wein-Angebote",
    spiritTitle: "🥃 Spirituosen",
    infoTitle: "Alle Angebote auch im Markt!",
    marktInfo: "Trinkgut Jammers · Jurgenstr. 20 · 47574 Goch · Mo–Sa 08:00–20:00",
    prospektUrl: "https://www.trinkgut.de/angebote/",
  },
  nl: {
    flag: "🇳🇱",
    label: "Nederland",
    title: "Folder",
    subtitle: "Actuele aanbiedingen voor onze Nederlandse klanten",
    validText: "Geldig van 23.03.2026 tot 28.03.2026",
    validSub: "Zolang de voorraad strekt.",
    prospektLabel: "📰 Folder online bekijken",
    starLabel: "STER VAN DE WEEK",
    bierTitle: "🍺 Bier Aanbiedingen",
    afTitle: "🥤 Alcoholvrije Dranken",
    weinTitle: "🍷 Wijn Aanbiedingen",
    spiritTitle: "🥃 Sterke Dranken",
    infoTitle: "Alle aanbiedingen ook in de winkel!",
    marktInfo: "Trinkgut Jammers · Jurgenstr. 20 · 47574 Goch (Duitsland) · Ma–Za 08:00–20:00",
    prospektUrl: "https://www.trinkgut.de/angebote/",
  },
};

export default function HandzettelPage() {
  const [country, setCountry] = useState<Country>("de");
  const config = countryConfig[country];

  const bierDeals = products.filter(p => p.categorySlug === "bier").slice(0, 4);
  const afDeals = products.filter(p => p.categorySlug === "alkoholfrei").slice(0, 4);
  const weinDeals = products.filter(p => p.categorySlug === "wein").slice(0, 4);
  const spiritDeals = products.filter(p => p.categorySlug === "spirituosen").slice(0, 4);
  const starProduct = products.find(p => p.slug === "bitburger-pils") || products[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{config.flag}</span>
            <h1 className="text-3xl font-extrabold text-secondary">{config.title}</h1>
          </div>
          <p className="text-muted">{config.subtitle}</p>
        </div>

        <div className="flex bg-light rounded-xl p-1 border border-border">
          <button
            onClick={() => setCountry("de")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              country === "de" ? "bg-white shadow-md text-secondary" : "text-muted hover:text-secondary"
            }`}
          >
            <span className="text-xl">🇩🇪</span>
            Deutschland
          </button>
          <button
            onClick={() => setCountry("nl")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              country === "nl" ? "bg-white shadow-md text-secondary" : "text-muted hover:text-secondary"
            }`}
          >
            <span className="text-xl">🇳🇱</span>
            Nederland
          </button>
        </div>
      </div>

      {/* Validity Banner */}
      <div className={`rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 ${
        country === "de"
          ? "bg-gradient-to-r from-black via-red-900 to-amber-600 text-white"
          : "bg-gradient-to-r from-red-600 via-white to-blue-600"
      }`}>
        <div className={country === "nl" ? "bg-white/80 rounded-lg px-4 py-2 text-secondary" : ""}>
          <p className="text-sm font-medium opacity-80">
            {country === "de" ? "trinkgut Jammers · Goch" : "trinkgut Jammers · Goch (Grensgebied)"}
          </p>
          <p className="font-bold text-lg">{config.validText}</p>
          <p className="text-sm opacity-70">{config.validSub}</p>
        </div>
        <a
          href={config.prospektUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-6 py-3 font-bold rounded-xl transition-colors whitespace-nowrap text-sm ${
            country === "de"
              ? "bg-accent hover:bg-accent-dark text-secondary"
              : "bg-blue-700 hover:bg-blue-800 text-white"
          }`}
        >
          {config.prospektLabel}
        </a>
      </div>

      {/* NL Welcome Message */}
      {country === "nl" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-sm text-blue-800">
          <p className="font-bold mb-1">🇳🇱 Welkom bij Trinkgut Jammers in Goch!</p>
          <p>
            Wij liggen vlak over de grens bij Goch (Duitsland) en verwelkomen graag onze Nederlandse klanten.
            Profiteer van onze scherpe prijzen op bier, wijn, sterke dranken en frisdranken.
            Betaling met pin (Maestro/Debit) mogelijk. Wij spreken Nederlands!
          </p>
        </div>
      )}

      {/* Star of the Week */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 text-white">
          <div className="flex-1">
            <span className="inline-block bg-accent text-secondary text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
              {config.starLabel}
            </span>
            <h2 className="text-3xl font-bold mb-2">{starProduct.name}</h2>
            <p className="text-white/70 mb-4">{starProduct.description}</p>
            <span className="text-4xl font-extrabold text-accent">
              {starProduct.price.toFixed(2).replace(".", ",")} €
            </span>
          </div>
          <div className="w-48 h-48 bg-white/10 rounded-2xl relative flex-shrink-0">
            <Image src={starProduct.image} alt={starProduct.name} fill sizes="192px" className="object-contain p-4" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">{config.bierTitle}</h2>
        <ProductGrid products={bierDeals} />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">{config.afTitle}</h2>
        <ProductGrid products={afDeals} />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">{config.weinTitle}</h2>
        <ProductGrid products={weinDeals} />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">{config.spiritTitle}</h2>
        <ProductGrid products={spiritDeals} />
      </section>

      {/* Info */}
      <div className="bg-light border border-border rounded-xl p-6 text-center">
        <p className="text-lg font-bold text-secondary mb-2">{config.infoTitle}</p>
        <p className="text-sm text-muted mb-4">{config.marktInfo}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="tel:02823418707" className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors text-sm">
            📞 02823-418707
          </a>
          <a href="https://wa.me/4917663228597" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-sm">
            💬 WhatsApp
          </a>
        </div>
        {country === "nl" && (
          <p className="text-xs text-muted mt-3">
            🚗 Vanaf Nijmegen: ~45 min · Vanaf Venlo: ~60 min · Vanaf Arnhem: ~50 min · Gratis parkeren!
          </p>
        )}
      </div>
    </div>
  );
}
