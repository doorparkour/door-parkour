import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../waiver/sign/route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/waiver/pdf", () => ({
  generateWaiverPdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockUpload = vi.fn().mockResolvedValue({ data: null, error: null });
const mockFromStorage = vi.fn().mockReturnValue({ upload: mockUpload });

function makeSupabase({
  user = { id: "user-1" },
  authed = true,
  updateError = null,
  profile = { full_name: "Jane Smith" },
}: {
  user?: object | null;
  authed?: boolean;
  updateError?: { message: string } | null;
  profile?: { full_name: string | null } | null;
} = {}) {
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ data: null, error: updateError });

  const selectChain = {
    eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: profile, error: null }) }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authed ? user : null },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue(selectChain),
          update: mockUpdate,
        };
      }
      return { update: mockUpdate };
    }),
  };
}

function makeAdminSupabase() {
  return {
    storage: {
      from: mockFromStorage,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpload.mockResolvedValue({ data: null, error: null });
  vi.mocked(createAdminClient).mockReturnValue(makeAdminSupabase() as never);
});

describe("POST /api/waiver/sign", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ authed: false }) as never
    );

    const res = await POST();
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 200 and updates profile on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        waiver_signed_at: expect.any(String),
        waiver_pdf_path: "user-1/waiver.pdf",
      })
    );
    expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    expect(mockUpload).toHaveBeenCalledWith(
      "user-1/waiver.pdf",
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "application/pdf", upsert: true })
    );
  });

  it("returns 500 when update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ updateError: { message: "db error" } }) as never
    );

    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "db error" });
  });

  it("returns 500 when storage upload fails", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    mockUpload.mockResolvedValue({ data: null, error: { message: "storage error" } });

    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "Failed to save waiver copy" });
  });
});
