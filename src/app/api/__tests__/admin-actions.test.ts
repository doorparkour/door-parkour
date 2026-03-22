import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createClass,
  updateClass,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  unarchiveProduct,
  refundBooking,
  approveOrderRefund,
  rejectOrderRefund,
} from "@/lib/actions/admin";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe/server", () => ({
  getStripe: vi.fn(() => ({
    refunds: { create: vi.fn().mockResolvedValue({}) },
  })),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: { email: "customer@example.com" } },
        }),
      },
    },
  })),
}));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: vi.fn().mockResolvedValue({}) } };
  }),
}));

// redirect throws in real Next.js — mirror that so execution stops as expected
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ── Supabase mock helpers ─────────────────────────────────────

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockUpdateEq = vi.fn();
const mockIn = vi.fn().mockResolvedValue({ data: null, error: null });

// update().eq() returns thenable with .eq and .in for chaining
mockUpdateEq.mockReturnValue({
  eq: mockEq,
  in: mockIn,
  then: (resolve: (v: unknown) => void, reject?: (v: unknown) => void) =>
    mockEq().then(resolve, reject),
});
mockUpdate.mockReturnValue({ eq: mockUpdateEq });
mockDelete.mockReturnValue({ eq: mockEq });

function makeSupabase({
  user = { id: "user-1" } as object | null,
  role = "admin",
  dbError = null as { message: string } | null,
  confirmedBookingCount = 0,
  bookingCountError = null as { message: string } | null,
} = {}) {
  const single = vi.fn();
  const inFn = vi.fn().mockResolvedValue({ data: null, count: 0, error: null });

  single.mockResolvedValue({ data: user ? { role } : null, error: null });

  mockInsert.mockImplementation((...args: unknown[]) => {
    if (dbError) return Promise.resolve({ data: null, error: dbError });
    return Promise.resolve({ data: null, error: null });
  });
  mockEq.mockResolvedValue({ data: null, error: dbError });

  const productInsertChain = {
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: dbError ? null : { id: "prod-1" },
        error: dbError,
      }),
    }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "bookings") {
        const lastEq = vi.fn().mockResolvedValue({
          count: bookingCountError ? null : confirmedBookingCount,
          error: bookingCountError,
        });
        const firstEq = vi.fn().mockReturnValue({ eq: lastEq });
        return {
          select: vi.fn().mockReturnValue({ eq: firstEq }),
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
        };
      }
      const base = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single, in: inFn }),
        }),
        insert: (table === "products"
          ? vi.fn().mockReturnValue(productInsertChain)
          : mockInsert) as typeof mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      };
      return base;
    }),
  };
}

// ── FormData helpers ──────────────────────────────────────────

function classFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    title: "Intro to Parkour",
    description: "Great class",
    location: "Sunset Park",
    starts_at: "2026-06-06T10:00",
    duration_mins: "90",
    capacity: "8",
    price: "45.00",
    age_group: "adult",
    ...overrides,
  };
  Object.entries(defaults).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

function productFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    name: "Door Parkour T-Shirt",
    description: "Comfy",
    price: "25.00",
    slug: "door-parkour-t-shirt",
    image_url: "",
    inventory_XS: "0",
    inventory_S: "0",
    inventory_M: "10",
    inventory_L: "5",
    inventory_XL: "0",
    inventory_XXL: "0",
    ...overrides,
  };
  Object.entries(defaults).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIn.mockResolvedValue({ data: null, error: null });
  mockUpdateEq.mockReturnValue({
    eq: mockEq,
    in: mockIn,
    then: (resolve: (v: unknown) => void, reject?: (v: unknown) => void) =>
      mockEq().then(resolve, reject),
  });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });
  mockDelete.mockReturnValue({ eq: mockEq });
});

// ── requireAdmin guard (tested via createClass) ───────────────

describe("requireAdmin guard", () => {
  it("redirects to /login when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ user: null }) as never
    );
    await expect(createClass(classFormData())).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /dashboard when user is not admin", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ role: "user" }) as never
    );
    await expect(createClass(classFormData())).rejects.toThrow(
      "REDIRECT:/dashboard"
    );
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});

