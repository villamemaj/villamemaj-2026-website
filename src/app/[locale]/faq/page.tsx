import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import { getPublicHousePolicySettings } from "@/lib/data";
import { faq, policyLinks } from "@/lib/legal-content";
import { isLocale, type Locale } from "@/lib/site";

export const dynamic = "force-dynamic";

const methodLabels: Record<string, Record<Locale, string>> = {
  cash: { en: "cash at the property", el: "μετρητά στο κατάλυμα" },
  online_card: { en: "online card payment through secure Stripe Checkout", el: "ηλεκτρονική πληρωμή με κάρτα μέσω ασφαλούς Stripe Checkout" },
  bank_transfer: { en: "bank transfer when stated in the offer", el: "τραπεζική μεταφορά όταν αναφέρεται στην προσφορά" },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "el";
  return {
    title: lang === "el" ? "Συχνές ερωτήσεις" : "Frequently asked questions",
    description: lang === "el" ? "Απαντήσεις για την κράτηση και τη διαμονή στη Villa Memaj." : "Answers about booking and staying at Villa Memaj.",
  };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const settings = await getPublicHousePolicySettings();
  let questions = [...faq[lang]];

  if (settings) {
    const livePaymentsEnabled = process.env.STRIPE_LIVE_PAYMENTS_ENABLED === "true";
    const paymentMethods = settings.accepted_payment_methods
      .filter((method) => method !== "online_card" || livePaymentsEnabled)
      .map((method) => methodLabels[method]?.[lang])
      .filter(Boolean);
    const answers = lang === "el"
      ? [
          `Check-in: ${settings.check_in_time}. Check-out: ${settings.check_out_time}. Ακολουθήστε πάντα την ατομική επιβεβαίωση.`,
          `${settings.children_policy || (settings.children_allowed ? "Επιτρέπονται παιδιά κάθε ηλικίας." : "Τα παιδιά δεν επιτρέπονται.")} ${settings.cots_available ? "Κούνιες μπορεί να διατεθούν κατόπιν επιβεβαίωσης." : "Δεν αναφέρονται διαθέσιμες κούνιες."} ${settings.extra_beds_available ? "Επιπλέον κρεβάτια μπορεί να διατεθούν κατόπιν επιβεβαίωσης." : "Δεν αναφέρονται διαθέσιμα επιπλέον κρεβάτια."}`,
          settings.pets_allowed ? "Τα κατοικίδια επιτρέπονται σύμφωνα με την επιβεβαίωση της κράτησης." : "Τα κατοικίδια δεν επιτρέπονται.",
          settings.smoking_allowed ? "Το κάπνισμα επιτρέπεται σύμφωνα με τους κανόνες του καταλύματος." : "Το κάπνισμα δεν επιτρέπεται.",
          `${settings.parties_allowed ? "Τα πάρτι επιτρέπονται μόνο σύμφωνα με τους όρους κράτησης." : "Τα πάρτι και οι εκδηλώσεις δεν επιτρέπονται."} ${settings.quiet_hours ? `Ώρες κοινής ησυχίας: ${settings.quiet_hours}.` : "Δεν έχουν οριστεί ειδικές ώρες κοινής ησυχίας, αλλά πρέπει να γίνεται σεβαστή η γειτονιά."}`,
          `${settings.internet_information} ${settings.parking_information}`,
          paymentMethods.length ? `Οι μέθοδοι απευθείας πληρωμής που είναι ρυθμισμένες είναι: ${paymentMethods.join(", ")}. Ισχύουν οι όροι της συγκεκριμένης προσφοράς.` : "Δεν έχει ρυθμιστεί διαθέσιμη μέθοδος απευθείας πληρωμής. Επικοινωνήστε μαζί μας πριν από την κράτηση.",
          faq[lang][7].a,
          faq[lang][8].a,
          settings.monthly_stays_allowed
            ? `Διαμονές άνω των 30 διανυκτερεύσεων μπορεί να γίνουν δεκτές έως ${settings.max_stay_nights} διανυκτερεύσεις, ανάλογα με τη διαθεσιμότητα και την επιβεβαιωμένη τιμή.`
            : "Δεν γίνονται δεκτές διαμονές άνω των 30 διανυκτερεύσεων.",
          faq[lang][10].a,
        ]
      : [
          `Check-in: ${settings.check_in_time}. Check-out: ${settings.check_out_time}. Always follow your individual confirmation.`,
          `${settings.children_policy || (settings.children_allowed ? "Children of any age are allowed." : "Children are not allowed.")} ${settings.cots_available ? "Cots may be available by prior confirmation." : "Cots are not listed as available."} ${settings.extra_beds_available ? "Extra beds may be available by prior confirmation." : "Extra beds are not listed as available."}`,
          settings.pets_allowed ? "Pets are allowed subject to your booking confirmation." : "Pets are not allowed.",
          settings.smoking_allowed ? "Smoking is allowed under the property rules." : "Smoking is not allowed.",
          `${settings.parties_allowed ? "Parties are permitted only under the booking terms." : "Parties and events are not allowed."} ${settings.quiet_hours ? `Quiet hours: ${settings.quiet_hours}.` : "No specific quiet hours are published, but guests must respect neighbours."}`,
          `${settings.internet_information} ${settings.parking_information}`,
          paymentMethods.length ? `The direct payment methods currently configured are: ${paymentMethods.join(", ")}. Your specific offer terms apply.` : "No direct payment method is currently configured. Contact the property before booking.",
          faq[lang][7].a,
          faq[lang][8].a,
          settings.monthly_stays_allowed
            ? `Stays over 30 nights may be accepted up to ${settings.max_stay_nights} nights, subject to availability and a confirmed rate.`
            : "Stays over 30 nights are not accepted.",
          faq[lang][10].a,
        ];
    questions = questions.map((item, index) => ({ ...item, a: answers[index] ?? item.a }));
    questions.push({
      q: lang === "el" ? "Πρέπει να δώσω διεύθυνση ή τηλέφωνο;" : "Do I need to provide an address or phone number?",
      a: lang === "el"
        ? `${settings.guest_address_required ? "Απαιτούνται ταχυδρομικά στοιχεία." : "Η ταχυδρομική διεύθυνση δεν απαιτείται στην ηλεκτρονική φόρμα βάσει της τρέχουσας ρύθμισης."} ${settings.guest_phone_required ? "Απαιτείται αριθμός τηλεφώνου." : "Ο αριθμός τηλεφώνου δεν είναι υποχρεωτικός."} Μπορεί να ζητηθούν στοιχεία που απαιτεί ο νόμος.`
        : `${settings.guest_address_required ? "Postal address details are required." : "A postal address is not required in the online form under the current setting."} ${settings.guest_phone_required ? "A phone number is required." : "A phone number is optional."} Information required by law may still be requested.`
    });
    questions.push({
      q: lang === "el" ? "Υπάρχει ελάχιστο όριο ηλικίας;" : "Is there a minimum check-in age?",
      a: settings.minimum_check_in_age === null
        ? (lang === "el" ? "Δεν έχει οριστεί γενικό ελάχιστο όριο ηλικίας από το κατάλυμα. Το άτομο που κάνει την κράτηση πρέπει να μπορεί να συνάψει έγκυρη σύμβαση." : "The property has not set a general minimum age. The booking party must still be legally able to enter into a valid booking contract.")
        : (lang === "el" ? `Το ελάχιστο όριο ηλικίας check-in είναι ${settings.minimum_check_in_age}. Ελέγξτε την ατομική επιβεβαίωση.` : `The minimum check-in age is ${settings.minimum_check_in_age}. Check your individual confirmation.`)
    });
  }

  return (
    <div className="editorial-page faq-page">
      <EditorialPageHero
        locale={lang}
        eyebrow={lang === "el" ? "Πριν και κατά τη διαμονή" : "Before and during your stay"}
        title={lang === "el" ? "Συχνές ερωτήσεις" : "Frequently asked questions"}
        subtitle={lang === "el" ? "Οι βασικές πληροφορίες για τη διαμονή σας, συγκεντρωμένες σε ένα σημείο." : "The essentials for your stay, collected in one place."}
        imageSrc="/902234060.jpg"
      />
      <section className="faq-content">
        <div className="faq-intro reveal-from-left">
          <p className="section-label">{lang === "el" ? "Χρειάζεστε απάντηση;" : "Need an answer?"}</p>
          <h2>{lang === "el" ? "Ας κάνουμε τον προγραμματισμό απλό." : "Let’s make planning simple."}</h2>
          <p>{lang === "el" ? "Ελέγξτε πάντα την ατομική επιβεβαίωση κράτησης για τους όρους της συγκεκριμένης τιμής." : "Always check your individual booking confirmation for the terms of the rate you selected."}</p>
          <Link className="button-dark mt-6" href={`/${lang}/contact`}>{lang === "el" ? "Επικοινωνία" : "Contact us"} <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="faq-list stagger-reveal">
          {questions.map((item, index) => (
            <details key={item.q} className="faq-item" name={`faq-${lang}`}>
              <summary><span className="faq-number">{String(index + 1).padStart(2, "0")}</span><span>{item.q}</span><span className="faq-toggle" aria-hidden="true">+</span></summary>
              <div className="faq-answer"><p>{item.a}</p></div>
            </details>
          ))}
          <div className="faq-legal-links">
            <p className="section-label">{lang === "el" ? "Αναλυτικές πληροφορίες" : "Read the full details"}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {policyLinks[lang].filter((item) => item.href !== "/faq").map((item) => (
                <Link key={item.href} href={`/${lang}${item.href}`} className="text-sm font-semibold text-olive underline underline-offset-4">{item.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
