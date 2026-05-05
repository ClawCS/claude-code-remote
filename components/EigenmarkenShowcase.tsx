"use client";

import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import { eigenmarken } from "@/data/eigenmarken";

export default function EigenmarkenShowcase() {
  return (
    <section className="relative py-20 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#F59E0B] mb-2">
            Exklusiv bei uns
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white section-accent-center" style={{ textWrap: "balance" }}>
            Unsere Eigenmarken
          </h2>
          <p className="text-white/60 mt-3 max-w-xl mx-auto">
            Sechs Liköre — nur bei Trinkgut Jammers erhältlich
          </p>
        </ScrollReveal>

        {/* Mobile: horizontal scroll. Desktop: grid */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
          {eigenmarken.map((likoer, i) => (
            <ScrollReveal key={likoer.slug} delay={i * 100} className="snap-center flex-shrink-0 w-[180px] sm:w-auto">
              <Link
                href={`/eigenmarke#${likoer.slug}`}
                className="group relative block rounded-2xl overflow-hidden border border-white/5 hover:border-[#F59E0B]/40 shadow-2xl shadow-black/40 hover:shadow-[0_0_32px_rgba(245,158,11,0.2)] transition-all duration-300 aspect-[2/3] hover:-translate-y-1"
              >
                <Image
                  src={likoer.posterImage}
                  alt={likoer.name}
                  fill
                  sizes="(max-width: 640px) 180px, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  unoptimized
                />

                {/* ABV pill — top right */}
                <span className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold text-[#1A1A1A] bg-[#F59E0B] rounded-full shadow-md">
                  {likoer.abv}% Vol.
                </span>

                {/* Bottom gradient + name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent pt-16 pb-4 px-3 text-center">
                  <p className="font-extrabold text-white text-sm drop-shadow-lg">
                    {likoer.name}
                  </p>
                  <p className="text-[#F59E0B] text-[11px] mt-0.5 opacity-80">
                    {likoer.flavor}
                  </p>
                  <div className="mx-auto w-0 group-hover:w-8 h-px bg-[#F59E0B] mt-2 transition-all duration-500" />
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/eigenmarke"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#1A1A1A] font-bold rounded-xl transition-all"
          >
            Alle Eigenmarken entdecken
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
