import Image from "next/image";
import type { Locale } from "@/lib/site";

export default function EditorialPageHero({
  locale,
  eyebrow,
  title,
  subtitle,
  imageSrc = "/723811999.jpg",
  imageAlt,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <section className="editorial-page-hero">
      <Image
        src={imageSrc}
        alt={imageAlt || (locale === "el" ? "Villa Memaj" : "Villa Memaj")}
        fill
        priority={false}
        sizes="100vw"
        className="editorial-page-hero-image"
      />
      <div className="editorial-page-hero-shade" aria-hidden="true" />
      <div className="editorial-page-hero-inner">
        <p className="premium-kicker reveal-from-bottom"><span className="kicker-line" />{eyebrow}</p>
        <h1 className="editorial-page-title reveal-from-left">{title}</h1>
        <p className="editorial-page-subtitle reveal-from-bottom">{subtitle}</p>
      </div>
      <div className="editorial-page-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
          <path d="M0,36 C210,78 378,12 590,35 C806,60 978,85 1160,42 C1285,12 1365,24 1440,38 L1440,90 L0,90 Z" />
        </svg>
      </div>
    </section>
  );
}
