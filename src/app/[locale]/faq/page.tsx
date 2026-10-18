import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import { faq, policyLinks } from "@/lib/legal-content";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "el";
  return { title: lang === "el" ? "Συχνές ερωτήσεις" : "Frequently asked questions", description: lang === "el" ? "Απαντήσεις για την κράτηση και τη διαμονή στη Villa Memaj." : "Answers about booking and staying at Villa Memaj." };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const questions = faq[lang];
  return (
    <div className="editorial-page faq-page">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Πριν και κατά τη διαμονή" : "Before and during your stay"}
        title={lang === "el" ? "Συχνές ερωτήσεις" : "Frequently asked questions"}
        subtitle={lang === "el" ? "Οι βασικές πληροφορίες για τη διαμονή σας, συγκεντρωμένες σε ένα σημείο." : "The essentials for your stay, collected in one place."}
        imageSrc="/902234060.jpg"
      />
      <section className="faq-content">
        <div className="faq-intro reveal-from-left">
          <p className="section-label">{lang === "el" ? "Χρειάζεστε απάντηση;" : "Need an answer?"}</p>
          <h2>{lang === "el" ? "Ας κάνουμε τον προγραμματισμό απλό." : "Let’s make planning simple."}</h2>
          <p>{lang === "el" ? "Ελέγξτε πάντα την ατομική επιβεβαίωση κράτησης για τους όρους της συγκεκριμένης τιμής." : "Always check your individual booking confirmation for the terms of the rate you selected."}</p>
          <Link className="button-dark mt-6" href={`/${lang}/contact`}>{lang === "el" ? "Επικοινωνία" : "Contact us"} <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="faq-list stagger-reveal">
          {questions.map((item, index) => (
            <details key={item.q} className="faq-item" name={`faq-${lang}`}>
              <summary><span className="faq-number">{String(index + 1).padStart(2, "0")}</span><span>{item.q}</span><span className="faq-toggle" aria-hidden="true">+</span></summary>
              <div className="faq-answer"><p>{item.a}</p></div>
            </details>
          ))}
          <div className="faq-legal-links">
            <p className="section-label">{lang === "el" ? "Αναλυτικές πληροφορίες" : "Read the full details"}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {policyLinks[lang].filter((item) => item.href !== "/faq").map((item) => (
                <Link key={item.href} href={`/${lang}${item.href}`} className="text-sm font-semibold text-olive underline underline-offset-4">{item.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
