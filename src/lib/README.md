# lib/

Shared utilities, validation, and business logic. Handlers (server actions, API routes) stay thin and delegate to these modules.

## Structure

| Path | Purpose |
|------|---------|
| `class/validation.ts` | Parse and validate class form input (create/update) |
| `product/validation.ts` | Parse and validate product form input, map DB errors |
| `format/date.ts` | `formatClassDate()` — class dates in Chicago timezone |
| `format/currency.ts` | `formatPriceDollars()` — cents to USD |
| `merch/` | Merch display and checkout |
| `merch/grouping.ts` | `groupProducts()` — apparel vs accessories for UI |
| `merch/checkout.ts` | `validateCart`, `buildLineItems`, `calculateTotalCents` |
| `webhooks/stripe/handlers.ts` | Stripe webhook handlers (class booking, merch order, refund, etc.) |
| `validation.ts` | `unwrap()` — safely extract data from parse results |

## Conventions

- **Validation:** `parseXInput(formData)` returns `{ data?, error? }`. Callers check `if (result.error) return { error }` then use `unwrap(result)` for type-safe data.
- **Handlers:** Auth, DB calls, revalidate, redirect. Business logic lives in lib.
- **Tests:** Validation and pure logic in `lib/<domain>/__tests__/`. Handler tests in `app/api/__tests__/`.
