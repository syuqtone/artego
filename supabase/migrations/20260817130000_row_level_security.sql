-- ArteGO — Slice 0.3: Row Level Security policies
-- Source: docs/spec/permissions.md (roles, visibility model, RLS acceptance
-- test) applied to the tables created in 20260817120000_create_core_schema.sql.
--
-- Ground rules applied throughout:
--   * "Public" and "unlisted" content is readable by anyone, including
--     anonymous (logged-out) requests — visibility.md: "Unlisted:
--     accessible by direct link, not in public search."
--   * "Private" and "archived" content is readable only by its owner /
--     project members, and by an ArteGO Admin.
--   * No DELETE policy is created for any table (CLAUDE.md rule 9: never
--     delete user data as a default action — archive/unpublish instead).
--   * publication_snapshot gets no UPDATE and no DELETE policy at all,
--     for anyone — enforcing "append-only" at the database level, not
--     just in application code.
--   * audit_log and notification get no INSERT policy for any client
--     role — both are written server-side with the service role, which
--     bypasses RLS by design. This stops a user forging their own
--     notifications or audit entries.

-- =========================================================================
-- Helper functions
-- security definer + fixed search_path so these can safely read tables
-- that themselves have RLS enabled, without recursing into the caller's
-- own (possibly more restrictive) policies.
-- =========================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and 'artego_admin' = any(u.roles)
  );
$$;

create or replace function public.owns_artist_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.artist_profile ap
    where ap.id = profile_id and ap.user_id = auth.uid()
  );
$$;

create or replace function public.owns_artwork(a_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.artwork a
    join public.artist_profile ap on ap.id = a.artist_profile_id
    where a.id = a_id and ap.user_id = auth.uid()
  );
$$;

create or replace function public.owns_collection(c_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collection c
    join public.artist_profile ap on ap.id = c.artist_profile_id
    where c.id = c_id and ap.user_id = auth.uid()
  );
$$;

-- Returns the caller's role in a project: 'owner' if they own it,
-- otherwise their project_member.role, otherwise null (not a member).
create or replace function public.project_role(p_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select 'owner' from public.project p where p.id = p_id and p.owner_id = auth.uid()),
    (select pm.role from public.project_member pm where pm.project_id = p_id and pm.user_id = auth.uid())
  );
$$;

