# Room Visualisation — Proportional Wall Preview

Lets someone see how a specific artwork looks on a specific real wall, at correct relative size.
It answers the question every artist is asked: **how big is it, really?**

This is a photo overlay with a calculated scale. **Not AR.** No live camera. No claim of measurement accuracy.

## Flow

`SELECT ARTWORK → UPLOAD WALL PHOTO → SET REFERENCE SCALE → PLACE ARTWORK → ADJUST → SAVE / SHARE`

## The scale method

The user drags a horizontal marker across a known span in the photo — typically the full wall or a door — and types its real width in centimetres. The system computes **pixels per centimetre** and renders the artwork at true relative size.

## Rules

- The artwork **must have Height and Width recorded.** If missing, prompt the user and link directly to the field. Do not show a blocking error.
- Wall photo: JPG, PNG or WebP, max 10 MB, minimum 1000px longest side.
- The artwork is rendered with **aspect ratio locked** to the recorded real dimensions. The user may move it but never distort it.
- **Free rescaling is not permitted.** Scale derives from the reference measurement. A preview the user can resize freely defeats the entire purpose.
- Rotation limited to **±3 degrees**, to correct a slightly tilted photograph only.
- Optional: a simple frame (none, thin black, thin white, natural wood) and a soft drop shadow.
- A **live size readout** is always visible, e.g. "100 × 80 cm on a 340 cm wall".
- Perspective correction is out of scope. Advise the user to photograph the wall straight on.

## Output

| Output | Rule |
|---|---|
| Save to project | `room_visual` record linked to the artwork |
| Download image | Composited JPG, up to 2000px longest side |
| Share link | Unlisted URL |
| Embed on artwork detail | Optional — artist may show one saved preview as "See it on a wall" |
| **Wall photo privacy** | **Private by default.** Published only when the artist explicitly shares or embeds. Never used in Discover. |

## Required interface text

> This preview is an approximation based on the wall width you entered. Lighting, camera angle and lens distortion affect how the artwork appears. Always confirm measurements before hanging or purchasing.

## Acceptance criteria

- 340cm reference wall, 100 × 80cm artwork → rendered width within **5%** of 100/340 of the marked span.
- An artwork with no dimensions cannot enter the tool; the user is guided to complete the field.
- Aspect ratio never changes, at any zoom level, on any device.
- Full workflow completes on a 390px phone, including camera capture where supported.
- A saved preview reopens with the same placement, scale and frame.
- A wall photo never appears in public Discover, search results or a sitemap.
