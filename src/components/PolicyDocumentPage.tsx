import Link from "next/link";
import EditorialPageHero from "@/components/EditorialPageHero";
import { policyLinks, type PolicyDocument } from "@/lib/legal-content";
import type { Locale } from "@/lib/site";

export default function PolicyDocumentPage({ locale, document }: { locale: Locale; document: PolicyDocument }) {
  const links = policyLinks[locale];
  return (
    <div className="legal-page">
      <EditorialPageHero locale={locale} eyebrow={document.label} title={document.title} subtitle={document.subtitle} />
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