create or replace function public.is_project_member(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.project_role(p_id) is not null;
$$;

-- Supabase revokes EXECUTE from PUBLIC on new functions by default — a
-- policy calling one of these without this grant fails with "new row
-- violates row-level security policy", which is misleading: the real
-- cause is that the anon/authenticated role couldn't even run the
-- function the policy depends on.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.owns_artist_profile(uuid) to anon, authenticated;
grant execute on function public.owns_artwork(uuid) to anon, authenticated;
grant execute on function public.owns_collection(uuid) to anon, authenticated;
grant execute on function public.project_role(uuid) to anon, authenticated;
grant execute on function public.is_project_member(uuid) to anon, authenticated;

-- =========================================================================
-- users
-- =========================================================================
create policy "users select own or admin"
  on public.users for select
  using (id = auth.uid() or public.is_admin());

create policy "users insert own"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

create policy "users update own or admin"
  on public.users for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Even on your own row, roles/status can only change if you are already
-- an admin — closes the privilege-escalation gap the policy above can't.
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.roles is distinct from old.roles or new.status is distinct from old.status then
      raise exception 'Only an ArteGO Admin can change roles or status.';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_self_privilege_escalation
  before update on public.users
  for each row execute function public.prevent_self_privilege_escalation();

-- =========================================================================
-- artist_profile
-- =========================================================================
create policy "artist_profile select public or own"
  on public.artist_profile for select
  using (
    profile_visibility in ('public', 'unlisted')
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "artist_profile insert own"
  on public.artist_profile for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "artist_profile update own or admin"
  on public.artist_profile for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- =========================================================================
-- artwork
--
-- IMPORTANT: a table's own SELECT/UPDATE policy must never determine
-- ownership by re-querying that SAME table for a row matching its own id
-- (e.g. owns_artwork(id) here). On INSERT ... RETURNING, Postgres checks
-- the SELECT policy against the just-inserted row to decide whether it
-- can be returned — and a nested query that goes looking for that exact
-- row, by its own primary key, in the same table, unreliably fails to
-- see it. The fix is to check ownership using a column already present
-- on the row itself (artist_profile_id), which only touches a different,
-- already-committed table. owns_artwork() is still used (safely) by
-- other tables below that reference an artwork_id belonging to someone
-- else's row.
-- =========================================================================
create policy "artwork select public or own"
  on public.artwork for select
  using (
    visibility in ('public', 'unlisted')
    or public.owns_artist_profile(artist_profile_id)
    or public.is_admin()
  );

create policy "artwork insert own profile"
  on public.artwork for insert
  to authenticated
  with check (public.owns_artist_profile(artist_profile_id));

create policy "artwork update own or admin"
  on public.artwork for update
  using (public.owns_artist_profile(artist_profile_id) or public.is_admin())
  with check (public.owns_artist_profile(artist_profile_id) or public.is_admin());

-- =========================================================================
-- artwork_image — the master file is never public, regardless of the
-- parent artwork's visibility (image-rules.md).
-- =========================================================================
create policy "artwork_image select derivative-public or own"
  on public.artwork_image for select
  using (
    (
      role <> 'master'
      and exists (
        select 1 from public.artwork a
        where a.id = artwork_image.artwork_id and a.visibility in ('public', 'unlisted')
      )
    )
    or public.owns_artwork(artwork_id)
    or public.is_admin()
  );

create policy "artwork_image insert own artwork"
  on public.artwork_image for insert
  to authenticated
  with check (public.owns_artwork(artwork_id));

create policy "artwork_image update own or admin"
  on public.artwork_image for update
  using (public.owns_artwork(artwork_id) or public.is_admin())
  with check (public.owns_artwork(artwork_id) or public.is_admin());

-- =========================================================================
-- collection — same self-reference fix as artwork above: check via the
-- row's own artist_profile_id column, not by re-querying collection.
-- =========================================================================
create policy "collection select public or own"
  on public.collection for select
  using (
    visibility in ('public', 'unlisted')
    or public.owns_artist_profile(artist_profile_id)
    or public.is_admin()
  );

create policy "collection insert own profile"
  on public.collection for insert
  to authenticated
  with check (public.owns_artist_profile(artist_profile_id));

create policy "collection update own or admin"
  on public.collection for update
  using (public.owns_artist_profile(artist_profile_id) or public.is_admin())
  with check (public.owns_artist_profile(artist_profile_id) or public.is_admin());

-- =========================================================================
-- collection_item
-- =========================================================================
create policy "collection_item select via collection"
  on public.collection_item for select
  using (
    exists (
      select 1 from public.collection c
      where c.id = collection_item.collection_id
        and (c.visibility in ('public', 'unlisted') or public.owns_collection(c.id))
    )
    or public.is_admin()
  );

create policy "collection_item insert own collection"
  on public.collection_item for insert
  to authenticated
  with check (public.owns_collection(collection_id));

create policy "collection_item update own or admin"
  on public.collection_item for update
  using (public.owns_collection(collection_id) or public.is_admin())
  with check (public.owns_collection(collection_id) or public.is_admin());

-- =========================================================================
-- project — same self-reference issue as artwork/collection: project_role()
-- and is_project_member() check project.owner_id internally by re-querying
-- the project table, which breaks on INSERT ... RETURNING. For project's
-- own SELECT/UPDATE policies, check ownership via the row's own owner_id
-- column, and membership via a direct EXISTS on project_member (a
-- different table — safe). project_role()/is_project_member() remain the
-- right tool everywhere else below, where project_id is a foreign key to
-- a project that already exists in an earlier, committed transaction.
-- =========================================================================
create policy "project select public or member"
  on public.project for select
  using (
    visibility in ('public', 'unlisted')
    or owner_id = auth.uid()
    or exists (
      select 1 from public.project_member pm
      where pm.project_id = project.id and pm.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "project insert own"
  on public.project for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "project update owner-admin or admin"
  on public.project for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_member pm
      where pm.project_id = project.id and pm.user_id = auth.uid() and pm.role in ('owner', 'admin')
    )
    or public.is_admin()
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_member pm
      where pm.project_id = project.id and pm.user_id = auth.uid() and pm.role in ('owner', 'admin')
    )
    or public.is_admin()
  );

-- =========================================================================
-- project_item
-- =========================================================================
create policy "project_item select via project"
  on public.project_item for select
  using (
    exists (
      select 1 from public.project p
      where p.id = project_item.project_id and p.visibility in ('public', 'unlisted')
    )
    or public.is_project_member(project_id)
    or public.is_admin()
  );

create policy "project_item write editor roles or admin"
  on public.project_item for insert
  to authenticated
  with check (public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor'));

create policy "project_item update editor roles or admin"
  on public.project_item for update
  using (public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor') or public.is_admin())
  with check (public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor') or public.is_admin());

-- =========================================================================
-- project_member
-- =========================================================================
create policy "project_member select fellow members"
  on public.project_member for select
  using (public.is_project_member(project_id) or public.is_admin());

create policy "project_member insert owner-admin or admin"
  on public.project_member for insert
  to authenticated
  with check (public.project_role(project_id) in ('owner', 'admin'));

create policy "project_member update owner-admin or admin"
  on public.project_member for update
  using (public.project_role(project_id) in ('owner', 'admin') or public.is_admin())
  with check (public.project_role(project_id) in ('owner', 'admin') or public.is_admin());

-- =========================================================================
-- invitation
-- =========================================================================
create policy "invitation select recipient or owner-admin"
  on public.invitation for select
  using (
    invited_user_id = auth.uid()
    or email = (auth.jwt() ->> 'email')
    or public.project_role(project_id) in ('owner', 'admin')
    or public.is_admin()
  );

create policy "invitation insert owner-admin or admin"
  on public.invitation for insert
  to authenticated
  with check (public.project_role(project_id) in ('owner', 'admin'));

create policy "invitation update recipient or owner-admin"
  on public.invitation for update
  using (
    invited_user_id = auth.uid()
    or public.project_role(project_id) in ('owner', 'admin')
    or public.is_admin()
  )
  with check (
    invited_user_id = auth.uid()
    or public.project_role(project_id) in ('owner', 'admin')
    or public.is_admin()
  );

-- =========================================================================
-- submission
-- =========================================================================
create policy "submission select own or reviewer"
  on public.submission for select
  using (
    artist_user_id = auth.uid()
    or public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor')
    or public.is_admin()
  );

create policy "submission insert own as member"
  on public.submission for insert
  to authenticated
  with check (artist_user_id = auth.uid() and public.is_project_member(project_id));

create policy "submission update own or reviewer"
  on public.submission for update
  using (
    artist_user_id = auth.uid()
    or public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor')
    or public.is_admin()
  )
  with check (
    artist_user_id = auth.uid()
    or public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor')
    or public.is_admin()
  );

-- =========================================================================
-- publication
-- =========================================================================
create policy "publication select public or member"
  on public.publication for select
  using (
    visibility in ('public', 'unlisted')
    or public.is_project_member(project_id)
    or public.is_admin()
  );

create policy "publication insert owner-admin or admin"
  on public.publication for insert
  to authenticated
  with check (public.project_role(project_id) in ('owner', 'admin'));

create policy "publication update owner-admin or admin"
  on public.publication for update
  using (public.project_role(project_id) in ('owner', 'admin') or public.is_admin())
  with check (public.project_role(project_id) in ('owner', 'admin') or public.is_admin());

-- =========================================================================
-- publication_snapshot — append-only: SELECT and INSERT only, for anyone
-- who can already see/manage the parent publication. No UPDATE, no
-- DELETE policy exists for this table, for any role.
-- =========================================================================
create policy "publication_snapshot select via publication"
  on public.publication_snapshot for select
  using (
    exists (
      select 1 from public.publication p
      where p.id = publication_snapshot.publication_id
        and (p.visibility in ('public', 'unlisted') or public.is_project_member(p.project_id))
    )
    or public.is_admin()
  );

create policy "publication_snapshot insert owner-admin or admin"
  on public.publication_snapshot for insert
  to authenticated
  with check (
    exists (
      select 1 from public.publication p
      where p.id = publication_snapshot.publication_id
        and public.project_role(p.project_id) in ('owner', 'admin')
    )
    or public.is_admin()
  );

-- =========================================================================
-- room_visual — private by default; the artist creates these against
-- their own artworks (room-visual.md, quota.md: "wall photos per artist").
-- =========================================================================
create policy "room_visual select public or own"
  on public.room_visual for select
  using (
    visibility in ('public', 'unlisted')
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "room_visual insert own artwork"
  on public.room_visual for insert
  to authenticated
  with check (user_id = auth.uid() and public.owns_artwork(artwork_id));

create policy "room_visual update own or admin"
  on public.room_visual for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- =========================================================================
-- gallery_scene
-- =========================================================================
create policy "gallery_scene select public or member"
  on public.gallery_scene for select
  using (
    visibility in ('public', 'unlisted')
    or public.is_project_member(project_id)
    or public.is_admin()
  );

create policy "gallery_scene write editor roles or admin"
  on public.gallery_scene for insert
  to authenticated
  with check (public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor'));

create policy "gallery_scene update editor roles or admin"
  on public.gallery_scene for update
  using (public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor') or public.is_admin())
  with check (public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor') or public.is_admin());

-- =========================================================================
-- ai_job — visible and manageable only by the user who triggered it.
-- =========================================================================
create policy "ai_job select own or admin"
  on public.ai_job for select
  using (user_id = auth.uid() or public.is_admin());

create policy "ai_job insert own"
  on public.ai_job for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "ai_job update own or admin"
  on public.ai_job for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- =========================================================================
-- audit_log — admin-readable only. No INSERT policy for any client role:
-- entries are written server-side with the service role, which bypasses
-- RLS. A regular user can never write or forge an audit entry.
-- =========================================================================
create policy "audit_log select admin only"
  on public.audit_log for select
  using (public.is_admin());

-- =========================================================================
-- notification — visible only to its recipient. No INSERT policy for any
-- client role: notifications are written server-side with the service
-- role. A user may only mark their own notification as read.
-- =========================================================================
create policy "notification select own"
  on public.notification for select
  using (user_id = auth.uid());

create policy "notification update own"
  on public.notification for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
