-- Publish every property photo the owner supplied to the public gallery.
-- The landing hero carousel and the gallery page both render from hotel_gallery_images,
-- so adding the remaining photos here is what makes "all images" appear (and lets an
-- owner/manager hide any of them later by flipping `active`).
-- 769092636 (1).jpg is intentionally omitted: it is byte-identical to 769092636.jpg.

insert into public.hotel_gallery_images (image_url, sort_order, active)
select v.image_url, v.sort_order, true
from (values
  ('/723811954.jpg', 11),
  ('/723811965.jpg', 12),
  ('/723811983.jpg', 13),
  ('/723812006.jpg', 14),
  ('/723812015.jpg', 15),
  ('/723812039.jpg', 16),
  ('/723812052.jpg', 17),
  ('/723812063.jpg', 18),
  ('/723812096.jpg', 19),
  ('/723812110.jpg', 20),
  ('/723815477.jpg', 21),
  ('/723815744.jpg', 22),
  ('/723815747.jpg', 23),
  ('/723815753.jpg', 24),
  ('/769092590.jpg', 25),
  ('/769092633.jpg', 26),
  ('/769092635.jpg', 27),
  ('/769092636.jpg', 28),
  ('/769092639.jpg', 29),
  ('/772314293.jpg', 30),
  ('/902231343.jpg', 31),
  ('/902231434.jpg', 32),
  ('/902234060.jpg', 33)
) as v(image_url, sort_order)
where not exists (
  select 1 from public.hotel_gallery_images g where g.image_url = v.image_url
);
