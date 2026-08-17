-- ArteGO — Slice 3.2: allow removing an artwork from a catalogue/project.
-- Same reasoning as collection_item in Slice 2.6: project_item is a join
-- row recording membership + order, not content — removing one doesn't
-- delete the artwork or the project itself.

create policy "project_item delete editor roles or admin"
  on public.project_item for delete
  to authenticated
  using (public.project_role(project_id) in ('owner', 'admin', 'curator', 'editor'));
