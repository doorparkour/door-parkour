import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ApproveOrderRefundButton from "@/components/admin/ApproveOrderRefundButton";
import RejectOrderRefundButton from "@/components/admin/RejectOrderRefundButton";
import RefundRequestDetailModal from "@/components/admin/RefundRequestDetailModal";

export const metadata: Metadata = { title: "Admin — Refund Requests" };

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function AdminRefundRequestsPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("refund_requests")
    .select(
      `
      id,
      order_id,
      user_id,
      requested_at,
      customer_reason,
      orders (
        id,
        total_cents,
        order_items (
          quantity,
          unit_price_cents,
          products (name)
        )
      )
    `
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  const userIds = [...new Set((requests ?? []).map((r) => r.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] };
  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">Refund Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve or reject merch refund requests from customers.
        </p>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        {!requests?.length ? (
          <p className="p-6 text-sm text-muted-foreground">
            No pending refund requests.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Order
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Items
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Requested
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Feedback
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => {
                const order = r.orders as {
                  id: string;
                  total_cents: number;
                  order_items: Array<{
                    quantity: number;
                    unit_price_cents: number;
                    products: { name: string } | null;
                  }>;
                } | null;
                const itemsSummary =
                  order?.order_items
                    ?.map(
                      (item) =>
                        `${item.products?.name ?? "Product"} × ${item.quantity}`
                    )
                    .join(", ") ?? "—";

                return (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      #{order?.id.slice(0, 8).toUpperCase() ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {profileMap[r.user_id] ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order ? formatPrice(order.total_cents) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {itemsSummary}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: "America/Chicago",
                      }).format(new Date(r.requested_at))}
                    </td>
                    <td
                      className="px-4 py-3 text-muted-foreground max-w-[200px]"
                      title={r.customer_reason ?? undefined}
                    >
                      {r.customer_reason ? (
                        <span className="line-clamp-2">{r.customer_reason}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <RefundRequestDetailModal
                          request={r}
                          customerName={profileMap[r.user_id] ?? "—"}
                        />
                        <ApproveOrderRefundButton requestId={r.id} />
                        <RejectOrderRefundButton requestId={r.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
