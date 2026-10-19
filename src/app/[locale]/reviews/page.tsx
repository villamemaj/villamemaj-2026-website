import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import GuestTestimonialForm from "@/components/GuestTestimonialForm";
import { getSupabase } from "@/lib/supabase";
import { isLocale } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return { title: "Reviews" };
  const title: Record<string,string> = { en: "Guest reviews", el: "Κριτικές επισκεπτών", fr: "Avis des voyageurs", sq: "Vlerësimet e vizitorëve", de: "Gästebewertungen", it: "Recensioni degli ospiti" };
  return { title: title[locale] || "Guest reviews", description: "Guest experiences shared directly with Villa Memaj." };
}

type Review = { id: string; display_name: string; locale: string; rating: number; title: string; body: string; submitted_at: string };

export default async function GuestReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  let reviews: Review[] = [];
  let externalReviewUrl = process.env.NEXT_PUBLIC_BOOKING_REVIEW_URL || "";
  try {
    const client = getSupabase();
    const [publicReviews, policy] = await Promise.all([
      client.from("guest_testimonials").select("id,display_name,locale,rating,title,body,submitted_at").eq("is_published", true).eq("consent_to_publish", true).order("submitted_at", { ascending: false }).limit(30),
      client.from("hotel_house_policies").select("public_review_url").limit(1).maybeSingle(),
    ]);
    reviews = (publicReviews.data ?? []) as Review[];
    if (!externalReviewUrl && typeof policy.data?.public_review_url === "string") externalReviewUrl = policy.data.public_review_url;
  } catch {
    reviews = [];
  }

  const text: Record<string, { eyebrow:string; title:string; subtitle:string; latest:string; none:string; form:string; booking:string; note:string }> = {
    en: { eyebrow:"Guest experiences", title:"Stories from our guests.", subtitle:"These testimonials are shared directly with Villa Memaj and published only with permission. For platform-specific reviews, use the property’s public listing.", latest:"Guest testimonials", none:"No approved testimonials have been published yet.", form:"Share your experience", booking:"Read reviews on Booking.com", note:"Only first-party reviews with explicit publication consent are shown here; Booking.com review text is not copied into this page." },
    el: { eyebrow:"Εμπειρίες επισκεπτών", title:"Οι εμπειρίες των επισκεπτών μας.", subtitle:"Οι μαρτυρίες υποβάλλονται απευθείας στη Villa Memaj και δημοσιεύονται μόνο με άδεια.", latest:"Κριτικές επισκεπτών", none:"Δεν έχουν δημοσιευθεί ακόμη εγκεκριμένες κριτικές.", form:"Μοιραστείτε την εμπειρία σας", booking:"Δείτε τις κριτικές στο Booking.com", note:"Εμφανίζονται μόνο κριτικές που έχουν σταλεί απευθείας με ρητή συναίνεση· το κείμενο του Booking.com δεν αντιγράφεται εδώ." },
    fr: { eyebrow:"Expériences des voyageurs", title:"Les expériences de nos hôtes.", subtitle:"Les témoignages sont envoyés directement à Villa Memaj et publiés uniquement avec autorisation.", latest:"Témoignages", none:"Aucun témoignage approuvé n’est encore publié.", form:"Partager votre expérience", booking:"Lire les avis sur Booking.com", note:"Seuls les avis envoyés directement avec consentement sont affichés ; les avis Booking.com ne sont pas copiés ici." },
    sq: { eyebrow:"Përvojat e vizitorëve", title:"Përvojat e mysafirëve tanë.", subtitle:"Dëshmitë dërgohen drejtpërdrejt te Villa Memaj dhe publikohen vetëm me leje.", latest:"Vlerësimet", none:"Nuk ka ende vlerësime të miratuara për publikim.", form:"Ndani përvojën tuaj", booking:"Lexoni vlerësimet në Booking.com", note:"Shfaqen vetëm vlerësime të dorëzuara drejtpërdrejt me pëlqim të qartë; tekstet nga Booking.com nuk kopjohen këtu." },
    de: { eyebrow:"Gästeerlebnisse", title:"Erfahrungen unserer Gäste.", subtitle:"Erfahrungsberichte werden direkt an Villa Memaj übermittelt und nur mit Einwilligung veröffentlicht.", latest:"Gästestimmen", none:"Es wurden noch keine freigegebenen Erfahrungsberichte veröffentlicht.", form:"Erfahrung teilen", booking:"Bewertungen auf Booking.com lesen", note:"Hier werden nur direkt eingereichte Bewertungen mit ausdrücklicher Zustimmung angezeigt; Booking.com-Texte werden nicht kopiert." },
    it: { eyebrow:"Esperienze degli ospiti", title:"Le esperienze dei nostri ospiti.", subtitle:"Le testimonianze sono inviate direttamente a Villa Memaj e pubblicate solo con autorizzazione.", latest:"Testimonianze", none:"Non sono ancora state pubblicate testimonianze approvate.", form:"Condividi la tua esperienza", booking:"Leggi le recensioni su Booking.com", note:"Sono mostrate solo recensioni inviate direttamente con consenso esplicito; i testi di Booking.com non vengono copiati qui." }
  };
  const t = text[locale];
  return (
    <div className="editorial-page reviews-page">
      <EditorialPageHero locale={locale} eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} imageSrc="/902234060.jpg" />
      <section className="editorial-standard-content">
        <div className="reviews-grid">
          <div className="reviews-column">
            <p className="section-label">{t.latest}</p>
            {reviews.length === 0 ? <div className="review-empty">{t.none}</div> : (
              <div className="review-card-list">
                {reviews.map((review) => <article key={review.id} className="guest-review-card">
                  <div className="guest-review-stars" aria-label={review.rating + " out of 5"}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</div>
                  {review.title ? <h2>{review.title}</h2> : null}
                  <p>{review.body}</p>
                  <footer><strong>{review.display_name}</strong><span>{new Date(review.submitted_at).toLocaleDateString(locale)}</span></footer>
                </article>)}
              </div>
            )}
            {externalReviewUrl && externalReviewUrl.startsWith("https://") ? <a href={externalReviewUrl} target="_blank" rel="noopener noreferrer" className="button-dark mt-5">{t.booking}<span aria-hidden="true">↗</span></a> : null}
            <p className="mt-4 text-xs leading-6 text-ink-soft">{t.note}</p>
          </div>
          <div className="reviews-submit-card">
            <p className="section-label">{t.form}</p>
            <GuestTestimonialForm locale={locale} />
          </div>
        </div>
        <div className="mt-10"><Link className="text-sm font-semibold text-olive underline underline-offset-4" href={"/" + locale + "/contact"}>Contact Villa Memaj ↗</Link></div>
      </section>
    </div>
  );
}
