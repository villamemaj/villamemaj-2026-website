import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import FlightFinder from "@/components/FlightFinder";
import { isLocale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : "en";
  const titles: Record<string, string> = { en: "Find flights", el: "Βρείτε πτήσεις", fr: "Trouver des vols", sq: "Gjeni fluturime", de: "Flüge finden", it: "Trova voli" };
  return { title: titles[lang], description: "Search flight options for your trip to Albania with Skyscanner." };
}

export default async function FlightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const title: Record<string, string> = { en: "Find your flight.", el: "Βρείτε την πτήση σας.", fr: "Trouvez votre vol.", sq: "Gjeni fluturimin tuaj.", de: "Finden Sie Ihren Flug.", it: "Trova il tuo volo." };
  const subtitle: Record<string, string> = {
    en: "Plan your journey to Albania. Compare flight options through Skyscanner, then return to Villa Memaj to plan your stay.",
    el: "Οργανώστε το ταξίδι σας στην Αλβανία. Συγκρίνετε πτήσεις μέσω Skyscanner και επιστρέψτε στη Villa Memaj για τη διαμονή σας.",
    fr: "Préparez votre voyage en Albanie. Comparez les vols sur Skyscanner, puis revenez à Villa Memaj pour organiser votre séjour.",
    sq: "Planifikoni udhëtimin drejt Shqipërisë. Krahasoni fluturimet në Skyscanner dhe më pas kthehuni te Villa Memaj për qëndrimin tuaj.",
    de: "Planen Sie Ihre Reise nach Albanien. Vergleichen Sie Flüge über Skyscanner und planen Sie anschließend Ihren Aufenthalt bei Villa Memaj.",
    it: "Organizza il tuo viaggio in Albania. Confronta i voli su Skyscanner e torna a Villa Memaj per pianificare il soggiorno."
  };
  const caption: Record<string, string> = {
    en: "Flights are searched and booked with Skyscanner and its travel providers. Villa Memaj does not sell airline tickets or control fares, baggage terms or flight changes.",
    el: "Η αναζήτηση και κράτηση πτήσεων γίνεται μέσω Skyscanner και των ταξιδιωτικών παρόχων του. Η Villa Memaj δεν πωλεί αεροπορικά εισιτήρια και δεν ελέγχει ναύλους ή αλλαγές.",
    fr: "La recherche et la réservation des vols se font avec Skyscanner et ses prestataires. Villa Memaj ne vend pas de billets d’avion et ne contrôle pas les tarifs ni les modifications.",
    sq: "Kërkimi dhe rezervimi i fluturimeve kryhet përmes Skyscanner dhe ofruesve të tij. Villa Memaj nuk shet bileta avioni dhe nuk kontrollon tarifat apo ndryshimet.",
    de: "Flugsuche und Buchung erfolgen über Skyscanner und dessen Anbieter. Villa Memaj verkauft keine Flugtickets und kontrolliert weder Preise noch Gepäckbedingungen oder Änderungen.",
    it: "La ricerca e la prenotazione dei voli avvengono tramite Skyscanner e i suoi fornitori. Villa Memaj non vende biglietti aerei né controlla tariffe o modifiche."
  };
  return (
    <div className="editorial-page flights-page">
      <EditorialPageHero locale={locale} eyebrow="Plan your journey" title={title[locale]} subtitle={subtitle[locale]} imageSrc="/723812114.jpg" />
      <section className="editorial-standard-content">
        <div className="flight-finder-layout">
          <div className="flight-finder-intro reveal-from-left">
            <p className="section-label">{locale === "el" ? "Πριν από τη διαμονή σας" : locale === "fr" ? "Avant votre séjour" : locale === "sq" ? "Para qëndrimit" : locale === "de" ? "Vor Ihrem Aufenthalt" : locale === "it" ? "Prima del soggiorno" : "Before your stay"}</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-olive-dark sm:text-5xl">
              {locale === "el" ? "Το ταξίδι ξεκινά από εδώ." : locale === "fr" ? "Le voyage commence ici." : locale === "sq" ? "Udhëtimi fillon këtu." : locale === "de" ? "Die Reise beginnt hier." : locale === "it" ? "Il viaggio inizia qui." : "Your journey starts here."}
            </h2>
            <p className="mt-5 leading-8 text-ink-soft">{caption[locale]}</p>
            <Link href={"/" + locale + "/booking"} className="button-dark mt-7">{locale === "el" ? "Δείτε τη διαμονή" : locale === "fr" ? "Voir les hébergements" : locale === "sq" ? "Shikoni akomodimin" : locale === "de" ? "Unterkunft ansehen" : locale === "it" ? "Scopri l’alloggio" : "Explore accommodation"} <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="flight-finder-card reveal-from-right">
            <p className="section-label">{locale === "el" ? "Αναζήτηση πτήσεων" : locale === "fr" ? "Recherche de vols" : locale === "sq" ? "Kërko fluturime" : locale === "de" ? "Flugsuche" : locale === "it" ? "Ricerca voli" : "Flight search"}</p>
            <h2>{locale === "el" ? "Πού ξεκινά το ταξίδι σας;" : locale === "fr" ? "D’où commence votre voyage ?" : locale === "sq" ? "Nga fillon udhëtimi juaj?" : locale === "de" ? "Wo beginnt Ihre Reise?" : locale === "it" ? "Da dove inizia il viaggio?" : "Where does your journey begin?"}</h2>
            <FlightFinder locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}
