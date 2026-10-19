"use client";

import { useMemo, useState } from "react";
import type { MediaAsset } from "@/components/admin/MediaLibraryClient";
import type { SiteMediaAssignment } from "@/lib/site-media-slots";
import { SITE_MEDIA_SLOTS, type SiteMediaSlotKey } from "@/lib/site-media-slots";

type AssignmentDraft = {
  gallery_image_id: string;
  alt_text_en: string;
  alt_text_el: string;
};

function imageLabel(image: MediaAsset): string {
  return image.alt_text_en || image.caption_en || image.image_url.split("/").at(-1) || "Website image";
}

export default function SiteImagePlacements({
  assignments,
  siteImages,
}: {
  assignments: SiteMediaAssignment[];
  siteImages: MediaAsset[];
}) {
  const publishedImages = useMemo(
    () => siteImages.filter((image) => image.active).slice().sort((a, b) => a.sort_order - b.sort_order),
    [siteImages],
  );
  const initialDrafts = useMemo(() => {
    const result: Partial<Record<SiteMediaSlotKey, AssignmentDraft>> = {};
    for (const assignment of assignments) {
      result[assignment.slot_key] = {
        gallery_image_id: assignment.gallery_image_id,
        alt_text_en: assignment.alt_text_en || "",
        alt_text_el: assignment.alt_text_el || "",
      };
    }
    return result;
  }, [assignments]);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [busyKey, setBusyKey] = useState<SiteMediaSlotKey | "">("");
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function updateDraft(key: SiteMediaSlotKey, change: Partial<AssignmentDraft>) {
    setDrafts((current) => ({
      ...current,
      [key]: { gallery_image_id: "", alt_text_en: "", alt_text_el: "", ...current[key], ...change },
    }));
  }

  async function save(key: SiteMediaSlotKey, reset = false) {
    const draft = drafts[key] ?? { gallery_image_id: "", alt_text_en: "", alt_text_el: "" };
    const galleryImageId = reset ? null : draft.gallery_image_id || null;
    if (!reset && !galleryImageId) {
      setNotice({ kind: "error", text: "Choose an uploaded website image, or select “Use original default”." });
      return;
    }
    setBusyKey(key);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/media/placements", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slotKey: key,
          galleryImageId,
          alt_text_en: reset ? "" : draft.alt_text_en,
          alt_text_el: reset ? "" : draft.alt_text_el,
        }),
      });
      const result = await response.json() as { ok?: boolean; assignment?: SiteMediaAssignment | null; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not save this website image placement.");
      setDrafts((current) => {
        const next = { ...current };
        if (result.assignment) {
          next[key] = {
            gallery_image_id: result.assignment.gallery_image_id,
            alt_text_en: result.assignment.alt_text_en || "",
            alt_text_el: result.assignment.alt_text_el || "",
          };
        } else {
          delete next[key];
        }
        return next;
      });
      setNotice({ kind: "success", text: reset ? "The original site image has been restored." : "Website image placement saved." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not save this placement." });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className="site-placement-section" aria-labelledby="site-placement-heading">
      <div className="site-placement-heading">
        <div>
          <p className="admin-eyebrow">Website design</p>
          <h2 id="site-placement-heading">Website image placements</h2>
          <p>Replace the large images and story images used across key pages without editing code. Leave a placement on its original image at any time.</p>
        </div>
        <span className="site-placement-count">{Object.keys(drafts).length} custom placements</span>
      </div>
      {notice ? <div role={notice.kind === "error" ? "alert" : "status"} className={"media-notice " + notice.kind}>{notice.text}</div> : null}

      {publishedImages.length === 0 ? (
        <div className="media-empty">
          <span aria-hidden="true">▧</span>
          <strong>Publish an image to use it here</strong>
          <p>Upload a website image in the media library and publish it first. It will then appear in these placement controls.</p>
        </div>
      ) : null}

      {["Homepage", "Page banners"].map((group) => (
        <div key={group} className="site-placement-group">
          <div className="site-placement-group-title">
            <h3>{group}</h3>
            <span>{SITE_MEDIA_SLOTS.filter((slot) => slot.group === group).length} placements</span>
          </div>
          <div className="site-placement-grid">
            {SITE_MEDIA_SLOTS.filter((slot) => slot.group === group).map((slot) => {
              const draft = drafts[slot.key] ?? { gallery_image_id: "", alt_text_en: "", alt_text_el: "" };
              const chosen = publishedImages.find((image) => image.id === draft.gallery_image_id);
              const assigned = Boolean(draft.gallery_image_id);
              return (
                <article className="site-placement-card" key={slot.key}>
                  <div className="site-placement-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={chosen?.image_url ?? slot.defaultImage} alt={draft.alt_text_en || chosen?.alt_text_en || slot.label} loading="lazy" />
                    <span className={assigned ? "site-placement-state assigned" : "site-placement-state default"}>
                      {assigned ? "Custom image" : "Original default"}
                    </span>
                  </div>
                  <div className="site-placement-card-content">
                    <h4>{slot.label}</h4>
                    <p>{slot.description}</p>
                    <label className="site-placement-field">
                      <span>Use website image</span>
                      <select value={draft.gallery_image_id} onChange={(event) => updateDraft(slot.key, { gallery_image_id: event.target.value })}>
                        <option value="">Use original default</option>
                        {publishedImages.map((image) => (
                          <option key={image.id} value={image.id}>{imageLabel(image)}</option>
                        ))}
                      </select>
                    </label>
                    {assigned ? (
                      <div className="site-placement-alt-grid">
                        <label><span>Alt text · English (optional override)</span><input value={draft.alt_text_en} maxLength={250} onChange={(event) => updateDraft(slot.key, { alt_text_en: event.target.value })} placeholder={chosen?.alt_text_en || "Use image alt text"} /></label>
                        <label><span>Alt text · Greek (optional override)</span><input value={draft.alt_text_el} maxLength={250} onChange={(event) => updateDraft(slot.key, { alt_text_el: event.target.value })} placeholder={chosen?.alt_text_el || "Use image alt text"} /></label>
                      </div>
                    ) : null}
                    <div className="site-placement-actions">
                      <button type="button" className="media-action-primary" disabled={busyKey !== ""} onClick={() => save(slot.key)}>{busyKey === slot.key ? "Saving…" : "Save placement"}</button>
                      {assigned ? <button type="button" className="media-action-secondary" disabled={busyKey !== ""} onClick={() => save(slot.key, true)}>Use original default</button> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
