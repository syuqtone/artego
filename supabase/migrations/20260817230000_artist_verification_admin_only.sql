-- Closes the same self-escalation gap that
-- prevent_self_privilege_escalation already closes for users.roles/status,
-- but for artist_profile.verification_status. Without this, the
-- "artist_profile update own or admin" policy lets an artist change their
-- OWN verification_status via a raw API call, even though the app UI
-- never exposes that control to them (permissions.md: "Verify artist" is
-- ArteGO Admin only; CLAUDE.md rule 3: never trust the browser).

create or replace function public.prevent_self_verification_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.verification_status is distinct from old.verification_status then
      raise exception 'Only an ArteGO Admin can change verification status.';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_self_verification_change
  before update on public.artist_profile
  for each row execute function public.prevent_self_verification_change();
