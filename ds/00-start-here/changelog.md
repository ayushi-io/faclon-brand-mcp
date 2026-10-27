# Changelog

Each change to the system bumps `brand_version` in `version.json` (format `YYYY.MM.DD-n`). Newest first.

## 2026-10-27

- Neutral-dark removed from the design system (it was almost the same as neutral-light). The dark theme now uses neutral-light, with its layers kept apart: page #192839 (background/primary), cards #243547, nested cards and borders #2F4256, stronger borders #40566D and #58728D. Light-theme border/container is neutral-light/200.
- Team headshots are cut-outs with no background (rule assets.headshots: fill with background/primary in the dark theme, never crop from the top); the Figma headshot components now use that fill.
- Partner logos updated from Figma: Accenture, AWS (and its version for dark backgrounds), Microsoft Azure and HPE; Idex and KSB removed with the OEM tie-ups section.
- Design element "Dot wave" (dark, light and brand backgrounds; full width in the lower half of a layout, as the brand team's three examples show). The three design elements are in the asset library (`design-elements`).
- Co-branding examples in Figma: Faclon Labs and HPE on light, white Faclon Labs and AWS (dark-background version) on dark.
- Asset library (05-assets): 319 files exported from Figma and listed in `_index.json`: 14 logos (Faclon Labs, logomark on request, Bruce AI, DeepSense, product marks I/O Connect, Deepsense, Forge, Foundry, I/O Sense, UNS Dark, UNS Light), 6 partner logos (with HPE and the Faclon Labs and HPE co-branding lockup), 83 client logos by industry, 14 team headshots with roles and the 199-icon Faclon architecture icon library. Served by `get_brand_guidelines(section: "assets")` with `asset_category` and `asset_query`, files at `/assets/<file>`. Client and partner logos approved for external marketing; two headshot roles and owners are 'to add'.
- Co-branding rule `logo.co-branding` (locked) from the brand team's Faclon Labs and HPE example: Faclon Labs logo, vertical divider (border/strong, 1px), partner logo, centred; about 3/4 of the Faclon Labs logo height for the gaps, the divider and the partner logo. Architecture icons now come from the library (no longer 'until provided'). Product screenshots and photography are not supplied yet.
- New tool `check_design`: checks finished HTML against the brand rules (colours, fonts, sizes, weights, radius, borders, shadows, gradients, effects, alt text, logo, voice; Brevo rules for newsletters) and returns pass or fail with fixes. Every skill runs it before delivery.

## 2026-10-26

- Uppercase is optional, not a rule: the Eyebrow, Eyebrow/Semi Bold and Role/Eyebrow styles no longer force uppercase (Figma and tokens), and the voice, typography, deck and validator text say case as written.
- Logo position: top-right corner by default in every format (new rule logo.default-position); another place only when the layout needs it. Deck default corrected from bottom-right; social posts top-right by default.
- Q&A slides use the brand-theme page breaker as designed.
- Illustration and image style written from the brand team's references: illustration styles dot-matrix forms (brand theme) and pixel dissolve (light theme); image styles monochrome 3D renders (light theme) and industrial photos with data overlay (dark theme). The illustration styles join the no-AI-slop exceptions. Every skill points to both sections.

## 2026-10-25

- Every skill opens with the role: Claude, or any AI tool or platform, acts as a senior designer on the Faclon Labs marketing team first, then designs.

## 2026-10-23

- Gradients: the gradient/* Figma paint styles are exported (snapshot `paintStyles`, plugin updated) and served as get_tokens category `gradient` (`--gradient-brand`, `--gradient-bruce-ai`).
- Skills written for decks, A4 documents, newsletters, architectures and social media (when to use, inputs, steps, structure, key rules, assets, checklist), served with each format profile as `skill`.
- Figma sync (version "Brand sync 2026-10-23"): border widths renamed to t-shirt sizes (default 1px, md 2px, lg 3px, xl 4px) with new 2xl 5px and 3xl 6px (the maximum); radius scale to 24px; card Size variants (Default, Large at radius/3xl 12px); Role/Button and Role/Tag are Inter Medium, Role/Tag no longer uppercase.
- Rule text caught up with Figma decisions of 2026-10-21: radius scale 2 to 24px; cards Default (2px) or Large (12px, for cards at least half the content width and every deck card); pill only for badges, contact pills, avatars and circular icon buttons; two accents (accent and accent-2).
- Social media format (`social`, folder `social-media`, replacing graphics): LinkedIn posts, square 1:1 and portrait 4:5, designed at 540 px and exported at 2x; 24 px safe area, 12-column grid; dark cover with the user's image, light slides with a dark break every two slides from five slides on, closing slide like the cover; logo on every slide; colour mix; Bruce AI gradient on Bruce AI posts.
- Brand design principles (seven), served as section `principles`; the server instructions ask the model to work as a senior designer who thinks like sales first.
- Design elements (dot-particle form on dark, light streak on brand), served as section `design-elements`; they and the Bruce AI gradient are the only exceptions to the no-AI-slop rule. Glow effects stay banned.
- Brand team comments on the Figma docs: deck UI cards default to a 12px radius (radius/3xl); decks and newsletters lean infographic; decks may use other colours on request, design-system tokens only; newsletter impact sections on the dark or brand theme; minimum text newsletter 12px, architecture 10px; a 2-pager that flows past two pages is highlighted to the user; shadow and heavy-border rule removed.

## 2026-10-22

- Logomark rule (`logo.logomark-on-request`, locked): always place the full Faclon Labs logo; use the logomark only where the user explicitly asks for it.

## 2026-10-21

- Content moved into this tree (00-start-here to 10-export); raw inputs moved to `sources/`. Format profiles split across 01-foundations/grid-layout, 06-taste/per-format-rules, 07-skills and, for decks and architectures, 04-templates and 02-brand-elements/diagrams. The MCP serves the same answers as before.
- Every outcome exports HTML only.
- No-AI-slop rule (`design.no-ai-slop`) in every format.
- Voice guideline; newsletter rules (no section numbers, no emoji); new card designs on Card base.
- Figma components synced automatically (plugin export, build, CI checks).

## 2026-10-17

- 20 Faclon components with tokens, text roles and CSS variables.

## 2026-10-16

- Format guardrails and specs for A4, newsletter, deck and architecture. Opacity tokens stored as 0 to 100 in Figma.

## 2026-10-14

- Text roles, Badge intents, brand blue #1655F2, format profiles, Figma sync flow.
- Status containers get their status border.

## 2026-10-09

- First token files uploaded by the brand team.
