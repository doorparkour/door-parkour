/**
 * Detect Next.js redirect throws. isRedirectError is not exported from
 * next/navigation in Next 16, so we check the digest ourselves.
 */
export function isRedirectError(e: unknown): boolean {
  return (
    e != null &&
    typeof e === "object" &&
    "digest" in e &&
    String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}
