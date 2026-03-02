import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await request.json();

  if (!classId) {
    return NextResponse.json({ error: "classId required" }, { status: 400 });
  }

  const { data: cls, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .eq("is_published", true)
    .single();

  if (classError || !cls) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  if (cls.spots_remaining <= 0) {
    return NextResponse.json({ error: "Class is full" }, { status: 409 });
  }

  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("class_id", classId)
    .single();

  if (existingBooking?.status === "confirmed") {
    return NextResponse.json(
      { error: "You are already booked for this class" },
      { status: 409 }
    );
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: cls.title,
            description: `${new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZone: "America/Chicago",
            }).format(new Date(cls.starts_at))} · ${cls.location}`,
          },
          unit_amount: cls.price_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "class_booking",
      user_id: user.id,
      class_id: classId,
    },
    customer_email: user.email,
    success_url: `${origin}/bookings?success=1`,
    cancel_url: `${origin}/classes`,
  });

  return NextResponse.json({ url: session.url });
}
