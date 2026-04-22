"use client";

import Hero from "@/components/Hero";
import VideoHero from "@/components/VideoHero";
import CategoryCard from "@/components/CategoryCard";
import SocialProof from "@/components/SocialProof";
import NewsletterSignup from "@/components/NewsletterSignup";
import { categories, type Product } from "@/lib/utils";
import productsData from "@/data/products.json";
import { galleryItems } from "@/data/gallery";
import { courses } from "@/data/akademie";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import ScrollReveal from "@/components/ScrollReveal";

const products = productsData as Product[];
const teamMembers = galleryItems.filter((i) => i.category === "team");

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Hero />

      {/* Video Trailer */}
      <VideoHero />

      {/* Kategorien */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <ScrollReveal className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">{t("home.categories.label")}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F2937] section-accent-center" style={{ textWrap: "balance" }}>
            {t("home.categories.title")}
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.slug} delay={i * 80}>
              <CategoryCard category={cat} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Gradient fade transition */}
      <div className="h-24 bg-gradient-to-b from-white to-[#FFF5F3]" />

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <ScrollReveal className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">{t("home.services.label")}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F2937] section-accent-center" style={{ textWrap: "balance" }}>
            {t("home.services.title")}
          </h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { href: "/partyplaner", image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop", titleKey: "home.service.partyplaner", descKey: "home.service.partyplaner.desc" },
            { href: "/vermietung", image: "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=600&h=400&fit=crop", titleKey: "home.service.vermietung", descKey: "home.service.vermietung.desc" },
            { href: "/finder", image: "https://images.unsplash.com/photo-1594913615593-e4b8c44625be?w=600&h=400&fit=crop", titleKey: "home.service.finder", descKey: "home.service.finder.desc" },
            { href: "/cocktails", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop", titleKey: "home.service.cocktails", descKey: "home.service.cocktails.desc" },
          ].map((s, i) => (
            <ScrollReveal key={s.href} delay={i * 100}>
              <Link
                href={s.href}
                className="group relative bg-white border border-[#F0D5CF]/60 rounded-2xl card-hover-glow overflow-hidden block"
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={s.image}
                    alt={t(s.titleKey)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
                {/* Text */}
                <div className="p-5">
                  <h3 className="font-bold text-[#1F2937] group-hover:text-[#DC2626] transition-colors text-lg">{t(s.titleKey)}</h3>
                  <p className="text-sm text-muted mt-1">{t(s.descKey)}</p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Gradient fade to dark */}
      <div className="h-24 bg-gradient-to-b from-white to-[#1F2937]" />

      {/* Instagram + Gewinnspiel */}
      <section className="relative bg-gradient-to-b from-[#1F2937] to-[#111827] py-20 md:py-24 overflow-hidden red-stripe-divider">
        <div className="absolute inset-0 noise-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <ScrollReveal>
              <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">{t("home.community.label")}</p>
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white font-bold rounded-xl btn-hover btn-shimmer shadow-lg shadow-[#DC2626]/20"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  @trinkgutjammers_goch
                </a>
                <Link href="/gewinnspiel" className="inline-flex items-center gap-2 px-6 py-3 border border-[#F59E0B]/50 text-[#F59E0B] hover:border-[#F59E0B] hover:text-white font-medium rounded-xl transition-colors">
                  {t("home.community.gewinnspiele")}
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200} className="grid grid-cols-2 gap-3">
              {[
                { icon: "🧊", title: "Monster Cooler", sub: "Gewinnspiel" },
                { icon: "🔥", title: "Weber Grill", sub: "600€ Gewinn" },
                { icon: "🏖️", title: "Salitos", sub: "Sommer-Aktion" },
                { icon: "📱", title: "5€ Rabatt", sub: "Für Follower" },
              ].map((card) => (
                <div key={card.title} className="glass-dark rounded-2xl p-5 text-center card-hover border border-[#DC2626]/10 hover:border-[#DC2626]/30">
                  <span className="text-3xl block mb-1">{card.icon}</span>
                  <p className="text-white font-bold text-sm">{card.title}</p>
                  <p className="text-gray-400 text-xs">{card.sub}</p>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Gradient fade from dark */}
      <div className="h-24 bg-gradient-to-b from-[#111827] to-white" />

      {/* ═══ UNSER TEAM ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <ScrollReveal className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">Leidenschaft & Expertise</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F2937] section-accent-center">
            Unser Team
          </h2>
          <p className="text-muted mt-3 max-w-xl mx-auto">10 Mitarbeiter mit Herz und Leidenschaft — wir beraten dich gerne!</p>
        </ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {teamMembers.map((member, i) => (
            <ScrollReveal key={member.id} delay={i * 70}>
            <Link href="/galerie" className="group text-center">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-3 border-2 border-transparent group-hover:border-[#DC2626] transition-all duration-300 shadow-md group-hover:shadow-xl">
                <Image
                  src={member.image}
                  alt={member.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-bold text-sm drop-shadow-lg">{member.title.split(" — ")[0]}</p>
                  {member.title.includes(" — ") && (
                    <p className="text-white/80 text-xs drop-shadow-lg">{member.title.split(" — ")[1]}</p>
                  )}
                </div>
              </div>
            </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Gradient fade */}
      <div className="h-24 bg-gradient-to-b from-white to-[#FFF5F3]" />

      {/* ═══ AKADEMIE TEASER ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <ScrollReveal className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">Wissen & Zertifikate</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F2937] section-accent-center">
            Trinkgut Akademie
          </h2>
          <p className="text-muted mt-3 max-w-xl mx-auto">{courses.length} Kurse mit {courses.reduce((sum, c) => sum + c.lessons.length, 0)} Lektionen — vom Einsteiger zum Experten</p>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.slice(0, 6).map((course) => (
            <Link key={course.slug} href={`/akademie/${course.slug}`} className="group relative p-6 bg-white border border-[#F0D5CF]/60 rounded-2xl card-hover-glow overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{course.icon}</span>
                <div>
                  <h3 className="font-bold text-[#1F2937] group-hover:text-[#DC2626] transition-colors">{course.title}</h3>
                  <p className="text-xs text-muted">{course.difficulty} · {course.lessons.length} Lektionen</p>
                </div>
              </div>
              <p className="text-sm text-muted line-clamp-2">{course.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  course.difficulty === "Einsteiger" ? "bg-green-100 text-green-700" :
                  course.difficulty === "Fortgeschritten" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>{course.difficulty}</span>
                <span className="text-xs text-muted">{course.duration}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/akademie" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F2937] hover:bg-[#111827] text-white font-bold rounded-xl btn-hover shadow-lg transition-colors">
            Alle {courses.length} Kurse entdecken
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <NewsletterSignup />
      </section>

      {/* CTA */}
      <ScrollReveal>
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">{t("home.cta.label")}</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-[#1F2937] mb-4 section-accent-center">
          {products.length} {t("home.cta.title")}
        </h2>
        <p className="text-muted mb-10 max-w-lg mx-auto">
          {t("home.cta.text")}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/produkte"
            className="px-8 py-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl btn-hover btn-shimmer text-lg shadow-lg shadow-[#DC2626]/20"
          >
            {t("btn.alleProdukte")}
          </Link>
          <a
            href="tel:02823418707"
            className="px-8 py-4 border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white font-bold rounded-2xl transition-colors text-lg"
          >
            📞 02823-418707
          </a>
        </div>
      </section>
      </ScrollReveal>
    </>
  );
}
