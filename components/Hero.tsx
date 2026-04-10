"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import WeatherWidget from "./WeatherWidget";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px]">
      {/* Animated gradient background — deep red mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#B91C1C] via-[#DC2626] to-[#7A1428] animate-gradient" />

      {/* Mesh pattern overlay */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse,rgba(232,53,74,0.4)_0%,transparent_70%)] animate-mesh" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(212,168,83,0.15)_0%,transparent_70%)] animate-mesh" style={{ animationDelay: '-7s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse,rgba(155,27,48,0.3)_0%,transparent_60%)] animate-mesh" style={{ animationDelay: '-14s' }} />
      </div>

      {/* Dark gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      {/* Subtle particle dots */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: '15%', left: '10%', delay: '0s', size: '4px' },
          { top: '25%', left: '80%', delay: '2s', size: '3px' },
          { top: '60%', left: '15%', delay: '4s', size: '5px' },
          { top: '70%', left: '70%', delay: '1s', size: '3px' },
          { top: '40%', left: '50%', delay: '3s', size: '4px' },
          { top: '80%', left: '40%', delay: '5s', size: '3px' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/30 animate-particle"
            style={{ top: p.top, left: p.left, animationDelay: p.delay, width: p.size, height: p.size }}
          />
        ))}
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 noise-bg" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-32 md:py-44 text-white">
        {/* Weather Widget — top right in hero */}
        <div className="absolute top-6 right-4 sm:right-6 z-10 flex flex-col items-end">
          <WeatherWidget />
        </div>

        <div className="max-w-2xl">
          <p className="text-base md:text-lg font-bold tracking-[0.15em] uppercase text-white/80 mb-5 glass inline-block px-4 py-1.5 rounded-full animate-fade-in-up">
            {t("hero.badge")}
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-extrabold leading-[1.02] mb-7 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] animate-fade-in-up" style={{ animationDelay: '150ms', letterSpacing: '-0.025em' }}>
            {t("hero.title1")}
            <br />
            <span className="text-[#F59E0B] drop-shadow-[0_2px_15px_rgba(212,168,83,0.4)]">{t("hero.title2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-12 leading-relaxed max-w-xl animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <Link
              href="/produkte"
              className="relative inline-flex items-center justify-center px-8 py-4 bg-white text-[#DC2626] font-bold rounded-2xl transition-all btn-hover btn-shimmer text-lg shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">{t("hero.cta1")}</span>
            </Link>
            <Link
              href="/partyplaner"
              className="relative inline-flex items-center justify-center px-8 py-4 border-2 border-[#F59E0B] text-white font-semibold rounded-2xl transition-all hover:bg-[#F59E0B]/20 text-lg overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">{t("hero.cta2")}</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in-up hidden md:flex" style={{ animationDelay: '1.2s' }}>
          <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#F59E0B]/40 to-transparent relative overflow-hidden">
            <div className="absolute inset-x-0 h-3 bg-[#F59E0B]/80 animate-scroll-line" />
          </div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FFF8F6] to-transparent" />
    </section>
  );
}
