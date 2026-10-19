"use client";

import { useState, type FormEvent } from "react";

const copy = {
  en: { from: "From city or airport code", to: "Destination airport code", depart: "Departure", return: "Return (optional)", adults: "Adults", cabin: "Cabin", search: "Find flights on Skyscanner", note: "Flight search and booking are provided by Skyscanner. Flight prices, baggage rules and changes are set by the airline or seller.", originHint: "Use a 3-letter IATA city or airport code, e.g. LON.", destHint: "For Albania, TIA is Tirana International Airport; choose the airport that best fits your itinerary." },
  el: { from: "Από πόλη ή κωδικός αεροδρομίου", to: "Κωδικός αεροδρομίου προορισμού", depart: "Αναχώρηση", return: "Επιστροφή (προαιρετικά)", adults: "Ενήλικες", cabin: "Καμπίνα", search: "Αναζήτηση πτήσεων στο Skyscanner", note: "Η αναζήτηση και κράτηση πτήσεων παρέχεται από το Skyscanner. Οι τιμές, οι αποσκευές και οι αλλαγές καθορίζονται από την αεροπορική εταιρεία ή τον πωλητή.", originHint: "Χρησιμοποιήστε κωδικό IATA 3 γραμμάτων, π.χ. LON.", destHint: "Για την Αλβανία, το TIA είναι το Διεθνές Αεροδρόμιο Τιράνων· επιλέξτε το αεροδρόμιο που ταιριάζει στο ταξίδι σας." },
  fr: { from: "Ville ou code d’aéroport de départ", to: "Code d’aéroport de destination", depart: "Départ", return: "Retour (facultatif)", adults: "Adultes", cabin: "Cabine", search: "Rechercher des vols sur Skyscanner", note: "La recherche et la réservation des vols sont assurées par Skyscanner. Les tarifs, bagages et modifications sont définis par la compagnie ou le vendeur.", originHint: "Utilisez un code IATA de 3 lettres, par ex. LON.", destHint: "Pour l’Albanie, TIA désigne l’aéroport international de Tirana. Choisissez l’aéroport adapté à votre itinéraire." },
  sq: { from: "Qyteti ose kodi i aeroportit të nisjes", to: "Kodi i aeroportit të destinacionit", depart: "Nisja", return: "Kthimi (opsional)", adults: "Të rritur", cabin: "Klasa", search: "Kërko fluturime në Skyscanner", note: "Kërkimi dhe rezervimi i fluturimeve ofrohet nga Skyscanner. Çmimet, bagazhet dhe ndryshimet përcaktohen nga linja ajrore ose shitësi.", originHint: "Përdorni kod IATA me 3 shkronja, p.sh. LON.", destHint: "Për Shqipërinë, TIA është Aeroporti Ndërkombëtar i Tiranës; zgjidhni aeroportin që i përshtatet itinerarit tuaj." },
  de: { from: "Abflugstadt oder Flughafencode", to: "Zielflughafen-Code", depart: "Abflug", return: "Rückflug (optional)", adults: "Erwachsene", cabin: "Klasse", search: "Flüge auf Skyscanner suchen", note: "Flugsuche und Buchung werden von Skyscanner bereitgestellt. Preise, Gepäckregeln und Änderungen legt die Fluggesellschaft oder der Anbieter fest.", originHint: "Verwenden Sie einen dreistelligen IATA-Code, z. B. LON.", destHint: "Für Albanien steht TIA für den internationalen Flughafen Tirana. Wählen Sie den Flughafen passend zu Ihrer Reise." },
  it: { from: "Città o codice aeroporto di partenza", to: "Codice aeroporto di destinazione", depart: "Partenza", return: "Ritorno (facoltativo)", adults: "Adulti", cabin: "Cabina", search: "Cerca voli su Skyscanner", note: "La ricerca e la prenotazione dei voli sono fornite da Skyscanner. Prezzi, bagagli e modifiche sono stabiliti dalla compagnia aerea o dal venditore.", originHint: "Usa un codice IATA di 3 lettere, ad es. LON.", destHint: "Per l’Albania, TIA è l’aeroporto internazionale di Tirana; scegli l’aeroporto più adatto al tuo itinerario." },
} as const;

