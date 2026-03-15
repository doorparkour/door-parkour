import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import {
  validateCart,
  buildLineItems,
  calculateTotalCents,
  type CartItem,
} from "@/lib/merch";

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items }: { items: CartItem[] } = await request.json();

  const variantIds = items?.map((i) => i.variantId) ?? [];
  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_id, size, inventory")
    .in("id", variantIds);

  if (variantError || !variants) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const productIds = [...new Set(variants.map((v) => v.product_id))];
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, description, price_cents, on_demand, image_url")
    .in("id", productIds)
    .eq("status", "active");

  if (productError || !products) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const validationError = validateCart(items ?? [], products, variants);
  if (validationError) {
    return NextResponse.json({ error: validationError.error }, { status: 400 });
  }

  const lineItems = buildLineItems(items ?? [], products, variants);
  const totalCents = calculateTotalCents(items ?? [], products, variants);

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    metadata: {
      type: "merch_order",
      user_id: user.id,
      cart: JSON.stringify(items),
      total_cents: totalCents.toString(),
    },
    customer_email: user.email,
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    success_url: `${origin}/orders?success=1`,
    cancel_url: `${origin}/merch`,
  });

  return NextResponse.json({ url: session.url });
}
