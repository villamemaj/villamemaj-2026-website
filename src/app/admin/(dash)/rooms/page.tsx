import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, inputClass, labelClass, buttonClass } from "@/components/admin/ui";
import RatesEditor from "@/components/admin/RatesEditor";
import { saveRoom } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  await requireStaff(["owner", "manager", "receptionist"]);
  const supabase = await createSupabaseServerClient();

  const [{ data: rooms }, { data: rates }] = await Promise.all([
    supabase
      .from("hotel_rooms")
      .select("id, slug, name_el, name_en, description_el, description_en, capacity, size_sqm, active, sort_order")
      .order("sort_order"),
    supabase
      .from("hotel_room_rates")
      .select("room_id, currency_code, nightly_rate, is_active"),
  ]);

  const roomList = rooms ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Rooms & rates</h1>
        <p className="text-sm text-slate-500">
          Configure nightly prices per currency and room details. Prices are the base before rate-plan discounts.
        </p>
      </div>

      <Card title="Nightly rates">
        {roomList.length === 0 ? (
          <p className="text-sm text-slate-500">No rooms configured.</p>
        ) : (
          <RatesEditor
            rooms={roomList.map((r) => ({ id: r.id, name_en: r.name_en, name_el: r.name_el }))}
            rates={rates ?? []}
          />
        )}
      </Card>

      <div className="space-y-6">
        {roomList.map((room) => (
          <Card key={room.id} title={`${room.name_en} · ${room.slug}`}>
            <form action={saveRoom} className="space-y-4">
              <input type="hidden" name="room_id" value={room.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Name (EN)</label>
                  <input name="name_en" defaultValue={room.name_en} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Name (EL)</label>
                  <input name="name_el" defaultValue={room.name_el} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Capacity (guests)</label>
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    defaultValue={room.capacity}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Size (m²)</label>
                  <input
                    name="size_sqm"
                    type="number"
                    min="0"
                    defaultValue={room.size_sqm ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description (EN)</label>
                <textarea name="description_en" defaultValue={room.description_en} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description (EL)</label>
                <textarea name="description_el" defaultValue={room.description_el} rows={3} className={inputClass} />
              </div>
              <button className={buttonClass}>Save room</button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
