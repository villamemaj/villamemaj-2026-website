import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { savePropertyPolicies } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Property policies",
  description: "Manage guest-facing rules and property information.",
};

type PolicyRow = {
  id: string;
  check_in_time: string;
  check_out_time: string;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  children_allowed: boolean;
  parties_allowed: boolean;
  quiet_hours: string;
  children_policy: string;
  child_rates_configured: boolean;
  cots_available: boolean;
  extra_beds_available: boolean;
  guest_address_required: boolean;
  guest_phone_required: boolean;
  minimum_check_in_age: number | null;
  curfew: string;
  internet_information: string;
  parking_information: string;
  damage_policy: string;
  additional_fees_note: string;
  accepted_payment_methods: string[] | null;
  monthly_stays_allowed: boolean;
  max_stay_nights: number;
  house_rules_en: string;
  house_rules_el: string;
  public_review_url: string;
  taxes_included: boolean;
  tax_label: string | null;
  tax_rate: number | null;
  damage_deposit: number;
  extra_fees: unknown;
  terms_en: string;
  terms_el: string;
  privacy_en: string;
  privacy_el: string;
};

function Field({ label, name, defaultValue = "", type = "text", hint }: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; hint?: string;
}) {
  return (
    <label className="admin-policy-field">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function TextField({ label, name, defaultValue = "", hint }: {
  label: string; name: string; defaultValue?: string | null; hint?: string;
}) {
  return (
    <label className="admin-policy-field admin-policy-field-wide">
      <span>{label}</span>
      <textarea name={name} rows={3} defaultValue={defaultValue ?? ""} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Toggle({ label, name, checked = false, hint }: {
  label: string; name: string; checked?: boolean; hint?: string;
}) {
  return (
    <label className="admin-policy-toggle">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span><strong>{label}</strong>{hint ? <small>{hint}</small> : null}</span>
    </label>
  );
}

export default async function PropertyPoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { supabase, role } = await requireStaff(["owner", "manager"]);
  const params = await searchParams;
  const { data, error } = await supabase
    .from("hotel_house_policies")
.select([
      "id", "check_in_time", "check_out_time", "smoking_allowed", "pets_allowed",
      "children_allowed", "parties_allowed", "quiet_hours", "children_policy",
      "child_rates_configured", "cots_available", "extra_beds_available",
      "guest_address_required", "guest_phone_required", "minimum_check_in_age",
      "curfew", "internet_information", "parking_information", "damage_policy",
      "additional_fees_note", "accepted_payment_methods", "monthly_stays_allowed",
      "max_stay_nights", "house_rules_en", "house_rules_el", "taxes_included",
      "tax_label", "tax_rate", "damage_deposit", "damage_deposit_currency",
      "extra_fees", "terms_en", "terms_el", "arrival_instructions_en",
      "arrival_instructions_el", "local_guide_en", "local_guide_el", "privacy_en",
      "privacy_el", "public_review_url"
    ].join(", "))
    .limit(1)
    .maybeSingle();

  const row = data as PolicyRow | null;
  const methods = new Set(row?.accepted_payment_methods ?? ["cash"]);
  const errorMessage = params.error === "validation"
    ? "Please review the times, age limit and maximum stay fields."
    : params.error === "save"
      ? "The database rejected the changes. Check the fields and staff permissions."
      : params.error === "load" || error
        ? "Property policies could not be loaded."
        : null;

  return (
    <div className="admin-extranet-page">
      <div className="admin-extranet-page-header">
        <div>
          <p className="admin-eyebrow">Property · Guest information</p>
          <h1>Property policies</h1>
          <p className="admin-page-intro">One source of truth for the house rules and property information shown to guests.</p>
        </div>
        <Link href="/admin/extranet" className="admin-back-link">← Extranet home</Link>
      </div>

      {params.saved === "1" ? <div role="status" className="admin-portal-alert success">Property policies saved. Updated guest-facing rules have been revalidated.</div> : null}
      {errorMessage ? <div role="alert" className="admin-portal-alert warning">{errorMessage}</div> : null}
      {!row ? (
        <div className="admin-panel"><p>Run the property policy controls database migration before editing these fields.</p></div>
      ) : (
        <form action={savePropertyPolicies} className="admin-policy-form">
          <div className="admin-policy-intro">
            <span className="admin-role-pill">{role}</span>
            <p>Changes are available to owners and managers only. Confirm local law, listing content and your booking-channel settings before changing a guest-facing rule.</p>
          </div>

          <section className="admin-policy-section">
            <div className="admin-policy-section-heading"><span>01</span><div><h2>Guest information</h2><p>Arrival, departure and information needed to complete a reservation.</p></div></div>
            <div className="admin-policy-fields">
              <Field label="Check-in information" name="check_in_time" defaultValue={row.check_in_time} hint="Example: 12:00–23:00" />
              <Field label="Check-out information" name="check_out_time" defaultValue={row.check_out_time} hint="Example: 08:00–10:00" />
              <Field label="Minimum check-in age (optional)" name="minimum_check_in_age" type="number" defaultValue={row.minimum_check_in_age} hint="Leave blank if no minimum is set." />
              <Field label="Curfew (optional)" name="curfew" defaultValue={row.curfew} hint="Leave blank if there is no curfew." />
              <Toggle label="Guest address required" name="guest_address_required" checked={row.guest_address_required} />
              <Toggle label="Guest phone number required" name="guest_phone_required" checked={row.guest_phone_required} />
            </div>
          </section>

          <section className="admin-policy-section">
            <div className="admin-policy-section-heading"><span>02</span><div><h2>Children and extra beds</h2><p>Describe what is allowed and only promise equipment and rates you can provide.</p></div></div>
            <div className="admin-policy-fields">
              <Toggle label="Children allowed" name="children_allowed" checked={row.children_allowed} />
              <Toggle label="Child-specific rates configured" name="child_rates_configured" checked={row.child_rates_configured} />
              <Toggle label="Cots available" name="cots_available" checked={row.cots_available} />
              <Toggle label="Extra beds available" name="extra_beds_available" checked={row.extra_beds_available} />
              <TextField label="Children policy" name="children_policy" defaultValue={row.children_policy} />
            </div>
          </section>

          <section className="admin-policy-section">
            <div className="admin-policy-section-heading"><span>03</span><div><h2>House rules</h2><p>These settings are public-facing; keep English and Greek wording aligned.</p></div></div>
            <div className="admin-policy-fields">
              <Toggle label="Smoking allowed" name="smoking_allowed" checked={row.smoking_allowed} />
              <Toggle label="Pets allowed" name="pets_allowed" checked={row.pets_allowed} />
              <Toggle label="Parties and events allowed" name="parties_allowed" checked={row.parties_allowed} />
              <Field label="Quiet hours (optional)" name="quiet_hours" defaultValue={row.quiet_hours} hint="Leave blank if no dedicated quiet hours are published." />
              <TextField label="House rules · English" name="house_rules_en" defaultValue={row.house_rules_en} />
              <TextField label="House rules · Greek" name="house_rules_el" defaultValue={row.house_rules_el} />
            </div>
          </section>

          <section className="admin-policy-section">
            <div className="admin-policy-section-heading"><span>04</span><div><h2>Internet, parking and extra charges</h2><p>State limitations clearly; do not promise reserved parking or unconfigured equipment.</p></div></div>
            <div className="admin-policy-fields">
              <TextField label="Internet information" name="internet_information" defaultValue={row.internet_information} />
              <TextField label="Parking information" name="parking_information" defaultValue={row.parking_information} />
              <TextField label="Additional fees and charges" name="additional_fees_note" defaultValue={row.additional_fees_note} hint="List fee, amount/currency, when it applies and whether it is mandatory." />
              <TextField label="Damage policy" name="damage_policy" defaultValue={row.damage_policy} hint="Do not invent a deposit or penalty. Document the rule and process." />
              <Field label="Maximum stay (nights)" name="max_stay_nights" type="number" defaultValue={row.max_stay_nights} hint="Between 1 and 365 nights." />
              <Toggle label="Stays longer than 30 nights allowed" name="monthly_stays_allowed" checked={row.monthly_stays_allowed} />
              <Toggle label="Taxes are included in listed rates" name="taxes_included" checked={row.taxes_included} />
            </div>
            <div className="admin-policy-fields mt-5">
              <Field label="Tax label" name="tax_label" defaultValue={row.tax_label} hint="Optional; verify with the accountant before publishing." />
              <Field label="Tax rate (%)" name="tax_rate" type="number" defaultValue={row.tax_rate} hint="Optional. Leave blank if not applicable or unknown." />
              <Field label="Public guest review URL" name="public_review_url" defaultValue={row.public_review_url} hint="Official HTTPS public listing URL only. Booking.com API review text is not copied to the public site." />
              <Field label="Damage deposit amount" name="damage_deposit" type="number" defaultValue={row.damage_deposit} hint="Use 0 if no deposit is collected." />
            </div>
          </section>

          <section className="admin-policy-section">
            <div className="admin-policy-section-heading"><span>05</span><div><h2>Guest payment options</h2><p>Payment methods you truly accept for direct reservations. Booking.com card brands do not automatically apply to this website.</p></div></div>
            <div className="admin-policy-payment-options">
              {[
                ["cash", "Cash at the property"],
                ["online_card", "Online card payment via Stripe Checkout"],
                ["bank_transfer", "Bank transfer"],
              ].map(([value, label]) => (
                <label key={value} className="admin-payment-option">
                  <input type="checkbox" name="accepted_payment_methods" value={value} defaultChecked={methods.has(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="admin-policy-note">Online card payment is only available through a secure booking-specific payment link. Live payment processing remains disabled until separately approved.</p>
          </section>

          <section className="admin-policy-section">
            <div className="admin-policy-section-heading"><span>06</span><div><h2>Custom legal text additions</h2><p>Optional property-specific additions appended to the standard website Terms and Privacy pages. Have legal counsel review any changes before publication.</p></div></div>
            <div className="admin-policy-fields">
              <TextField label="Additional booking terms · English" name="terms_en" defaultValue={row.terms_en} hint="Add only terms specific to this property. The base policy remains published." />
              <TextField label="Πρόσθετοι όροι κράτησης · Ελληνικά" name="terms_el" defaultValue={row.terms_el} hint="Προσθέστε μόνο ειδικούς όρους του καταλύματος." />
              <TextField label="Additional privacy information · English" name="privacy_en" defaultValue={row.privacy_en} hint="Describe any property-specific processing or contact route. Do not put secrets here." />
              <TextField label="Πρόσθετες πληροφορίες απορρήτου · Ελληνικά" name="privacy_el" defaultValue={row.privacy_el} hint="Μην εισάγετε κωδικούς ή μυστικά στοιχεία." />
            </div>
          </section>

          <div className="admin-policy-actions">
            <p>Last saved values come from the property settings table. Every change records the staff account and timestamp.</p>
            <button type="submit">Save property policies <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      )}
    </div>
  );
}
