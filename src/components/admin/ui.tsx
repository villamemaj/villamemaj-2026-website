import type { ReactNode } from "react";
import { STATUS_LABELS, STATUS_STYLES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "@/lib/admin/format";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "warn" | "good" | "info";
}) {
  const tones: Record<string, string> = {
    default: "text-slate-900",
    warn: "text-amber-700",
    good: "text-emerald-700",
    info: "text-sky-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = status ?? "unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {STATUS_LABELS[key] ?? key}
    </span>
  );
}

export function PaymentBadge({ status }: { status: string | null | undefined }) {
  const key = status ?? "unpaid";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        PAYMENT_STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {PAYMENT_STATUS_LABELS[key] ?? key}
    </span>
  );
}

export function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";
export const labelClass = "block text-xs font-medium text-slate-600 mb-1";
export const buttonClass =
  "inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60";
export const buttonSecondaryClass =
  "inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100";
