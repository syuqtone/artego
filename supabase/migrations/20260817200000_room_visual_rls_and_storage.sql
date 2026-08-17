-- =========================================================================
-- room_visual RLS (room-visual.md 5.3: save / share). Table + columns
-- already exist from Slice 0.2; RLS was left enabled with no policies
-- until now, so nothing was reachable at all.
-- =========================================================================
create policy "room_visual select own or unlisted or admin"
  on public.room_visual for select
  using (
    user_id = auth.uid()
    or visibility in ('public', 'unlisted')
    or public.is_admin()
  );

create policy "room_visual insert own"
  on public.room_visual for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "room_visual update own or admin"
  on public.room_visual for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- =========================================================================
-- Private Supabase Storage bucket for wall photos (room-visual.md: "Wall
-- photo privacy: Private by default. Published only when the artist
-- explicitly shares or embeds."). Same path convention as
-- artwork-masters: `{auth.uid()}/{fresh id}/wall.<ext>`.
--
-- The extra select policy lets anyone generate a short-lived signed URL
-- for a photo whose room_visual row has been explicitly marked
-- unlisted/public — that's what "share link" means; it does not make the
-- bucket public.
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('room-visual-photos', 'room-visual-photos', false)
on conflict (id) do nothing;

create policy "room-visual-photos insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'room-visual-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "room-visual-photos select own or admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'room-visual-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "room-visual-photos select shared"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'room-visual-photos'
    and exists (
      select 1 from public.room_visual rv
      where rv.wall_photo_url = storage.objects.name
        and rv.visibility in ('public', 'unlisted')
    )
  );
