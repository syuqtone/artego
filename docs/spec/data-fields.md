# Data Fields

## 9.1 Artist profile

| Field | Required | Input / rule | Public |
|---|---|---|---|
| Display / Artist Name | Yes | Text, 2–80 characters | Yes |
| Legal Name | Conditional | Verification and admin only | No |
| Profile Photo | Recommended | JPG/PNG/WebP, square crop UI | Yes |
| Short Bio | Yes | 80–300 characters recommended | Yes |
| Full Biography | Optional | Rich text, max 3000 characters | Yes |
| Artist Statement | Optional | Rich text | Yes |
| Country | Yes | Controlled country list | Yes |
| City / State | Optional | Text | Optional |
| Primary Discipline | Yes | Painting, Sculpture, Photography, Digital, etc. | Yes |
| Other Disciplines | Optional | Multi-select | Yes |
| Email | Yes | Account and contact, privacy-controlled | No by default |
| Website / Social Links | Optional | Validated URLs | Yes |
| CV / Exhibition History | Optional | Structured entries preferred | Yes |
| Interface Language | Yes | Preferred language | No |
| Profile Visibility | Yes | Public / Unlisted / Private | System rule |
| Verification Status | System | Pending / Approved / Verified / Suspended | Verified badge only |

## 9.2 Artwork

| Field | Required | Input / rule |
|---|---|---|
| Artwork Image | Yes | At least one main image |
| Title | Yes | Text; "Untitled" allowed with optional identifier |
| Year | Yes | Four-digit year or "Undated" |
| Medium | Yes | Controlled list plus free-text Other |
| Dimensions (H × W × D) | **Yes** when used in Room Visualisation or Virtual Gallery, otherwise recommended | Numeric; unit cm/mm/in. Drives real-scale rendering. |
| Category | Yes | Painting / Sculpture / Photography / Digital / Mixed Media / Other |
| Series / Collection | Optional | Select existing or create new |
| Description | Optional | Plain or rich text; AI draft available |
| Price | Optional | Numeric plus currency |
| Price Visibility | Yes when a price is entered | Show publicly / Price on request / Hidden. **Default Hidden.** |
| Availability | Yes | Available / Sold / Reserved / NFS / Collection |
| Edition | Conditional | Edition number and total where relevant |
| Copyright Owner | Recommended | Defaults to the artist; editable |
| Visibility | Yes | Public / Unlisted / Private / Archived |
| Alt Text | Recommended | Accessibility description; AI suggestion available |
| Artwork ID | System | Immutable unique ArteGO identifier |
| Created / Updated | System | Audit timestamps |

## 9.3 Exhibition

| Field | Required | Rule |
|---|---|---|
| Exhibition Title | Yes | Text |
| Type | Yes | Solo / Group |
| Theme / Subtitle | Optional | Text |
| Start / End Date | Recommended | Online-only may omit physical dates |
| Venue | Optional | Text |
| City / Country | Optional | Structured location |
| Organiser | Yes | User or organisation |
| Curator(s) | Optional | Linked users or display text |
| Curatorial Statement | Optional | Rich text; AI draft available |
| Cover Image | Recommended | Optimised image |
| Participant Limit | Optional | Numeric |
| Submission Deadline | Optional | Date and time with time zone |
| Invitation Mode | Yes | Private Invite at launch |
| Submission Limit | Optional | Works per artist |
| Status | System/User | Draft / Open / Reviewing / Published / Archived |
| Public Visibility | Yes | Public / Unlisted / Private |

## Form rules

- Visible labels, never placeholder-only.
- Plain language. Never show the words "metadata", "asset derivative" or "indexing" to an artist.
- Validation appears next to the relevant field.
- Autosave long forms as drafts.
