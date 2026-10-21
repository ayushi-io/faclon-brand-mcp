# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An MCP server that serves the Faclon brand system (design tokens + brand guidelines) to Claude. Source of truth is the Figma file **Design MCP** (`UDARPzxpNySOS2F3mxhgUs`). This is layer 1 of 6 (Brand); Assets, Content, Generation, QA and Export layers are planned but not built.

Two tools only: `get_tokens(category?, mode?, format?, as?)` and `get_brand_guidelines(section?, format_profile?)`. `test/mcp.test.js` asserts the tool list is exactly these two — update it when adding tools.

## Commands

Node >= 20, ESM, no build step, no linter configured.

```bash
npm install
npm test                                   # node --test "test/*.test.js"
node --test test/brand.test.js             # single file
node --test --test-name-pattern="spacing" test/brand.test.js   # single test
npm start                                  # http://localhost:8787/mcp (PORT env overrides)
npm run build:tokens                       # data/figma/snapshot.json -> data/tokens.json
npm run build:components                   # data/figma/components-snapshot.json -> data/components/components.json (--verbose too)
npm run bump:version                       # data/version.json -> today's YYYY.MM.DD-n
```

## Architecture

**Data-driven: almost all behaviour lives in `data/`, not code.** Tool logic reads JSON/Markdown through `src/lib/data.js` (`readData`, cached in-memory per process, paths relative to `data/`).

Token pipeline:
1. `data/figma/snapshot.json` — raw Figma variables/styles export. Exported via the figma-console Desktop Bridge (Figma Variables REST API needs Enterprise). Never hand-edit tokens downstream of this.
2. `data/overrides/semantic-colors.json` — temporary brand-team overrides applied on top of Figma by the build script; delete entries once Figma matches.
3. `scripts/build-tokens.mjs` resolves every alias to a final value while keeping the reference (e.g. `value: "#1655F2", ref: "brand/500"`) and writes `data/tokens.json`. Opacity variables are 0–100 in Figma (Figma reads them as percentages); the build divides by 100.
4. `src/tools/tokens.js` serves `tokens.json` as json/css/tailwind/figma. Modes: `light`/`dark` apply only to `color`; `desktop`/`mobile` only to `typography` and `spacing` — mismatches are errors.
5. **Text roles** (`typography.roles`): the Figma `Text Roles` collection (modes Document / Newsletter / Deck) aliases Semantic Typography sizes, which still follow Desktop/Mobile, so each role resolves to format × breakpoint. `Role/*` text styles supply family, weight and case; they are excluded from `typography.styles`. `get_tokens` takes `format` to narrow roles; CSS emits `--role-*` with document on `:root` and `[data-format="newsletter"|"deck"]` overrides. A test checks every role against each format profile's `type.min-size`.

Component pipeline:
1. `data/figma/components-snapshot.json` — every component and component set on the Figma `components` and `Badges` pages, per variant: property definitions, auto-layout, sizing and every variable binding, down through nested instances (no descriptions). Written by `buildComponentsSnapshot()` in the plugin. Never hand-edit.
2. `scripts/build-components.mjs` derives each component from its bindings (surface, layout, parts, variants grouped by the smallest set of variant properties a value depends on) and merges into `data/components/components.json`. Figma owns every value; the file owns `about`, `usage`, each `use`, part `note`s and hints the build can't derive (Card base's `text`), plus its order and which optional details it shows (`default`, an `(optional)` mark in `contains`). New components get an empty `use` and are listed; removed ones are dropped and listed; hard-coded colours and primitive bindings are warned about. Built from scratch, the derivation matches the hand-written file except those kept details.
3. `test/components.test.js` checks `components.json` equals the build of the export, and the build's add/remove/change/warning behaviour.

