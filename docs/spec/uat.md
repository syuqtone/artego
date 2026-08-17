# QA & UAT Acceptance Criteria

A release is not accepted merely because its screens exist.
Scenarios A–C, G–L and O–S apply to the FYP demonstration release.

| ID | Scenario | Pass condition |
|---|---|---|
| A | New artist | Create account → verify email → complete profile → add artwork → see it in library → publish profile |
| B | Artwork reuse | Select the same artwork into a collection, a portfolio and an exhibition with **no duplicate master record** |
| C | Catalogue | Select artworks → choose template → reorder → preview → publish online → generate PDF |
| D | Group exhibition, existing artist | Organiser invites → artist accepts → selects → submits → organiser approves → works appear |
| E | Group exhibition, new artist | Invite link → new registration → return to submission → submit successfully |
| F | Revision | Organiser requests revision → artist sees note → edits → resubmits → approved |
| G | **Snapshot** | Publish a catalogue → edit the master artwork → **the published catalogue is unchanged** until explicit republish |
| H | **Privacy** | A private artwork never appears in public Discover, on a public profile, in a sitemap, or via URL guessing |
| I | Admin | Admin finds artist → reviews → verifies/unpublishes/suspends → reflected correctly and **written to the audit log** |
| J | Mobile | Key creator flows usable on a smartphone with no horizontal scrolling or unreachable controls |
| K | Failure recovery | A failed upload or validation error **does not erase data already entered** |
| L | PDF | The generated PDF is readable, correctly ordered, and **matches the online version exactly** |
| M | Notification | Every workflow event produces the correct in-app notification |
| N | Quota | A user at the limit is told clearly, cannot exceed it, and is offered a way to free space |
| O | **AI drafting** | Generate an introduction → edit it → publish. **The edited text is what appears in both the web page and the PDF** |
| P | **AI failure** | With AI disabled, the catalogue can still be completed and published manually, with no dead end |
| Q | **Room visualisation** | Upload wall photo → enter wall width → place a 100 × 100cm artwork → rendered size within **5%** of correct proportion |
| R | **Virtual gallery** | Select artworks → generate → pan, zoom, open a label → publish → open the public URL on a phone |
| S | **Accessibility** | Complete sign-up, add artwork and publish a catalogue **using the keyboard only**, with a visible focus indicator throughout |

## Per-screen quality criteria

- The primary action is obvious.
- All required fields are clearly marked.
- Validation appears next to the relevant field.
- Loading and saving states are visible.
- Back navigation does not unexpectedly lose data.
- Empty states explain the next action.
- Permissions are enforced **server-side**, not only hidden in the interface.
- No private content leaks through search, URL guessing, caching or public feeds.
