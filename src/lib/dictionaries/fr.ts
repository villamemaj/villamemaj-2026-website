import type { Dictionary } from "../i18n";

const dictionary: Dictionary = {
  nav: { home: "Accueil", rooms: "Chambres", gallery: "Galerie", booking: "Réserver", contact: "Contact" , travel: "Voyage"},
  hero: { title: "Villa Memaj", subtitle: "Un refuge paisible, une hospitalité chaleureuse et des espaces pensés pour votre détente.", ctaRooms: "Découvrir les chambres", ctaBook: "Réserver" },
  home: {
    welcomeLabel: "Bienvenue", welcomeTitle: "L’hospitalité avec le cœur",
    welcomeText: "À Villa Memaj, chaque instant trouve son calme. Des espaces soignés, une lumière naturelle et une atmosphère détendue pour vous sentir chez vous.",
    features: [
      { title: "Un cadre paisible", text: "Un séjour reposant, à proximité de la nature et de la mer." },
      { title: "Des chambres confortables", text: "Des espaces lumineux, propres et dotés de commodités modernes." },
      { title: "Saveurs locales", text: "Découvrez les produits locaux et les expériences de la région." }
    ],
    roomsTitle: "Nos chambres", roomsText: "Choisissez l’espace qui vous convient.", viewAll: "Voir toutes les chambres",
    galleryTitle: "Instants à Villa Memaj", galleryText: "Un aperçu des espaces et de l’atmosphère qui vous attendent.",
    ctaTitle: "Prêt pour vos vacances ?", ctaText: "Envoyez une demande de réservation et nous vous répondrons dès que possible.", ctaBook: "Demande de réservation"
  },
  rooms: { title: "Chambres et suites", subtitle: "Des espaces conçus pour le confort, le calme et la détente.", from: "à partir de", perNight: "€ / nuit", guests: "Voyageurs", size: "Surface", viewDetails: "Détails", book: "Réserver", amenities: "Équipements", empty: "Les chambres seront bientôt affichées. Contactez-nous pour connaître les disponibilités." },
  room: { backToRooms: "Retour aux chambres", bookThisRoom: "Réserver cette chambre", notFound: "Chambre introuvable." },
  booking: { title: "Demande de réservation", subtitle: "Renseignez vos coordonnées et nous vous contacterons pour confirmer la disponibilité.", roomLabel: "Chambre", anyRoom: "Toute chambre disponible", name: "Nom complet", email: "E-mail", phone: "Téléphone", checkIn: "Arrivée", checkOut: "Départ", guests: "Nombre de voyageurs", message: "Message (facultatif)", messagePlaceholder: "Demandes particulières ou questions…", submit: "Envoyer la demande", sending: "Envoi…", successTitle: "Votre demande a été reçue !", successText: "Merci. Nous vous contacterons prochainement pour confirmer votre réservation.", errorText: "Une erreur s’est produite. Réessayez ou contactez-nous directement.", newRequest: "Nouvelle demande" },
  contact: { title: "Contact", subtitle: "Nous sommes là pour répondre à vos questions et vous aider avec votre réservation.", name: "Nom complet", email: "E-mail", subject: "Sujet", message: "Message", submit: "Envoyer le message", sending: "Envoi…", successTitle: "Votre message a été envoyé !", successText: "Merci. Nous vous répondrons bientôt.", errorText: "Une erreur s’est produite. Veuillez réessayer.", phoneLabel: "Téléphone", emailLabel: "E-mail", addressLabel: "Adresse", newMessage: "Nouveau message" },
  gallery: { title: "Galerie photos", subtitle: "Espaces, détails et instants de Villa Memaj.", empty: "Les photos seront bientôt disponibles." },
  footer: { tagline: "Votre refuge paisible pour vous reposer et découvrir la région.", quickLinks: "Liens rapides", contact: "Contact", rights: "Tous droits réservés." },
  amenities: { wifi: "Wi-Fi gratuit", ac: "Climatisation", tv: "Télévision", minibar: "Minibar", balcony: "Balcon", sea_view: "Vue sur la mer", kitchen: "Cuisine", breakfast: "Petit-déjeuner", parking: "Parking", workspace: "Espace de travail" }
};
export default dictionary;
