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
} = {}) {
  const single = vi.fn();
  const inFn = vi.fn().mockResolvedValue({ data: null, count: 0, error: null });

  // First single() call → profile with role; subsequent calls reuse same mock
  single.mockResolvedValue({ data: user ? { role } : null, error: null });

  mockInsert.mockResolvedValue({ data: null, error: dbError });
  mockEq.mockResolvedValue({ data: null, error: dbError });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single, in: inFn }),
      }),
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
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
    inventory: "10",
    slug: "door-parkour-t-shirt-m",
    image_url: "",
    size: "M",
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
  it("throws when starts_at is in the past", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createClass(classFormData({ starts_at: "2020-01-01T10:00" }))
    ).rejects.toThrow("Class must be scheduled in the future.");
  });

  it("throws when starts_at is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createClass(classFormData({ starts_at: "not-a-date" }))
    ).rejects.toThrow("Invalid date format");
  });

  it("throws when price is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createClass(classFormData({ price: "abc" }))
    ).rejects.toThrow("Invalid price.");
  });

  it("throws when age_group is invalid", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createClass(classFormData({ age_group: "senior" }))
    ).rejects.toThrow("Invalid age group.");
  });

  it("throws when DB insert fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "duplicate key" } }) as never
    );
    await expect(createClass(classFormData())).rejects.toThrow("duplicate key");
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
  it("throws when DB update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "not found" } }) as never
    );
    await expect(updateClass("class-1", classFormData())).rejects.toThrow(
      "not found"
    );
  });

  it("updates correct record on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      updateClass("class-1", classFormData({ is_published: "on" }))
    ).rejects.toThrow("REDIRECT:/admin/classes");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Intro to Parkour", is_published: true })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "class-1");
  });
});

// ── createProduct ─────────────────────────────────────────────

describe("createProduct", () => {
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

  it("inserts with correct values on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createProduct(productFormData({ status: "active" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Door Parkour T-Shirt",
        slug: "door-parkour-t-shirt-m",
        price_cents: 2500,
        inventory: 10,
        status: "active",
        size: "M",
      })
    );
  });

  it("defaults inventory to 0 when omitted (on-demand)", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createProduct(productFormData({ inventory: "" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ inventory: 0 })
    );
  });

  it("persists on_demand: true when toggled on", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createProduct(productFormData({ on_demand: "on" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ on_demand: true })
    );
  });

  it("stores null size for accessories (no size in formData)", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createProduct(productFormData({ size: "" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ size: null })
    );
  });

  it("persists on_demand: false when not set", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(createProduct(productFormData())).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ on_demand: false })
    );
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
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      updateProduct("prod-1", productFormData({ status: "active" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Door Parkour T-Shirt", price_cents: 2500, status: "active", size: "M" })
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
  const cls = { title: "Intro", starts_at: "2026-06-06T10:00:00Z", price_cents: 4500 };

  function makeRefundSupabase(opts: {
    booking?: object | null;
    bookingError?: { message: string } | null;
    class?: object | null;
    updateError?: { message: string } | null;
  } = {}) {
    const b = opts.booking ?? booking;
    const c = opts.class ?? cls;
    const single = vi.fn();
    single
      .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
      .mockResolvedValueOnce({ data: b, error: opts.bookingError ?? null })
      .mockResolvedValueOnce({ data: c, error: null });

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

  it("returns error when class not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeRefundSupabase({ class: null }) as never
    );
    const single = vi.fn();
    single
      .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
      .mockResolvedValueOnce({ data: booking, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single }),
      }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
    }));
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from,
    } as never);
    const result = await refundBooking(bookingId);
    expect(result.error).toBe("Class not found.");
  });

  it("revalidates paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeRefundSupabase() as never);
    const result = await refundBooking(bookingId);
    expect(result.error).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/bookings");
    expect(revalidatePath).toHaveBeenCalledWith("/bookings");
  });
});
