# Atmospheria — The Courtyard Kitchen

> **Where every table has a story.**

A boutique-hospitalry website for an open-air multi-cuisine restaurant on VIP Road,
Vishal Nagar, Raipur — North Indian, Chinese, Italian and Continental — with a
protected staff portal for bookings, orders, the menu and the gallery.

**Stack:** React 18 · Vite · Tailwind CSS 3 · Firebase (Firestore, Auth, Storage, Hosting).

---

## 1. Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run smoke      # 51 checks: renders every screen + drives the data layer
npm run build      # production bundle into dist/
```

The site runs **immediately, with no Firebase project**. When no
`VITE_FIREBASE_API_KEY` is present the app boots in **demo mode**: a
localStorage-backed stand-in (`src/lib/localBackend.js`) implements the same
operations the SDK does, seeded with the full menu, gallery, reviews and a
realistic day of bookings and orders. Nothing leaves the browser.

**Admin portal** → `/admin` (demo credentials, shown on the login page):

```
admin@atmospheria.in  /  Atmospheria@2026
```

---

## 2. Connecting a real Firebase project

1. Create a project at <https://console.firebase.google.com>, add a **Web app**.
2. Enable **Firestore**, **Authentication → Email/Password**, and **Storage**.
3. Copy `.env.example` → `.env` and paste the SDK config values.
4. Deploy config and rules:

   ```bash
   npm i -g firebase-tools && firebase login
   firebase use --add                    # or edit .firebaserc
   npm run deploy:rules                  # firestore.rules + storage.rules
   firebase deploy --only firestore:indexes,hosting
   ```

5. Seed the starter content and create the first admin:

   ```bash
   npm i -D firebase-admin
   export GOOGLE_APPLICATION_CREDENTIALS=/abs/path/serviceAccount.json
   export SEED_ADMIN_EMAIL=owner@atmospheria.in
   export SEED_ADMIN_PASSWORD='a-long-unique-password'
   npm run seed
   ```

   (Or skip the script: sign in as any admin and press **Load starter content**
   on the dashboard — it writes the same documents by id, so it is idempotent.)

Reload the site and the **Demo data** badge in the admin header disappears — every
screen now reads and writes Firestore. No component changed.

### Local emulators (optional)

```bash
npm run emulators          # Auth 9099 · Firestore 8080 · Storage 9199 · UI 4000
VITE_USE_EMULATORS=true npm run dev
```

---

## 3. Firestore structure

| Collection | Written by | Read by | Document id |
| --- | --- | --- | --- |
| `menu_items` | admin only | public | slug, e.g. `butter-chicken` |
| `gallery` | admin only | public | `gal-…` |
| `reviews` | anyone (forced `approved: false`); admin publishes | public | `rev-…` |
| `bookings` | **anyone may create**; admin updates status; guest may cancel their own pending one | admin (list) · guest (single doc) | `b_<uuid>` |
| `orders` | **anyone may create**; admin updates status/payment | admin (list) · guest (single doc) | `o_<uuid>` |
| `admin_users` | admin only | admin only | Firebase Auth uid |
| `site_settings` | admin only | public | `public` |

### The security model, in one paragraph

The public site is anonymous, so it can **create** a booking or an order but can
never `list` the collection, never read somebody else's document, and never touch
the menu. Guest documents are written with a client-generated, unguessable id
(`crypto.randomUUID()`) which doubles as the reference shown on the confirmation
screen; the rules allow `get` on that single document and keep `list` admin-only,
so the id *is* the secret. Only a caller with a non-disabled document in
`admin_users/<uid>` may change menu items, gallery photos, booking status or the
order queue. Submitted reviews are pinned to `approved: false` by the rules
themselves — the client cannot publish one.

Read `firestore.rules` for the field-level validation on every create, and the
comment at the top for the custom-claims upgrade path once reads get expensive.

```bash
npm run deploy:rules      # after any change — rules are not deployed by `firebase deploy` alone
```

---

## 4. Photographs

**No image in this project is AI-generated, and none is stock.** Every one is a
real `<img>` tag with descriptive alt text pointing at a final on-disk path:

```jsx
{/* replace with photo from Instagram @atmospheria.raipur or the Google Maps listing */}
<Photo
  src="/images/ambience/courtyard-hero-01.jpg"
  alt="Wide evening shot of the open-air courtyard with wooden tables under string lights"
  ratio="3/2"
  kenburns
