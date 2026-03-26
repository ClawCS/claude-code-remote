"use client";

import Hero from "@/components/Hero";
import VideoHero from "@/components/VideoHero";
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
      <VideoHero />

      {/* Kategorien */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#C41E3A] mb-2">{t("home.categories.label")}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] section-accent-center">
            {t("home.categories.title")}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {/* Red gradient stripe divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#C41E3A] to-transparent opacity-20" />

      {/* Highlights */}
      <section className="relative section-divider-wave py-20 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5F3] via-[#FFF0EC]/30 to-white" />
        <div className="absolute inset-0 noise-bg" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#C41E3A] mb-2">{t("home.highlights.label")}</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] section-accent-center">
              {t("home.highlights.title")}
            </h2>
          </div>
          <ProductGrid products={highlights} />
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#C41E3A] mb-2">{t("home.services.label")}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] section-accent-center">
            {t("home.services.title")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          {[
            { href: "/partyplaner", icon: "🎉", titleKey: "home.service.partyplaner", descKey: "home.service.partyplaner.desc", gradient: "from-[#C41E3A] to-[#E8354A]" },
            { href: "/vermietung", icon: "🎪", titleKey: "home.service.vermietung", descKey: "home.service.vermietung.desc", gradient: "from-[#9B1B30] to-[#C41E3A]" },
            { href: "/finder", icon: "🔍", titleKey: "home.service.finder", descKey: "home.service.finder.desc", gradient: "from-[#D4A853] to-[#C41E3A]" },
            { href: "/cocktails", icon: "🍸", titleKey: "home.service.cocktails", descKey: "home.service.cocktails.desc", gradient: "from-[#E8354A] to-[#D4A853]" },
          ].map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group relative p-7 bg-white border border-[#F0D5CF]/60 rounded-2xl card-hover-glow overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
              <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
              <h3 className="font-bold text-[#1A1A2E] group-hover:text-[#C41E3A] transition-colors text-lg">{t(s.titleKey)}</h3>
              <p className="text-sm text-muted mt-1">{t(s.descKey)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Red gradient stripe divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#C41E3A] to-transparent opacity-20" />

      {/* Instagram + Gewinnspiel */}
      <section className="relative section-divider-diagonal bg-[#1A1A2E] py-20 md:py-24 overflow-hidden red-stripe-divider">
        <div className="absolute inset-0 noise-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="animate-slide-left">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#C41E3A] mb-2">{t("home.community.label")}</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 section-accent">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C41E3A] to-[#E8354A] text-white font-bold rounded-xl btn-hover btn-shimmer shadow-lg shadow-[#C41E3A]/20"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  @trinkgutjammers_goch
                </a>
                <Link href="/gewinnspiel" className="inline-flex items-center gap-2 px-6 py-3 border border-[#D4A853]/50 text-[#D4A853] hover:border-[#D4A853] hover:text-white font-medium rounded-xl transition-colors">
                  {t("home.community.gewinnspiele")}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 animate-slide-right">
              {[
                { icon: "🧊", title: "Monster Cooler", sub: "Gewinnspiel" },
                { icon: "🔥", title: "Weber Grill", sub: "600€ Gewinn" },
                { icon: "🏖️", title: "Salitos", sub: "Sommer-Aktion" },
                { icon: "📱", title: "5€ Rabatt", sub: "Für Follower" },
              ].map((card) => (
                <div key={card.title} className="glass-dark rounded-2xl p-5 text-center card-hover border border-[#C41E3A]/10 hover:border-[#C41E3A]/30">
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
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center animate-fade-in-up">
        <p className="text-sm font-semibold tracking-widest uppercase text-[#C41E3A] mb-2">{t("home.cta.label")}</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-[#1A1A2E] mb-4 section-accent-center">
          {products.length} {t("home.cta.title")}
        </h2>
        <p className="text-muted mb-10 max-w-lg mx-auto">
          {t("home.cta.text")}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/produkte"
            className="px-8 py-4 bg-[#C41E3A] hover:bg-[#9B1B30] text-white font-bold rounded-2xl btn-hover btn-shimmer text-lg shadow-lg shadow-[#C41E3A]/20"
          >
            {t("btn.alleProdukte")}
          </Link>
          <a
            href="tel:02823418707"
            className="px-8 py-4 border-2 border-[#1A1A2E] text-[#1A1A2E] hover:bg-[#1A1A2E] hover:text-white font-bold rounded-2xl transition-colors text-lg"
          >
            📞 02823-418707
          </a>
        </div>
      </section>
    </>
  );
}
