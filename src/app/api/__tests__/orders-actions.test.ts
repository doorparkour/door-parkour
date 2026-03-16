import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestOrderRefund } from "@/lib/actions/orders";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

function makeSupabase(opts: {
  user?: object | null;
  profile?: { return_policy_agreed_at: string | null } | null;
  order?: object | null;
  orderError?: { message: string } | null;
  existingRequest?: object | null;
  insertError?: { message: string } | null;
} = {}) {
  const user = opts.user === undefined ? { id: "user-1" } : opts.user;
  const profile = opts.profile ?? { return_policy_agreed_at: "2026-01-01T00:00:00Z" };
  const order = opts.order ?? {
    id: "order-1",
    user_id: "user-1",
    status: "paid",
    stripe_payment_intent_id: "pi_xxx",
  };
  const existingRequest = opts.existingRequest ?? null;

  const profileSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  const orderSingle = vi.fn().mockResolvedValue({
    data: opts.orderError ? null : order,
    error: opts.orderError ?? null,
  });
  const refundMaybeSingle = vi.fn().mockResolvedValue({
    data: existingRequest,
    error: null,
  });

  mockInsert.mockResolvedValue({
    data: null,
    error: opts.insertError ?? null,
  });

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: profileSingle }),
        }),
      };
    }
    if (table === "orders") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: orderSingle }),
        }),
      };
    }
    if (table === "refund_requests") {
      const eqStatus = vi.fn().mockReturnValue({ maybeSingle: refundMaybeSingle });
      const eqOrderId = vi.fn().mockReturnValue({ eq: eqStatus });
      return {
        select: vi.fn().mockReturnValue({ eq: eqOrderId }),
        insert: mockInsert,
      };
    }
    return {};
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: user ? user : null },
        error: null,
      }),
    },
    from,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestOrderRefund", () => {
  it("returns error when not logged in", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ user: null }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe("You must be logged in to request a refund.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when return policy not agreed", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ profile: { return_policy_agreed_at: null } }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe(
      "You must agree to the return policy before requesting a refund."
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when order not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ orderError: { message: "not found" } }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe("Order not found.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when order belongs to another user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        order: {
          id: "order-1",
          user_id: "other-user",
          status: "paid",
          stripe_payment_intent_id: "pi_xxx",
        },
      }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe("You can only request refunds for your own orders.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when order is not eligible (cancelled)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        order: {
          id: "order-1",
          user_id: "user-1",
          status: "cancelled",
          stripe_payment_intent_id: "pi_xxx",
        },
      }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe("This order is not eligible for a refund request.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when order has no payment intent", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        order: {
          id: "order-1",
          user_id: "user-1",
          status: "paid",
          stripe_payment_intent_id: null,
        },
      }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe("This order has no payment to refund.");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when refund request already pending", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ existingRequest: { id: "req-1" } }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe(
      "A refund request is already pending for this order."
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ insertError: { message: "constraint violation" } }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBe("constraint violation");
  });

  it("inserts refund request and revalidates on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBeUndefined();
    expect(mockInsert).toHaveBeenCalledWith({
      order_id: "order-1",
      user_id: "user-1",
      status: "pending",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
  });

  it("accepts fulfilled orders as eligible", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        order: {
          id: "order-1",
          user_id: "user-1",
          status: "fulfilled",
          stripe_payment_intent_id: "pi_xxx",
        },
      }) as never
    );

    const result = await requestOrderRefund("order-1");
    expect(result.error).toBeUndefined();
    expect(mockInsert).toHaveBeenCalled();
  });
});
