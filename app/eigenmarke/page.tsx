import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { eigenmarken } from "@/data/eigenmarken";
import ShimmerParticles from "@/components/ShimmerParticles";

export const metadata: Metadata = {
  title: "Unsere Eigenmarken — 6 exklusive Liköre | Trinkgut Jammers",
  description: "Sechs handwerklich kuratierte Eigenmarken-Liköre — exklusiv bei Trinkgut Jammers in Goch.",
};

export default function EigenmarkePage() {
  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <ShimmerParticles />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Unsere Eigenmarken</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Unsere Eigenmarken</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          {eigenmarken.length} exklusive Liköre — nur bei Trinkgut Jammers erhältlich.
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {eigenmarken.map((likoer) => (
          <div
            key={likoer.slug}
            id={likoer.slug}
            className="group relative bg-white border border-border rounded-2xl overflow-hidden card-hover scroll-mt-24"
          >
            <div className="relative aspect-[707/1000] overflow-hidden">
              <Image
                src={likoer.image}
                alt={`${likoer.name} — ${likoer.flavor}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-secondary">{likoer.name}</h2>
              <p className="text-sm text-muted mt-1">{likoer.flavor} · {likoer.abv}% Vol. · {likoer.volume} ml</p>
              <p className="text-sm text-muted leading-relaxed mt-3">{likoer.descriptionDE}</p>
              <p className="text-xs text-muted leading-relaxed mt-2 italic">🇳🇱 {likoer.descriptionNL}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Akademie Cross-Link */}
      <div className="mt-12 bg-gradient-to-r from-secondary to-gray-800 rounded-2xl p-8 text-white text-center">
        <span className="text-4xl block mb-3">🎓</span>
        <h2 className="text-2xl font-bold mb-2">Werde zum Likör-Experten</h2>
        <p className="text-white/80 max-w-lg mx-auto mb-5">
          20 Lektionen, eine Abschlussprüfung — alles was du über Liköre wissen musst.
        </p>
        <Link
          href="/akademie/likoere"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          Zum Likör-Kurs →
        </Link>
      </div>
    </div>
    </>
  );
}
