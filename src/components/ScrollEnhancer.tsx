"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const progress = document.querySelector<HTMLElement>("[data-scroll-progress]");
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".reveal-from-left, .reveal-from-right, .reveal-from-bottom, .reveal-from-top, .scale-reveal, .stagger-reveal"
      )
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enhancedMotion = !reducedMotion &&
      window.matchMedia("(min-width: 768px) and (hover: hover)").matches;
    const parallax = enhancedMotion
      ? Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"))
      : [];
    const scrubLayers = enhancedMotion
      ? Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-scrub]"))
      : [];

    if (reducedMotion) {
      reveals.forEach((element) => element.classList.add("is-visible"));
      if (progress) progress.style.transform = "scaleX(1)";
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -7% 0px" });
    reveals.forEach((element) => observer.observe(element));

    let frame = 0;
    const update = () => {
      frame = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      if (progress) progress.style.transform = "scaleX(" + ratio + ")";

      const viewport = window.innerHeight;
      const visibleParallax = parallax
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.bottom >= -120 && rect.top <= viewport + 120);
      const visibleScrub = scrubLayers
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.bottom >= -80 && rect.top <= viewport + 80);

      visibleParallax.forEach(({ element, rect }) => {
        const distance = Number(element.dataset.parallax || 28);
        const travel = (viewport - rect.top) / (viewport + rect.height);
        element.style.setProperty("--parallax-y", ((0.5 - travel) * distance).toFixed(1) + "px");
      });

      visibleScrub.forEach(({ element, rect }) => {
        const kind = element.dataset.scrollScrub;
        const travel = (viewport - rect.top) / (viewport + rect.height);
        const centered = Math.max(-1, Math.min(1, (travel - 0.5) * 2));
        if (kind === "hero-frame") {
          element.style.transform = "translate3d(0," + (-centered * 13).toFixed(1) + "px,0) rotate(" + (centered * -1.2).toFixed(2) + "deg)";
        } else if (kind === "story-image") {
          element.style.transform = "translate3d(0," + (-centered * 10).toFixed(1) + "px,0) rotate(" + (centered * -0.7).toFixed(2) + "deg)";
        } else if (kind === "energy-trail") {
          element.style.transform = "translate3d(0," + (-centered * 16).toFixed(1) + "px,0) rotate(" + (centered * 4).toFixed(2) + "deg)";
        }
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return <div data-scroll-progress aria-hidden="true" className="scroll-progress" />;
}
