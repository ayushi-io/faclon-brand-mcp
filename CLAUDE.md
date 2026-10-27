# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An MCP server that serves the Faclon marketing design system (tokens, brand guidelines, components, per-format rules) to Claude. Values come from the Figma file **Design MCP** (`UDARPzxpNySOS2F3mxhgUs`). Planned flow: **Brand** (foundations, brand elements) and **Assets** side by side → **Generation** (components, templates, taste, skills) → eight outcomes (social media, images, decks, A4 documents, unique A4 forms, case studies, newsletters, architectures) → **QA / AI** → **Brand Validator** → **Export (HTML only)**. Only Brand and the deck, A4, newsletter, architecture and social media rules are built. Logo usage rules live in Brand, logo files in Assets. Each outcome has its own rules (defaults, what not to do, ideal practice), which may only tighten Brand's.

Figma stays the source of truth for every value (decided 2026-10-21, replacing a short-lived plan to make `tokens.json` the source): `tokens.json` is always generated from the Figma export, never edited by hand.

Three tools: `get_tokens(category?, mode?, format?, as?)`, `get_brand_guidelines(section?, format_profile?)` and `check_design(html, format_profile?)` (added 2026-10-27: a static check of finished HTML against the rules, in `src/tools/check.js`; allowed values come from tokens.json and the merged rules, findings carry rule, severity, evidence and fix; voice issues are warnings because they are the user's words). `test/mcp.test.js` asserts the tool list is exactly these three — update it when adding tools.

## Commands

Node >= 20, ESM, no build step, no linter configured.

```bash
npm install
npm test                                   # node --test "test/*.test.js"
node --test test/brand.test.js             # single file
node --test --test-name-pattern="spacing" test/brand.test.js   # single test
npm start                                  # http://localhost:8787/mcp (PORT env overrides)
npm run build:tokens                       # sources/figma/snapshot.json -> ds/01-foundations/tokens.json
npm run build:components                   # sources/figma/components-snapshot.json -> ds/03-components/components.json (--verbose too)
npm run bump:version                       # ds/00-start-here/version.json -> today's YYYY.MM.DD-n
```

## Layout

**Data-driven: almost all behaviour lives in `ds/`, not code.** `ds/` is the design system tree (`00-start-here` … `10-export`, see `ds/00-start-here/README.md`); `sources/` holds raw inputs (Figma exports, brand-team overrides, uploaded token files). Every path the code uses is in `src/lib/paths.js`; `src/lib/data.js` reads them (`readData`, cached per process, paths relative to the repo root; `readDoc` parses Markdown front matter).

A Markdown file with front matter `status: not_written` and `needed: …` is a known gap: the tools serve it as `status: "not_written"`. Never fill one with invented content; to write a section, replace the file with real content (no front matter).

## Architecture

Token pipeline:
1. `sources/figma/snapshot.json` — raw Figma variables/styles export. Exported via the figma-console Desktop Bridge (Figma Variables REST API needs Enterprise). Never hand-edit tokens downstream of this.
2. `sources/overrides/semantic-colors.json` — temporary brand-team overrides applied on top of Figma by the build script; delete entries once Figma matches.
3. `scripts/build-tokens.mjs` resolves every alias to a final value while keeping the reference (e.g. `value: "#1655F2", ref: "brand/500"`) and writes `ds/01-foundations/tokens.json`. Opacity variables are 0–100 in Figma (Figma reads them as percentages); the build divides by 100.
4. Gradients: `paintStyles` in the snapshot (the `gradient/*` Figma paint styles, with a CSS angle the plugin reads from the gradient transform) become the `gradient` category (`--gradient-brand`, `--gradient-bruce-ai`). They are allowed only where a rule allows them (design.no-ai-slop exceptions).
5. `src/tools/tokens.js` serves `tokens.json` as json/css/tailwind/figma. Modes: `light`/`dark` apply only to `color`; `desktop`/`mobile` only to `typography` and `spacing` — mismatches are errors.
6. **Text roles** (`typography.roles`): the Figma `Text Roles` collection (modes Document / Newsletter / Deck) aliases Semantic Typography sizes, which still follow Desktop/Mobile, so each role resolves to format × breakpoint. `Role/*` text styles supply family, weight and case; they are excluded from `typography.styles`. `get_tokens` takes `format` to narrow roles; CSS emits `--role-*` with document on `:root` and `[data-format="newsletter"|"deck"]` overrides. A test checks every role against each format profile's `type.min-size`.

Component pipeline:
1. `sources/figma/components-snapshot.json` — every component and component set on the Figma `components` and `Badges` pages, per variant: property definitions, auto-layout, sizing and every variable binding, down through nested instances (no descriptions). Written by `buildComponentsSnapshot()` in the plugin. Never hand-edit.
2. `scripts/build-components.mjs` derives each component from its bindings (surface, layout, parts, variants grouped by the smallest set of variant properties a value depends on) and merges into `ds/03-components/components.json`. Figma owns every value; the file owns `about`, `usage`, each `use`, part `note`s and hints the build can't derive (Card base's `text`), plus its order and which optional details it shows (`default`, an `(optional)` mark in `contains`). New components get an empty `use` and are listed; removed ones are dropped and listed; hard-coded colours and primitive bindings are warned about. Built from scratch, the derivation matches the hand-written file except those kept details.
3. `test/components.test.js` checks `components.json` equals the build of the export, and the build's add/remove/change/warning behaviour.
4. `ds/03-components/README.md` lists the 20 built components and the 8 still to design (folders with `not_written` READMEs).

