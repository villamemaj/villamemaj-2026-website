import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollEnhancer from "@/components/ScrollEnhancer";
import GuestSupportChat from "@/components/GuestSupportChat";
import CookieConsent from "@/components/CookieConsent";
import { getDictionary } from "@/lib/i18n";
import { isLocale, LOCALES, SITE_CONFIG, type Locale } from "@/lib/site";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "el";
  return {
    title: {
      default: SITE_CONFIG.name,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: SITE_CONFIG.tagline[safeLocale],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <div lang={locale} className="flex min-h-full flex-1 flex-col">
      <ScrollEnhancer />
      <Navbar locale={locale as Locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale as Locale} dict={dict} />
      <GuestSupportChat locale={locale as Locale} />
      <CookieConsent locale={locale as Locale} />
    </div>
  );
}
