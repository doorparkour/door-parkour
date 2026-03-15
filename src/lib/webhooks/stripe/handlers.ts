import { Resend } from "resend";
import { render } from "@react-email/components";
import { BookingConfirmationEmail } from "@/lib/email/BookingConfirmationEmail";
import { formatClassDate } from "@/lib/format/date";
import { formatPriceDollars } from "@/lib/format/currency";
import type Stripe from "stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export async function handleClassBooking(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { user_id, class_id } = meta;

  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user_id)
    .eq("class_id", class_id)
    .single();

  if (existing) {
    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("bookings").insert({
      user_id,
      class_id,
      status: "confirmed",
      stripe_payment_intent_id: session.payment_intent as string,
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
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { user_id, cart, total_cents } = meta;
  const items: Array<{ productId: string; quantity: number }> = JSON.parse(cart);

  const { data: order } = await supabase
    .from("orders")
    .insert({
      user_id,
      stripe_checkout_session_id: session.id,
      status: "paid",
      total_cents: parseInt(total_cents),
    })
    .select()
    .single();

  if (!order) return;

  const { data: products } = await supabase
    .from("products")
    .select("id, price_cents, inventory, on_demand")
    .in("id", items.map((i) => i.productId));

  const orderItems = items.map((item) => {
    const product = products?.find(
      (p: { id: string; price_cents: number }) => p.id === item.productId
    );
    return {
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_cents: product?.price_cents ?? 0,
    };
  });

  await supabase.from("order_items").insert(orderItems);

  for (const item of items) {
    const product = products?.find(
      (p: { id: string; inventory: number; on_demand: boolean }) =>
        p.id === item.productId
    );
    if (!product || product.on_demand) continue;
    await supabase
      .from("products")
      .update({ inventory: Math.max(0, product.inventory - item.quantity) })
      .eq("id", item.productId);
  }
}

export async function handlePaymentFailed(
  supabase: SupabaseClient,
  pi: Stripe.PaymentIntent
) {
  await supabase
    .from("bookings")
    .update({ status: "payment_failed" })
    .eq("stripe_payment_intent_id", pi.id);

  await supabase
    .from("orders")
    .update({ status: "payment_failed" })
    .eq("stripe_checkout_session_id", pi.latest_charge);
}

export async function handleRefund(
  supabase: SupabaseClient,
  charge: Stripe.Charge
) {
  const paymentIntentId = charge.payment_intent as string;
  const fullyRefunded = charge.amount_refunded === charge.amount;
  const status = fullyRefunded ? "refunded" : "partially_refunded";

  await supabase
    .from("bookings")
    .update({ status })
    .eq("stripe_payment_intent_id", paymentIntentId);

  await supabase
    .from("orders")
    .update({ status })
    .eq("stripe_checkout_session_id", charge.metadata?.checkout_session_id);
}
