import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PolicyDocumentPage from "@/components/PolicyDocumentPage";
import { getPublicHousePolicySettings } from "@/lib/data";
import { getPolicyDocument } from "@/lib/legal-content";
import { isLocale, type Locale } from "@/lib/site";

export const dynamic = "force-dynamic";

const methodLabels: Record<string, Partial<Record<Locale, string>>> = {
  cash: { en: "Cash at the property", el: "Μετρητά στο κατάλυμα" },
  online_card: { en: "Online card payment through secure Stripe Checkout", el: "Ηλεκτρονική πληρωμή με κάρτα μέσω ασφαλούς Stripe Checkout" },
  bank_transfer: { en: "Bank transfer, when stated in the offer", el: "Τραπεζική μεταφορά, όταν αναφέρεται στην προσφορά" },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "el";
  const document = getPolicyDocument("payments", lang);
  return { title: document?.title, description: document?.subtitle };
}

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const document = getPolicyDocument("payments", lang);
  if (!document) notFound();

  const settings = await getPublicHousePolicySettings();
  const livePaymentsEnabled = process.env.STRIPE_LIVE_PAYMENTS_ENABLED === "true";
  const configured = settings?.accepted_payment_methods ?? ["cash"];
  const available = configured.filter((method) => method !== "online_card" || livePaymentsEnabled);
  const accepted = available.map((method) => methodLabels[method]?.[lang]).filter(Boolean);
  const paragraphs = [
    lang === "el"
      ? accepted.length ? `Οι μέθοδοι απευθείας πληρωμής που έχουν ρυθμιστεί είναι: ${accepted.join(", ")}.` : "Δεν έχει ρυθμιστεί ενεργή μέθοδος απευθείας πληρωμής. Επικοινωνήστε μαζί μας πριν από την κράτηση."
      : accepted.length ? `The direct payment methods currently configured are: ${accepted.join(", ")}.` : "No direct payment method is currently configured. Contact the property before booking.",
    lang === "el"
      ? "Ο τρόπος πληρωμής, το ποσό, το νόμισμα και η προθεσμία που αναφέρονται στην ατομική προσφορά και επιβεβαίωση ισχύουν για τη συγκεκριμένη κράτηση."
      : "The method, amount, currency and deadline stated in your individual offer and confirmation apply to that reservation.",
    lang === "el"
      ? "Οι κάρτες που αποδέχεται μια πλατφόρμα τρίτου μέρους δεν σημαίνει αυτομάτως ότι γίνονται δεκτές για απευθείας κρατήσεις."
      : "Card brands accepted by a third-party booking platform are not automatically accepted for direct bookings.",
  ];
  const displayed = {
    ...document,
    sections: document.sections.map((section, index) => index === 0 ? { ...section, paragraphs } : section),
  };

  return <PolicyDocumentPage locale={lang} document={displayed} />;
}
