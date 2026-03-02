# Door Parkour

Marketing and business management web app for Door Parkour — Door County's only ADAPT-certified parkour coaching program, based in Sturgeon Bay, WI.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styles**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Payments**: Stripe (Checkout Sessions + Webhooks)
- **Deployment**: Vercel

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd door-parkour
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Run the migration in `supabase/migrations/001_initial_schema.sql` via the Supabase **SQL Editor**

### 3. Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Copy your keys from the Dashboard:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. Set up a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe`
   - Listen for: `checkout.session.completed`
   - Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`
4. For local testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### 4. Environment variables

Copy `.env.local` and fill in your values:

```bash
cp .env.local .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
  app/
    (marketing)/      # Public pages: homepage, classes, about, merch, contact
    (auth)/           # Login, signup, email confirm, OAuth callback
    (dashboard)/      # Protected: dashboard, profile, bookings, orders
    api/
      checkout/       # Stripe Checkout Session creation
      webhooks/       # Stripe webhook handler
  components/
    layout/           # Navbar, Footer
    marketing/        # ClassCard, ProductCard, CartDrawer, ContactForm
    auth/             # LoginForm, SignUpForm
    dashboard/        # DashboardSidebar, DashboardHeader, ProfileForm, CancelBookingButton
    ui/               # shadcn/ui components
  lib/
    supabase/         # client.ts, server.ts, middleware.ts, types.ts
    stripe/           # Stripe client singleton
    store/            # Zustand cart store
supabase/
  migrations/         # SQL migrations (run manually in Supabase SQL Editor)
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` in Vercel's project settings
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain
5. Deploy — Vercel auto-detects Next.js, no extra config needed

After deploying, update your Stripe webhook endpoint URL to the production domain.

---

## Database Migrations

Migrations live in `supabase/migrations/`. To apply:

1. Open your Supabase project
2. Go to **SQL Editor**
3. Paste and run `001_initial_schema.sql`

To add seed data for testing, uncomment the `INSERT` statements at the bottom of the migration file.

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Homepage / hero |
| `/classes` | Public class listings + booking |
| `/about` | Coach bio + values |
| `/merch` | Product grid + cart |
| `/contact` | Contact form |
| `/login` | Sign in |
| `/signup` | Create account |
| `/dashboard` | User overview (protected) |
| `/bookings` | User's class bookings (protected) |
| `/orders` | Merch order history (protected) |
| `/profile` | Profile + emergency contact (protected) |
| `/api/checkout/classes` | POST — creates Stripe session for class booking |
| `/api/checkout/merch` | POST — creates Stripe session for merch cart |
| `/api/webhooks/stripe` | POST — handles `checkout.session.completed` |
