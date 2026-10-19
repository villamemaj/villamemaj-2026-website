import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import SkyscannerFlightSearch from "@/components/SkyscannerFlightSearch";
import { getSiteMediaImages } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const copy = {
    el: { title: "Πτήσεις & άφιξη", description: "Σχεδιάστε το ταξίδι σας στη Villa Memaj και αναζητήστε πτήσεις μέσω Skyscanner." },
    en: { title: "Flights & travel planning", description: "Plan your journey to Villa Memaj and search flights with Skyscanner." },
    fr: { title: "Vols et préparation du voyage", description: "Préparez votre voyage à Villa Memaj et recherchez des vols avec Skyscanner." },
    sq: { title: "Fluturimet dhe udhëtimi", description: "Planifikoni udhëtimin drejt Villa Memaj dhe kërkoni fluturime me Skyscanner." },
    de: { title: "Flüge & Reiseplanung", description: "Planen Sie Ihre Reise zur Villa Memaj und suchen Sie Flüge mit Skyscanner." },
    it: { title: "Voli e pianificazione del viaggio", description: "Organizza il tuo viaggio a Villa Memaj e cerca voli con Skyscanner." },
  }[rawLocale];
  return { title: copy.title, description: copy.description };
}

const COPY: Record<Locale, {
  eyebrow: string; title: string; subtitle: string; sectionTitle: string; intro: string;
  stepTitles: [string, string, string]; stepTexts: [string, string, string]; support: string;
}> = {
  el: {
    eyebrow: "Οργανώστε το ταξίδι σας",
    title: "Το ταξίδι σας ξεκινά εδώ",
    subtitle: "Βρείτε πτήσεις και οργανώστε την άφιξή σας πριν από τη διαμονή στη Villa Memaj.",
    sectionTitle: "Αναζητήστε πτήσεις",
    intro: "Χρησιμοποιήστε την αναζήτηση Skyscanner παρακάτω για να συγκρίνετε διαθέσιμες επιλογές πτήσεων. Οι διαδρομές, οι τιμές και οι κανόνες εισιτηρίων παρέχονται από το Skyscanner και τους συνεργάτες του.",
    stepTitles: ["Επιλέξτε διαδρομή", "Ελέγξτε όλο το ταξίδι", "Επιβεβαιώστε τη διαμονή"],
    stepTexts: [
      "Εισαγάγετε πόλη ή αεροδρόμιο αναχώρησης και προορισμού. Ο κατάλληλος αερολιμένας εξαρτάται από το ακριβές σημείο διαμονής και τις συνδέσεις σας.",
      "Ελέγξτε ώρες άφιξης, αποσκευές, όρους αλλαγής, τελική τιμή και μεταφορά από το αεροδρόμιο πριν αγοράσετε εισιτήριο.",
      "Συντονίστε την ώρα άφιξης και τη μεταφορά με την ομάδα της Villa Memaj, ειδικά αν η πτήση φτάνει αργά ή χρειάζεται επιπλέον σύνδεση.",
    ],
    support: "Χρειάζεστε βοήθεια με τον σχεδιασμό της άφιξής σας; Επικοινωνήστε μαζί μας πριν επιβεβαιώσετε μεταφορές ή ώρες check-in.",
  },
  en: {
    eyebrow: "Plan your journey",
    title: "Your journey starts here",
    subtitle: "Find flights and organise your arrival before your stay at Villa Memaj.",
    sectionTitle: "Search flights",
    intro: "Use the Skyscanner search below to compare available flight options. Routes, prices and ticket rules are supplied by Skyscanner and its travel partners.",
    stepTitles: ["Choose your route", "Check the whole journey", "Confirm your stay"],
    stepTexts: [
      "Enter your departure city or airport and your destination. The right arrival airport depends on the exact property location and your onward connections.",
      "Before buying a ticket, check arrival times, baggage, change rules, total price and transport from the airport.",
      "Coordinate your arrival time and transfer with the Villa Memaj team, especially if your flight lands late or requires another connection.",
    ],
    support: "Need help planning your arrival? Contact us before confirming transfers or check-in times.",
  },
  fr: {
    eyebrow: "Préparez votre voyage",
    title: "Votre voyage commence ici",
    subtitle: "Trouvez des vols et organisez votre arrivée avant votre séjour à la Villa Memaj.",
    sectionTitle: "Rechercher des vols",
    intro: "Utilisez la recherche Skyscanner ci-dessous pour comparer les options disponibles. Les itinéraires, les prix et les conditions des billets sont fournis par Skyscanner et ses partenaires.",
    stepTitles: ["Choisissez l’itinéraire", "Vérifiez le trajet complet", "Confirmez votre séjour"],
    stepTexts: [
      "Saisissez votre ville ou aéroport de départ et votre destination. Le meilleur aéroport d’arrivée dépend de l’emplacement exact du logement et des correspondances.",
      "Avant l’achat, vérifiez les horaires, les bagages, les conditions de modification, le prix total et le transport depuis l’aéroport.",
      "Coordonnez votre heure d’arrivée et votre transfert avec l’équipe de Villa Memaj, surtout si le vol arrive tard ou nécessite une correspondance.",
    ],
    support: "Besoin d’aide pour organiser votre arrivée ? Contactez-nous avant de confirmer les transferts ou l’heure d’arrivée.",
  },
  sq: {
    eyebrow: "Planifikoni udhëtimin",
    title: "Udhëtimi juaj fillon këtu",
    subtitle: "Gjeni fluturime dhe organizoni mbërritjen përpara qëndrimit në Villa Memaj.",
    sectionTitle: "Kërkoni fluturime",
    intro: "Përdorni kërkimin e Skyscanner më poshtë për të krahasuar fluturimet. Linjat, çmimet dhe kushtet e biletave ofrohen nga Skyscanner dhe partnerët e tij.",
    stepTitles: ["Zgjidhni itinerarin", "Kontrolloni gjithë udhëtimin", "Konfirmoni qëndrimin"],
    stepTexts: [
      "Vendosni qytetin ose aeroportin e nisjes dhe destinacionin. Aeroporti më i përshtatshëm varet nga vendndodhja e saktë e akomodimit dhe lidhjet e mëtejshme.",
      "Para blerjes kontrolloni oraret, bagazhet, kushtet e ndryshimit, çmimin përfundimtar dhe transportin nga aeroporti.",
      "Koordinoni orën e mbërritjes dhe transportin me ekipin e Villa Memaj, veçanërisht nëse fluturimi mbërrin vonë ose kërkon lidhje tjetër.",
    ],
    support: "Keni nevojë për ndihmë me mbërritjen? Na kontaktoni para se të konfirmoni transportin ose orën e check-in.",
  },
  de: {
    eyebrow: "Planen Sie Ihre Anreise",
    title: "Ihre Reise beginnt hier",
    subtitle: "Finden Sie Flüge und planen Sie Ihre Ankunft vor Ihrem Aufenthalt in der Villa Memaj.",
    sectionTitle: "Flüge suchen",
    intro: "Nutzen Sie die Skyscanner-Suche, um verfügbare Flugoptionen zu vergleichen. Strecken, Preise und Ticketbedingungen werden von Skyscanner und Reisepartnern bereitgestellt.",
    stepTitles: ["Route auswählen", "Die gesamte Reise prüfen", "Aufenthalt bestätigen"],
    stepTexts: [
      "Geben Sie Abflugstadt oder -flughafen und Reiseziel ein. Der passende Zielflughafen hängt vom genauen Unterkunftsort und den Anschlussverbindungen ab.",
      "Prüfen Sie vor dem Kauf Ankunftszeiten, Gepäck, Änderungsregeln, Gesamtpreis und den Transport vom Flughafen.",
      "Stimmen Sie Ankunftszeit und Transfer mit dem Team der Villa Memaj ab, insbesondere bei später Landung oder erforderlichen Anschlussverbindungen.",
    ],
    support: "Brauchen Sie Hilfe bei der Anreiseplanung? Kontaktieren Sie uns, bevor Sie Transfers oder Check-in-Zeiten bestätigen.",
  },
  it: {
    eyebrow: "Pianifica il tuo viaggio",
    title: "Il tuo viaggio inizia qui",
    subtitle: "Trova voli e organizza il tuo arrivo prima del soggiorno a Villa Memaj.",
    sectionTitle: "Cerca voli",
    intro: "Usa la ricerca Skyscanner qui sotto per confrontare le opzioni disponibili. Rotte, prezzi e condizioni dei biglietti sono forniti da Skyscanner e dai suoi partner di viaggio.",
    stepTitles: ["Scegli la rotta", "Controlla l'intero viaggio", "Conferma il soggiorno"],
    stepTexts: [
      "Inserisci la città o l'aeroporto di partenza e la destinazione. L'aeroporto più adatto dipende dalla posizione esatta della struttura e dai collegamenti successivi.",
      "Prima di acquistare, controlla gli orari di arrivo, i bagagli, le condizioni di modifica, il prezzo totale e il trasporto dall'aeroporto.",
      "Coordina l'orario di arrivo e il trasferimento con il team di Villa Memaj, soprattutto se il volo atterra tardi o richiede un altro collegamento."
    ],
    support: "Hai bisogno di aiuto per organizzare l'arrivo? Contattaci prima di confermare trasferimenti o orari di check-in."
  },

};

