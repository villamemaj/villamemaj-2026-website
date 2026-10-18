import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Property manager",
    template: "%s | Villa Memaj CRM",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen bg-slate-100 text-slate-900">
        <nav aria-label="CRM quick links" className="flex justify-end border-b border-slate-200 bg-white px-4 py-2">
          <Link href="/admin/stripe-checkout" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-900">
            Stripe checkout
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
