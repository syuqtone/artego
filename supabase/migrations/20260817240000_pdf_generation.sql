-- quota.md: "PDF generations | 10/month | Queued and counted" (numbers
-- per the product owner for the FYP demo). One row per successful PDF
-- render, counted against the publication's OWNER — the download route
-- itself is public (anyone with a published catalogue's link can fetch
-- the PDF), so this protects the owner's monthly allowance rather than
-- rate-limiting an individual viewer.

create table public.pdf_generation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  publication_id uuid not null references public.publication (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index pdf_generation_user_id_idx on public.pdf_generation (user_id);
create index pdf_generation_publication_id_idx on public.pdf_generation (publication_id);

alter table public.pdf_generation enable row level security;

-- Mirrors ai_job / audit_log: the owner can see their own usage; no
-- client-facing INSERT policy, since a forged row would let someone
-- inflate or evade their own quota. The pdf route writes via the
-- service-role client, same pattern as lib/admin.ts's logAuditEvent.
create policy "pdf_generation select own or admin"
  on public.pdf_generation for select
  using (user_id = auth.uid() or public.is_admin());
