import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import { isLocale, type Locale } from "@/lib/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "How Villa Memaj uses necessary site storage and manages optional cookie preferences.",
};

const COPY: Record<Locale, { eyebrow: string; title: string; subtitle: string; sections: { title: string; text: string[] }[] }> = {
  el: {
    eyebrow: "Απόρρητο και διαφάνεια", title: "Πολιτική cookies", subtitle: "Πώς λειτουργούν οι απαραίτητες τεχνολογίες και οι προαιρετικές επιλογές απορρήτου.",
    sections: [
      { title: "1. Τι είναι τα cookies και η τοπική αποθήκευση", text: ["Τα cookies είναι μικρά αρχεία που αποθηκεύονται στη συσκευή σας. Παρόμοιες τεχνολογίες, όπως το local storage, αποθηκεύουν προτιμήσεις στον φυλλομετρητή. Η παρούσα πολιτική πρέπει να διαβάζεται μαζί με την Πολιτική Απορρήτου.", "Ο ιστότοπος χρησιμοποιεί απαραίτητη αποθήκευση για βασικές λειτουργίες, ασφάλεια και απομνημόνευση της επιλογής συγκατάθεσης. Δεν πρέπει να ενεργοποιούνται προαιρετικά εργαλεία πριν από την αντίστοιχη έγκυρη συγκατάθεση."] },
      { title: "2. Οι επιλογές σας", text: ["Μπορείτε να αποδεχθείτε όλες τις προαιρετικές κατηγορίες, να τις απορρίψετε ή να επιλέξετε ξεχωριστά στατιστικά και marketing. Οι απαραίτητες τεχνολογίες δεν απενεργοποιούνται επειδή χρειάζονται για να λειτουργεί ο ιστότοπος.", "Η επιλογή αποθηκεύεται στο πρόγραμμα περιήγησης για έως 180 ημέρες. Μπορείτε να την αλλάξετε ανά πάσα στιγμή από τον σύνδεσμο «Ρυθμίσεις cookies» στο κάτω μέρος κάθε σελίδας ή να διαγράψετε τα δεδομένα του ιστότοπου από το πρόγραμμα περιήγησης."] },
      { title: "3. Τι είναι ενεργό αυτή τη στιγμή", text: ["Η διεπαφή συγκατάθεσης παρέχει κατηγορίες για απαραίτητες τεχνολογίες, analytics και marketing. Δεν έχει ενσωματωθεί ενεργό εργαλείο ανάλυσης επισκεψιμότητας ή διαφημιστικής παρακολούθησης μέσω αυτών των προαιρετικών κατηγοριών σε αυτήν την έκδοση. Αν προστεθούν αργότερα υπηρεσίες τρίτων, θα πρέπει να ενημερωθούν ο κατάλογος cookies, οι χρόνοι διατήρησης, οι παραλήπτες δεδομένων και οι επιλογές συγκατάθεσης πριν ενεργοποιηθούν."] },
      { title: "4. Πώς να αλλάξετε τις επιλογές σας", text: ["Χρησιμοποιήστε τον σύνδεσμο Ρυθμίσεις cookies στο κάτω μέρος της σελίδας. Μπορείτε επίσης να διαγράψετε τα αποθηκευμένα δεδομένα από τις ρυθμίσεις του προγράμματος περιήγησης. Η διαγραφή τους μπορεί να κάνει τον ιστότοπο να σας ζητήσει ξανά την επιλογή σας."] },
      { title: "5. Υπεύθυνος και επικοινωνία", text: ["Πριν από τη δημοσίευση, ο υπεύθυνος του καταλύματος πρέπει να επιβεβαιώσει την πλήρη νομική επωνυμία, την ταχυδρομική διεύθυνση, τα στοιχεία επικοινωνίας και τα πραγματικά εργαλεία που είναι ενεργά. Για αιτήματα απορρήτου, επικοινωνήστε στο info@villamemaj.com."] },
    ],
  },
  en: {
    eyebrow: "Privacy and transparency", title: "Cookie policy", subtitle: "How necessary site storage works and how optional privacy choices are managed.",
    sections: [
      { title: "1. Cookies and local storage", text: ["Cookies are small files stored on your device. Similar technologies such as local storage save preferences in your browser. Read this policy together with the Privacy Policy.", "The website uses necessary storage for core functions, security and remembering your consent choice. Optional tools must not be activated before the applicable valid consent has been collected."] },
      { title: "2. Your choices", text: ["You can accept all optional categories, reject them, or choose analytics and marketing separately. Necessary technologies cannot be switched off because the website relies on them to operate.", "Your preference is stored in your browser for up to 180 days. Change it at any time using Cookie settings in the footer, or clear this website's stored data in your browser."] },
      { title: "3. What is active right now", text: ["The consent interface provides categories for necessary technologies, analytics and marketing. This version does not activate an analytics or advertising-tracking tool through the optional categories. If third-party services are added later, the cookie inventory, retention periods, recipients and consent choices must be updated before those services are enabled."] },
      { title: "4. Changing your choices", text: ["Use Cookie settings in the page footer. You can also remove stored data through your browser settings. Clearing it may cause the website to ask for your preference again."] },
      { title: "5. Operator and contact", text: ["Before publication, the property operator must confirm the complete legal name, postal address, contact information and the actual tools in use. For privacy requests, contact info@villamemaj.com."] },
    ],
  },
  fr: {
    eyebrow: "Confidentialité et transparence", title: "Politique des cookies", subtitle: "Fonctionnement du stockage nécessaire et gestion des choix facultatifs.",
    sections: [
      { title: "1. Cookies et stockage local", text: ["Les cookies sont de petits fichiers enregistrés sur votre appareil. Des technologies similaires, comme le stockage local, conservent des préférences dans votre navigateur. Lisez cette politique avec la politique de confidentialité.", "Le site utilise un stockage nécessaire aux fonctions essentielles, à la sécurité et à la mémorisation de votre choix. Les outils facultatifs ne doivent pas être activés avant le consentement requis."] },
      { title: "2. Vos choix", text: ["Vous pouvez accepter toutes les catégories facultatives, les refuser ou choisir séparément les statistiques et le marketing. Les technologies nécessaires ne peuvent pas être désactivées.", "Votre choix est conservé dans votre navigateur pendant 180 jours maximum. Modifiez-le via Paramètres des cookies dans le pied de page ou supprimez les données du site dans votre navigateur."] },
      { title: "3. Outils actuellement actifs", text: ["Cette version propose des catégories nécessaires, statistiques et marketing, mais n'active aucun outil d'analyse d'audience ou de suivi publicitaire via les catégories facultatives. Si des services tiers sont ajoutés, l'inventaire, les durées, les destinataires et les choix de consentement doivent être mis à jour avant leur activation."] },
      { title: "4. Modifier vos choix", text: ["Utilisez Paramètres des cookies dans le pied de page ou supprimez les données enregistrées dans les paramètres du navigateur. Le site pourra alors vous demander votre choix à nouveau."] },
      { title: "5. Responsable et contact", text: ["Avant publication, l'exploitant doit confirmer son nom légal complet, son adresse postale, ses coordonnées et les outils réellement utilisés. Contact confidentialité : info@villamemaj.com."] },
    ],
  },
  sq: {
    eyebrow: "Privatësia dhe transparenca", title: "Politika e cookies", subtitle: "Funksionimi i ruajtjes së nevojshme dhe menaxhimi i zgjedhjeve opsionale.",
    sections: [
      { title: "1. Cookies dhe ruajtja lokale", text: ["Cookies janë skedarë të vegjël të ruajtur në pajisjen tuaj. Teknologjitë e ngjashme, si ruajtja lokale, mbajnë preferenca në shfletues. Lexojeni këtë politikë së bashku me Politikën e Privatësisë.", "Faqja përdor ruajtje të nevojshme për funksionet bazë, sigurinë dhe kujtimin e zgjedhjes së pëlqimit. Mjetet opsionale nuk duhet të aktivizohen para pëlqimit të vlefshëm."] },
      { title: "2. Zgjedhjet tuaja", text: ["Mund të pranoni të gjitha kategoritë opsionale, t'i refuzoni ose të zgjidhni veçmas analitikën dhe marketingun. Teknologjitë e domosdoshme nuk mund të çaktivizohen.", "Zgjedhja ruhet në shfletues deri në 180 ditë. Mund ta ndryshoni nga Cilësimet e cookies në fund të faqes ose të fshini të dhënat e faqes në shfletues."] },
      { title: "3. Çfarë është aktive", text: ["Kjo ndërfaqe ofron kategori për teknologji të domosdoshme, analitikë dhe marketing. Ky version nuk aktivizon mjete analitike ose gjurmimi reklamash përmes kategorive opsionale. Nëse shtohen shërbime të palëve të treta, lista e cookies, afatet e ruajtjes, marrësit dhe zgjedhjet e pëlqimit duhet të përditësohen përpara aktivizimit."] },
      { title: "4. Ndryshimi i zgjedhjeve", text: ["Përdorni Cilësimet e cookies në fund të faqes ose fshini të dhënat e ruajtura në shfletues. Fshirja mund të bëjë që faqja t'ju kërkojë sërish zgjedhjen."] },
      { title: "5. Përgjegjësi dhe kontakt", text: ["Para publikimit, operatori duhet të konfirmojë emrin e plotë ligjor, adresën postare, kontaktet dhe mjetet reale që përdoren. Për kërkesa privatësie: info@villamemaj.com."] },
    ],
  },
  de: {
    eyebrow: "Datenschutz und Transparenz", title: "Cookie-Richtlinie", subtitle: "Erforderlicher Website-Speicher und die Verwaltung optionaler Datenschutzeinstellungen.",
    sections: [
      { title: "1. Cookies und lokaler Speicher", text: ["Cookies sind kleine Dateien, die auf Ihrem Gerät gespeichert werden. Ähnliche Technologien wie der lokale Speicher bewahren Einstellungen im Browser auf. Lesen Sie diese Richtlinie zusammen mit der Datenschutzerklärung.", "Die Website nutzt erforderlichen Speicher für grundlegende Funktionen, Sicherheit und die Speicherung Ihrer Auswahl. Optionale Tools dürfen erst nach der jeweils erforderlichen wirksamen Einwilligung aktiviert werden."] },
      { title: "2. Ihre Auswahl", text: ["Sie können alle optionalen Kategorien annehmen, ablehnen oder Analyse und Marketing separat wählen. Unbedingt notwendige Technologien lassen sich nicht deaktivieren.", "Ihre Auswahl wird bis zu 180 Tage im Browser gespeichert. Sie können sie jederzeit über Cookie-Einstellungen im Footer ändern oder die gespeicherten Website-Daten im Browser löschen."] },
      { title: "3. Derzeit aktive Tools", text: ["Diese Version bietet Kategorien für notwendige Technologien, Analyse und Marketing, aktiviert aber über die optionalen Kategorien derzeit kein Analyse- oder Werbe-Tracking-Tool. Werden später Dienste Dritter hinzugefügt, müssen Cookie-Verzeichnis, Speicherfristen, Empfänger und Auswahlmöglichkeiten vor der Aktivierung aktualisiert werden."] },
      { title: "4. Auswahl ändern", text: ["Verwenden Sie Cookie-Einstellungen im Footer oder löschen Sie gespeicherte Daten in den Browsereinstellungen. Danach kann die Website erneut nach Ihrer Auswahl fragen."] },
      { title: "5. Verantwortlicher und Kontakt", text: ["Vor Veröffentlichung muss der Betreiber den vollständigen rechtlichen Namen, die Postanschrift, Kontaktangaben und tatsächlich eingesetzte Tools bestätigen. Datenschutzanfragen: info@villamemaj.com."] },
    ],
  },
};

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const page = COPY[locale];

  return (
    <div className="editorial-page">
      <EditorialPageHero locale={locale} eyebrow={page.eyebrow} title={page.title} subtitle={page.subtitle} imageSrc="/902234060.jpg" />
      <section className="editorial-standard-content">
        <div className="mx-auto max-w-4xl rounded-2xl border border-sand-dark bg-white p-6 sm:p-10">
          <p className="mb-8 text-sm leading-7 text-ink-soft">This page explains the current consent controls; it is not a certification that every legal obligation is met. The operator must keep the inventory accurate when services or vendors change.</p>
          <div className="space-y-8">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-2xl font-medium text-olive-dark">{section.title}</h2>
                {section.text.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-ink-soft">{paragraph}</p>)}
              </section>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-5 border-t border-sand-dark pt-6 text-sm font-semibold text-olive">
            <Link href={"/" + locale + "/privacy"} className="underline underline-offset-4">{locale === "el" ? "Πολιτική απορρήτου" : locale === "fr" ? "Politique de confidentialité" : locale === "sq" ? "Politika e privatësisë" : locale === "de" ? "Datenschutzerklärung" : "Privacy policy"}</Link>
            <Link href={"/" + locale + "/terms"} className="underline underline-offset-4">{locale === "el" ? "Όροι κράτησης" : locale === "fr" ? "Conditions de réservation" : locale === "sq" ? "Kushtet e rezervimit" : locale === "de" ? "Buchungsbedingungen" : "Booking terms"}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
