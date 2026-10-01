"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { type Product } from "@/lib/utils";

export default function ProductCard({ product, headingLevel = 3 }: { product: Product; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);
  const [imgSrc, setImgSrc] = useState(product.image);
  const [imgFailed, setImgFailed] = useState(false);
  const hasPhoto = Boolean(product.image) && product.image !== "/images/home/brand-logo.webp";

  const handleImageError = () => {
    if (imgSrc === product.image && product.extractedImage) setImgSrc(product.extractedImage);
    else setImgFailed(true);
  };

  return (
    <article data-product-card className={`group relative bg-[#FFFDFA] rounded-xl border border-[#DFD2C5] hover:border-[#E20F1D] transition-colors overflow-hidden flex flex-col ${hasPhoto ? "" : "product-text-card"}`}>
      <button type="button" onClick={() => toggleItem(product)}
        className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full border border-[#DFD2C5] hover:border-[#E20F1D]"
        aria-label={wishlisted ? "Vom Merkzettel entfernen" : "Zum Merkzettel"} aria-pressed={wishlisted}>
        <svg aria-hidden="true" className={`h-5 w-5 ${wishlisted ? "text-[#E20F1D]" : "text-gray-500"}`} viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
      {hasPhoto && <Link href={`/produkte/${product.slug}`} className="block p-5 pb-2">
        <div className="aspect-square bg-white rounded-lg flex items-center justify-center overflow-hidden relative">
          {imgFailed ? <p className="text-sm text-muted">Produktfoto nicht verfügbar</p> :
            <Image src={imgSrc} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-contain p-3" onError={handleImageError} />}
        </div>
      </Link>}
      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs text-[#A51522] uppercase tracking-wide font-semibold w-fit pr-10">{product.category}</span>
        <Link href={`/produkte/${product.slug}`}>
          <Heading className="font-semibold text-[#302923] mt-2 pr-8 group-hover:text-[#E20F1D] transition-colors">{product.name}</Heading>
        </Link>
        <p className="text-sm text-muted mt-1">{product.unit}</p>
        {!hasPhoto && <p data-photo-missing className="text-xs text-muted mt-2">Sortimentsbeispiel · konkrete Abbildung folgt</p>}
        <div className="mt-auto pt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Preis auf Anfrage</span>
          <button type="button" onClick={() => addItem(product)} className="px-4 py-2 bg-[#E20F1D] hover:bg-[#A51522] text-white text-sm font-semibold rounded-lg transition-colors">Anfragen</button>
        </div>
      </div>
    </article>
  );
}
