import type { Metadata } from "next";
import EditorialPageHero from "@/components/EditorialPageHero";
import BookingForm from "@/components/BookingForm";
import { getDictionary } from "@/lib/i18n";
import { getRooms, getSiteMediaImages } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? (locale as Locale) : "el");
  return { title: dict.nav.booking, description: dict.booking.subtitle };
}

export default async function BookingPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ room?: string; checkIn?: string; checkOut?: string; adults?: string; children?: string }>;
}) {
  const { locale } = await params;
  const { room: roomSlug, checkIn, checkOut, adults, children } = await searchParams;
  if (!isLocale(locale)) return null;
  const lang = locale as Locale;
  const dict = await getDictionary(lang);
  const [rooms, siteMedia] = await Promise.all([getRooms(), getSiteMediaImages(["booking_hero"])]);
  const initialRoom = rooms.find((room) => room.slug === roomSlug);
  const isValidDate = (value?: string) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + "T00:00:00Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  const initialCheckIn = isValidDate(checkIn) ? checkIn! : null;
  const initialCheckOut = isValidDate(checkOut) && (!initialCheckIn || checkOut! > initialCheckIn) ? checkOut! : null;
  const parseGuestCount = (value: string | undefined, fallback: number, min: number) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= min && parsed <= 12 ? parsed : fallback;
  };
  const initialAdults = parseGuestCount(adults, 2, 1);
  const initialChildren = parseGuestCount(children, 0, 0);

  return (
    <div className="editorial-page booking-page">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Η διαμονή σας ξεκινά εδώ" : "Your stay starts here"}
        title={dict.booking.title}
        subtitle={dict.booking.subtitle}
        imageSrc={siteMedia.booking_hero?.image_url ?? "/902234060.jpg"}
        imageAlt={(lang === "el" ? siteMedia.booking_hero?.alt_text_el : siteMedia.booking_hero?.alt_text_en) || dict.booking.title}
      />
      <section className="editorial-standard-content">
        <div className="booking-layout-premium">
          <div className="booking-aside reveal-from-left">
            <p className="section-label">{lang === "el" ? "Αίτημα κράτησης" : "Booking request"}</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-olive-dark sm:text-5xl">
              {lang === "el" ? "Μια ήρεμη διαμονή, λίγα βήματα μακριά." : "A slower stay is a few steps away."}
            </h2>
            <p className="mt-5 max-w-lg leading-8 text-ink-soft">
              {lang === "el" ? "Συμπληρώστε τα στοιχεία σας. Η ομάδα μας θα ελέγξει τη διαθεσιμότητα και θα σας στείλει επιβεβαίωση με την τιμή και τους όρους της κράτησης." : "Send your details. Our team will check availability and reply with a confirmation including the price and the booking conditions."}
            </p>
            <ul className="mt-7 space-y-3 text-sm text-ink-soft">
              {[lang === "el" ? "Επιλέξτε ημερομηνίες και αριθμό επισκεπτών" : "Choose dates and guest count", lang === "el" ? "Ελέγξτε την προσφορά και τους όρους ακύρωσης" : "Review the offer and cancellation terms", lang === "el" ? "Περιμένετε γραπτή επιβεβαίωση" : "Wait for written confirmation"].map((item, index) => (
                <li key={item} className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive text-xs font-semibold text-cream">{index + 1}</span><span className="pt-1">{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="booking-form-premium reveal-from-right">
            <BookingForm
              rooms={rooms}
              dict={dict}
              initialRoomSlug={initialRoom?.slug ?? null}
              initialCheckIn={initialCheckIn}
              initialCheckOut={initialCheckOut}
              initialAdults={initialAdults}
              initialChildren={initialChildren}
              locale={lang}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
