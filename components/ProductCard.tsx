"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice, type Product } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { t } = useTranslation();
  const wishlisted = isInWishlist(product.id);

  return (
    <div className="group bg-white rounded-2xl border border-[#F0D5CF] hover:border-[#DC2626]/40 transition-all overflow-hidden flex flex-col card-hover-glow gradient-border">
      <Link href={`/produkte/${product.slug}`} className="block p-4 pb-2">
        <div className="aspect-square bg-gradient-to-br from-[#FFF8F6] to-[#FFF0EC] rounded-xl flex items-center justify-center overflow-hidden relative">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleItem(product); }}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all"
            aria-label={wishlisted ? "Vom Merkzettel entfernen" : "Zum Merkzettel"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${wishlisted ? "text-[#DC2626] fill-[#DC2626]" : "text-gray-400 hover:text-[#DC2626]"}`} viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={wishlisted ? 0 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {/* Category badge */}
        </div>
      </Link>

      <div className="p-4 pt-2 flex flex-col flex-1">
        <span className="inline-block text-xs text-white uppercase tracking-wide font-medium bg-[#DC2626] px-2 py-0.5 rounded-md w-fit">{product.category}</span>
        <Link href={`/produkte/${product.slug}`}>
          <h3 className="font-semibold text-[#1F2937] mt-1.5 group-hover:text-[#DC2626] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted mt-1">{product.unit}</p>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xl font-extrabold gold-price tracking-tight">{formatPrice(product.price)}</span>
          <button
            onClick={() => addItem(product)}
            className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer btn-shimmer shadow-sm hover:shadow-md hover:shadow-red-500/20"
          >
            {t("btn.warenkorb")}
          </button>
        </div>
      </div>
    </div>
  );
}
