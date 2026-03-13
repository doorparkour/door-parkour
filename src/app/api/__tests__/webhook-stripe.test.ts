import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../webhooks/stripe/route";

vi.mock("@/lib/stripe/server", () => ({ getStripe: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("resend", () => ({ Resend: vi.fn().mockImplementation(function () { return { emails: { send: vi.fn().mockResolvedValue({}) } }; }) }));
vi.mock("@react-email/components", () => ({ render: vi.fn().mockResolvedValue("<html/>") }));

import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";

const mockConstructEvent = vi.fn();
const mockFrom = vi.fn();

function makeStripe() {
  return { webhooks: { constructEvent: mockConstructEvent } };
}

function makeSupabase() {
  const eq = vi.fn();
  const update = vi.fn().mockReturnValue({ eq });
  // insert supports both plain await AND .select().single() (used by handleMerchOrder)
  const insertSingle = vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null });
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
  const insert = vi.fn().mockReturnValue({ select: insertSelect });
  const single = vi.fn().mockResolvedValue({ data: null, error: null });
  // supports: .select().eq().eq().single()  (class booking lookup)
  //       and .select().in()                (products lookup in handleMerchOrder)
  const selectResult = {
    eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }), single }),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  const select = vi.fn().mockReturnValue(selectResult);

  eq.mockResolvedValue({ data: null, error: null });

  mockFrom.mockReturnValue({ select, insert, update });
  return { from: mockFrom };
}

function makeRequest(body = "raw-body", sig = "valid-sig") {
  return new Request("https://doorparkour.com/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": sig },
    body,
  });
}

function makeSession(type: string, extra: object = {}): object {
  return {
    metadata: { type, user_id: "user-1", class_id: "class-1", ...extra },
    payment_intent: "pi_test",
    id: "cs_test",
  };
}

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue(makeStripe() as never);
  vi.mocked(createClient).mockReturnValue(makeSupabase() as never);
  mockFrom.mockClear();
  mockConstructEvent.mockReset();
});

describe("POST /api/webhooks/stripe", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new Request("https://doorparkour.com/api/webhooks/stripe", {
      method: "POST",
      body: "body",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "No signature" });
  });

  it("returns 400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining("invalid signature") });
  });

  it("inserts a new booking on class_booking checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: makeSession("class_booking") },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("bookings");
  });

  it("does not manually update classes table on new booking (DB trigger owns spot decrement)", async () => {
    const mockClassUpdate = vi.fn();

    mockFrom.mockImplementation((table: string) => {
      if (table === "bookings") {
        const single = vi.fn().mockResolvedValue({ data: null, error: null });
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }),
          }),
          insert: vi.fn().mockResolvedValue({}),
        };
      }
      if (table === "classes") {
        return { update: mockClassUpdate };
      }
      return { select: vi.fn(), insert: vi.fn(), update: vi.fn() };
    });

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: makeSession("class_booking") },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockClassUpdate).not.toHaveBeenCalled();
  });

  it("updates existing booking on class_booking if one already exists", async () => {
    const supabase = makeSupabase();
    // single() returns existing booking
    const single = vi.fn().mockResolvedValue({ data: { id: "booking-1" }, error: null });
    const innerEq = vi.fn().mockReturnValue({ single });
    const outerEq = vi.fn().mockReturnValue({ eq: innerEq });
    const select = vi.fn().mockReturnValue({ eq: outerEq });
    const eq = vi.fn().mockResolvedValue({ data: null, error: null });
    const update = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select, update, insert: vi.fn() });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: makeSession("class_booking") },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed" })
    );
  });

  it("creates order and items on merch_order checkout.session.completed", async () => {
    const cart = JSON.stringify([{ productId: "prod-1", quantity: 1 }]);
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: makeSession("merch_order", {
          cart,
          total_cents: "2500",
          class_id: undefined,
        }),
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("orders");
  });

  it("decrements inventory for limited-supply products after merch order", async () => {
    const mockProductUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
    const cart = JSON.stringify([{ productId: "prod-limited", quantity: 2 }]);
    const productRows = [{ id: "prod-limited", price_cents: 2500, inventory: 10, on_demand: false }];

    mockFrom.mockImplementation((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: productRows, error: null }),
          }),
          update: mockProductUpdate,
        };
      }
      if (table === "orders") {
        const single = vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null });
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) };
      }
      return { insert: vi.fn().mockResolvedValue({}) };
    });

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: makeSession("merch_order", { cart, total_cents: "2500", class_id: undefined }) },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // 10 inventory - 2 quantity = 8
    expect(mockProductUpdate).toHaveBeenCalledWith({ inventory: 8 });
  });

  it("does not decrement inventory for on_demand products after merch order", async () => {
    const mockProductUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
    const cart = JSON.stringify([{ productId: "prod-ondemand", quantity: 3 }]);
    const productRows = [{ id: "prod-ondemand", price_cents: 2500, inventory: 0, on_demand: true }];

    mockFrom.mockImplementation((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: productRows, error: null }),
          }),
          update: mockProductUpdate,
        };
      }
      if (table === "orders") {
        const single = vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null });
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) };
      }
      return { insert: vi.fn().mockResolvedValue({}) };
    });

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: makeSession("merch_order", { cart, total_cents: "2500", class_id: undefined }) },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });

  it("sets payment_failed status on payment_intent.payment_failed", async () => {
    mockConstructEvent.mockReturnValue({
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_test", latest_charge: "ch_test" } },
    });

    const eq = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ update });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: "payment_failed" });
  });

  it("sets refunded on full charge.refunded", async () => {
    mockConstructEvent.mockReturnValue({
      type: "charge.refunded",
      data: {
        object: {
          payment_intent: "pi_test",
          amount: 4500,
          amount_refunded: 4500,
          metadata: {},
        },
      },
    });

    const eq = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ update });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: "refunded" });
  });

  it("sets partially_refunded on partial charge.refunded", async () => {
    mockConstructEvent.mockReturnValue({
      type: "charge.refunded",
      data: {
        object: {
          payment_intent: "pi_test",
          amount: 4500,
          amount_refunded: 2000,
          metadata: {},
        },
      },
    });

    const eq = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ update });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: "partially_refunded" });
  });

  it("returns received: true for unhandled event types", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.created",
      data: { object: {} },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
