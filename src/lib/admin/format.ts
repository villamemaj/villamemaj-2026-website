export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null | undefined
): string {
  const value = Number(amount ?? 0);
  const cur = currency === "ALL" ? "ALL" : "EUR";
  return new Intl.NumberFormat(cur === "EUR" ? "en-IE" : "sq-AL", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: cur === "EUR" ? 2 : 0,
    maximumFractionDigits: cur === "EUR" ? 2 : 0,
  }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const BOOKING_STATUSES = [
  "request",
  "hold",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  request: "Request",
  hold: "Hold",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
  no_show: "No-show",
  pending: "Pending",
};

export const STATUS_STYLES: Record<string, string> = {
  request: "bg-amber-100 text-amber-800",
  hold: "bg-sky-100 text-sky-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  checked_in: "bg-indigo-100 text-indigo-800",
  checked_out: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-rose-100 text-rose-800",
  pending: "bg-amber-100 text-amber-800",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
  refund_due: "Refund due",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  unpaid: "bg-slate-100 text-slate-600",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  refund_due: "bg-rose-100 text-rose-800",
  refunded: "bg-sky-100 text-sky-800",
};

export const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  phone: "Phone",
  admin: "Admin",
  booking_com: "Booking.com",
  other: "Other",
};
