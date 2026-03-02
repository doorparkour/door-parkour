import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServerClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Use service-role client for webhook (bypasses RLS)
function getAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
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
    return NextResponse.json(
      { error: `Webhook error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.type === "class_booking") {
      await handleClassBooking(supabase, session, meta);
    } else if (meta.type === "merch_order") {
      await handleMerchOrder(supabase, session, meta);
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
    .select("id, price_cents")
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
}
