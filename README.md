# Villa Memaj — website + booking CRM (2026)

Next.js 16 (App Router), Tailwind CSS 4 and Supabase. The repo holds both halves of the
product: the bilingual public website and the staff CRM used to run the property.

- Public site: bilingual **Greek (EL)** default + **English (EN)** — `/el/...`, `/en/...`
- Pages: Home (auto-rotating hero), Rooms (+ per-room detail), Gallery, Booking request, Contact
- CRM: `/admin` — dashboard, reservations, calendar, rooms & rates, rate plans, guests,
  payments, policies, notifications, staff, audit log, my account
- All content lives in Supabase; both forms submit through hardened database functions

## Local development

```bash
npm install
cp .env.example .env.local   # already created locally
npm run dev
```

Open http://localhost:3000 (redirects to `/el`). Staff sign in at `/admin/login`.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | publishable (anon) key — safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | for email | server-only; needed to drain the notification queue |
| `EMAIL_PROVIDER` | no | `resend` (live) or `log` (dry run). Unset = queue only, nothing sent |
| `RESEND_API_KEY` | no | when `EMAIL_PROVIDER=resend` |
| `EMAIL_FROM` | no | e.g. `Villa Memaj <bookings@villamemaj.com>` |
| `CRON_SECRET` | no | protects `/api/email/dispatch` |

Add these in **Vercel → Project → Settings → Environment Variables**. `NEXT_PUBLIC_*` are
needed in every environment; the rest only affect server-side email.

Without Supabase variables the public site still renders and `/admin` redirects to login
rather than failing.

## Booking intake

Public booking submissions never insert into tables directly. `BookingForm` calls
`submit_booking_request(...)`, a `security definer` function that:

- must be called with a plausible elapsed time (rejects instant/bot submissions)
- carries a hidden honeypot field
- rate limits per IP and per email, and caps global volume
- then creates the booking as a `request` (never a confirmation) via `create_booking(...)`

Bots attempting to insert into `hotel_bookings` or call booking/staff RPCs directly are
refused by RLS and revoked `EXECUTE` grants. Creating bookings, quoting and the availability
matrix require `service_role` or an authenticated staff member.

## Staff and roles

Staff accounts are created by the owner from **Staff**. Roles: `owner`, `manager`,
`receptionist`, `housekeeping`, `accountant`; access is enforced in middleware, in every
page and by row level security. Every change is written to the audit log with the user id.

## Two-factor authentication

TOTP (any authenticator app) is available to every staff account at `/admin/mfa` and from
**My account**.

- Once a factor is verified, every admin page requires the code for the session, so a
  stolen password alone is not enough. Signing in from a new browser re-prompts.
- Owners and managers without two-factor see a nudge banner; reporting in the CRM is never
  blocked by it.
- To *require* enrolment, set `STRICT_MFA_ENROLMENT = true` in `src/lib/admin/mfa.ts`.
  Do this only once the owner has confirmed their authenticator works — recovering a lost
  phone currently means clearing the factor from the Supabase database
  (`auth.mfa_factors`) or the dashboard.
- GoTrue requires `aal2` to remove or add factors on an account that already has one, and
  factor friendly names must be unique; the setup screen names each new factor accordingly.

## Notification emails

Every booking request enqueues a bilingual guest acknowledgement and an owner alert
(recipients come from `hotel_house_policies.notification_emails`). Rows sit in
`email_outbox` until a provider is configured, so a mail outage never loses a booking or
blocks a request.

- The queue drains on CRM activity (the Notifications page) and via
  `POST /api/email/dispatch` with `Authorization: Bearer $CRON_SECRET`.
- Delivery attempts are tracked with backoff, and messages that keep failing are marked
  `failed` with the provider error visible on the Notifications page.

## Database

Schema lives in `supabase/migrations`, applied with:

```bash
npx supabase db push --db-url "<postgres connection string>"
```

Key tables: `hotel_rooms`, `hotel_gallery_images`, `hotel_bookings`, `hotel_guests`,
`hotel_payment_transactions`, `hotel_rate_plans`, `hotel_seasonal_prices`,
`hotel_cancellation_policies`, `hotel_house_policies`, `hotel_blocked_dates`,
`hotel_staff_memberships`, `hotel_audit_log`, `email_outbox`, `booking_intake_attempts`.

Update the hotel's real **phone, email and address** in `src/lib/site.ts`.

## Deploy

Push to GitHub; Vercel auto-detects Next.js. Add the environment variables above, then
deploy. Migrations are applied separately with the Supabase CLI (they are not run by the
build).
