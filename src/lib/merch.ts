import type { Database } from "@/lib/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export function groupProducts(products: Product[]) {
  const apparel = new Map<string, Product[]>();
  const accessories: Product[] = [];
  for (const p of products) {
    if (p.size) {
      const list = apparel.get(p.name) ?? [];
      list.push(p);
      apparel.set(p.name, list);
    } else {
      accessories.push(p);
    }
  }
  return { apparel, accessories };
}
