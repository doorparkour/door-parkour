import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// #region agent log
fetch("http://127.0.0.1:7770/ingest/82fb9bd2-f7da-42b0-9473-95e31b19f312", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "a91b90",
  },
  body: JSON.stringify({
    sessionId: "a91b90",
    runId: "pre-fix",
    hypothesisId: "H1-H4",
    location: "src/lib/stripe/index.ts:3",
    message: "Stripe module init env snapshot",
    data: {
      hasStripeSecretKey: Boolean(stripeSecretKey),
      stripeSecretKeyLength: stripeSecretKey?.length ?? 0,
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

export const stripe = new Stripe(stripeSecretKey as string, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

// #region agent log
fetch("http://127.0.0.1:7770/ingest/82fb9bd2-f7da-42b0-9473-95e31b19f312", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "a91b90",
  },
  body: JSON.stringify({
    sessionId: "a91b90",
    runId: "pre-fix",
    hypothesisId: "H3",
    location: "src/lib/stripe/index.ts:27",
    message: "Stripe client constructed successfully",
    data: {
      hasStripeSecretKey: Boolean(stripeSecretKey),
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

export function formatAmountForStripe(cents: number): number {
  return cents;
}
