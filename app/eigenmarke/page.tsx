import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { eigenmarken } from "@/data/eigenmarken";

export const metadata: Metadata = {
  title: "Unsere Eigenmarken — 6 exklusive Liköre | Trinkgut Jammers",
  description: "Sechs handwerklich kuratierte Eigenmarken-Liköre — exklusiv bei Trinkgut Jammers in Goch. Pralle Kirsche, Dicke Nüsse, Süsse Sünde, Caramello, Schwarzer Teufel und Weisser Engel.",
};

export default function EigenmarkePage() {
  return (
    <>
      {/* Hero — auf Schiefer */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.10)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#DC2626] mb-4">
            Trinkgut Jammers Edition · Seit 2024
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-tight">
            <span className="bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#DC2626] bg-clip-text text-transparent">
              Unsere Eigenmarken
            </span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Sechs Liköre. Sechs Geschmäcker. Eine Familie.
          </p>
          <div className="mx-auto w-20 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/60 to-transparent mt-8" />
        </div>
      </section>

      {/* Übersichts-Komposition */}
      <section className="relative pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative aspect-[3/2] rounded-3xl overflow-hidden border border-white/5 shadow-2xl shadow-black/60">
            <Image
              src="/images/eigenmarken/uebersicht.png"
              alt="Alle 6 Eigenmarken-Liköre im Überblick"
              fill
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        </div>
      </section>

      {/* Anchor-Navigation Pills */}
      <section className="relative py-8 sticky top-16 z-30 backdrop-blur-md bg-[#1A1A1A]/60 border-y border-[#DC2626]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {eigenmarken.map((likoer) => (
              <a
                key={likoer.slug}
                href={`#${likoer.slug}`}
                className="flex-shrink-0 px-4 py-2 text-xs font-bold rounded-full border border-white/10 hover:border-[#DC2626]/60 text-white/70 hover:text-white hover:bg-[#DC2626] transition-all whitespace-nowrap"
              >
                <span className="mr-1">{likoer.emoji}</span>
                {likoer.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 6 Produkt-Sektionen — jeweils volles Bild + minimaler Begleittext */}
      {eigenmarken.map((likoer, i) => (
        <section
          key={likoer.slug}
          id={likoer.slug}
          className="relative py-16 md:py-24 scroll-mt-32"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/25 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <p
                className="text-xs font-bold tracking-[0.25em] uppercase mb-2"
                style={{ color: likoer.accentColor }}
              >
                Edition #{String(i + 1).padStart(2, "0")} · {likoer.flavor}
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {likoer.name}
              </h2>
            </div>

            {/* Vollbild Marketing-Karte */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative aspect-[707/1000] rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-black/60">
                <Image
                  src={likoer.image}
                  alt={`${likoer.name} — ${likoer.flavor}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                  unoptimized
                  priority={i < 2}
                />
              </div>

              {/* Akzent-Glow hinter der Karte */}
              <div
                className="absolute -inset-4 -z-10 rounded-3xl opacity-30 blur-2xl"
                style={{ background: `radial-gradient(ellipse at center, ${likoer.accentColor}40 0%, transparent 70%)` }}
              />
            </div>

            {/* Bilingual-Beschreibung unter dem Bild */}
            <div className="grid md:grid-cols-2 gap-6 mt-10 max-w-3xl mx-auto">
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="text-base">🇩🇪</span> Geschmack
                </p>
                <p className="text-white/85 leading-relaxed text-sm">{likoer.descriptionDE}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="text-base">🇳🇱</span> Smaak
                </p>
                <p className="text-white/65 leading-relaxed text-sm italic">{likoer.descriptionNL}</p>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Akademie-Cross-Link */}
      <section className="relative py-20 md:py-24">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/25 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/akademie/likoere"
            className="group block bg-gradient-to-br from-[#1F1F1F] via-[#2A0F0F] to-[#0F0F0F] border border-[#DC2626]/30 hover:border-[#DC2626]/60 rounded-2xl p-8 md:p-10 text-center shadow-2xl shadow-black/40 hover:shadow-[0_0_40px_rgba(220,38,38,0.2)] transition-all hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#DC2626] mb-3">
              Trinkgut Akademie
            </p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 group-hover:text-[#F59E0B] transition-colors">
              Werde zum Likör-Experten
            </h3>
            <p className="text-white/60 max-w-lg mx-auto mb-6">
              20 Lektionen, eine Abschlussprüfung — alles was du über Liköre wissen musst.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all">
              Zum Kurs
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
