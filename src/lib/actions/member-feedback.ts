"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { userHasCompletedEligibleClass } from "@/lib/bookings/member-feedback-eligibility";
import {
  MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH,
  MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH,
} from "@/lib/member-feedback/constants";

export type SubmitMemberFeedbackResult =
  | { success: true }
  | { error: string };

export async function submitMemberFeedback(
  message: string,
  consentTestimonial: boolean
): Promise<SubmitMemberFeedbackResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to submit feedback." };
  }

  const trimmed = typeof message === "string" ? message.trim() : "";
  if (trimmed.length < MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH) {
    return {
      error: `Please write at least ${MIN_MEMBER_FEEDBACK_MESSAGE_LENGTH} characters.`,
    };
  }
  if (trimmed.length > MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH) {
    return {
      error: `Feedback must be at most ${MAX_MEMBER_FEEDBACK_MESSAGE_LENGTH} characters.`,
    };
  }

  const { data: existing } = await supabase
    .from("member_feedback")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "You’ve already submitted your review." };
  }

  const eligible = await userHasCompletedEligibleClass(supabase, user.id);
  if (!eligible) {
    return {
      error: "You can submit feedback after you’ve completed a class.",
    };
  }

  const { error: insertError } = await supabase.from("member_feedback").insert({
    user_id: user.id,
    message: trimmed,
    consent_testimonial: Boolean(consentTestimonial),
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/member-feedback");

  return { success: true };
}