type SupportedLocale = keyof typeof copy;

export default function FlightFinder({ locale }: { locale: string }) {
  const language: SupportedLocale = locale in copy ? locale as SupportedLocale : "en";
  const t = copy[language];
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("TIA");
  const [outboundDate, setOutboundDate] = useState("");
  const [inboundDate, setInboundDate] = useState("");
  const [adults, setAdults] = useState("2");
  const [cabin, setCabin] = useState("economy");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const originCode = origin.trim().toUpperCase();
    const destinationCode = destination.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(originCode) || !/^[A-Z]{3}$/.test(destinationCode)) {
      setError("Please enter valid 3-letter IATA airport or city codes, for example LON and TIA.");
      return;
    }
    if (!outboundDate) {
      setError("Choose a departure date.");
      return;
    }
    if (inboundDate && inboundDate < outboundDate) {
      setError("The return date must be on or after the departure date.");
      return;
    }
    const url = new URL("/api/flights/search", window.location.origin);
    url.searchParams.set("origin", originCode);
    url.searchParams.set("destination", destinationCode);
    url.searchParams.set("outboundDate", outboundDate);
    if (inboundDate) url.searchParams.set("inboundDate", inboundDate);
    url.searchParams.set("adults", adults);
    url.searchParams.set("cabin", cabin);
    url.searchParams.set("locale", ({ el: "el-GR", en: "en-GB", fr: "fr-FR", sq: "sq-AL", de: "de-DE", it: "it-IT" } as const)[language]);
    window.location.assign(url.toString());
  }

  const field = "w-full rounded-xl border border-sand-dark bg-white px-4 py-3 text-sm text-ink outline-none focus:border-olive focus:ring-2 focus:ring-olive/20";
  return (
    <form className="flight-finder-form" onSubmit={submit}>
      <div className="flight-finder-grid">
        <label><span>{t.from}</span><input value={origin} onChange={(event) => setOrigin(event.target.value.toUpperCase())} className={field} autoComplete="off" maxLength={3} minLength={3} required placeholder="LON" aria-describedby="flight-origin-help" /><small id="flight-origin-help">{t.originHint}</small></label>
        <label><span>{t.to}</span><input value={destination} onChange={(event) => setDestination(event.target.value.toUpperCase())} className={field} autoComplete="off" maxLength={3} minLength={3} required placeholder="TIA" aria-describedby="flight-destination-help" /><small id="flight-destination-help">{t.destHint}</small></label>
        <label><span>{t.depart}</span><input type="date" value={outboundDate} onChange={(event) => setOutboundDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} className={field} required /></label>
        <label><span>{t.return}</span><input type="date" value={inboundDate} onChange={(event) => setInboundDate(event.target.value)} min={outboundDate || new Date().toISOString().slice(0, 10)} className={field} /></label>
        <label><span>{t.adults}</span><select value={adults} onChange={(event) => setAdults(event.target.value)} className={field}>{[1,2,3,4,5,6,7,8,9].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label><span>{t.cabin}</span><select value={cabin} onChange={(event) => setCabin(event.target.value)} className={field}><option value="economy">Economy</option><option value="premiumeconomy">Premium economy</option><option value="business">Business</option><option value="first">First</option></select></label>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      <button type="submit" className="button-dark mt-6 w-full justify-center">{t.search}<span aria-hidden="true">↗</span></button>
      <p className="mt-4 text-xs leading-6 text-ink-soft">{t.note} <a href="https://www.skyscanner.net/" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">Skyscanner</a>.</p>
    </form>
  );
}
