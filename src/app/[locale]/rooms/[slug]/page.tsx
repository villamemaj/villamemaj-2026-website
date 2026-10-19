import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import BookingForm from "@/components/BookingForm";
import RoomPhotoGallery from "@/components/RoomPhotoGallery";
import { getDictionary } from "@/lib/i18n";
import { getRoomBySlug, getRooms } from "@/lib/data";
import { isLocale, LOCALES, SITE_CONFIG, type Locale } from "@/lib/site";

export async function generateStaticParams() {
  const rooms = await getRooms();
  return LOCALES.flatMap((locale) => rooms.map((room) => ({ locale, slug: room.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = isLocale(locale) ? (locale as Locale) : "el";
  const room = await getRoomBySlug(slug);
  if (!room) return { title: SITE_CONFIG.name };
  return {
    title: lang === "el" ? room.name_el : room.name_en,
    description: (lang === "el" ? room.description_el : room.description_en) ?? undefined,
  };
}

export default async function RoomDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const dict = await getDictionary(lang);
  const [room, rooms] = await Promise.all([getRoomBySlug(slug), getRooms()]);
  if (!room) notFound();

  const name = lang === "el" ? room.name_el : room.name_en;
  const description = (lang === "el" ? room.description_el : room.description_en) ?? (lang === "el" ? "Ένας άνετος χώρος για να χαλαρώσετε." : "A comfortable space to slow down and unwind.");

  return (
    <div className="editorial-page room-detail-page">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Οι χώροι μας" : "Our spaces"}
        title={name}
        subtitle={description}
        imageSrc={room.image_url || "/723811999.jpg"}
        imageAlt={name}
      />
      {room.gallery_images?.length ? <RoomPhotoGallery images={room.gallery_images} locale={lang} roomName={name} /> : null}
      <section className="editorial-standard-content">
        <Link href={`/${lang}/rooms`} className="inline-flex items-center gap-2 text-sm font-semibold text-olive hover:underline">
          <span aria-hidden="true">←</span>{dict.room.backToRooms}
        </Link>
        <div className="room-overview-grid mt-8">
          <div className="reveal-from-left">
            <p className="section-label">{lang === "el" ? "Ο χώρος σας" : "Your space"}</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-olive-dark sm:text-5xl">
              {lang === "el" ? "Όλα όσα χρειάζεστε, με τον δικό σας ρυθμό." : "Everything you need, at your own pace."}
            </h2>
            <div className="room-detail-stats">
              <span className="room-detail-stat">{dict.rooms.guests}: {room.capacity}</span>
              {room.size_sqm != null && <span className="room-detail-stat">{dict.rooms.size}: {room.size_sqm} m²</span>}
              {room.price_per_night != null && <span className="room-detail-stat">{dict.rooms.from} {room.price_per_night} {dict.rooms.perNight}</span>}
            </div>
            <p className="room-detail-copy">{description}</p>
            {room.amenities.length > 0 && (
              <div className="mt-8">
                <p className="section-label">{dict.rooms.amenities}</p>
                <ul className="mt-4 flex flex-wrap gap-2 stagger-reveal">
                  {room.amenities.map((amenity) => (
                    <li key={amenity} className="rounded-full border border-sand-dark bg-white px-4 py-2 text-sm text-ink-soft">
                      {dict.amenities[amenity] ?? amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <aside className="room-detail-booking-card reveal-from-right">
            <p className="section-label text-gold-soft">{lang === "el" ? "Σχεδιάστε τη διαμονή σας" : "Plan your stay"}</p>
            <h2 className="mt-3">{lang === "el" ? "Βρείτε τις ημερομηνίες σας." : "Find your dates."}</h2>
            <p>{lang === "el" ? "Υποβάλετε το αίτημά σας και θα επιβεβαιώσουμε διαθεσιμότητα, τιμή και τους όρους κράτησης." : "Send a request and we will confirm availability, price and the applicable booking terms."}</p>
            <Link href={`/${lang}/booking?room=${encodeURIComponent(room.slug)}`} className="button-light mt-7 w-full">
              {dict.room.bookThisRoom}<span aria-hidden="true">↗</span>
            </Link>
          </aside>
        </div>
        <section className="room-detail-booking-panel reveal-from-bottom">
          <p className="section-label">{lang === "el" ? "Αίτημα κράτησης" : "Booking request"}</p>
          <h2 className="mt-3 font-display text-3xl font-medium text-olive-dark sm:text-4xl">{dict.room.bookThisRoom}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{lang === "el" ? "Ελέγξτε προσεκτικά τις ημερομηνίες και περιμένετε τη γραπτή επιβεβαίωση με την τελική τιμή και τους όρους ακύρωσης." : "Please review your dates carefully and wait for written confirmation showing the final price and cancellation terms."}</p>
          <div className="mt-8 max-w-3xl">
            <BookingForm rooms={rooms} dict={dict} initialRoomSlug={room.slug} locale={lang} />
          </div>
        </section>
      </section>
    </div>
  );
}
