"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HotelGalleryImage } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/site";

type GalleryCopy = Dictionary["gallery"];

function description(image: HotelGalleryImage, locale: Locale, siteName: string, index: number): string {
  const localized = locale === "el" ? image.alt_text_el || image.caption_el : image.alt_text_en || image.caption_en;
  return localized || siteName + " " + (index + 1);
}

export default function PublicGalleryGrid({
  images,
  locale,
  siteName,
  copy,
}: {
  images: HotelGalleryImage[];
  locale: Locale;
  siteName: string;
  copy: GalleryCopy;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const isOpen = selectedIndex !== null;
  const selected = selectedIndex === null ? null : images[selectedIndex];

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedIndex(null);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedIndex((current) => current === null ? null : (current + 1) % images.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedIndex((current) => current === null ? null : (current - 1 + images.length) % images.length);
      } else if (event.key === "Tab" && dialog.current) {
        const controls = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        if (controls.length === 0) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, images.length]);

  return (
    <>
      <div id="gallery-grid" className="gallery-mosaic editorial-gallery-grid stagger-reveal">
        {images.map((image, index) => {
          const alt = description(image, locale, siteName, index);
          return (
            <figure key={image.id} className={"editorial-gallery-tile editorial-gallery-tile-" + ((index % 6) + 1) + " relative overflow-hidden rounded-[18px] bg-sand"}>
              <button
                type="button"
                className="public-gallery-trigger"
                onClick={() => setSelectedIndex(index)}
                aria-label={copy.openImage + " " + (index + 1) + ": " + alt}
              >
                <Image
                  src={image.image_url}
                  alt={alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700"
                />
                <span className="public-gallery-open-hint" aria-hidden="true">↗</span>
              </button>
              {(image.caption_el || image.caption_en) ? (
                <figcaption className="public-gallery-caption">
                  {locale === "el" ? image.caption_el || image.caption_en : image.caption_en || image.caption_el}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      {isOpen && selected ? (
        <div className="public-gallery-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedIndex(null); }}>
          <div ref={dialog} className="public-gallery-dialog" role="dialog" aria-modal="true" aria-label={siteName + " — " + copy.openImage}>
            <button ref={closeButton} type="button" className="public-gallery-close" onClick={() => setSelectedIndex(null)} aria-label={copy.closeImage}>×</button>
            <button type="button" className="public-gallery-nav public-gallery-prev" onClick={() => setSelectedIndex((selectedIndex! - 1 + images.length) % images.length)} aria-label={copy.previousImage} disabled={images.length < 2}>‹</button>
            <div className="public-gallery-full-image">
              <Image
                src={selected.image_url}
                alt={description(selected, locale, siteName, selectedIndex!)}
                fill
                sizes="(max-width: 768px) 100vw, 90vw"
                className="object-contain"
                priority
              />
            </div>
            <button type="button" className="public-gallery-nav public-gallery-next" onClick={() => setSelectedIndex((selectedIndex! + 1) % images.length)} aria-label={copy.nextImage} disabled={images.length < 2}>›</button>
            <div className="public-gallery-meta">
              <span>{selectedIndex! + 1} / {images.length}</span>
              {(selected.caption_el || selected.caption_en) ? <p>{locale === "el" ? selected.caption_el || selected.caption_en : selected.caption_en || selected.caption_el}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
