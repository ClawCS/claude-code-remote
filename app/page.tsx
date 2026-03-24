"use client";

import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import ProductGrid from "@/components/ProductGrid";
import SocialProof from "@/components/SocialProof";
import NewsletterSignup from "@/components/NewsletterSignup";
import { categories, type Product } from "@/lib/utils";
import productsData from "@/data/products.json";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

const products = productsData as Product[];

export default function Home() {
  const highlights = products.filter((p) => p.highlight);
  const { t } = useTranslation();

  return (
    <>
      <Hero />

      {/* Video Trailer */}
      <section className="relative bg-black py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 noise-bg opacity-30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 animate-fade-in-up">
            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">{t("home.video.label")}</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">{t("home.video.title")}</h2>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/10 group cursor-pointer">
            {/* Video placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-red-900/90 to-black flex items-center justify-center">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 text-8xl animate-float-slow">🍺</div>
                <div className="absolute bottom-10 right-10 text-7xl animate-float">🍷</div>
                <div className="absolute top-1/3 right-1/4 text-6xl animate-float-slow" style={{ animationDelay: "2s" }}>🥂</div>
              </div>
              <div className="text-center relative z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-lg md:text-xl">{t("home.video.play")}</p>
                <p className="text-white/50 text-sm mt-1">{t("home.video.soon")}</p>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            {t("videoProduction")} ·{" "}
            <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram</a>
          </p>
        </div>
      </section>

      {/* Kategorien */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">{t("home.categories.label")}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary">
            {t("home.categories.title")}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="relative section-divider-wave py-20 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-light via-red-50/30 to-white" />
        <div className="absolute inset-0 noise-bg" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">{t("home.highlights.label")}</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-secondary">
              {t("home.highlights.title")}
            </h2>
          </div>
          <ProductGrid products={highlights} />
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">{t("home.services.label")}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary">
            {t("home.services.title")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          {[
            { href: "/partyplaner", icon: "🎉", titleKey: "home.service.partyplaner", descKey: "home.service.partyplaner.desc", gradient: "from-red-500 to-orange-500" },
            { href: "/vermietung", icon: "🎪", titleKey: "home.service.vermietung", descKey: "home.service.vermietung.desc", gradient: "from-blue-500 to-cyan-500" },
            { href: "/finder", icon: "🔍", titleKey: "home.service.finder", descKey: "home.service.finder.desc", gradient: "from-purple-500 to-pink-500" },
            { href: "/cocktails", icon: "🍸", titleKey: "home.service.cocktails", descKey: "home.service.cocktails.desc", gradient: "from-amber-500 to-red-500" },
          ].map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group relative p-7 bg-white border border-border/60 rounded-2xl card-hover-glow overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
              <h3 className="font-bold text-secondary group-hover:text-primary transition-colors text-lg">{t(s.titleKey)}</h3>
              <p className="text-sm text-muted mt-1">{t(s.descKey)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Instagram + Gewinnspiel */}
      <section className="relative section-divider-diagonal bg-secondary py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 noise-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="animate-slide-left">
              <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">{t("home.community.label")}</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
                {t("home.community.title")}
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t("home.community.text")}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.instagram.com/trinkgutjammers_goch/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold rounded-xl btn-hover shadow-lg shadow-pink-500/20"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  @trinkgutjammers_goch
                </a>
                <Link href="/gewinnspiel" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-300 hover:border-white hover:text-white font-medium rounded-xl transition-colors">
                  {t("home.community.gewinnspiele")}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 animate-slide-right">
              {[
                { icon: "🧊", title: "Monster Cooler", sub: "Gewinnspiel" },
                { icon: "🔥", title: "Weber Grill", sub: "600€ Gewinn" },
                { icon: "🏖️", title: "Salitos", sub: "Sommer-Aktion" },
                { icon: "📱", title: "1€ Rabatt", sub: "Für Follower" },
              ].map((card) => (
                <div key={card.title} className="glass-dark rounded-2xl p-5 text-center card-hover">
                  <span className="text-3xl block mb-1">{card.icon}</span>
                  <p className="text-white font-bold text-sm">{card.title}</p>
                  <p className="text-gray-400 text-xs">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <NewsletterSignup />
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center animate-fade-in-up">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">{t("home.cta.label")}</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-secondary mb-4">
          {products.length} {t("home.cta.title")}
        </h2>
        <p className="text-muted mb-10 max-w-lg mx-auto">
          {t("home.cta.text")}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/produkte"
            className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl btn-hover text-lg shadow-lg shadow-red-500/20"
          >
            {t("btn.alleProdukte")}
          </Link>
          <a
            href="tel:02823418707"
            className="px-8 py-4 border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-bold rounded-2xl transition-colors text-lg"
          >
            📞 02823-418707
          </a>
        </div>
      </section>
    </>
  );
}
