import type { Locale } from "@/lib/site";

export type PolicySection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type PolicyDocument = {
  label: string;
  title: string;
  subtitle: string;
  updated: string;
  sections: PolicySection[];
};

const documents: Record<string, Partial<Record<Locale, PolicyDocument>>> = {
  terms: {
    en: {
      label: "Guest information",
      title: "Booking terms & conditions",
      subtitle: "Clear information about reservations, your stay, payments and the responsibilities we share.",
      updated: "19 October 2026",
      sections: [
        { heading: "1. The property and the booking contract", paragraphs: [
          "These terms apply to direct enquiries and reservations made through the Villa Memaj website. The property is located in Albania. Your booking confirmation and the specific offer shown before you submit a booking form are part of the contract.",
          "Sending an enquiry or booking request does not by itself guarantee a room. We will confirm availability, the room or accommodation type, dates, guest count, total price, payment schedule and the applicable cancellation terms in writing. A booking is confirmed only when our confirmation or the stated booking flow says it is confirmed."
        ] },
        { heading: "2. Prices, taxes and additional charges", paragraphs: [
          "The price and currency shown for the selected dates and rate plan apply to that offer. Before you commit, review the total, deposit or prepayment required, what is included, and any taxes or additional charges shown in the offer. We will not intentionally add undisclosed discretionary fees after confirmation.",
          "Tax treatment and any mandatory local charges depend on the applicable rules and the booking terms. If an item is not clear in your offer or confirmation, contact us before completing the reservation."
        ] },
        { heading: "3. Payments and receipts", paragraphs: [
          "The accepted payment method and timing are stated in the relevant offer or confirmation. Cash at the property may be available for reservations marked as pay-at-property. Where an online card payment is explicitly offered, payment is processed through the hosted payment provider shown at checkout; card details should be entered only on that provider’s secure page, not sent by email or through the contact form.",
          "A browser message or return page alone is not proof that a payment has completed. The payment is treated as received once it has been verified by the payment provider and recorded in our booking system. Keep your confirmation and payment receipt. Refund timing may depend on the payment method and financial institution."
        ] },
        { heading: "4. Cancellation, changes and no-shows", paragraphs: [
          "The cancellation and prepayment conditions shown for the rate plan you choose and repeated in your confirmation are the conditions for your reservation. Flexible and non-refundable rates can have different deadlines, deposits and penalties. Do not rely on a generic summary where your confirmation contains a more specific condition.",
          "To request a change or cancellation, contact us using the contact details in your confirmation as early as possible. A change is not agreed until we confirm it. Any valid refund will be processed according to the applicable rate terms and mandatory law. If you do not arrive and have not cancelled, the no-show terms displayed for your reservation apply."
        ] },
        { heading: "5. Check-in, check-out and guest details", paragraphs: [
          "Published check-in and check-out windows are shown on the House Rules page and in your reservation offer. Please use the times stated in your individual confirmation and contact us in advance if your arrival may fall outside that window.",
          "Provide accurate contact details and the correct number of adults and children. A phone number is required for booking coordination. The property may request identity or guest-registration information when required by applicable law; information should be collected only for a stated and lawful purpose."
        ] },
        { heading: "6. Use of the accommodation and house rules", paragraphs: [
          "Guests must use the accommodation responsibly, respect neighbours and other guests, follow the house rules shown at booking, and leave the room and equipment in a reasonable condition. Smoking is permitted under the current property settings; pets and parties/events are not permitted. Please check with us before bringing any special equipment or making arrangements that could affect other guests.",
          "Children of any age are currently permitted. Cots and extra beds are not listed as available. Wi-Fi is described as available free of charge in public areas. Parking information refers to public-street parking and does not guarantee a reserved space unless that is expressly confirmed."
        ] },
        { heading: "7. Damage, safety and property access", paragraphs: [
          "Please tell us promptly about damage, lost keys or safety issues. Any claim for damage or extra cleaning must be based on the circumstances, documented where appropriate, and handled in accordance with the booking terms and applicable law. No automatic damage deposit is stated in the current property settings.",
          "We may need access to the accommodation for emergencies, urgent maintenance or other legitimate operational needs, while respecting guests’ privacy and safety."
        ] },
        { heading: "8. Complaints, disruptions and exceptional events", paragraphs: [
          "If something is wrong during the stay, contact us promptly so we have a fair opportunity to investigate and, where possible, resolve it. Nothing in these terms limits rights that cannot lawfully be excluded.",
          "Events outside reasonable control may affect the ability to provide the stay. We will communicate with affected guests and handle changes, cancellations and refunds according to the applicable contract and mandatory law."
        ] },
        { heading: "9. Consumer rights and applicable law", paragraphs: [
          "Mandatory consumer rights remain in force. Depending on the law applicable to a specific reservation, accommodation provided on a specific date or during a specific period may fall within an exception to the ordinary distance-contract withdrawal period. This is not the same as a cancellation right under a flexible rate: the rate-specific cancellation conditions still need to be checked.",
          "The legal rules that apply can depend on where the property is located, where the guest resides, and how the booking was made. If a provision of these terms conflicts with mandatory law, the mandatory law prevails. These terms should be reviewed by qualified counsel familiar with Albanian accommodation and consumer law before being treated as a final legal opinion."
        ] },
        { heading: "10. Contact", paragraphs: [
          "For booking questions, changes or complaints, contact info@villamemaj.com and include your booking reference. Do not include full payment-card details or identity documents in ordinary email unless we provide a secure and lawful method."
        ] }
      ]
    },
    el: {
      label: "Πληροφορίες επισκεπτών",
      title: "Όροι κράτησης και διαμονής",
      subtitle: "Σαφείς πληροφορίες για τις κρατήσεις, τη διαμονή, τις πληρωμές και τις κοινές μας υποχρεώσεις.",
      updated: "19 Οκτωβρίου 2026",
      sections: [
        { heading: "1. Το κατάλυμα και η σύμβαση κράτησης", paragraphs: [
          "Οι παρόντες όροι αφορούν απευθείας ερωτήματα και κρατήσεις μέσω του ιστοτόπου Villa Memaj. Το κατάλυμα βρίσκεται στην Αλβανία. Η επιβεβαίωση κράτησης και η συγκεκριμένη προσφορά που εμφανίζεται πριν από την υποβολή αποτελούν μέρος της συμφωνίας.",
          "Η αποστολή ερωτήματος ή αιτήματος κράτησης δεν εγγυάται από μόνη της τη διαθεσιμότητα. Θα επιβεβαιώσουμε γραπτώς τη διαθεσιμότητα, τον τύπο καταλύματος, τις ημερομηνίες, τον αριθμό επισκεπτών, τη συνολική τιμή, το χρονοδιάγραμμα πληρωμής και τους όρους ακύρωσης. Η κράτηση θεωρείται επιβεβαιωμένη μόνο όταν το αναφέρει η επιβεβαίωση ή η συγκεκριμένη διαδικασία κράτησης."
        ] },
        { heading: "2. Τιμές, φόροι και πρόσθετες χρεώσεις", paragraphs: [
          "Ισχύουν η τιμή και το νόμισμα που εμφανίζονται για τις επιλεγμένες ημερομηνίες και το πρόγραμμα τιμής. Πριν δεσμευτείτε, ελέγξτε το σύνολο, την απαιτούμενη προκαταβολή ή προπληρωμή, τι περιλαμβάνεται και τυχόν φόρους ή πρόσθετες χρεώσεις που εμφανίζονται στην προσφορά. Δεν θα προσθέτουμε σκόπιμα μη γνωστοποιημένες προαιρετικές χρεώσεις μετά την επιβεβαίωση.",
          "Η φορολογική μεταχείριση και οι υποχρεωτικές τοπικές χρεώσεις εξαρτώνται από τους ισχύοντες κανόνες και τους όρους κράτησης. Αν κάτι δεν είναι σαφές, επικοινωνήστε μαζί μας πριν ολοκληρώσετε την κράτηση."
        ] },
        { heading: "3. Πληρωμές και αποδείξεις", paragraphs: [
          "Ο αποδεκτός τρόπος και ο χρόνος πληρωμής αναφέρονται στη σχετική προσφορά ή επιβεβαίωση. Ενδέχεται να διατίθεται πληρωμή με μετρητά στο κατάλυμα για κρατήσεις που χαρακτηρίζονται ως πληρωμή κατά την άφιξη. Όταν προσφέρεται ρητά ηλεκτρονική πληρωμή με κάρτα, αυτή διεκπεραιώνεται στη φιλοξενούμενη ασφαλή σελίδα του παρόχου πληρωμών· μην στέλνετε στοιχεία κάρτας μέσω email ή της φόρμας επικοινωνίας.",
          "Η επιστροφή σελίδας στο πρόγραμμα περιήγησης δεν αποδεικνύει από μόνη της ότι η πληρωμή ολοκληρώθηκε. Η πληρωμή θεωρείται ληφθείσα αφού επαληθευτεί από τον πάροχο και καταχωριστεί στο σύστημα κρατήσεων. Φυλάξτε την επιβεβαίωση και την απόδειξη. Ο χρόνος επιστροφής χρημάτων μπορεί να εξαρτάται από τη μέθοδο πληρωμής και το χρηματοπιστωτικό ίδρυμα."
        ] },
        { heading: "4. Ακύρωση, αλλαγές και μη εμφάνιση", paragraphs: [
          "Ισχύουν οι όροι ακύρωσης και προπληρωμής που εμφανίζονται στο πρόγραμμα τιμής που επιλέγετε και επαναλαμβάνονται στην επιβεβαίωση. Οι ευέλικτες και οι μη επιστρέψιμες τιμές μπορεί να έχουν διαφορετικές προθεσμίες, προκαταβολές και χρεώσεις. Ελέγχετε πάντα την ατομική επιβεβαίωση.",
          "Για αλλαγή ή ακύρωση, επικοινωνήστε το συντομότερο χρησιμοποιώντας τα στοιχεία της επιβεβαίωσης. Η αλλαγή ισχύει μόνο αφού την επιβεβαιώσουμε. Τυχόν επιστροφή ακολουθεί τους εφαρμοστέους όρους και την υποχρεωτική νομοθεσία. Αν δεν εμφανιστείτε χωρίς να έχετε ακυρώσει, εφαρμόζονται οι όροι μη εμφάνισης της κράτησής σας."
        ] },
        { heading: "5. Άφιξη, αναχώρηση και στοιχεία επισκεπτών", paragraphs: [
          "Τα δημοσιευμένα διαστήματα άφιξης και αναχώρησης εμφανίζονται στη σελίδα Κανόνες Καταλύματος και στην προσφορά κράτησης. Ακολουθήστε τις ώρες που αναφέρονται στην ατομική επιβεβαίωση και ενημερώστε μας εκ των προτέρων για πιθανή άφιξη εκτός του διαστήματος.",
          "Δώστε ακριβή στοιχεία επικοινωνίας και σωστό αριθμό ενηλίκων και παιδιών. Απαιτείται αριθμός τηλεφώνου για τον συντονισμό της κράτησης. Το κατάλυμα μπορεί να ζητήσει στοιχεία ταυτοποίησης ή καταχώρισης επισκεπτών όταν το απαιτεί η νομοθεσία, μόνο για νόμιμο και δηλωμένο σκοπό."
        ] },
        { heading: "6. Χρήση καταλύματος και κανόνες", paragraphs: [
          "Οι επισκέπτες οφείλουν να χρησιμοποιούν υπεύθυνα το κατάλυμα, να σέβονται τους γείτονες και τους άλλους επισκέπτες, να τηρούν τους κανόνες που εμφανίζονται κατά την κράτηση και να αφήνουν το δωμάτιο και τον εξοπλισμό σε εύλογη κατάσταση. Το κάπνισμα επιτρέπεται βάσει των τρεχουσών ρυθμίσεων· τα κατοικίδια και τα πάρτι/εκδηλώσεις δεν επιτρέπονται. Επικοινωνήστε μαζί μας πριν από ειδικές διευθετήσεις που μπορεί να επηρεάσουν άλλους επισκέπτες.",
          "Επιτρέπονται παιδιά κάθε ηλικίας. Κούνιες και επιπλέον κρεβάτια δεν αναφέρονται ως διαθέσιμα. Το Wi-Fi περιγράφεται ως δωρεάν στους κοινόχρηστους χώρους. Η στάθμευση αφορά δημόσιο δρόμο και δεν εγγυάται δεσμευμένη θέση εκτός αν έχει επιβεβαιωθεί ρητά."
        ] },
        { heading: "7. Ζημιές, ασφάλεια και πρόσβαση", paragraphs: [
          "Ενημερώστε μας έγκαιρα για ζημιές, χαμένα κλειδιά ή ζητήματα ασφάλειας. Κάθε αξίωση για ζημιά ή πρόσθετο καθαρισμό πρέπει να βασίζεται στις περιστάσεις, να τεκμηριώνεται όπου είναι σκόπιμο και να αντιμετωπίζεται σύμφωνα με τους όρους και τη νομοθεσία. Στις τρέχουσες ρυθμίσεις δεν αναφέρεται αυτόματη εγγύηση ζημιών.",
          "Μπορεί να χρειαστεί πρόσβαση στο κατάλυμα για έκτακτη ανάγκη, επείγουσα συντήρηση ή άλλη νόμιμη λειτουργική ανάγκη, με σεβασμό στην ιδιωτικότητα και την ασφάλεια των επισκεπτών."
        ] },
        { heading: "8. Παράπονα και έκτακτα γεγονότα", paragraphs: [
          "Αν προκύψει πρόβλημα κατά τη διαμονή, επικοινωνήστε άμεσα ώστε να μπορέσουμε να το διερευνήσουμε και, όπου είναι δυνατό, να το επιλύσουμε. Οι παρόντες όροι δεν περιορίζουν δικαιώματα που δεν μπορούν νόμιμα να αποκλειστούν.",
          "Γεγονότα εκτός εύλογου ελέγχου μπορεί να επηρεάσουν τη διαμονή. Θα ενημερώνουμε τους επισκέπτες και θα χειριζόμαστε αλλαγές, ακυρώσεις και επιστροφές σύμφωνα με τη συμφωνία και την υποχρεωτική νομοθεσία."
        ] },
        { heading: "9. Δικαιώματα καταναλωτή και εφαρμοστέο δίκαιο", paragraphs: [
          "Τα υποχρεωτικά δικαιώματα των καταναλωτών εξακολουθούν να ισχύουν. Ανάλογα με το εφαρμοστέο δίκαιο, η διαμονή σε συγκεκριμένη ημερομηνία ή περίοδο μπορεί να εξαιρείται από τη συνήθη προθεσμία υπαναχώρησης για συμβάσεις από απόσταση. Αυτό δεν ταυτίζεται με το συμβατικό δικαίωμα ακύρωσης μιας ευέλικτης τιμής: οι ειδικοί όροι της τιμής πρέπει να ελέγχονται.",
          "Οι εφαρμοστέοι κανόνες εξαρτώνται ενδεχομένως από την τοποθεσία του καταλύματος, τη χώρα κατοικίας του επισκέπτη και τον τρόπο κράτησης. Σε περίπτωση σύγκρουσης με υποχρεωτικό δίκαιο, υπερισχύει το υποχρεωτικό δίκαιο. Το κείμενο χρειάζεται έλεγχο από εξειδικευμένο νομικό σύμβουλο με γνώση της αλβανικής νομοθεσίας για καταλύματα και καταναλωτές."
        ] },
        { heading: "10. Επικοινωνία", paragraphs: [
          "Για ερωτήσεις, αλλαγές ή παράπονα, επικοινωνήστε στο info@villamemaj.com και συμπεριλάβετε τον κωδικό κράτησης. Μην συμπεριλαμβάνετε πλήρη στοιχεία κάρτας ή έγγραφα ταυτότητας σε απλό email."
        ] }
      ]
    }
  },
  privacy: {
    en: {
      label: "Your information",
      title: "Privacy policy",
      subtitle: "How booking information is collected, used, protected and retained.",
      updated: "19 October 2026",
      sections: [
        { heading: "1. Who is responsible", paragraphs: [
          "Villa Memaj operates accommodation in Albania. For privacy questions or requests, contact info@villamemaj.com. The operator's complete registered legal name, registration number, tax identification and full postal address should be added to the legal profile before this policy is treated as complete."
        ] },
        { heading: "2. Information we process", paragraphs: [
          "Depending on the enquiry or reservation, we may process your name, email address, phone number, dates of stay, selected accommodation and rate, guest numbers, booking reference, messages and special requests, cancellation history, payment status and payment-provider references. We do not ask you to send full card details through the website's contact or booking forms.",
          "We may also process technical security information such as request timestamps, error logs and anti-abuse signals necessary to protect the booking service and CRM. Do not place health, identity-document or other sensitive details into optional message fields unless we have requested the information through an appropriate channel and a lawful basis exists."
        ] },
        { heading: "3. Purposes and legal bases", paragraphs: [
          "We use booking information to respond to enquiries, quote prices, check availability, create and manage reservations, communicate with guests, process or reconcile payments where offered, handle cancellations and complaints, and provide the stay. We may also process records to comply with applicable accounting, tax, guest-registration and other legal duties, and to protect our systems and establish or defend legal claims.",
          "The legal basis depends on the specific processing and applicable law, and may include steps taken at your request before a contract, performance of a contract, legal obligations, legitimate interests or consent where consent is required. Optional marketing must be handled separately and is not a condition of making a booking."
        ] },
        { heading: "4. Service providers and recipients", paragraphs: [
          "Information is made available only to people and service providers who need it for the stated purposes. These may include the website host, database and CRM provider, email delivery provider, payment provider when online payment is offered, and a booking platform or channel manager where your reservation was made or where a permitted integration is configured. A platform's own privacy notice applies to its separate processing.",
          "The online payment route, when enabled, uses the hosted checkout page of the provider identified at the time of payment. We do not intentionally place secret payment credentials in public page code. Providers may process information in other countries; the operator must document applicable transfer safeguards and processor terms in its compliance records."
        ] },
        { heading: "5. Retention", paragraphs: [
          "We keep information for the time needed to handle the enquiry and stay, maintain booking and payment evidence, comply with applicable tax and accounting duties, resolve disputes and protect legitimate rights. Records should then be deleted or anonymised when no longer needed, subject to any mandatory retention period or legal hold. A documented retention schedule must be set by the operator against the applicable Albanian tax, accommodation and limitation rules."
        ] },
        { heading: "6. Security", paragraphs: [
          "We use access controls, role-based staff permissions, server-side processing for sensitive operations, database row-level security and technical monitoring appropriate to the service. No internet system can be guaranteed risk-free. Please contact us promptly if you believe booking information has been exposed or sent to the wrong recipient."
        ] },
        { heading: "7. Your rights", paragraphs: [
          "Subject to the law that applies, you may ask to access, correct, delete, restrict or object to certain processing, request a copy of information, or withdraw consent for processing based on consent. Some records may need to be retained to comply with law or establish legal claims. We may ask for proportionate information to verify your identity before responding.",
          "Albania's Law No. 124/2024 on Personal Data Protection establishes the local personal-data framework. Where the GDPR applies, its protections and rights also apply. You may contact the Albanian Information and Data Protection Commissioner through its official website at idp.al if you believe your rights have been infringed."
        ] },
        { heading: "8. Cookies and similar technologies", paragraphs: [
          "The site may use cookies or storage strictly necessary for operation, security, language preference or an authenticated staff session. Non-essential analytics or marketing technologies should be enabled only if they are actually deployed and any legally required consent has been obtained. This policy must be updated if new analytics, advertising pixels or other non-essential trackers are added."
        ] },
        { heading: "9. Children", paragraphs: [
          "Children may stay at the property with their booking party under the property rules, but the website booking process is intended to be used by a responsible adult. We do not knowingly use a child's personal information for direct marketing."
        ] },
        { heading: "10. Contact and updates", paragraphs: [
          "For privacy requests, email info@villamemaj.com and identify the reservation only by its booking reference; do not email full payment-card details. We may update this policy when practices or laws change. The date above identifies the latest publication date of this page, not a guarantee that every legal compliance task has been independently certified."
        ] }
      ]
    },
    el: {
      label: "Τα στοιχεία σας",
      title: "Πολιτική απορρήτου",
      subtitle: "Πώς συλλέγονται, χρησιμοποιούνται, προστατεύονται και διατηρούνται τα στοιχεία κράτησης.",
      updated: "19 Οκτωβρίου 2026",
      sections: [
        { heading: "1. Υπεύθυνος επεξεργασίας", paragraphs: [
          "Η Villa Memaj παρέχει υπηρεσίες διαμονής στην Αλβανία. Για ερωτήματα ή αιτήματα απορρήτου, επικοινωνήστε στο info@villamemaj.com. Πριν θεωρηθεί πλήρης η πολιτική, πρέπει να προστεθούν η πλήρης καταχωρισμένη επωνυμία, ο αριθμός μητρώου, ο φορολογικός αριθμός και η πλήρης ταχυδρομική διεύθυνση του φορέα εκμετάλλευσης."
        ] },
        { heading: "2. Πληροφορίες που επεξεργαζόμαστε", paragraphs: [
          "Ανάλογα με το ερώτημα ή την κράτηση, μπορεί να επεξεργαστούμε όνομα, email, τηλέφωνο, ημερομηνίες διαμονής, επιλεγμένο κατάλυμα και τιμή, αριθμό επισκεπτών, κωδικό κράτησης, μηνύματα και ειδικά αιτήματα, ιστορικό ακυρώσεων, κατάσταση πληρωμής και αναφορές παρόχου πληρωμών. Δεν ζητάμε πλήρη στοιχεία κάρτας μέσω των φορμών επικοινωνίας ή κράτησης.",
          "Ενδέχεται να επεξεργαζόμαστε τεχνικά στοιχεία ασφάλειας, όπως χρονικές σημάνσεις αιτημάτων, αρχεία σφαλμάτων και σήματα κατάχρησης που απαιτούνται για την προστασία της υπηρεσίας και του CRM. Μην εισάγετε ευαίσθητα στοιχεία ή έγγραφα ταυτότητας σε προαιρετικά πεδία μηνυμάτων."
        ] },
        { heading: "3. Σκοποί και νομικές βάσεις", paragraphs: [
          "Χρησιμοποιούμε στοιχεία κράτησης για απαντήσεις σε ερωτήματα, προσφορές, έλεγχο διαθεσιμότητας, δημιουργία και διαχείριση κρατήσεων, επικοινωνία, επαλήθευση πληρωμών όπου προσφέρεται, ακυρώσεις και παράπονα. Ενδέχεται επίσης να τα επεξεργαζόμαστε για λογιστικές, φορολογικές, υποχρεώσεις καταχώρισης επισκεπτών και άλλες νόμιμες υποχρεώσεις, καθώς και για την προστασία των συστημάτων και την άσκηση ή υπεράσπιση νομικών αξιώσεων.",
          "Η νομική βάση εξαρτάται από την επεξεργασία και το εφαρμοστέο δίκαιο και μπορεί να περιλαμβάνει προσυμβατικά μέτρα, εκτέλεση σύμβασης, νομική υποχρέωση, έννομο συμφέρον ή συγκατάθεση όπου απαιτείται. Η προαιρετική εμπορική επικοινωνία πρέπει να αντιμετωπίζεται χωριστά και δεν αποτελεί προϋπόθεση κράτησης."
        ] },
        { heading: "4. Πάροχοι υπηρεσιών και αποδέκτες", paragraphs: [
          "Τα στοιχεία κοινοποιούνται μόνο σε πρόσωπα και παρόχους που τα χρειάζονται για τους δηλωμένους σκοπούς. Αυτοί μπορεί να περιλαμβάνουν φιλοξενία ιστοτόπου, βάση δεδομένων και CRM, αποστολή email, πάροχο πληρωμών όπου προσφέρεται ηλεκτρονική πληρωμή και πλατφόρμα κρατήσεων ή channel manager όπου έγινε η κράτηση ή έχει ρυθμιστεί επιτρεπόμενη σύνδεση.",
          "Όταν ενεργοποιείται η ηλεκτρονική πληρωμή, χρησιμοποιείται η φιλοξενούμενη σελίδα πληρωμής του παρόχου που εμφανίζεται εκείνη τη στιγμή. Δεν τοποθετούμε σκόπιμα μυστικά κλειδιά πληρωμών σε δημόσιο κώδικα. Οι πάροχοι μπορεί να επεξεργάζονται στοιχεία σε άλλες χώρες· ο υπεύθυνος πρέπει να τεκμηριώσει τις εφαρμοστέες εγγυήσεις διαβίβασης και τις συμβάσεις επεξεργασίας."
        ] },
        { heading: "5. Διατήρηση", paragraphs: [
          "Διατηρούμε στοιχεία όσο χρειάζεται για το αίτημα και τη διαμονή, την τεκμηρίωση κρατήσεων και πληρωμών, τις φορολογικές και λογιστικές υποχρεώσεις, την επίλυση διαφορών και την προστασία νόμιμων δικαιωμάτων. Έπειτα διαγράφονται ή ανωνυμοποιούνται όταν δεν χρειάζονται, με την επιφύλαξη υποχρεωτικών περιόδων διατήρησης ή νομικής δέσμευσης. Ο φορέας πρέπει να καθορίσει τεκμηριωμένο χρονοδιάγραμμα διατήρησης σύμφωνα με τους εφαρμοστέους αλβανικούς κανόνες."
        ] },
        { heading: "6. Ασφάλεια", paragraphs: [
          "Χρησιμοποιούμε ελέγχους πρόσβασης, δικαιώματα ανά ρόλο, επεξεργασία ευαίσθητων λειτουργιών στην πλευρά του διακομιστή, ασφάλεια επιπέδου γραμμών στη βάση δεδομένων και κατάλληλη τεχνική παρακολούθηση. Κανένα σύστημα στο διαδίκτυο δεν μπορεί να εγγυηθεί μηδενικό κίνδυνο. Επικοινωνήστε άμεσα αν πιστεύετε ότι στοιχεία έχουν εκτεθεί ή σταλεί σε λάθος παραλήπτη."
        ] },
        { heading: "7. Τα δικαιώματά σας", paragraphs: [
          "Ανάλογα με το εφαρμοστέο δίκαιο, μπορείτε να ζητήσετε πρόσβαση, διόρθωση, διαγραφή, περιορισμό ή εναντίωση σε ορισμένη επεξεργασία, αντίγραφο των στοιχείων ή ανάκληση συγκατάθεσης όπου η επεξεργασία βασίζεται σε αυτή. Ορισμένα αρχεία μπορεί να πρέπει να διατηρηθούν λόγω νόμου ή νομικών αξιώσεων. Μπορεί να ζητηθούν αναλογικά στοιχεία ταυτοποίησης πριν την απάντηση.",
          "Ο αλβανικός Νόμος 124/2024 για την προστασία δεδομένων προσωπικού χαρακτήρα αποτελεί το τοπικό πλαίσιο. Όπου εφαρμόζεται, ισχύει επίσης ο GDPR. Μπορείτε να επικοινωνήσετε με τον Αλβανό Επίτροπο Πληροφόρησης και Προστασίας Δεδομένων μέσω της επίσημης ιστοσελίδας idp.al."
        ] },
        { heading: "8. Cookies και παρόμοιες τεχνολογίες", paragraphs: [
          "Ο ιστότοπος μπορεί να χρησιμοποιεί cookies ή αποθήκευση που είναι απολύτως απαραίτητα για λειτουργία, ασφάλεια, γλώσσα ή σύνδεση προσωπικού. Μη απαραίτητα analytics ή τεχνολογίες marketing πρέπει να ενεργοποιούνται μόνο εφόσον πράγματι χρησιμοποιούνται και αφού ληφθεί η απαιτούμενη συγκατάθεση. Η πολιτική πρέπει να ενημερωθεί εάν προστεθούν νέοι trackers."
        ] },
        { heading: "9. Παιδιά", paragraphs: [
          "Τα παιδιά μπορούν να διαμένουν στο κατάλυμα με την ομάδα κράτησής τους σύμφωνα με τους κανόνες του καταλύματος, αλλά η διαδικασία κράτησης προορίζεται να χρησιμοποιείται από υπεύθυνο ενήλικα. Δεν χρησιμοποιούμε εν γνώσει μας προσωπικά στοιχεία παιδιών για απευθείας εμπορική προώθηση."
        ] },
        { heading: "10. Επικοινωνία και ενημερώσεις", paragraphs: [
          "Για αιτήματα απορρήτου, στείλτε email στο info@villamemaj.com και αναφέρετε μόνο τον κωδικό κράτησης· μην στέλνετε πλήρη στοιχεία κάρτας. Η πολιτική μπορεί να αλλάζει όταν αλλάζουν οι πρακτικές ή η νομοθεσία. Η ημερομηνία παραπάνω είναι η ημερομηνία τελευταίας δημοσίευσης, όχι εγγύηση ανεξάρτητης πιστοποίησης όλων των υποχρεώσεων."
        ] }
      ]
    }
  },
  cancellation: {
    en: {
      label: "Changes and refunds",
      title: "Cancellation & refund policy",
      subtitle: "Your specific rate and booking confirmation determine the cancellation deadline, any fee and refund eligibility.",
      updated: "19 October 2026",
      sections: [
        { heading: "Check the rate you selected", paragraphs: [
          "Cancellation terms vary by rate plan and may distinguish flexible, deposit, prepaid and non-refundable reservations. The exact deadline, fee, prepayment and refund conditions must be shown before the reservation is confirmed and repeated in the confirmation. The reservation-specific conditions govern over this general summary."
        ] },
        { heading: "How to cancel or request a change", paragraphs: [
          "Use the cancellation link if your confirmation provides one, or email info@villamemaj.com with your booking reference and requested change. A message is a request; wait for the confirmation of the cancellation or amendment. If you booked through a third-party platform, use its cancellation and messaging process as well."
        ] },
        { heading: "Deposits, non-refundable rates and no-shows", paragraphs: [
          "A deposit may be non-refundable or subject to the cancellation terms shown in the offer. A non-refundable rate may not entitle the guest to a refund when cancelled, except where mandatory law or an agreed exception requires otherwise. No-show charges are limited to the amount and conditions disclosed for that booking and allowed by applicable law."
        ] },
        { heading: "Refund processing", paragraphs: [
          "Where a refund is due, we will initiate it using the appropriate payment route and keep a record of the transaction. The time for the funds to appear may depend on the provider, card issuer or bank. For cash or other offline payments, the practical method and receipt will be agreed with the property."
        ] },
        { heading: "Specific-date accommodation and consumer rights", paragraphs: [
          "Some consumer-law regimes exclude accommodation booked for a specific date or period from the ordinary 14-day distance-contract withdrawal right. This is not a universal statement about every jurisdiction or every reservation, and it does not remove cancellation rights provided in your selected rate or mandatory law. Contact us before booking if you need clarification."
        ] },
        { heading: "If the property must cancel", paragraphs: [
          "If we cannot provide the confirmed accommodation, we will contact you and discuss the available alternatives or refund according to your confirmation and mandatory law. We will not describe an alternative as equivalent without explaining material differences."
        ] }
      ]
    },
    el: {
      label: "Αλλαγές και επιστροφές",
      title: "Πολιτική ακύρωσης και επιστροφών",
      subtitle: "Η συγκεκριμένη τιμή και επιβεβαίωση κράτησης καθορίζουν την προθεσμία, τυχόν χρέωση και το δικαίωμα επιστροφής.",
      updated: "19 Οκτωβρίου 2026",
      sections: [
        { heading: "Ελέγξτε την τιμή που επιλέξατε", paragraphs: [
          "Οι όροι ακύρωσης διαφέρουν ανά πρόγραμμα τιμής και μπορεί να ξεχωρίζουν ευέλικτες, προκαταβολικές, προπληρωμένες και μη επιστρέψιμες κρατήσεις. Η ακριβής προθεσμία, χρέωση, προπληρωμή και επιστροφή πρέπει να εμφανίζονται πριν από την επιβεβαίωση και να επαναλαμβάνονται στην επιβεβαίωση. Υπερισχύουν οι όροι της συγκεκριμένης κράτησης."
        ] },
        { heading: "Πώς να ακυρώσετε ή να ζητήσετε αλλαγή", paragraphs: [
          "Χρησιμοποιήστε τον σύνδεσμο ακύρωσης αν παρέχεται στην επιβεβαίωση ή στείλτε email στο info@villamemaj.com με τον κωδικό κράτησης και το αίτημά σας. Το μήνυμα αποτελεί αίτημα· περιμένετε την επιβεβαίωση της ακύρωσης ή αλλαγής. Αν η κράτηση έγινε μέσω τρίτης πλατφόρμας, χρησιμοποιήστε και τη διαδικασία της πλατφόρμας."
        ] },
        { heading: "Προκαταβολές, μη επιστρέψιμες τιμές και μη εμφάνιση", paragraphs: [
          "Η προκαταβολή μπορεί να είναι μη επιστρέψιμη ή να υπόκειται στους όρους της προσφοράς. Η μη επιστρέψιμη τιμή μπορεί να μην παρέχει δικαίωμα επιστροφής σε ακύρωση, εκτός αν το απαιτεί υποχρεωτική νομοθεσία ή συμφωνηθεί εξαίρεση. Οι χρεώσεις μη εμφάνισης περιορίζονται στο ποσό και στους όρους που γνωστοποιήθηκαν και επιτρέπονται από το εφαρμοστέο δίκαιο."
        ] },
        { heading: "Διεκπεραίωση επιστροφών", paragraphs: [
          "Όταν οφείλεται επιστροφή, θα την εκκινήσουμε μέσω της κατάλληλης μεθόδου πληρωμής και θα κρατήσουμε αρχείο της συναλλαγής. Ο χρόνος εμφάνισης των χρημάτων εξαρτάται ενδέχεται από τον πάροχο, τον εκδότη κάρτας ή την τράπεζα. Για μετρητά ή άλλες εκτός σύνδεσης πληρωμές, η πρακτική διαδικασία και η απόδειξη θα συμφωνούνται με το κατάλυμα."
        ] },
        { heading: "Διαμονή συγκεκριμένης ημερομηνίας και δικαιώματα καταναλωτή", paragraphs: [
          "Ορισμένα καθεστώτα προστασίας καταναλωτή εξαιρούν τη διαμονή που έχει κρατηθεί για συγκεκριμένη ημερομηνία ή περίοδο από τη συνήθη προθεσμία υπαναχώρησης 14 ημερών για συμβάσεις από απόσταση. Αυτό δεν αποτελεί καθολική δήλωση για κάθε χώρα ή κράτηση και δεν καταργεί δικαιώματα ακύρωσης που προβλέπει η επιλεγμένη τιμή ή η υποχρεωτική νομοθεσία. Επικοινωνήστε μαζί μας πριν από την κράτηση αν χρειάζεστε διευκρίνιση."
        ] },
        { heading: "Αν χρειαστεί ακύρωση από το κατάλυμα", paragraphs: [
          "Αν δεν μπορούμε να παρέχουμε επιβεβαιωμένη διαμονή, θα επικοινωνήσουμε μαζί σας για διαθέσιμες εναλλακτικές ή επιστροφή σύμφωνα με την επιβεβαίωση και την υποχρεωτική νομοθεσία. Δεν θα χαρακτηρίσουμε μια εναλλακτική ως ισοδύναμη χωρίς να εξηγήσουμε ουσιώδεις διαφορές."
        ] }
      ]
    }
  },
  houseRules: {
    en: {
      label: "During your stay",
      title: "House rules & property information",
      subtitle: "Practical information to help every guest enjoy a calm, comfortable and respectful stay.",
      updated: "19 October 2026",
      sections: [
        { heading: "Check-in and check-out", paragraphs: ["The property information provided for publication lists check-in from 12:00 to 23:00 and check-out from 08:00 to 10:00. Your booking confirmation takes precedence if it states a specific arrangement. Please share likely late-arrival needs with the property in advance."] },
        { heading: "Children, cots and extra beds", paragraphs: ["Children of any age are currently allowed. No child-specific rates, cots or extra beds are currently listed as available. Do not assume an additional bed can be provided unless the property confirms it in writing."] },
        { heading: "Smoking, pets, parties and quiet", bullets: ["Smoking is allowed under the current property settings; please be considerate of other guests and any room-specific restrictions.","Pets are not allowed.","Parties and events are not allowed.","No formal curfew or quiet hours are currently listed. Guests must still respect neighbours, building rules and applicable noise laws."], paragraphs: [] },
        { heading: "Internet and parking", paragraphs: ["Wi-Fi is listed as available free of charge in public areas. Speed and coverage may vary. Parking information refers to public-street parking; a space is not reserved or guaranteed unless the confirmation expressly says otherwise."] },
        { heading: "Guest information", paragraphs: ["A guest phone number is required for booking coordination. A postal address is not required in the online booking form under the current property settings, but the property may request details required by law or an operational need. The current information lists no general minimum age limit; the person making the booking must nevertheless be able to enter into a valid booking contract and supervise accompanying minors where required."] },
        { heading: "Occupancy, damage and cleanliness", paragraphs: ["Do not exceed the guest capacity of the accommodation or move furniture/equipment in a way that creates a safety risk. Report accidental damage, maintenance problems or lost keys promptly. Any charge for damage or extra cleaning must be handled fairly and in line with the booking terms and applicable law. No separate damage deposit is currently listed."] },
        { heading: "Long stays and accessibility", paragraphs: ["The property information says stays longer than 30 nights may be accepted up to a maximum of 90 nights, subject to availability and the agreed rate. Please contact the property before booking a monthly stay to confirm pricing, payment schedule and any additional legal requirements. Contact us to discuss accessibility or specific needs; we will confirm what can actually be provided."] }
      ]
    },
    el: {
      label: "Κατά τη διαμονή",
      title: "Κανόνες καταλύματος και πληροφορίες",
      subtitle: "Χρήσιμες πληροφορίες για μια ήρεμη, άνετη και ευχάριστη διαμονή για όλους.",
      updated: "19 Οκτωβρίου 2026",
      sections: [
        { heading: "Άφιξη και αναχώρηση", paragraphs: ["Οι πληροφορίες που δόθηκαν για δημοσίευση αναφέρουν check-in από 12:00 έως 23:00 και check-out από 08:00 έως 10:00. Η επιβεβαίωσή σας υπερισχύει αν ορίζει ειδική διευθέτηση. Ενημερώστε μας εκ των προτέρων για πιθανή καθυστερημένη άφιξη."] },
        { heading: "Παιδιά, κούνιες και επιπλέον κρεβάτια", paragraphs: ["Επί του παρόντος επιτρέπονται παιδιά κάθε ηλικίας. Δεν αναφέρονται διαθέσιμες ειδικές παιδικές τιμές, κούνιες ή επιπλέον κρεβάτια. Μην θεωρείτε δεδομένη την παροχή επιπλέον κρεβατιού αν δεν έχει επιβεβαιωθεί γραπτώς."] },
        { heading: "Κάπνισμα, κατοικίδια, πάρτι και ησυχία", bullets: ["Το κάπνισμα επιτρέπεται βάσει των τρεχουσών ρυθμίσεων· σεβαστείτε τους άλλους επισκέπτες και τυχόν περιορισμούς συγκεκριμένου δωματίου.","Τα κατοικίδια δεν επιτρέπονται.","Πάρτι και εκδηλώσεις δεν επιτρέπονται.","Δεν αναφέρεται επίσημη ώρα απαγόρευσης κυκλοφορίας ή κοινής ησυχίας. Παραμένει υποχρεωτικός ο σεβασμός στους γείτονες, στους κανόνες του κτιρίου και στους εφαρμοστέους κανόνες θορύβου."], paragraphs: [] },
        { heading: "Internet και στάθμευση", paragraphs: ["Το Wi-Fi αναφέρεται ως δωρεάν στους κοινόχρηστους χώρους. Η ταχύτητα και η κάλυψη μπορεί να διαφέρουν. Η στάθμευση αφορά δημόσιο δρόμο· δεν υπάρχει δεσμευμένη ή εγγυημένη θέση εκτός αν αναφέρεται ρητά στην επιβεβαίωση."] },
        { heading: "Στοιχεία επισκεπτών", paragraphs: ["Απαιτείται αριθμός τηλεφώνου για τον συντονισμό κράτησης. Η ταχυδρομική διεύθυνση δεν απαιτείται στην ηλεκτρονική φόρμα βάσει των τρεχουσών ρυθμίσεων, αλλά μπορεί να ζητηθούν στοιχεία που απαιτεί ο νόμος ή λειτουργική ανάγκη. Οι τρέχουσες πληροφορίες δεν αναφέρουν γενικό ελάχιστο όριο ηλικίας· ωστόσο, το άτομο που κάνει την κράτηση πρέπει να μπορεί να συνάψει έγκυρη σύμβαση και να επιβλέπει τους ανηλίκους όπου απαιτείται."] },
        { heading: "Χωρητικότητα, ζημιές και καθαριότητα", paragraphs: ["Μην υπερβαίνετε τη χωρητικότητα του καταλύματος και μην μετακινείτε εξοπλισμό με τρόπο που δημιουργεί κίνδυνο. Αναφέρετε άμεσα τυχαίες ζημιές, προβλήματα συντήρησης ή χαμένα κλειδιά. Κάθε χρέωση ζημιάς ή πρόσθετου καθαρισμού πρέπει να αντιμετωπίζεται δίκαια και σύμφωνα με τους όρους και τη νομοθεσία. Δεν αναφέρεται ξεχωριστή εγγύηση ζημιών."] },
        { heading: "Μακρά διαμονή και προσβασιμότητα", paragraphs: ["Οι πληροφορίες αναφέρουν ότι μπορούν να γίνουν δεκτές διαμονές άνω των 30 διανυκτερεύσεων έως 90 διανυκτερεύσεις, ανάλογα με τη διαθεσιμότητα και τη συμφωνημένη τιμή. Επικοινωνήστε πριν από μηνιαία διαμονή για να επιβεβαιώσετε τιμή, χρονοδιάγραμμα πληρωμής και πρόσθετες νομικές απαιτήσεις. Επικοινωνήστε επίσης για προσβασιμότητα ή ειδικές ανάγκες· θα επιβεβαιώσουμε τι μπορεί πραγματικά να παρέχεται."] }
      ]
    }
  },
  payments: {
    en: {
      label: "Secure checkout",
      title: "Payment options",
      subtitle: "Payment methods, deposits and receipts are always tied to the rate and offer shown for your reservation.",
      updated: "19 October 2026",
      sections: [
        { heading: "Methods accepted", paragraphs: ["The current direct-property settings list cash at the property. An online card payment should be used only when a secure checkout link is presented in the booking or CRM flow. Card brands accepted by a third-party booking platform do not automatically mean that the property accepts the same brands for direct payments. The available method is shown in your specific offer and confirmation."] },
        { heading: "Amount and currency", paragraphs: ["The quoted amount, currency, deposit and remaining balance must appear before you submit or pay. Do not pay an amount that does not match your booking confirmation; contact the property to verify any difference. Currency availability depends on the rate and payment provider shown."] },
        { heading: "Card security", paragraphs: ["Enter card details only on the secure hosted checkout page of the named payment provider. We do not ask for full payment-card numbers, security codes or banking passwords by email, phone message or contact form. Never share one-time bank authentication codes with property staff."] },
        { heading: "Payment confirmation and failed attempts", paragraphs: ["The booking system marks a payment as complete only after the payment provider confirms it and the server verifies the event. A successful browser redirect or bank authorisation screen is not by itself a receipt. If a payment fails, check with your bank before retrying so you do not create duplicate authorisations."] },
        { heading: "Refunds and disputes", paragraphs: ["Refund eligibility follows the cancellation terms and applicable law. Provider and bank processing times may differ. Keep the booking confirmation and receipt and contact info@villamemaj.com with your booking reference if a payment looks incorrect."] }
      ]
    },
    el: {
      label: "Ασφαλής πληρωμή",
      title: "Επιλογές πληρωμής",
      subtitle: "Οι μέθοδοι πληρωμής, προκαταβολές και αποδείξεις εξαρτώνται από την τιμή και την προσφορά της κράτησης.",
      updated: "19 Οκτωβρίου 2026",
      sections: [
        { heading: "Αποδεκτές μέθοδοι", paragraphs: ["Οι τρέχουσες ρυθμίσεις απευθείας πληρωμής αναφέρουν μετρητά στο κατάλυμα. Η ηλεκτρονική πληρωμή με κάρτα πρέπει να χρησιμοποιείται μόνο όταν παρέχεται ασφαλής σύνδεσμος πληρωμής μέσω της διαδικασίας κράτησης ή CRM. Οι κάρτες που δέχεται μια τρίτη πλατφόρμα δεν σημαίνει αυτομάτως ότι γίνονται δεκτές και για απευθείας πληρωμές. Η διαθέσιμη μέθοδος αναφέρεται στη συγκεκριμένη προσφορά και επιβεβαίωση."] },
        { heading: "Ποσό και νόμισμα", paragraphs: ["Το ποσό, το νόμισμα, η προκαταβολή και το υπόλοιπο πρέπει να εμφανίζονται πριν από την υποβολή ή πληρωμή. Μην πληρώνετε ποσό που δεν συμφωνεί με την επιβεβαίωση· επικοινωνήστε μαζί μας για επαλήθευση. Η διαθεσιμότητα νομίσματος εξαρτάται από την τιμή και τον πάροχο πληρωμών."] },
        { heading: "Ασφάλεια κάρτας", paragraphs: ["Εισάγετε στοιχεία κάρτας μόνο στην ασφαλή φιλοξενούμενη σελίδα του παρόχου πληρωμών. Δεν ζητούμε πλήρη αριθμό κάρτας, κωδικό ασφαλείας ή κωδικούς τραπεζικής πρόσβασης μέσω email, μηνύματος ή φόρμας. Μην κοινοποιείτε εφάπαξ κωδικούς τραπεζικής επιβεβαίωσης στο προσωπικό."] },
        { heading: "Επιβεβαίωση πληρωμής και αποτυχημένες προσπάθειες", paragraphs: ["Το σύστημα κράτησης καταχωρίζει πληρωμή ως ολοκληρωμένη μόνο αφού την επιβεβαιώσει ο πάροχος και επαληθευτεί το συμβάν στον διακομιστή. Η ανακατεύθυνση του προγράμματος περιήγησης ή η έγκριση της τράπεζας δεν αποτελεί από μόνη της απόδειξη. Αν αποτύχει πληρωμή, ελέγξτε με την τράπεζά σας πριν επαναλάβετε την προσπάθεια."] },
        { heading: "Επιστροφές και αμφισβητήσεις", paragraphs: ["Το δικαίωμα επιστροφής ακολουθεί τους όρους ακύρωσης και την εφαρμοστέα νομοθεσία. Οι χρόνοι διεκπεραίωσης διαφέρουν ανά πάροχο και τράπεζα. Φυλάξτε την επιβεβαίωση και την απόδειξη και επικοινωνήστε στο info@villamemaj.com με τον κωδικό κράτησης αν κάποια συναλλαγή φαίνεται λανθασμένη."] }
      ]
    }
  }
};

