"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseClassInput } from "@/lib/class/validation";
import { formatClassDate } from "@/lib/format/date";
import { unwrap } from "@/lib/validation";
import { formatPriceDollars } from "@/lib/format/currency";
import { parseProductInput, productError } from "@/lib/product/validation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { ClassCancellationEmail } from "@/lib/email/ClassCancellationEmail";
import { ClassCancellationAdminEmail } from "@/lib/email/ClassCancellationAdminEmail";
import { ManualRefundEmail } from "@/lib/email/ManualRefundEmail";

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return supabase;
}

// ── Classes ──────────────────────────────────────────────────

export async function createClass(
  formData: FormData
): Promise<{ error?: string } | void> {
  const supabase = await requireAdmin();

  const parsed = parseClassInput(formData, { requireFutureDate: true });
  if (parsed.error) return { error: parsed.error };

  const { error } = await supabase.from("classes").insert(unwrap(parsed));

  if (error) return { error: error.message };

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  redirect("/admin/classes");
}

export async function cancelClass(id: string) {
  const supabase = await requireAdmin();
  const adminSupabase = getAdminSupabase();
  const stripe = getStripe();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: cls } = await supabase
    .from("classes")
    .select("title, starts_at, is_cancelled")
    .eq("id", id)
    .single();

  if (!cls) throw new Error("Class not found");
  if (cls.is_cancelled) throw new Error("Class is already cancelled");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, status, stripe_payment_intent_id")
    .eq("class_id", id)
    .in("status", ["confirmed", "waitlist"]);

  // Mark class as cancelled
  await supabase
    .from("classes")
    .update({ is_cancelled: true, cancelled_at: new Date().toISOString() })
    .eq("id", id);

  if (bookings?.length) {
    // Cancel all active bookings (DB trigger restores spots_remaining per row)
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .in("id", bookings.map((b) => b.id));

    // Stripe refunds for confirmed bookings
    const refundable = bookings.filter(
      (b) => b.status === "confirmed" && b.stripe_payment_intent_id
    );
    await Promise.allSettled(
      refundable.map((b) =>
        stripe.refunds.create({ payment_intent: b.stripe_payment_intent_id! })
      )
    );

    const classDate = formatClassDate(cls.starts_at);

    // Fetch participant emails and send cancellation notifications
    const participantDetails: Array<{ email: string; refunded: boolean }> = [];

    await Promise.allSettled(
      bookings.map(async (b) => {
        const { data: userData } = await adminSupabase.auth.admin.getUserById(b.user_id);
        const email = userData?.user?.email;
        if (!email) return;

        const wasRefunded = b.status === "confirmed" && !!b.stripe_payment_intent_id;
        participantDetails.push({ email, refunded: wasRefunded });

        return resend.emails.send({
          from: "Door Parkour <noreply@doorparkour.com>",
          to: email,
          subject: `Class Cancelled: ${cls.title}`,
          html: await render(
            ClassCancellationEmail({ className: cls.title, classDate, wasRefunded })
          ),
        });
      })
    );

    // Admin summary email
    await resend.emails.send({
      from: "Door Parkour <noreply@doorparkour.com>",
      to: "steven@doorparkour.com",
      subject: `[Admin] Class Cancelled: ${cls.title}`,
      html: await render(
        ClassCancellationAdminEmail({
          className: cls.title,
          classDate,
          participants: participantDetails,
        })
      ),
    });
  }

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}

export async function refundBooking(bookingId: string): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const adminSupabase = getAdminSupabase();
  const stripe = getStripe();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, user_id, status, stripe_payment_intent_id, class_id")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { error: "Booking not found." };
  }

  if (!booking.stripe_payment_intent_id) {
    return { error: "This booking has no payment to refund." };
  }

  if (["refunded", "partially_refunded"].includes(booking.status)) {
    return { error: "This booking has already been refunded." };
  }

  const { data: cls } = await supabase
    .from("classes")
    .select("title, starts_at, price_cents")
    .eq("id", booking.class_id)
    .single();

  if (!cls) {
    return { error: "Class not found." };
  }

  try {
    await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe refund failed";
    return { error: msg };
  }

  await supabase
    .from("bookings")
    .update({ status: "refunded" })
    .eq("id", bookingId);

  const { data: userData } = await adminSupabase.auth.admin.getUserById(booking.user_id);
  const email = userData?.user?.email;

  if (email) {
    await resend.emails.send({
      from: "Door Parkour <noreply@doorparkour.com>",
      to: email,
      subject: `Refund Issued: ${cls.title}`,
      html: await render(
        ManualRefundEmail({
          className: cls.title,
          classDate: formatClassDate(cls.starts_at),
          priceDollars: formatPriceDollars(cls.price_cents),
        })
      ),
    });
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/bookings");

  return {};
}

export async function updateClass(
  id: string,
  formData: FormData
): Promise<{ error?: string } | void> {
  const supabase = await requireAdmin();

  const parsed = parseClassInput(formData);
  if (parsed.error) return { error: parsed.error };

  const { error } = await supabase
    .from("classes")
    .update(unwrap(parsed))
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  redirect("/admin/classes");
}

// ── Products ──────────────────────────────────────────────────

export async function createProduct(
  formData: FormData
): Promise<{ error?: string } | void> {
  const supabase = await requireAdmin();

  const parsed = parseProductInput(formData);
  if (parsed.error) return { error: parsed.error };

  const { error } = await supabase.from("products").insert(unwrap(parsed));

  if (error) return { error: productError(error.message) };

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const supabase = await requireAdmin();

  const { data: product } = await supabase
    .from("products")
    .select("status")
    .eq("id", id)
    .single();
  if (product?.status === "archived") {
    return { error: "Archived products cannot be deleted." };
  }

  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (count && count > 0) {
    return {
      error:
        "This product has order history and can't be deleted. Set it to Archived instead.",
    };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  return {};
}

export async function archiveProduct(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", id)
    .in("status", ["active", "draft"]);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/merch");
}

export async function unarchiveProduct(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("products")
    .update({ status: "active" })
    .eq("id", id)
    .eq("status", "archived");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/merch");
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<{ error?: string } | void> {
  const supabase = await requireAdmin();

  const { data: existing } = await supabase
    .from("products")
    .select("status")
    .eq("id", id)
    .single();
  if (existing?.status === "archived") {
    return { error: "Archived products cannot be edited." };
  }

  const parsed = parseProductInput(formData);
  if (parsed.error) return { error: parsed.error };

  const { error } = await supabase
    .from("products")
    .update(unwrap(parsed))
    .eq("id", id);

  if (error) return { error: productError(error.message) };

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  redirect("/admin/products");
}
