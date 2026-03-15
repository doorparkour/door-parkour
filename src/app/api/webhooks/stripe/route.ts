import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  handleClassBooking,
  handleMerchOrder,
  handlePaymentFailed,
  handleRefund,
} from "@/lib/webhooks/stripe/handlers";
import type Stripe from "stripe";

function getAdminClient() {
  return createClient<Database>(
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
      const meta = (session.metadata ?? {}) as Record<string, string>;
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
