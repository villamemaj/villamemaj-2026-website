import type { Metadata } from "next";
import EditorialPageHero from "@/components/EditorialPageHero";
import PublicGalleryGrid from "@/components/PublicGalleryGrid";
import { getDictionary } from "@/lib/i18n";
import { getGalleryImages, getSiteMediaImages } from "@/lib/data";
import { isLocale, SITE_CONFIG, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? (locale as Locale) : "el");
  return { title: dict.nav.gallery, description: dict.gallery.subtitle };
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const lang = locale as Locale;
  const dict = await getDictionary(lang);
  const [images, siteMedia] = await Promise.all([getGalleryImages(), getSiteMediaImages(["gallery_hero"])]);

  return (
    <div className="editorial-page gallery-page">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Μια ματιά στη διαμονή σας" : "A look at your stay"}
        title={dict.gallery.title}
        subtitle={dict.gallery.subtitle}
        imageSrc={siteMedia.gallery_hero?.image_url ?? "/723812114.jpg"}
        imageAlt={(lang === "el" ? siteMedia.gallery_hero?.alt_text_el : siteMedia.gallery_hero?.alt_text_en) || (lang === "el" ? "Μια ματιά στη διαμονή σας" : "A look at your stay")}
      />
      <section className="editorial-standard-content">
        <div className="mb-10 max-w-2xl reveal-from-left">
          <p className="section-label">{lang === "el" ? "Φως · υφή · λεπτομέρεια" : "Light · texture · detail"}</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-olive-dark sm:text-5xl">
            {lang === "el" ? "Ανακαλύψτε τη Villa Memaj." : "Discover Villa Memaj."}
          </h2>
        </div>
        {images.length > 0 ? (
          <PublicGalleryGrid images={images} locale={lang} siteName={SITE_CONFIG.name} copy={dict.gallery} />
        ) : (
          <p className="rounded-2xl border border-sand-dark bg-white p-10 text-center text-ink-soft">{dict.gallery.empty}</p>
        )}
      </section>
    </div>
  );
}