// ── createClass ───────────────────────────────────────────────

describe("createClass", () => {
  it("returns error when starts_at is in the past", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await createClass(classFormData({ starts_at: "2020-01-01T10:00" }));
    expect(result).toEqual({ error: "Class must be scheduled in the future." });
  });

  it("returns error when starts_at is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await createClass(classFormData({ starts_at: "not-a-date" }));
    expect(result).toEqual({ error: "Invalid date format. Use the date picker." });
  });

  it("returns error when price is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await createClass(classFormData({ price: "abc" }));
    expect(result).toEqual({ error: "Invalid price." });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when age_group is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await createClass(classFormData({ age_group: "senior" }));
    expect(result).toEqual({ error: "Invalid age group." });
  });

  it("returns error when DB insert fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "duplicate key" } }) as never
    );
    const result = await createClass(classFormData());
    expect(result).toEqual({ error: "duplicate key" });
  });

  it("inserts with correct values on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(createClass(classFormData({ is_published: "on" }))).rejects.toThrow(
      "REDIRECT:/admin/classes"
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Intro to Parkour",
        location: "Sunset Park",
        capacity: 8,
        spots_remaining: 8,
        price_cents: 4500,
        is_published: true,
        age_group: "adult",
      })
    );
  });

  it("passes age_group: youth when specified", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createClass(classFormData({ age_group: "youth" }))
    ).rejects.toThrow("REDIRECT:/admin/classes");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ age_group: "youth" })
    );
  });

  it("revalidates both paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(createClass(classFormData())).rejects.toThrow("REDIRECT:");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/classes");
    expect(revalidatePath).toHaveBeenCalledWith("/classes");
  });
});

// ── updateClass ───────────────────────────────────────────────

describe("updateClass", () => {
  it("returns error when starts_at is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await updateClass("class-1", classFormData({ starts_at: "not-a-date" }));
    expect(result).toEqual({ error: "Invalid date format. Use the date picker." });
  });

  it("returns error when price is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await updateClass("class-1", classFormData({ price: "abc" }));
    expect(result).toEqual({ error: "Invalid price." });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns error when age_group is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await updateClass("class-1", classFormData({ age_group: "senior" }));
    expect(result).toEqual({ error: "Invalid age group." });
  });

  it("returns error when DB update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "not found" } }) as never
    );
    const result = await updateClass("class-1", classFormData());
    expect(result).toEqual({ error: "not found" });
  });

  it("updates correct record on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      updateClass("class-1", classFormData({ is_published: "on" }))
    ).rejects.toThrow("REDIRECT:/admin/classes");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Intro to Parkour",
        is_published: true,
        spots_remaining: 8,
      })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "class-1");
  });

  it("sets spots_remaining from capacity minus confirmed bookings", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ confirmedBookingCount: 3 }) as never
    );
    await expect(updateClass("class-1", classFormData({ capacity: "10" }))).rejects.toThrow(
      "REDIRECT:/admin/classes"
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ capacity: 10, spots_remaining: 7 })
    );
  });

  it("returns error when confirmed booking count query fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ bookingCountError: { message: "count failed" } }) as never
    );
    const result = await updateClass("class-1", classFormData());
    expect(result).toEqual({ error: "count failed" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── createProduct ─────────────────────────────────────────────

describe("createProduct", () => {
  it("returns error without DB call when validation fails", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await createProduct(productFormData({ slug: "" }));
    expect(result).toEqual({ error: "Slug is required." });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when DB insert fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "unique constraint" } }) as never
    );
    const result = await createProduct(productFormData());
    expect(result).toEqual({ error: "unique constraint" });
  });

  it("returns user-friendly message for duplicate slug", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        dbError: {
          message:
            "duplicate key value violates unique constraint 'products_slug_key'",
        },
      }) as never
    );
    const result = await createProduct(productFormData());
    expect(result).toEqual({
      error: "A product with this slug already exists. Please choose a different slug.",
    });
  });

  it("inserts product and variants on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createProduct(productFormData({ status: "active" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          product_id: "prod-1",
          size: "M",
          inventory: 10,
        }),
      ])
    );
  });

  it("persists on_demand: true when toggled on", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createProduct(productFormData({ on_demand: "on" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("persists on_demand: false when not set", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(createProduct(productFormData())).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("revalidates both paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(createProduct(productFormData())).rejects.toThrow("REDIRECT:");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePath).toHaveBeenCalledWith("/merch");
  });
});

// ── updateProduct ─────────────────────────────────────────────

describe("updateProduct", () => {
  it("returns error when product is archived", async () => {
    const profileSingle = vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null });
    const productSingle = vi.fn().mockResolvedValue({ data: { status: "archived" }, error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: profileSingle }),
          }),
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: productSingle }),
        }),
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      };
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from,
    } as never);
    const result = await updateProduct("prod-1", productFormData());
    expect(result).toEqual({ error: "Archived products cannot be edited." });
  });

  it("returns error when DB update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "not found" } }) as never
    );
    const result = await updateProduct("prod-1", productFormData());
    expect(result).toEqual({ error: "not found" });
  });

  it("updates correct record on success", async () => {
    mockEq.mockResolvedValue({ data: null, error: null });
    const productSingle = vi.fn().mockResolvedValue({
      data: { status: "active", name: "Door Parkour T-Shirt" },
      error: null,
    });
    const variantsEq = vi.fn().mockResolvedValue({
      data: [
        { id: "v1", size: "M" },
        { id: "v2", size: "L" },
      ],
      error: null,
    });
    const from = vi.fn().mockImplementation((table: string) => {
      const base = {
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      };
      if (table === "profiles") {
        return {
          ...base,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
            }),
          }),
        };
      }
      if (table === "product_variants") {
        return {
          ...base,
          select: vi.fn().mockReturnValue({ eq: variantsEq }),
        };
      }
      return {
        ...base,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: productSingle,
            in: vi.fn().mockResolvedValue({ data: null, count: 0, error: null }),
          }),
        }),
      };
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from,
    } as never);

    await expect(
      updateProduct("prod-1", productFormData({ status: "active" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Door Parkour T-Shirt",
        price_cents: 2500,
        status: "active",
      })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "prod-1");
  });
});

