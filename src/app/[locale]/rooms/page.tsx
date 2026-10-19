import type { Metadata } from "next";
import EditorialPageHero from "@/components/EditorialPageHero";
import RoomCard from "@/components/RoomCard";
import { getDictionary } from "@/lib/i18n";
import { getRooms, getSiteMediaImages } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? (locale as Locale) : "el");
  return { title: dict.nav.rooms, description: dict.rooms.subtitle };
}

export default async function RoomsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const lang = locale as Locale;
  const dict = await getDictionary(lang);
  const [rooms, siteMedia] = await Promise.all([getRooms(), getSiteMediaImages(["rooms_hero"])]);

  return (
    <div className="editorial-page rooms-page">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Οι χώροι μας" : "Our spaces"}
        title={dict.rooms.title}
        subtitle={dict.rooms.subtitle}
        imageSrc={siteMedia.rooms_hero?.image_url ?? "/902234060.jpg"}
        imageAlt={(lang === "el" ? siteMedia.rooms_hero?.alt_text_el : siteMedia.rooms_hero?.alt_text_en) || (lang === "el" ? "Οι χώροι μας" : "Our rooms")}
      />
      <section className="editorial-standard-content">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 reveal-from-bottom">
          <div>
            <p className="section-label">{lang === "el" ? "Επιλεγμένη διαμονή" : "Considered stays"}</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-olive-dark sm:text-5xl">
              {lang === "el" ? "Βρείτε τον χώρο σας." : "Find your place."}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-ink-soft">
            {lang === "el" ? "Ελέγξτε τη χωρητικότητα, τις παροχές και την τιμή και συνεχίστε στην ασφαλή φόρμα κράτησης." : "Review capacity, amenities and pricing, then continue to the booking request."}
          </p>
        </div>
        {rooms.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-reveal">
            {rooms.map((room) => <RoomCard key={room.id} room={room} locale={lang} dict={dict} />)}
          </div>
        ) : (
          <p className="rounded-2xl border border-sand-dark bg-white p-10 text-center text-ink-soft">
            {dict.rooms.empty}
          </p>
        )}
      </section>
    </div>
  );
}
