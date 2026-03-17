/**
 * Refund rejection reasons for admin use. Maps to email copy sent to customers.
 */

export const REJECTION_REASON_OTHER = "other" as const;

export const REJECTION_REASON_OPTIONS = [
  { value: "outside_refund_window", label: "Order outside 14-day refund window" },
  { value: "sale_item_excluded", label: "Sale item excluded from refunds" },
  { value: REJECTION_REASON_OTHER, label: "Other" },
] as const;

export type RejectionReasonCode = (typeof REJECTION_REASON_OPTIONS)[number]["value"];

/** Customer-facing copy for rejection emails. Worded for the recipient, not admin jargon. */
const EMAIL_COPY: Record<Exclude<RejectionReasonCode, typeof REJECTION_REASON_OTHER>, string> = {
  outside_refund_window:
    "We're unable to approve this request because it falls outside our 14-day refund window. Reach out if you'd like to discuss.",
  sale_item_excluded:
    "Sale items aren't eligible for refunds under our policy. We're happy to answer any questions.",
};

const OTHER_PREFIX = "other|||";

/** Store format for "Other" reason: "other|||custom message" */
export function formatRejectionReason(
  code: RejectionReasonCode,
  customMessage?: string
): string | null {
  if (code === REJECTION_REASON_OTHER) {
    return customMessage?.trim() ? `${OTHER_PREFIX}${customMessage.trim()}` : null;
  }
  return code;
}

/** Get customer-facing email copy from stored reason. Handles legacy free-text. */
export function getRejectionEmailCopy(storedReason: string | null | undefined): string | undefined {
  if (!storedReason) return undefined;

  if (storedReason.startsWith(OTHER_PREFIX)) {
    const custom = storedReason.slice(OTHER_PREFIX.length).trim();
    return custom || undefined;
  }

  const predefined = EMAIL_COPY[storedReason as keyof typeof EMAIL_COPY];
  if (predefined) return predefined;

  // Legacy codes no longer in dropdown
  if (storedReason === "item_used_or_worn" || storedReason === "criteria_not_met") {
    return "We're unable to approve this request. Please reach out if you'd like to discuss.";
  }

  return storedReason;
}
