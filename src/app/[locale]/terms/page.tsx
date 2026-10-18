import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PolicyDocumentPage from "@/components/PolicyDocumentPage";
import { getPolicyDocument } from "@/lib/legal-content";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "el";
  const document = getPolicyDocument("terms", lang);
  return { title: document?.title, description: document?.subtitle, robots: { index: true, follow: true } };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const document = getPolicyDocument("terms", locale as Locale);
  if (!document) notFound();
  return <PolicyDocumentPage locale={locale as Locale} document={document} />;
}
