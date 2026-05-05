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
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        {/* Subtle gold radial backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#F59E0B] mb-4">
            Trinkgut Jammers Edition
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

      {/* 6 Produkt-Sektionen, alternierend */}
      {eigenmarken.map((likoer, i) => {
        const reverse = i % 2 === 1;
        return (
          <section
            key={likoer.slug}
            id={likoer.slug}
            className="relative py-16 md:py-24 scroll-mt-20"
          >
            {/* Top-Divider Goldlinie */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/25 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className={`grid md:grid-cols-12 gap-8 md:gap-12 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                {/* Spalte: Poster */}
                <div className="md:col-span-5">
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-black/60">
                    <Image
                      src={likoer.posterImage}
                      alt={`${likoer.name} — Poster`}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                      unoptimized
                      priority={i < 2}
                    />
                  </div>
                </div>

                {/* Spalte: Inhalt */}
                <div className="md:col-span-7">
                  <p
                    className="text-sm font-semibold tracking-widest uppercase mb-2"
                    style={{ color: likoer.accentColor }}
                  >
                    Edition #{String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                    {likoer.name}
                  </h2>
                  <p
                    className="text-xl italic mb-5"
                    style={{ color: likoer.accentColor, fontFamily: "cursive" }}
                  >
                    {likoer.tagline}
                  </p>

                  {/* Spec-Pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                      {likoer.abv}% Vol.
                    </span>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/10 text-white/80 border border-white/15">
                      {likoer.volume} ml
                    </span>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/10 text-white/80 border border-white/15">
                      {likoer.flavor}
                    </span>
                  </div>

                  {/* Beschreibung DE */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="text-base">🇩🇪</span> Geschmack
                    </p>
                    <p className="text-white/85 leading-relaxed">{likoer.descriptionDE}</p>
                  </div>

                  {/* Beschreibung NL */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="text-base">🇳🇱</span> Smaak
                    </p>
                    <p className="text-white/65 leading-relaxed text-sm italic">{likoer.descriptionNL}</p>
                  </div>

                  {/* Floating Detail-Card (helles Bild) */}
                  <div className="relative inline-block mt-2">
                    <div
                      className="relative w-40 md:w-48 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl shadow-black/50 border-2 border-[#F59E0B]/20 hover:border-[#F59E0B]/60 transition-all duration-300 hover:rotate-0"
                      style={{ transform: reverse ? "rotate(2deg)" : "rotate(-2deg)" }}
                    >
                      <Image
                        src={likoer.detailImage}
                        alt={`${likoer.name} — Produktkarte`}
                        fill
                        sizes="200px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-white/40 text-xs mt-3 max-w-[200px]">
                      Scanne den QR-Code auf der Karte für Cocktail-Rezepte
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Akademie-Cross-Link */}
      <section className="relative py-20 md:py-24">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/25 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/akademie/likoere"
            className="group block bg-gradient-to-br from-[#1F1F1F] to-[#0F0F0F] border border-[#F59E0B]/20 hover:border-[#F59E0B]/50 rounded-2xl p-8 md:p-10 text-center shadow-2xl shadow-black/40 transition-all hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#F59E0B] mb-3">
              Trinkgut Akademie
            </p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 group-hover:text-[#F59E0B] transition-colors">
              Werde zum Likör-Experten
            </h3>
            <p className="text-white/60 max-w-lg mx-auto mb-6">
              20 Lektionen, eine Abschlussprüfung — alles was du über Liköre wissen musst.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#1A1A1A] font-bold rounded-xl group-hover:bg-[#FBBF24] transition-colors">
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
