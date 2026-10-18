"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface HeroCarouselProps {
  images: string[];
  intervalMs?: number;
}

/**
 * Auto-advancing background slideshow for the landing hero.
 *
 * Only three images are ever mounted: the visible one, a preloaded "next" one, and the
 * outgoing one which fades out on top of the new image. That keeps the payload small while
 * still giving a real crossfade, since the outgoing layer animates out (a CSS animation on
 * mount) rather than the incoming layer animating in.
 */
export default function HeroCarousel({ images, intervalMs = 6500 }: HeroCarouselProps) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (count < 2) return;
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      const next = (indexRef.current + 1) % count;
      setPrevious(indexRef.current);
      indexRef.current = next;
      setIndex(next);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [count, paused, intervalMs]);

  // Drop the outgoing layer once its fade has finished.
  useEffect(() => {
    if (previous === null) return;
    const id = window.setTimeout(() => setPrevious(null), 1500);
    return () => window.clearTimeout(id);
  }, [previous]);

  if (count === 0) return null;

  const next = count > 1 ? (index + 1) % count : -1;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Visible frame */}
      <Image
        key={`base-${index}`}
        src={images[index]}
        alt=""
        fill
        priority={index === 0}
        sizes="100vw"
        quality={70}
        className="object-cover"
      />

      {/* Warm the next frame so the changeover is instant */}
      {next >= 0 && next !== index && (
        <Image
          key={`next-${next}`}
          src={images[next]}
          alt=""
          fill
          sizes="100vw"
          quality={70}
          className="object-cover opacity-0"
        />
      )}

      {/* Outgoing frame crossfades away on top of the new one */}
      {previous !== null && previous !== index && (
        <Image
          key={`out-${previous}`}
          src={images[previous]}
          alt=""
          fill
          sizes="100vw"
          quality={70}
          className="hero-fade-out object-cover"
        />
      )}
    </div>
  );
}
