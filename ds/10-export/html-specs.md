# HTML specs

Every outcome is delivered as one HTML file (see `naming.md` and `delivery.md`).

## Page sizes

From `01-foundations/grid-layout/<format>.json`:

| Outcome (format id) | Page | Safe area | Content |
|---|---|---|---|
| Deck (`deck`) | 1920 x 1080 px per slide, 16:9 | 52 px (spacing/52) | 1816 x 976 px |
| Architecture (`architecture`) | 1920 x 1080 px, 16:9 | 48 px (spacing/48) | 1824 x 984 px |
| A4 document (`document`) | 794 x 1123 px per page (A4 portrait at 96 dpi) | 36 px (spacing/36) | 722 px wide |
| Newsletter (`newsletter`) | 600 px wide on desktop, 400 px below 600 px; height follows the content | see the newsletter rules | 552 px desktop, 352 px mobile |
| Social (`social`) | 540 x 540 px (1:1) or 540 x 675 px (4:5), exported at 2x (1080 x 1080, 1080 x 1350) | 24 px (spacing/24) | 492 px wide |

Each slide, page or post is its own fixed-size block at exactly these sizes. Nothing overflows the page, the safe area, or the card, box or zone it sits in.

## Fonts

Only TASA Orbiter (headings) and Inter (body). Load both from Google Fonts in the `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=TASA+Orbiter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Use the families as `'TASA Orbiter', Inter` for headings and `Inter` for body text. No other font and no other fallback. Weights 400 to 700 only. Newsletters follow the newsletter rules for email clients.

## Values

Every colour, size, spacing, radius, border, shadow and gradient comes from `get_tokens` (as CSS custom properties, `as: "css"`), and text is set by text role for the format. Components come from `get_brand_guidelines(section: "components")`.

## Images, logos and icons

- Logos, partner and client logos, team headshots, design elements and architecture icons: the real files from the asset library (`get_brand_guidelines(section: "assets")`), placed by their URL, unchanged. Every image has alt text.
- Images and illustrations the user supplies are placed as given; slots for missing ones keep their final size and a container/secondary fill.

## Before delivery

Run `check_design(html, format_profile)` and fix every error, then go through the format's checklist (`08-qa-ai`).
