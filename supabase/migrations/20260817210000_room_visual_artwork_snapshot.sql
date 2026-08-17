-- The public "unlisted" share page must render without depending on the
-- artwork table's own RLS (a shared room preview is explicitly public
-- regardless of whether the artwork itself is marked private) — so a
-- small snapshot of the display fields is taken at save time, the same
-- philosophy as publication_snapshot.
alter table public.room_visual
  add column artwork_title text,
  add column artwork_height_cm numeric(8, 2),
  add column artwork_width_cm numeric(8, 2),
  add column artwork_image_url text;
