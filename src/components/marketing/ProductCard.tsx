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
  const isOutOfStock = product.inventory === 0;

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
      <div className="aspect-square bg-gradient-to-br from-dp-teal/10 to-dp-orange/10 flex items-center justify-center">
        <span className="text-5xl">👕</span>
      </div>

      <CardContent className="flex-1 pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-dp-teal text-sm">{product.name}</h3>
          {isOutOfStock && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Out of stock
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
