import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, inputClass, labelClass, buttonClass, buttonSecondaryClass } from "@/components/admin/ui";
import { savePolicies, updateCancellationPolicy, setCancellationPolicyPublished } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const HOUSE_ID = "00000000-0000-0000-0000-000000000001";

export default async function PoliciesPage() {
  await requireStaff(["owner", "manager"]);
  const supabase = await createSupabaseServerClient();

  const [{ data: house }, { data: policies }] = await Promise.all([
    supabase.from("hotel_house_policies").select("*").eq("id", HOUSE_ID).maybeSingle(),
    supabase.from("hotel_cancellation_policies").select("*").order("name").order("version"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Policies</h1>
        <p className="text-sm text-slate-500">
          House rules, taxes and cancellation policies. Published cancellation policies are shown to guests; each
          booking keeps a snapshot of the version that applied.
        </p>
      </div>

      <Card title="House policies & taxes">
        {!house ? (
          <p className="text-sm text-slate-500">Policy row missing.</p>
        ) : (
          <form action={savePolicies} className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Check-in time</label>
                <input name="check_in_time" defaultValue={house.check_in_time} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Check-out time</label>
                <input name="check_out_time" defaultValue={house.check_out_time} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Quiet hours</label>
                <input name="quiet_hours" defaultValue={house.quiet_hours} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tax label</label>
                <input name="tax_label" defaultValue={house.tax_label ?? ""} placeholder="e.g. City tax" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tax rate (%)</label>
                <input
                  name="tax_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={house.tax_rate ?? ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Damage deposit</label>
                <input
                  name="damage_deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={house.damage_deposit}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-slate-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="taxes_included" defaultChecked={house.taxes_included} className="h-4 w-4" />
                Taxes included in displayed price
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="smoking_allowed" defaultChecked={house.smoking_allowed} className="h-4 w-4" />
                Smoking allowed
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="pets_allowed" defaultChecked={house.pets_allowed} className="h-4 w-4" />
                Pets allowed
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="children_allowed" defaultChecked={house.children_allowed} className="h-4 w-4" />
                Children allowed
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="parties_allowed" defaultChecked={house.parties_allowed} className="h-4 w-4" />
                Parties allowed
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className={labelClass}>House rules (EN)</label>
                <textarea name="house_rules_en" defaultValue={house.house_rules_en} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>House rules (EL)</label>
                <textarea name="house_rules_el" defaultValue={house.house_rules_el} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Terms (EN)</label>
                <textarea name="terms_en" defaultValue={house.terms_en} rows={4} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Terms (EL)</label>
                <textarea name="terms_el" defaultValue={house.terms_el} rows={4} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Privacy (EN)</label>
                <textarea name="privacy_en" defaultValue={house.privacy_en} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Privacy (EL)</label>
                <textarea name="privacy_el" defaultValue={house.privacy_el} rows={3} className={inputClass} />
              </div>
            </div>

            <button className={buttonClass}>Save policies</button>
          </form>
        )}
      </Card>

      <div className="space-y-6">
        {(policies ?? []).map((policy) => (
          <Card
            key={policy.id}
            title={`${policy.name} · v${policy.version}`}
            action={
              <form action={setCancellationPolicyPublished}>
                <input type="hidden" name="policy_id" value={policy.id} />
                <input type="hidden" name="published" value={policy.published ? "false" : "true"} />
                <button
                  className={
                    policy.published
                      ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
                      : "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                  }
                >
                  {policy.published ? "Published — unpublish" : "Draft — publish"}
                </button>
              </form>
            }
          >
            <form action={updateCancellationPolicy} className="space-y-4 text-sm">
              <input type="hidden" name="policy_id" value={policy.id} />
              <div>
                <label className={labelClass}>Description</label>
                <textarea name="description" defaultValue={policy.description ?? ""} rows={2} className={inputClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelClass}>Free cancel before (hours)</label>
                  <input
                    name="free_cancel_before_hours"
                    type="number"
                    min="0"
                    defaultValue={policy.free_cancel_before_hours}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Late cancel penalty</label>
                  <select name="late_cancel_penalty_type" defaultValue={policy.late_cancel_penalty_type} className={inputClass}>
                    <option value="none">None</option>
                    <option value="first_night">First night</option>
                    <option value="percent_of_total">% of total</option>
                    <option value="full_stay">Full stay</option>
                    <option value="fixed_amount">Fixed amount</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Late cancel %</label>
                  <input
                    name="late_cancel_penalty_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={policy.late_cancel_penalty_percent}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>No-show penalty</label>
                  <select name="no_show_penalty_type" defaultValue={policy.no_show_penalty_type} className={inputClass}>
                    <option value="none">None</option>
                    <option value="first_night">First night</option>
                    <option value="percent_of_total">% of total</option>
                    <option value="full_stay">Full stay</option>
                    <option value="fixed_amount">Fixed amount</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>No-show %</label>
                  <input
                    name="no_show_penalty_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={policy.no_show_penalty_percent}
                    className={inputClass}
                  />
                </div>
                <label className="flex items-end gap-2 text-slate-600">
                  <input type="checkbox" name="non_refundable" defaultChecked={policy.non_refundable} className="mb-2 h-4 w-4" />
                  <span className="mb-2">Non-refundable</span>
                </label>
              </div>
              <button className={buttonSecondaryClass}>Save policy</button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
