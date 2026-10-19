"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/site";
import type { Dictionary } from "@/lib/i18n";

function localDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Tirane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function followingDay(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(year, month - 1, day, 12);
  next.setDate(next.getDate() + 1);
  const nextYear = next.getFullYear();
  const nextMonth = String(next.getMonth() + 1).padStart(2, "0");
  const nextDay = String(next.getDate()).padStart(2, "0");
  return nextYear + "-" + nextMonth + "-" + nextDay;
}

export default function BookingSearchPanel({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Dictionary["editorialHome"]["bookingSearch"];
}) {
  const router = useRouter();
  const today = localDate();
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [error, setError] = useState("");


  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!arrival || !departure || (today && arrival < today) || departure <= arrival) {
      setError(copy.invalidDates);
      return;
    }
    const adultCount = Number(adults);
    const childCount = Number(children);
    if (!Number.isInteger(adultCount) || adultCount < 1 || adultCount > 12 ||
        !Number.isInteger(childCount) || childCount < 0 || childCount > 12) {
      setError(copy.invalidGuests);
      return;
    }

    const query = new URLSearchParams({
      checkIn: arrival,
      checkOut: departure,
      adults: String(adultCount),
      children: String(childCount),
    });
    router.push("/" + locale + "/booking?" + query.toString());
  }

  return (
    <section className="home-booking-overlap" aria-labelledby="home-booking-title">
      <div className="home-booking-panel">
        <div className="home-booking-heading">
          <p className="section-label">{copy.title}</p>
          <span aria-hidden="true" className="home-booking-mark">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
              <path d="M7.5 3v4M16.5 3v4M3.5 10h17" />
            </svg>
          </span>
        </div>

        <form className="home-booking-fields" onSubmit={handleSubmit} aria-describedby="home-booking-note">
          <label className="home-booking-field">
            <span>{copy.arrival}</span>
            <input
              type="date"
              required
              min={today || undefined}
              value={arrival}
              onChange={(event) => {
                const value = event.target.value;
                setArrival(value);
                if (value && departure && departure <= value) setDeparture(followingDay(value));
                setError("");
              }}
            />
          </label>

          <label className="home-booking-field">
            <span>{copy.departure}</span>
            <input
              type="date"
              required
              min={arrival || today || undefined}
              value={departure}
              onChange={(event) => {
                setDeparture(event.target.value);
                setError("");
              }}
            />
          </label>

          <div className="home-booking-guests">
            <span className="home-booking-field-label">{copy.guests}</span>
            <div className="home-booking-guest-selects">
              <label>
                <span>{copy.adults}</span>
                <select value={adults} onChange={(event) => { setAdults(event.target.value); setError(""); }}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{copy.children}</span>
                <select value={children} onChange={(event) => { setChildren(event.target.value); setError(""); }}>
                  {Array.from({ length: 13 }, (_, index) => index).map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <button type="submit" className="home-booking-submit">
            {copy.action}
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        {error ? <p role="alert" className="home-booking-error">{error}</p> : null}
        <p id="home-booking-note" className="home-booking-note">{copy.note}</p>
      </div>
    </section>
  );
}