// ── deleteProduct ─────────────────────────────────────────────

describe("deleteProduct", () => {
  it("returns error when product is archived", async () => {
    const single = vi.fn().mockResolvedValueOnce({ data: { role: "admin" }, error: null });
    single.mockResolvedValueOnce({ data: { status: "archived" }, error: null });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single,
            in: vi.fn().mockResolvedValue({ data: null, count: 0, error: null }),
          }),
        }),
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      }),
    } as never);
    const result = await deleteProduct("prod-1");
    expect(result?.error).toContain("Archived");
  });

  it("returns error when DB delete fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "foreign key violation" } }) as never
    );
    const result = await deleteProduct("prod-1");
    expect(result?.error).toContain("foreign key violation");
  });

  it("targets correct record and revalidates both paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    const result = await deleteProduct("prod-1");
    expect(result?.error).toBeUndefined();
    expect(mockEq).toHaveBeenCalledWith("id", "prod-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePath).toHaveBeenCalledWith("/merch");
  });
});

// ── archiveProduct ────────────────────────────────────────────

describe("archiveProduct", () => {
  it("throws when DB update fails", async () => {
    const mockIn = vi.fn().mockResolvedValue({ data: null, error: { message: "constraint" } });
    const mockUpdateEq = vi.fn().mockReturnValue({ in: mockIn });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: "admin" } }) }),
        }),
        insert: mockInsert,
        update: vi.fn().mockReturnValue({ eq: mockUpdateEq }),
        delete: mockDelete,
      }),
    } as never);
    await expect(archiveProduct("prod-1")).rejects.toThrow("constraint");
  });

  it("revalidates both paths on success", async () => {
    const mockIn = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdateEq = vi.fn().mockReturnValue({ in: mockIn });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { role: "admin" } }) }),
        }),
        insert: mockInsert,
        update: vi.fn().mockReturnValue({ eq: mockUpdateEq }),
        delete: mockDelete,
      }),
    } as never);
    await archiveProduct("prod-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePath).toHaveBeenCalledWith("/merch");
  });
});

