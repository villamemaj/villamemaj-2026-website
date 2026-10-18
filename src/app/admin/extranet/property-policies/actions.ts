"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";

function readText(formData: FormData, key: string, max = 1000): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function readCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function savePropertyPolicies(formData: FormData) {
  const { supabase, userId } = await requireStaff(["owner", "manager"]);
  const checkIn = readText(formData, "check_in_time", 80);
  const checkOut = readText(formData, "check_out_time", 80);
  const maxNights = Number(readText(formData, "max_stay_nights", 3) || "90");
  const minAgeRaw = readText(formData, "minimum_check_in_age", 3);
  const minimumAge = minAgeRaw === "" ? null : Number(minAgeRaw);
  const taxRateRaw = readText(formData, "tax_rate", 8);
  const taxRate = taxRateRaw === "" ? null : Number(taxRateRaw);
  const damageDepositRaw = readText(formData, "damage_deposit", 12) || "0";
  const damageDeposit = Number(damageDepositRaw);

  if (!checkIn || !checkOut || !Number.isInteger(maxNights) || maxNights < 1 || maxNights > 365) {
    redirect("/admin/extranet/property-policies?error=validation");
  }
  if (minimumAge !== null && (!Number.isInteger(minimumAge) || minimumAge < 0 || minimumAge > 120)) {
    redirect("/admin/extranet/property-policies?error=validation");
  }
  if (taxRate !== null && (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100)) {
    redirect("/admin/extranet/property-policies?error=validation");
  }
  if (!Number.isFinite(damageDeposit) || damageDeposit < 0 || damageDeposit > 1000000) {
    redirect("/admin/extranet/property-policies?error=validation");
  }

  const allowedMethods = new Set(["cash", "online_card", "bank_transfer"]);
  const methods = formData.getAll("accepted_payment_methods")
    .filter((value): value is string => typeof value === "string" && allowedMethods.has(value));
  if (methods.length === 0) methods.push("cash");

  const { data: existing, error: readError } = await supabase
    .from("hotel_house_policies")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (readError || !existing) {
    redirect("/admin/extranet/property-policies?error=load");
  }

  const patch = {
    check_in_time: checkIn,
    check_out_time: checkOut,
    smoking_allowed: readCheckbox(formData, "smoking_allowed"),
    pets_allowed: readCheckbox(formData, "pets_allowed"),
    children_allowed: readCheckbox(formData, "children_allowed"),
    parties_allowed: readCheckbox(formData, "parties_allowed"),
    quiet_hours: readText(formData, "quiet_hours", 120),
    children_policy: readText(formData, "children_policy", 1000),
    child_rates_configured: readCheckbox(formData, "child_rates_configured"),
    cots_available: readCheckbox(formData, "cots_available"),
    extra_beds_available: readCheckbox(formData, "extra_beds_available"),
    guest_address_required: readCheckbox(formData, "guest_address_required"),
    guest_phone_required: readCheckbox(formData, "guest_phone_required"),
    minimum_check_in_age: minimumAge,
    curfew: readText(formData, "curfew", 100),
    internet_information: readText(formData, "internet_information", 1000),
    parking_information: readText(formData, "parking_information", 1000),
    damage_policy: readText(formData, "damage_policy", 1200),
    additional_fees_note: readText(formData, "additional_fees_note", 2000),
    accepted_payment_methods: methods,
    taxes_included: readCheckbox(formData, "taxes_included"),
    tax_label: readText(formData, "tax_label", 120) || null,
    tax_rate: taxRate,
    damage_deposit: damageDeposit,
    terms_en: readText(formData, "terms_en", 6000),
    terms_el: readText(formData, "terms_el", 6000),
    privacy_en: readText(formData, "privacy_en", 6000),
    privacy_el: readText(formData, "privacy_el", 6000),
    monthly_stays_allowed: readCheckbox(formData, "monthly_stays_allowed"),
    max_stay_nights: maxNights,
    house_rules_en: readText(formData, "house_rules_en", 2000),
    house_rules_el: readText(formData, "house_rules_el", 2000),
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("hotel_house_policies")
    .update(patch)
    .eq("id", existing.id);

  if (error) {
    redirect("/admin/extranet/property-policies?error=save");
  }

  revalidatePath("/admin/extranet/property-policies");
  revalidatePath("/en/house-rules");
  revalidatePath("/el/house-rules");
  revalidatePath("/en/payments");
  revalidatePath("/el/payments");
  redirect("/admin/extranet/property-policies?saved=1");
}
