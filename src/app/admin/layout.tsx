import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";
import Link from "next/link";
import AdminPortalNav from "@/components/admin/AdminPortalNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Villa Memaj Extranet",
    template: "%s | Villa Memaj Extranet",
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="admin-portal-body min-h-screen bg-slate-100 text-slate-900">
        <header className="admin-portal-header">
          <div className="admin-portal-header-inner">
            <Link href="/admin/extranet" className="admin-portal-brand">
              <span className="admin-portal-brand-mark" aria-hidden="true">VM</span>
              <span><strong>Villa Memaj</strong><small>Property Extranet</small></span>
            </Link>
            <div className="admin-portal-header-actions">
              <span className="admin-portal-locale">English (UK)</span>
              <Link href="/admin/account" className="admin-portal-account">Account <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </header>
        <AdminPortalNav />
        <main className="admin-portal-main">{children}</main>
      </body>
    </html>
  );
}
