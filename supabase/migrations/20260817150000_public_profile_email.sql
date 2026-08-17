-- ArteGO — Slice 1.5: expose an artist's email on their public profile,
-- but only when they've explicitly opted in (artist_profile.show_email_publicly)
-- and the profile itself is visible (public/unlisted, or the owner).
--
-- The "users" table's RLS policy only lets someone read their own row, by
-- design — we don't want to open that up broadly just to expose one
-- column. This function is a narrow, purpose-built exception: it returns
-- nothing at all unless the artist's own opt-in flag is set.

create or replace function public.get_profile_email(profile_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.artist_profile ap
  join public.users u on u.id = ap.user_id
  where ap.id = profile_id
    and ap.show_email_publicly = true
    and (ap.profile_visibility in ('public', 'unlisted') or ap.user_id = auth.uid());
$$;

grant execute on function public.get_profile_email(uuid) to anon, authenticated;
