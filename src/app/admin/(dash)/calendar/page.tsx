import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, inputClass, labelClass, buttonClass, EmptyState } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/format";
import { blockDates, unblockDates } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const DAY = 864e5;
const WINDOW_DAYS = 21;

function addDays(iso: string, days: number): string {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY)
    .toISOString()
    .slice(0, 10);
}

interface MatrixRow {
  room_id: string;
  room_name: string;
  d: string;
  booking_code: string | null;
  status: string | null;
  blocked: boolean;
}

const STATUS_CELL: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-900",
  checked_in: "bg-indigo-100 text-indigo-900",
  hold: "bg-sky-100 text-sky-900",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  await requireStaff();
  const { start } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = start ?? today;
  const to = addDays(from, WINDOW_DAYS);

  const supabase = await createSupabaseServerClient();

  const [{ data: matrix }, { data: rooms }, { data: blocks }] = await Promise.all([
    supabase.rpc("availability_matrix", { p_from: from, p_to: to }),
    supabase.from("hotel_rooms").select("id, name_en").order("sort_order"),
    supabase
      .from("blocked_dates")
      .select("id, room_id, start_date, end_date, reason")
      .gte("end_date", from)
      .lte("start_date", to)
      .order("start_date"),
  ]);

  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(from, i));
  const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name_en]));

  const cellMap = new Map<string, MatrixRow>();
  for (const row of (matrix ?? []) as MatrixRow[]) {
    const key = `${row.room_id}:${row.d}`;
    const existing = cellMap.get(key);
    if (!existing || row.blocked) cellMap.set(key, row);
  }

  const roomList = (rooms ?? []).map((r) => r.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Availability calendar</h1>
          <p className="text-sm text-slate-500">
            {formatDate(from)} → {formatDate(to)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/calendar?start=${addDays(from, -WINDOW_DAYS)}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
            ← Previous
          </Link>
          <Link href="/admin/calendar" className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
            Today
          </Link>
          <Link href={`/admin/calendar?start=${addDays(from, WINDOW_DAYS)}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
            Next →
          </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 pb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-emerald-100" /> Confirmed</span>
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-indigo-100" /> In house</span>
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-sky-100" /> Hold</span>
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-slate-200" /> Blocked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-slate-400">Room</th>
                {days.map((day) => (
                  <th
                    key={day}
                    className={`px-1 py-2 text-center font-medium ${
                      day === today ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    <div>{day.slice(8)}</div>
                    <div className="text-[10px] uppercase">{new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "narrow" })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roomList.map((roomId) => (
                <tr key={roomId} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-left text-sm font-medium text-slate-900">
                    {roomName.get(roomId)}
                  </td>
                  {days.map((day) => {
                    const cell = cellMap.get(`${roomId}:${day}`);
                    if (cell?.blocked) {
                      return (
                        <td key={day} className="p-0.5">
                          <div className="h-8 w-8 rounded bg-slate-200" title="Blocked" />
                        </td>
                      );
                    }
                    if (cell?.booking_code) {
                      return (
                        <td key={day} className="p-0.5">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded text-[9px] font-semibold ${
                              STATUS_CELL[cell.status ?? ""] ?? "bg-slate-100 text-slate-700"
                            }`}
                            title={`${cell.booking_code} · ${cell.status}`}
                          >
                            {cell.booking_code}
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={day} className="p-0.5">
                        <div className="h-8 w-8 rounded border border-slate-100" />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {roomList.length === 0 && (
                <tr>
                  <td colSpan={days.length + 1} className="p-6 text-center text-sm text-slate-500">
                    No active rooms.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Block dates (maintenance / offline)">
          <form action={blockDates} className="space-y-3 text-sm">
            <div>
              <label className={labelClass}>Room</label>
              <select name="room_id" required className={inputClass}>
                {(rooms ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>From</label>
                <input name="start_date" type="date" required defaultValue={today} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Until (exclusive)</label>
                <input name="end_date" type="date" required defaultValue={addDays(today, 1)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Reason</label>
              <select name="reason" className={inputClass}>
                <option value="maintenance">Maintenance</option>
                <option value="renovation">Renovation</option>
                <option value="owner_use">Owner use</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button className={buttonClass}>Block dates</button>
          </form>
        </Card>

        <Card title="Upcoming blocks">
          {(blocks ?? []).length === 0 ? (
            <EmptyState>No blocks in this window.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {(blocks ?? []).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{roomName.get(b.room_id) ?? "—"}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(b.start_date)} → {formatDate(b.end_date)} · {b.reason}
                    </p>
                  </div>
                  <form action={unblockDates}>
                    <input type="hidden" name="block_id" value={b.id} />
                    <button className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
