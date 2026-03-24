"use client";

import type { Product } from "@/lib/utils";
import ProductCard from "./ProductCard";
import { useTranslation } from "@/lib/i18n";

export default function ProductGrid({ products }: { products: Product[] }) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-5xl mb-4">{"\u{1F50D}"}</p>
        <p className="text-lg">{t("productGrid.empty")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
