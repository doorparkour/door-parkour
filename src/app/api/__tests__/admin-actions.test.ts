import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createClass,
  updateClass,
  deleteClass,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/actions/admin";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

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

mockUpdate.mockReturnValue({ eq: mockEq });
mockDelete.mockReturnValue({ eq: mockEq });

function makeSupabase({
  user = { id: "user-1" } as object | null,
  role = "admin",
  dbError = null as { message: string } | null,
} = {}) {
  const single = vi.fn();

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
        eq: vi.fn().mockReturnValue({ single }),
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
    ...overrides,
  };
  Object.entries(defaults).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

function productFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    name: "Door Parkour Tee",
    description: "Comfy",
    price: "25.00",
    inventory: "10",
    slug: "door-parkour-tee",
    image_url: "",
    ...overrides,
  };
  Object.entries(defaults).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockReturnValue({ eq: mockEq });
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
      })
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
    expect(mockEq).toHaveBeenCalledWith("id", "class-1");
  });
});

// ── createProduct ─────────────────────────────────────────────

describe("createProduct", () => {
  it("throws when DB insert fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "unique constraint" } }) as never
    );
    await expect(createProduct(productFormData())).rejects.toThrow(
      "unique constraint"
    );
  });

  it("inserts with correct values on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      createProduct(productFormData({ is_active: "on" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Door Parkour Tee",
        slug: "door-parkour-tee",
        price_cents: 2500,
        inventory: 10,
        is_active: true,
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
  it("throws when DB update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "not found" } }) as never
    );
    await expect(updateProduct("prod-1", productFormData())).rejects.toThrow(
      "not found"
    );
  });

  it("updates correct record on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await expect(
      updateProduct("prod-1", productFormData({ is_active: "on" }))
    ).rejects.toThrow("REDIRECT:/admin/products");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Door Parkour Tee", price_cents: 2500, is_active: true })
    );
    expect(mockEq).toHaveBeenCalledWith("id", "prod-1");
  });
});

// ── deleteClass ───────────────────────────────────────────────

describe("deleteClass", () => {
  it("throws when DB delete fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "foreign key violation" } }) as never
    );
    await expect(deleteClass("class-1")).rejects.toThrow("foreign key violation");
  });

  it("targets correct record and revalidates both paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await deleteClass("class-1");
    expect(mockEq).toHaveBeenCalledWith("id", "class-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/classes");
    expect(revalidatePath).toHaveBeenCalledWith("/classes");
  });
});

// ── deleteProduct ─────────────────────────────────────────────

describe("deleteProduct", () => {
  it("throws when DB delete fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ dbError: { message: "foreign key violation" } }) as never
    );
    await expect(deleteProduct("prod-1")).rejects.toThrow("foreign key violation");
  });

  it("targets correct record and revalidates both paths on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    await deleteProduct("prod-1");
    expect(mockEq).toHaveBeenCalledWith("id", "prod-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(revalidatePath).toHaveBeenCalledWith("/merch");
  });
});
