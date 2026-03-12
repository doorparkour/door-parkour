import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "../account/delete/route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const mockDeleteUser = vi.fn();

function makeServerClient(user: object | null, authError: Error | null = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: authError }),
    },
  };
}

function makeAdminClient() {
  return { auth: { admin: { deleteUser: mockDeleteUser } } };
}

beforeEach(() => {
  vi.mocked(createAdminClient).mockReturnValue(makeAdminClient() as never);
  mockDeleteUser.mockReset();
});

describe("DELETE /api/account/delete", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerClient(null) as never
    );

    const res = await DELETE();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns 401 when getUser returns an error", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerClient(null, new Error("session expired")) as never
    );

    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("returns 500 when deleteUser fails", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerClient({ id: "user-1" }) as never
    );
    mockDeleteUser.mockResolvedValue({ error: { message: "delete failed" } });

    const res = await DELETE();
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "delete failed" });
  });

  it("returns success when user is deleted", async () => {
    vi.mocked(createServerClient).mockResolvedValue(
      makeServerClient({ id: "user-1" }) as never
    );
    mockDeleteUser.mockResolvedValue({ error: null });

    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1");
  });
});
