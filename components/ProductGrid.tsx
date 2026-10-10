"use client";
import styles from "@/components/editorial/tools.module.css";
import editorial from "@/components/editorial/editorial.module.css";

import type { Product } from "@/lib/utils";
import ProductCard from "./ProductCard";
import { useTranslation } from "@/lib/i18n";

export default function ProductGrid({ products, headingLevel = 3 }: { products: Product[]; headingLevel?: 2 | 3 }) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <div role="status" className={editorial.emptyState}>
        <p className="text-lg">{t("productGrid.empty")}</p>
      </div>
    );
  }

  return (
    <div className={styles.productGrid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} headingLevel={headingLevel} />
      ))}
    </div>
  );
}
