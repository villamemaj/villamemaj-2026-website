"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SITE_CONFIG, type Locale } from "@/lib/site";
import type { Dictionary } from "@/lib/i18n";

interface NavbarProps {
  locale: Locale;
  dict: Dictionary;
}

const supportedLocales: { code: Locale; label: string }[] = [
  { code: "el", label: "Ελληνικά" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "sq", label: "Shqip" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
];

function LanguagePicker({
  locale,
  localeHref,
  label,
  compact = false,
  onNavigate,
}: {
  locale: Locale;
  localeHref: (code: Locale) => string;
  label: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <details className={compact ? "site-language-picker site-language-picker-mobile" : "site-language-picker"}>
      <summary aria-label={label}>
        <span>{locale.toUpperCase()}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </summary>
      <div className="site-language-options">
        {supportedLocales.map((item) => (
          <Link
            key={item.code}
            href={localeHref(item.code)}
            hrefLang={item.code}
            aria-current={locale === item.code ? "page" : undefined}
            onClick={onNavigate}
          >
            <span>{item.label}</span>
            <span aria-hidden="true">{locale === item.code ? "✓" : item.code.toUpperCase()}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}



export default function Navbar({ locale, dict }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const homePath = "/" + locale;
  const localeHref = (code: Locale) => {
    const segments = pathname.split("/");
    segments[1] = code;
    return segments.join("/") || "/" + code;
  };

  const links = [
    { href: homePath, label: dict.nav.home },
    { href: homePath + "/rooms", label: dict.nav.rooms },
    { href: homePath + "/gallery", label: dict.nav.gallery },
    { href: homePath + "/contact", label: dict.nav.contact },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function active(href: string) {
    return href === homePath ? pathname === href || pathname === href + "/" : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="site-navbar sticky top-0 z-50 border-b border-sand-dark/50 bg-cream/95 backdrop-blur-md">
      <div className="site-navbar-inner mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href={homePath} className="site-brand" aria-label={SITE_CONFIG.name + " — " + dict.nav.home}>
          <svg className="site-brand-mark" aria-hidden="true" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 30C17 22 16 14 11 6" />
            <path d="M16.5 16C8 17 4.8 13.2 4 7.1 10.6 7.2 15.6 9.2 16.5 16Z" />
            <path d="M18 22C20.2 14.7 25.7 11.5 31 12.1 29.8 19.1 25 23 18 22Z" />
            <path d="M17 27C10.5 28.5 6 26.1 4.9 20.7 10.8 20.2 15.2 22.2 17 27Z" />
          </svg>
          <span className="site-brand-copy">
            <strong>{SITE_CONFIG.name}</strong>
            <span>{SITE_CONFIG.tagline[locale]}</span>
          </span>
        </Link>

        <nav className="site-navbar-links hidden items-center md:flex" aria-label={dict.nav.mainNavigation}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active(link.href) ? "page" : undefined}
              className={active(link.href) ? "site-navbar-link active" : "site-navbar-link"}
            >
              {link.label}
            </Link>
          ))}
          <LanguagePicker locale={locale} localeHref={localeHref} label={dict.nav.language} />
          <Link href={homePath + "/booking"} className="site-navbar-booking">
            {dict.hero.ctaBook}<span aria-hidden="true">↗</span>
          </Link>
        </nav>

        <button
          ref={menuButton}
          type="button"
          aria-label={open ? dict.nav.closeMenu : dict.nav.menu}
          aria-expanded={open}
          aria-controls="site-mobile-navigation"
          onClick={() => setOpen((current) => !current)}
          className="site-mobile-menu-button md:hidden"
        >
          <span className={open ? "site-menu-line is-open first" : "site-menu-line first"} />
          <span className={open ? "site-menu-line is-open middle" : "site-menu-line middle"} />
          <span className={open ? "site-menu-line is-open last" : "site-menu-line last"} />
        </button>
      </div>

      <div id="site-mobile-navigation" className={open ? "site-mobile-navigation is-open md:hidden" : "site-mobile-navigation md:hidden"} hidden={!open}>
        <nav aria-label={dict.nav.mainNavigation}>
          {[
            ...links.slice(0, 3),
            { href: homePath + "/booking", label: dict.hero.ctaBook },
            links[3],
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active(link.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={active(link.href) ? "site-mobile-nav-link active" : "site-mobile-nav-link"}
            >
              {link.label}<span aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
        <LanguagePicker locale={locale} localeHref={localeHref} label={dict.nav.language} compact onNavigate={() => setOpen(false)} />
      </div>
    </header>
  );
}
