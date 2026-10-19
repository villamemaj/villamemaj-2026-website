import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { moderateGuestReview } from "./actions";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  booking_id: string;
  guest_display_name: string;
  rating: number;
  title: string;
  review_text: string;
  locale: string;
  status: string;
  moderation_note: string | null;
  created_at: string;
  published_at: string | null;
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

  const { data, error } = await service
    .from("hotel_guest_reviews")
    .select("id,booking_id,guest_display_name,rating,title,review_text,locale,status,moderation_note,created_at,published_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const reviews = (data ?? []) as ReviewRow[];
  const pending = reviews.filter((review) => review.status === "pending").length;
  const published = reviews.filter((review) => review.status === "published").length;

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div>
          <p className="admin-eyebrow">Guest experience · Website reviews</p>
          <h1>Review moderation</h1>
          <p className="admin-page-intro">Only reviews from bookings marked as checked out can be submitted. No guest review is published until an owner or manager approves it.</p>
        </div>
        <Link href="/admin/reviews" className="admin-back-link">Booking.com integration ↗</Link>
      </div>
      {params.saved === "1" ? <p role="status" className="admin-portal-alert success">Review moderation state saved.</p> : null}
      {params.error ? <p role="alert" className="admin-portal-alert warning">Could not save the moderation action ({params.error}).</p> : null}
      {error ? <p role="alert" className="admin-portal-alert warning">Review queue could not be loaded.</p> : null}

      <div className="admin-extranet-metrics">
        <article><span>Pending review</span><strong>{pending}</strong><small>Needs owner/manager decision</small></article>
        <article><span>Published</span><strong>{published}</strong><small>Visible on the public site</small></article>
        <article><span>Rejected</span><strong>{reviews.filter((review) => review.status === "rejected").length}</strong><small>Not public</small></article>
        <article><span>Total shown</span><strong>{reviews.length}</strong><small>Latest 100 submissions</small></article>
      </div>

      <div className="admin-support-thread-list">
        {reviews.map((review) => (
          <section key={review.id} className="admin-support-thread">
            <header className="admin-support-thread-header">
              <div>
                <p className="admin-eyebrow">Booking verified · {review.locale.toUpperCase()} · Submitted {formattedDate(review.created_at)}</p>
                <h2>{review.title}</h2>
                <p>{review.guest_display_name} · Booking ID ending {review.booking_id.slice(-6)}</p>
              </div>
              <div className="admin-support-thread-state">
                <span className="admin-role-pill">{review.status}</span>
                <p className="text-lg tracking-widest text-olive">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
              </div>
            </header>
            <p className="my-4 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{review.review_text}</p>
            <form action={moderateGuestReview} className="admin-support-reply-form">
              <input type="hidden" name="review_id" value={review.id} />
              <label className="admin-policy-field">
                <span>Moderator note (private)</span>
                <textarea name="moderation_note" rows={2} maxLength={1000} defaultValue={review.moderation_note || ""} placeholder="Optional internal note — never shown publicly." />
              </label>
              <div className="flex flex-wrap gap-3">
                <button name="decision" value="published" type="submit" className="admin-primary-link">{review.status === "published" ? "Keep published" : "Approve and publish"}</button>
                <button name="decision" value="rejected" type="submit" className="admin-back-link">Reject</button>
                <button name="decision" value="pending" type="submit" className="admin-back-link">Return to pending</button>
              </div>
            </form>
          </section>
        ))}
        {!reviews.length ? <div className="admin-panel"><p>No guest reviews are awaiting review.</p></div> : null}
      </div>
      <p className="admin-data-note">Publication decisions are recorded with the staff account and timestamp. Do not publish private booking details. Review tokens and booking IDs are never included in public review output.</p>
    </div>
  );
}
