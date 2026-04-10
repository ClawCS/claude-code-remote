"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import productsData from "@/data/products.json";
import { type Product, formatPrice } from "@/lib/utils";
import { galleryItems } from "@/data/gallery";
import { courses } from "@/data/akademie";

const products = productsData as Product[];

/* ═══ NL price estimates (avg Dutch supermarket prices for comparable items) ═══ */
const NL_PRICE_MULTIPLIER: Record<string, number> = {
  bier: 1.35,
  wein: 1.25,
  sekt: 1.30,
  spirituosen: 1.20,
  alkoholfrei: 1.15,
  lebensmittel: 1.10,
};

function getNlPrice(product: Product): number {
  const mult = NL_PRICE_MULTIPLIER[product.categorySlug] || 1.25;
  return Math.round(product.price * mult * 100) / 100;
}

/* ═══ Top deals: products with biggest absolute savings ═══ */
function getTopDeals(count: number) {
  return products
    .filter((p) => p.inStock && p.price > 3)
    .map((p) => ({ ...p, nlPrice: getNlPrice(p), saving: getNlPrice(p) - p.price }))
    .sort((a, b) => b.saving - a.saving)
    .slice(0, count);
}

/* ═══ Route data ═══ */
const ROUTES = [
  { city: "Groesbeek", time: "8 min", km: "7 km" },
  { city: "Millingen a/d Rijn", time: "12 min", km: "10 km" },
  { city: "Kranenburg", time: "5 min", km: "4 km" },
  { city: "Nijmegen", time: "25 min", km: "22 km" },
  { city: "Arnhem", time: "35 min", km: "45 km" },
  { city: "Kleve", time: "10 min", km: "8 km" },
];

/* ═══ Category translations ═══ */
const CAT_NL: Record<string, string> = {
  bier: "Bier",
  wein: "Wijn",
  sekt: "Sekt & Bubbels",
  spirituosen: "Sterke Drank",
  alkoholfrei: "Frisdranken & Water",
  lebensmittel: "Levensmiddelen",
};

