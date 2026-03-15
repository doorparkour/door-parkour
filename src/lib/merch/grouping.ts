import type { Database } from "@/lib/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];

export type ProductWithVariants = Product & {
  product_variants: ProductVariant[];
};

export function groupProducts(products: ProductWithVariants[]) {
  const apparel = new Map<string, ProductWithVariants[]>();
  const accessories: ProductWithVariants[] = [];
  for (const p of products) {
    const hasSizedVariants = p.product_variants?.some((v) => v.size != null);
    if (hasSizedVariants) {
      const list = apparel.get(p.name) ?? [];
      list.push(p);
      apparel.set(p.name, list);
    } else {
      accessories.push(p);
    }
  }
  return { apparel, accessories };
}
