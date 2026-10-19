"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

export type MediaRoom = {
  id: string;
  slug: string;
  name_en: string;
  name_el: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

export type MediaAsset = {
  id: string;
  room_id?: string;
  image_url: string;
  storage_path?: string | null;
  alt_text_en?: string | null;
  alt_text_el?: string | null;
  caption_en?: string | null;
  caption_el?: string | null;
  sort_order: number;
  active: boolean;
  is_cover?: boolean;
  created_at?: string;
};

type Target = "room" | "site";
type QueuedFile = {
  key: string;
  file: File;
  alt_text_en: string;
  alt_text_el: string;
  caption_en: string;
  caption_el: string;
};

function readableFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function MediaLibraryClient({
  rooms,
  initialRoomImages,
  initialSiteImages,
}: {
  rooms: MediaRoom[];
  initialRoomImages: MediaAsset[];
  initialSiteImages: MediaAsset[];
}) {
  const [target, setTarget] = useState<Target>("room");
  const [roomId, setRoomId] = useState(rooms.find((room) => room.active)?.id ?? rooms[0]?.id ?? "");
  const [roomImages, setRoomImages] = useState(initialRoomImages);
  const [siteImages, setSiteImages] = useState(initialSiteImages);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [publishOnUpload, setPublishOnUpload] = useState(true);
  const [makeCover, setMakeCover] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedRoom = rooms.find((room) => room.id === roomId);
  const activeImages = useMemo(() => {
    const source = target === "room" ? roomImages.filter((image) => image.room_id === roomId) : siteImages;
    const q = search.trim().toLowerCase();
    return source.slice().sort((a, b) => a.sort_order - b.sort_order)
      .filter((image) => !q || [image.alt_text_en, image.alt_text_el, image.caption_en, image.caption_el, image.image_url].some((value) => (value ?? "").toLowerCase().includes(q)));
  }, [target, roomImages, siteImages, roomId, search]);

  function addFiles(files: File[]) {
    if (files.length + queue.length > 12) {
      setNotice({ kind: "error", text: "Choose up to 12 images per upload batch." });
      return;
    }
    const invalid = files.find((file) => file.size <= 0 || file.size > 10 * 1024 * 1024);
    if (invalid) {
      setNotice({ kind: "error", text: invalid.name + " is empty or larger than 10 MB." });
      return;
    }
    const notImage = files.find((file) => !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type));
    if (notImage) {
      setNotice({ kind: "error", text: notImage.name + " is not a supported image type." });
      return;
    }
    setQueue((current) => current.concat(files.map((file) => ({
      key: crypto.randomUUID(),
      file,
      alt_text_en: readableFilename(file.name).slice(0, 240),
      alt_text_el: "",
      caption_en: "",
      caption_el: "",
    }))));
    setNotice(null);
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    addFiles(files);
  }

  function updateQueue(key: string, changes: Partial<QueuedFile>) {
    setQueue((current) => current.map((item) => item.key === key ? { ...item, ...changes } : item));
  }

  async function uploadQueue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (queue.length === 0) return;
    if (target === "room" && !roomId) {
      setNotice({ kind: "error", text: "Create or select a room before adding room photos." });
      return;
    }
    const missingAlt = queue.find((item) => item.alt_text_en.trim().length < 3);
    if (missingAlt) {
      setNotice({ kind: "error", text: "Each image needs descriptive English alt text before it can be uploaded." });
      return;
    }
    setUploading(true);
    setNotice(null);
    let completed = 0;
    try {
      for (const [index, item] of queue.entries()) {
        const form = new FormData();
        form.append("file", item.file);
        form.append("target", target);
        form.append("roomId", target === "room" ? roomId : "");
        form.append("alt_text_en", item.alt_text_en);
        form.append("alt_text_el", item.alt_text_el);
        form.append("caption_en", item.caption_en);
        form.append("caption_el", item.caption_el);
        form.append("active", String(publishOnUpload));
        form.append("is_cover", String(target === "room" && makeCover && index === 0));
        const response = await fetch("/api/admin/media/upload", { method: "POST", body: form });
        const result = await response.json() as { ok?: boolean; item?: MediaAsset; error?: string };
        if (!response.ok || !result.item) throw new Error(result.error || "An image could not be uploaded.");
        if (target === "room") setRoomImages((current) => [result.item!, ...current.map((image) => result.item?.is_cover && image.room_id === roomId ? { ...image, is_cover: false } : image)]);
        else setSiteImages((current) => [result.item!, ...current]);
        completed += 1;
      }
      setQueue([]);
      setNotice({ kind: "success", text: completed + (completed === 1 ? " image uploaded." : " images uploaded.") + (publishOnUpload ? " They are published on the website." : " They remain drafts until you publish them.") });
    } catch (error) {
      setNotice({ kind: "error", text: (error instanceof Error ? error.message : "Upload failed.") + " Successfully uploaded items remain saved." });
    } finally {
      setUploading(false);
    }
  }

  async function mutate(item: MediaAsset, changes: Record<string, unknown>) {
    setBusyId(item.id);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/media/manage", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, id: item.id, ...changes }),
      });
      const result = await response.json() as { ok?: boolean; item?: MediaAsset; error?: string };
      if (!response.ok || !result.item) throw new Error(result.error || "Could not save image changes.");
      if (target === "room") {
        setRoomImages((current) => {
          let next = current.map((image) => {
            if (image.id === item.id) return result.item!;
            if (changes.is_cover === true && image.room_id === roomId) return { ...image, is_cover: false };
            return image;
          });
          const roomPhotos = next.filter((image) => image.room_id === roomId && image.active).sort((a, b) => a.sort_order - b.sort_order);
          if (roomPhotos.length && !roomPhotos.some((image) => image.is_cover)) {
            const firstId = roomPhotos[0].id;
            next = next.map((image) => image.room_id === roomId ? { ...image, is_cover: image.id === firstId } : image);
          }
          return next;
        });
      } else {
        setSiteImages((current) => current.map((image) => image.id === item.id ? result.item! : image));
      }
      setNotice({ kind: "success", text: "Image changes saved." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not save image changes." });
    } finally {
      setBusyId("");
    }
  }

  async function remove(item: MediaAsset) {
    if (!window.confirm("Remove this image from the gallery? This cannot be undone.")) return;
    setBusyId(item.id);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/media/manage", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, id: item.id }),
      });
      const result = await response.json() as { ok?: boolean; storageCleanupPending?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not remove the image.");
      if (target === "room") setRoomImages((current) => {
        let next = current.filter((image) => image.id !== item.id);
        const roomPhotos = next.filter((image) => image.room_id === roomId && image.active).sort((a, b) => a.sort_order - b.sort_order);
        if (roomPhotos.length && !roomPhotos.some((image) => image.is_cover)) {
          const firstId = roomPhotos[0].id;
          next = next.map((image) => image.room_id === roomId ? { ...image, is_cover: image.id === firstId } : image);
        }
        return next;
      });
      else setSiteImages((current) => current.filter((image) => image.id !== item.id));
      setNotice({ kind: result.storageCleanupPending ? "error" : "success", text: result.storageCleanupPending ? "Image removed from the website, but its stored file needs cleanup." : "Image removed." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not remove the image." });
    } finally {
      setBusyId("");
    }
  }

  const roomCount = roomImages.length;
  const roomPublished = roomImages.filter((image) => image.active).length;
  const sitePublished = siteImages.filter((image) => image.active).length;

  return (
    <div className="media-library">
      <div className="media-overview">
        <article><span>Room photos</span><strong>{roomCount}</strong><small>Across all rooms</small></article>
        <article><span>Published room photos</span><strong>{roomPublished}</strong><small>Visible on active room pages</small></article>
        <article><span>Website gallery</span><strong>{siteImages.length}</strong><small>{sitePublished} published</small></article>
      </div>

      <div className="media-tab-row" role="tablist" aria-label="Choose an image collection">
        <button type="button" role="tab" aria-selected={target === "room"} className={target === "room" ? "active" : ""} onClick={() => { setTarget("room"); setSearch(""); }}>Room galleries <span>{roomCount}</span></button>
        <button type="button" role="tab" aria-selected={target === "site"} className={target === "site" ? "active" : ""} onClick={() => { setTarget("site"); setSearch(""); }}>Website gallery <span>{siteImages.length}</span></button>
      </div>

      <section className="media-upload-card" aria-labelledby="media-upload-title">
        <div className="media-section-title">
          <div><p className="admin-eyebrow">Add imagery</p><h2 id="media-upload-title">Upload photos</h2><p>JPEG, PNG, WebP or AVIF · up to 10 MB each.</p></div>
          <span className="media-upload-mark" aria-hidden="true">＋</span>
        </div>
        <form onSubmit={uploadQueue}>
          {target === "room" ? (
            <label className="media-form-field media-room-select"><span>Room</span>
              <select value={roomId} onChange={(event) => setRoomId(event.target.value)} required>
                <option value="">Choose a room</option>
                {rooms.map((room) => <option key={room.id} value={room.id}>{room.name_en || room.slug} · {room.name_el || room.slug}{room.active ? "" : " (hidden)"}</option>)}
              </select>
            </label>
          ) : <p className="media-form-hint">These images appear on the public website gallery.</p>}

          <button className="media-dropzone" type="button" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}>
            <span className="media-dropzone-icon">↑</span><strong>Choose images</strong><span>or drag them here</span><small>Upload originals; use descriptive, guest-friendly names.</small>
          </button>
          <input ref={fileInput} className="media-hidden-input" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={selectFiles} />

          {queue.length > 0 ? (
            <div className="media-upload-queue">
              <div className="media-queue-heading"><strong>{queue.length} selected</strong><button type="button" className="media-text-button" onClick={() => setQueue([])}>Clear selection</button></div>
              {queue.map((item) => (
                <div className="media-queue-item" key={item.key}>
                  <div><strong>{item.file.name}</strong><small>{formatBytes(item.file.size)}</small></div>
                  <label><span>Alt text · English</span><input value={item.alt_text_en} maxLength={250} required onChange={(event) => updateQueue(item.key, { alt_text_en: event.target.value })} placeholder="Describe what the photo shows" /></label>
                  <label><span>Alt text · Greek</span><input value={item.alt_text_el} maxLength={250} onChange={(event) => updateQueue(item.key, { alt_text_el: event.target.value })} placeholder="Περιγράψτε τη φωτογραφία" /></label>
                  <div className="media-queue-caption-grid">
                    <label><span>Caption · English (optional)</span><input value={item.caption_en} maxLength={500} onChange={(event) => updateQueue(item.key, { caption_en: event.target.value })} /></label>
                    <label><span>Caption · Greek (optional)</span><input value={item.caption_el} maxLength={500} onChange={(event) => updateQueue(item.key, { caption_el: event.target.value })} /></label>
                  </div>
                  <button type="button" className="media-text-button" onClick={() => setQueue((current) => current.filter((file) => file.key !== item.key))}>Remove file</button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="media-upload-options">
            <label><input type="checkbox" checked={publishOnUpload} onChange={(event) => setPublishOnUpload(event.target.checked)} /><span><strong>Publish on the website</strong><small>Uncheck to upload as a draft.</small></span></label>
            {target === "room" ? <label><input type="checkbox" checked={makeCover} onChange={(event) => setMakeCover(event.target.checked)} /><span><strong>Use first photo as room cover</strong><small>Replaces the current cover photo.</small></span></label> : null}
          </div>

          <div className="media-upload-footer">
            <p>Each image keeps its own alt text and caption. You can edit or unpublish it later.</p>
            <button type="submit" className="admin-primary-link" disabled={uploading || queue.length === 0}>{uploading ? "Uploading…" : "Upload " + queue.length + (queue.length === 1 ? " image" : " images")} <span aria-hidden="true">↑</span></button>
          </div>
        </form>
      </section>

      {notice ? <div role={notice.kind === "error" ? "alert" : "status"} className={"media-notice " + notice.kind}>{notice.text}</div> : null}

      <section className="media-assets-section">
        <div className="media-assets-heading">
          <div><p className="admin-eyebrow">{target === "room" ? "Room gallery" : "Website gallery"}</p><h2>{target === "room" ? selectedRoom?.name_en || "Choose a room" : "Website images"}</h2><p>{target === "room" ? "Choose a room to edit its photos, cover image and photo order." : "Manage the images featured in the public website gallery."}</p></div>
          <label className="media-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search images" aria-label="Search images" /></label>
        </div>
        {target === "room" && !selectedRoom ? <div className="media-empty"><strong>No room selected</strong><p>Add rooms in Rooms &amp; facilities before creating room galleries.</p></div> : null}
        {activeImages.length > 0 ? (
          <div className="media-assets-grid">
            {activeImages.map((item) => (
              <MediaAssetCard key={target + item.id} item={item} target={target} busy={busyId === item.id} onSave={(changes) => mutate(item, changes)} onRemove={() => remove(item)} />
            ))}
          </div>
        ) : selectedRoom || target === "site" ? (
          <div className="media-empty"><span aria-hidden="true">▧</span><strong>{search ? "No matching images" : "A fresh canvas"}</strong><p>{search ? "Try a shorter search term." : target === "room" ? "Upload a few photos to create this room’s gallery. Choose a cover image to feature it on the rooms page." : "Upload your best property photos. Published images will appear on the website gallery."}</p><button type="button" className="media-text-button" onClick={() => fileInput.current?.click()}>Choose images ↗</button></div>
        ) : null}
      </section>
    </div>
  );
}

function MediaAssetCard({
  item,
  target,
  busy,
  onSave,
  onRemove,
}: {
  item: MediaAsset;
  target: Target;
  busy: boolean;
  onSave: (changes: Record<string, unknown>) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [altEn, setAltEn] = useState(item.alt_text_en ?? "");
  const [altEl, setAltEl] = useState(item.alt_text_el ?? "");
  const [captionEn, setCaptionEn] = useState(item.caption_en ?? "");
  const [captionEl, setCaptionEl] = useState(item.caption_el ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sort_order));

  return (
    <article className="media-asset-card">
      <div className="media-asset-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt={(item.alt_text_en || item.caption_en || "Gallery photo")} loading="lazy" />
        <div className="media-asset-badges">
          <span className={item.active ? "media-state published" : "media-state draft"}>{item.active ? "Published" : "Draft"}</span>
          {target === "room" && item.is_cover ? <span className="media-state cover">Room cover</span> : null}
        </div>
        <span className="media-order">#{item.sort_order + 1}</span>
      </div>
      <div className="media-asset-editor">
        <label><span>Alt text · English</span><input value={altEn} maxLength={250} onChange={(event) => setAltEn(event.target.value)} /></label>
        <label><span>Alt text · Greek</span><input value={altEl} maxLength={250} onChange={(event) => setAltEl(event.target.value)} /></label>
        <div className="media-queue-caption-grid">
          <label><span>Caption · English</span><input value={captionEn} maxLength={500} onChange={(event) => setCaptionEn(event.target.value)} /></label>
          <label><span>Caption · Greek</span><input value={captionEl} maxLength={500} onChange={(event) => setCaptionEl(event.target.value)} /></label>
        </div>
        <label className="media-order-field"><span>Display order</span><input type="number" min={0} max={9999} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label>
        <div className="media-asset-actions">
          <button type="button" className="media-action-primary" disabled={busy} onClick={() => onSave({ alt_text_en: altEn, alt_text_el: altEl, caption_en: captionEn, caption_el: captionEl, sort_order: Number(sortOrder) })}>{busy ? "Saving…" : "Save details"}</button>
          <button type="button" className="media-action-secondary" disabled={busy} onClick={() => onSave({ active: !item.active })}>{item.active ? "Unpublish" : "Publish"}</button>
          {target === "room" && !item.is_cover && item.active ? <button type="button" className="media-action-secondary" disabled={busy} onClick={() => onSave({ is_cover: true })}>Set as cover</button> : null}
          <button type="button" className="media-action-danger" disabled={busy} onClick={onRemove}>Remove</button>
        </div>
      </div>
    </article>
  );
}
