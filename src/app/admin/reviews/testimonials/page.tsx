import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { updateTestimonialPublication } from "./actions";

export const dynamic = "force-dynamic";

type Testimonial = {
  id: string;
  display_name: string;
  locale: string;
  rating: number;
  title: string;
  body: string;
  source: string;
  consent_to_publish: boolean;
  is_published: boolean;
  submitted_at: string;
  approved_at: string | null;
  moderation_note: string | null;
};

export default async function TestimonialModerationPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { supabase } = await requireStaff(["owner", "manager"]);
  const params = await searchParams;
  const { data, error } = await supabase.from("guest_testimonials").select("*").order("submitted_at", { ascending: false }).limit(200);
  const reviews = (data ?? []) as Testimonial[];

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div><p className="admin-eyebrow">Guest experience</p><h1>Website testimonials</h1><p className="admin-page-intro">Moderate first-party reviews submitted directly to Villa Memaj. Publishing requires explicit consent and staff approval.</p></div>
        <Link href="/admin/reviews" className="admin-back-link">← Booking.com integration</Link>
      </div>
      {params.saved ? <div role="status" className="admin-portal-alert success">Publication status updated across the public review pages.</div> : null}
      {params.error || error ? <div role="alert" className="admin-portal-alert warning">Could not update or load the testimonial. Verify consent and your staff role.</div> : null}
      <section className="admin-extranet-metrics">
        <article><span>All submitted</span><strong>{reviews.length}</strong><small>First-party testimonials only</small></article>
        <article><span>Awaiting approval</span><strong>{reviews.filter((r) => !r.is_published).length}</strong><small>Not visible publicly</small></article>
        <article><span>Published</span><strong>{reviews.filter((r) => r.is_published && r.consent_to_publish).length}</strong><small>Explicit consent and approval</small></article>
      </section>
      <p className="admin-data-note">Booking.com Guest Review API content must not be copied into this first-party testimonial store. Remove a published testimonial on request and keep moderation activity auditable.</p>
      {reviews.length === 0 ? <div className="admin-panel"><h2>No testimonials submitted</h2><p className="admin-panel-copy">Directly submitted guest reviews will appear here after the website form is used.</p></div> : (
        <div className="admin-testimonial-list">
          {reviews.map((review) => (
            <article key={review.id} className="admin-panel admin-testimonial-card">
              <div className="admin-section-heading">
                <div><p className="admin-eyebrow">{review.locale.toUpperCase()} · {new Date(review.submitted_at).toLocaleString("en-GB")}</p><h2>{review.title || "Guest testimonial"}</h2></div>
                <span className={review.is_published ? "admin-role-pill ready" : "admin-role-pill warning"}>{review.is_published ? "Published" : "Awaiting review"}</span>
              </div>
              <div className="admin-testimonial-meta"><strong>{review.display_name}</strong><span>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span><span>{review.consent_to_publish ? "Publication consent recorded" : "No publication consent"}</span></div>
              <p className="admin-testimonial-body">{review.body}</p>
              <div className="admin-testimonial-actions">
                {review.consent_to_publish && !review.is_published ? <form action={updateTestimonialPublication}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="publish" value="true" /><button type="submit" className="admin-primary-link">Approve & publish</button></form> : null}
                {review.is_published ? <form action={updateTestimonialPublication}><input type="hidden" name="id" value={review.id} /><input type="hidden" name="publish" value="false" /><button type="submit" className="admin-secondary-link">Unpublish</button></form> : null}
                {!review.consent_to_publish ? <span className="admin-data-note">Cannot publish without consent.</span> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
