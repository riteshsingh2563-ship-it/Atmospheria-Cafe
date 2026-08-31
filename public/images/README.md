# Photographs for atmospheria.in

Nothing in this folder is AI-generated and nothing is stock. Every image is a
**placeholder path the site is already asking for** — drop the real file in at
the exact path below and it appears on the site with no code change.

Until the file exists, `<Photo/>` renders a labelled stand-in that prints the
path it is waiting for, so the site never looks broken and the person
collecting photographs knows precisely what to fetch.

## Where the photographs come from

| Source | What to take from it |
| --- | --- |
| **Instagram** `@atmospheria.raipur` | Food shots, reels covers, event coverage, café corner, night ambience |
| **Google Maps listing** → Photos | Wide courtyard shots, seating, entrance, "By owner" uploads |
| **Venue phone / WhatsApp gallery** | Kitty parties, birthdays, corporate decks, outside catering |

Ask for the original file, not the compressed Instagram download — the site
resizes anyway.

## Export settings

- Format **JPEG**, colour space **sRGB**, no sharpening halo
- Ambience / hero: **1920 × 1280** (3:2)
- Gallery: **1400 × 1050** (4:3)
- Menu dishes: **900 × 900** (1:1), shot from above or 45°, on the terracotta plates
- Quality 80, strip EXIF

## Folder map

```
images/
├── ambience/    hero carousel, about, page headers        (17 files)
├── menu/        one per dish, named after the dish        (43 files)
├── gallery/     the public gallery grid                   (16 files)
└── events/      private dining, kitty, catering           (6 files)
```

The exact list of paths is in `src/data/seed.js` — every record carries a
`photoSource` / `source` field saying where that specific shot should come from,
and `src/lib/placeholder.js` repeats it on the stand-in itself.

## Alternative: upload from the admin portal

**Admin → Menu** and **Admin → Gallery** both accept uploads. Those files go to
Firebase Storage (downscaled to 1400px, JPEG q82 in the browser first) and the
Firestore record points at the download URL instead of a `/images/...` path. Use
that for anything that changes often; keep the folder for the permanent set.
