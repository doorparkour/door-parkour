/**
 * Origin for Supabase auth callbacks (email links, etc.). Prefer the browser
 * origin so Vercel preview URLs work without per-deployment NEXT_PUBLIC_SITE_URL.
 */
export function authRedirectOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return base ?? "http://localhost:3000";
}
