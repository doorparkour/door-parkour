import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import ClassCard from "@/components/marketing/ClassCard";
import { CalendarX } from "lucide-react";

export const metadata: Metadata = {
  title: "Classes",
  description:
    "Browse Door Parkour's outdoor class schedule in Sturgeon Bay, WI.",
};

export const revalidate = 60;

export default async function ClassesPage() {
  const supabase = await createClient();

  const [
    { data: classes, error },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("*")
      .eq("is_published", true)
      .eq("is_cancelled", false)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const classIds = (classes ?? []).map((c) => c.id);
  const [profileResult, bookingsResult] =
    user != null
      ? await Promise.all([
          supabase
            .from("profiles")
            .select("waiver_signed_at")
            .eq("id", user.id)
            .single(),
          classIds.length > 0
            ? supabase
                .from("bookings")
                .select("class_id")
                .eq("user_id", user.id)
                .eq("status", "confirmed")
                .in("class_id", classIds)
            : Promise.resolve({ data: [] as { class_id: string }[] }),
        ])
      : [null, null];

  const profile = profileResult?.data ?? null;
  const waiverSigned = user != null ? !!profile?.waiver_signed_at : undefined;
  const confirmedClassIds = new Set(
    (bookingsResult?.data ?? []).map((b) => b.class_id)
  );

  if (error) {
    console.error("Failed to load classes:", error.message);
  }

  return (
    <>
      <section className="bg-dp-teal py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4 bg-dp-orange/20 text-dp-orange border-dp-orange/30 hover:bg-dp-orange/20">
            Updates Coming Soon
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Upcoming Classes
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Outdoor parkour sessions in Door County. All levels welcome —
            beginner-friendly with progressive challenges for those with
            experience.
          </p>
        </div>
      </section>

      <section className="bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!classes || classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarX className="h-12 w-12 text-muted-foreground/50" />
              <h2 className="mt-4 text-xl font-semibold text-dp-teal">
                No upcoming classes posted yet
              </h2>
              <p className="mt-2 text-muted-foreground">
                Check back for upcoming class schedule updates.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  waiverSigned={waiverSigned}
                  isAlreadyBooked={user != null && confirmedClassIds.has(cls.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
