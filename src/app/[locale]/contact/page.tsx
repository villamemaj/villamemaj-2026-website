import type { Metadata } from "next";
import EditorialPageHero from "@/components/EditorialPageHero";
import ContactForm from "@/components/ContactForm";
import { getDictionary } from "@/lib/i18n";
import { getContactInfo } from "@/lib/data";
import { isLocale, SITE_CONFIG, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? (locale as Locale) : "el");
  return { title: dict.nav.contact, description: dict.contact.subtitle };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const lang = locale as Locale;
  const dict = await getDictionary(lang);
  const contact = await getContactInfo();
  const phoneHref = contact.phone ? contact.phone.replace(/\s/g, "") : "";
  const address = lang === "el" ? contact.address_el : contact.address_en ?? SITE_CONFIG.address[lang];

  return (
    <div className="editorial-page contact-page">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Είμαστε εδώ για εσάς" : "We're here to help"}
        title={dict.contact.title}
        subtitle={dict.contact.subtitle}
        imageSrc="/723812114.jpg"
      />
      <section className="editorial-standard-content">
        <div className="contact-premium-grid">
          <div className="contact-premium-details stagger-reveal">
            <div className="contact-premium-card">
              <p className="section-label">{dict.contact.phoneLabel}</p>
              {contact.phone ? (
                <a href={`tel:${phoneHref}`} className="contact-premium-value">{contact.phone}</a>
              ) : (
                <p className="contact-premium-value text-ink-soft">—</p>
              )}
              <p className="contact-premium-caption">{lang === "el" ? "Για επείγουσες διευκρινίσεις σχετικά με την άφιξη." : "For time-sensitive arrival questions."}</p>
            </div>
            <div className="contact-premium-card">
              <p className="section-label">{dict.contact.emailLabel}</p>
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="contact-premium-value">{contact.email}</a>
              ) : (
                <p className="contact-premium-value text-ink-soft">—</p>
              )}
              <p className="contact-premium-caption">{lang === "el" ? "Αναφέρετε τον κωδικό κράτησης εφόσον υπάρχει." : "Include your booking reference if you have one."}</p>
            </div>
            <div className="contact-premium-card">
              <p className="section-label">{dict.contact.addressLabel}</p>
              <p className="contact-premium-value">{address}</p>
            </div>
          </div>
          <div className="contact-premium-form reveal-from-right">
            <p className="section-label">{lang === "el" ? "Στείλτε μας μήνυμα" : "Send us a message"}</p>
            <ContactForm dict={dict} />
          </div>
        </div>
        <p className="mt-8 text-sm leading-7 text-ink-soft reveal-from-bottom">
          {lang === "el" ? "Για πληροφορίες σχετικά με τα προσωπικά δεδομένα, τις ακυρώσεις και τους κανόνες διαμονής, διαβάστε τις πολιτικές επισκεπτών." : "For details about personal data, cancellations and house rules, please review our guest policies."}
          {" "}<a className="font-semibold text-olive underline underline-offset-4" href={`/${lang}/policies`}>{lang === "el" ? "Πολιτικές καταλύματος" : "Guest policies"}</a>
        </p>
      </section>
    </div>
  );
}
