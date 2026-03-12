import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

interface CartItem {
  productId: string;
  quantity: number;
}

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

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const productIds = items.map((i) => i.productId);
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true);

  if (productError || !products) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const missingId = items.find((i) => !products.find((p) => p.id === i.productId))?.productId;
  if (missingId) {
    return NextResponse.json({ error: `Product ${missingId} not found` }, { status: 400 });
  }

  const lineItems = items.map((cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId)!;

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description: product.description ?? undefined,
          images: product.image_url ? [product.image_url] : undefined,
        },
        unit_amount: product.price_cents,
      },
      quantity: cartItem.quantity,
    };
  });

  const totalCents = items.reduce((sum, cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId)!;
    return sum + product.price_cents * cartItem.quantity;
  }, 0);

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
