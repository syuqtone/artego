-- quota.md: "Wall photos per artist | 10 | User may delete oldest" — the
-- schema was deliberately built with NO delete policy on any table
-- (CLAUDE.md rule 9: never delete user data by default). Room visuals are
-- the one deliberate, spec-required exception: a saved composite the
-- owner made for themselves, not published content anyone else depends
-- on, so the owner may permanently remove their own rows.

create policy "room_visual delete own"
  on public.room_visual for delete
  using (user_id = auth.uid());
