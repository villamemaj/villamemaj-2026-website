import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, inputClass, labelClass, buttonClass } from "@/components/admin/ui";
import { saveRatePlan } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function RatePlansPage() {
  await requireStaff(["owner", "manager", "receptionist"]);
  const supabase = await createSupabaseServerClient();

  const [{ data: plans }, { data: policies }] = await Promise.all([
    supabase.from("rate_plans").select("*").order("sort_order"),
    supabase
      .from("hotel_cancellation_policies")
      .select("id, name, version, published")
      .order("name"),
  ]);

  const policyName = new Map((policies ?? []).map((p) => [p.id, `${p.name} v${p.version}`]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Rate plans</h1>
        <p className="text-sm text-slate-500">
          Pricing rules applied on top of nightly rates. Each plan links to a cancellation policy that is snapshotted
          onto every new booking.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {(plans ?? []).map((plan) => (
          <Card key={plan.id} title={plan.name_en}>
            <form action={saveRatePlan} className="space-y-4 text-sm">
              <input type="hidden" name="rate_plan_id" value={plan.id} />
              <p className="text-xs text-slate-400">
                Code: <span className="font-mono">{plan.code}</span> · Cancellation:{" "}
                {policyName.get(plan.cancellation_policy_id) ?? "—"}
              </p>
              <div>
                <label className={labelClass}>Name (EN)</label>
                <input name="name_en" defaultValue={plan.name_en} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Name (EL)</label>
                <input name="name_el" defaultValue={plan.name_el} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description (EN)</label>
                <textarea name="description_en" defaultValue={plan.description_en} rows={2} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description (EL)</label>
                <textarea name="description_el" defaultValue={plan.description_el} rows={2} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Discount %</label>
                  <input
                    name="discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={plan.discount_percent}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Deposit %</label>
                  <input
                    name="deposit_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={plan.deposit_percent}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Balance due</label>
                  <select name="balance_due" defaultValue={plan.balance_due} className={inputClass}>
                    <option value="arrival">At arrival</option>
                    <option value="prepaid">Prepaid</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Min stay (nights)</label>
                  <input
                    name="min_stay"
                    type="number"
                    min="1"
                    defaultValue={plan.min_stay}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" name="refundable" defaultChecked={plan.refundable} className="h-4 w-4" />
                  Refundable
                </label>
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" name="active" defaultChecked={plan.active} className="h-4 w-4" />
                  Active
                </label>
              </div>
              <button className={buttonClass}>Save plan</button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