export function getPolicyDocument(slug: string, locale: Locale): PolicyDocument | null {
  return documents[slug]?.[locale] ?? documents[slug]?.en ?? documents[slug]?.el ?? null;
}

export const policyLinks: Record<Locale, { href: string; label: string; description: string }[]> = {
  en: [
    { href: "/terms", label: "Terms & conditions", description: "Reservation terms, guest responsibilities and applicable consumer rights." },
    { href: "/privacy", label: "Privacy policy", description: "What booking information is handled and why." },
    { href: "/cancellation", label: "Cancellation & refunds", description: "Rate-specific deadlines, cancellation and refund process." },
    { href: "/house-rules", label: "House rules", description: "Arrival times, children, smoking, pets, parking and other practical information." },
    { href: "/payments", label: "Payment options", description: "Available methods, secure checkout and payment confirmation." },
    { href: "/faq", label: "Frequently asked questions", description: "Quick answers before and during your stay." }
  ],
  el: [
    { href: "/terms", label: "Όροι κράτησης", description: "Όροι κράτησης, ευθύνες επισκεπτών και δικαιώματα καταναλωτή." },
    { href: "/privacy", label: "Πολιτική απορρήτου", description: "Ποια στοιχεία κράτησης διαχειριζόμαστε και γιατί." },
    { href: "/cancellation", label: "Ακύρωση και επιστροφές", description: "Προθεσμίες ανά τιμή, ακυρώσεις και επιστροφές." },
    { href: "/house-rules", label: "Κανόνες καταλύματος", description: "Ώρες άφιξης, παιδιά, κάπνισμα, κατοικίδια και στάθμευση." },
    { href: "/payments", label: "Επιλογές πληρωμής", description: "Μέθοδοι πληρωμής, ασφαλές checkout και επιβεβαιώσεις." },
    { href: "/faq", label: "Συχνές ερωτήσεις", description: "Σύντομες απαντήσεις πριν και κατά τη διαμονή." }
  ]
};

