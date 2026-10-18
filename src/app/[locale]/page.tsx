import Image from "next/image";
import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import RoomCard from "@/components/RoomCard";
import { getDictionary } from "@/lib/i18n";
import { getGalleryImages, getRooms } from "@/lib/data";
import { isLocale, SITE_CONFIG, type Locale } from "@/lib/site";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = await getDictionary(locale as Locale);

  const [rooms, gallery] = await Promise.all([getRooms(), getGalleryImages()]);
  const previewRooms = rooms.slice(0, 3);
  const previewGallery = gallery.slice(0, 4);

  const heroImage = "/902234060.jpg";
  const galleryUrls = gallery.map((image) => image.image_url);
  const heroImages =
    galleryUrls.length > 0
      ? [heroImage, ...galleryUrls.filter((url) => url !== heroImage)]
      : [heroImage];

  return (
    <>
      <section className="relative flex min-h-[85vh] items-center overflow-hidden text-cream">
        <HeroCarousel images={heroImages} />
        <div className="absolute inset-0 bg-gradient-to-r from-olive-dark/90 via-olive-dark/70 to-olive-dark/40" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <p className="section-label text-gold-soft">
            {dict.home.welcomeLabel}
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight sm:text-7xl">
            {dict.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
            {dict.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={`/${locale}/rooms`}
              className="rounded-full bg-cream px-8 py-3.5 text-sm font-semibold text-olive-dark transition-colors hover:bg-white"
            >
              {dict.hero.ctaRooms}
            </Link>
            <Link
              href={`/${locale}/booking`}
              className="rounded-full border border-cream/40 px-8 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-cream/10"
            >
              {dict.hero.ctaBook}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="section-label">{dict.home.welcomeLabel}</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold text-ink sm:text-5xl">
          {dict.home.welcomeTitle}
        </h2>
        <p className="mt-6 max-w-2xl leading-relaxed text-ink-soft">
          {dict.home.welcomeText}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {dict.home.features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-sand-dark bg-white p-6"
            >
              <h3 className="font-display text-xl font-semibold text-olive">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">{SITE_CONFIG.name}</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-ink">
                {dict.home.roomsTitle}
              </h2>
              <p className="mt-3 max-w-xl text-ink-soft">{dict.home.roomsText}</p>
            </div>
            <Link
              href={`/${locale}/rooms`}
              className="text-sm font-semibold text-olive underline-offset-4 hover:underline"
            >
              {dict.home.viewAll} →
            </Link>
          </div>

          {previewRooms.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {previewRooms.map((room) => (
                <RoomCard key={room.id} room={room} locale={locale as Locale} dict={dict} />
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-2xl border border-sand-dark bg-white p-8 text-center text-ink-soft">
              {dict.rooms.empty}
            </p>
          )}
        </div>
      </section>

      {previewGallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="section-label">{dict.nav.gallery}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-ink">
            {dict.home.galleryTitle}
          </h2>
          <p className="mt-3 max-w-xl text-ink-soft">{dict.home.galleryText}</p>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {previewGallery.map((image) => (
              <div
                key={image.id}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand"
              >
                <Image
                  src={image.image_url}
                  alt={image.caption_en ?? image.caption_el ?? SITE_CONFIG.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-olive py-20 text-cream">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">
            {dict.home.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/80">{dict.home.ctaText}</p>
          <Link
            href={`/${locale}/booking`}
            className="mt-8 inline-block rounded-full bg-cream px-10 py-3.5 text-sm font-semibold text-olive-dark transition-colors hover:bg-white"
          >
            {dict.home.ctaBook}
          </Link>
        </div>
      </section>
    </>
  );
}
