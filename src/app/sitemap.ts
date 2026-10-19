import type { MetadataRoute } from "next";
import { getRooms } from "@/lib/data";
import { LOCALES, type Locale } from "@/lib/site";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://villamemaj-2026-website.vercel.app").replace(/\/+$/, "");

const coreRoutes = ["/", "/rooms", "/gallery", "/booking", "/contact", "/reviews", "/travel"];
const reviewedPolicyRoutes = ["/faq", "/policies", "/terms", "/privacy", "/cancellation", "/house-rules", "/payments", "/cookies"];

function alternatesFor(route: string, locales: Locale[]): Record<string, string> {
  const alternates = Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}${route === "/" ? "" : route}`]));
  alternates["x-default"] = `${siteUrl}/en${route === "/" ? "" : route}`;
  return alternates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const route of coreRoutes) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${siteUrl}/${locale}${route === "/" ? "" : route}`,
        lastModified: now,
        changeFrequency: route === "/" ? "weekly" : "monthly",
        priority: route === "/" ? 1 : route === "/booking" ? 0.9 : 0.7,
        alternates: { languages: alternatesFor(route, LOCALES) },
      });
    }
  }

  // Legal copy is available in reviewed English and Greek only; do not claim unreviewed
  // machine-translated policies as localized search destinations.
  for (const route of reviewedPolicyRoutes) {
    for (const locale of ["el", "en"] as const) {
      entries.push({
        url: `${siteUrl}/${locale}${route}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.45,
        alternates: { languages: alternatesFor(route, ["el", "en"]) },
      });
    }
  }

  const rooms = await getRooms();
  for (const room of rooms) {
    for (const locale of LOCALES) {
      const route = `/rooms/${room.slug}`;
      entries.push({
        url: `${siteUrl}/${locale}${route}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: alternatesFor(route, LOCALES) },
      });
    }
  }

  return entries;
}
