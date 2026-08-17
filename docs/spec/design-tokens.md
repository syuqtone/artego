# Design Tokens (locked)

Define these once as CSS custom properties and in the Tailwind theme.
**Never hard-code a colour, size or spacing value anywhere in the codebase.**

## Colour

| Token | Value | Role |
|---|---|---|
| `--artego-black` | `#111111` | Body text, structural lines, navigation |
| `--artego-white` | `#FFFFFF` | Canvas and gallery space |
| `--artego-red` | `#F51B24` | Red dot, active state, primary button fill, accent planes |
| `--artego-red-deep` | `#C8102E` | Red **text** on white, small labels. Contrast 5.9:1 |
| `--artego-blue` | `#0B4EA2` | De Stijl accent, secondary planes only |
| `--artego-yellow` | `#F2C200` | Limited highlights. Never for text |
| `--grey-900` | `#333333` | Strong secondary text |
| `--grey-600` | `#6B6B6B` | Secondary text and metadata |
| `--grey-400` | `#9E9E9E` | Disabled |
| `--grey-200` | `#E5E5E5` | Dividers and borders |
| `--grey-100` | `#F7F7F7` | Surface and card background |
| `--success` | `#0F7B3F` | Approved, published, saved |
| `--warning` | `#B45309` | Revision required, pending |
| `--danger` | `#C8102E` | Destructive actions and errors |

### Critical contrast rule

`#F51B24` gives **4.15:1** on white — passes AA for large text and UI components, **fails** for normal body text.

- Use `--artego-red` for fills, the red dot, and button backgrounds with white label text at 16px bold or larger.
- Use `--artego-red-deep` for any red text on white, and for button labels below 16px.

## Typography

Typeface: **Inter**, with a system sans-serif fallback.

| Style | Desktop | Mobile | Weight |
|---|---|---|---|
| Display | 48/56 | 32/40 | 700 |
| H1 | 36/44 | 28/36 | 700 |
| H2 | 28/36 | 22/30 | 600 |
| H3 | 20/28 | 18/26 | 600 |
| Body | 16/26 | 16/26 | 400 |
| Small / metadata | 14/22 | 14/22 | 400 |
| Caption | 12/18 | 12/18 | 400 |
| Button / label | 15/20 | 15/20 | 600 |

Body text measure: 60–75 characters per line. Avoid all-caps for body content.

## Layout

| Token | Value |
|---|---|
| Breakpoints | 360 / **390 (mobile ref)** / 768 / 1024 / **1440 (desktop ref)** |
| Container max width | 1280px |
| Gutter | 16px mobile / 24px tablet / 32px desktop |
| Grid columns | 4 mobile / 8 tablet / 12 desktop |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64, 96 (4px base — never an arbitrary value) |
| Corner radius | 0 structural / 4px buttons and inputs / 999px avatars and pills |
| Border weight | 1px hairline / 2px structural / 4px emphasis |
| Elevation | No drop shadows in Public and Creator. One subtle shadow for bottom sheets and modals only. |
| Touch target | Minimum 44 × 44px |

## Visual principles

- **Artwork first.** The interface never competes with artwork colour or texture.
- **Minimal.** No decorative gradients, borders or dashboard clutter.
- **Grid-led.** Disciplined modular grids, strong alignment, intentional asymmetry.
- **Whitespace is functional.**
- **Mondrian influence** comes from proportion, grid, black structural lines, white space and restrained primary-colour accents — never a painting used as a background.

### Use / Avoid

| Use | Avoid |
|---|---|
| Asymmetric but balanced grid | Literal Mondrian painting as background |
| Black structural rules where useful | Heavy black boxes around every component |
| White negative space | Filling space for decoration |
| Small red/blue/yellow accent planes | Primary colours on every button |
| Rectilinear geometry, strict alignment | Novelty layout that harms usability |

## Component rules

| Component | Rule |
|---|---|
| Primary button | High contrast, clear verb. Red or black fill, white label. |
| Secondary button | Neutral outline or text treatment. |
| Artwork card | Image dominant, concise metadata, status badge only when relevant. |
| Create card | Large icon, clear label, entire card clickable. |
| Form field | Visible label, clear focus state, inline validation. |
| Modal / bottom sheet | Short focused actions only. Long workflows use dedicated pages. |
| Status badge | Text plus shape or icon. **Colour alone is never sufficient.** |
| Empty state | Explain what is empty, give one obvious next action. |
| AI affordance | Draft visibly labelled, with Regenerate and Edit always available. |
