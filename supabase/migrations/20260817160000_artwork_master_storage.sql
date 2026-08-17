-- ArteGO — Slice 2.1: private Supabase Storage bucket for master artwork
-- images. image-rules.md: "The original master is never a public URL."
-- Public delivery (Cloudinary derivatives) is Slice 2.2.
--
-- Objects are stored under `{auth.uid()}/{a fresh random id}/master.<ext>`,
-- so ownership can be checked from the path alone without a DB lookup.

insert into storage.buckets (id, name, public)
values ('artwork-masters', 'artwork-masters', false)
on conflict (id) do nothing;

create policy "artwork-masters insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artwork-masters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "artwork-masters select own or admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'artwork-masters'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "artwork-masters delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'artwork-masters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