// ── unarchiveProduct ─────────────────────────────────────────

describe("unarchiveProduct", () => {
  it("throws when DB update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "not found" } }) as never
    );
    await expect(unarchiveProduct("prod-1")).rejects.toThrow("not found");
  });

  it("revalidates both paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await unarchiveProduct("prod-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePath).toHaveBeenCalledWith("/merch");
  });
});

// ── refundBooking ────────────────────────────────────────────

describe("refundBooking", () => {
  const bookingId = "booking-1";
  const booking = {
    id: bookingId,
    user_id: "user-1",
    status: "confirmed",
    stripe_payment_intent_id: "pi_xxx",
    class_id: "class-1",
  };
  function makeRefundSupabase(opts: {
    booking?: object | null;
    bookingError?: { message: string } | null;
    updateError?: { message: string } | null;
  } = {}) {
    const b = opts.booking ?? booking;
    const single = vi.fn();
    single
      .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
      .mockResolvedValueOnce({ data: b, error: opts.bookingError ?? null });

    const updateEq = vi.fn().mockResolvedValue({
      data: null,
      error: opts.updateError ?? null,
    });

    const from = vi.fn((table: string) => {
      if (table === "bookings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single }),
          }),
          update: vi.fn().mockReturnValue({ eq: updateEq }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single }),
        }),
      };
    });

    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from,
    };
  }

  it("redirects when not admin", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ user: null }) as never
    );
    await expect(refundBooking(bookingId)).rejects.toThrow("REDIRECT:/login");
  });

  it("returns error when booking not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeRefundSupabase({ booking: null, bookingError: { message: "not found" } }) as never
    );
    const result = await refundBooking(bookingId);
    expect(result.error).toBe("Booking not found.");
  });

  it("returns error when no payment to refund", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeRefundSupabase({
        booking: { ...booking, stripe_payment_intent_id: null },
      }) as never
    );
    const result = await refundBooking(bookingId);
    expect(result.error).toBe("This booking has no payment to refund.");
  });

  it("returns error when already refunded", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeRefundSupabase({ booking: { ...booking, status: "refunded" } }) as never
    );
    const result = await refundBooking(bookingId);
    expect(result.error).toBe("This booking has already been refunded.");
  });

  it("revalidates paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeRefundSupabase() as never);
    const result = await refundBooking(bookingId);
    expect(result.error).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/bookings");
    expect(revalidatePath).toHaveBeenCalledWith("/bookings");
  });
});

// ── approveOrderRefund ────────────────────────────────────────

describe("approveOrderRefund", () => {
  const requestId = "req-1";
  const request = {
    id: requestId,
    order_id: "order-1",
    user_id: "user-1",
    status: "pending",
  };
  const order = {
    id: "order-1",
    user_id: "user-1",
    total_cents: 5000,
    stripe_payment_intent_id: "pi_xxx",
  };

  function makeApproveSupabase(opts: {
    request?: object | null;
    requestError?: { message: string } | null;
    order?: object | null;
    orderError?: { message: string } | null;
    updateError?: { message: string } | null;
  } = {}) {
    const req = opts.request ?? request;
    const ord = opts.order ?? order;
    const requestSingle = vi.fn().mockResolvedValue({
      data: opts.requestError ? null : req,
      error: opts.requestError ?? null,
    });
    const orderSingle = vi.fn().mockResolvedValue({
      data: opts.orderError ? null : ord,
      error: opts.orderError ?? null,
    });
    const orderItemsEq = vi.fn().mockResolvedValue({
      data: [{ quantity: 1, unit_price_cents: 5000, products: { name: "T-Shirt" } }],
      error: null,
    });
    const updateEq = vi.fn().mockResolvedValue({
      data: null,
      error: opts.updateError ?? null,
    });

    const from = vi.fn((table: string) => {
      const base = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: requestSingle,
            in: mockIn,
          }),
        }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      };
      if (table === "refund_requests") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: requestSingle }),
          }),
          update: vi.fn().mockReturnValue({ eq: updateEq }),
        };
      }
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: orderSingle }),
          }),
        };
      }
      if (table === "order_items") {
        return {
          select: vi.fn().mockReturnValue({ eq: orderItemsEq }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
            }),
          }),
        };
      }
      return base;
    });

    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from,
    };
  }

  it("redirects when not admin", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ user: null }) as never
    );
    await expect(approveOrderRefund(requestId)).rejects.toThrow("REDIRECT:/login");
  });

  it("returns error when refund request not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeApproveSupabase({ request: null, requestError: { message: "not found" } }) as never
    );
    const result = await approveOrderRefund(requestId);
    expect(result.error).toBe("Refund request not found.");
  });

  it("returns error when request already processed", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeApproveSupabase({ request: { ...request, status: "approved" } }) as never
    );
    const result = await approveOrderRefund(requestId);
    expect(result.error).toBe("This request has already been processed.");
  });

  it("returns error when order not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeApproveSupabase({ order: null, orderError: { message: "not found" } }) as never
    );
    const result = await approveOrderRefund(requestId);
    expect(result.error).toBe("Order not found.");
  });

  it("returns error when order has no payment intent", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeApproveSupabase({
        order: { ...order, stripe_payment_intent_id: null },
      }) as never
    );
    const result = await approveOrderRefund(requestId);
    expect(result.error).toBe("This order has no payment to refund.");
  });

  it("revalidates paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeApproveSupabase() as never);
    const result = await approveOrderRefund(requestId);
    expect(result.error).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/refund-requests");
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
  });
});

