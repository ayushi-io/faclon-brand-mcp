# Changelog

Each change to the system bumps `brand_version` in `version.json` (format `YYYY.MM.DD-n`). Newest first.

## 2026-10-31

- check_design now checks icons (new `src/tools/check-icons.js`, brand 2026.10.31-2): stroke, fill, icon and square sizes for the format, square shape, no circle or border, corners and 4.5:1 contrast, by reading the HTML into elements and resolving token variables; Lucide icons in an architecture diagram are an error. Card icons are now responsive: `icons.in_card` in each profile is a list of steps by card width (a bigger card gets a bigger icon and square), set in HTML with container queries. Figma: new Icon square component (Size 16, 24, 32, 40; the square is the icon plus 8px a side) in Icon Card, Feature grid and List Item Card, replacing the 30px placeholder.
- Iconography written (section `iconography`, brand 2026.10.31-1) from the Figma draft the brand team approved: Lucide as drawn with a 2px stroke; icons may go anywhere the content needs them (decision `icons-anywhere`, which lifts the old "no icon on a heading" limit in `icon.lucide-only`, `design.no-ai-slop` and every format's guardrails); sizes per outcome beside text, on their own and in a UI card (new `icons` in the deck, A4, newsletter and social rules); square only, a solid fill with no border, 8px padding, radius/md or radius/xl; at least 4.5:1 contrast with the listed token pairs (new rule `icon.style`). Skills, server instructions and the icons guardrails updated.

## 2026-10-30

- Data visualisation written (section `data-viz`, brand 2026.10.30-3) from the brand team's references on the Figma Data visualisation page: stat layouts (big stat with a proportion grid, stat with a unit grid), line, bar, horizontal bar and scenario charts, funnel, flywheel, steps over a rising staircase, exploded stack and plant drawing with hotspots, with 11 reference images served at `/data-viz/<file>`. They are references, not fixed layouts: kinds of design to build for content of that shape, in any format. The deck, A4 document, newsletter and social skills point to them when planning, and the deck and social `content_forms` gain `references`.
- Product colours are not part of the design system (open question `product-colours` resolved): a product mark colour is used only when the user specifically asks, and check_design's color.tokens-only fix now says to name it in the delivery note (brand 2026.10.30-2).
- No product screenshot or photography library is planned (decision `product-screens-and-photos`): photography and product-screenshots READMEs written; social posts gain `product_visuals` (the `DASHBOARD_MOCKUP_<NAME>` placeholder, as in decks), `photos` (from the user only) and the guardrail `fake-product-ui`.
- Figma Iconography page: draft drawing, size and colour rules with a specimen, for brand-team review; not in the MCP until approved.
- Social media rules rewritten from brand-team feedback on a generated carousel (cement plant energy efficiency: "very dense, no infographics, no design element, no UI cards, no logo") (brand 2026.10.30-1). Content slide themes now follow the templates with no fixed order (decision `social-themes-from-templates` replaces the light-first and dark-every-third-slide rhythm; the cover and closing stand). New in the social profile: `content_forms` (big stat with a visual, icon flow, stat tiles, split, bars, icon tiles, quote card), `spacing` (desktop roles at 540 px: gap/inline 8, gap/stack 12, gap/grid 24, padding/container 16, padding/section 56; decision `social-spacing`) with a card default, and `logo.files`. New guardrails `text-card-grids`, `stretched-cards`, `themes`, `start-from-templates`, `spacing-by-purpose`, `density`, `alignment`; `cards`, `infographic`, `design-elements` and `logo` rewritten (decision `social-density`). The skill now loads the templates and the asset library in step 2, plans a content form per slide and checks for UI cards, design elements and the logo file.
- Design elements may be used on any slide, post or page whose background allows them, not only covers and closing slides (decision `design-elements-anywhere`; design-elements README, deck and social skills).
- Every format places the real logo file from the asset library by its url, never a placeholder (decision `logo-from-asset-library`; deck, A4, architecture and social skills, server instructions). `check_design` now looks for a logo image, not just the word Faclon: an error for social, a warning for deck, document and architecture.
- Good vs bad examples: the cement plant carousel added.

## 2026-10-29

- Open question `product-colours`: I/O Connect and DeepSense have no colour tokens; their product marks use yellow #FFC716 and orange #FF6600. Raised after a platform deck used them as product colours at the user's request (brand 2026.10.29-7); its note now records white text on the orange (brand 2026.10.29-8).
- The "content design language" comment on the closed-loop slide is dropped at the brand team's request: open question `content-design-language` and its example removed.
- Deck guardrails `use-reference-slides` and `qna` now point to the ready HTML reference slides (brand 2026.10.29-5). Figma doc pages refreshed: Decks rules synced with the deck profile (new rows and a "Content forms" section), icon rule on the Decks, A4, Newsletters, Social media, Iconography and Brand Guidelines pages, dot-particle form on dark and brand on Graphic elements and Social media, Utkarsh Srivastava on Brand Assets and the Decks template, version tag, and Changelog entries for 25 to 29 October.
- All four Layouts reference slides now ship as ready HTML in `ds/04-templates/decks/reference/`: page breaker (also Q&A; the brand team's mapped frame 3069:2792, slots for label, title and an optional proof strip) and closing with decoration-only backdrops; team (3058:13948) and product stack (3058:21738) as fixed 2x renders of the Figma slide with every word in the alt text. The closing slide's text now keeps the reference's 134px left edge, as the brand team's mapped page breaker does. The fixed team slide is the leadership team only; project teams are designed from the user's content. On the Figma team slide, "Utkarsh Narain" was updated to "Utkarsh Srivastava". The cover stays a layout template (its backdrop is a stack of scaled images and blend modes, not a fixed design).
- Good vs bad examples written (`ds/06-taste/good-vs-bad-examples`, new section `examples`): the eleven commented slides of the Cyclone Jam deck, each with the brand team's comment as written, what went wrong and the deck rule that now prevents it; images served at `/examples/`.
- Deck reference slides can ship as ready HTML: the closing slide (Figma Layouts › 29 · Close, 3058:22750) is `ds/04-templates/decks/reference/closing.html` with a decoration-only backdrop (`closing-backdrop.jpg`, composited from the slide's own Figma layers, text and logo left out). The deck profile serves it inline as `reference_slides.slides.closing.html`; Claude fills only its `data-slot` elements (tag, statement). Mapped as for every reference slide: background/brand, chip tokens, Display/XL, the white logo on the 52px edge.
- Team headshots: Utkarsh Narain is now Utkarsh Srivastava, as renamed on the Figma People headshots page (asset id `team-headshots/utkarsh-srivastava`, file renamed; Figma component 3136:2531 renamed to match).

## 2026-10-28

- Deck feedback from the brand team on a generated deck (Cyclone Jam prediction), brand 2026.10.28-2:
  - Infographics required: the deck profile gains `content_forms` (sequence, lifecycle, phases, problem and solution, numbers, comparison, architecture, like items, people), the skill names each slide's form before designing, and a grid of text cards is banned for processes, lifecycles, architectures and numbers (decision `infographic-required`).
  - Density and alignment: cards sized to their content, no empty boxes, padding on every block, the cover's title and details as one group, labels aligned and never wrapping (decision `deck-density`).
  - Colour by meaning: problems and risks in the Negative intent, outcomes in brand or Positive (decision `problem-negative`, added to rule `color.status-intents`).
  - Architecture slides in a deck use the architecture diagram language (`architecture_slides`, decision `architecture-in-decks`).
  - Product and dashboard slides are light with a `DASHBOARD_MOCKUP_<NAME>` placeholder; no fake product UI (`product_slides`, decision `product-slides-light-with-mockup`).
  - Highlighted cards on dark slides use container/brand, never brand/800 to brand/1000 (decision `highlight-contrast-on-dark`).
  - AI slides have no default theme; Claude asks whether they should be dark (decision `ai-slides-theme-optional`).
- Icons on lists, all formats: each item in a list or grid of tools, capabilities, features, steps or outcomes gets a Lucide icon; still never decorative (rule `icon.lucide-only`, decision `icons-on-lists`).
- The dot-particle form may be used on brand backgrounds as well as dark, as on the closing reference slide (decision `dot-particle-on-brand`).
- Asset owners and headshot rights: every asset (partner and client logos, architecture icons and team headshots included) is owned by the Faclon Labs brand team. Team headshots are approved for marketing use whenever required. No asset field is "to add" any more; Rajveer Singh's and Sarang Vakharia's roles stay empty on purpose. Decision `asset-owners-and-headshot-rights`.

## 2026-10-27

- Architecture zones and legends: zones are colour-coded only when the user asks. Claude asks whether the user wants a legend before designing, and adds one only on a yes. Both moved from "to define" to what the user decides (decision `architecture-zones-legend`).
- Architecture balance, from brand-team feedback on a generated diagram where the I/O Sense outcome filled the canvas height and the labels mixed four sizes. The outcome is scaled uniformly so its body text matches the diagram text (native sizes in `final_outcome.native`). It is at most a quarter of the content width (456px, funnel included) and no taller than the input side. Node tags, device labels, captions and arrow labels share one size per density (Body/XS, Body/SM, Body/MD); only the weight differs. `check_design` adds `architecture.outcome-balance` and `architecture.one-text-size` (at most 4 font sizes). Decision `architecture-balance`.
- Architecture diagrams follow the brand team's new Figma designs. Devices use the four icon + content styles from the Architectures page (`node_styles`: boxed tag, tag, label, caption), chosen by the device's role. The tags stay light blue, Outfit becomes Inter, labels are text/secondary, and a new device caption style is never below 10px. The Icon + content reference is a sixth architecture template. The I/O Sense outcomes are now the three on the Figma page: Faclon scope (default), Faclon scope with funnel, and steam trap (steam-trap diagrams only). They replace compact, on premise and web platform.
- Architecture diagrams: brand blue is kept for the final outcome; everything else uses neutrals and light blue tints (brand/050 to brand/400): device tags container/info with text/heading, sub-zone border brand/300, data-flow arrow brand/400, title text/heading. Every diagram ends in one of the four I/O Sense outcomes (new asset category `architecture-outcomes`), placed unchanged, Faclon scope by default; it changes only when the user asks. `check_design` flags brand/500 or darker blue in architecture HTML (rule `architecture.brand-on-outcome`).
- Eight new components (blocks), designed in Figma from design-system tokens, text roles and existing atoms, light and dark: Stat tile, Quote card, Logo wall, Feature grid, Process flow, Comparison table, CTA band, Cover block. Served with the other 20 in section `components` (28 in all).
- QA and export written: `10-export` (HTML page sizes per format, fonts from Google Fonts, assets by URL; file naming `<topic>_<outcometype>_faclon_<YYYY-MM-DD>.html`; delivery in the chat only) and `08-qa-ai` (the AI review before delivery; checklists point to each skill). Served as sections `export` and `qa`; the server instructions and every skill's Deliver step name the file and say chat only.
- Glow is approved for Bruce AI content only (as on the Bruce AI carousel cover), with the Bruce AI gradient; it stays banned everywhere else, and glass never. `check_design` allows glow when the content is about Bruce AI.
- Templates (04-templates): 34 templates from the Figma Template frames, 21 for decks, 5 for architectures (including the camera-based vision system) and 8 for social media, each with section, purpose, theme, layout notes and a thumbnail. Served by `get_brand_guidelines(section: "templates", format_profile)`, thumbnails at `/templates/...`. Templates give layout only, never content. The deck, architecture and social skills start from them. A4 documents and newsletters have no templates yet.
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
