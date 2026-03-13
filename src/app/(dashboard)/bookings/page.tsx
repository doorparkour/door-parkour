import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CancelBookingButton from "@/components/dashboard/CancelBookingButton";
import { CalendarX, MapPin, Clock } from "lucide-react";
import Link from "next/link";


export const metadata: Metadata = { title: "My Bookings" };

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  waitlist: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, classes(title, starts_at, duration_mins, location, price_cents)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All your class bookings in one place.
        </p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No bookings yet.</p>
            <Link href="/classes">
              <Button
                size="sm"
                className="bg-dp-orange text-white hover:bg-dp-orange-dark"
              >
                Browse Classes
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link href="/classes">
              <Button
                size="sm"
                className="bg-dp-orange text-white hover:bg-dp-orange-dark"
              >
                Browse Classes
              </Button>
            </Link>
          </div>
          {bookings.map((booking) => {
            const cls = booking.classes as {
              title: string;
              starts_at: string;
              duration_mins: number;
              location: string;
              price_cents: number;
            } | null;
            const isPast = cls
              ? new Date(cls.starts_at) < new Date()
              : false;

            return (
              <Card key={booking.id} className={isPast ? "opacity-60" : ""}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-semibold text-dp-teal">
                    {cls?.title ?? "Class"}
                  </CardTitle>
                  <Badge
                    className={`shrink-0 ${statusColors[booking.status] ?? ""} hover:${statusColors[booking.status]}`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cls && (
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-dp-orange shrink-0" />
                        {new Intl.DateTimeFormat("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Chicago",
                        }).format(new Date(cls.starts_at))}
                        {" · "}
                        {cls.duration_mins} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-dp-orange shrink-0" />
                        {cls.location}
                      </span>
                    </div>
                  )}

                  {booking.status === "confirmed" && !isPast && (
                    <CancelBookingButton bookingId={booking.id} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
