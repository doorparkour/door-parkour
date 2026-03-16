"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ELIGIBLE_ORDER_STATUSES = ["paid", "fulfilled"] as const;

export async function requestOrderRefund(
  orderId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to request a refund." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("return_policy_agreed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.return_policy_agreed_at) {
    return { error: "You must agree to the return policy before requesting a refund." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status, stripe_payment_intent_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: "Order not found." };
  }

  if (order.user_id !== user.id) {
    return { error: "You can only request refunds for your own orders." };
  }

  if (!ELIGIBLE_ORDER_STATUSES.includes(order.status as (typeof ELIGIBLE_ORDER_STATUSES)[number])) {
    return { error: "This order is not eligible for a refund request." };
  }

  if (!order.stripe_payment_intent_id) {
    return { error: "This order has no payment to refund." };
  }

  const { data: existingRequest } = await supabase
    .from("refund_requests")
    .select("id")
    .eq("order_id", orderId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingRequest) {
    return { error: "A refund request is already pending for this order." };
  }

  const { error: insertError } = await supabase.from("refund_requests").insert({
    order_id: orderId,
    user_id: user.id,
    status: "pending",
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/orders");
  return {};
}
