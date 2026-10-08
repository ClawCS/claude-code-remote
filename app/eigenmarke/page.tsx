import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { eigenmarken } from "@/data/eigenmarken";
import AcademyEntry from "@/components/AcademyEntry";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";

export const metadata: Metadata = {
  title: "Unsere Eigenmarken — 6 exklusive Liköre",
  description: "Sechs handwerklich kuratierte Eigenmarken-Liköre — exklusiv bei Trinkgut Jammers in Goch.",
};

export default function EigenmarkePage() {
  const photo = GOOGLE_MARKET_PHOTOS.ownBrands;
  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> <span className="text-white">Unsere Eigenmarken</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Unsere Eigenmarken</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          {eigenmarken.length} exklusive Liköre — nur bei Trinkgut Jammers erhältlich.
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <section className="grid md:grid-cols-2 gap-8 items-center mb-12" aria-labelledby="own-brand-bottles">
        <div><h2 id="own-brand-bottles" className="text-3xl font-bold mb-4">Sechs eigene Charaktere.</h2>
          <p className="max-w-xl">Unsere Eigenmarken zusammen im Bild. Von Kirsche und Haselnuss bis zu Lakritz und Anis: Unter dem Foto findest du die sechs Liköre mit ihren originalen Motiven.</p>
        </div>
        <figure className="category-photo"><Image src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} sizes="(max-width: 768px) 90vw, 320px" loading="lazy" /><figcaption>{photo.caption}</figcaption></figure>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {eigenmarken.map((likoer) => (
          <div
            key={likoer.slug}
            id={likoer.slug}
            className="group relative bg-white border border-border rounded-2xl overflow-hidden card-hover scroll-mt-24"
          >
            <div className="relative aspect-[707/1000] bg-[#fff8ee]">
              <Image
                src={likoer.image}
                alt={`${likoer.name} — ${likoer.flavor}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain"
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

      <AcademyEntry category="eigenmarke" />
    </div>
    </>
  );
}
