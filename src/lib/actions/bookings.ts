"use server";

import { revalidatePath } from "next/cache";
import { formatClassDate } from "@/lib/format/date";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { BookingCancellationEmail } from "@/lib/email/BookingCancellationEmail";

const REFUND_HOURS = 24;

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to cancel a booking." };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, user_id, status, stripe_payment_intent_id, class_id")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.user_id !== user.id) {
    return { error: "You can only cancel your own bookings." };
  }

  if (booking.status !== "confirmed") {
    return { error: "This booking cannot be cancelled." };
  }

  const { data: cls } = await supabase
    .from("classes")
    .select("title, starts_at")
    .eq("id", booking.class_id)
    .single();

  if (!cls) {
    return { error: "Class not found." };
  }

  const startsAt = new Date(cls.starts_at);
  const now = new Date();
  const msUntilClass = startsAt.getTime() - now.getTime();
  const hoursUntilClass = msUntilClass / (1000 * 60 * 60);
  const refundEligible = hoursUntilClass >= REFUND_HOURS;

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateError) {
    return { error: updateError.message };
  }

  if (refundEligible && booking.stripe_payment_intent_id) {
    try {
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
      });
    } catch (err) {
      console.error("[cancelBooking] Stripe refund failed:", err);
      // Don't fail the whole cancellation - user's spot is freed. Refund can be handled manually.
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Door Parkour <noreply@doorparkour.com>",
    to: user.email!,
    subject: `Booking Cancelled: ${cls.title}`,
    html: await render(
      BookingCancellationEmail({
        className: cls.title,
        classDate: formatClassDate(startsAt),
        refundEligible,
      })
    ),
  });

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/classes");

  return { success: true, refundEligible };
}
