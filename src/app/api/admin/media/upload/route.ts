import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getStaff } from "@/lib/admin/auth";
import { STRICT_MFA_ENROLMENT } from "@/lib/admin/mfa";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BUCKET = "hotel-media";
const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validImageSignature(type: string, bytes: Buffer): boolean {
  if (type === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/webp") return bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (type === "image/avif") return bytes.length > 12 && bytes.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(bytes.toString("ascii", 8, 16));
  return false;
}

function safeText(value: FormDataEntryValue | null, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  const staff = await getStaff();
  if (!staff.user || !staff.role) return NextResponse.json({ error: "Please sign in to the Extranet." }, { status: 401 });
  if (staff.mfa.needsVerification || (STRICT_MFA_ENROLMENT && staff.mfa.shouldEnrol)) {
    return NextResponse.json({ error: "Complete staff multi-factor authentication before managing media." }, { status: 403 });
  }
  if (!["owner", "manager"].includes(staff.role)) {
    return NextResponse.json({ error: "Only owners and managers can manage website media." }, { status: 403 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Server-side media storage is not configured." }, { status: 503 });

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid upload form." }, { status: 400 }); }

  const target = safeText(form.get("target"), 10);
  const roomId = safeText(form.get("roomId"), 80);
  const file = form.get("file");
  if (!(file instanceof File) || file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Choose an image smaller than 10 MB." }, { status: 400 });
  }
  const extension = EXTENSIONS[file.type];
  if (!extension) return NextResponse.json({ error: "Use a JPEG, PNG, WebP or AVIF image." }, { status: 415 });
  if (target !== "room" && target !== "site") return NextResponse.json({ error: "Choose a room gallery or website gallery." }, { status: 400 });

  if (target === "room") {
    if (!isUuid(roomId)) return NextResponse.json({ error: "Choose a valid room." }, { status: 400 });
    const { data: room, error } = await supabase.from("hotel_rooms").select("id").eq("id", roomId).maybeSingle();
    if (error || !room) return NextResponse.json({ error: "The selected room could not be found." }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!validImageSignature(file.type, bytes)) {
    return NextResponse.json({ error: "The file contents do not match the selected image type." }, { status: 415 });
  }

  const altEn = safeText(form.get("alt_text_en"), 250);
  const altEl = safeText(form.get("alt_text_el"), 250);
  const captionEn = safeText(form.get("caption_en"), 500);
  const captionEl = safeText(form.get("caption_el"), 500);
  const active = form.get("active") !== "false";
  const requestedCover = form.get("is_cover") === "true";
  if (altEn.length < 3 || altEl.length < 3) return NextResponse.json({ error: "Add descriptive English and Greek alt text (at least 3 characters each) for accessibility." }, { status: 400 });

  let nextOrder = 0;
  let isCover = false;
  if (target === "room") {
    const { data: photos } = await supabase
      .from("hotel_room_gallery_images")
      .select("id,is_cover")
      .eq("room_id", roomId)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    const activePhotos = photos ?? [];
    isCover = active && (requestedCover || activePhotos.length === 0);
    const { data: last } = await supabase.from("hotel_room_gallery_images")
      .select("sort_order").eq("room_id", roomId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    nextOrder = Number(last?.sort_order ?? -1) + 1;
  } else {
    const { data: last } = await supabase.from("hotel_gallery_images")
      .select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    nextOrder = Number(last?.sort_order ?? -1) + 1;
  }

  const objectId = randomUUID();
  const storagePath = target === "room"
    ? "rooms/" + roomId + "/" + objectId + "." + extension
    : "website/" + objectId + "." + extension;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: "The image could not be uploaded. Please try again." }, { status: 502 });

  const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  let inserted: unknown = null;
  let insertError: { message: string } | null = null;

  if (target === "room") {
    if (isCover) await supabase.from("hotel_room_gallery_images").update({ is_cover: false }).eq("room_id", roomId);
    const result = await supabase.from("hotel_room_gallery_images").insert({
      room_id: roomId,
      image_url: imageUrl,
      storage_path: storagePath,
      alt_text_en: altEn,
      alt_text_el: altEl,
      caption_en: captionEn || null,
      caption_el: captionEl || null,
      sort_order: nextOrder,
      is_cover: isCover,
      active,
      created_by: staff.user.id,
    }).select("*").single();
    inserted = result.data;
    insertError = result.error;
    if (!insertError && isCover) {
      await supabase.from("hotel_rooms").update({ image_url: imageUrl, updated_at: new Date().toISOString() }).eq("id", roomId);
    }
  } else {
    const result = await supabase.from("hotel_gallery_images").insert({
      image_url: imageUrl,
      storage_path: storagePath,
      alt_text_en: altEn,
      alt_text_el: altEl,
      caption_en: captionEn || null,
      caption_el: captionEl || null,
      sort_order: nextOrder,
      active,
    }).select("*").single();
    inserted = result.data;
    insertError = result.error;
  }

  if (insertError || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "The image was uploaded but could not be added to the gallery." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: inserted });
}
