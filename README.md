# ArteGO

Digital art publishing platform for artists, curators and exhibitions.
One artwork record → many professional outputs.

**Product Owner:** Ahmad Sukeri bin Ahmad (syuQ)
**Specification version:** 3.2

---

## Start here

1. Read `CLAUDE.md` — the project rules.
2. Read `docs/BUILD-ORDER.md` — what to build, in order.
3. Read the relevant file in `docs/spec/` before building each slice.

## Specification files

| File | Covers |
|---|---|
| `docs/spec/data-model.md` | Tables and relationships |
| `docs/spec/data-fields.md` | Every form field and its rules |
| `docs/spec/permissions.md` | Roles, RLS, visibility |
| `docs/spec/image-rules.md` | Upload and optimisation pipeline |
| `docs/spec/design-tokens.md` | Colour, type, spacing, components |
| `docs/spec/publishing-snapshot.md` | Publishing and versioning |
| `docs/spec/ai-engine.md` | AI drafting rules |
| `docs/spec/room-visual.md` | Proportional wall preview |
| `docs/spec/virtual-gallery.md` | 2D gallery |
| `docs/spec/quota.md` | Storage limits |
| `docs/spec/uat.md` | Acceptance tests |

The full 47-page master specification is the source document. These files are the working extracts.

## Setup

```bash
cp .env.local.example .env.local   # then fill in your keys
npm install
npm run dev
```

Open http://localhost:3000