Format profiles are **assembled** by `loadProfile()` in `src/tools/guidelines.js` from the files that own each part (`profileParts` in `paths.js`): `ds/07-skills/<outcome>/rules.json` (id, defaults, who decides, fixed, overrides, export), `ds/01-foundations/grid-layout/<id>.json` (canvas, safe area, grid), `ds/06-taste/per-format-rules/<id>.json` (`must_not`, `avoid`, `design_direction`), plus `ds/04-templates/decks/reference-slides.json` for the deck and `ds/02-brand-elements/diagrams/architecture.json` (density, shapes, arrows, icons) for architecture. Format ids (`deck`, `document`, `newsletter`, `architecture`, `social`) differ from outcome folders (`decks`, `a4-documents`, `newsletters`, `architectures`, `social-media`); profiles are discovered from every `07-skills/*/rules.json`. Guardrail `basis` refs (`rule:`, `default:`, `decision:`, `profile:<path>`) are checked by a test against the assembled profile. Every outcome exports HTML only. When an outcome's `SKILL.md` is written (not `not_written`), `loadProfile()` adds its body as `profile.skill`; a test checks every format profile has one with the standard parts.

Guidelines (`src/tools/guidelines.js`):
- Markdown sections map to files in `SECTION_FILES` (`paths.js`); overview is `ds/00-start-here/README.md`, principles is `ds/00-start-here/principles.md` (seven brand design principles; no. 7 "think like sales, design like a senior designer" is also in the server `INSTRUCTIONS`), design-elements is `ds/02-brand-elements/design-elements/README.md` (the only no-AI-slop exceptions, with the gradient/bruce-ai style), voice is `ds/01-foundations/voice/voice.md`.
- `section: "components"` serves `components.json` plus `css_vars` for every token used and, with a format profile, each text role's size in that format. A test checks every token, role and component reference resolves. The named cards are starting points, not a closed set: the `new-card-designs` decision lets Claude design new cards on Card base, carried by the components `usage`, each profile's `card-variety` / `same-card-everywhere` guardrails and the server `INSTRUCTIONS`.
- `section: "rules"` merges `ds/09-brand-validator/validator-rules.json` with an optional format profile, plus `ds/01-foundations/defaults.json` and `ds/00-start-here/open-questions.json`.
- **Profiles may only tighten rules.** `mergeRules` rejects overrides on `locked` rules and anything not provably tighter; the only tightenable check type today is `font-size-min` (via the `TIGHTER` map). Add new check types there.
- `voice` was written from the brand team's answers in `review/voice-draft.html` (2026-10-21); it also holds the approved facts list (there is no separate Content layer), and its newsletter tone is provisional. A test keeps en and em dashes out of it, since the voice bans them.
- `illustration` (two styles: dot-matrix forms, pixel dissolve) and `imagery` (`ds/02-brand-elements/photography-imagery/README.md`, two styles: monochrome 3D renders, industrial photos with data overlay) were written on 2026-10-26 from brand-team references on the Figma Illustration and Image style pages; each style names its theme. `architecture` (diagram conventions, separate from the `architecture` format profile) is still `not_written`.

