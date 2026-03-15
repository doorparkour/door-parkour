import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: bookings }, { data: orders }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("bookings")
        .select("id, status, created_at, classes(title, starts_at, location)")
        .eq("user_id", user!.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("orders")
        .select("id, status, total_cents, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">
          Hey, {firstName} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s a snapshot of your account.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-dp-orange" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-dp-teal">
              {bookings?.length ?? 0}
            </p>
            <Link
              href="/bookings"
              className="mt-1 inline-flex items-center gap-1 text-xs text-dp-orange hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-dp-orange" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-dp-teal">
              {orders?.length ?? 0}
            </p>
            <Link
              href="/orders"
              className="mt-1 inline-flex items-center gap-1 text-xs text-dp-orange hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming classes */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Upcoming Classes</CardTitle>
          <Link href="/classes">
            <Button variant="ghost" size="sm" className="text-dp-orange">
              Browse more
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground text-sm">
                No upcoming classes booked.
              </p>
              <Link href="/classes">
                <Button
                  size="sm"
                  className="mt-3 bg-dp-orange text-white hover:bg-dp-orange-dark"
                >
                  Find a Class
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {bookings.map((b) => {
                const cls = b.classes as {
                  title: string;
                  starts_at: string;
                  location: string;
                } | null;
                return (
                  <li key={b.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{cls?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls?.starts_at
                          ? new Intl.DateTimeFormat("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              timeZone: "America/Chicago",
                            }).format(new Date(cls.starts_at))
                          : ""}
                        {" · "}
                        {cls?.location}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900/40">
                      Confirmed
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
