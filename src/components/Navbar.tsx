"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE_CONFIG, type Locale } from "@/lib/site";
import type { Dictionary } from "@/lib/i18n";

interface NavbarProps {
  locale: Locale;
  dict: Dictionary;
}

export default function Navbar({ locale, dict }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const otherLocale: Locale = locale === "el" ? "en" : "el";
  const segments = pathname.split("/");
  segments[1] = otherLocale;
  const switchHref = segments.join("/") || `/${otherLocale}`;

  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/rooms`, label: dict.nav.rooms },
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/booking`, label: dict.nav.booking },
    { href: `/${locale}/contact`, label: dict.nav.contact },
    { href: `/${locale}/faq`, label: locale === "el" ? "Συχνές ερωτήσεις" : "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-sand-dark/60 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="font-display text-2xl font-semibold tracking-wide text-olive"
        >
          {SITE_CONFIG.name}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-olive"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={switchHref}
            className="rounded-full border border-olive/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-olive transition-colors hover:bg-olive hover:text-cream"
          >
            {otherLocale}
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-0.5 w-6 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-ink transition-opacity ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {open && (
        <nav className="border-t border-sand-dark/60 bg-cream px-4 pb-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-sand-dark/40 py-3 text-sm font-medium text-ink-soft"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={switchHref}
            onClick={() => setOpen(false)}
            className="mt-3 inline-block rounded-full border border-olive/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-olive"
          >
            {otherLocale}
          </Link>
        </nav>
      )}
    </header>
  );
}
