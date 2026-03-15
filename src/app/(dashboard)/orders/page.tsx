import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import OrderSuccessHandler from "@/components/marketing/OrderSuccessHandler";

export const metadata: Metadata = { title: "My Orders" };

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800",
  paid: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800",
  fulfilled: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800",
  cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800",
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const showAll = filter === "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("orders")
    .select("*, order_items(quantity, unit_price_cents, products(name, image_url))")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (!showAll) {
    query = query.in("status", ["paid", "fulfilled"]);
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-6">
      <Suspense>
        <OrderSuccessHandler />
      </Suspense>
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your merch order history.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex rounded-lg border p-1 gap-1 bg-muted/30">
          <Link href="/orders">
            <span
              className={`inline-block rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                !showAll
                  ? "bg-card text-dp-teal shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Recent
            </span>
          </Link>
          <Link href="/orders?filter=all">
            <span
              className={`inline-block rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                showAll
                  ? "bg-card text-dp-teal shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </span>
          </Link>
        </div>

        {(orders?.length ?? 0) > 0 && (
          <Link href="/merch">
            <Button
              size="sm"
              className="bg-dp-orange text-white hover:bg-dp-orange-dark"
            >
              Browse Merch
            </Button>
          </Link>
        )}
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {showAll ? "No orders yet." : "No recent orders."}
            </p>
            {showAll ? (
              <Link href="/merch">
                <Button
                  size="sm"
                  className="bg-dp-orange text-white hover:bg-dp-orange-dark"
                >
                  Browse Merch
                </Button>
              </Link>
            ) : (
              <Link href="/orders?filter=all">
                <Button size="sm" variant="outline">
                  View all orders
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                  <CardTitle className="text-sm text-muted-foreground font-normal">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(order.created_at))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-dp-teal">
                    {formatPrice(order.total_cents)}
                  </span>
                  <Badge
                    className={`${statusColors[order.status] ?? ""} hover:${statusColors[order.status]}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-sm">
                  {(
                    order.order_items as Array<{
                      quantity: number;
                      unit_price_cents: number;
                      products: { name: string; image_url: string | null } | null;
                    }>
                  )?.map((item, i) => (
                    <li key={i} className="flex items-center justify-between py-2">
                      <span className="text-foreground">
                        {item.products?.name ?? "Product"} × {item.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        {formatPrice(item.unit_price_cents * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
