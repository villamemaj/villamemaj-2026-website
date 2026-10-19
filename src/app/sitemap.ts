import type { MetadataRoute } from "next";
import { getRooms } from "@/lib/data";
import { LOCALES } from "@/lib/site";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://villamemaj-2026-website.vercel.app").replace(/\/+$/, "");
const staticPages = ["", "/rooms", "/gallery", "/booking", "/contact", "/faq", "/policies", "/terms", "/privacy", "/cancellation", "/house-rules", "/payments", "/flights", "/reviews"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];
  for (const path of staticPages) {
    for (const locale of LOCALES) {
      const languages: Record<string, string> = {};
      for (const other of LOCALES) languages[other] = baseUrl + "/" + other + path;
      urls.push({
        url: baseUrl + "/" + locale + path,
        alternates: { languages },
      });
    }
  }

  try {
    const rooms = await getRooms();
    for (const room of rooms) {
      for (const locale of LOCALES) {
        const languages: Record<string, string> = {};
        for (const other of LOCALES) languages[other] = baseUrl + "/" + other + "/rooms/" + room.slug;
        urls.push({
          url: baseUrl + "/" + locale + "/rooms/" + room.slug,
          alternates: { languages },
        });
      }
    }
  } catch {
    // A database outage should not prevent the static public sitemap from rendering.
  }
  return urls;
}