/>
```

Drop the real file at that path and it renders — no code change. Until then,
`<Photo/>` swaps in a labelled SVG stand-in (generated in code, not by a model)
that prints the path it is waiting for, so nothing ever looks broken.

- `public/images/README.md` — the folder map, sourcing table and export settings
- `src/data/seed.js` — every record carries a `photoSource` / `source` note
- Admin → Menu / Gallery also accept uploads (Firebase Storage, downscaled to
  1400px JPEG q82 in the browser first)

---

## 5. Project layout

```
firestore.rules            security rules — read this before touching data access
storage.rules              bucket rules for menu/ gallery/ ambience/ uploads
firebase.json              Hosting SPA rewrite, caching headers, emulators
firestore.indexes.json     composite indexes for the admin queries
scripts/
  seed-firestore.mjs       bootstrap a real project (menu, gallery, reviews, first admin)
  smoke-test.mjs           renders all 14 screens + drives the data layer
  smoke-entry.jsx          SSR render entry used by the smoke test
public/images/             placeholder paths + sourcing guide
src/
  lib/
    firebase.js            SDK init, demo-mode detection, emulator wiring
    localBackend.js        the demo stand-in (same API surface)
    api.js                 THE data layer — the only module the UI imports
    authApi.js             Firebase Auth + admin_users check
    storageApi.js          compress-then-upload to Storage
    venue.js               address, hours, slots, cuisines, pods, tax rate
    placeholder.js         the SVG stand-in generator
  data/seed.js             43 dishes, 16 photographs, 8 reviews, 5 hero slides
  context/                 Auth · Cart · Data (one subscription per collection) · Toast
  hooks/                   useLive, useScrolled, useActiveSection, useMyBookings
  components/              Photo, Reveal, Icons, Nav, Footer, CartDrawer, DishCard, admin/ui
  sections/                Hero, About, Menu, Booking, Order, Gallery, Events, Reviews, Location
  pages/                   public routes + pages/admin/*
```

---

## 6. What the site does

**Public** — hero ambience carousel with quick CTAs · the courtyard story and the
four dining pods (deck, couple's nook, café corner, family dining) · filterable
menu with veg/non-veg marks, per-dish photos, prices and 86'd items · table
booking that writes to `bookings` and shows pending → confirmed live · dine-in /
takeaway ordering with per-dish customisation and a live status tracker ·
filterable gallery with lightbox · events and private dining with an enquiry
form · the 4.4★ review wall plus moderated submissions · Google Map, hours and
contact.

**Admin** (`/admin`, Firebase Auth email/password) — dashboard with tonight's
table plan and the live kitchen queue · bookings manager (confirm / reject /
reschedule / seated / completed / no-show, filter by date and status) · orders
board (received → preparing → ready → served, mark paid, cancel) · menu manager
(add / edit / delete, price, veg flag, tags, add-ons, photo upload, 86 toggle) ·
gallery manager (upload, replace, caption, alt text, album, featured, drag to
reorder) · analytics (bookings, covers, revenue and popular dishes over a rolling
14 days, slot pressure, order mix).

---

## 7. Design notes

Palette is the courtyard: **terracotta** `#c4622d`, **deep green** `#1f3d2b`,
**cream** `#faf5ec`, **warm wood** `#8b5e3c` — all in `tailwind.config.js`.
Headings are **Fraunces** (variable serif), body **Inter**. Motion is limited to
scroll reveals, a slow Ken Burns on the active hero frame and hover lifts, and
all of it is switched off under `prefers-reduced-motion`.

---

## 8. Before going live

- [ ] Real photographs dropped into `public/images/` (see `public/images/README.md`)
- [ ] `VENUE.phone`, `VENUE.whatsapp`, `VENUE.email`, `VENUE.instagram` in `src/lib/venue.js`
- [ ] `VITE_GOOGLE_MAPS_EMBED` replaced with the embed code from the venue's own Maps listing
- [ ] Menu prices checked against the printed card
- [ ] `npm run seed` run, first admin password changed, service-account key deleted
- [ ] `npm run deploy:rules` after any rules change
- [ ] `firebase deploy`
