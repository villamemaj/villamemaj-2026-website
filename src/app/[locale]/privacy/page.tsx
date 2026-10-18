import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PolicyDocumentPage from "@/components/PolicyDocumentPage";
import { getPublicHousePolicySettings } from "@/lib/data";
import { getPolicyDocument } from "@/lib/legal-content";
import { isLocale, type Locale } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "el";
  const document = getPolicyDocument("privacy", lang);
  return { title: document?.title, description: document?.subtitle, robots: { index: true, follow: true } };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const document = getPolicyDocument("privacy", lang);
  if (!document) notFound();
  const settings = await getPublicHousePolicySettings();
  const addition = lang === "el" ? settings?.privacy_el : settings?.privacy_en;
  const displayed = addition?.trim()
    ? { ...document, sections: [...document.sections, {
        heading: lang === "el" ? "Πρόσθετες πληροφορίες απορρήτου" : "Additional privacy information",
        paragraphs: [addition.trim()],
      }] }
    : document;
  return <PolicyDocumentPage locale={lang} document={displayed} />;
}
