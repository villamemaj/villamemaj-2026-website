import type { HotelRoomGalleryImage } from "@/lib/types";

export default function RoomPhotoGallery({
  images,
  locale,
  roomName,
}: {
  images: HotelRoomGalleryImage[];
  locale: "el" | "en" | "fr" | "sq" | "de" | "it";
  roomName: string;
}) {
  if (images.length === 0) return null;

  return (
    <section className="room-media-gallery" aria-label={locale === "el" ? "Φωτογραφίες δωματίου" : "Room photo gallery"}>
      <div className="room-media-gallery-heading">
        <div>
          <p className="section-label">{locale === "el" ? "Ο χώρος σας" : "Your space"}</p>
          <h2>{locale === "el" ? "Κάθε λεπτομέρεια." : "A closer look."}</h2>
        </div>
        <span>{images.length} {locale === "el" ? "φωτογραφίες" : images.length === 1 ? "photo" : "photos"}</span>
      </div>
      <div className="room-media-gallery-grid">
        {images.map((image, index) => (
          <figure className={"room-media-gallery-item room-media-gallery-item-" + ((index % 5) + 1)} key={image.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.image_url}
              alt={(locale === "el" ? image.alt_text_el : image.alt_text_en) || roomName + " photo " + (index + 1)}
              loading="lazy"
            />
            {(locale === "el" ? image.caption_el : image.caption_en) ? (
              <figcaption>{locale === "el" ? image.caption_el : image.caption_en}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
