import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import AdminCancelBookingButton from "@/components/admin/AdminCancelBookingButton";
import RefundBookingButton from "@/components/admin/RefundBookingButton";

export const metadata: Metadata = { title: "Admin — Bookings" };

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      user_id,
      status,
      created_at,
      stripe_payment_intent_id,
      participant_name,
      classes (
        title,
        starts_at,
        price_cents,
        age_group
      )
    `)
    .order("created_at", { ascending: false });

  const userIds = [...new Set((bookings ?? []).map((b) => b.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] };
  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800",
    cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800",
    waitlist: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800",
    refunded: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700",
    partially_refunded: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800",
    payment_failed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800",
  };

  type BookingRow = NonNullable<typeof bookings>[number];
  const canRefund = (b: BookingRow) => {
    if (!b.stripe_payment_intent_id) return false;
    if (["refunded", "partially_refunded"].includes(b.status)) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all bookings. Cancel to free a spot (customer flow); refund only
          returns money without cancelling the booking row.
        </p>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        {!bookings?.length ? (
          <p className="p-6 text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Participant
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Class
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => {
                const cls = b.classes as {
                  title: string;
                  starts_at: string;
                  price_cents: number;
                  age_group?: string;
                } | null;
                const fullName = profileMap[b.user_id] ?? "—";
                const participantDisplay =
                  b.participant_name ?? (cls?.age_group === "youth" ? "—" : null);
                const priceDollars = cls
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(cls.price_cents / 100)
                  : "—";

                return (
                  <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {participantDisplay ?? fullName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cls?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cls?.starts_at
                        ? new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "America/Chicago",
                          }).format(new Date(cls.starts_at))
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {priceDollars}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          statusColors[b.status] ??
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {b.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {b.status === "confirmed" && cls && (
                          <AdminCancelBookingButton
                            bookingId={b.id}
                            className={cls.title}
                          />
                        )}
                        {canRefund(b) && cls && (
                          <RefundBookingButton
                            bookingId={b.id}
                            className={cls.title}
                            priceDollars={priceDollars}
                          />
                        )}
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
