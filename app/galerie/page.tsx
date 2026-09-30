import Image from "next/image";
import Link from "next/link";

import { EDITORIAL_IMAGES } from "@/data/cinematic-editorial";
import { galleryItems } from "@/data/gallery";

export default function GaleriePage() {
  return (
    <div>
      <header className="page-hero-banner py-16 md:py-24 text-center px-4">
        <nav aria-label="Brotkrumen" className="text-sm mb-6"><Link href="/">Home</Link> / Galerie</nav>
        <p className="text-sm uppercase tracking-widest mb-4">Unser Markt. Unsere Menschen.</p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Team Jammers</h1>
        <p className="max-w-2xl mx-auto">Persönliche Gesichter aus unserem Markt in Goch – für deine Getränke, deine Feier und deine Fragen.</p>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12" aria-labelledby="team-gallery-title">
        <figure className="m-0 max-w-4xl mx-auto mb-12">
          <Image src={EDITORIAL_IMAGES.group.image} alt={EDITORIAL_IMAGES.group.alt} sizes="(max-width: 768px) 100vw, 900px" className="block w-full h-auto" />
        </figure>
        <h2 id="team-gallery-title" className="mb-8 text-3xl font-bold">Menschen hinter Jammers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {galleryItems.filter((item) => item.image).map((item) => (
            <figure key={item.id} className="m-0">
              {item.image ? (
                <Image src={item.image} alt={item.alt} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="block w-full h-auto" />
              ) : null}
              <figcaption className="pt-4">
                <h3 className="font-bold text-xl">{item.title}</h3>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-current/20" aria-labelledby="gallery-instagram-title">
        <h2 id="gallery-instagram-title" className="text-2xl font-bold">Weitere Einblicke aus dem Markt</h2>
        <p className="my-4">Unsere Bilder und Geschichten auf Instagram.</p>
        <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="inline-flex px-6 py-3 bg-primary text-white font-bold rounded-xl">@trinkgutjammers_goch</a>
      </section>
    </div>
  );
}
