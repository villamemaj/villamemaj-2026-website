import type { Dictionary } from "../i18n";

const dictionary: Dictionary = {
  nav: { home: "Startseite", rooms: "Zimmer", gallery: "Galerie", booking: "Buchung", contact: "Kontakt" },
  hero: { title: "Villa Memaj", subtitle: "Ein ruhiger Rückzugsort mit herzlicher Gastfreundschaft und Räumen zum Entspannen.", ctaRooms: "Zimmer entdecken", ctaBook: "Jetzt buchen" },
  home: {
    welcomeLabel: "Willkommen", welcomeTitle: "Gastfreundschaft von Herzen",
    welcomeText: "In der Villa Memaj findet jeder Moment seine Ruhe. Sorgfältig gestaltete Räume, natürliches Licht und eine entspannte Atmosphäre sorgen dafür, dass Sie sich wie zu Hause fühlen.",
    features: [
      { title: "Ruhige Lage", text: "Erholsame Tage in der Nähe von Natur und Meer." },
      { title: "Komfortable Zimmer", text: "Helle, saubere Zimmer mit modernen Annehmlichkeiten." },
      { title: "Lokaler Geschmack", text: "Entdecken Sie regionale Produkte und Erlebnisse." }
    ],
    roomsTitle: "Unsere Zimmer", roomsText: "Wählen Sie den Raum, der zu Ihnen passt.", viewAll: "Alle Zimmer ansehen",
    galleryTitle: "Momente in der Villa Memaj", galleryText: "Ein Einblick in die Räume und Atmosphäre, die Sie erwartet.",
    ctaTitle: "Bereit für Ihren Urlaub?", ctaText: "Senden Sie eine Buchungsanfrage. Wir melden uns so bald wie möglich.", ctaBook: "Buchungsanfrage"
  },
  rooms: { title: "Zimmer und Suiten", subtitle: "Räume für Komfort, Ruhe und Erholung.", from: "ab", perNight: "€ / Nacht", guests: "Gäste", size: "Größe", viewDetails: "Details", book: "Buchen", amenities: "Ausstattung", empty: "Zimmer werden bald angezeigt. Kontaktieren Sie uns für Verfügbarkeit." },
  room: { backToRooms: "Zurück zu den Zimmern", bookThisRoom: "Dieses Zimmer buchen", notFound: "Zimmer nicht gefunden." },
  booking: { title: "Buchungsanfrage", subtitle: "Geben Sie Ihre Daten ein. Wir kontaktieren Sie zur Bestätigung der Verfügbarkeit.", roomLabel: "Zimmer", anyRoom: "Jedes verfügbare Zimmer", name: "Vollständiger Name", email: "E-Mail", phone: "Telefon", checkIn: "Anreise", checkOut: "Abreise", guests: "Anzahl der Gäste", message: "Nachricht (optional)", messagePlaceholder: "Besondere Wünsche oder Fragen…", submit: "Anfrage senden", sending: "Wird gesendet…", successTitle: "Ihre Anfrage ist eingegangen!", successText: "Vielen Dank. Wir melden uns bald zur Bestätigung.", errorText: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.", newRequest: "Neue Anfrage" },
  contact: { title: "Kontakt", subtitle: "Wir helfen Ihnen gern bei Fragen und bei Ihrer Buchung.", name: "Vollständiger Name", email: "E-Mail", subject: "Betreff", message: "Nachricht", submit: "Nachricht senden", sending: "Wird gesendet…", successTitle: "Ihre Nachricht wurde gesendet!", successText: "Vielen Dank. Wir melden uns bald.", errorText: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.", phoneLabel: "Telefon", emailLabel: "E-Mail", addressLabel: "Adresse", newMessage: "Neue Nachricht" },
  gallery: { title: "Fotogalerie", subtitle: "Räume, Details und Momente aus der Villa Memaj.", empty: "Fotos folgen in Kürze." },
  footer: { tagline: "Ihr ruhiger Rückzugsort für Erholung und neue Erlebnisse.", quickLinks: "Schnellzugriff", contact: "Kontakt", rights: "Alle Rechte vorbehalten." },
  amenities: { wifi: "Kostenloses WLAN", ac: "Klimaanlage", tv: "Fernseher", minibar: "Minibar", balcony: "Balkon", sea_view: "Meerblick", kitchen: "Küche", breakfast: "Frühstück", parking: "Parkplatz", workspace: "Arbeitsbereich" }
};
export default dictionary;
