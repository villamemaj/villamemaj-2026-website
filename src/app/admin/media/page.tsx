import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import MediaLibraryClient, { type MediaAsset, type MediaRoom } from "@/components/admin/MediaLibraryClient";
import SiteImagePlacements from "@/components/admin/SiteImagePlacements";
import type { SiteMediaAssignment } from "@/lib/site-media-slots";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Media library",
  description: "Manage room galleries and website imagery.",
};

export default async function MediaLibraryPage() {
  const { role } = await requireStaff(["owner", "manager"]);
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return <div className="admin-extranet-page media-page"><p className="admin-eyebrow">Property · Media</p><h1>Media library</h1><div role="alert" className="admin-portal-alert warning">Server-side media storage is not configured. Add the service-role key in Vercel&apos;s server environment.</div></div>;
  }

  const [roomsResult, roomImagesResult, siteImagesResult, siteSlotsResult] = await Promise.all([
    supabase.from("hotel_rooms").select("id,slug,name_en,name_el,image_url,active,sort_order").order("sort_order", { ascending: true }),
    supabase.from("hotel_room_gallery_images").select("*").order("sort_order", { ascending: true }),
    supabase.from("hotel_gallery_images").select("*").order("sort_order", { ascending: true }),
    supabase.from("hotel_site_media_slots").select("*"),
  ]);

  const schemaError = Boolean(roomImagesResult.error || siteImagesResult.error || siteSlotsResult.error);
  const rooms = (roomsResult.data ?? []) as MediaRoom[];
  const roomImages = (roomImagesResult.data ?? []) as MediaAsset[];
  const siteImages = (siteImagesResult.data ?? []) as MediaAsset[];
  const siteAssignments = (siteSlotsResult.data ?? []) as SiteMediaAssignment[];

  return (
    <div className="admin-extranet-page media-page">
      <div className="admin-extranet-page-header media-page-header">
        <div>
          <p className="admin-eyebrow">Property · Website content</p>
          <h1>Media library</h1>
          <p className="admin-page-intro">Manage room photography and the images guests see across your website. One clean workspace, with publishing under your control.</p>
        </div>
        <div className="media-header-actions">
          <Link href="/admin/extranet" className="admin-secondary-link">← Extranet home</Link>
          <a href="/en/gallery" target="_blank" rel="noreferrer" className="admin-primary-link">View website gallery ↗</a>
        </div>
      </div>
      <div className="media-role-note"><span className="media-status-dot" /> Editing access · {role}</div>
      {schemaError ? <div role="alert" className="admin-portal-alert warning">The media schema is not ready yet. Apply the room-gallery/media-library migration, then reload this page. Existing room and website images have not been changed.</div> : null}
      {roomsResult.error ? <div role="alert" className="admin-portal-alert warning">Room details could not be loaded.</div> : null}
      <SiteImagePlacements assignments={siteAssignments} siteImages={siteImages} />
      <MediaLibraryClient rooms={rooms} initialRoomImages={roomImages} initialSiteImages={siteImages} />
      <p className="admin-data-note">Tip: use landscape photos with a consistent style, add descriptive alt text, choose one cover per room, and publish only images approved for the website.</p>
    </div>
  );
}
