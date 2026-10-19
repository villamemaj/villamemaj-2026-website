import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { moderateGuestReview } from "./actions";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  booking_id: string | null;
  display_name: string;
  rating: number;
  title: string;
  body: string;
  locale: string;
  source: string;
  consent_to_publish: boolean;
  is_published: boolean;
  moderation_status: "pending" | "published" | "rejected";
  moderation_note: string | null;
  submitted_at: string;
  approved_at: string | null;
};

function formattedDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Tirane" });
}

export default async function GuestReviewModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireStaff(["owner", "manager"]);
  const params = await searchParams;
  const service = createSupabaseServiceClient();
  if (!service) return <div className="admin-extranet-page"><h1>Guest review moderation</h1><p>Private database connection is not configured.</p></div>;

  const { data, error } = await service.from("guest_testimonials")
    .select("id,booking_id,display_name,rating,title,body,locale,source,consent_to_publish,is_published,moderation_status,moderation_note,submitted_at,approved_at")
    .order("submitted_at", { ascending: false }).limit(100);
  const reviews = (data ?? []) as ReviewRow[];
  const pending = reviews.filter(r => r.moderation_status === "pending").length;
  const published = reviews.filter(r => r.moderation_status === "published" && r.is_published && r.consent_to_publish).length;
  const rejected = reviews.filter(r => r.moderation_status === "rejected").length;

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div>
          <p className="admin-eyebrow">Guest experience · First-party testimonials</p>
          <h1>Review moderation</h1>
          <p className="admin-page-intro">Only first-party reviews with explicit publication consent can be displayed publicly. Booking.com API reviews are not copied to the public site.</p>
        </div>
        <Link href="/admin/reviews" className="admin-back-link">Booking.com integration ↗</Link>
      </div>
      {params.saved === "1" ? <p role="status" className="admin-portal-alert success">Review moderation state saved.</p> : null}
      {params.error === "consent" ? <p role="alert" className="admin-portal-alert warning">This guest did not consent to public publication. Keep the review private or ask for separate permission.</p> : null}
      {params.error && params.error !== "consent" ? <p role="alert" className="admin-portal-alert warning">Could not save the moderation action ({params.error}).</p> : null}
      {error ? <p role="alert" className="admin-portal-alert warning">Review queue could not be loaded.</p> : null}

      <div className="admin-extranet-metrics">
        <article><span>Pending review</span><strong>{pending}</strong><small>Awaiting owner/manager decision</small></article>
        <article><span>Published</span><strong>{published}</strong><small>Consent granted and approved</small></article>
        <article><span>Rejected</span><strong>{rejected}</strong><small>Not public</small></article>
        <article><span>Total shown</span><strong>{reviews.length}</strong><small>Latest 100 submissions</small></article>
      </div>

      <div className="admin-support-thread-list">
        {reviews.map(review => (
          <section key={review.id} className="admin-support-thread">
            <header className="admin-support-thread-header">
              <div>
                <p className="admin-eyebrow">{review.locale.toUpperCase()} · Submitted {formattedDate(review.submitted_at)} · {review.source}</p>
                <h2>{review.title || "Guest feedback"}</h2>
                <p>{review.display_name}</p>
              </div>
              <div className="admin-support-thread-state">
                <span className="admin-role-pill">{review.moderation_status.replaceAll("_", " ")}</span>
                <p className="text-lg tracking-widest text-olive">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                <small>{review.consent_to_publish ? "Publication consent: yes" : "Publication consent: no"}</small>
              </div>
            </header>
            <p className="my-4 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{review.body}</p>
            <form action={moderateGuestReview} className="admin-support-reply-form">
              <input type="hidden" name="review_id" value={review.id} />
              <label className="admin-policy-field">
                <span>Moderator note (private)</span>
                <textarea name="moderation_note" rows={2} maxLength={1000} defaultValue={review.moderation_note || ""} placeholder="Optional internal note — never shown publicly." />
              </label>
              <div className="flex flex-wrap gap-3">
                <button name="decision" value="published" type="submit" disabled={!review.consent_to_publish} className="admin-primary-link disabled:opacity-50">{review.is_published ? "Keep published" : "Approve and publish"}</button>
                <button name="decision" value="rejected" type="submit" className="admin-back-link">Reject</button>
                <button name="decision" value="pending" type="submit" className="admin-back-link">Return to pending</button>
              </div>
            </form>
          </section>
        ))}
        {!reviews.length ? <div className="admin-panel"><p>No guest testimonials have been submitted yet.</p></div> : null}
      </div>
      <p className="admin-data-note">Public visibility requires both publication consent and owner/manager approval. Review tokens and booking IDs are not included in public outputs.</p>
    </div>
  );
}
