import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../waiver/sign/route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";

const mockUpdate = vi.fn();
const mockEq = vi.fn();

function makeSupabase({
  user = { id: "user-1" },
  authed = true,
  updateError = null,
}: {
  user?: object | null;
  authed?: boolean;
  updateError?: { message: string } | null;
} = {}) {
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ data: null, error: updateError });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authed ? user : null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      update: mockUpdate,
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
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
      })
    );
    expect(mockEq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns 500 when update fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ updateError: { message: "db error" } }) as never
    );

    const res = await POST();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "db error" });
  });
});
