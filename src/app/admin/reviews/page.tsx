import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function GuestReviewsPage() {
  const { role } = await requireStaff(["owner", "manager", "receptionist"]);
  const configured = Boolean(process.env.BOOKING_REVIEW_API_TOKEN && process.env.BOOKING_REVIEW_PROPERTY_ID);
  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div><p className="admin-eyebrow">Guest experience</p><h1>Guest reviews</h1><p className="admin-page-intro">A private workspace for checking review performance and preparing replies.</p></div>
        <Link href="/admin/extranet" className="admin-back-link">← Extranet home</Link>
      </div>
      <div className={configured ? "admin-integration-status ready" : "admin-integration-status pending"}>
        <span className="admin-status-dot" aria-hidden="true" />
        <div><strong>{configured ? "API credentials detected" : "Booking.com review API not connected"}</strong><p>{configured ? "Server-side credentials are present. A connection and permissions check is still required before review data can be displayed." : "No review API credentials are configured. No guest reviews or personal data are being fetched into this CRM."}</p></div>
      </div>
      <div className="admin-analytics-grid">
        <section className="admin-panel">
          <p className="admin-eyebrow">Official integration route</p>
          <h2>Connect reviews the authorised way</h2>
          <ol className="admin-checklist">
            <li><span>1</span><div><strong>Confirm partner access</strong><p>Guest reviews are available through Booking.com Connectivity APIs for approved/authorised machine accounts with the required connection type and endpoint access.</p></div></li>
            <li><span>2</span><div><strong>Request guest-review access</strong><p>Ask the property’s Booking.com account/Connectivity provider to authorise guest review retrieval and replies for property ID 14663286.</p></div></li>
            <li><span>3</span><div><strong>Store credentials server-side</strong><p>Once issued, add the machine-account token and property ID as server-only deployment variables. Never expose them as NEXT_PUBLIC variables.</p></div></li>
            <li><span>4</span><div><strong>Test reading and replies</strong><p>Verify permissions, review pagination, reply limits, audit history and role checks in a test environment before staff use.</p></div></li>
          </ol>
          <a className="admin-primary-link" href="https://developers.booking.com/connectivity/docs/review-api" target="_blank" rel="noreferrer">Official Guest Review API documentation ↗</a>
        </section>
        <section className="admin-panel">
          <p className="admin-eyebrow">Property account</p>
          <h2>Continue in Booking.com</h2>
          <p className="admin-panel-copy">Until the property authorises an API connection, use the official Extranet to read reviews and submit replies. This CRM page intentionally does not scrape the logged-in Extranet.</p>
          <a className="admin-primary-link" href="https://admin.booking.com/" target="_blank" rel="noreferrer">Open Booking.com Extranet ↗</a>
          <div className="admin-warning-note"><strong>Public website note</strong><p>Booking.com’s Review API documentation states that reviews obtained through this API are for internal use and may not be rendered on the public property page. For the public website, use a link to the property's Booking.com listing, or publish independently collected testimonials with a lawful basis and appropriate permission.</p></div>
        </section>
      </div>
      <p className="admin-data-note">Signed in with the {role} role. Review text, reviewer names, reservation references and reply data will only appear here after an authorised integration is configured and tested.</p>
    </div>
  );
}
