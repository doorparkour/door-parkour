import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import ProductCard from "@/components/marketing/ProductCard";
import ApparelProductCard from "@/components/marketing/ApparelProductCard";
import CartDrawer from "@/components/marketing/CartDrawer";

export const metadata: Metadata = {
  title: "Merch",
  description: "Door Parkour gear — represent Door County's parkour community.",
};

export const revalidate = 300;

type Product = Database["public"]["Tables"]["products"]["Row"];

function groupProducts(products: Product[]) {
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

export default async function MerchPage() {
  const supabase = await createClient();

  const [
    { data: products, error },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  if (error) {
    console.error("Failed to load products:", error.message);
  }

  const { data: profile } =
    user != null
      ? await supabase
          .from("profiles")
          .select("shirt_size")
          .eq("id", user.id)
          .single()
      : { data: null };

  const { apparel, accessories } = groupProducts(products ?? []);
  const apparelGroups = Array.from(apparel.entries());

  return (
    <>
      <section className="bg-dp-teal py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-end justify-between">
          <div>
            <Badge className="mb-4 bg-dp-orange/20 text-dp-orange border-dp-orange/30 hover:bg-dp-orange/20">
              Merch
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Door Parkour Gear
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">
              Rep Door County&apos;s parkour community. Every purchase supports
              the program.
            </p>
          </div>
          <CartDrawer />
        </div>
      </section>

      <section className="bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
              <h2 className="mt-4 text-xl font-semibold text-dp-teal">
                Merch updates coming soon
              </h2>
              <p className="mt-2 text-muted-foreground">
                Check back for Door Parkour gear updates.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {apparelGroups.map(([name, variants]) => (
                <ApparelProductCard
                  key={name}
                  products={variants}
                  defaultSize={profile?.shirt_size ?? null}
                />
              ))}
              {accessories.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
