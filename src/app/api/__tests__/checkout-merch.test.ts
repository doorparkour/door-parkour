import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../checkout/merch/route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe/server", () => ({ getStripe: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

const mockSessionCreate = vi.fn();

const products = [
  {
    id: "prod-1",
    name: "Door Parkour Tee",
    description: null,
    image_url: null,
    price_cents: 2500,
    on_demand: false,
  },
  {
    id: "prod-2",
    name: "Hoodie",
    description: "Warm",
    image_url: null,
    price_cents: 5000,
    on_demand: true,
  },
  {
    id: "prod-3",
    name: "Hat",
    description: null,
    image_url: null,
    price_cents: 1500,
    on_demand: false,
  },
];

const variants = [
  { id: "var-1", product_id: "prod-1", size: "M", inventory: 10 },
  { id: "var-2", product_id: "prod-2", size: null, inventory: 0 },
  { id: "var-3", product_id: "prod-3", size: null, inventory: 0 },
];

function makeRequest(body: object) {
  return new Request("https://doorparkour.com/api/checkout/merch", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function chain(result: object) {
  const node: Record<string, unknown> = {
    then: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
  };
  ["select", "in"].forEach((m) => {
    node[m] = vi.fn().mockReturnValue(node);
  });
  node.eq = vi.fn().mockResolvedValue(result);
  return node;
}

function makeSupabase({
  user = { id: "user-1", email: "u@test.com" },
  authed = true,
  variantData = variants,
  variantError = null,
  productData = products,
  productError = null,
}: {
  user?: object | null;
  authed?: boolean;
  variantData?: object[] | null;
  variantError?: object | null;
  productData?: object[] | null;
  productError?: object | null;
} = {}) {
  let callCount = 0;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authed ? user : null },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      callCount++;
      if (table === "product_variants") {
        return chain({ data: variantData, error: variantError });
      }
      return chain({ data: productData, error: productError });
    }),
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

    const res = await POST(
      makeRequest({
        items: [{ variantId: "var-1", productId: "prod-1", quantity: 1 }],
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when cart is empty", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(makeRequest({ items: [] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Cart is empty" });
  });

  it("returns 500 when variants fail to load", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        variantData: null,
        variantError: { message: "db error" },
      }) as never
    );

    const res = await POST(
      makeRequest({
        items: [{ variantId: "var-1", productId: "prod-1", quantity: 1 }],
      })
    );
    expect(res.status).toBe(500);
  });

  it("returns 400 when a cart item references an unknown variant", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(
      makeRequest({
        items: [
          { variantId: "unknown-id", productId: "prod-1", quantity: 1 },
        ],
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "A cart item is no longer available",
    });
  });

  it("returns 400 when a limited-supply product is out of stock", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    // var-3 (Hat) has inventory=0 and on_demand=false
    const res = await POST(
      makeRequest({
        items: [{ variantId: "var-3", productId: "prod-3", quantity: 1 }],
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining("out of stock"),
    });
  });

  it("returns 400 when requested quantity exceeds available inventory", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    // var-1 has inventory: 10; requesting 11
    const res = await POST(
      makeRequest({
        items: [{ variantId: "var-1", productId: "prod-1", quantity: 11 }],
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining("Only 10"),
    });
  });

  it("allows checkout when on-demand product has zero inventory", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    // var-2 has inventory=0 but on_demand=true — should still proceed
    const res = await POST(
      makeRequest({
        items: [{ variantId: "var-2", productId: "prod-2", quantity: 1 }],
      })
    );
    expect(res.status).toBe(200);
  });

  it("returns checkout URL on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST(
      makeRequest({
        items: [{ variantId: "var-1", productId: "prod-1", quantity: 2 }],
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://stripe.com/pay/merch" });
  });

  it("passes correct metadata to Stripe", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const items = [{ variantId: "var-1", productId: "prod-1", quantity: 1 }];

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
