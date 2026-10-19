import { NextResponse } from "next/server";
import { getStaff } from "@/lib/admin/auth";
import { STRICT_MFA_ENROLMENT } from "@/lib/admin/mfa";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Target = "room" | "site";
const BUCKET = "hotel-media";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function textValue(value: unknown, max: number): string | null {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}
async function access() {
  const staff = await getStaff();
  if (!staff.user || !staff.role) return { error: NextResponse.json({ error: "Please sign in to the Extranet." }, { status: 401 }) };
  if (staff.mfa.needsVerification || (STRICT_MFA_ENROLMENT && staff.mfa.shouldEnrol)) {
    return { error: NextResponse.json({ error: "Complete staff multi-factor authentication before managing media." }, { status: 403 }) };
  }
  if (!["owner", "manager"].includes(staff.role)) {
    return { error: NextResponse.json({ error: "Only owners and managers can manage website media." }, { status: 403 }) };
  }
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { error: NextResponse.json({ error: "Server-side media storage is not configured." }, { status: 503 }) };
  return { supabase };
}
function validTarget(value: unknown): value is Target { return value === "room" || value === "site"; }

export async function PATCH(request: Request) {
  const auth = await access();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { target, id } = body;
  if (!validTarget(target) || !isUuid(id)) return NextResponse.json({ error: "Choose a valid image." }, { status: 400 });
  const table = target === "room" ? "hotel_room_gallery_images" : "hotel_gallery_images";
  const { data: current, error: loadError } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (loadError || !current) return NextResponse.json({ error: "Image not found." }, { status: 404 });

  const patch: Record<string, unknown> = {};
  for (const key of ["alt_text_en", "alt_text_el"] as const) {
    if (key in body) {
      const value = textValue(body[key], 250);
      if (key === "alt_text_en" && (!value || value.length < 3)) return NextResponse.json({ error: "English alt text must contain at least 3 characters." }, { status: 400 });
      patch[key] = value ?? "";
    }
  }
  for (const key of ["caption_en", "caption_el"] as const) {
    if (key in body) patch[key] = textValue(body[key], 500) || null;
  }
  if ("sort_order" in body) {
    if (typeof body.sort_order !== "number" || !Number.isInteger(body.sort_order) || body.sort_order < 0 || body.sort_order > 9999) {
      return NextResponse.json({ error: "Image order must be between 0 and 9999." }, { status: 400 });
    }
    patch.sort_order = body.sort_order;
  }
  if ("active" in body) {
    if (typeof body.active !== "boolean") return NextResponse.json({ error: "Invalid publishing state." }, { status: 400 });
    patch.active = body.active;
  }
  if (target === "room" && "is_cover" in body) {
    if (typeof body.is_cover !== "boolean") return NextResponse.json({ error: "Invalid cover selection." }, { status: 400 });
    if (body.is_cover && body.active === false) return NextResponse.json({ error: "A hidden photo cannot be the cover." }, { status: 400 });
  }

  if (target === "room") {
    const roomId = current.room_id as string;
    const settingCover = body.is_cover === true;
    if (settingCover) {
      await supabase.from(table).update({ is_cover: false }).eq("room_id", roomId);
      patch.is_cover = true;
    } else if (body.active === false && current.is_cover === true) {
      patch.is_cover = false;
    }
    const { error: saveError } = await supabase.from(table)
      .update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (saveError) return NextResponse.json({ error: "The image changes could not be saved." }, { status: 500 });

    const { data: activePhotos } = await supabase.from(table)
      .select("id,image_url,is_cover,sort_order").eq("room_id", roomId).eq("active", true)
      .order("sort_order", { ascending: true });
    const activeRows = (activePhotos ?? []) as { id: string; image_url: string; is_cover: boolean; sort_order: number }[];
    let cover = activeRows.find((photo) => photo.is_cover);
    if (!cover && activeRows.length) {
      cover = activeRows[0];
      await supabase.from(table).update({ is_cover: true }).eq("id", cover.id);
    }
    await supabase.from("hotel_rooms").update({ image_url: cover?.image_url ?? null, updated_at: new Date().toISOString() }).eq("id", roomId);
    const { data: item } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
    return NextResponse.json({ ok: true, item });
  }

  const { error: saveError } = await supabase.from(table).update(patch).eq("id", id);
  if (saveError) return NextResponse.json({ error: "The image changes could not be saved." }, { status: 500 });
  const { data: item } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  const auth = await access();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { target, id } = body;
  if (!validTarget(target) || !isUuid(id)) return NextResponse.json({ error: "Choose a valid image." }, { status: 400 });

  const table = target === "room" ? "hotel_room_gallery_images" : "hotel_gallery_images";
  const { data: current, error: loadError } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (loadError || !current) return NextResponse.json({ error: "Image not found." }, { status: 404 });
  const roomId = target === "room" ? current.room_id as string : null;
  const storagePath = typeof current.storage_path === "string" ? current.storage_path : null;
  const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: "The image could not be removed from the gallery." }, { status: 500 });

  if (target === "room" && roomId) {
    const { data: activePhotos } = await supabase.from(table)
      .select("id,image_url,is_cover,sort_order").eq("room_id", roomId).eq("active", true)
      .order("sort_order", { ascending: true });
    const activeRows = (activePhotos ?? []) as { id: string; image_url: string; is_cover: boolean; sort_order: number }[];
    let cover = activeRows.find((photo) => photo.is_cover);
    if (!cover && activeRows.length) {
      cover = activeRows[0];
      await supabase.from(table).update({ is_cover: true }).eq("id", cover.id);
    }
    await supabase.from("hotel_rooms").update({ image_url: cover?.image_url ?? null, updated_at: new Date().toISOString() }).eq("id", roomId);
  }

  let storageCleanupPending = false;
  if (storagePath) {
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    storageCleanupPending = Boolean(error);
  }
  return NextResponse.json({ ok: true, storageCleanupPending });
}
