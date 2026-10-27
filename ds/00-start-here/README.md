# Faclon brand system overview

Source: Figma file "Design MCP". Values come from its variables and styles.

- **Typefaces:** TASA Orbiter for headings, Inter for body text.
- **Colour:** brand blue scale (brand/050–1000, primary brand/500 #1655F2), green and red status scales, one neutral ramp (neutral-light, used by both themes: its light end in the light theme, its dark end in the dark theme), and two accents: accent (#68DD68, on dark surfaces) and accent-2 (#B4FF6B, text/accent-on-brand, highlighted text on brand blue). Use semantic tokens (background/*, container/*, text/*, border/*), which switch between Light and Dark.
- **Spacing:** 4px steps from 4 to 56, with roles for inline gaps, stacks, grids, container padding and section padding. Roles tighten on mobile.
- **Radius:** 2 to 24px in 2px steps (radius/default to radius/9xl) and pill. Cards come in two sizes: Default (radius/default, 2px) and Large (radius/3xl, 12px).
- **Elevation:** flat by default; Low Raised for cards, Mid Raised for modals, popovers and dropdowns.
- **Responsive:** Desktop and Mobile modes; mobile applies below 768px.
- **Logos:** Faclon Labs (blue and white) and Bruce AI (light and dark background versions).

Call get_tokens for exact values and get_brand_guidelines(section: "rules") for the checkable rules.

## What this is

The Faclon marketing design system: everything needed to make on-brand social media posts, images, decks, A4 documents, unique A4 forms, case studies, newsletters and architecture diagrams, written for people and for AI. The Faclon Brand MCP serves it to Claude.

Flow: Brand (foundations, brand elements) and Assets feed Generation (components, templates, taste, skills), which makes each outcome; QA / AI and the Brand Validator check it; Export delivers HTML.

## How to use it

- **Claude:** through the MCP tools. Start with get_brand_guidelines(section: "rules", format_profile) for the outcome, then get_tokens for values and get_brand_guidelines(section: "components") for building blocks.
- **People:** read the folders below in order. A file marked `status: not_written` is a known gap: it lists what is needed and must not be filled with invented content.

## Who owns it

Not set yet. Needed: the owner of the design system and who approves changes.

## Folders

| Folder | Holds |
|---|---|
| 00-start-here | This file, principles, changelog, `version.json` (brand_version) and `open-questions.json` (decision log) |
| 01-foundations | Colour, typography, grid and layout per format, spacing and radius, voice, `tokens.json` and `defaults.json` |
| 02-brand-elements | Logo rules, sub-brands, illustration, iconography, photography and imagery, data-viz, diagrams |
| 03-components | `components.json` (the Figma components) and components still to design |
| 04-templates | One folder per outcome; deck reference slides |
| 05-assets | Asset library: logos, partner and client logos, team headshots, architecture icons, listed in `_index.json` and served at `/assets/<file>` |
| 06-taste | Hierarchy and density, per-format rules (must not, avoid, design direction), good vs bad examples |
| 07-skills | One folder per outcome: `rules.json` (defaults, who decides, fixed) and `SKILL.md` |
| 08-qa-ai | Checklists per outcome, AI review |
| 09-brand-validator | `validator-rules.json` (every checkable rule), scoring, brand audit |
| 10-export | HTML specs, naming, delivery. Every outcome exports HTML only |

Raw inputs (Figma exports, brand-team overrides, uploaded token files) live outside this tree in `sources/`.
