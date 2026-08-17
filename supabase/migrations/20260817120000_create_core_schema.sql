-- ArteGO — Slice 0.2: core database schema
-- Source: docs/spec/data-model.md, docs/spec/data-fields.md, and the
-- supporting spec files referenced inline below.
--
-- Scope of this migration: CREATE TABLES ONLY.
-- Row Level Security is enabled on every table (per data-model.md notes
-- and CLAUDE.md rule 2), but no policies are written yet — that is
-- Slice 0.3. Until that slice runs, no row is readable or writable by
-- anyone except the Supabase service role.
--
-- Naming note: the spec's `user` table is created here as `users`,
-- because `user` is a reserved word in PostgreSQL. This is a naming
-- detail only, not a change to any business rule.

create extension if not exists pgcrypto;

-- Shared trigger: keeps updated_at current on every row change, on every
-- table, without repeating application code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- users — account, authentication, role (data-model.md)
-- One row per Supabase Auth user. Roles per permissions.md: Artist,
-- Organiser, Curator/Editor, Org Admin, ArteGO Admin — "a user may hold
-- one or more roles".
-- =========================================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  roles text[] not null default '{artist}',
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  interface_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- =========================================================================
-- artist_profile — public identity of an artist (data-fields.md 9.1)
-- =========================================================================
create table public.artist_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  display_name text not null
    check (char_length(display_name) between 2 and 80),
  legal_name text, -- verification and admin only, never public
  profile_photo_url text,
  short_bio text,
  full_biography text
    check (full_biography is null or char_length(full_biography) <= 3000),
  artist_statement text,
  country text not null,
  city_state text,
  primary_discipline text not null,
  other_disciplines text[] not null default '{}',
  show_email_publicly boolean not null default false,
  website_urls text[] not null default '{}',
  cv_exhibition_history jsonb not null default '[]',
  profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'unlisted', 'private')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'verified', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index artist_profile_user_id_idx on public.artist_profile (user_id);

alter table public.artist_profile enable row level security;

create trigger set_updated_at
  before update on public.artist_profile
  for each row execute function public.set_updated_at();

