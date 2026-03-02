import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
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
      runId: "post-fix",
      hypothesisId: "H5",
      location: "src/lib/stripe/server.ts:8",
      message: "Resolving Stripe client lazily",
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

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, {
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
        runId: "post-fix",
        hypothesisId: "H5",
        location: "src/lib/stripe/server.ts:40",
        message: "Lazy Stripe client constructed",
        data: {
          hasStripeSecretKey: true,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  return stripeClient;
}
