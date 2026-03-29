import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitMemberFeedback } from "@/lib/actions/member-feedback";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/bookings/member-feedback-eligibility", () => ({
  userHasCompletedEligibleClass: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { userHasCompletedEligibleClass } from "@/lib/bookings/member-feedback-eligibility";
import {
  MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH,
  MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH,
} from "@/lib/member-feedback/constants";

const mockInsert = vi.fn();

function makeSupabase(opts: {
  user?: object | null;
  existingFeedback?: { id: string } | null;
  insertError?: { message: string } | null;
} = {}) {
  const user = opts.user === undefined ? { id: "user-1" } : opts.user;
  const existingFeedback =
    opts.existingFeedback === undefined ? null : opts.existingFeedback;

  const feedbackMaybeSingle = vi.fn().mockResolvedValue({
    data: existingFeedback,
    error: null,
  });

  mockInsert.mockResolvedValue({
    data: null,
    error: opts.insertError ?? null,
  });

  const from = vi.fn((table: string) => {
    if (table === "member_feedback") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: feedbackMaybeSingle }),
        }),
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
  vi.mocked(userHasCompletedEligibleClass).mockResolvedValue(true);
});

describe("submitMemberFeedback", () => {
  const validMessage = "x".repeat(MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH);

  it("returns error when not logged in", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ user: null }) as never);

    const result = await submitMemberFeedback(validMessage, false);
    expect(result).toEqual({ error: "You must be logged in to submit feedback." });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when message too short after trim", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const result = await submitMemberFeedback("  short  ", false);
    expect(result).toEqual({
      error: `Please write at least ${MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH} characters.`,
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when message too long", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const result = await submitMemberFeedback("a".repeat(MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH + 1), false);
    expect(result).toEqual({
      error: `Feedback must be at most ${MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH} characters.`,
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when already submitted", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ existingFeedback: { id: "fb-1" } }) as never
    );

    const result = await submitMemberFeedback(validMessage, false);
    expect(result).toEqual({ error: "You’ve already submitted your review." });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when not eligible", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);
    vi.mocked(userHasCompletedEligibleClass).mockResolvedValue(false);

    const result = await submitMemberFeedback(validMessage, false);
    expect(result).toEqual({
      error: "You can submit feedback after you’ve completed a class.",
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when insert fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ insertError: { message: "db oops" } }) as never
    );

    const result = await submitMemberFeedback(validMessage, true);
    expect(result).toEqual({ error: "db oops" });
  });

  it("inserts, revalidates, and returns success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    const result = await submitMemberFeedback(`  ${validMessage}  `, true);
    expect(result).toEqual({ success: true });
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      message: validMessage,
      consent_testimonial: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/member-feedback");
  });

  it("persists consent false", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as never);

    await submitMemberFeedback(validMessage, false);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      message: validMessage,
      consent_testimonial: false,
    });
  });
});
