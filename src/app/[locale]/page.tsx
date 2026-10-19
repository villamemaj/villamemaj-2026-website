import Image from "next/image";
import Link from "next/link";
import RoomCard from "@/components/RoomCard";
import { getDictionary } from "@/lib/i18n";
import { getGalleryImages, getRooms, getSiteMediaImages } from "@/lib/data";
import { isLocale, SITE_CONFIG, type Locale } from "@/lib/site";

function WaveTransition({ tone = "cream" }: { tone?: "cream" | "sand" | "olive" }) {
  return (
    <div className={"wave-transition wave-" + tone} aria-hidden="true">
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" role="presentation">
        <path d="M0,34 C180,92 350,2 535,34 C730,70 820,98 1015,47 C1180,3 1300,16 1440,50 L1440,100 L0,100 Z" />
        <path className="wave-ribbon" d="M0,53 C180,12 330,82 520,48 C715,12 845,15 1030,56 C1190,92 1320,42 1440,33" />
      </svg>
    </div>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = await getDictionary(locale as Locale);
  const greek = locale === "el";

  const copy = greek
    ? {
        heroKicker: "Η φιλοξενία συναντά τη θάλασσα",
        heroNote: "Ένα ήρεμο καταφύγιο στην ακτή της Αυλώνας",
        scroll: "Συνεχίστε για να ανακαλύψετε",
        introKicker: "Η φιλοσοφία μας",
        introTitle: "Η πολυτέλεια βρίσκεται στον χρόνο που παίρνετε πίσω.",
        introBody:
          "Απαλοί ρυθμοί, ζεστή φιλοξενία και χώρος για να νιώσετε σαν στο σπίτι σας. Σχεδιάσαμε κάθε διαμονή γύρω από τις μικρές στιγμές που κάνουν ένα ταξίδι αξέχαστο.",
        introLink: "Γνωρίστε τη φιλοξενία μας",
        momentsKicker: "Μια διαμονή, πολλές στιγμές",
        momentsTitle: "Απολαύστε τον χώρο με τον δικό σας ρυθμό.",
        momentsBody: "Από ένα ήσυχο πρωινό στο μπαλκόνι μέχρι τις βραδιές με θέα, κάθε λεπτομέρεια προσκαλεί σε χαλάρωση.",
        roomsKicker: "Επιλεγμένοι χώροι",
        galleryKicker: "Μια ματιά στη διαμονή σας",
        galleryTitle: "Φως, υφή και μικρές λεπτομέρειες.",
        galleryBody: "Ανακαλύψτε τους χώρους και τις γωνιές που θα γίνουν κομμάτι της απόδρασής σας.",
        quote: "Φτάστε ως επισκέπτες. Φύγετε με την αίσθηση ότι ανήκετε εδώ.",
        quoteNote: "Η δική σας στιγμή στην ακτή",
        ctaKicker: "Η επόμενη απόδραση ξεκινά εδώ",
        ctaTitle: "Αφήστε χώρο για κάτι όμορφο.",
      }
    : {
        heroKicker: "Where thoughtful stays meet the sea",
        heroNote: "A slower kind of escape on the Vlore coast",
        scroll: "Scroll to discover",
        introKicker: "The art of staying",
        introTitle: "Luxury is having the time to slow down.",
        introBody:
          "Gentle rhythms, thoughtful hospitality and room to feel at home. We shape every stay around the little moments that make a journey unforgettable.",
        introLink: "Discover our hospitality",
        momentsKicker: "One stay, many moments",
        momentsTitle: "Make space for your own kind of escape.",
        momentsBody: "From a quiet morning on the balcony to evenings with a view, every detail invites you to settle in.",
        roomsKicker: "Considered spaces",
        galleryKicker: "A glimpse of your stay",
        galleryTitle: "Light, texture and thoughtful details.",
        galleryBody: "Explore the rooms and corners that may become part of your next escape.",
        quote: "Arrive as a guest. Leave with the feeling that you belong here.",
        quoteNote: "Your moment on the coast",
        ctaKicker: "Your next escape starts here",
        ctaTitle: "Make room for something beautiful.",
      };

  const [rooms, gallery, siteMedia] = await Promise.all([
    getRooms(),
    getGalleryImages(),
    getSiteMediaImages(["home_hero", "home_hero_detail", "home_intro_main", "home_intro_kitchen", "home_moment_terrace", "home_moment_bedroom", "home_moment_coast", "home_quote"]),
  ]);
  const previewRooms = rooms.slice(0, 3);
  const previewGallery = gallery.slice(0, 6);
  const galleryFallback = [
    { id: "fallback-1", image_url: siteMedia.home_hero?.image_url ?? "/723811999.jpg", caption_en: "Villa exterior", caption_el: "Εξωτερικός χώρος" },
    { id: "fallback-2", image_url: siteMedia.home_hero_detail?.image_url ?? "/902234060.jpg", caption_en: "Living space", caption_el: "Χώρος φιλοξενίας" },
    { id: "fallback-3", image_url: siteMedia.home_intro_main?.image_url ?? "/723812114.jpg", caption_en: "Interiors", caption_el: "Εσωτερικοί χώροι" },
    { id: "fallback-4", image_url: siteMedia.home_moment_terrace?.image_url ?? "/769092652.jpg", caption_en: "Outdoor terrace", caption_el: "Βεράντα" },
    { id: "fallback-5", image_url: siteMedia.home_moment_bedroom?.image_url ?? "/723812029.jpg", caption_en: "Bedroom details", caption_el: "Λεπτομέρειες υπνοδωματίου" },
    { id: "fallback-6", image_url: siteMedia.home_moment_coast?.image_url ?? "/902233984.jpg", caption_en: "Coastal view", caption_el: "Θέα στην ακτή" },
  ];
  const galleryItems = previewGallery.length > 0 ? previewGallery : galleryFallback;

  return (
    <div className="premium-home overflow-clip">
      <section className="premium-hero relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden text-cream">
        <Image
          src={siteMedia.home_hero?.image_url ?? "/723811999.jpg"}
          alt={(greek ? siteMedia.home_hero?.alt_text_el : siteMedia.home_hero?.alt_text_en) || (greek ? "Εξωτερική όψη της βίλας" : "Villa exterior at the coast")}
          fill
          priority
          sizes="100vw"
          className="hero-backdrop image-parallax"
          data-parallax="42"
        />
        <div className="hero-shade" />
        <div className="hero-orb hero-orb-one scroll-float" aria-hidden="true" />
        <div className="hero-orb hero-orb-two scroll-float slow-float" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-32 pt-24 sm:px-8 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.06fr_.94fr] lg:gap-6 lg:px-12">
          <div className="hero-copy max-w-2xl">
            <p className="premium-kicker reveal-from-bottom">
              <span className="kicker-line" />{copy.heroKicker}
            </p>
            <h1 className="premium-title reveal-from-left">
              {dict.hero.title}
              <span className="title-underline" aria-hidden="true" />
            </h1>
            <p className="hero-subtitle reveal-from-left">
              {dict.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 reveal-from-bottom">
              <Link href={`/${locale}/booking`} className="button-light">
                {dict.hero.ctaBook}<span aria-hidden="true">↗</span>
              </Link>
              <Link href={`/${locale}/rooms`} className="button-ghost">
                {dict.hero.ctaRooms}
              </Link>
            </div>
            <p className="hero-note reveal-from-bottom">{copy.heroNote}</p>
          </div>

          <div className="hero-art reveal-from-right">
            <div className="hero-ring hero-ring-one" aria-hidden="true" />
            <div className="hero-ring hero-ring-two" aria-hidden="true" />
            <div className="hero-photo-frame" data-scroll-scrub="hero-frame">
              <Image src={siteMedia.home_hero_detail?.image_url ?? "/902234060.jpg"} alt={(greek ? siteMedia.home_hero_detail?.alt_text_el : siteMedia.home_hero_detail?.alt_text_en) || (greek ? "Λεπτομέρεια από τους χώρους φιλοξενίας" : "A detail of the guest interiors")} fill priority sizes="(max-width: 1024px) 88vw, 42vw" className="object-cover" />
              <div className="hero-photo-overlay" />
              <div className="hero-photo-caption">
                <span className="photo-caption-mark">✳</span>
                <span>{greek ? "Μια πιο προσωπική απόδραση" : "A more personal escape"}</span>
              </div>
            </div>
            <div className="hero-floating-card scroll-float">
              <span className="floating-card-kicker">{greek ? "Οι χώροι μας" : "Our spaces"}</span>
              <strong>20—60 <small>m²</small></strong>
              <span className="floating-card-bottom">{greek ? "Σχεδιασμένοι για να νιώθετε άνετα" : "Space to settle in and feel at ease"}</span>
            </div>
            <div className="hero-side-note">{greek ? "ΑΥΛΩΝΑ · ΑΛΒΑΝΙΑ" : "VLORE · ALBANIA"}</div>
          </div>
        </div>

        <div className="hero-scroll-cue" aria-hidden="true">
          <span className="scroll-cue-line" />
          <span>{copy.scroll}</span>
        </div>
        <WaveTransition tone="cream" />
      </section>

      <section className="intro-section relative bg-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:gap-24 lg:px-12">
          <div className="intro-visual reveal-from-left">
            <div className="intro-image-main" data-scroll-scrub="story-image">
              <Image src={siteMedia.home_intro_main?.image_url ?? "/723812114.jpg"} alt={(greek ? siteMedia.home_intro_main?.alt_text_el : siteMedia.home_intro_main?.alt_text_en) || (greek ? "Άνετος εσωτερικός χώρος" : "A relaxed guest interior")} fill sizes="(max-width: 1024px) 90vw, 44vw" className="object-cover" />
            </div>
            <div className="intro-image-small image-parallax" data-parallax="18">
              <Image src={siteMedia.home_intro_kitchen?.image_url ?? "/723812074.jpg"} alt={(greek ? siteMedia.home_intro_kitchen?.alt_text_el : siteMedia.home_intro_kitchen?.alt_text_en) || (greek ? "Λεπτομέρεια κουζίνας" : "Kitchen detail")} fill sizes="(max-width: 1024px) 42vw, 20vw" className="object-cover" />
            </div>
            <div className="intro-stamp scroll-float"><span>J&M</span><span>{greek ? "ΜΕ ΦΡΟΝΤΙΔΑ" : "MADE WITH CARE"}</span></div>
          </div>
          <div className="intro-copy">
            <p className="section-label reveal-from-bottom">{copy.introKicker}</p>
            <h2 className="premium-section-title reveal-from-left">{copy.introTitle}</h2>
            <p className="premium-body reveal-from-left">{copy.introBody}</p>
            <Link href={`/${locale}/rooms`} className="text-link reveal-from-bottom">{copy.introLink}<span aria-hidden="true"> ↗</span></Link>
            <div className="intro-meta reveal-from-bottom">
              <span className="meta-number">01</span>
              <span>{greek ? "Προσωπική φιλοξενία, ήρεμη ατμόσφαιρα" : "Personal hospitality, unhurried atmosphere"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="moments-section relative overflow-hidden bg-sand">
        <WaveTransition tone="sand" />
        <div className="energy-trail" data-scroll-scrub="energy-trail" aria-hidden="true">
            <svg viewBox="0 0 180 760" preserveAspectRatio="none">
              <path className="energy-trail-glow" d="M145 0 C20 110 175 190 74 294 S20 482 118 548 S165 680 42 760" />
              <path className="energy-trail-line" d="M145 0 C20 110 175 190 74 294 S20 482 118 548 S165 680 42 760" />
            </svg>
          </div>
          <div className="mx-auto max-w-7xl px-5 pb-24 pt-20 sm:px-8 sm:pb-32 lg:px-12">
          <div className="section-heading-row">
            <div className="max-w-3xl">
              <p className="section-label reveal-from-bottom">{copy.momentsKicker}</p>
              <h2 className="premium-section-title reveal-from-left">{copy.momentsTitle}</h2>
            </div>
            <p className="premium-body section-heading-aside reveal-from-right">{copy.momentsBody}</p>
          </div>
          <div className="moments-grid stagger-reveal">
            <article className="moment-card moment-card-large">
              <div className="moment-image"><Image src={siteMedia.home_moment_terrace?.image_url ?? "/769092652.jpg"} alt={(greek ? siteMedia.home_moment_terrace?.alt_text_el : siteMedia.home_moment_terrace?.alt_text_en) || (greek ? "Εξωτερική βεράντα" : "Outdoor terrace")} fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover image-parallax" data-parallax="22" /></div>
              <div className="moment-card-copy"><span>01 / {greek ? "ΑΝΑΠΝΟΗ" : "BREATHE"}</span><h3>{greek ? "Αργά πρωινά, καθαρός αέρας." : "Slow mornings, open air."}</h3></div>
            </article>
            <article className="moment-card moment-card-offset">
              <div className="moment-image"><Image src={siteMedia.home_moment_bedroom?.image_url ?? "/723812029.jpg"} alt={(greek ? siteMedia.home_moment_bedroom?.alt_text_el : siteMedia.home_moment_bedroom?.alt_text_en) || (greek ? "Άνετο υπνοδωμάτιο" : "Comfortable bedroom")} fill sizes="(max-width: 768px) 100vw, 35vw" className="object-cover image-parallax" data-parallax="18" /></div>
              <div className="moment-card-copy"><span>02 / {greek ? "ΞΕΚΟΥΡΑΣΗ" : "REST"}</span><h3>{greek ? "Ο δικός σας χώρος, ο δικός σας ρυθμός." : "Your own space, your own rhythm."}</h3></div>
            </article>
            <article className="moment-card moment-card-wide">
              <div className="moment-image"><Image src={siteMedia.home_moment_coast?.image_url ?? "/902233984.jpg"} alt={(greek ? siteMedia.home_moment_coast?.alt_text_el : siteMedia.home_moment_coast?.alt_text_en) || (greek ? "Θέα προς την ακτή" : "View towards the coast")} fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover image-parallax" data-parallax="20" /></div>
              <div className="moment-card-copy"><span>03 / {greek ? "ΑΝΑΚΑΛΥΨΗ" : "DISCOVER"}</span><h3>{greek ? "Αναμνήσεις που συνεχίζονται μετά το ταξίδι." : "Memories that stay long after the journey."}</h3></div>
            </article>
          </div>
        </div>
      </section>

      <section className="rooms-section relative overflow-hidden bg-olive text-cream">
        <div className="rooms-glow rooms-glow-one" aria-hidden="true" />
        <div className="rooms-glow rooms-glow-two" aria-hidden="true" />
        <WaveTransition tone="olive" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 lg:px-12">
          <div className="section-heading-row rooms-heading">
            <div className="max-w-3xl">
              <p className="section-label text-gold-soft reveal-from-bottom">{copy.roomsKicker}</p>
              <h2 className="premium-section-title text-cream reveal-from-left">{dict.home.roomsTitle}</h2>
              <p className="premium-body text-cream/75 reveal-from-left">{dict.home.roomsText}</p>
            </div>
            <Link href={`/${locale}/rooms`} className="button-outline reveal-from-right">{dict.home.viewAll}<span aria-hidden="true"> ↗</span></Link>
          </div>
          {previewRooms.length > 0 ? (
            <div className="rooms-premium-grid stagger-reveal">
              {previewRooms.map((room, index) => (
                <div key={room.id} className={"room-card-premium room-delay-" + index}>
                  <RoomCard room={room} locale={locale as Locale} dict={dict} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-2xl border border-white/20 bg-white/5 p-8 text-center text-cream/75">{dict.rooms.empty}</p>
          )}
          <div className="rooms-footnote reveal-from-bottom"><span>✳</span>{greek ? "Τρεις διαφορετικοί τρόποι να νιώσετε σαν στο σπίτι σας." : "Three thoughtful ways to feel at home."}</div>
        </div>
        <WaveTransition tone="cream" />
      </section>

      <section className="gallery-section bg-cream">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
          <div className="gallery-heading">
            <div>
              <p className="section-label reveal-from-bottom">{copy.galleryKicker}</p>
              <h2 className="premium-section-title reveal-from-left">{copy.galleryTitle}</h2>
            </div>
            <p className="premium-body reveal-from-right">{copy.galleryBody}</p>
          </div>
          <div className="gallery-mosaic stagger-reveal">
            {galleryItems.slice(0, 6).map((image, index) => (
              <figure key={image.id} className={"gallery-tile gallery-tile-" + (index + 1)}>
                <div className="gallery-tile-image">
                  <Image src={image.image_url} alt={(greek ? image.caption_el : image.caption_en) ?? SITE_CONFIG.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover image-parallax" data-parallax={index % 2 === 0 ? "18" : "26"} />
                </div>
                <figcaption><span>0{index + 1}</span>{(greek ? image.caption_el : image.caption_en) ?? (greek ? "Στιγμές φιλοξενίας" : "Moments of hospitality")}</figcaption>
              </figure>
            ))}
          </div>
          <div className="gallery-link-row reveal-from-bottom">
            <span>{greek ? "Μικρές λεπτομέρειες. Μεγάλη διαφορά." : "Small details. A meaningful difference."}</span>
            <Link href={`/${locale}/gallery`} className="text-link">{dict.nav.gallery}<span aria-hidden="true"> ↗</span></Link>
          </div>
        </div>
      </section>

      <section className="quote-section relative isolate overflow-hidden bg-ink text-cream">
        <Image src={siteMedia.home_quote?.image_url ?? "/723815742.jpg"} alt="" fill sizes="100vw" className="quote-backdrop image-parallax" data-parallax="22" aria-hidden="true" />
        <div className="quote-overlay" />
        <div className="quote-decoration quote-decoration-left" aria-hidden="true">“</div>
        <div className="relative z-10 mx-auto max-w-5xl px-5 py-28 text-center sm:px-8 sm:py-36">
          <p className="section-label text-gold-soft reveal-from-bottom">{copy.quoteNote}</p>
          <blockquote className="premium-quote reveal-from-bottom">{copy.quote}</blockquote>
          <div className="quote-signature reveal-from-bottom"><span />{SITE_CONFIG.name}<span /></div>
        </div>
        <WaveTransition tone="cream" />
      </section>

      <section className="final-cta relative overflow-hidden bg-cream">
        <div className="cta-orbit cta-orbit-one" aria-hidden="true" />
        <div className="cta-orbit cta-orbit-two" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-32">
          <p className="section-label reveal-from-bottom">{copy.ctaKicker}</p>
          <h2 className="premium-section-title reveal-from-bottom">{copy.ctaTitle}</h2>
          <p className="premium-body mx-auto max-w-2xl reveal-from-bottom">{dict.home.ctaText}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3 reveal-from-bottom">
            <Link href={`/${locale}/booking`} className="button-dark">{dict.home.ctaBook}<span aria-hidden="true">↗</span></Link>
            <Link href={`/${locale}/contact`} className="button-outline-dark">{dict.nav.contact}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
