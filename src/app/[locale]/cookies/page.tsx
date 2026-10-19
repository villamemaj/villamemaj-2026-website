import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EditorialPageHero from "@/components/EditorialPageHero";
import { isLocale, type Locale } from "@/lib/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "How Villa Memaj uses necessary site storage and manages optional cookie preferences.",
};

const COPY: Record<Locale, { eyebrow: string; title: string; subtitle: string; notice: string; sections: { title: string; text: string[] }[] }> = {
  el: {
    eyebrow: "Απόρρητο και διαφάνεια", title: "Πολιτική cookies", subtitle: "Πώς λειτουργούν οι απαραίτητες τεχνολογίες και οι προαιρετικές επιλογές απορρήτου.", notice: "Αυτή η σελίδα περιγράφει τους τρέχοντες ελέγχους συγκατάθεσης· δεν αποτελεί πιστοποίηση πλήρους νομικής συμμόρφωσης. Ο διαχειριστής πρέπει να ενημερώνει τον κατάλογο όταν αλλάζουν υπηρεσίες ή προμηθευτές.",
    sections: [
      { title: "1. Τι είναι τα cookies και η τοπική αποθήκευση", text: ["Τα cookies είναι μικρά αρχεία που αποθηκεύονται στη συσκευή σας. Παρόμοιες τεχνολογίες, όπως το local storage, αποθηκεύουν προτιμήσεις στον φυλλομετρητή. Η παρούσα πολιτική πρέπει να διαβάζεται μαζί με την Πολιτική Απορρήτου.", "Ο ιστότοπος χρησιμοποιεί απαραίτητη αποθήκευση για βασικές λειτουργίες, ασφάλεια και απομνημόνευση της επιλογής συγκατάθεσης. Δεν πρέπει να ενεργοποιούνται προαιρετικά εργαλεία πριν από την αντίστοιχη έγκυρη συγκατάθεση."] },
      { title: "2. Οι επιλογές σας", text: ["Μπορείτε να αποδεχθείτε όλες τις προαιρετικές κατηγορίες, να τις απορρίψετε ή να επιλέξετε ξεχωριστά στατιστικά και marketing. Οι απαραίτητες τεχνολογίες δεν απενεργοποιούνται επειδή χρειάζονται για να λειτουργεί ο ιστότοπος.", "Η επιλογή αποθηκεύεται στο πρόγραμμα περιήγησης για έως 180 ημέρες. Μπορείτε να την αλλάξετε ανά πάσα στιγμή από τον σύνδεσμο «Ρυθμίσεις cookies» στο κάτω μέρος κάθε σελίδας ή να διαγράψετε τα δεδομένα του ιστότοπου από το πρόγραμμα περιήγησης."] },
      { title: "3. Τι είναι ενεργό αυτή τη στιγμή", text: ["Η διεπαφή συγκατάθεσης περιλαμβάνει κατηγορίες για απαραίτητες τεχνολογίες, analytics και marketing/υπηρεσίες τρίτων. Η μέτρηση απόδοσης μέσω Vercel Speed Insights ενεργοποιείται μόνο μετά από συγκατάθεση στην κατηγορία στατιστικών και παραμένει απενεργοποιημένη χωρίς αυτή. Το ενσωματωμένο widget πτήσεων Skyscanner δεν φορτώνεται αυτόματα· φορτώνεται μόνο όταν ο επισκέπτης ζητήσει να το ανοίξει και έχει ενεργοποιήσει τις προαιρετικές υπηρεσίες marketing/τρίτων. Μπορείτε πάντα να ανοίξετε απευθείας το Skyscanner χωρίς να φορτώσετε το ενσωματωμένο widget."] },
      { title: "4. Πώς να αλλάξετε τις επιλογές σας", text: ["Χρησιμοποιήστε τον σύνδεσμο Ρυθμίσεις cookies στο κάτω μέρος της σελίδας. Μπορείτε επίσης να διαγράψετε τα αποθηκευμένα δεδομένα από τις ρυθμίσεις του προγράμματος περιήγησης. Η διαγραφή τους μπορεί να κάνει τον ιστότοπο να σας ζητήσει ξανά την επιλογή σας."] },
      { title: "5. Υπεύθυνος και επικοινωνία", text: ["Πριν από τη δημοσίευση, ο υπεύθυνος του καταλύματος πρέπει να επιβεβαιώσει την πλήρη νομική επωνυμία, την ταχυδρομική διεύθυνση, τα στοιχεία επικοινωνίας και τα πραγματικά εργαλεία που είναι ενεργά. Για αιτήματα απορρήτου, επικοινωνήστε στο info@villamemaj.com."] },
    ],
  },
  en: {
    eyebrow: "Privacy and transparency", title: "Cookie policy", subtitle: "How necessary site storage works and how optional privacy choices are managed.", notice: "This page describes the current consent controls; it is not a certification that every legal obligation is met. The operator must keep the inventory accurate when services or vendors change.",
    sections: [
      { title: "1. Cookies and local storage", text: ["Cookies are small files stored on your device. Similar technologies such as local storage save preferences in your browser. Read this policy together with the Privacy Policy.", "The website uses necessary storage for core functions, security and remembering your consent choice. Optional tools must not be activated before the applicable valid consent has been collected."] },
      { title: "2. Your choices", text: ["You can accept all optional categories, reject them, or choose analytics and marketing separately. Necessary technologies cannot be switched off because the website relies on them to operate.", "Your preference is stored in your browser for up to 180 days. Change it at any time using Cookie settings in the footer, or clear this website's stored data in your browser."] },
      { title: "3. What is active right now", text: ["The consent interface includes categories for necessary technologies, analytics and marketing/third-party services. Vercel Speed Insights performance measurement loads only after a visitor opts into analytics; it remains off otherwise. The embedded Skyscanner flight-search widget is not loaded automatically; it loads only when a visitor chooses to open it and has enabled optional marketing/third-party services. A direct Skyscanner link remains available without loading the embedded widget."] },
      { title: "4. Changing your choices", text: ["Use Cookie settings in the page footer. You can also remove stored data through your browser settings. Clearing it may cause the website to ask for your preference again."] },
      { title: "5. Operator and contact", text: ["Before publication, the property operator must confirm the complete legal name, postal address, contact information and the actual tools in use. For privacy requests, contact info@villamemaj.com."] },
    ],
  },
  fr: {
    eyebrow: "Confidentialité et transparence", title: "Politique des cookies", subtitle: "Fonctionnement du stockage nécessaire et gestion des choix facultatifs.", notice: "Cette page décrit les contrôles de consentement actuels ; elle ne certifie pas le respect de toutes les obligations légales. L’exploitant doit tenir l’inventaire à jour lorsque les services ou prestataires changent.",
    sections: [
      { title: "1. Cookies et stockage local", text: ["Les cookies sont de petits fichiers enregistrés sur votre appareil. Des technologies similaires, comme le stockage local, conservent des préférences dans votre navigateur. Lisez cette politique avec la politique de confidentialité.", "Le site utilise un stockage nécessaire aux fonctions essentielles, à la sécurité et à la mémorisation de votre choix. Les outils facultatifs ne doivent pas être activés avant le consentement requis."] },
      { title: "2. Vos choix", text: ["Vous pouvez accepter toutes les catégories facultatives, les refuser ou choisir séparément les statistiques et le marketing. Les technologies nécessaires ne peuvent pas être désactivées.", "Votre choix est conservé dans votre navigateur pendant 180 jours maximum. Modifiez-le via Paramètres des cookies dans le pied de page ou supprimez les données du site dans votre navigateur."] },
      { title: "3. Outils actuellement actifs", text: ["Les choix de consentement couvrent les technologies nécessaires, les statistiques et le marketing/services tiers. La mesure des performances par Vercel Speed Insights ne se charge qu’après acceptation de la catégorie statistiques ; elle reste désactivée sans cet accord. Le widget intégré de recherche de vols Skyscanner ne se charge pas automatiquement : il se charge uniquement si le visiteur choisit de l’ouvrir et a activé les services facultatifs de marketing/tiers. Un lien direct vers Skyscanner reste disponible sans charger le widget intégré."] },
      { title: "4. Modifier vos choix", text: ["Utilisez Paramètres des cookies dans le pied de page ou supprimez les données enregistrées dans les paramètres du navigateur. Le site pourra alors vous demander votre choix à nouveau."] },
      { title: "5. Responsable et contact", text: ["Avant publication, l'exploitant doit confirmer son nom légal complet, son adresse postale, ses coordonnées et les outils réellement utilisés. Contact confidentialité : info@villamemaj.com."] },
    ],
  },
  sq: {
    eyebrow: "Privatësia dhe transparenca", title: "Politika e cookies", subtitle: "Funksionimi i ruajtjes së nevojshme dhe menaxhimi i zgjedhjeve opsionale.", notice: "Kjo faqe shpjegon kontrollet aktuale të pëlqimit; nuk është certifikim se çdo detyrim ligjor është përmbushur. Operatori duhet ta përditësojë listën kur ndryshojnë shërbimet ose ofruesit.",
    sections: [
      { title: "1. Cookies dhe ruajtja lokale", text: ["Cookies janë skedarë të vegjël të ruajtur në pajisjen tuaj. Teknologjitë e ngjashme, si ruajtja lokale, mbajnë preferenca në shfletues. Lexojeni këtë politikë së bashku me Politikën e Privatësisë.", "Faqja përdor ruajtje të nevojshme për funksionet bazë, sigurinë dhe kujtimin e zgjedhjes së pëlqimit. Mjetet opsionale nuk duhet të aktivizohen para pëlqimit të vlefshëm."] },
      { title: "2. Zgjedhjet tuaja", text: ["Mund të pranoni të gjitha kategoritë opsionale, t'i refuzoni ose të zgjidhni veçmas analitikën dhe marketingun. Teknologjitë e domosdoshme nuk mund të çaktivizohen.", "Zgjedhja ruhet në shfletues deri në 180 ditë. Mund ta ndryshoni nga Cilësimet e cookies në fund të faqes ose të fshini të dhënat e faqes në shfletues."] },
      { title: "3. Çfarë është aktive", text: ["Ndërfaqja përfshin kategori për teknologjitë e domosdoshme, analitikën dhe marketingun/shërbimet e palëve të treta. Matja e performancës përmes Vercel Speed Insights aktivizohet vetëm pasi vizitori pranon analitikën; përndryshe mbetet e çaktivizuar. Widget-i i kërkimit të fluturimeve Skyscanner nuk ngarkohet automatikisht; ngarkohet vetëm kur vizitori zgjedh ta hapë dhe ka aktivizuar shërbimet opsionale të marketingut/palëve të treta. Lidhja direkte me Skyscanner mbetet e disponueshme pa ngarkuar widget-in e integruar."] },
      { title: "4. Ndryshimi i zgjedhjeve", text: ["Përdorni Cilësimet e cookies në fund të faqes ose fshini të dhënat e ruajtura në shfletues. Fshirja mund të bëjë që faqja t'ju kërkojë sërish zgjedhjen."] },
      { title: "5. Përgjegjësi dhe kontakt", text: ["Para publikimit, operatori duhet të konfirmojë emrin e plotë ligjor, adresën postare, kontaktet dhe mjetet reale që përdoren. Për kërkesa privatësie: info@villamemaj.com."] },
    ],
  },
  de: {
    eyebrow: "Datenschutz und Transparenz", title: "Cookie-Richtlinie", subtitle: "Erforderlicher Website-Speicher und die Verwaltung optionaler Datenschutzeinstellungen.", notice: "Diese Seite beschreibt die aktuellen Einwilligungskontrollen; sie ist keine Bestätigung, dass alle gesetzlichen Pflichten erfüllt sind. Der Betreiber muss das Verzeichnis bei Änderungen von Diensten oder Anbietern aktuell halten.",
    sections: [
      { title: "1. Cookies und lokaler Speicher", text: ["Cookies sind kleine Dateien, die auf Ihrem Gerät gespeichert werden. Ähnliche Technologien wie der lokale Speicher bewahren Einstellungen im Browser auf. Lesen Sie diese Richtlinie zusammen mit der Datenschutzerklärung.", "Die Website nutzt erforderlichen Speicher für grundlegende Funktionen, Sicherheit und die Speicherung Ihrer Auswahl. Optionale Tools dürfen erst nach der jeweils erforderlichen wirksamen Einwilligung aktiviert werden."] },
      { title: "2. Ihre Auswahl", text: ["Sie können alle optionalen Kategorien annehmen, ablehnen oder Analyse und Marketing separat wählen. Unbedingt notwendige Technologien lassen sich nicht deaktivieren.", "Ihre Auswahl wird bis zu 180 Tage im Browser gespeichert. Sie können sie jederzeit über Cookie-Einstellungen im Footer ändern oder die gespeicherten Website-Daten im Browser löschen."] },
      { title: "3. Derzeit aktive Tools", text: ["Die Einwilligungsoberfläche umfasst notwendige Technologien, Analyse und Marketing-/Drittanbieterdienste. Die Leistungsmessung mit Vercel Speed Insights wird erst nach Zustimmung zur Analyse aktiviert und bleibt sonst ausgeschaltet. Das eingebettete Skyscanner-Flugsuche-Widget wird nicht automatisch geladen; es wird erst geladen, wenn Gäste es öffnen möchten und optionale Marketing-/Drittanbieterdienste aktiviert haben. Ein direkter Skyscanner-Link bleibt ohne das eingebettete Widget verfügbar."] },
      { title: "4. Auswahl ändern", text: ["Verwenden Sie Cookie-Einstellungen im Footer oder löschen Sie gespeicherte Daten in den Browsereinstellungen. Danach kann die Website erneut nach Ihrer Auswahl fragen."] },
      { title: "5. Verantwortlicher und Kontakt", text: ["Vor Veröffentlichung muss der Betreiber den vollständigen rechtlichen Namen, die Postanschrift, Kontaktangaben und tatsächlich eingesetzte Tools bestätigen. Datenschutzanfragen: info@villamemaj.com."] },
    ],
  },
  it: {
    eyebrow: "Privacy e trasparenza",
    title: "Informativa sui cookie",
    subtitle: "Come funzionano le tecnologie essenziali e le preferenze facoltative di privacy.",
    notice: "Questa pagina descrive i controlli di consenso attualmente implementati; non è una certificazione di piena conformità legale. Il gestore deve aggiornare queste informazioni quando cambiano servizi o fornitori.",
    sections: [
      { title: "1. Cookie e archiviazione locale", text: [
        "I cookie sono piccoli file salvati sul dispositivo. Tecnologie simili, come la memoria locale del browser, possono conservare preferenze. Questa informativa va letta insieme all'Informativa sulla privacy.",
        "Il sito utilizza la memoria strettamente necessaria per le funzioni fondamentali, la sicurezza e per ricordare le scelte sui cookie. Le tecnologie facoltative non devono essere attivate prima del consenso."
      ]},
      { title: "2. Tecnologie strettamente necessarie", text: [
        "Le tecnologie strettamente necessarie supportano la navigazione, le funzioni di prenotazione, la sicurezza e la memorizzazione della scelta di consenso. Non possono essere disattivate tramite il pannello delle preferenze.",
        "Il sito non deve utilizzare questa categoria per finalità pubblicitarie o analitiche facoltative."
      ]},
      { title: "3. Analisi e marketing facoltativi", text: [
        "Le categorie facoltative di analisi e marketing sono disattivate per impostazione predefinita. La misurazione delle prestazioni tramite Vercel Speed Insights si attiva solo dopo il consenso alla categoria analisi e resta disattivata in assenza di consenso. La selezione di una categoria non deve attivare tecnologie ulteriori di quelle descritte in questa informativa.",
        "La misurazione delle prestazioni tramite Vercel Speed Insights si attiva solo dopo il consenso alla categoria analisi; senza consenso, nessuna misurazione viene eseguita. L'eventuale introduzione di nuovi fornitori deve essere accompagnata da un aggiornamento dell'informativa e dei controlli di consenso."
      ]},
      { title: "4. Ricerca voli Skyscanner", text: [
        "Il widget incorporato di Skyscanner viene caricato solo dopo che l'utente ha consentito la categoria facoltativa marketing/servizi di terze parti e ha scelto di aprire la ricerca. È sempre disponibile un collegamento diretto a Skyscanner.",
        "Quando si carica il widget o si apre il sito esterno, Skyscanner può ricevere i dati della ricerca e informazioni tecniche di connessione secondo le proprie condizioni e informative sulla privacy. Villa Memaj non vende biglietti aerei."
      ]},
      { title: "5. Modificare o revocare il consenso", text: [
        "Puoi rifiutare tutte le categorie facoltative dal pannello dei cookie o modificare la selezione in seguito tramite il collegamento alle impostazioni cookie sul sito.",
        "La revoca non rende illeciti i trattamenti effettuati prima della revoca. Per informazioni sul trattamento dei dati personali, consulta l'Informativa sulla privacy."
      ]}
    ]
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
          <p className="mb-8 text-sm leading-7 text-ink-soft">{page.notice}</p>
          <div className="space-y-8">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-2xl font-medium text-olive-dark">{section.title}</h2>
                {section.text.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-ink-soft">{paragraph}</p>)}
              </section>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-5 border-t border-sand-dark pt-6 text-sm font-semibold text-olive">
            <Link href={"/" + locale + "/privacy"} className="underline underline-offset-4">{locale === "el" ? "Πολιτική απορρήτου" : locale === "fr" ? "Politique de confidentialité" : locale === "sq" ? "Politika e privatësisë" : locale === "de" ? "Datenschutzerklärung" : locale === "it" ? "Informativa sulla privacy" : "Privacy policy"}</Link>
            <Link href={"/" + locale + "/terms"} className="underline underline-offset-4">{locale === "el" ? "Όροι κράτησης" : locale === "fr" ? "Conditions de réservation" : locale === "sq" ? "Kushtet e rezervimit" : locale === "de" ? "Buchungsbedingungen" : locale === "it" ? "Condizioni di prenotazione" : "Booking terms"}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
