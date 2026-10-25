# Changelog

Each change to the system bumps `brand_version` in `version.json` (format `YYYY.MM.DD-n`). Newest first.

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
