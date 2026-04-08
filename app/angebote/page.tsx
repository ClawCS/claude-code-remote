import Link from "next/link";
import Image from "next/image";
import ProductGrid from "@/components/ProductGrid";
import { type Product } from "@/lib/utils";
import productsData from "@/data/products.json";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aktuelle Angebote" };

const products = productsData as Product[];
const starOfWeek = products.find((p) => p.slug === "bitburger-pils") || products[0];

function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const fmt = (d: Date) =>
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `Gueltig vom ${fmt(monday)} bis ${fmt(saturday)}`;
}

function getISOCalendarWeek() {
  const now = new Date();
  const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function AngebotePage() {
  const currentKW = getISOCalendarWeek();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-2">Aktuelle Angebote</h1>
      <p className="text-muted mb-8">
        {getWeekRange()} · trinkgut Jammers Goch · Nur solange der Vorrat reicht.
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
            {starOfWeek.price.toFixed(2).replace(".", ",")} EUR
          </span>
        </div>
        <div className="w-48 h-48 bg-white/10 rounded-2xl relative flex-shrink-0">
          <Image src={starOfWeek.image} alt={starOfWeek.name} fill sizes="192px" className="object-contain p-4" />
        </div>
      </section>

      {/* Handzettel + Follower-Rabatt */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Link
          href="/handzettel"
          className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
        >
          <span className="text-4xl">📰</span>
          <div className="flex-1">
            <h3 className="font-bold text-secondary group-hover:text-primary transition-colors">
              Handzettel KW {currentKW} durchblaettern
            </h3>
            <p className="text-xs text-muted">
              Alle Angebote der Woche als blaetterbarer Prospekt — Werbekreis 3.6
            </p>
          </div>
          <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 flex items-center gap-4 text-white">
          <span className="text-4xl">📱</span>
          <div className="flex-1">
            <h3 className="font-bold">5 EUR Rabatt fuer Follower!</h3>
            <p className="text-xs text-white/80">Folge uns auf Instagram und spare bei ausgewaehlten Produkten.</p>
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
              Alle {products.filter((p) => p.categorySlug === "bier").length} Bier-Angebote ansehen
            </Link>
          </div>
        )}
      </section>

      {/* Alkoholfrei */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6">🥤 Alkoholfreie Getraenke</h2>
        <ProductGrid products={products.filter((p) => p.categorySlug === "alkoholfrei").slice(0, 8)} />
        {products.filter((p) => p.categorySlug === "alkoholfrei").length > 8 && (
          <div className="text-center mt-4">
            <Link href="/kategorie/alkoholfrei" className="text-primary hover:underline font-medium text-sm">
              Alle {products.filter((p) => p.categorySlug === "alkoholfrei").length} ansehen
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
              Alle {products.filter((p) => p.categorySlug === "wein").length} Wein-Angebote ansehen
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
              Alle {products.filter((p) => p.categorySlug === "spirituosen").length} Spirituosen ansehen
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-muted mb-4">Noch mehr Angebote gibt es direkt im Markt!</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/produkte" className="px-8 py-3 bg-primary hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
            Alle {products.length} Produkte
          </Link>
          <Link href="/handzettel" className="px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-white font-bold rounded-lg transition-colors">
            Handzettel durchblaettern
          </Link>
        </div>
      </div>
    </div>
  );
}
