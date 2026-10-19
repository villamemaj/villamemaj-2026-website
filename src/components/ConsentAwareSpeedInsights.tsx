// Performance analytics must respect the visitor's explicit analytics preference.
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((module) => module.SpeedInsights),
  { ssr: false },
);

const STORAGE_KEY = "villa-memaj-cookie-consent-v1";
const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;

function hasAnalyticsConsent(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const value = JSON.parse(raw) as {
      version?: unknown;
      savedAt?: unknown;
      necessary?: unknown;
      analytics?: unknown;
      marketing?: unknown;
    };

    if (
      value.version !== 1 ||
      typeof value.savedAt !== "string" ||
      value.necessary !== true ||
      value.analytics !== true ||
      typeof value.marketing !== "boolean"
    ) {
      return false;
    }

    const savedAt = Date.parse(value.savedAt);
    if (!Number.isFinite(savedAt) || savedAt > Date.now()) return false;
    return Date.now() - savedAt <= CONSENT_LIFETIME;
  } catch {
    return false;
  }
}

export default function ConsentAwareSpeedInsights() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = () => setEnabled(hasAnalyticsConsent());
    const frame = window.requestAnimationFrame(syncConsent);

    window.addEventListener("villa-memaj-cookie-consent-updated", syncConsent);
    window.addEventListener("storage", syncConsent);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("villa-memaj-cookie-consent-updated", syncConsent);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  // Do not load the Speed Insights client until analytics consent is stored.
  return enabled ? <SpeedInsights /> : null;
}
