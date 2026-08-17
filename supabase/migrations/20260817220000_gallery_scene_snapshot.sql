-- =========================================================================
-- gallery_scene_snapshot — publishing-snapshot.md: "A published document
-- must never change silently when master data is edited later" and
-- virtual-gallery.md: "Saved as a gallery_scene record; follows the same
-- snapshot rules as any other publication." Same shape and append-only
-- rule as publication_snapshot, scoped to gallery_scene instead of
-- publication since a virtual gallery keeps its own publish lifecycle
-- (status/visibility/slug already live on gallery_scene, not a shared
-- `publication` row).
-- =========================================================================
create table public.gallery_scene_snapshot (
  id uuid primary key default gen_random_uuid(),
  gallery_scene_id uuid not null references public.gallery_scene (id) on delete cascade,
  version integer not null,
  data jsonb not null, -- rendered document: title, artist name, wall preset, per-artwork fields and order
  schema_version integer not null default 1,
  published_by uuid not null references public.users (id),
  published_at timestamptz not null default now(),
  unique (gallery_scene_id, version)
);

create index gallery_scene_snapshot_gallery_scene_id_idx
  on public.gallery_scene_snapshot (gallery_scene_id);

alter table public.gallery_scene_snapshot enable row level security;

alter table public.gallery_scene
  add column current_snapshot_id uuid references public.gallery_scene_snapshot (id) on delete set null;

create policy "gallery_scene_snapshot select public or member"
  on public.gallery_scene_snapshot for select
  using (
    exists (
      select 1 from public.gallery_scene gs
      where gs.id = gallery_scene_snapshot.gallery_scene_id
        and (
          gs.visibility in ('public', 'unlisted')
          or public.is_project_member(gs.project_id)
          or public.is_admin()
        )
    )
  );

create policy "gallery_scene_snapshot insert editor roles or admin"
  on public.gallery_scene_snapshot for insert
  to authenticated
  with check (
    exists (
      select 1 from public.gallery_scene gs
      where gs.id = gallery_scene_snapshot.gallery_scene_id
        and (public.project_role(gs.project_id) in ('owner', 'admin', 'curator', 'editor') or public.is_admin())
    )
  );
