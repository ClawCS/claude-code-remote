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
          <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">
            Exklusiv bei uns
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white section-accent-center" style={{ textWrap: "balance" }}>
            Unsere Eigenmarken
          </h2>
          <p className="text-white/60 mt-3 max-w-xl mx-auto">
            Sechs Liköre — nur bei Trinkgut Jammers erhältlich
          </p>
        </ScrollReveal>

        {/* Mobile: horizontal scroll. Desktop: grid mit 3 oben / 3 unten */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
          {eigenmarken.map((likoer, i) => (
            <ScrollReveal key={likoer.slug} delay={i * 80} className="snap-center flex-shrink-0 w-[260px] sm:w-auto">
              <Link
                href={`/eigenmarke#${likoer.slug}`}
                className="group relative block rounded-2xl overflow-hidden border border-white/5 hover:border-[#DC2626]/50 shadow-2xl shadow-black/40 hover:shadow-[0_0_32px_rgba(220,38,38,0.3)] transition-all duration-300 aspect-[707/1000] hover:-translate-y-2"
              >
                <Image
                  src={likoer.image}
                  alt={`${likoer.name} — ${likoer.flavor}`}
                  fill
                  sizes="(max-width: 640px) 260px, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  unoptimized
                />

                {/* Subtle hover glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#DC2626]/0 to-[#DC2626]/0 group-hover:from-[#DC2626]/15 transition-colors duration-300 pointer-events-none" />

                {/* Bottom CTA-Pill on hover */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 whitespace-nowrap">
                    Mehr erfahren
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/eigenmarke"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all"
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