Guidelines (`src/tools/guidelines.js`):
- `section: "components"` serves `data/components/components.json` (read from the Figma `components` and `Badges` pages by their variable bindings, not their descriptions), plus `css_vars` for every token used and, with a format profile, each text role's size in that format. A test checks every token, role and component reference resolves. The named cards are starting points, not a closed set: the `new-card-designs` decision lets Claude design new cards on Card base (a tone's surface tokens, any arrangement of atoms, controls and text roles in the slot), carried by the components `usage`, each profile's `card-variety` / `same-card-everywhere` guardrails and the server `INSTRUCTIONS`.
- `section: "rules"` merges `data/rules/rules.json` with an optional format profile from `data/formats/*.json` (document, newsletter, deck and architecture, all approved), plus `rules/defaults.json` and `rules/open-questions.json`.
- **Profiles may only tighten rules.** `mergeRules` rejects overrides on `locked` rules and anything not provably tighter; the only tightenable check type today is `font-size-min` (via the `TIGHTER` map). Add new check types there.
- `voice` is `data/guidelines/voice.md`, written from the brand team's answers in `review/voice-draft.html` (2026-10-21); it also holds the approved facts list until a Content layer exists, and its newsletter tone is provisional. A test keeps en and em dashes out of it, since the voice bans them.
- `illustration`, `architecture`, `imagery` are hard-coded in `NOT_WRITTEN` and return `status: "not_written"`. Do not invent content for them; to add one, write `data/guidelines/<section>.md` and remove it from `NOT_WRITTEN`. Note the `architecture` guideline section (diagram conventions, not written) is separate from the `architecture` format profile in `data/formats/architecture.json` (canvas and guardrails, approved).
- Formats are auto-discovered from `data/formats/` (id must match `^[a-z0-9-]+$`).

Response envelope (`src/lib/envelope.js`): every tool is wrapped with `run()`, returning `{ ok, data | error, brand_version }`. Throw `BrandError(code, message, fix)` for user-facing errors — `fix` tells the calling model what to do next.

Transport: tool logic in `src/tools/` is plain JS with no MCP dependency (tests call it directly). `src/server.js` registers tools and the server `INSTRUCTIONS` string (brand rules for the calling model). `src/app.js` is stateless Streamable HTTP — a fresh `McpServer` per `POST /mcp` so it works on Vercel. `api/index.js` re-exports it; `vercel.json` bundles `data/**` and rewrites all paths to `/api`.

## Conventions

- **Bump `data/version.json` `brand_version` on every change** to tokens, rules, guidelines or format profiles. Format `YYYY.MM.DD-n`.
- Updating from Figma: the `figma-plugin/` (Faclon Brand Sync) saves a Figma version, exports both snapshots and opens a PR on a `figma-sync/*` branch; `.github/workflows/figma-sync.yml` then runs `build:tokens` + `build:components` + `bump:version`, commits, tests and posts the **Build and test** status (the run summary lists component changes and components that need a `use` line). Other changes go through `.github/workflows/ci.yml` (tokens.json and components.json must match their snapshots, `brand_version` bumped when `data/` changes, tests). Merging to `main` deploys on Vercel. `figma-plugin/code.js` `buildSnapshot()` must keep producing exactly the snapshot format; it was verified identical to the committed snapshot on 2026-10-14 and again on 2026-10-21, when `buildComponentsSnapshot()` was added and its export reproduced `components.json` byte for byte. Manual path: re-export the snapshots (run the plugin functions through the figma-console Desktop Bridge) → `npm run build:tokens` → `npm run build:components` → `npm run bump:version` → `npm test`. The snapshot format is `{ source, collections[{name, modes, variables[{name, type, values{mode: value | {alias, collection}}, description}]}], textStyles[], effectStyles[] }`; colours are uppercase `#RRGGBB`. `test/brand.test.js` compares tokens against the snapshot directly, so they must stay in sync.
- Contradictions inside the Figma file go in `data/rules/open-questions.json` (`items` while open, moved to `resolved` with a decision and date). Tokens follow Figma variables, not annotation frames.
- Brand constraints encoded in rules: only TASA Orbiter and Inter (fallback to Inter, no other fonts); weights 400–700; blue logo on light, white logo on dark/brand backgrounds; all colours must come from tokens.
- `data/sources/uploaded-*/` holds brand-team input files (colors, typography, spacing, radius, borders-elevation, style-map) used as reference when decisions were applied; nothing in code reads them.
- `review/` (untracked) holds HTML previews and drafts for brand-team review (component previews, format guardrails, deck decisions, voice draft). Nothing reads it and it is not deployed; a draft there is not in the MCP until its content is written into `data/`.
