import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import type { HotelRoom } from "@/lib/types";

const SITE_NAME_MARK = "✦";

interface RoomCardProps {
  room: HotelRoom;
  locale: Locale;
  dict: Dictionary;
}

export default function RoomCard({ room, locale, dict }: RoomCardProps) {
  const name = locale === "el" ? room.name_el : room.name_en;
  const cover = room.gallery_images?.find((image) => image.active && image.is_cover) ?? room.gallery_images?.find((image) => image.active) ?? null;
  const imageAlt = (locale === "el" ? cover?.alt_text_el : cover?.alt_text_en) || name;
  const formattedPrice = room.price_per_night == null
    ? null
    : new Intl.NumberFormat(locale, {
        style: "currency",
        currency: room.currency || "EUR",
        maximumFractionDigits: 0,
      }).format(Number(room.price_per_night));

  return (
    <article className="group overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {room.image_url ? (
          <Image
            src={room.image_url}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft/50">
            <span className="font-display text-4xl">{SITE_NAME_MARK}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">{name}</h3>
          {formattedPrice != null && (
            <p className="shrink-0 text-sm font-semibold text-olive">
              {dict.rooms.from} {formattedPrice}
            </p>
          )}
        </div>

        <p className="text-sm text-ink-soft">
          {dict.rooms.guests}: {room.capacity}
          {room.size_sqm != null && <> · {dict.rooms.size}: {room.size_sqm} m²</>}
        </p>

        <div className="flex gap-2 pt-1">
          <Link
            href={`/${locale}/rooms/${room.slug}`}
            className="flex-1 rounded-full border border-olive/30 py-2 text-center text-sm font-medium text-olive transition-colors hover:bg-olive hover:text-cream"
          >
            {dict.rooms.viewDetails}
          </Link>
          <Link
            href={`/${locale}/booking?room=${room.slug}`}
            className="flex-1 rounded-full bg-olive py-2 text-center text-sm font-medium text-cream transition-colors hover:bg-olive-dark"
          >
            {dict.rooms.book}
          </Link>
        </div>
      </div>
    </article>
  );
}