-- =========================================================================
-- artwork — master artwork record (data-fields.md 9.2)
-- =========================================================================
create table public.artwork (
  id uuid primary key default gen_random_uuid(),
  artwork_code text not null unique
    default ('AGO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  artist_profile_id uuid not null references public.artist_profile (id) on delete cascade,
  title text not null default 'Untitled',
  title_identifier text, -- optional disambiguator when title is "Untitled"
  year_created text, -- four-digit year, or "Undated" — kept as text to allow that
  medium text not null,
  medium_other text,
  height_cm numeric(8, 2),
  width_cm numeric(8, 2),
  depth_cm numeric(8, 2),
  dimension_unit text not null default 'cm'
    check (dimension_unit in ('cm', 'mm', 'in')),
  category text not null
    check (category in ('painting', 'sculpture', 'photography', 'digital', 'mixed_media', 'other')),
  description text,
  price numeric(12, 2),
  price_currency text,
  price_visibility text not null default 'hidden'
    check (price_visibility in ('public', 'on_request', 'hidden')),
  availability text not null default 'available'
    check (availability in ('available', 'sold', 'reserved', 'nfs', 'collection')),
  edition_number text,
  edition_total text,
  copyright_owner text,
  visibility text not null default 'private'
    check (visibility in ('public', 'unlisted', 'private', 'archived')),
  alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artwork_artist_profile_id_idx on public.artwork (artist_profile_id);

alter table public.artwork enable row level security;

create trigger set_updated_at
  before update on public.artwork
  for each row execute function public.set_updated_at();

-- =========================================================================
-- artwork_image — original and derived image files (data-model.md;
-- pipeline in image-rules.md: master private -> derivatives on Cloudinary)
-- =========================================================================
create table public.artwork_image (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artwork (id) on delete cascade,
  role text not null
    check (role in ('master', 'display_2000', 'display_1200', 'card_600', 'thumbnail_300')),
  storage_provider text not null
    check (storage_provider in ('supabase', 'cloudinary')),
  storage_path text not null, -- Supabase Storage path (master) or Cloudinary public_id (derivatives)
  public_url text, -- always null for role = 'master' — the master is never a public URL
  content_hash text, -- content-addressed key referenced by publication snapshots
  width_px integer,
  height_px integer,
  format text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artwork_image_artwork_id_idx on public.artwork_image (artwork_id);

alter table public.artwork_image enable row level security;

create trigger set_updated_at
  before update on public.artwork_image
  for each row execute function public.set_updated_at();

-- =========================================================================
-- collection — logical grouping of artworks (data-model.md)
-- =========================================================================
create table public.collection (
  id uuid primary key default gen_random_uuid(),
  artist_profile_id uuid not null references public.artist_profile (id) on delete cascade,
  title text not null,
  description text,
  visibility text not null default 'private'
    check (visibility in ('public', 'unlisted', 'private', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collection_artist_profile_id_idx on public.collection (artist_profile_id);

alter table public.collection enable row level security;

create trigger set_updated_at
  before update on public.collection
  for each row execute function public.set_updated_at();

-- =========================================================================
-- collection_item — join table for collection <-> artwork (many-to-many).
-- Not named explicitly in data-model.md, but required to implement
-- "A Collection groups artworks without duplicating the master record."
-- =========================================================================
create table public.collection_item (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collection (id) on delete cascade,
  artwork_id uuid not null references public.artwork (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, artwork_id)
);

create index collection_item_collection_id_idx on public.collection_item (collection_id);
create index collection_item_artwork_id_idx on public.collection_item (artwork_id);

alter table public.collection_item enable row level security;

create trigger set_updated_at
  before update on public.collection_item
  for each row execute function public.set_updated_at();

-- =========================================================================
-- project — exhibition, catalogue or portfolio workspace (data-model.md;
-- exhibition fields from data-fields.md 9.3)
-- =========================================================================
create table public.project (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  type text not null
    check (type in ('exhibition', 'catalogue', 'portfolio', 'virtual_gallery')),
  exhibition_type text
    check (exhibition_type is null or exhibition_type in ('solo', 'group')),
  title text not null,
  subtitle text,
  description text, -- curatorial statement / introduction, editable draft target for AI
  start_date date,
  end_date date,
  venue text,
  city text,
  country text,
  curators text[] not null default '{}', -- display text; linked users are project_member rows with role 'curator'
  cover_image_url text,
  participant_limit integer,
  submission_deadline timestamptz,
  invitation_mode text not null default 'private_invite'
    check (invitation_mode = 'private_invite'), -- only mode at launch, per permissions.md
  submission_limit integer,
  status text not null default 'draft'
    check (status in ('draft', 'preview', 'open', 'reviewing', 'published', 'archived')),
  visibility text not null default 'private'
    check (visibility in ('public', 'unlisted', 'private', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_owner_id_idx on public.project (owner_id);

alter table public.project enable row level security;

create trigger set_updated_at
  before update on public.project
  for each row execute function public.set_updated_at();

-- =========================================================================
-- project_item — one artwork in one project, with order (data-model.md)
-- =========================================================================
create table public.project_item (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  artwork_id uuid not null references public.artwork (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, artwork_id)
);

create index project_item_project_id_idx on public.project_item (project_id);
create index project_item_artwork_id_idx on public.project_item (artwork_id);

alter table public.project_item enable row level security;

create trigger set_updated_at
  before update on public.project_item
  for each row execute function public.set_updated_at();

-- =========================================================================
-- project_member — collaborator and role in a project (data-model.md;
-- roles from permissions.md: Owner, Admin, Curator, Editor, Artist, Viewer)
-- =========================================================================
create table public.project_member (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'curator', 'editor', 'artist', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index project_member_project_id_idx on public.project_member (project_id);
create index project_member_user_id_idx on public.project_member (user_id);

alter table public.project_member enable row level security;

create trigger set_updated_at
  before update on public.project_member
  for each row execute function public.set_updated_at();

-- =========================================================================
-- invitation — invite token and its status (data-model.md)
-- =========================================================================
create table public.invitation (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  email text not null,
  invited_user_id uuid references public.users (id) on delete set null,
  role text not null default 'artist'
    check (role in ('owner', 'admin', 'curator', 'editor', 'artist', 'viewer')),
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  invited_by uuid not null references public.users (id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitation_project_id_idx on public.invitation (project_id);

alter table public.invitation enable row level security;

create trigger set_updated_at
  before update on public.invitation
  for each row execute function public.set_updated_at();

-- =========================================================================
-- submission — artworks an artist submits to a project (data-model.md)
-- =========================================================================
create table public.submission (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  artist_user_id uuid not null references public.users (id) on delete cascade,
  artwork_id uuid not null references public.artwork (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, artwork_id)
);

create index submission_project_id_idx on public.submission (project_id);
create index submission_artist_user_id_idx on public.submission (artist_user_id);

alter table public.submission enable row level security;

create trigger set_updated_at
  before update on public.submission
  for each row execute function public.set_updated_at();

-- =========================================================================
-- publication — a generated public output (data-model.md;
-- lifecycle from publishing-snapshot.md: draft -> preview -> published -> archived)
-- =========================================================================
create table public.publication (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  type text not null
    check (type in ('catalogue', 'portfolio', 'exhibition', 'virtual_gallery')),
  template_id text,
  slug text unique,
  status text not null default 'draft'
    check (status in ('draft', 'preview', 'published', 'archived')),
  visibility text not null default 'private'
    check (visibility in ('public', 'unlisted', 'private', 'archived')),
  current_snapshot_id uuid, -- fk added below, after publication_snapshot exists
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index publication_project_id_idx on public.publication (project_id);

alter table public.publication enable row level security;

create trigger set_updated_at
  before update on public.publication
  for each row execute function public.set_updated_at();

-- =========================================================================
-- publication_snapshot — frozen JSON of data used at publish time
-- (data-model.md: "append-only. Never update a row; always insert a new
-- one." Full contents defined in publishing-snapshot.md.)
-- =========================================================================
create table public.publication_snapshot (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publication (id) on delete cascade,
  version integer not null,
  data jsonb not null, -- full rendered document: title, intro, credits, per-artwork fields and order
  template_id text not null,
  template_version text not null,
  schema_version integer not null default 1,
  published_by uuid not null references public.users (id),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), -- present for schema consistency; snapshots are never updated in practice
  unique (publication_id, version)
);

create index publication_snapshot_publication_id_idx on public.publication_snapshot (publication_id);

alter table public.publication_snapshot enable row level security;

alter table public.publication
  add constraint publication_current_snapshot_id_fkey
  foreign key (current_snapshot_id) references public.publication_snapshot (id) on delete set null;

-- =========================================================================
-- room_visual — saved room preview composition (data-model.md;
-- fields from room-visual.md)
-- =========================================================================
create table public.room_visual (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artwork (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  wall_photo_url text not null,
  reference_span_px numeric(10, 2) not null,
  reference_width_cm numeric(8, 2) not null,
  placement_x numeric(8, 4) not null default 0,
  placement_y numeric(8, 4) not null default 0,
  rotation_deg numeric(4, 2) not null default 0
    check (rotation_deg between -3 and 3),
  frame text not null default 'none'
    check (frame in ('none', 'thin_black', 'thin_white', 'natural_wood')),
  visibility text not null default 'private'
    check (visibility in ('public', 'unlisted', 'private', 'archived')), -- private by default, per room-visual.md
  share_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index room_visual_artwork_id_idx on public.room_visual (artwork_id);
create index room_visual_user_id_idx on public.room_visual (user_id);

alter table public.room_visual enable row level security;

create trigger set_updated_at
  before update on public.room_visual
  for each row execute function public.set_updated_at();

-- =========================================================================
-- gallery_scene — virtual gallery layout (data-model.md; rules in
-- virtual-gallery.md — hanging position is computed at render time from
-- project_item order and the recorded artwork dimensions, not stored here)
-- =========================================================================
create table public.gallery_scene (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project (id) on delete cascade,
  title text not null,
  wall_preset text not null default 'white'
    check (wall_preset in ('white', 'warm_grey', 'black')),
  source_type text not null
    check (source_type in ('selection', 'collection', 'exhibition')),
  source_collection_id uuid references public.collection (id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'preview', 'published', 'archived')),
  visibility text not null default 'private'
    check (visibility in ('public', 'unlisted', 'private', 'archived')),
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gallery_scene_project_id_idx on public.gallery_scene (project_id);

alter table public.gallery_scene enable row level security;

create trigger set_updated_at
  before update on public.gallery_scene
  for each row execute function public.set_updated_at();

-- =========================================================================
-- ai_job — one AI generation request and its result (data-model.md;
-- fields listed explicitly in ai-engine.md: "user, project, function,
-- prompt version, token usage, latency, status, result")
-- =========================================================================
create table public.ai_job (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id uuid references public.project (id) on delete cascade,
  function text not null
    check (function in (
      'catalogue_intro', 'curatorial_statement', 'artwork_description',
      'alt_text', 'suggested_sequence', 'title_suggestions'
    )),
  prompt_version text not null,
  input jsonb,
  result jsonb,
  token_usage integer,
  latency_ms integer,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_job_user_id_idx on public.ai_job (user_id);
create index ai_job_project_id_idx on public.ai_job (project_id);

alter table public.ai_job enable row level security;

create trigger set_updated_at
  before update on public.ai_job
  for each row execute function public.set_updated_at();

-- =========================================================================
-- audit_log — record of sensitive admin actions (data-model.md)
-- =========================================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade, -- the actor
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index audit_log_user_id_idx on public.audit_log (user_id);

alter table public.audit_log enable row level security;

create trigger set_updated_at
  before update on public.audit_log
  for each row execute function public.set_updated_at();

-- =========================================================================
-- notification — actionable in-app message (data-model.md)
-- =========================================================================
create table public.notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade, -- the recipient
  type text not null,
  title text not null,
  body text,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_user_id_idx on public.notification (user_id);

alter table public.notification enable row level security;

create trigger set_updated_at
  before update on public.notification
  for each row execute function public.set_updated_at();
