# Artwork Image Rules

| Rule | Specification |
|---|---|
| Accepted formats | JPG, JPEG, PNG, WebP |
| Maximum upload | 10 MB per image |
| Recommended resolution | 2000–3000 px longest side |
| Minimum recommended | 1200 px longest side |
| Colour profile | sRGB preferred; convert on ingest |
| DPI | Not used as a quality rule |
| Public delivery | Optimised derivatives only. **The original master is never a public URL.** |
| Loading | Responsive images with lazy loading |
| Compression | Preserve texture, edge detail and colour fidelity |
| Orientation | No forced crop on the artwork image. Crop only for card thumbnails. |
| Transparency | PNG permitted; consistent background handling |

## Pipeline

`ORIGINAL UPLOAD → VALIDATE → MASTER (private, Supabase Storage) → DERIVATIVES (Cloudinary) → WEBP DELIVERY`

Derivative set: Master (private) → Display 2000px → Display 1200px → Card 600px → Thumbnail 300px.
Deliver WebP with a JPG fallback.

## Upload interface text

```
Drag image here or choose file
JPG • PNG • WebP • Maximum 10 MB
ArteGO will optimise your image automatically.
```

## Failure rule

A failed upload must never erase data already entered in the form. Show the reason and a Retry action.
