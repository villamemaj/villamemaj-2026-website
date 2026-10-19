"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LOCALE_NATIVE_NAMES, LOCALES, SITE_CONFIG, type Locale } from "@/lib/site";
import type { Dictionary } from "@/lib/i18n";

interface NavbarProps {
  locale: Locale;
  dict: Dictionary;
}

export default function Navbar({ locale, dict }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function localeHref(nextLocale: Locale) {
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }

  function changeLocale(nextLocale: string) {
    if (!LOCALES.includes(nextLocale as Locale)) return;
    setOpen(false);
    router.push(localeHref(nextLocale as Locale));
  }

  const links = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/rooms`, label: dict.nav.rooms },
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/booking`, label: dict.nav.booking },
    { href: `/${locale}/travel`, label: dict.nav.travel },
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
          <label className="sr-only" htmlFor="site-language-desktop">Language</label>
          <select
            id="site-language-desktop"
            value={locale}
            onChange={(event) => changeLocale(event.target.value)}
            aria-label="Choose language"
            className="rounded-full border border-olive/30 bg-cream px-3 py-2 text-xs font-semibold text-olive outline-none focus:ring-2 focus:ring-olive/25"
          >
            {LOCALES.map((code) => <option key={code} value={code}>{LOCALE_NATIVE_NAMES[code]}</option>)}
          </select>
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
          <label htmlFor="site-language-mobile" className="mt-3 block text-xs font-semibold text-olive">Language / Idioma</label>
          <select
            id="site-language-mobile"
            value={locale}
            onChange={(event) => changeLocale(event.target.value)}
            aria-label="Choose language"
            className="mt-2 w-full rounded-xl border border-olive/30 bg-white px-3 py-2 text-sm text-olive"
          >
            {LOCALES.map((code) => <option key={code} value={code}>{LOCALE_NATIVE_NAMES[code]}</option>)}
          </select>
        </nav>
      )}
    </header>
  );
}
