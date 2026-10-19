import type { Metadata } from "next";
import Link from "next/link";
import EditorialPageHero from "@/components/EditorialPageHero";
import { getSupabase } from "@/lib/supabase";
import { isLocale, type Locale } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale as Locale : "el";
  return {
    title: lang === "el" ? "Αξιολογήσεις επισκεπτών" : lang === "fr" ? "Avis des voyageurs" : lang === "sq" ? "Vlerësimet e mysafirëve" : lang === "de" ? "Gästebewertungen" : "Guest reviews",
    description: lang === "el" ? "Δημοσιευμένες αξιολογήσεις επισκεπτών της Villa Memaj." : "Published guest reviews for Villa Memaj.",
  };
}

type PublicReview = {
  id: string;
  display_name: string;
  rating: number;
  title: string;
  body: string;
  locale: string;
  approved_at: string | null;
  submitted_at: string;
};

const UI = {
  en: { eyebrow: "Guest experiences", title: "Guest reviews", subtitle: "Feedback from guests who completed their stay.", empty: "No guest reviews have been published yet.", book: "Plan your stay" },
  el: { eyebrow: "Εμπειρίες επισκεπτών", title: "Αξιολογήσεις επισκεπτών", subtitle: "Σχόλια επισκεπτών που ολοκλήρωσαν τη διαμονή τους.", empty: "Δεν έχουν δημοσιευτεί ακόμη αξιολογήσεις.", book: "Προγραμματίστε τη διαμονή σας" },
  fr: { eyebrow: "Expériences des voyageurs", title: "Avis des voyageurs", subtitle: "Avis de voyageurs ayant terminé leur séjour.", empty: "Aucun avis n’a encore été publié.", book: "Préparer votre séjour" },
  sq: { eyebrow: "Përvojat e mysafirëve", title: "Vlerësimet e mysafirëve", subtitle: "Komente nga mysafirët që e përfunduan qëndrimin.", empty: "Nuk ka ende vlerësime të publikuara.", book: "Planifikoni qëndrimin" },
  de: { eyebrow: "Gästeerlebnisse", title: "Gästebewertungen", subtitle: "Rückmeldungen von Gästen nach abgeschlossenem Aufenthalt.", empty: "Es wurden noch keine Gästebewertungen veröffentlicht.", book: "Aufenthalt planen" },
};

export default async function PublicReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const lang = locale as Locale;
  const ui = UI[lang];
  let reviews: PublicReview[] = [];
  try {
    const { data, error } = await getSupabase()
      .from("guest_testimonials")
      .select("id,display_name,rating,title,body,locale,approved_at,submitted_at")
      .eq("is_published", true)
      .eq("consent_to_publish", true)
      .eq("moderation_status", "published")
      .order("approved_at", { ascending: false })
      .limit(30);
    if (!error) reviews = (data ?? []) as PublicReview[];
  } catch {
    reviews = [];
  }

  return (
    <div className="editorial-page">
      <EditorialPageHero locale={lang} eyebrow={ui.eyebrow} title={ui.title} subtitle={ui.subtitle} imageSrc="/902234060.jpg" />
      <section className="editorial-standard-content">
        {reviews.length ? (
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-sand-dark bg-white p-6 sm:p-8">
                <p aria-label={review.rating + " out of 5 stars"} className="text-lg tracking-widest text-olive">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</p>
                <h2 className="mt-4 font-display text-2xl font-medium text-olive-dark">{review.title}</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{review.body}</p>
                <p className="mt-6 border-t border-sand-dark pt-4 text-xs font-semibold text-olive">{review.display_name} · {review.locale.toUpperCase()}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl rounded-2xl border border-sand-dark bg-white p-8 text-center">
            <p className="text-sm leading-7 text-ink-soft">{ui.empty}</p>
          </div>
        )}
        <div className="mt-10 text-center"><Link href={"/" + lang + "/booking"} className="button-dark">{ui.book} ↗</Link></div>
      </section>
    </div>
  );
}
