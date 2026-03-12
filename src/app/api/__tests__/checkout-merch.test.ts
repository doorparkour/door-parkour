import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../checkout/merch/route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe/server", () => ({ getStripe: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

const mockSessionCreate = vi.fn();

const products = [
  { id: "prod-1", name: "T-Shirt", description: null, image_url: null, price_cents: 2500 },
  { id: "prod-2", name: "Hoodie", description: "Warm", image_url: null, price_cents: 5000 },
];

function makeRequest(body: object) {
  return new Request("https://doorparkour.com/api/checkout/merch", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function chain(result: object) {
  const node: Record<string, unknown> = {};
  ["select", "in"].forEach((m) => {
    node[m] = vi.fn().mockReturnValue(node);
  });
  // .eq() is the terminal call: .select("*").in(...).eq("is_active", true)
  node.eq = vi.fn().mockResolvedValue(result);
  return node;
}

function makeSupabase({
  user = { id: "user-1", email: "u@test.com" },
  authed = true,
  productData = products,
  productError = null,
}: {
  user?: object | null;
  authed?: boolean;
  productData?: object[] | null;
  productError?: object | null;
} = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authed ? user : null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(chain({ data: productData, error: productError })),
  };
}

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue({
    checkout: { sessions: { create: mockSessionCreate } },
  } as never);
  mockSessionCreate.mockResolvedValue({ url: "https://stripe.com/pay/merch" });
});

describe("POST /api/checkout/merch", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ authed: false }) as never
    );

    const res = await POST(makeRequest({ items: [{ productId: "prod-1", quantity: 1 }] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when cart is empty", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(makeRequest({ items: [] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Cart is empty" });
  });

  it("returns 500 when products fail to load", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ productData: null, productError: { message: "db error" } }) as never
    );

    const res = await POST(makeRequest({ items: [{ productId: "prod-1", quantity: 1 }] }));
    expect(res.status).toBe(500);
  });

  it("returns 400 when a cart item references an unknown product", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(makeRequest({ items: [{ productId: "unknown-id", quantity: 1 }] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Product unknown-id not found" });
  });

  it("returns checkout URL on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(
      makeRequest({ items: [{ productId: "prod-1", quantity: 2 }] })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://stripe.com/pay/merch" });
  });

  it("passes correct metadata to Stripe", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const items = [{ productId: "prod-1", quantity: 1 }];

    await POST(makeRequest({ items }));

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          type: "merch_order",
          user_id: "user-1",
          total_cents: "2500",
        }),
      })
    );
  });
});
