import type { Dictionary } from "../i18n";

const dictionary: Dictionary = {
  nav: { home: "Startseite", rooms: "Zimmer", gallery: "Galerie", booking: "Buchung", contact: "Kontakt" , travel: "Reise", menu: "Menü öffnen", closeMenu: "Menü schließen", language: "Sprache wählen" },
  hero: { title: "Gastfreundschaft trifft auf das Meer", subtitle: "Ein ruhiger Rückzugsort mit Aussicht, herzlicher Gastfreundschaft und Zimmern für erholsame Stunden.", ctaRooms: "Zimmer entdecken", ctaBook: "Jetzt buchen" },
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
    ctaTitle: "Machen Sie Platz für etwas Schönes.", ctaText: "Senden Sie eine Buchungsanfrage. Wir melden uns so bald wie möglich.", ctaBook: "Buchungsanfrage"
  },
  editorialHome: {
    heroKicker: "VILLA MEMAJ",
    heroNote: "Eine persönlichere Auszeit an der Küste von Vlorë.",
    scroll: "Weiter entdecken",
    introKicker: "Die Kunst des Aufenthalts",
    introTitle: "Luxus bedeutet, Zeit zu haben und langsamer zu werden.",
    introBody: "Ein ruhiger Rhythmus, aufmerksame Gastfreundschaft und Raum zum Wohlfühlen. Jeder Aufenthalt ist auf die kleinen Momente ausgerichtet, die eine Reise unvergesslich machen.",
    introLink: "Entdecken Sie unsere Gastfreundschaft",
    momentsKicker: "Ein Aufenthalt, viele Momente",
    momentsTitle: "Genießen Sie den Ort in Ihrem eigenen Tempo.",
    momentsBody: "Vom ruhigen Morgen auf dem Balkon bis zu Abenden mit Aussicht lädt jedes Detail zum Entspannen ein.",
    roomsKicker: "Mit Sorgfalt ausgewählte Räume",
    galleryKicker: "Ein Einblick in Ihren Aufenthalt",
    galleryTitle: "Licht, Texturen und liebevolle Details.",
    galleryBody: "Entdecken Sie die Räume und Ecken, die Teil Ihrer nächsten Auszeit werden könnten.",
    quote: "Kommen Sie als Gäste. Gehen Sie mit dem Gefühl, dazuzugehören.",
    quoteNote: "Ihr Moment an der Küste",
    ctaKicker: "Ihre nächste Auszeit beginnt hier",
    ctaTitle: "Machen Sie Platz für etwas Schönes.",
    sizeLabel: "Zimmerfläche",
    capacityLabel: "Gäste pro Zimmer",
    amenitiesLabel: "Komfort bei jedem Aufenthalt",
    bookingSearch: {
      title: "Planen Sie Ihren Aufenthalt",
      arrival: "Anreise",
      departure: "Abreise",
      guests: "Gäste",
      adults: "Erwachsene",
      children: "Kinder",
      action: "Verfügbarkeit prüfen",
      note: "Wählen Sie Ihre Daten und Gästezahl. Wir bestätigen Verfügbarkeit und Endpreis, bevor die Buchung verbindlich wird.",
      invalidDates: "Die Abreise muss nach der Anreise liegen; vergangene Daten sind nicht möglich.",
      invalidGuests: "Wählen Sie mindestens einen Erwachsenen.",
    },
  },
  rooms: { title: "Zimmer und Suiten", subtitle: "Räume für Komfort, Ruhe und Erholung.", from: "ab", perNight: "€ / Nacht", guests: "Gäste", size: "Größe", viewDetails: "Details", book: "Buchen", amenities: "Ausstattung", empty: "Zimmer werden bald angezeigt. Kontaktieren Sie uns für Verfügbarkeit." },
  room: { backToRooms: "Zurück zu den Zimmern", bookThisRoom: "Dieses Zimmer buchen", notFound: "Zimmer nicht gefunden." },
  booking: { title: "Buchungsanfrage", subtitle: "Geben Sie Ihre Daten ein. Wir kontaktieren Sie zur Bestätigung der Verfügbarkeit.", roomLabel: "Zimmer", anyRoom: "Jedes verfügbare Zimmer", name: "Vollständiger Name", email: "E-Mail", phone: "Telefon", checkIn: "Anreise", checkOut: "Abreise", guests: "Anzahl der Gäste", message: "Nachricht (optional)", messagePlaceholder: "Besondere Wünsche oder Fragen…", submit: "Anfrage senden", sending: "Wird gesendet…", successTitle: "Ihre Anfrage ist eingegangen!", successText: "Vielen Dank. Wir melden uns bald zur Bestätigung.", errorText: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.", newRequest: "Neue Anfrage" },
  contact: { title: "Kontakt", subtitle: "Wir helfen Ihnen gern bei Fragen und bei Ihrer Buchung.", name: "Vollständiger Name", email: "E-Mail", subject: "Betreff", message: "Nachricht", submit: "Nachricht senden", sending: "Wird gesendet…", successTitle: "Ihre Nachricht wurde gesendet!", successText: "Vielen Dank. Wir melden uns bald.", errorText: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.", phoneLabel: "Telefon", emailLabel: "E-Mail", addressLabel: "Adresse", newMessage: "Neue Nachricht" },
  gallery: { title: "Fotogalerie", subtitle: "Räume, Details und Momente aus der Villa Memaj.", empty: "Fotos folgen in Kürze.", openImage: "Bild öffnen", closeImage: "Bild schließen", previousImage: "Vorheriges Bild", nextImage: "Nächstes Bild" },
  footer: { tagline: "Ihr ruhiger Rückzugsort für Erholung und neue Erlebnisse.", quickLinks: "Schnellzugriff", contact: "Kontakt", rights: "Alle Rechte vorbehalten." },
  amenities: { wifi: "Kostenloses WLAN", ac: "Klimaanlage", tv: "Fernseher", minibar: "Minibar", balcony: "Balkon", sea_view: "Meerblick", kitchen: "Küche", breakfast: "Frühstück", parking: "Parkplatz", workspace: "Arbeitsbereich" }
};
export default dictionary;
