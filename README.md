# Villa Memaj — website + booking CRM (2026)

Next.js 16 (App Router), Tailwind CSS 4 and Supabase. The repo holds both halves of the
product: the bilingual public website and the staff CRM used to run the property.

- Public site: Greek (EL), English (EN), French (FR), Albanian (SQ), German (DE) and Italian (IT) — `/el/...`, `/en/...`, `/fr/...`, `/sq/...`, `/de/...`, `/it/...` (legal source text is currently fully authored in English/Greek; additional-language legal routes must be professionally reviewed before launch).
- Pages: cinematic home, room listings/details, gallery, booking, contact, flights, guest reviews, FAQ, guest policies, booking terms, privacy, cancellation/refunds, house rules and payment information. Public pages share the same responsive visual system, reduced-motion-aware scroll effects, cookie preferences and guest support chat.
- CRM: `/admin` — searchable Extranet-style navigation, reservations, calendar, rooms & rates, rate plans, guests, payment ledger, property-policy editor, guest support inbox, direct-testimonial moderation, notifications, staff, audit log and account/MFA.
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
| `STRIPE_SECRET_KEY` | for Stripe | Stripe test secret key initially; server-only |
| `STRIPE_WEBHOOK_SECRET` | for Stripe | webhook signing secret; test-mode endpoint is already configured |
| `STRIPE_LIVE_PAYMENTS_ENABLED` | no | defaults to `false`; live charging remains disabled until owner approval |
| `NEXT_PUBLIC_SITE_URL` | recommended | canonical site origin for payment return URLs |

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

## Stripe payments (test mode first)

The CRM includes a staff-only Stripe Checkout workspace at `/admin/stripe-checkout`. Staff can create and copy a hosted payment link for eligible online-payable bookings. The amount is derived on the server from the booking ledger; the browser cannot set it. Only verified Stripe webhooks reconcile successful payments into `hotel_payment_transactions` and update booking payment status.

Before the first end-to-end test, add these values in Vercel → Project → Settings → Environment Variables:

- `STRIPE_SECRET_KEY`: the **test-mode** secret key from Stripe Dashboard → Developers → API keys.
- `SUPABASE_SERVICE_ROLE_KEY`: the server-only service-role key from the Villa Memaj Supabase project. Never expose this as a `NEXT_PUBLIC_*` variable.
- `STRIPE_WEBHOOK_SECRET`: already configured for the Stripe **test-mode** endpoint `/api/stripe/webhook`.
- `NEXT_PUBLIC_SITE_URL`: the canonical production URL is already configured.
- Keep `STRIPE_LIVE_PAYMENTS_ENABLED=false` until the owner explicitly approves live charging and the live webhook/key are configured.

The test-mode webhook subscribes to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. The database migration `20261019090000_stripe_checkout.sql` and CRM availability security migration `20261019100000_crm_security_hardening.sql` are applied to the connected Supabase project.

After adding the two missing server secrets, redeploy the Vercel project, then test with a dedicated test booking and Stripe test card (for example `4242 4242 4242 4242`, any future expiry, and any CVC). Verify the transaction and booking payment status in the CRM. Do not use real card details for test mode.

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


## Messaging automations, guest support and reviews

The database queues booking-request acknowledgements and owner alerts, then queues confirmation/cancellation/no-show email + SMS when the booking status changes. A daily Vercel Cron at `/api/email/dispatch` creates 14-day, 7-day and 1-day reminders, a one-day welcome message and a post-checkout thank-you. Queues are service-role-only and idempotent per booking/kind. A queued message is not proof of successful delivery.

Required for real email delivery:
- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `EMAIL_FROM` from a verified sender/domain
- `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`

Optional channels:
- SMS to the guest: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- Owner alerts: `SLACK_WEBHOOK_URL`, or Twilio WhatsApp with `TWILIO_WHATSAPP_FROM` and `OWNER_WHATSAPP_TO`.
- AI-backed support chat: server-only `OPENAI_API_KEY` or `GEMINI_API_KEY`. Without one, the chat uses the published FAQ/policy fallback and can queue human escalation. It does not access private booking records.
- Flight-search affiliate tracking: `SKYSCANNER_MEDIA_PARTNER_ID` must be Villa Memaj's own approved partner ID. The connected ChatGPT Skyscanner app is not a website API key or partner approval.
- Review link: set the official public listing URL in CRM Property Policies. Booking.com Guest Review API data is not copied to the public website; direct testimonials require publication consent and staff approval.

## Security checks and remaining owner/legal tasks

- Public row access to `hotel_house_policies` is limited to explicit guest-facing columns. Contact email, owner notification recipients and internal update metadata remain unavailable to the anonymous public API. Support and delivery queues have no anonymous table access.
- Public booking functions remain callable because the booking widget requires them; they validate the requested dates, rate and booking limits. Admin SECURITY DEFINER RPCs enforce a staff-role check. Review Supabase Security Advisor findings after every migration.
- Cookies: only necessary behavior is active by default; optional analytics/marketing remain off unless consent is granted. No non-essential tracker is currently included by the consent component.
- Legal text is a structured operational draft, not a legal opinion. Before full launch, add the operator's registered legal name, NUIS/NIPT/tax details and official postal address; have Albanian accommodation/consumer counsel review booking/cancellation/tax/privacy wording and professional translators review French, Albanian, German and Italian legal copies.
- Before taking live payments, test all checkout/webhook/refund paths in Stripe test mode, enable MFA for all staff, enable Supabase leaked-password protection, configure sender-domain authentication, configure backup/retention/incident-response procedures and complete an independent penetration test. Live charging is explicitly gated off by default.
- Apply `supabase/migrations` in order and verify the Vercel build + database advisor after each migration. A deployed preview is necessary but not a substitute for a manual authenticated end-to-end booking test.
