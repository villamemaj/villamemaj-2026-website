import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const locales = new Set(["el-GR", "en-GB", "fr-FR", "sq-AL", "de-DE", "it-IT"]);
const cabins = new Set(["economy", "premiumeconomy", "business", "first"]);

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return date >= today && date <= end;
}

function dateSlug(value: string): string {
  return value.replaceAll("-", "").slice(2);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const origin = (params.get("origin") || "").toUpperCase();
  const destination = (params.get("destination") || "").toUpperCase();
  const outboundDate = params.get("outboundDate") || "";
  const inboundDate = params.get("inboundDate") || "";
  const adultsRaw = Number(params.get("adults") || "1");
  const adults = Number.isInteger(adultsRaw) && adultsRaw >= 1 && adultsRaw <= 9 ? adultsRaw : null;
  const cabin = params.get("cabin") || "economy";
  const locale = params.get("locale") || "en-GB";

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) {
    return NextResponse.json({ error: "Use valid, different three-letter IATA city or airport codes." }, { status: 400 });
  }
  if (!validDate(outboundDate) || (inboundDate && (!validDate(inboundDate) || inboundDate < outboundDate))) {
    return NextResponse.json({ error: "Use valid dates within the next year; return must be on or after departure." }, { status: 400 });
  }
  if (!adults || !cabins.has(cabin) || !locales.has(locale)) {
    return NextResponse.json({ error: "Invalid passenger, cabin or language selection." }, { status: 400 });
  }

  const partnerId = process.env.SKYSCANNER_MEDIA_PARTNER_ID?.trim();
  let target: URL;
  if (partnerId && /^[A-Za-z0-9_-]{3,80}$/.test(partnerId)) {
    target = new URL("https://skyscanner.net/g/referrals/v1/flights/day-view");
    target.searchParams.set("mediaPartnerId", partnerId);
    target.searchParams.set("origin", origin);
    target.searchParams.set("destination", destination);
    target.searchParams.set("outboundDate", outboundDate);
    if (inboundDate) target.searchParams.set("inboundDate", inboundDate);
    target.searchParams.set("adultsv2", String(adults));
    target.searchParams.set("cabinclass", cabin);
    target.searchParams.set("locale", locale);
    target.searchParams.set("currency", "EUR");
    target.searchParams.set("utm_term", "villamemaj_website");
  } else {
    // Use a standard Skyscanner route until the property has its own approved partner ID.
    const path = "/transport/flights/" + origin.toLowerCase() + "/" + destination.toLowerCase() + "/" + dateSlug(outboundDate) + (inboundDate ? "/" + dateSlug(inboundDate) : "");
    target = new URL(path, "https://www.skyscanner.net");
    target.searchParams.set("adultsv2", String(adults));
    target.searchParams.set("cabinclass", cabin);
    target.searchParams.set("rtn", inboundDate ? "1" : "0");
    target.searchParams.set("currency", "EUR");
    target.searchParams.set("locale", locale);
  }
  return NextResponse.redirect(target, 302);
}
