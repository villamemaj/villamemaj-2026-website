import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import { getDictionary } from "@/lib/i18n";
import { getRoomBySlug, getRooms } from "@/lib/data";
import { isLocale, SITE_CONFIG, type Locale } from "@/lib/site";

export async function generateStaticParams() {
  const rooms = await getRooms();
  const locales = ["el", "en"];
  return locales.flatMap((locale) =>
    rooms.map((room) => ({ locale, slug: room.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const safeLocale = isLocale(locale) ? (locale as Locale) : "el";
  const room = await getRoomBySlug(slug);
  if (!room) return { title: SITE_CONFIG.name };
  return {
    title: safeLocale === "el" ? room.name_el : room.name_en,
    description: (safeLocale === "el" ? room.description_el : room.description_en) ?? undefined,
  };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const dict = await getDictionary(locale as Locale);

  const [room, rooms] = await Promise.all([getRoomBySlug(slug), getRooms()]);
  if (!room) notFound();

  const name = locale === "el" ? room.name_el : room.name_en;
  const description =
    locale === "el" ? room.description_el : room.description_en;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href={`/${locale}/rooms`}
        className="text-sm font-medium text-olive hover:underline"
      >
        ← {dict.room.backToRooms}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
          {room.image_url ? (
            <Image
              src={room.image_url}
              alt={name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-ink-soft/30">
              ✦
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
            {name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            <span>
              {dict.rooms.guests}: {room.capacity}
            </span>
            {room.size_sqm != null && (
              <span>
                {dict.rooms.size}: {room.size_sqm} m²
              </span>
            )}
            {room.price_per_night != null && (
              <span className="font-semibold text-olive">
                {dict.rooms.from} {room.price_per_night} {dict.rooms.perNight}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-6 leading-relaxed text-ink-soft">{description}</p>
          )}

          {room.amenities.length > 0 && (
            <div className="mt-8">
              <p className="section-label">{dict.rooms.amenities}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {room.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full border border-sand-dark bg-white px-4 py-1.5 text-sm text-ink-soft"
                  >
                    {dict.amenities[amenity] ?? amenity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 rounded-2xl border border-sand-dark bg-sand/40 p-6 sm:p-10">
        <h2 className="font-display text-3xl font-semibold text-ink">
          {dict.room.bookThisRoom}
        </h2>
        <div className="mt-8 max-w-3xl">
          <BookingForm rooms={rooms} dict={dict} initialRoomSlug={room.slug} locale={locale} />
        </div>
      </section>
    </div>
  );
}
