import type { Metadata } from "next";
import Image from "next/image";
import EditorialPageHero from "@/components/EditorialPageHero";
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
          <div className="gallery-mosaic editorial-gallery-grid stagger-reveal">
            {images.map((image, index) => (
              <figure key={image.id} className={`editorial-gallery-tile editorial-gallery-tile-${(index % 6) + 1} relative overflow-hidden rounded-[22px] bg-sand`}>
                <Image
                  src={image.image_url}
                  alt={(lang === "el" ? image.alt_text_el || image.caption_el : image.alt_text_en || image.caption_en) || `${SITE_CONFIG.name} ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  style={{ objectPosition: "center" }}
                />
                {(image.caption_el || image.caption_en) && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-5 pt-16 text-sm text-white">
                    {lang === "el" ? image.caption_el : image.caption_en}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-sand-dark bg-white p-10 text-center text-ink-soft">{dict.gallery.empty}</p>
        )}
      </section>
    </div>
  );
}
