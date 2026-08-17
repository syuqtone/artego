# AI-Assisted Catalogue Generation

The automated catalogue is ArteGO's primary point of difference.

## Two layers — do not confuse them

| Layer | Responsible for | Deterministic? |
|---|---|---|
| **Template engine** | Layout, typography, page structure, image placement, pagination, PDF rendering | Yes — same data always gives the same result |
| **AI engine** | Written language and ordering suggestions | No — produces an editable draft |

**Visual quality never depends on the AI.** With AI switched off entirely, the catalogue still generates, still looks professional, and still exports to PDF. The user simply writes the text themselves.

## AI functions

| Function | Input | Output |
|---|---|---|
| Catalogue introduction / foreword | Artist name, short bio, statement, project title and theme, selected artworks with title/year/medium/dimensions | 200–400 word editable draft |
| Curatorial statement | Exhibition title, theme, participating artists, selected works | 200–400 word editable draft |
| Artwork description | Title, year, medium, dimensions, series, artist notes or keywords | 40–80 word editable description |
| Alt text | Artwork title, medium, category, and the image | One factual sentence, under 125 characters |
| Suggested sequence | Selected artworks with year, series, medium, orientation | Proposed order with a one-line reason, offered as Apply or Dismiss |
| Title / subtitle suggestions | Artist statement, selected works, theme keywords | Three short options |

## Human-in-the-loop rules — non-negotiable

1. AI output is **always a draft**, inserted into an editable field, never written directly into a published output.
2. **AI never publishes.** Publishing is always an explicit human action.
3. AI **never silently overwrites** existing user text. If a field has content, offer a comparison with Replace / Insert Below / Cancel.
4. Every AI-generated field is **visibly marked as a draft** until the user edits or confirms it.
5. **Regenerate and Undo** are always available.
6. The user may **turn AI off entirely** in Settings. Every workflow must remain complete with it off.
7. AI must **never invent** biographical facts, exhibition history, awards, prices, collectors or provenance. Constrain the prompt to supplied data and say so in the interface.

## Interface pattern

`FIELD → [Draft with AI] → GENERATING… → DRAFT SHOWN AND LABELLED → EDIT / REGENERATE / DISCARD → ACCEPT`

| Element | Rule |
|---|---|
| Trigger | A **secondary** button beside the field, labelled "Draft with AI". Never primary — writing it yourself must feel equally normal. |
| Loading | Inline progress, field disabled but visible. Target under 10s; time out at 30s. |
| Draft state | Subtle left border in `--artego-red` and a small "AI draft — please review" label. |
| Accepted state | Label disappears once the user edits or presses Accept. |
| Controls | Regenerate, Undo, Discard, and a tone selector: Neutral / Warm / Formal. |
| Empty input | If source data is too thin, do not call the service. Explain which fields would improve the draft. |

## Technical contract

- **All AI calls server-side.** API credentials never reach the browser.
- Each request creates an `ai_job` row: user, project, function, prompt version, token usage, latency, status, result.
- Queue and process asynchronously where latency may exceed 10 seconds.
- Structured functions (suggested sequence, title options) return **strict JSON**. Validate the shape server-side before rendering; fall back to manual if validation fails.
- Prompts stored as **versioned templates** in the codebase, never inline.
- Every prompt includes an explicit instruction not to state facts absent from the supplied data.

## Failure and fallback

| Failure | Required behaviour |
|---|---|
| Service unreachable or timed out | "Drafting is unavailable right now. You can write this section yourself and try again later." Field stays editable. |
| Invalid or unparseable response | Discard silently, log it, offer Regenerate once, then fall back to manual |
| Quota exhausted | State remaining allowance and reset date. **Never block publishing.** |
| Content refused by provider | Explain plainly, invite manual entry |
| AI disabled by admin | **Hide** the buttons entirely. Never show disabled buttons. |

## Data, privacy and cost

- **Sent:** artwork metadata text, and for alt text only, the artwork image derivative.
- **Never sent:** email addresses, legal names, prices, collector information, any other user's data.
- Enable the provider's no-training / zero-retention setting where offered.
- First time a user triggers a draft, show a one-time explanation with a link to the privacy notice.
- **Quota: 50 generations per user per month** (academic phase), admin-adjustable.
- **Rate limit: 10 per user per hour.**

## Attribution

A published catalogue containing unedited AI-drafted text carries a discreet credits-page line:
*"Some text in this publication was drafted with AI assistance and reviewed by the author."*
Never applied to the artwork itself, only to written matter.