export default async function TravelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const page = COPY[locale];
  const siteMedia = await getSiteMediaImages(["travel_hero"]);

  return (
    <div className="editorial-page travel-page">
      <EditorialPageHero locale={locale} eyebrow={page.eyebrow} title={page.title} subtitle={page.subtitle} imageSrc={siteMedia.travel_hero?.image_url ?? "/902234060.jpg"} imageAlt={(locale === "el" ? siteMedia.travel_hero?.alt_text_el : siteMedia.travel_hero?.alt_text_en) || (locale === "el" ? "Οργανώστε το ταξίδι σας" : "Plan your journey")} />
      <section className="editorial-standard-content">
        <div className="mx-auto max-w-6xl">
          <div className="travel-intro-copy">
            <p className="section-label">{page.sectionTitle}</p>
            <p>{page.intro}</p>
          </div>
          <SkyscannerFlightSearch locale={locale} />
          <div className="travel-steps">
            {page.stepTitles.map((title, index) => (
              <article key={title} className="travel-step-card">
                <span className="travel-step-number">{String(index + 1).padStart(2, "0")}</span>
                <h2>{title}</h2>
                <p>{page.stepTexts[index]}</p>
              </article>
            ))}
          </div>
          <div className="travel-support-note">
            <span aria-hidden="true">✦</span>
            <p>{page.support}</p>
            <a href={"mailto:info@villamemaj.com?subject=" + encodeURIComponent(page.sectionTitle)} className="text-sm font-semibold underline underline-offset-4">
              info@villamemaj.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
