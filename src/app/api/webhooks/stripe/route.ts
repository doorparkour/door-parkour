import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { BookingConfirmationEmail } from "@/lib/email/BookingConfirmationEmail";
import type Stripe from "stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use service-role client for webhook (bypasses RLS)
function getAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] constructEvent failed:", message, {
      sigHeader: sig?.slice(0, 20),
      secretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
      bodyLength: body.length,
    });
    return NextResponse.json(
      { error: `Webhook error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};
      if (meta.type === "class_booking") {
        await handleClassBooking(supabase, session, meta);
      } else if (meta.type === "merch_order") {
        await handleMerchOrder(supabase, session, meta);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(supabase, pi);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleRefund(supabase, charge);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleClassBooking(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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

  // Send booking confirmation email
  const customerEmail = session.customer_email;
  if (customerEmail) {
    const { data: cls } = await supabase
      .from("classes")
      .select("title, starts_at, location, duration_mins, price_cents")
      .eq("id", class_id)
      .single();

    if (cls) {
      const classDate = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      }).format(new Date(cls.starts_at));

      const priceDollars = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cls.price_cents / 100);

      await resend.emails.send({
        from: "Door Parkour <noreply@doorparkour.com>",
        to: customerEmail,
        subject: `Booking Confirmed: ${cls.title}`,
        html: await render(
          BookingConfirmationEmail({
            className: cls.title,
            classDate,
            location: cls.location,
            durationMins: cls.duration_mins,
            priceDollars,
          })
        ),
      });
    }
  }
}

async function handleMerchOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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
    .in(
      "id",
      items.map((i) => i.productId)
    );

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

  // Decrement inventory for limited-supply products
  for (const item of items) {
    const product = products?.find(
      (p: { id: string; inventory: number; on_demand: boolean }) => p.id === item.productId
    );
    if (!product || product.on_demand) continue;
    await supabase
      .from("products")
      .update({ inventory: Math.max(0, product.inventory - item.quantity) })
      .eq("id", item.productId);
  }
}

async function handlePaymentFailed(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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

async function handleRefund(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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
