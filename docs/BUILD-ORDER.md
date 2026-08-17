# ArteGO — Build Order

Build in this order. Do not skip ahead. Each slice must work and be tested before the next begins.

A slice is done when: it works, the product owner has clicked it himself, and it is committed to Git.

---

## Phase 0 — Foundation (no visible screens yet)

**Slice 0.1 — Project setup**
Next.js + TypeScript + Tailwind, connected to Supabase, deployed to Vercel.
*Test: the site opens at a Vercel URL and shows a placeholder page.*

**Slice 0.2 — Database schema**
Create all tables from `docs/spec/data-model.md`. Migrations in `/supabase`.
*Test: tables are visible in the Supabase dashboard.*

**Slice 0.3 — Row Level Security**
Write and test RLS policies from `docs/spec/permissions.md` for every table.
*Test: logged in as User A, User B's private data cannot be read. Prove it.*

---

## Phase 1 — Account and profile

**Slice 1.1 — Sign up, verify email, log in, log out**
*Test: create an account, receive the email, verify, log in, log out, log back in.*

**Slice 1.2 — Forgot and reset password**
*Test: reset the password and log in with the new one.*

**Slice 1.3 — Empty creator dashboard with guided checklist**
*Test: after login, see a dashboard saying what to do next.*

**Slice 1.4 — Artist profile: create and edit**
Fields from `docs/spec/data-fields.md` section 9.1.
*Test: fill in the profile, save, reload the page, data is still there.*

**Slice 1.5 — Public artist profile page**
*Test: open the public URL in a private browser window without logging in.*

---

## Phase 2 — Artwork library (Module 1)

**Slice 2.1 — Add artwork: form and image upload**
Fields from `docs/spec/data-fields.md` section 9.2. Image rules from `docs/spec/image-rules.md`.
*Test: upload an image, fill the form, save.*

**Slice 2.2 — Image optimisation pipeline**
Upload → validate → master (private) → Cloudinary derivatives.
*Test: the public page loads a small optimised image, not the original file.*

**Slice 2.3 — Artwork library grid: search, filter, multi-select**
*Test: add 5 artworks, filter by year, select 3 of them.*

**Slice 2.4 — Edit and archive artwork**
*Test: edit a title, archive an artwork, confirm it disappears from public view.*

**Slice 2.5 — Public artwork detail page**
*Test: open it logged out. A private artwork must return "not found".*

**Slice 2.6 — Collections / Series**
*Test: create a collection, add artworks, reorder them.*

---

## Phase 3 — Catalogue and PDF (Module 4, part 1)

**Slice 3.1 — Create menu**
The icon-based "What would you like to create?" screen.
*Test: tap + CREATE and see the options.*

**Slice 3.2 — Catalogue builder: select source, choose template, arrange order**
Two templates: Minimal and Editorial.
*Test: select 5 artworks, choose a template, drag to reorder, preview.*

**Slice 3.3 — Publish online + snapshot**
*Test: publish, then change the master artwork title. The published catalogue must NOT change.*

**Slice 3.4 — Generate digital PDF from the snapshot**
*Test: download the PDF. It must match the online version exactly.*

**Slice 3.5 — Portfolio output (same engine)**
*Test: generate a portfolio from a collection.*

---

## Phase 4 — AI assistance (Module 4, part 2)

**Slice 4.1 — AI server route + ai_job logging + quota**
*Test: nothing visible yet; check that a request is logged in the database.*

**Slice 4.2 — "Draft with AI" for the catalogue introduction**
Rules in `docs/spec/ai-engine.md`.
*Test: generate a draft, edit it, publish. The EDITED text must appear in both the web page and the PDF.*

**Slice 4.3 — AI artwork description and alt text**
*Test: generate, edit, save.*

**Slice 4.4 — AI off switch**
*Test: turn AI off in settings. Every screen must still work, with no disabled buttons showing.*

---

## Phase 5 — Room visualisation (Module 3)

**Slice 5.1 — Upload wall photo and set reference width**
Method in `docs/spec/room-visual.md`.
*Test: upload a wall photo, drag the marker, type 340 cm.*

**Slice 5.2 — Place artwork at true proportion**
*Test: a 100cm wide artwork on a 340cm wall must occupy roughly 29% of the marked span.*

**Slice 5.3 — Frame options, save, download, share**
*Test: save a preview, reopen it, download the image.*

---

## Phase 6 — Virtual gallery (Module 2)

**Slice 6.1 — 2D wall renderer with correct relative scale**
Hanging rules in `docs/spec/virtual-gallery.md`.
*Test: 10 artworks of different sizes render at correct relative scale, centre line at 150cm.*

**Slice 6.2 — Pan, zoom, artwork label card**
*Test: swipe on a phone, tap an artwork, see the label.*

**Slice 6.3 — Accessible List View toggle**
*Test: navigate the whole gallery using the keyboard only.*

**Slice 6.4 — Publish gallery to a public URL**
*Test: open the URL on a phone without logging in.*

---

## Phase 7 — Solo exhibition, discover, admin

**Slice 7.1 — Solo exhibition workspace**
**Slice 7.2 — Public exhibition detail page**
**Slice 7.3 — Discover: artists and artworks, basic search**
**Slice 7.4 — Admin: user list, verify artist, unpublish content, audit log**

---

## Phase 8 — PWA and polish

**Slice 8.1 — Web app manifest, icons, installable**
**Slice 8.2 — Service worker, offline states, bottom navigation + CREATE**
**Slice 8.3 — Storage quota enforcement** (`docs/spec/quota.md`)
**Slice 8.4 — Accessibility audit and fixes**
**Slice 8.5 — Run every UAT scenario in `docs/spec/uat.md`**

---

## Before submission

Run all UAT scenarios A–C, G–L and O–S from `docs/spec/uat.md`. Every one must pass.
