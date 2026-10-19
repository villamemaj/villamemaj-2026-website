import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import GuestReviewForm from "@/components/GuestReviewForm";
import { isLocale, type Locale } from "@/lib/site";

export const metadata: Metadata = {
  title: "Share your stay",
  description: "Send feedback about your completed stay at Villa Memaj.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { token } = await searchParams;
  const lang = locale as Locale;
  const copy = {
    en: { eyebrow: "Guest feedback", title: "How was your stay?", subtitle: "Your feedback helps us improve the experience for future guests." },
    el: { eyebrow: "Αξιολόγηση επισκέπτη", title: "Πώς ήταν η διαμονή σας;", subtitle: "Η γνώμη σας μας βοηθά να βελτιώνουμε την εμπειρία των επισκεπτών." },
    fr: { eyebrow: "Avis client", title: "Comment s’est passé votre séjour ?", subtitle: "Votre avis nous aide à améliorer l’expérience de nos futurs voyageurs." },
    sq: { eyebrow: "Përshtypjet e mysafirit", title: "Si ishte qëndrimi juaj?", subtitle: "Përshtypjet tuaja na ndihmojnë të përmirësojmë përvojën e mysafirëve." },
    de: { eyebrow: "Gästebewertung", title: "Wie war Ihr Aufenthalt?", subtitle: "Ihr Feedback hilft uns, das Erlebnis für zukünftige Gäste zu verbessern." },
    it: { eyebrow: "Feedback degli ospiti", title: "Com’è stato il tuo soggiorno?", subtitle: "Il tuo feedback ci aiuta a migliorare l’esperienza dei futuri ospiti." },
  }[lang];

  return (
    <div className="editorial-page">
      <EditorialPageHero locale={lang} eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} imageSrc="/902234060.jpg" />
      <section className="editorial-standard-content">
        <div className="mx-auto max-w-3xl rounded-2xl border border-sand-dark bg-white p-6 sm:p-10">
          <GuestReviewForm locale={lang} token={token || ""} />
        </div>
      </section>
    </div>
  );
}