Response envelope (`src/lib/envelope.js`): every tool is wrapped with `run()`, returning `{ ok, data | error, brand_version }`. Throw `BrandError(code, message, fix)` for user-facing errors — `fix` tells the calling model what to do next.

Transport: tool logic in `src/tools/` is plain JS with no MCP dependency (tests call it directly). `src/server.js` registers tools and the server `INSTRUCTIONS` string (brand rules for the calling model). `src/app.js` is stateless Streamable HTTP — a fresh `McpServer` per `POST /mcp` so it works on Vercel. `api/index.js` re-exports it; `vercel.json` bundles `{ds,sources}/**` and rewrites all paths to `/api`.

## Conventions

- **Bump `ds/00-start-here/version.json` `brand_version` on every change** under `ds/` or `sources/`, and add a line to `ds/00-start-here/changelog.md`. Format `YYYY.MM.DD-n`.
- Updating from Figma: the `figma-plugin/` (Faclon Brand Sync) saves a Figma version, exports both snapshots to `sources/figma/` and opens a PR on a `figma-sync/*` branch; `.github/workflows/figma-sync.yml` then runs `build:tokens` + `build:components` + `bump:version`, commits, tests and posts the **Build and test** status (the run summary lists component changes and components that need a `use` line). Other changes go through `.github/workflows/ci.yml` (tokens.json and components.json must match their snapshots, `brand_version` bumped when `ds/` or `sources/` changes, tests). Merging to `main` deploys on Vercel. `figma-plugin/code.js` `buildSnapshot()` must keep producing exactly the snapshot format; it was verified identical to the committed snapshot on 2026-10-14 and again on 2026-10-21, when `buildComponentsSnapshot()` was added and its export reproduced `components.json` byte for byte. Manual path: re-export the snapshots (run the plugin functions through the figma-console Desktop Bridge) → `npm run build:tokens` → `npm run build:components` → `npm run bump:version` → `npm test`. The snapshot format is `{ source, collections[{name, modes, variables[{name, type, values{mode: value | {alias, collection}}, description}]}], textStyles[], effectStyles[], paintStyles[] }`; colours are uppercase `#RRGGBB`. `test/brand.test.js` compares tokens against the snapshot directly, so they must stay in sync.
- Decisions and contradictions inside the Figma file go in `ds/00-start-here/open-questions.json` (`items` while open, moved to `resolved` with a decision and date). Tokens follow Figma variables, not annotation frames.
- Brand constraints encoded in rules: only TASA Orbiter and Inter (fallback to Inter, no other fonts); weights 400–700; blue logo on light, white logo on dark/brand backgrounds; all colours must come from tokens; no AI slop (`design.no-ai-slop`, locked).
- `sources/uploaded-*/` holds brand-team input files (colors, typography, spacing, radius, borders-elevation, style-map) used as reference when decisions were applied; only one test reads them.
- `review/` (untracked) holds HTML previews and drafts for brand-team review. Nothing reads it and it is not deployed; a draft there is not in the MCP until its content is written into `ds/`.
