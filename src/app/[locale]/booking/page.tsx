import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";
import { getDictionary } from "@/lib/i18n";
import { getRooms } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(isLocale(locale) ? (locale as Locale) : "el");
  return { title: dict.nav.booking, description: dict.booking.subtitle };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ room?: string }>;
}) {
  const { locale } = await params;
  const { room: roomSlug } = await searchParams;
  if (!isLocale(locale)) return null;
  const dict = await getDictionary(locale as Locale);

  const rooms = await getRooms();
  const initialRoom = rooms.find((room) => room.slug === roomSlug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="section-label">{dict.nav.booking}</p>
      <h1 className="mt-3 font-display text-5xl font-semibold text-ink">
        {dict.booking.title}
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">{dict.booking.subtitle}</p>

      <div className="mt-12 max-w-3xl rounded-2xl border border-sand-dark bg-sand/40 p-6 sm:p-10">
        <BookingForm
          rooms={rooms}
          dict={dict}
          initialRoomSlug={initialRoom?.slug ?? null}
          locale={locale}
        />
      </div>
    </div>
  );
}
