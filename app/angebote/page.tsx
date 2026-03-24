import Link from "next/link";
import Image from "next/image";
import ProductGrid from "@/components/ProductGrid";
import { type Product } from "@/lib/utils";
import productsData from "@/data/products.json";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aktuelle Angebote" };

const products = productsData as Product[];
const starOfWeek = products.find((p) => p.slug === "bitburger-pils") || products[0];

export default function AngebotePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-2">Aktuelle Angebote</h1>
      <p className="text-muted mb-8">
        Gültig vom 23.03.2026 bis 28.03.2026 · trinkgut Jammers Goch · Nur solange der Vorrat reicht.
      </p>

      {/* Star of the Week */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <span className="inline-block bg-accent text-secondary text-sm font-bold px-3 py-1 rounded-full mb-3">
            STAR DER WOCHE
          </span>
          <h2 className="text-3xl font-bold mb-2">{starOfWeek.name}</h2>
          <p className="text-white/80 mb-4">{starOfWeek.description}</p>
          <span className="text-4xl font-bold text-accent">
            {starOfWeek.price.toFixed(2).replace(".", ",")} €
          </span>
        </div>
        <div className="w-48 h-48 bg-white/10 rounded-2xl relative flex-shrink-0">
          <Image src={starOfWeek.image} alt={starOfWeek.name} fill sizes="192px" className="object-contain p-4" />
        </div>
      </section>

      {/* Prospekt + Follower-Rabatt */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-light border border-border rounded-xl p-6 flex items-center gap-4">
          <span className="text-4xl">📰</span>
          <div className="flex-1">
            <h3 className="font-bold text-secondary">Aktueller Handzettel</h3>
            <p className="text-xs text-muted">Alle Angebote der Woche auf einen Blick.</p>
          </div>
          <a href="https://www.trinkgut.de/angebote/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-sm whitespace-nowrap">
            Ansehen
          </a>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 flex items-center gap-4 text-white">
          <span className="text-4xl">📱</span>
          <div className="flex-1">
            <h3 className="font-bold">1€ Rabatt für Follower!</h3>
            <p className="text-xs text-white/80">Folge uns auf Instagram und spare bei ausgewählten Produkten.</p>
          </div>
          <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white text-secondary font-bold rounded-lg hover:bg-gray-100 transition-colors text-sm whitespace-nowrap">
            Folgen
          </a>
        </div>
      </div>

      {/* Bier */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">🍺 Bier</h2>
        <ProductGrid products={products.filter((p) => p.categorySlug === "bier").slice(0, 8)} />
        {products.filter((p) => p.categorySlug === "bier").length > 8 && (
          <div className="text-center mt-4">
            <Link href="/kategorie/bier" className="text-primary hover:underline font-medium text-sm">
              Alle {products.filter((p) => p.categorySlug === "bier").length} Bier-Angebote ansehen →
            </Link>
          </div>
        )}
      </section>

      {/* Alkoholfrei */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">🥤 Alkoholfreie Getränke</h2>
        <ProductGrid products={products.filter((p) => p.categorySlug === "alkoholfrei").slice(0, 8)} />
        {products.filter((p) => p.categorySlug === "alkoholfrei").length > 8 && (
          <div className="text-center mt-4">
            <Link href="/kategorie/alkoholfrei" className="text-primary hover:underline font-medium text-sm">
              Alle {products.filter((p) => p.categorySlug === "alkoholfrei").length} ansehen →
            </Link>
          </div>
        )}
      </section>

      {/* Wein */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">🍷 Wein</h2>
        <ProductGrid products={products.filter((p) => p.categorySlug === "wein").slice(0, 8)} />
        {products.filter((p) => p.categorySlug === "wein").length > 8 && (
          <div className="text-center mt-4">
            <Link href="/kategorie/wein" className="text-primary hover:underline font-medium text-sm">
              Alle {products.filter((p) => p.categorySlug === "wein").length} Wein-Angebote ansehen →
            </Link>
          </div>
        )}
      </section>

      {/* Sekt */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">🥂 Sekt & Co.</h2>
        <ProductGrid products={products.filter((p) => p.categorySlug === "sekt")} />
      </section>

      {/* Spirituosen */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">🥃 Spirituosen</h2>
        <ProductGrid products={products.filter((p) => p.categorySlug === "spirituosen").slice(0, 8)} />
        {products.filter((p) => p.categorySlug === "spirituosen").length > 8 && (
          <div className="text-center mt-4">
            <Link href="/kategorie/spirituosen" className="text-primary hover:underline font-medium text-sm">
              Alle {products.filter((p) => p.categorySlug === "spirituosen").length} Spirituosen ansehen →
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-muted mb-4">Noch mehr Angebote gibt es direkt im Markt!</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/produkte" className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">
            Alle {products.length} Produkte
          </Link>
          <Link href="/gewinnspiel" className="px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-white font-bold rounded-lg transition-colors">
            Zu den Gewinnspielen
          </Link>
        </div>
      </div>
    </div>
  );
}
