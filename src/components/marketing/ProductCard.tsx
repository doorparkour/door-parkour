"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);

  // on_demand = always orderable, no stock badge
  // limited supply = show count when > 0, block + badge when 0
  const isOutOfStock = !product.on_demand && product.inventory === 0;
  const showStock = !product.on_demand && product.inventory > 0;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image_url: product.image_url,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <Card className="flex flex-col overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <div className="h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url || "/door-parkour-banner.jpg"}
          alt={product.name}
          className="h-full w-full object-cover object-center"
          onError={(e) => { e.currentTarget.src = "/door-parkour-banner.jpg"; }}
        />
      </div>

      <CardContent className="flex-1 pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-dp-teal text-sm">{product.name}</h3>
          {isOutOfStock && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Out of stock
            </Badge>
          )}
          {showStock && (
            <Badge className="shrink-0 text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              {product.inventory} left
            </Badge>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <span className="font-bold text-dp-teal">
          {formatPrice(product.price_cents)}
        </span>
        <Button
          size="sm"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="bg-dp-orange text-white hover:bg-dp-orange-dark gap-1.5"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
