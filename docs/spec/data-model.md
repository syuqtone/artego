# Data Model

`USER → ARTIST PROFILE → ARTWORK → COLLECTION / SERIES → PROJECT / EXHIBITION → PUBLICATION`

## Rules

- A User may hold one or more roles. An artist profile links to a valid user or organisation.
- An Artwork has a unique immutable ArteGO Artwork ID and is the master record.
- An Artwork may appear in many Collections, Portfolios, Catalogues, Exhibitions and Virtual Galleries.
- A Collection groups artworks without duplicating the master record.
- A Publication stores its output configuration and a published snapshot.
- If a master artwork is edited after publishing, the snapshot is retained until the owner explicitly updates it.

## Tables

| Table | Purpose | Key relationships |
|---|---|---|
| `user` | Account, authentication, role | has one artist_profile; owns projects |
| `artist_profile` | Public identity of an artist | belongs to user or organisation; has many artworks |
| `artwork` | Master artwork record | belongs to artist_profile; has many images |
| `artwork_image` | Original and derived image files | belongs to artwork |
| `collection` | Logical grouping of artworks | many-to-many with artwork |
| `project` | Exhibition, catalogue or portfolio workspace | has many project_items |
| `project_item` | One artwork in one project, with order | joins project and artwork |
| `project_member` | Collaborator and role in a project | joins user and project |
| `invitation` | Invite token and its status | belongs to project |
| `submission` | Artworks an artist submits to a project | joins user, project, artwork |
| `publication` | A generated public output | belongs to project; holds snapshot |
| `publication_snapshot` | Frozen JSON of data used at publish time | belongs to publication |
| `room_visual` | Saved room preview composition | belongs to artwork and user |
| `gallery_scene` | Virtual gallery layout and hanging positions | belongs to project |
| `ai_job` | One AI generation request and its result | belongs to user and project |
| `audit_log` | Record of sensitive admin actions | belongs to user |
| `notification` | Actionable in-app message | belongs to user |

## Notes for implementation

- Use UUID primary keys.
- Every table has `created_at` and `updated_at`.
- Soft-delete via a `status` or `visibility` column, never a hard `DELETE` as a default action.
- `publication_snapshot` is append-only. Never update a row; always insert a new one.
