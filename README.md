# faclon-brand-mcp

MCP server for the Faclon marketing design system. Built from scratch on 2026-10-08 from the Figma file **Design MCP** (`UDARPzxpNySOS2F3mxhgUs`).

Flow: Brand and Assets → Generation (components, templates, taste, skills) → social media, images, decks, A4 documents, unique A4, case studies, newsletters, architectures → QA / AI → Brand Validator → Export (HTML). Brand is built, with rules for decks, A4 documents, newsletters, architectures and social media; the rest comes next.

## Tools

| Tool | What it does |
|---|---|
| `get_tokens(category?, mode?, format?, as?)` | Design tokens. `category`: color, typography, spacing, radius, border, elevation, opacity, gradient. `mode`: light/dark (color), desktop/mobile (typography, spacing). `format`: document, newsletter, deck (text roles; typography only). `as`: json, css, tailwind, figma. |
| `get_brand_guidelines(section?, format_profile?)` | Guidance and rules. `section`: overview, principles, rules, defaults, components, logo, typography, color, voice, design-elements, illustration, architecture, imagery. `format_profile`: deck, document, newsletter, architecture, social. |

Every response is `{ ok, data | error, brand_version }`. Errors carry a `code` and a `fix`.

## Layout

```
ds/                      The design system (start with ds/00-start-here/README.md)
  00-start-here/         Overview, principles, changelog, version.json, open-questions.json (decision log)
  01-foundations/        Colour, typography, grid per format, spacing and radius, voice, tokens.json, defaults.json
  02-brand-elements/     Logo rules, sub-brands, illustration, iconography, imagery, data-viz, diagrams
  03-components/         components.json (from Figma) and components still to design
  04-templates/          One folder per outcome; deck reference slides
  05-assets/             Approved files and _index.json
  06-taste/              Per-format rules (must not, avoid, design direction), hierarchy, examples
  07-skills/             One folder per outcome: rules.json and SKILL.md
  08-qa-ai/              Checklists, AI review
  09-brand-validator/    validator-rules.json (every checkable rule), scoring, brand audit
  10-export/             HTML specs, naming, delivery
sources/
  figma/                 Raw Figma exports: snapshot.json (variables, styles), components-snapshot.json
  overrides/             Brand-team colour overrides applied on top of Figma
  uploaded-2026-10-09/   Token files uploaded by the brand team (reference)
src/
  lib/paths.js           Every path the code reads
  tools/                 Tool logic (plain JS, no MCP dependency)
  server.js              MCP server: tool registration and instructions
  app.js                 HTTP endpoint (POST /mcp), stateless
  local.js               Local runner
api/index.js             Vercel entry point
scripts/                 build-tokens, build-components, bump-version
figma-plugin/            Faclon Brand Sync (exports from Figma, opens a pull request)
test/                    node --test suites
```

A file marked `status: not_written` is a known gap: it lists what is needed and is never filled with invented content.

## Run locally

```
npm install
npm test
npm start            # http://localhost:8787/mcp
```

## Updating the MCP

Every change reaches the live MCP the same way: a pull request on `main`, a green check, a merge, and Vercel redeploys.

### Design changes (Figma)

1. In the Figma file, run **Plugins → Development → Faclon Brand Sync**.
2. Name the version, describe the change, click **Save version & open pull request**. The plugin saves the version in Figma's version history, exports the variables, styles and components to `sources/figma/` on a new `figma-sync/*` branch and opens the pull request. If nothing changed since `main`, it says so and opens nothing.
3. The **Figma sync** workflow rebuilds `tokens.json` and `components.json`, bumps `brand_version`, commits them to the branch and runs the tests. The pull request shows **Build and test** ✅ or ❌.
4. Merge. Vercel deploys `main`; every response then carries the new `brand_version`.

### Rules, format rules, guidelines, code

Edit on a branch, then `npm run bump:version` (whenever anything in `ds/` or `sources/` changes) and add a line to `ds/00-start-here/changelog.md`, `npm test`, push and open a pull request. The **CI** workflow checks that `tokens.json` and `components.json` match their snapshots, that `brand_version` was bumped and that the tests pass.

### One-time setup

- **Plugin:** Figma desktop → Plugins → Development → *Import plugin from manifest…* → `figma-plugin/manifest.json`. Open it once and fill **GitHub settings**: repository `ayushi-io/faclon-brand-mcp`, base branch `main`, and a fine-grained token (GitHub → Settings → Developer settings → Fine-grained tokens) limited to this repository with **Contents: read & write** and **Pull requests: read & write**. The token is stored on that computer only.
- **Vercel:** the project must be connected to this GitHub repository with `main` as the production branch (Project → Settings → Git). Pull requests then also get preview deployments.
- **Optional, recommended:** protect `main` (Settings → Branches) and require the **Build and test** check, so nothing broken can be merged.

Why a plugin: the Figma Variables REST API needs an Enterprise plan, so variables are read inside Figma.

## Deploy

Vercel, no build step. The MCP URL is `https://<project>.vercel.app/mcp`. Add it in Claude as a custom connector.
