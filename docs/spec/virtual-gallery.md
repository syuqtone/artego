# Interactive Virtual Gallery (2D)

A visitor experiences selected artworks as though hung in a gallery space, at correct relative scale and with correct wall labels — not as a grid of thumbnails.

## Scope

| In scope | Out of scope (later) |
|---|---|
| A single continuous virtual room, panned horizontally | Multiple connected rooms, floor plans |
| 2D flat elevation view of the wall | 3D perspective, walkthrough, VR |
| Up to 20 artworks in one gallery | Unlimited works with automatic room division |
| Automatic hanging along a shared centre line | Salon hanging, stacked or grid arrangements |
| Three wall presets: white, warm grey, black | Custom textures, uploaded room photographs |
| Click or tap an artwork to open its label card | Avatars, live visitors, guided audio tour |
| Publish as a public or unlisted URL | Ticketed or gated access |

## Hanging rules

These are what make it read as a gallery rather than a slideshow. They mirror standard curatorial practice.

- The virtual wall is **300 cm high**. Rendering scales to the viewport.
- Every artwork is placed with its **vertical centre at 150 cm** from the floor — standard gallery eye line — unless taller than 240 cm, in which case it is floor-anchored.
- Artworks render at **true relative scale to one another**, using recorded dimensions. A 200cm painting must visibly dominate a 30cm one.
- Default horizontal gap: **60 cm of virtual wall**, increased proportionally for works wider than 150 cm.
- Each work carries a **wall label** beneath it: artist name, title, year, medium, dimensions. Availability only if the artist chose to display it.
- No recorded dimensions → fall back to a 60 × 60cm placeholder and **warn the artist** that scale will be inaccurate.

## Interaction

| Interaction | Desktop | Mobile |
|---|---|---|
| Move along the wall | Horizontal scroll, arrow keys, on-screen arrows | Horizontal swipe |
| Zoom into a work | Click the artwork | Tap the artwork |
| Artwork detail | Label card with full metadata and a link to the artwork page | Bottom sheet, same content |
| Exit zoom | Escape, close button, click outside | Swipe down or close button |
| Full screen | Optional toggle | Optional landscape mode |
| **Accessible alternative** | **List View toggle** — same works and labels as a linear, screen-reader-friendly list | Same |

## Creation flow

`SELECT ARTWORKS OR EXHIBITION → CHOOSE WALL PRESET → ARRANGE ORDER → PREVIEW → PUBLISH`

- Source: selected artworks, a collection, or the approved works of an exhibition.
- Saved as a `gallery_scene` record; follows the same snapshot rules as any other publication.
- A published gallery has a stable public or unlisted URL and a share image for social preview.

## Performance

- Load only works near the viewport; lazy-load the rest as the visitor pans.
- Use the **1200px derivative** for wall rendering, the **2000px** only in zoom.
- First view interactive within **3 seconds** on a mid-range phone over 4G.
- Respect `prefers-reduced-motion`: disable smooth panning, use instant transitions.

## Implementation note

Build with **DOM and CSS transforms**, not Canvas or WebGL. Keeping artworks as real elements means keyboard navigation, focus and screen-reader access work without a parallel implementation.

## Acceptance criteria

- Ten artworks of differing real dimensions render at visibly correct relative scale.
- All works share a centre line at 150cm except those taller than 240cm.
- Every artwork opens a label card with complete metadata.
- The List View toggle is fully navigable by keyboard and screen reader.
- A published gallery opens from its public URL on a phone, without login.
- **A private artwork can never appear in a published gallery.**
