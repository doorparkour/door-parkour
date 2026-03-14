import { describe, it, expect, vi, beforeEach } from "vitest";
import { cancelBooking } from "@/lib/actions/bookings";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe/server", () => ({
  getStripe: vi.fn(() => ({
    refunds: { create: vi.fn().mockResolvedValue({}) },
  })),
}));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: vi.fn().mockResolvedValue({}) } };
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { revalidatePath } from "next/cache";

const userId = "user-123";
const bookingId = "booking-456";
const classId = "class-789";

function makeSupabase(opts: {
  user?: { id: string; email: string } | null;
  booking?: object | null;
  bookingError?: { message: string } | null;
  class?: object | null;
  updateError?: { message: string } | null;
} = {}) {
  const {
    user = { id: userId, email: "user@example.com" },
    booking = {
      id: bookingId,
      user_id: userId,
      status: "confirmed",
      stripe_payment_intent_id: "pi_xxx",
      class_id: classId,
    },
    bookingError = null,
    class: cls = {
      title: "Intro to Parkour",
      starts_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    },
    updateError = null,
  } = opts;

  const bookingSingle = vi.fn().mockResolvedValue({
    data: booking,
    error: bookingError,
  });
  const classSingle = vi.fn().mockResolvedValue({ data: cls, error: null });
  const updateEq = vi.fn().mockResolvedValue({ data: null, error: updateError });

  const from = vi.fn((table: string) => {
    if (table === "bookings") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: bookingSingle }),
        }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single: classSingle }),
      }),
    };
  });

  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cancelBooking", () => {
  it("returns error when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ user: null }) as never
    );
    const result = await cancelBooking(bookingId);
    expect(result.error).toBe("You must be logged in to cancel a booking.");
    expect(result.success).toBeUndefined();
  });

  it("returns error when booking not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ booking: null, bookingError: { message: "not found" } }) as never
    );
    const result = await cancelBooking(bookingId);
    expect(result.error).toBe("Booking not found.");
  });

  it("returns error when user does not own booking", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        booking: {
          id: bookingId,
          user_id: "other-user",
          status: "confirmed",
          stripe_payment_intent_id: "pi_xxx",
          class_id: classId,
        },
      }) as never
    );
    const result = await cancelBooking(bookingId);
    expect(result.error).toBe("You can only cancel your own bookings.");
  });

  it("returns error when booking is not confirmed", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        booking: {
          id: bookingId,
          user_id: userId,
          status: "waitlist",
          stripe_payment_intent_id: null,
          class_id: classId,
        },
      }) as never
    );
    const result = await cancelBooking(bookingId);
    expect(result.error).toBe("This booking cannot be cancelled.");
  });

  it("returns error when class not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ class: null }) as never
    );
    const result = await cancelBooking(bookingId);
    expect(result.error).toBe("Class not found.");
  });

  it("returns error when DB update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ updateError: { message: "constraint violation" } }) as never
    );
    const result = await cancelBooking(bookingId);
    expect(result.error).toBe("constraint violation");
  });

  it("calls Stripe refund when eligible (24+ hours before class)", async () => {
    const stripeRefund = vi.fn().mockResolvedValue({});
    vi.mocked(getStripe).mockReturnValue({
      refunds: { create: stripeRefund },
    } as never);
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const result = await cancelBooking(bookingId);

    expect(result.success).toBe(true);
    expect(result.refundEligible).toBe(true);
    expect(stripeRefund).toHaveBeenCalledWith({
      payment_intent: "pi_xxx",
    });
  });

  it("does not call Stripe refund when within 24 hours", async () => {
    const stripeRefund = vi.fn().mockResolvedValue({});
    vi.mocked(getStripe).mockReturnValue({
      refunds: { create: stripeRefund },
    } as never);
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        class: {
          title: "Intro to Parkour",
          starts_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        },
      }) as never
    );

    const result = await cancelBooking(bookingId);

    expect(result.success).toBe(true);
    expect(result.refundEligible).toBe(false);
    expect(stripeRefund).not.toHaveBeenCalled();
  });

  it("does not call Stripe refund when no payment intent", async () => {
    const stripeRefund = vi.fn().mockResolvedValue({});
    vi.mocked(getStripe).mockReturnValue({
      refunds: { create: stripeRefund },
    } as never);
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        booking: {
          id: bookingId,
          user_id: userId,
          status: "confirmed",
          stripe_payment_intent_id: null,
          class_id: classId,
        },
      }) as never
    );

    const result = await cancelBooking(bookingId);

    expect(result.success).toBe(true);
    expect(result.refundEligible).toBe(true);
    expect(stripeRefund).not.toHaveBeenCalled();
  });

  it("revalidates bookings and dashboard on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    await cancelBooking(bookingId);

    expect(revalidatePath).toHaveBeenCalledWith("/bookings");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
