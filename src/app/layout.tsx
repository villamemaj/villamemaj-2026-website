import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://villamemaj-2026-website.vercel.app"),
  title: {
    default: "Villa Memaj",
    template: "%s | Villa Memaj",
  },
  description: "A peaceful stay with warm hospitality and rooms designed for relaxation.",
  applicationName: "Villa Memaj",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable + " " + displayFont.variable + " h-full antialiased"}>
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
