# J&M Villas — website + CRM starter

This is a responsive, no-build-step prototype for a direct-booking accommodation website with an integrated demo property-management CRM.

## Preview it

1. Unzip the package (if using the ZIP).
2. Keep `index.html` and the `assets` directory together.
3. Open `index.html` in a modern browser. For best results, serve the folder from a small local web server or upload it to a static web host.

## Included

- Responsive landing page, sticky navigation, smooth scrolling and reveal-on-scroll effects.
- The supplied property exterior photo, room cards, destination gallery and a booking-request form.
- Three room types from the supplied descriptions: Triple Room (20 m², up to 4 guests), Family Room (50 m², up to 6 guests), and Deluxe Apartment (60 m², up to 6 guests).
- CRM dashboard, reservations and statuses, room/rate/inventory editor, monthly calendar, guest directory, simple analytics, property profile and CSV export.
- Website booking requests appear in the CRM without refreshing; demo records persist via browser `localStorage`.

## Before launch

**This is a front-end prototype, not a production booking platform.** It does not have server-side authentication, a database, email or WhatsApp notifications, payment processing, live availability locking, or a Booking.com connectivity/channel-manager integration. Browser-local storage is not shared between devices and must not be used as the authoritative reservation database.

Before taking real bookings, connect a backend (for example Supabase/Postgres or another hosted database), require secure manager authentication and role permissions, validate availability server-side in a transaction, configure backups, privacy/consent and retention rules, and add notification/payment integrations as appropriate. If Booking.com bookings should sync automatically, plan for an approved channel-manager or connectivity-provider integration rather than scraping the extranet.

### Replace these placeholders

- The image files in the page: the exterior photo is your supplied image. The two coastal gallery photos are illustrative remote image placeholders; replace them with licensed images of your actual area/property. Room cards currently reuse the exterior image because no room-specific photos were supplied.
- Property brand: the uploaded exterior sign reads “J&M Villas,” while the pasted Booking.com listing text names “Vila Memaj.” Confirm the public brand before publishing.
- Contact details: `hello@jmvillas.example` is a non-functional placeholder. Replace with your real email, phone/WhatsApp, exact public address, socials and policies.
- Nightly rates and number of physical units: intentionally blank until you enter the correct figures in the CRM.
- Check-in/out and house rules: verify against your actual accommodation policy.
