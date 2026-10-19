import type { Dictionary } from "../i18n";

const dictionary: Dictionary = {
  nav: { home: "Kryefaqja", rooms: "Dhomat", gallery: "Galeria", booking: "Rezervimi", contact: "Kontakt" },
  hero: { title: "Villa Memaj", subtitle: "Një strehë e qetë, mikpritje e ngrohtë dhe hapësira të krijuara për çlodhjen tuaj.", ctaRooms: "Shikoni dhomat", ctaBook: "Rezervoni tani" },
  home: {
    welcomeLabel: "Mirë se vini", welcomeTitle: "Mikpritje me zemër",
    welcomeText: "Në Villa Memaj çdo çast gjen qetësinë e vet. Hapësira të kuruara, dritë natyrale dhe atmosferë e rehatshme për t’u ndier si në shtëpi.",
    features: [
      { title: "Vendndodhje e qetë", text: "Një qëndrim çlodhës pranë natyrës dhe detit." },
      { title: "Dhoma komode", text: "Dhoma të ndritshme dhe të pastra me komoditete moderne." },
      { title: "Shije lokale", text: "Zbuloni prodhimet vendase dhe përvojat e zonës." }
    ],
    roomsTitle: "Dhomat tona", roomsText: "Zgjidhni hapësirën që ju përshtatet.", viewAll: "Shikoni të gjitha dhomat",
    galleryTitle: "Çaste nga Villa Memaj", galleryText: "Një pamje e hapësirave dhe atmosferës që ju pret.",
    ctaTitle: "Gati për pushime?", ctaText: "Dërgoni një kërkesë rezervimi dhe do t’ju përgjigjemi sa më shpejt.", ctaBook: "Kërkesë rezervimi"
  },
  rooms: { title: "Dhoma dhe suita", subtitle: "Hapësira të krijuara për rehati, qetësi dhe çlodhje.", from: "nga", perNight: "€ / natë", guests: "Vizitorë", size: "Sipërfaqe", viewDetails: "Detaje", book: "Rezervo", amenities: "Pajisjet", empty: "Dhomat do të shfaqen së shpejti. Na kontaktoni për disponueshmërinë." },
  room: { backToRooms: "Kthehu te dhomat", bookThisRoom: "Rezervo këtë dhomë", notFound: "Dhoma nuk u gjet." },
  booking: { title: "Kërkesë rezervimi", subtitle: "Plotësoni të dhënat dhe do t’ju kontaktojmë për të konfirmuar disponueshmërinë.", roomLabel: "Dhoma", anyRoom: "Çdo dhomë e disponueshme", name: "Emri i plotë", email: "E-mail", phone: "Telefoni", checkIn: "Regjistrimi", checkOut: "Çregjistrimi", guests: "Numri i vizitorëve", message: "Mesazh (opsional)", messagePlaceholder: "Kërkesa ose pyetje të veçanta…", submit: "Dërgo kërkesën", sending: "Duke dërguar…", successTitle: "Kërkesa juaj u mor!", successText: "Faleminderit. Do t’ju kontaktojmë së shpejti për konfirmimin.", errorText: "Ndodhi një gabim. Provoni sërish ose na kontaktoni drejtpërdrejt.", newRequest: "Kërkesë e re" },
  contact: { title: "Kontakt", subtitle: "Jemi këtu për pyetjet tuaja dhe për t’ju ndihmuar me rezervimin.", name: "Emri i plotë", email: "E-mail", subject: "Subjekti", message: "Mesazhi", submit: "Dërgo mesazhin", sending: "Duke dërguar…", successTitle: "Mesazhi u dërgua!", successText: "Faleminderit. Do t’ju përgjigjemi së shpejti.", errorText: "Ndodhi një gabim. Ju lutemi provoni sërish.", phoneLabel: "Telefoni", emailLabel: "E-mail", addressLabel: "Adresa", newMessage: "Mesazh i ri" },
  gallery: { title: "Galeria e fotove", subtitle: "Hapësira, detaje dhe çaste nga Villa Memaj.", empty: "Fotot do të shfaqen së shpejti." },
  footer: { tagline: "Streha juaj e qetë për pushim dhe përvoja të reja.", quickLinks: "Lidhje të shpejta", contact: "Kontakt", rights: "Të gjitha të drejtat e rezervuara." },
  amenities: { wifi: "Wi-Fi falas", ac: "Kondicioner", tv: "Televizor", minibar: "Minibar", balcony: "Ballkon", sea_view: "Pamje nga deti", kitchen: "Kuzhinë", breakfast: "Mëngjes", parking: "Parkim", workspace: "Hapësirë pune" }
};
export default dictionary;
