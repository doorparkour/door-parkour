import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../checkout/classes/route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe/server", () => ({ getStripe: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

const mockSessionCreate = vi.fn();

function makeRequest(body: object, origin = "https://doorparkour.com") {
  return new Request("https://doorparkour.com/api/checkout/classes", {
    method: "POST",
    headers: { origin },
    body: JSON.stringify(body),
  });
}

// Builds a chainable Supabase query mock that resolves to `result` at the end
function chain(result: object) {
  const node: Record<string, unknown> = {};
  ["select", "eq", "in"].forEach((m) => {
    node[m] = vi.fn().mockReturnValue(node);
  });
  node.single = vi.fn().mockResolvedValue(result);
  return node;
}

function makeSupabase({
  user = { id: "user-1", email: "u@test.com" },
  authed = true,
  profile = { waiver_signed_at: "2026-01-01T00:00:00Z" },
  cls = { id: "class-1", title: "Intro", price_cents: 4500, spots_remaining: 5, location: "Park", starts_at: new Date().toISOString() },
  classError = null,
  existingBooking = null,
}: {
  user?: object | null;
  authed?: boolean;
  profile?: { waiver_signed_at: string | null } | null;
  cls?: object | null;
  classError?: object | null;
  existingBooking?: object | null;
} = {}) {
  const profileChain = chain({ data: profile, error: null });
  const classChain = chain({ data: cls, error: classError });
  const bookingChain = chain({ data: existingBooking, error: null });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authed ? user : null },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return profileChain;
      if (table === "classes") return classChain;
      if (table === "bookings") return bookingChain;
    }),
  };
}

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue({
    checkout: { sessions: { create: mockSessionCreate } },
  } as never);
  mockSessionCreate.mockResolvedValue({ url: "https://stripe.com/pay/test" });
});

describe("POST /api/checkout/classes", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ authed: false }) as never
    );

    const res = await POST(makeRequest({ classId: "class-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when waiver is not signed", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ profile: { waiver_signed_at: null } }) as never
    );

    const res = await POST(makeRequest({ classId: "class-1" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: "You must sign the waiver before booking a class.",
    });
  });

  it("returns 400 when classId is missing", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when class is not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ cls: null, classError: { message: "not found" } }) as never
    );

    const res = await POST(makeRequest({ classId: "class-1" }));
    expect(res.status).toBe(404);
  });

  it("returns 409 when class is full", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ cls: { spots_remaining: 0 } }) as never
    );

    const res = await POST(makeRequest({ classId: "class-1" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "Class is full" });
  });

  it("returns 409 when user already has a confirmed booking", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ existingBooking: { id: "booking-1", status: "confirmed" } }) as never
    );

    const res = await POST(makeRequest({ classId: "class-1" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("already booked") });
  });

  it("returns checkout URL on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(makeRequest({ classId: "class-1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://stripe.com/pay/test" });
  });

  it("passes correct metadata to Stripe", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    await POST(makeRequest({ classId: "class-1" }));

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          type: "class_booking",
          user_id: "user-1",
          class_id: "class-1",
        }),
      })
    );
  });
});