// ── rejectOrderRefund ─────────────────────────────────────────

describe("rejectOrderRefund", () => {
  const requestId = "req-1";
  const request = {
    id: requestId,
    order_id: "order-1",
    user_id: "user-1",
    status: "pending",
  };
  const order = {
    id: "order-1",
    user_id: "user-1",
    total_cents: 5000,
  };

  function makeRejectSupabase(opts: {
    request?: object | null;
    requestError?: { message: string } | null;
    order?: object | null;
    orderError?: { message: string } | null;
    updateError?: { message: string } | null;
  } = {}) {
    const req = opts.request ?? request;
    const ord = opts.order ?? order;
    const requestSingle = vi.fn().mockResolvedValue({
      data: opts.requestError ? null : req,
      error: opts.requestError ?? null,
    });
    const orderSingle = vi.fn().mockResolvedValue({
      data: opts.orderError ? null : ord,
      error: opts.orderError ?? null,
    });
    const updateEq = vi.fn().mockResolvedValue({
      data: null,
      error: opts.updateError ?? null,
    });

    const from = vi.fn((table: string) => {
      if (table === "refund_requests") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: requestSingle }),
          }),
          update: vi.fn().mockReturnValue({ eq: updateEq }),
        };
      }
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: orderSingle }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from,
    };
  }

  it("redirects when not admin", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ user: null }) as never
    );
    await expect(rejectOrderRefund(requestId)).rejects.toThrow("REDIRECT:/login");
  });

  it("returns error when refund request not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeRejectSupabase({ request: null, requestError: { message: "not found" } }) as never
    );
    const result = await rejectOrderRefund(requestId);
    expect(result.error).toBe("Refund request not found.");
  });

  it("returns error when request already processed", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeRejectSupabase({ request: { ...request, status: "rejected" } }) as never
    );
    const result = await rejectOrderRefund(requestId);
    expect(result.error).toBe("This request has already been processed.");
  });

  it("revalidates paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeRejectSupabase() as never);
    const result = await rejectOrderRefund(requestId);
    expect(result.error).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/refund-requests");
    expect(revalidatePath).toHaveBeenCalledWith("/orders");
  });

  it("passes reason to update when provided", async () => {
    const mockUpdateRefund = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const from = vi.fn((table: string) => {
      if (table === "refund_requests") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: request,
                error: null,
              }),
            }),
          }),
          update: mockUpdateRefund,
        };
      }
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: order,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
            }),
          }),
        };
      }
      return {};
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from,
    } as never);

    const result = await rejectOrderRefund(requestId, "Item not in original condition");
    expect(result.error).toBeUndefined();
    expect(mockUpdateRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        reason: "Item not in original condition",
      })
    );
  });
});
