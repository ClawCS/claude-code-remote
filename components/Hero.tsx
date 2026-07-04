"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import WeatherWidget from "./WeatherWidget";

/** Zählt beim ersten Sichtbarwerden von 0 auf das Ziel hoch (respektiert reduzierte Bewegung). */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    let started = false;
    const run = (startTs: number) => {
      const step = (ts: number) => {
        const p = Math.min(1, (ts - startTs) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          raf = requestAnimationFrame(run);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return { value, ref };
}

export default function Hero() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { value: marktCount, ref: marktRef } = useCountUp(7000);

  // Dezenter Maus-Parallax auf Hintergrund & Glow (nur Desktop, ohne reduzierte Bewegung)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    let frame = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-cinematic relative overflow-hidden min-h-[640px] md:min-h-[780px] bg-[#0E0A0B]"
    >
      {/* Cinematic background image mit dezentem Parallax */}
      <div className="hero-parallax absolute inset-0 scale-110">
        <Image
          src="/images/gallery/team-gruppenfoto.jpg"
          alt="Trinkgut Jammers Markt in Goch"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-40"
          priority
        />
      </div>

      {/* Cinematic gradient grading — dunkel, tief, ein Rot */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0E0A0B]/95 via-[#3A0A14]/85 to-[#7A1428]/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0708] via-transparent to-[#0E0A0B]/60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,transparent,rgba(0,0,0,0.6))]" />

      {/* Ein einziger warmer Glow, folgt subtil der Maus */}
      <div className="hero-glow absolute bottom-[-10%] left-[10%] w-[720px] h-[720px] max-w-[90vw] bg-[radial-gradient(ellipse,rgba(220,38,38,0.28)_0%,transparent_68%)] pointer-events-none" />
      <div className="hero-glow-gold absolute top-[-15%] right-[-5%] w-[520px] h-[520px] max-w-[80vw] bg-[radial-gradient(ellipse,rgba(200,150,44,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Feine Körnung */}
      <div className="absolute inset-0 noise-bg opacity-[0.4]" />

      {/* Reduzierte, ruhige Gold-Partikel — nur eine Zone */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none hero-particle"
          style={{
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            background: "rgba(200, 150, 44, 0.55)",
            left: `${8 + (i * 11) % 44}%`,
            bottom: `${12 + (i * 9) % 40}%`,
            boxShadow: "0 0 8px rgba(200, 150, 44, 0.4)",
            animation: `particleFloat ${6 + (i % 3) * 2}s ease-in-out ${(i * 0.7) % 4}s infinite`,
          }}
        />
      ))}

      {/* Übergang vom dunklen Header */}
      <div className="absolute top-0 left-0 right-0 h-[180px] bg-gradient-to-b from-[#1A1A1A] via-[#1A1A1A]/60 to-transparent pointer-events-none z-[1]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C8962C]/40 to-transparent z-[2]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28 md:py-40 text-white">
        {/* Weather Widget */}
        <div className="absolute top-6 right-4 sm:right-6 z-10 flex flex-col items-end">
          <WeatherWidget />
        </div>

        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-[#C8962C] to-transparent" />
              <span className="text-xs font-semibold tracking-[0.3em] uppercase text-[#E0B24C]">
                {t("hero.badge")}
              </span>
            </div>
          </div>

          {/* Headline — eine ruhige Farbe + ein Gold-Akzentwort */}
          <h1
            className="text-5xl md:text-7xl lg:text-[5.25rem] font-bold leading-[1.02] mb-6 animate-fade-in-up"
            style={{ animationDelay: "120ms", letterSpacing: "-0.03em" }}
          >
            <span className="text-white">{t("hero.title1")}</span>
            <br />
            <span className="hero-accent-word">{t("hero.title2")}</span>
          </h1>

          {/* Subtitle — höherer Kontrast */}
          <p
            className="text-lg md:text-xl text-white/75 mb-10 leading-relaxed max-w-lg animate-fade-in-up"
            style={{ animationDelay: "280ms" }}
          >
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "460ms" }}>
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

          {/* Trust badges — mit animiertem Zähler & besserem Kontrast */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-14 animate-fade-in-up" style={{ animationDelay: "640ms" }}>
            <div className="flex items-center gap-2">
              <span ref={marktRef} className="text-xl font-extrabold text-white tabular-nums">
                {marktCount.toLocaleString("de-DE")}+
              </span>
              <span className="text-xs text-white/70 uppercase tracking-wider">im Markt</span>
            </div>
            <div className="h-6 w-px bg-white/15" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-white">4,6★</span>
              <span className="text-xs text-white/70 uppercase tracking-wider">Google</span>
            </div>
            <div className="h-6 w-px bg-white/15" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-white">Seit 2024</span>
              <span className="text-xs text-white/70 uppercase tracking-wider">Für euch da</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex-col items-center gap-2 animate-fade-in-up hidden md:flex" style={{ animationDelay: "1s" }}>
          <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#C8962C]/50 to-transparent relative overflow-hidden">
            <div className="absolute inset-x-0 h-3 bg-[#C8962C] animate-scroll-line" />
          </div>
        </div>
      </div>

      {/* Bottom gradient transition to VideoHero (black) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}