export default function NlLandingPage() {
  const [kratjes, setKratjes] = useState(4);
  const topDeals = useMemo(() => getTopDeals(8), []);

  // Savings calculator: avg saving per Kasten ~€3-4
  const monthSaving = kratjes * 3.5;
  const yearSaving = monthSaving * 12;

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Top bar ═══ */}
      <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm font-semibold">
        🇳🇱 Speciaal voor onze Nederlandse klanten — Bespaar tot 40% op dranken!
      </div>

      {/* ═══ Nav ═══ */}
      <nav className="bg-white sticky top-0 z-50 shadow-sm">
        {/* Hauptzeile: Logo + Kontakt */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <Link href="/nl" className="flex items-center gap-2">
            <Image src="/images/logo-trinkgut-jammers.png" alt="Trinkgut Jammers" width={140} height={55} className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="https://wa.me/4917663228597" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.506 3.932 1.395 5.608L.054 23.395a.6.6 0 00.727.728l5.787-1.34A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.56 9.56 0 01-5.148-1.5l-.36-.216-3.735.865.888-3.638-.237-.376A9.555 9.555 0 012.4 12c0-5.302 4.298-9.6 9.6-9.6s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"/></svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <a href="tel:+492823418707" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span className="hidden sm:inline">02823-418707</span>
            </a>
            <Link href="/" className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md hover:bg-orange-200 font-medium">🇩🇪 DE</Link>
          </div>
        </div>
        {/* Unterreiter */}
        <div className="bg-orange-500 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-0.5">
            {[
              { label: "💰 Aanbiedingen", href: "#deals" },
              { label: "🎉 Partyplanner", href: "#party" },
              { label: "🎪 Verhuur", href: "#verhuur" },
              { label: "👥 Ons Team", href: "#team" },
              { label: "🎓 Cursussen", href: "#academie" },
              { label: "📍 Route", href: "#route" },
              { label: "📞 Contact", href: "#contact" },
            ].map((item) => (
              <a key={item.href} href={item.href} className="px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 whitespace-nowrap transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl animate-pulse">🍺</div>
          <div className="absolute top-20 right-20 text-7xl animate-pulse" style={{ animationDelay: "0.5s" }}>🍷</div>
          <div className="absolute bottom-10 left-1/3 text-6xl animate-pulse" style={{ animationDelay: "1s" }}>🥃</div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
            <span className="text-lg">🇳🇱</span> Speciaal voor Nederlandse klanten
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
            Bespaar tot <span className="text-yellow-300">40%</span><br />
            op al je dranken
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-2xl mx-auto">
            Slechts 3 km over de grens in Goch — 7.000+ producten, altijd de beste prijs.
          </p>
          <p className="text-lg text-yellow-200 font-semibold mb-8">
            Geen 18, geen alcohol.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#deals" className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold text-lg px-8 py-4 rounded-xl hover:bg-yellow-50 transition-all shadow-lg hover:shadow-xl hover:scale-105">
              Bekijk aanbiedingen
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </a>
            <a href="#route" className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/30 transition-all border border-white/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Route plannen
            </a>
          </div>
        </div>
      </section>

      {/* ═══ SPAR-RECHNER ═══ */}
      <section className="relative -mt-8 z-10 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              💰 Hoeveel bespaar jij?
            </h2>
            <p className="text-gray-500 mt-1">Bereken je maandelijkse besparing</p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Ik koop per maand: <span className="text-orange-600 text-xl">{kratjes}</span> kratjes bier/dranken
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={kratjes}
              onChange={(e) => setKratjes(Number(e.target.value))}
              className="w-full h-3 bg-orange-100 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 krat</span>
              <span>10 kratten</span>
              <span>20 kratten</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600 mb-1">Besparing per maand</p>
              <p className="text-3xl sm:text-4xl font-black text-orange-600">€{monthSaving.toFixed(0)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600 mb-1">Besparing per jaar</p>
              <p className="text-3xl sm:text-4xl font-black text-green-600">€{yearSaving.toFixed(0)}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            * Gebaseerd op gemiddeld prijsverschil van €3,50 per krat tussen NL en DE
          </p>
        </div>
      </section>

      {/* ═══ TOP DEALS ═══ */}
      <section id="deals" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-widest uppercase text-orange-500 mb-2">Onze beste deals</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Populair bij onze Nederlandse klanten
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {topDeals.map((deal) => (
            <div key={deal.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {/* Savings badge */}
              <div className="relative">
                <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  Bespaar €{deal.saving.toFixed(2)}
                </div>
                <div className="aspect-square bg-gray-50 p-4 flex items-center justify-center">
                  <Image
                    src={deal.image}
                    alt={deal.name}
                    width={200}
                    height={200}
                    className="object-contain max-h-40 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-orange-500 font-semibold mb-1">{CAT_NL[deal.categorySlug] || deal.category}</p>
                <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{deal.name}</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl font-black text-orange-600">{formatPrice(deal.price)}</span>
                  <span className="text-sm text-gray-400 line-through">NL ~{formatPrice(deal.nlPrice)}</span>
                </div>
                <p className="text-xs text-gray-500">{deal.unit}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#route" className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl">
            Bezoek ons — Route plannen 📍
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
        </div>
      </section>

      {/* ═══ WAAROM JAMMERS ═══ */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Waarom naar Jammers?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "💰", title: "Tot 40% goedkoper", desc: "Duitse prijzen liggen fors lager dan in Nederland. Bespaar op bier, wijn, sterke drank en meer." },
              { icon: "🏪", title: "7.000+ producten", desc: "Het grootste assortiment in de regio. Van lokaal Duits bier tot internationale topmerken." },
              { icon: "🅿️", title: "Gratis parkeren", desc: "Ruime gratis parkeerplaats direct voor de deur. Makkelijk laden, ook met een volle kofferbak." },
              { icon: "🗣️", title: "Wij spreken Nederlands", desc: "Ons team helpt je graag in het Nederlands. Je hoeft geen Duits te spreken!" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PARTYPLANNER ═══ */}
      <section id="party" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">🎉 Partyplanner</h2>
          <p className="text-gray-500 mt-2">Wij plannen jouw perfecte feest — van bier tot bubbels</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🍺", title: "Drankenadvies", desc: "Hoeveel bier, wijn en fris heb je nodig? Wij berekenen het voor je op basis van het aantal gasten." },
            { icon: "🧊", title: "Koeling & ijs", desc: "Koelkasten, ijsblokjesmachines en koeltonnen beschikbaar voor verhuur." },
            { icon: "📦", title: "Levering & retour", desc: "Wij leveren aan huis en halen lege kratten weer op. Geen gesleep!" },
            { icon: "🥂", title: "Sekt & bubbels", desc: "Prosecco, Champagne of Sekt — voor bruiloften, jubilea en meer." },
            { icon: "🎯", title: "Op maat", desc: "Vertel ons je budget en het aantal gasten — wij stellen het perfecte pakket samen." },
            { icon: "💰", title: "Duitse prijzen", desc: "Bespaar tot 40% op dranken vergeleken met Nederlandse supermarktprijzen." },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="https://wa.me/4917663228597?text=Hallo!%20Ik%20wil%20graag%20een%20feest%20plannen." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all">
            💬 WhatsApp ons voor een offerte
          </a>
        </div>
      </section>

      {/* ═══ VERHUUR ═══ */}
      <section id="verhuur" className="bg-gray-50 py-16 md:py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">🎪 Verhuur</h2>
            <p className="text-gray-500 mt-2">Alles voor jouw evenement — huren bij Jammers</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "🍻", title: "Tapinstallaties", desc: "Professionele tapinstallaties met CO₂ en koeling voor perfect getapt bier." },
              { icon: "🪑", title: "Tafels & stoelen", desc: "Statafels, biertafels en stoelen voor elk formaat feest." },
              { icon: "🥤", title: "Glazen & bekers", desc: "Bierglazen, wijnglazen, champagneglazen — schoon en klaar voor gebruik." },
              { icon: "❄️", title: "Koeling", desc: "Koelkasten, koeltonnen en ijsblokjesmachines voor elk evenement." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 space-x-3">
            <a href="tel:+492823418707" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all">
              📞 Bel ons voor beschikbaarheid
            </a>
            <a href="https://wa.me/4917663228597?text=Hallo!%20Ik%20wil%20graag%20informatie%20over%20verhuur." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ═══ ROUTE & ANFAHRT ═══ */}
      <section id="route" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">📍 Makkelijk te bereiken</h2>
          <p className="text-gray-500 mt-2">Jurgenstr. 20, 47574 Goch — direct aan de grens</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {ROUTES.map((r) => (
            <div key={r.city} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-orange-200 hover:shadow-md transition-all">
              <p className="font-bold text-gray-900 text-sm mb-1">{r.city}</p>
              <p className="text-2xl font-black text-orange-500">{r.time}</p>
              <p className="text-xs text-gray-400">{r.km}</p>
            </div>
          ))}
        </div>

        {/* Google Maps embed */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2484.5!2d6.1573!3d51.6790!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c77a0a1a0a0a0a%3A0x0!2sJurgenstra%C3%9Fe+20%2C+47574+Goch!5e0!3m2!1snl!2sde!4v1"
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Route naar Jammers Getränkemarkt Goch"
          />
        </div>

        <div className="text-center mt-6">
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Jurgenstraße+20,+47574+Goch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Open in Google Maps
          </a>
        </div>
      </section>

      {/* ═══ OPENINGSTIJDEN & CONTACT ═══ */}
      <section id="contact" className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white py-16 md:py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {/* Openingstijden */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4">⏰ Openingstijden</h3>
              <div className="space-y-2 text-white/90">
                <p className="flex justify-center md:justify-start gap-3">
                  <span className="font-semibold w-16">Ma – Za</span>
                  <span>08:00 – 20:00</span>
                </p>
                <p className="flex justify-center md:justify-start gap-3">
                  <span className="font-semibold w-16">Zondag</span>
                  <span>Gesloten</span>
                </p>
              </div>
            </div>

            {/* Adres */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">📍 Adres</h3>
              <p className="text-white/90 leading-relaxed">
                trinkgut Jammers<br />
                Jurgenstr. 20<br />
                47574 Goch<br />
                <span className="text-yellow-200 text-sm">(3 km van de Nederlandse grens)</span>
              </p>
            </div>

            {/* Contact */}
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-4">📞 Contact</h3>
              <div className="space-y-3">
                <a href="tel:+492823418707" className="flex items-center justify-center md:justify-end gap-2 text-white/90 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  02823-418707
                </a>
                <a href="https://wa.me/491752492386" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-end gap-2 text-white/90 hover:text-white">
                  <span className="text-lg">💬</span>
                  WhatsApp
                </a>
                <a href="mailto:jammers-goch@trinkgut.de" className="flex items-center justify-center md:justify-end gap-2 text-white/90 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  jammers-goch@trinkgut.de
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STICKY CTA (Mobile) ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 p-3 sm:hidden">
        <div className="flex gap-2">
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Jurgenstraße+20,+47574+Goch"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3 rounded-xl text-sm"
          >
            📍 Route plannen
          </a>
          <a
            href="https://wa.me/491752492386"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 px-5 rounded-xl text-sm"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* ═══ ONS TEAM ═══ */}
      <section id="team" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Ons Team</h2>
          <p className="text-gray-500 mt-2">10 medewerkers met passie voor dranken — wij adviseren u graag!</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {galleryItems.filter((i) => i.category === "team").map((member) => (
            <div key={member.id} className="text-center group">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-2 shadow-md group-hover:shadow-xl transition-shadow">
                <Image
                  src={member.image}
                  alt={member.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-bold text-sm drop-shadow-lg">{member.title.split(" — ")[0]}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{member.title.split(" — ")[1] || ""}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ AKADEMIE ═══ */}
      <section id="academie" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Trinkgut Academie</h2>
          <p className="text-gray-500 mt-2">{courses.length} cursussen met {courses.reduce((sum, c) => sum + c.lessons.length, 0)} lessen — van beginner tot expert</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.slice(0, 6).map((course) => (
            <div key={course.slug} className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-lg transition-all cursor-default">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{course.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors text-sm">{course.title}</h3>
                  <p className="text-xs text-gray-400">{course.lessons.length} lessen</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{course.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <a href="#route" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors text-sm">
            Bezoek ons in Goch 📍
          </a>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} trinkgut Jammers Goch — Alle rechten voorbehouden</p>
        <p className="mt-1">
          <a href="/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-white">Impressum</a>
          {" · "}
          <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-white">Privacy</a>
          {" · "}
          <a href="/" className="hover:text-white">🇩🇪 Duitse website</a>
        </p>
        <p className="mt-3 text-xs text-gray-600">Geen 18, geen alcohol.</p>
      </footer>
    </div>
  );
}
