# ArteGO — Project Rules

You are building ArteGO, a digital art publishing platform (Progressive Web App).
The full specification is in `docs/spec/`. Read the relevant file before writing code.

The product owner has **no coding experience**. Follow the working rules at the bottom of this file.

---

## What ArteGO does

One artwork record → many professional outputs.

`UPLOAD → MANAGE → SELECT → CREATE → PUBLISH → DISCOVER`

Four core modules:
1. Artwork upload with complete metadata
2. Interactive Virtual Gallery (2D)
3. Proportional room visualisation (photo overlay)
4. AI-assisted catalogue generation (online + digital PDF)

Not a marketplace. Not a design tool. Not a print-production system.

---

## Technology stack (fixed — do not substitute)

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS, using tokens from `docs/spec/design-tokens.md` |
| Database & Auth | Supabase (PostgreSQL, Auth, Row Level Security) |
| Private file storage | Supabase Storage |
| Public image delivery | Cloudinary |
| AI | Anthropic Claude API, server-side only |
| PDF | `@react-pdf/renderer` in a server route |
| Hosting | Vercel |

Do not add a new dependency without saying why and asking first.

---

## Non-negotiable rules

1. **Never hard-code a colour, font size or spacing value.** Use the tokens in `docs/spec/design-tokens.md`.
2. **Every table has Row Level Security.** A user may only read or write their own data. See `docs/spec/permissions.md`.
3. **Never trust the browser.** All permission checks happen server-side.
4. **Published output reads from a snapshot, never from live tables.** See `docs/spec/publishing-snapshot.md`.
5. **AI only writes drafts.** It never publishes, never overwrites existing user text without confirmation, never invents facts. See `docs/spec/ai-engine.md`.
6. **The product must work fully with AI switched off.** No dead ends.
7. **Mobile-first.** Design and build for a 390px phone screen first, then expand.
8. **Accessibility: WCAG 2.1 AA.** Visible labels, keyboard navigation, 4.5:1 text contrast, status never shown by colour alone.
9. **Never delete user data as a default action.** Archive or unpublish instead.
10. **API keys never reach the browser.** Server routes only.

---

## Repository layout

```
/app              Next.js routes (public, creator, admin)
/components       Reusable UI components
/lib              Supabase client, helpers, AI calls
/supabase         Database migrations
/docs/spec        The specification — read before building
/public           Static assets, PWA icons, manifest
```

---

## How to work with the product owner

The product owner directs and reviews; you write all the code.

- **Work in small slices.** One slice = something he can click and test. Follow `docs/BUILD-ORDER.md` in order.
- **Explain before you build.** In two or three plain sentences, say what you are about to do. No jargon.
- **Stop and show.** After each slice, tell him exactly how to test it (which URL, what to click, what he should see).
- **Explain after you build.** Say what each new file does in one line.
- **Ask when unsure.** Do not guess a business rule. Check the spec; if the spec is silent, ask.
- **Never change a spec rule silently.** If a rule seems wrong, say so and wait.
- **Commit after each working slice** with a clear message.

Write code comments in English. Speak to the product owner in Bahasa Malaysia if he writes in Bahasa Malaysia.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
