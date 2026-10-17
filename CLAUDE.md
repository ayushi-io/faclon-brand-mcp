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

Guidelines (`src/tools/guidelines.js`):
- `section: "components"` serves `data/components/components.json` (read from the Figma `components` and `Badges` pages by their variable bindings, not their descriptions), plus `css_vars` for every token used and, with a format profile, each text role's size in that format. A test checks every token, role and component reference resolves.
- `section: "rules"` merges `data/rules/rules.json` with an optional format profile from `data/formats/*.json` (document, newsletter, deck and architecture, all approved), plus `rules/defaults.json` and `rules/open-questions.json`.
- **Profiles may only tighten rules.** `mergeRules` rejects overrides on `locked` rules and anything not provably tighter; the only tightenable check type today is `font-size-min` (via the `TIGHTER` map). Add new check types there.
- `voice`, `illustration`, `architecture`, `imagery` are hard-coded in `NOT_WRITTEN` and return `status: "not_written"`. Do not invent content for them; to add one, write `data/guidelines/<section>.md` and remove it from `NOT_WRITTEN`.
- Formats are auto-discovered from `data/formats/` (id must match `^[a-z0-9-]+$`).

Response envelope (`src/lib/envelope.js`): every tool is wrapped with `run()`, returning `{ ok, data | error, brand_version }`. Throw `BrandError(code, message, fix)` for user-facing errors — `fix` tells the calling model what to do next.

Transport: `src/server.js` registers tools and the server `INSTRUCTIONS` string (brand rules for the calling model). `src/app.js` is stateless Streamable HTTP — a fresh `McpServer` per `POST /mcp` so it works on Vercel. `api/index.js` re-exports it; `vercel.json` bundles `data/**` and rewrites all paths to `/api`.

## Conventions

- **Bump `data/version.json` `brand_version` on every change** to tokens, rules, guidelines or format profiles. Format `YYYY.MM.DD-n`.
- Updating from Figma: the `figma-plugin/` (Faclon Brand Sync) saves a Figma version, exports the snapshot and opens a PR on a `figma-sync/*` branch; `.github/workflows/figma-sync.yml` then runs `build:tokens` + `bump:version`, commits, tests and posts the **Build and test** status. Other changes go through `.github/workflows/ci.yml` (tokens.json must match the snapshot, `brand_version` bumped when `data/` changes, tests). Merging to `main` deploys on Vercel. `figma-plugin/code.js` `buildSnapshot()` must keep producing exactly the snapshot format; it was verified identical to the committed snapshot on 2026-10-14. Manual path: re-export snapshot → `npm run build:tokens` → `npm run bump:version` → `npm test`. The snapshot format is `{ source, collections[{name, modes, variables[{name, type, values{mode: value | {alias, collection}}, description}]}], textStyles[], effectStyles[] }`; colours are uppercase `#RRGGBB`. `test/brand.test.js` compares tokens against the snapshot directly, so they must stay in sync.
- Contradictions inside the Figma file go in `data/rules/open-questions.json` (`items` while open, moved to `resolved` with a decision and date). Tokens follow Figma variables, not annotation frames.
- Brand constraints encoded in rules: only TASA Orbiter and Inter (fallback to Inter, no other fonts); weights 400–700; blue logo on light, white logo on dark/brand backgrounds; all colours must come from tokens.
- `data/sources/uploaded-*/` holds brand-team input files (colors, typography, spacing, radius, borders-elevation, style-map) used as reference when decisions were applied; nothing in code reads them.
