"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group bg-white rounded-2xl border border-border hover:border-primary/30 transition-all overflow-hidden flex flex-col card-hover-glow gradient-border">
      <Link href={`/produkte/${product.slug}`} className="block p-4 pb-2">
        <div className="aspect-square bg-gradient-to-br from-light to-gray-100 rounded-xl flex items-center justify-center overflow-hidden relative">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>

      <div className="p-4 pt-2 flex flex-col flex-1">
        <span className="text-xs text-muted uppercase tracking-wide font-medium">{product.category}</span>
        <Link href={`/produkte/${product.slug}`}>
          <h3 className="font-semibold text-secondary mt-1 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-muted mt-1">{product.unit}</p>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xl font-extrabold text-primary tracking-tight">{formatPrice(product.price)}</span>
          <button
            onClick={() => addItem(product)}
            className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-md hover:shadow-red-500/20"
          >
            + Warenkorb
          </button>
        </div>
      </div>
    </div>
  );
}
