"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";
import productsData from "@/data/products.json";
import ProductGrid from "@/components/ProductGrid";
import { useState } from "react";

const products = productsData as Product[];

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.slug === slug);

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

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        <div className="bg-light rounded-2xl flex items-center justify-center p-8 relative aspect-square">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-8" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 bg-light text-muted text-xs font-medium rounded-full mb-3">{product.category}</span>
          <h1 className="text-3xl font-bold text-secondary mb-2">{product.name}</h1>
          <p className="text-muted mb-1">{product.unit}</p>
          <p className="text-xs text-muted mb-6">EAN: {product.ean}</p>
          <p className="text-muted leading-relaxed mb-8">{product.description}</p>

          <div className="text-3xl font-bold text-primary mb-6">{formatPrice(product.price)}</div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-light transition-colors font-bold">-</button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-light transition-colors font-bold">+</button>
            </div>
            <button onClick={() => addItem(product, quantity)} className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg">
              In den Warenkorb
            </button>
          </div>

          {product.inStock ? (
            <p className="text-sm text-green-600 font-medium">✓ Auf Lager</p>
          ) : (
            <p className="text-sm text-red-500 font-medium">Nicht verfügbar</p>
          )}
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
