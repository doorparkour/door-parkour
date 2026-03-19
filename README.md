# Door Parkour

Marketing and business management web app for Door Parkour — Door County's only ADAPT-certified parkour coaching program, based in Sturgeon Bay, WI.

This project can also serve as a **template** for other small businesses (studios, coaches, instructors) who want to build a similar site: classes, merch, bookings, and payments.

## What's on the site

- **Classes** — Browse and book parkour classes (youth and adult; participant name for youth)
- **Merch** — Apparel and accessories
- **About** — Coach bio and values
- **Contact** — Get in touch
- **Dashboard** — Bookings, orders, profile, waiver (sign in required)
- **Admin** — Classes, bookings, merch, refund requests (admin role)

## Tech stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styles**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Payments**: Stripe (Checkout + Webhooks)
- **Email**: Resend + React Email (transactional emails)
- **PDF**: pdf-lib (waiver generation and storage)
- **Forms**: React Hook Form + Zod
- **State**: Zustand (cart)
- **Deployment**: Vercel

---

## Using this as a template

If you're starting your own site from this codebase:

**Local development**

1. Clone, install dependencies (`npm install`)
2. Create a Supabase project and run migrations from `supabase/migrations/`
3. Set up Stripe and configure webhooks for your environment
4. Create a `.env` file with your Supabase, Stripe, Resend, and site URL values
5. Run `npm run dev` — open [http://localhost:3000](http://localhost:3000)

**Deployment (Vercel)**

1. Push to GitHub and import at [vercel.com/new](https://vercel.com/new)
2. Add environment variables (Supabase, Stripe, Resend, etc.)
3. Deploy — Vercel auto-detects Next.js
