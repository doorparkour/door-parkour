"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const FALLBACK_IMG = "/door-parkour-banner.jpg";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const items = useCart((s) => s.items);
  const cartQuantity = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const [imgSrc, setImgSrc] = useState(product.image_url || FALLBACK_IMG);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setImgSrc(FALLBACK_IMG);
    }
  }, []);

  const isOutOfStock = !product.on_demand && product.inventory === 0;
  const isCartFull = !product.on_demand && cartQuantity >= product.inventory;
  const showStock = !product.on_demand && product.inventory > 0;

  function handleAddToCart() {
    if (isCartFull) return;
    addItem({
      productId: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image_url: product.image_url,
      inventory: product.inventory,
      on_demand: product.on_demand,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <Card className="flex flex-col overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <div className="h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imgSrc}
          alt={product.name}
          className="h-full w-full object-cover object-center"
          onError={() => setImgSrc(FALLBACK_IMG)}
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
            <Badge className="shrink-0 text-xs bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900/40">
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
          disabled={isOutOfStock || isCartFull}
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
