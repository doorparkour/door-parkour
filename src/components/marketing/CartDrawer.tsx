"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Loader2, Plus, Minus } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { items, removeItem, updateQuantity, totalItems, totalCents, clearCart } =
    useCart();

  async function handleCheckout() {
    setLoading(true);

    const res = await fetch("/api/checkout/merch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }),
    });

    if (res.status === 401) {
      setLoading(false);
      setOpen(false);
      router.push("/login?redirectTo=/merch");
      return;
    }

    const data = await res.json();
    if (!res.ok || !data.url) {
      toast.error("Checkout failed", {
        description: data.error ?? "Please try again.",
      });
      setLoading(false);
      return;
    }

    clearCart();
    window.location.href = data.url;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative gap-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {totalItems() > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-dp-orange text-[10px] font-bold text-white">
              {totalItems()}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart ({totalItems()} items)</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Your cart is empty.</p>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto py-4">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-md bg-dp-teal/10 flex items-center justify-center shrink-0">
                    <span className="text-2xl">👕</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price_cents)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="rounded p-0.5 hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="rounded p-0.5 hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold">
                      {formatPrice(item.price_cents * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-4 border-t pt-4">
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(totalCents())}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-dp-orange text-white hover:bg-dp-orange-dark"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Checkout — {formatPrice(totalCents())}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
