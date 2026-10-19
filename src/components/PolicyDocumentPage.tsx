import Link from "next/link";
import EditorialPageHero from "@/components/EditorialPageHero";
import { policyLinks, type PolicyDocument } from "@/lib/legal-content";
import type { Locale } from "@/lib/site";

export default function PolicyDocumentPage({ locale, document }: { locale: Locale; document: PolicyDocument }) {
  const links = policyLinks[locale];
  return (
    <div className="legal-page">
      <EditorialPageHero locale={locale} eyebrow={document.label} title={document.title} subtitle={document.subtitle} />
      {locale !== "en" && locale !== "el" ? (
        <div className="legal-translation-note" role="note">
          <strong>{locale === "fr" ? "Traduction juridique à valider" : locale === "de" ? "Rechtliche Übersetzung noch zu prüfen" : locale === "sq" ? "Përkthimi ligjor duhet verifikuar" : "Traduzione legale da verificare"}</strong>
          <p>{locale === "fr" ? "Le texte juridiquement applicable est actuellement disponible en anglais. Une traduction professionnelle doit être vérifiée avant que cette version puisse être considérée comme définitive." : locale === "de" ? "Der rechtlich maßgebliche Text ist derzeit auf Englisch verfügbar. Eine professionelle Übersetzung muss geprüft werden, bevor diese Fassung als endgültig gilt." : locale === "sq" ? "Teksti ligjor aktualisht është i disponueshëm në anglisht. Përkthimi profesional duhet verifikuar para se ky version të konsiderohet përfundimtar." : "Il testo giuridicamente applicabile è attualmente disponibile in inglese. Una traduzione professionale deve essere verificata prima che questa versione possa essere considerata definitiva."}</p>
        </div>
      ) : null}
      <div className="legal-layout">
        <aside className="legal-sidebar reveal-from-left">
          <p className="section-label">{locale === "el" ? "Πληροφορίες" : "Information"}</p>
          <nav aria-label={locale === "el" ? "Σχετικές πολιτικές" : "Related policies"} className="mt-4 space-y-2">
            {links.map((item) => (
              <Link key={item.href} href={`/${locale}${item.href}`} className="legal-side-link">
                {item.label}<span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
          <p className="legal-updated">{locale === "el" ? "Τελευταία ενημέρωση" : "Last updated"}: {document.updated}</p>
        </aside>
        <article className="legal-article">
          {document.sections.map((section, index) => (
            <section key={section.heading} id={`section-${index + 1}`} className="legal-section reveal-from-bottom">
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets?.length ? (
                <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              ) : null}
            </section>
          ))}
          <div className="legal-contact">
            <p className="section-label">{locale === "el" ? "Χρειάζεστε βοήθεια;" : "Need help?"}</p>
            <p>{locale === "el" ? "Για ερωτήματα σχετικά με την κράτηση, επικοινωνήστε πριν δεσμευτείτε." : "For questions about your booking, contact us before committing."}</p>
            <a href="mailto:info@villamemaj.com">info@villamemaj.com</a>
          </div>
        </article>
      </div>
    </div>
  );
}
