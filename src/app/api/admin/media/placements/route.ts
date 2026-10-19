import { NextResponse } from "next/server";
import { getStaff } from "@/lib/admin/auth";
import { STRICT_MFA_ENROLMENT } from "@/lib/admin/mfa";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { SITE_MEDIA_SLOTS, type SiteMediaSlotKey } from "@/lib/site-media-slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSlotKey(value: unknown): value is SiteMediaSlotKey {
  return typeof value === "string" && SITE_MEDIA_SLOTS.some((slot) => slot.key === value);
}
function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function safeText(value: unknown, max = 250): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function PATCH(request: Request) {
  const staff = await getStaff();
  if (!staff.user || !staff.role) return NextResponse.json({ error: "Please sign in to the Extranet." }, { status: 401 });
  if (staff.mfa.needsVerification || (STRICT_MFA_ENROLMENT && staff.mfa.shouldEnrol)) {
    return NextResponse.json({ error: "Complete staff multi-factor authentication before managing website media." }, { status: 403 });
  }
  if (!["owner", "manager"].includes(staff.role)) {
    return NextResponse.json({ error: "Only owners and managers can manage website image placements." }, { status: 403 });
  }
  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Server-side media storage is not configured." }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const slotKey = body.slotKey;
  if (!isSlotKey(slotKey)) return NextResponse.json({ error: "Choose a valid website image placement." }, { status: 400 });

  const galleryImageId = body.galleryImageId;
  if (galleryImageId === null || galleryImageId === "") {
    const { error } = await supabase.from("hotel_site_media_slots").delete().eq("slot_key", slotKey);
    if (error) return NextResponse.json({ error: "The original website image could not be restored." }, { status: 500 });
    return NextResponse.json({ ok: true, assignment: null });
  }

  if (!isUuid(galleryImageId)) return NextResponse.json({ error: "Choose an image from the website gallery." }, { status: 400 });
  const { data: image, error: imageError } = await supabase.from("hotel_gallery_images")
    .select("id,active").eq("id", galleryImageId).eq("active", true).maybeSingle();
  if (imageError || !image) return NextResponse.json({ error: "This image is not published. Publish it in the media library before assigning it to a page." }, { status: 404 });

  const altEn = safeText(body.alt_text_en);
  const altEl = safeText(body.alt_text_el);
  const { data: assignment, error } = await supabase.from("hotel_site_media_slots").upsert({
    slot_key: slotKey,
    gallery_image_id: galleryImageId,
    alt_text_en: altEn,
    alt_text_el: altEl,
    updated_by: staff.user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "slot_key" }).select("*").single();
  if (error || !assignment) return NextResponse.json({ error: "The website image placement could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true, assignment });
}
