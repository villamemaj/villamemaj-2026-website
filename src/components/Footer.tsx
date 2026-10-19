import Link from "next/link";
import { SITE_CONFIG, type Locale } from "@/lib/site";
import { getContactInfo } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n";
import CookieSettingsLink from "@/components/CookieSettingsLink";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export default async function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear();
  const contact = await getContactInfo();
  const phoneHref = contact.phone ? contact.phone.replace(/\s/g, "") : "";
  const address = locale === "el" ? (contact.address_el ?? SITE_CONFIG.address.el) : (contact.address_en ?? SITE_CONFIG.address[locale]);

  const links = [
    { href: `/${locale}/rooms`, label: dict.nav.rooms },
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/booking`, label: dict.nav.booking },
    { href: `/${locale}/contact`, label: dict.nav.contact },
    { href: `/${locale}/flights`, label: locale === "el" ? "Πτήσεις" : locale === "fr" ? "Vols" : locale === "sq" ? "Fluturime" : locale === "de" ? "Flüge" : locale === "it" ? "Voli" : "Flights" },
    { href: `/${locale}/reviews`, label: locale === "el" ? "Κριτικές επισκεπτών" : locale === "fr" ? "Avis voyageurs" : locale === "sq" ? "Vlerësimet" : locale === "de" ? "Gästebewertungen" : locale === "it" ? "Recensioni" : "Guest reviews" },
  ];
  const guestLabels: Record<Locale, string[]> = {
    el: ["Πληροφορίες & πολιτικές", "Συχνές ερωτήσεις", "Όροι κράτησης", "Ακύρωση & επιστροφές", "Πολιτική απορρήτου", "Κανόνες καταλύματος", "Επιλογές πληρωμής"],
    en: ["Guest information", "FAQ", "Terms & conditions", "Cancellations & refunds", "Privacy policy", "House rules", "Payment options"],
    fr: ["Informations voyageurs", "FAQ", "Conditions de réservation", "Annulations et remboursements", "Confidentialité", "Règles du logement", "Paiements"],
    sq: ["Informacion për vizitorët", "Pyetje të shpeshta", "Kushtet e rezervimit", "Anulime dhe rimbursime", "Privatësia", "Rregullat e akomodimit", "Pagesat"],
    de: ["Gästeinformationen", "FAQ", "Buchungsbedingungen", "Stornierung & Erstattung", "Datenschutz", "Hausordnung", "Zahlungsoptionen"],
    it: ["Informazioni per gli ospiti", "FAQ", "Termini e condizioni", "Cancellazioni e rimborsi", "Privacy", "Regole della struttura", "Pagamenti"],
  };
  const policyPaths = ["/policies", "/faq", "/terms", "/cancellation", "/privacy", "/house-rules", "/payments"];
  const policyLinks = policyPaths.map((path, index) => ({ href: `/${locale}${path}`, label: guestLabels[locale][index] }));

  return (
    <footer className="mt-auto bg-olive-dark text-cream/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-cream">
            {SITE_CONFIG.name}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">
            {dict.footer.tagline}
          </p>
        </div>

        <div>
          <p className="section-label text-gold-soft">{dict.footer.quickLinks}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-cream/80 hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-label text-gold-soft">{guestLabels[locale][0]}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {policyLinks.map((link) => (
              <li key={link.href}><Link href={link.href} className="text-cream/80 hover:text-cream">{link.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="section-label text-gold-soft">{dict.footer.contact}</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li>
              {contact.phone ? <a href={`tel:${phoneHref}`}>{contact.phone}</a> : null}
            </li>
            <li>
              {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : null}
            </li>
            {address ? <li>{address}</li> : null}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-cream/10 px-4 py-5 text-center text-xs text-cream/50">
        <span>© {year} {SITE_CONFIG.name}. {dict.footer.rights}</span>
        <CookieSettingsLink locale={locale} />
      </div>
    </footer>
  );
}
