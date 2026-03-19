import { Resend } from "resend";
import { render } from "@react-email/components";
import { BookingConfirmationEmail } from "@/lib/email/BookingConfirmationEmail";
import { ManualRefundEmail } from "@/lib/email/ManualRefundEmail";
import { formatClassDate } from "@/lib/format/date";
import { formatPriceDollars } from "@/lib/format/currency";
import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

type WebhookSupabase = SupabaseClient<Database>;

export async function handleClassBooking(
  supabase: WebhookSupabase,
  session: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { user_id, class_id, participant_name } = meta;

  const bookingPayload = {
    status: "confirmed" as const,
    stripe_payment_intent_id: session.payment_intent as string,
    ...(participant_name && { participant_name: participant_name.trim() }),
  };

  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user_id)
    .eq("class_id", class_id)
    .single();

  if (existing) {
    await supabase.from("bookings").update(bookingPayload).eq("id", existing.id);
  } else {
    await supabase.from("bookings").insert({
      user_id,
      class_id,
      ...bookingPayload,
    });
  }

  const customerEmail = session.customer_email;
  if (customerEmail) {
    const { data: cls } = await supabase
      .from("classes")
      .select("title, starts_at, location, duration_mins, price_cents")
      .eq("id", class_id)
      .single();

    if (cls) {
      await resend.emails.send({
        from: "Door Parkour <noreply@doorparkour.com>",
        to: customerEmail,
        subject: `Booking Confirmed: ${cls.title}`,
        html: await render(
          BookingConfirmationEmail({
            className: cls.title,
            classDate: formatClassDate(cls.starts_at),
            location: cls.location,
            durationMins: cls.duration_mins,
            priceDollars: formatPriceDollars(cls.price_cents),
          })
        ),
      });
    }
  }
}

export async function handleMerchOrder(
  supabase: WebhookSupabase,
  session: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { user_id, cart, total_cents } = meta;
  const items: Array<{ variantId: string; productId: string; quantity: number }> =
    JSON.parse(cart);

  const { data: order } = await supabase
    .from("orders")
    .insert({
      user_id,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      status: "paid",
      total_cents: parseInt(total_cents),
    })
    .select()
    .single();

  if (!order) return;

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, product_id, inventory")
    .in("id", items.map((i) => i.variantId));

  const { data: products } = await supabase
    .from("products")
    .select("id, price_cents, on_demand")
    .in("id", items.map((i) => i.productId));

  const orderItems = items.map((item) => {
    const variant = variants?.find((v: { id: string }) => v.id === item.variantId);
    const product = products?.find(
      (p: { id: string; price_cents: number }) => p.id === item.productId
    );
    return {
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price_cents: product?.price_cents ?? 0,
    };
  });

  await supabase.from("order_items").insert(orderItems);

  for (const item of items) {
    const variant = variants?.find(
      (v: { id: string; inventory: number }) => v.id === item.variantId
    );
    const product = products?.find(
      (p: { id: string; on_demand: boolean }) => p.id === item.productId
    );
    if (!variant || !product || product.on_demand) continue;
    await supabase
      .from("product_variants")
      .update({
        inventory: Math.max(0, variant.inventory - item.quantity),
      })
      .eq("id", item.variantId);
  }
}

export async function handlePaymentFailed(
  supabase: WebhookSupabase,
  pi: Stripe.PaymentIntent
) {
  await supabase
    .from("bookings")
    .update({ status: "payment_failed" })
    .eq("stripe_payment_intent_id", pi.id);

  await supabase
    .from("orders")
    .update({ status: "payment_failed" })
    .eq("stripe_payment_intent_id", pi.id);
}

export async function handleRefund(supabase: WebhookSupabase, charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  const fullyRefunded = charge.amount_refunded === charge.amount;
  const status = fullyRefunded ? "refunded" : "partially_refunded";

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, class_id, refund_email_sent_at")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (booking) {
    await supabase
      .from("bookings")
      .update({ status })
      .eq("id", booking.id);

    if (!booking.refund_email_sent_at) {
      const { data: cls } = await supabase
        .from("classes")
        .select("title, starts_at, price_cents")
        .eq("id", booking.class_id)
        .single();

      const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id);
      const email = userData?.user?.email;

      if (cls && email) {
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
        await supabase
          .from("bookings")
          .update({ refund_email_sent_at: new Date().toISOString() })
          .eq("id", booking.id);
      }
    }
  }

  await supabase
    .from("orders")
    .update({ status })
    .eq("stripe_payment_intent_id", paymentIntentId);
}
