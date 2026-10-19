import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import { getPolicyLinks } from "@/lib/legal-content";
import { getSiteMediaImages } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "el";
  return { title: lang === "el" ? "Πληροφορίες και πολιτικές" : "Guest information & policies", description: lang === "el" ? "Όροι κράτησης, πληρωμές, ακυρώσεις, απόρρητο και κανόνες καταλύματος." : "Booking terms, payments, cancellations, privacy and house rules." };
}

export default async function PolicyHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const siteMedia = await getSiteMediaImages(["policies_hero"]);
  return (
    <div className="editorial-page policy-hub">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Πληροφορίες επισκεπτών" : "Guest information"}
        title={lang === "el" ? "Όλα όσα χρειάζεται να γνωρίζετε." : "Everything you need to know."}
        subtitle={lang === "el" ? "Ελέγξτε τους όρους κράτησης και τις πρακτικές πληροφορίες πριν επιλέξετε τη διαμονή σας." : "Review the booking terms and practical information before choosing your stay."}
        imageSrc={siteMedia.policies_hero?.image_url ?? "/723812114.jpg"}
        imageAlt={(lang === "el" ? siteMedia.policies_hero?.alt_text_el : siteMedia.policies_hero?.alt_text_en) || (lang === "el" ? "Πληροφορίες και πολιτικές" : "Guest information and policies")}
      />
      <section className="policy-hub-content">
        <div className="policy-hub-heading reveal-from-bottom">
          <p className="section-label">{lang === "el" ? "Οδηγός διαμονής" : "Stay guide"}</p>
          <h2>{lang === "el" ? "Σαφείς όροι. Χωρίς εκπλήξεις." : "Clear terms. No surprises."}</h2>
          <p>{lang === "el" ? "Οι ειδικοί όροι που εμφανίζονται στην επιλεγμένη τιμή και στην επιβεβαίωσή σας ισχύουν για τη συγκεκριμένη κράτηση." : "The specific terms shown for your selected rate and repeated in your confirmation apply to that reservation."}</p>
        </div>
        <div className="policy-card-grid stagger-reveal">
          {getPolicyLinks(lang).map((item, index) => (
            <Link key={item.href} href={`/${lang}${item.href}`} className="policy-card">
              <span className="policy-card-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <span className="policy-card-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
        <div className="policy-note reveal-from-bottom">
          <span aria-hidden="true">✦</span>
          <p>{lang === "el" ? "Αν ένας όρος στην επιβεβαίωσή σας διαφέρει από μια γενική περιγραφή, επικοινωνήστε μαζί μας πριν από την πληρωμή ή την άφιξη. Τα υποχρεωτικά δικαιώματα που προβλέπει ο νόμος εξακολουθούν να ισχύουν." : "If a term in your confirmation differs from a general description, contact us before payment or arrival. Mandatory rights provided by law continue to apply."}</p>
        </div>
      </section>
    </div>
  );
}
