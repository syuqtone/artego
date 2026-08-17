-- ArteGO — Slice 2.6: allow removing an artwork from a collection.
--
-- CLAUDE.md rule 9 ("never delete user data as a default action") is
-- about content records — artworks, profiles, publications. collection_item
-- is a pure join row recording membership, not content: removing one
-- doesn't delete the artwork, the collection, or any data the artist
-- entered. No other table gets a DELETE policy for this reason.

create policy "collection_item delete own collection"
  on public.collection_item for delete
  to authenticated
  using (public.owns_collection(collection_id));
