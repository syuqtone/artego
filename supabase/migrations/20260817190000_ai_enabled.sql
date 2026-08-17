-- =========================================================================
-- ai_enabled — per-user AI on/off switch (ai-engine.md rule 6: "The user
-- may turn AI off entirely in Settings. Every workflow must remain
-- complete with it off."). Self-updatable under the existing "users
-- update own or admin" RLS policy — the privilege-escalation trigger only
-- guards the roles/status columns, so no new policy is needed.
-- =========================================================================
alter table public.users
  add column ai_enabled boolean not null default true;
