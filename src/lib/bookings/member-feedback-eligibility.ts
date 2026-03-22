import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export function getClassEndsAt(startsAtIso: string, durationMins: number): Date {
  const start = new Date(startsAtIso);
  return new Date(start.getTime() + durationMins * 60 * 1000);
}

type ClassJoin = {
  is_cancelled: boolean;
  starts_at: string;
  duration_mins: number;
} | null;

/**
 * User has at least one confirmed booking for a non-cancelled class that has already ended.
 */
export async function userHasCompletedEligibleClass(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data: rows, error } = await supabase
    .from("bookings")
    .select("status, classes(is_cancelled, starts_at, duration_mins)")
    .eq("user_id", userId)
    .eq("status", "confirmed");

  if (error || !rows?.length) {
    return false;
  }

  const now = new Date();
  return rows.some((row) => {
    const cls = row.classes as ClassJoin;
    if (!cls || cls.is_cancelled) return false;
    return getClassEndsAt(cls.starts_at, cls.duration_mins) <= now;
  });
}
