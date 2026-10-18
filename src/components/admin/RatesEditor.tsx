"use client";

import { useMemo, useState } from "react";
import { saveRoomRates } from "@/lib/admin/actions";
import { buttonClass } from "@/components/admin/ui";

interface Room {
  id: string;
  name_en: string;
  name_el: string;
}
interface Rate {
  room_id: string;
  currency_code: string;
  nightly_rate: number;
  is_active: boolean;
}
interface RateState {
  amount: string;
  active: boolean;
}

const CURRENCIES = ["EUR", "ALL"] as const;

export default function RatesEditor({ rooms, rates }: { rooms: Room[]; rates: Rate[] }) {
  const [state, setState] = useState<Record<string, RateState>>(() => {
    const initial: Record<string, RateState> = {};
    for (const room of rooms) {
      for (const currency of CURRENCIES) {
        const existing = rates.find(
          (r) => r.room_id === room.id && r.currency_code === currency
        );
        initial[`${room.id}:${currency}`] = {
          amount: existing ? String(existing.nightly_rate) : "",
          active: existing ? existing.is_active : true,
        };
      }
    }
    return initial;
  });

  const payload = useMemo(
    () =>
      JSON.stringify(
        rooms.flatMap((room) =>
          CURRENCIES.map((currency) => {
            const entry = state[`${room.id}:${currency}`];
            return {
              room_id: room.id,
              currency_code: currency,
              nightly_rate: Number(entry?.amount ?? 0) || 0,
              is_active: entry?.active ?? true,
            };
          })
        )
      ),
    [rooms, state]
  );

  const symbol: Record<string, string> = { EUR: "€", ALL: "L" };

  return (
    <form action={saveRoomRates} className="space-y-4">
      <input type="hidden" name="rates" value={payload} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 font-medium">Room</th>
              {CURRENCIES.map((c) => (
                <th key={c} className="py-2 font-medium">
                  Nightly rate ({c}) <span className="text-slate-300">{symbol[c]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="py-2 pr-4">
                  <span className="font-medium text-slate-900">{room.name_en}</span>
                  <p className="text-xs text-slate-400">{room.name_el}</p>
                </td>
                {CURRENCIES.map((currency) => {
                  const key = `${room.id}:${currency}`;
                  const entry = state[key];
                  return (
                    <td key={currency} className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step={currency === "EUR" ? "0.01" : "1"}
                          value={entry?.amount ?? ""}
                          onChange={(e) =>
                            setState((prev) => ({
                              ...prev,
                              [key]: { amount: e.target.value, active: prev[key]?.active ?? true },
                            }))
                          }
                          placeholder="—"
                          className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
                        />
                        <label className="flex items-center gap-1 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            checked={entry?.active ?? true}
                            onChange={(e) =>
                              setState((prev) => ({
                                ...prev,
                                [key]: { amount: prev[key]?.amount ?? "", active: e.target.checked },
                              }))
                            }
                            className="h-3.5 w-3.5"
                          />
                          on sale
                        </label>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button className={buttonClass}>Save rates</button>
        <p className="text-xs text-slate-400">
          Leave a currency blank to disable it. Prices are per night, before any rate-plan discount.
        </p>
      </div>
    </form>
  );
}
