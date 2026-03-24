import type { Product } from "@/lib/utils";

/**
 * Returns IDs of products eligible for the follower discount.
 * The first 5 highlight products get the discount.
 */
export function getFollowerDiscountIds(products: Product[]): number[] {
  const highlights = products.filter((p) => p.highlight);
  return highlights.slice(0, 5).map((p) => p.id);
}
