# Publishing, Snapshot & Versioning

A published document must **never change silently** when master data is edited later.
This is what makes an ArteGO catalogue trustworthy as an archival record.

## Behaviour

| Scenario | Expected behaviour |
|---|---|
| Artist edits an artwork description after publishing | Catalogue retains its snapshot until the owner chooses to update |
| Artwork marked Sold after exhibition published | Public master may show Sold; the publication preserves the status at publish time |
| Artist archives an artwork | Existing publication remains viewable unless the publication itself is unpublished |
| Project duplicated | New independent draft; original publication unchanged |
| Owner edits a published project | Saved as draft revision. Explicit **Republish** required. |
| Unpublish | Public URL returns a controlled unavailable state; data retained |

`DRAFT → PREVIEW → PUBLISHED v1 → EDIT DRAFT v2 → REPUBLISH v2 → ARCHIVED`

## What a snapshot stores

At publish time, write a `publication_snapshot` row containing:

1. **A JSON document** with a full copy of every field rendered: project title, subtitle, introduction and curatorial text, credits, and for each artwork its title, year, medium, dimensions, description, availability, price display state, artist name and display order.
2. **An immutable reference** to the exact image derivative used for each artwork, under a content-addressed key. Replacing the master image does not change this key.
3. **Template identifier and template version.**
4. **Publish timestamp, publishing user, snapshot schema version.**

## Retention rules

- Image derivatives referenced by any live snapshot are **never garbage-collected**, even if the artist archives or replaces the artwork.
- If an artist permanently deletes an artwork, snapshot images are retained for the publication but removed from the artist's library and quota.
- **The published viewer and the generated PDF both read from the snapshot, never from live tables.** This is the only way both outputs can be guaranteed identical.
- "Update publication from latest data" writes a **new** snapshot. Snapshots are append-only.
- An admin may suppress a snapshot on a upheld takedown. Suppression hides it publicly, preserves the record, writes an audit entry.
