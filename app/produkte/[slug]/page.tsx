"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { assortmentProducts as products } from "@/lib/catalog";
import ProductGrid from "@/components/ProductGrid";
import { useState } from "react";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [imgFailed, setImgFailed] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  const product = products.find((p) => p.slug === slug);
  const hasPhoto = Boolean(product?.image) && product?.image !== "/images/home/brand-logo.webp";

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-secondary mb-2">Produkt nicht gefunden</h1>
        <Link href="/produkte" className="text-primary hover:underline">Zurück zu allen Produkten</Link>
      </div>
    );
  }

  const related = products.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-sm text-muted mb-6 flex gap-2 flex-wrap">
        <Link href="/" className="hover:text-primary">Start</Link><span>/</span>
        <Link href="/produkte" className="hover:text-primary">Produkte</Link><span>/</span>
        <Link href={`/kategorie/${product.categorySlug}`} className="hover:text-primary">{product.category}</Link><span>/</span>
        <span className="text-secondary">{product.name}</span>
      </nav>

      <div className={`grid ${hasPhoto ? "md:grid-cols-2" : "max-w-3xl"} gap-10 mb-16`}>
        {hasPhoto && <div className="bg-light rounded-2xl flex items-center justify-center p-8 relative aspect-square">
          {imgFailed ? (
            <p className="text-muted">Produktfoto nicht verfügbar</p>
          ) : (
            <Image
              src={triedFallback && product.extractedImage ? product.extractedImage : product.image}
              alt={product.image === "/images/home/brand-logo.webp" ? "Trinkgut Jammers – Produktfoto folgt" : product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-8"
              onError={() => {
                if (!triedFallback && product.extractedImage) {
                  setTriedFallback(true);
                } else {
                  setImgFailed(true);
                }
              }}
            />
          )}
        </div>}

        <div>
          <span className="inline-block px-3 py-1 bg-light text-muted text-xs font-medium rounded-full mb-3">{product.category}</span>
          <h1 className="text-3xl font-bold text-secondary mb-2">{product.name}</h1>
          {product.unit && <p className="text-muted mb-1">{product.unit}</p>}
          {!hasPhoto && <p className="text-sm text-muted mb-3">Sortimentsbeispiel; die konkrete Produktabbildung folgt.</p>}
          {product.ean && <p className="text-xs text-muted mb-6">EAN: {product.ean}</p>}
          <p className="text-muted leading-relaxed mb-8">{product.description}</p>

          <p className="text-sm text-muted mb-6">Sortimentsbeispiel. Aktuellen Preis und Verfügbarkeit bestätigen wir persönlich. Datierte Wochenangebote findest du im Handzettel.</p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button aria-label="Menge verringern" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-light transition-colors font-bold">-</button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
              <button aria-label="Menge erhöhen" onClick={() => setQuantity(Math.min(999, quantity + 1))} className="px-3 py-2 hover:bg-light transition-colors font-bold">+</button>
            </div>
            <button onClick={() => addItem(product, quantity)} className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg">
              Zur Anfrageliste hinzufügen
            </button>
          </div>

          <p className="text-sm text-muted">Noch keine Bestellung oder verbindliche Reservierung.</p>
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-secondary mb-6">Ähnliche Produkte</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
