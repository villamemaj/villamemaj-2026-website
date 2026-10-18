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
  const document = getPolicyDocument("houseRules", lang);
  return { title: document?.title, description: document?.subtitle };
}

export default async function HouseRulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = locale as Locale;
  const document = getPolicyDocument("houseRules", lang);
  if (!document) notFound();

  const settings = await getPublicHousePolicySettings();
  const displayed = settings ? {
    ...document,
    sections: [
      {
        heading: lang === "el" ? "Άφιξη και αναχώρηση" : "Check-in and check-out",
        paragraphs: lang === "el"
          ? [`Check-in: ${settings.check_in_time}. Check-out: ${settings.check_out_time}. Η επιβεβαίωση κράτησης μπορεί να αναφέρει ειδική συμφωνία. Ενημερώστε μας εκ των προτέρων για διαφορετική ώρα άφιξης.`]
          : [`Check-in: ${settings.check_in_time}. Check-out: ${settings.check_out_time}. Your booking confirmation may state a specific arrangement. Please tell us in advance if you expect to arrive outside these times.`],
      },
      {
        heading: lang === "el" ? "Παιδιά, κούνιες και επιπλέον κρεβάτια" : "Children, cots and extra beds",
        paragraphs: [
          settings.children_policy || (lang === "el"
            ? settings.children_allowed ? "Επιτρέπονται παιδιά κάθε ηλικίας." : "Τα παιδιά δεν επιτρέπονται."
            : settings.children_allowed ? "Children of any age are allowed." : "Children are not allowed."),
        ],
        bullets: lang === "el"
          ? [
              settings.child_rates_configured ? "Υπάρχουν ρυθμισμένες παιδικές τιμές." : "Δεν έχουν οριστεί ειδικές παιδικές τιμές.",
              settings.cots_available ? "Διατίθενται κούνιες κατόπιν επιβεβαίωσης." : "Δεν αναφέρονται διαθέσιμες κούνιες.",
              settings.extra_beds_available ? "Επιπλέον κρεβάτια διατίθενται κατόπιν επιβεβαίωσης." : "Δεν αναφέρονται διαθέσιμα επιπλέον κρεβάτια."
            ]
          : [
              settings.child_rates_configured ? "Child-specific rates are configured." : "No child-specific rates are currently configured.",
              settings.cots_available ? "Cots may be available by prior confirmation." : "Cots are not listed as available.",
              settings.extra_beds_available ? "Extra beds may be available by prior confirmation." : "Extra beds are not listed as available."
            ],
      },
      {
        heading: lang === "el" ? "Κανόνες καταλύματος" : "House rules",
        paragraphs: [
          lang === "el" ? (settings.house_rules_el || "Οι ακόλουθοι κανόνες ισχύουν για το κατάλυμα.") : (settings.house_rules_en || "The following rules apply at the property."),
        ],
        bullets: lang === "el"
          ? [
              settings.smoking_allowed ? "Το κάπνισμα επιτρέπεται." : "Το κάπνισμα δεν επιτρέπεται.",
              settings.pets_allowed ? "Τα κατοικίδια επιτρέπονται." : "Τα κατοικίδια δεν επιτρέπονται.",
              settings.parties_allowed ? "Τα πάρτι και οι εκδηλώσεις επιτρέπονται μόνο σύμφωνα με τους όρους κράτησης." : "Τα πάρτι και οι εκδηλώσεις δεν επιτρέπονται.",
              settings.quiet_hours ? `Ώρες κοινής ησυχίας: ${settings.quiet_hours}.` : "Δεν έχουν οριστεί ειδικές ώρες κοινής ησυχίας· απαιτείται σεβασμός στους γείτονες και στην τοπική νομοθεσία.",
              settings.curfew ? `Ώρα περιορισμού: ${settings.curfew}.` : "Δεν έχει οριστεί ώρα απαγόρευσης κυκλοφορίας."
            ]
          : [
              settings.smoking_allowed ? "Smoking is allowed." : "Smoking is not allowed.",
              settings.pets_allowed ? "Pets are allowed subject to the booking terms." : "Pets are not allowed.",
              settings.parties_allowed ? "Parties and events are permitted only under the booking terms." : "Parties and events are not allowed.",
              settings.quiet_hours ? `Quiet hours: ${settings.quiet_hours}.` : "No specific quiet hours are published; guests must still respect neighbours and local law.",
              settings.curfew ? `Curfew: ${settings.curfew}.` : "No curfew is currently set."
            ],
      },
      {
        heading: lang === "el" ? "Internet, στάθμευση και πρόσθετες χρεώσεις" : "Internet, parking and additional charges",
        paragraphs: [
          settings.internet_information || (lang === "el" ? "Επικοινωνήστε μαζί μας για τις τρέχουσες πληροφορίες Internet." : "Contact us for current internet information."),
          settings.parking_information || (lang === "el" ? "Επικοινωνήστε μαζί μας για τις τρέχουσες πληροφορίες στάθμευσης." : "Contact us for current parking information."),
          settings.additional_fees_note || (lang === "el" ? "Δεν έχουν δημοσιευθεί πρόσθετες χρεώσεις πέρα από όσες εμφανίζονται στην προσφορά κράτησης." : "No additional charges are published beyond those shown in your booking offer."),
          settings.damage_policy || (lang === "el" ? "Δεν αναφέρεται ξεχωριστή πολιτική εγγύησης ζημιών. Τυχόν χρεώσεις πρέπει να είναι τεκμηριωμένες και νόμιμες." : "No separate damage-deposit policy is listed. Any charge must be documented and lawful."),
        ],
      },
      {
        heading: lang === "el" ? "Στοιχεία επισκεπτών" : "Guest information",
        paragraphs: lang === "el"
          ? [
              settings.guest_phone_required ? "Απαιτείται αριθμός τηλεφώνου για τον συντονισμό της κράτησης." : "Ο αριθμός τηλεφώνου δεν είναι υποχρεωτικός για την κράτηση.",
              settings.guest_address_required ? "Απαιτούνται ταχυδρομικά στοιχεία σύμφωνα με τη διαδικασία κράτησης." : "Δεν απαιτούνται ταχυδρομικά στοιχεία στη φόρμα κράτησης, εκτός εάν τα επιβάλλει ο νόμος ή ειδική ανάγκη.",
              settings.minimum_check_in_age !== null ? `Ελάχιστη ηλικία check-in: ${settings.minimum_check_in_age}.` : "Δεν έχει οριστεί γενικό ελάχιστο όριο ηλικίας από το κατάλυμα."
            ]
          : [
              settings.guest_phone_required ? "A guest phone number is required to coordinate the reservation." : "A phone number is not required for the reservation.",
              settings.guest_address_required ? "Postal address details are required in the booking process." : "Postal address details are not required in the booking form unless required by law or a specific need.",
              settings.minimum_check_in_age !== null ? `Minimum check-in age: ${settings.minimum_check_in_age}.` : "The property has not set a general minimum check-in age."
            ],
      },
      {
        heading: lang === "el" ? "Μακρά διαμονή" : "Long stays",
        paragraphs: lang === "el"
          ? [settings.monthly_stays_allowed ? "Μπορούν να γίνουν δεκτές διαμονές άνω των 30 διανυκτερεύσεων, έως το μέγιστο όριο που αναφέρεται παρακάτω, με επιβεβαίωση διαθεσιμότητας και τιμής." : "Δεν γίνονται δεκτές διαμονές άνω των 30 διανυκτερεύσεων.", `Μέγιστη διάρκεια που έχει ρυθμιστεί: ${settings.max_stay_nights} διανυκτερεύσεις.`]
          : [settings.monthly_stays_allowed ? "Stays longer than 30 nights may be accepted, up to the maximum configured below, subject to availability and a confirmed rate." : "Stays longer than 30 nights are not accepted.", `Configured maximum stay: ${settings.max_stay_nights} nights.`],
      },
    ],
  } : document;

  return <PolicyDocumentPage locale={lang} document={displayed} />;
}
