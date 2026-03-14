import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddToCalendarButton from "@/components/dashboard/AddToCalendarButton";
import CancelBookingButton from "@/components/dashboard/CancelBookingButton";
import { CalendarX, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "My Bookings" };

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  waitlist: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

type ClassInfo = {
  title: string;
  starts_at: string;
  duration_mins: number;
  location: string;
  price_cents: number;
} | null;

export default async function BookingsPage({
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

  const { data: allBookings } = await supabase
    .from("bookings")
    .select("*, classes(title, starts_at, duration_mins, location, price_cents)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const now = new Date();

  let bookings = allBookings ?? [];

  if (!showAll) {
    bookings = bookings.filter((b) => {
      if (!["confirmed", "waitlist"].includes(b.status)) return false;
      const cls = b.classes as ClassInfo;
      if (!cls) return true;
      return new Date(cls.starts_at) >= now;
    });
    bookings.sort((a, b) => {
      const aDate = (a.classes as ClassInfo)?.starts_at ?? "";
      const bDate = (b.classes as ClassInfo)?.starts_at ?? "";
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All your class bookings in one place.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex rounded-lg border p-1 gap-1 bg-muted/30">
          <Link href="/bookings">
            <span
              className={`inline-block rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                !showAll
                  ? "bg-white text-dp-teal shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming
            </span>
          </Link>
          <Link href="/bookings?filter=all">
            <span
              className={`inline-block rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                showAll
                  ? "bg-white text-dp-teal shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </span>
          </Link>
        </div>

        {bookings.length > 0 && (
          <Link href="/classes">
            <Button
              size="sm"
              className="bg-dp-orange text-white hover:bg-dp-orange-dark"
            >
              Browse Classes
            </Button>
          </Link>
        )}
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {showAll ? "No bookings yet." : "No upcoming bookings."}
            </p>
            {showAll ? (
              <Link href="/classes">
                <Button
                  size="sm"
                  className="bg-dp-orange text-white hover:bg-dp-orange-dark"
                >
                  Browse Classes
                </Button>
              </Link>
            ) : (
              <Link href="/bookings?filter=all">
                <Button size="sm" variant="outline">
                  View all bookings
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const cls = booking.classes as ClassInfo;
            const isPast = cls ? new Date(cls.starts_at) < new Date() : false;

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

                  {booking.status === "confirmed" && !isPast && cls && (
                    <div className="flex flex-wrap items-center gap-2">
                      <AddToCalendarButton
                        title={cls.title}
                        startsAt={cls.starts_at}
                        durationMins={cls.duration_mins}
                        location={cls.location}
                      />
                      <CancelBookingButton bookingId={booking.id} />
                    </div>
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