export type FAQItem = { q: string; a: string };
export const faq: Partial<Record<Locale, FAQItem[]>> = {
  en: [
    { q: "What are the check-in and check-out times?", a: "The current property information lists check-in from 12:00 to 23:00 and check-out from 08:00 to 10:00. Please follow any specific time confirmed for your reservation." },
    { q: "Are children allowed?", a: "Yes. Children of any age are currently allowed. No child-specific rates, cots or extra beds are currently listed as available; ask before booking if you need one." },
    { q: "Can I bring a pet?", a: "Pets are not allowed under the current property rules." },
    { q: "Is smoking allowed?", a: "The current property settings allow smoking. Please follow any room-specific instructions and be considerate of others." },
    { q: "Are parties allowed? Are there quiet hours?", a: "Parties and events are not allowed. No formal curfew or quiet hours are currently listed, but guests must respect neighbours and applicable noise rules." },
    { q: "Is Wi-Fi and parking available?", a: "Wi-Fi is listed as free in public areas. Parking information refers to public-street parking; a reserved or guaranteed space is not promised unless stated in your confirmation." },
    { q: "What payment methods can I use?", a: "The method available for your specific reservation is shown before you confirm. The current direct-property setting lists cash at the property. Use online card checkout only when a secure link is provided for your booking." },
    { q: "Can I cancel my reservation?", a: "It depends on the rate you selected. Read the cancellation deadline and refund terms in the offer and confirmation. Flexible and non-refundable rates have different conditions." },
    { q: "Do I have a 14-day cooling-off period?", a: "Accommodation reserved for a specific date or period may be excluded from the ordinary 14-day withdrawal right under some consumer-law regimes. Your rate's cancellation conditions and mandatory local rights are separate; contact us before booking if unclear." },
    { q: "Can I stay for more than 30 nights?", a: "The current property information says stays longer than 30 nights may be accepted up to a maximum of 90 nights, subject to availability, rate and confirmation." },
    { q: "How do I contact the property?", a: "Email info@villamemaj.com and include your booking reference. Do not send full payment-card details." }
  ],
  el: [
    { q: "Ποιες είναι οι ώρες άφιξης και αναχώρησης;", a: "Οι τρέχουσες πληροφορίες αναφέρουν check-in από 12:00 έως 23:00 και check-out από 08:00 έως 10:00. Ακολουθήστε τυχόν ειδική ώρα που επιβεβαιώθηκε στην κράτησή σας." },
    { q: "Επιτρέπονται τα παιδιά;", a: "Ναι, επιτρέπονται παιδιά κάθε ηλικίας. Δεν αναφέρονται διαθέσιμες ειδικές παιδικές τιμές, κούνιες ή επιπλέον κρεβάτια· ρωτήστε πριν από την κράτηση αν χρειάζεστε κάτι από αυτά." },
    { q: "Μπορώ να φέρω κατοικίδιο;", a: "Τα κατοικίδια δεν επιτρέπονται βάσει των τρεχόντων κανόνων." },
    { q: "Επιτρέπεται το κάπνισμα;", a: "Οι τρέχουσες ρυθμίσεις επιτρέπουν το κάπνισμα. Ακολουθήστε τυχόν οδηγίες συγκεκριμένου δωματίου και σεβαστείτε τους άλλους." },
    { q: "Επιτρέπονται πάρτι; Υπάρχουν ώρες κοινής ησυχίας;", a: "Πάρτι και εκδηλώσεις δεν επιτρέπονται. Δεν αναφέρονται επίσημη απαγόρευση κυκλοφορίας ή ώρες κοινής ησυχίας, αλλά πρέπει να γίνεται σεβαστή η γειτονιά και οι κανόνες θορύβου." },
    { q: "Υπάρχει Wi-Fi και στάθμευση;", a: "Το Wi-Fi αναφέρεται ως δωρεάν στους κοινόχρηστους χώρους. Η στάθμευση αφορά δημόσιο δρόμο· δεν υπόσχεται δεσμευμένη θέση εκτός αν αναφέρεται στην επιβεβαίωση." },
    { q: "Ποιες μεθόδους πληρωμής μπορώ να χρησιμοποιήσω;", a: "Η διαθέσιμη μέθοδος αναφέρεται πριν από την επιβεβαίωση της συγκεκριμένης κράτησης. Η τρέχουσα ρύθμιση απευθείας πληρωμής αναφέρει μετρητά στο κατάλυμα. Χρησιμοποιήστε ηλεκτρονική πληρωμή με κάρτα μόνο όταν παρέχεται ασφαλής σύνδεσμος." },
    { q: "Μπορώ να ακυρώσω την κράτησή μου;", a: "Εξαρτάται από την επιλεγμένη τιμή. Ελέγξτε την προθεσμία ακύρωσης και την επιστροφή χρημάτων στην προσφορά και επιβεβαίωση. Οι ευέλικτες και μη επιστρέψιμες τιμές έχουν διαφορετικούς όρους." },
    { q: "Ισχύει προθεσμία υπαναχώρησης 14 ημερών;", a: "Η διαμονή για συγκεκριμένη ημερομηνία ή περίοδο μπορεί να εξαιρείται από το συνήθες δικαίωμα υπαναχώρησης 14 ημερών σε ορισμένα καθεστώτα καταναλωτή. Οι όροι ακύρωσης της τιμής και τα υποχρεωτικά τοπικά δικαιώματα είναι ξεχωριστά· επικοινωνήστε μαζί μας αν δεν είναι σαφές." },
    { q: "Μπορώ να μείνω πάνω από 30 διανυκτερεύσεις;", a: "Οι τρέχουσες πληροφορίες αναφέρουν ότι μπορεί να γίνουν δεκτές διαμονές πάνω από 30 και έως 90 διανυκτερεύσεις, ανάλογα με διαθεσιμότητα, τιμή και επιβεβαίωση." },
    { q: "Πώς επικοινωνώ με το κατάλυμα;", a: "Στείλτε email στο info@villamemaj.com με τον κωδικό κράτησης. Μην στέλνετε πλήρη στοιχεία κάρτας." }
  ]
};
