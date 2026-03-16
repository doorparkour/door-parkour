"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseClassInput } from "@/lib/class/validation";
import { formatClassDate } from "@/lib/format/date";
import { unwrap } from "@/lib/validation";
import { formatPriceDollars } from "@/lib/format/currency";
import {
  parseProductInput,
  parseVariantInputs,
  productError,
} from "@/lib/product/validation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { ClassCancellationEmail } from "@/lib/email/ClassCancellationEmail";
import { ClassCancellationAdminEmail } from "@/lib/email/ClassCancellationAdminEmail";
import { OrderRefundApprovedEmail } from "@/lib/email/OrderRefundApprovedEmail";
import { OrderRefundRejectedEmail } from "@/lib/email/OrderRefundRejectedEmail";

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
  const stripe = getStripe();

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

  revalidatePath("/admin/bookings");
  revalidatePath("/bookings");

  return {};
}

// ── Order refund requests ─────────────────────────────────────

export async function approveOrderRefund(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = await requireAdmin();
  const adminSupabase = getAdminSupabase();
  const stripe = getStripe();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  const { data: request, error: requestError } = await supabase
    .from("refund_requests")
    .select("id, order_id, user_id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { error: "Refund request not found." };
  }

  if (request.status !== "pending") {
    return { error: "This request has already been processed." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, total_cents, stripe_payment_intent_id")
    .eq("id", request.order_id)
    .single();

  if (orderError || !order) {
    return { error: "Order not found." };
  }

  if (!order.stripe_payment_intent_id) {
    return { error: "This order has no payment to refund." };
  }

  try {
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe refund failed";
    return { error: msg };
  }

  await supabase
    .from("refund_requests")
    .update({
      status: "approved",
      decided_at: new Date().toISOString(),
      decided_by: adminUser!.id,
    })
    .eq("id", requestId);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("quantity, unit_price_cents, products(name)")
    .eq("order_id", order.id);

  const itemsSummary =
    (orderItems ?? [])
      .map((item) => {
        const product = item.products as { name: string } | null;
        const name = product?.name ?? "Product";
        const total = (item.unit_price_cents ?? 0) * (item.quantity ?? 1);
        return `${name} × ${item.quantity} (${formatPriceDollars(total)})`;
      })
      .join("\n") || "Order items";

  const { data: userData } =
    await adminSupabase.auth.admin.getUserById(order.user_id);
  const email = userData?.user?.email;

  if (email) {
    await resend.emails.send({
      from: "Door Parkour <noreply@doorparkour.com>",
      to: email,
      subject: `Refund Approved: Order #${order.id.slice(0, 8).toUpperCase()}`,
      html: await render(
        OrderRefundApprovedEmail({
          orderId: order.id,
          totalDollars: formatPriceDollars(order.total_cents),
          itemsSummary,
        })
      ),
    });
  }

  revalidatePath("/admin/refund-requests");
  revalidatePath("/orders");

  return {};
}

export async function rejectOrderRefund(
  requestId: string,
  reason?: string
): Promise<{ error?: string }> {
  const supabase = await requireAdmin();
  const adminSupabase = getAdminSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  const { data: request, error: requestError } = await supabase
    .from("refund_requests")
    .select("id, order_id, user_id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { error: "Refund request not found." };
  }

  if (request.status !== "pending") {
    return { error: "This request has already been processed." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, total_cents")
    .eq("id", request.order_id)
    .single();

  if (orderError || !order) {
    return { error: "Order not found." };
  }

  await supabase
    .from("refund_requests")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by: adminUser!.id,
      reason: reason ?? null,
    })
    .eq("id", requestId);

  const { data: userData } =
    await adminSupabase.auth.admin.getUserById(order.user_id);
  const email = userData?.user?.email;

  if (email) {
    await resend.emails.send({
      from: "Door Parkour <noreply@doorparkour.com>",
      to: email,
      subject: `Refund Request Update: Order #${order.id.slice(0, 8).toUpperCase()}`,
      html: await render(
        OrderRefundRejectedEmail({
          orderId: order.id,
          totalDollars: formatPriceDollars(order.total_cents),
          reason: reason ?? undefined,
        })
      ),
    });
  }

  revalidatePath("/admin/refund-requests");
  revalidatePath("/orders");

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

  const isApparel = [
    "Door Parkour T-Shirt",
    "Door Parkour Long-Sleeve Shirt",
    "Door Parkour Pullover Hoodie",
    "Door Parkour Zipped Hoodie",
  ].includes(unwrap(parsed).name);

  const variantsParsed = parseVariantInputs(formData, isApparel);
  if (variantsParsed.error) return { error: variantsParsed.error };

  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert(unwrap(parsed))
    .select("id")
    .single();

  if (insertError || !product)
    return { error: productError(insertError?.message ?? "Failed to create product") };

  const variantRows = unwrap(variantsParsed).map((v) => ({
    product_id: product.id,
    size: v.size,
    inventory: v.inventory,
  }));

  const { error: variantsError } = await supabase
    .from("product_variants")
    .insert(variantRows);

  if (variantsError) return { error: productError(variantsError.message) };

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
    .select("status, name")
    .eq("id", id)
    .single();
  if (existing?.status === "archived") {
    return { error: "Archived products cannot be edited." };
  }

  const parsed = parseProductInput(formData);
  if (parsed.error) return { error: parsed.error };

  const isApparel = [
    "Door Parkour T-Shirt",
    "Door Parkour Long-Sleeve Shirt",
    "Door Parkour Pullover Hoodie",
    "Door Parkour Zipped Hoodie",
  ].includes(unwrap(parsed).name);

  const variantsParsed = parseVariantInputs(formData, isApparel);
  if (variantsParsed.error) return { error: variantsParsed.error };

  const { error } = await supabase
    .from("products")
    .update(unwrap(parsed))
    .eq("id", id);

  if (error) return { error: productError(error.message) };

  const variants = unwrap(variantsParsed);
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id, size")
    .eq("product_id", id);

  for (const v of variants) {
    const existingV = existingVariants?.find((ev) => ev.size === v.size);
    if (existingV) {
      await supabase
        .from("product_variants")
        .update({ inventory: v.inventory })
        .eq("id", existingV.id);
    } else {
      await supabase.from("product_variants").insert({
        product_id: id,
        size: v.size,
        inventory: v.inventory,
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  redirect("/admin/products");
}
