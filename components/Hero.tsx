"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import WeatherWidget from "./WeatherWidget";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden min-h-[650px] md:min-h-[750px] bg-[#7A1428]">
      {/* Background image — Markt-Atmosphäre */}
      <div className="absolute inset-0">
        <Image
          src="/images/gallery/ig-00.jpg"
          alt="Trinkgut Jammers Markt"
          fill
          className="object-cover opacity-25"
          priority
          unoptimized
        />
      </div>

      {/* Warm red gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#B91C1C]/95 via-[#DC2626]/80 to-[#7A1428]/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#7A1428] via-transparent to-[#B91C1C]/40" />

      {/* Warm glow accents */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse,rgba(220,38,38,0.3)_0%,transparent_70%)]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(245,158,11,0.1)_0%,transparent_70%)]" />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-bg" />

      {/* Shimmer particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            background: i % 3 === 0 ? "rgba(245, 158, 11, 0.6)" : "rgba(255, 255, 255, 0.4)",
            left: `${2 + (i * 3.3) % 96}%`,
            top: `${5 + (i * 6.7) % 88}%`,
            boxShadow: i % 3 === 0
              ? "0 0 6px rgba(245, 158, 11, 0.4)"
              : "0 0 4px rgba(255, 255, 255, 0.3)",
            animation: `particleFloat ${5 + (i % 4) * 2}s ease-in-out ${(i * 0.5) % 5}s infinite`,
          }}
        />
      ))}

      {/* Red accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DC2626] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28 md:py-40 text-white">
        {/* Weather Widget */}
        <div className="absolute top-6 right-4 sm:right-6 z-10 flex flex-col items-end">
          <WeatherWidget />
        </div>

        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-[#F59E0B] to-transparent" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#F59E0B]">
                {t("hero.badge")}
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6 animate-fade-in-up"
            style={{ animationDelay: "150ms", letterSpacing: "-0.03em" }}
          >
            <span className="text-white">{t("hero.title1")}</span>
            <br />
            <span className="bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#F59E0B] bg-clip-text text-transparent">
              {t("hero.title2")}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-white/60 mb-10 leading-relaxed max-w-lg animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
            <Link
              href="/produkte"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#DC2626] text-white font-bold rounded-xl text-lg shadow-lg shadow-[#DC2626]/30 hover:shadow-xl hover:shadow-[#DC2626]/40 hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#EF4444] to-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">{t("hero.cta1")}</span>
              <svg className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/partyplaner"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl text-lg hover:bg-white/20 hover:-translate-y-0.5 transition-all"
            >
              <span>🎉</span>
              <span>{t("hero.cta2")}</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-6 mt-12 animate-fade-in-up" style={{ animationDelay: "700ms" }}>
            {[
              { value: "7.000+", label: "Artikel" },
              { value: "4,6★", label: "Google" },
              { value: "Seit 2024", label: "Für euch da" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white">{badge.value}</span>
                <span className="text-xs text-white/40 uppercase tracking-wider">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex-col items-center gap-2 animate-fade-in-up hidden md:flex" style={{ animationDelay: "1.2s" }}>
          <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#F59E0B]/40 to-transparent relative overflow-hidden">
            <div className="absolute inset-x-0 h-3 bg-[#F59E0B]/80 animate-scroll-line" />
          </div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FFF8F6] to-transparent" />
    </section>
  );
}
