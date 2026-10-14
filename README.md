# faclon-brand-mcp

MCP server for the Faclon brand. Built from scratch on 2026-10-08 from the Figma file **Design MCP** (`UDARPzxpNySOS2F3mxhgUs`).

This is layer 1 of 6 (Brand). Assets, Content, Generation, QA and Export come next.

## Tools

| Tool | What it does |
|---|---|
| `get_tokens(category?, mode?, format?, as?)` | Design tokens. `category`: color, typography, spacing, radius, border, elevation, opacity. `mode`: light/dark (color), desktop/mobile (typography, spacing). `format`: document, newsletter, deck (text roles; typography only). `as`: json, css, tailwind, figma. |
| `get_brand_guidelines(section?, format_profile?)` | Guidance and rules. `section`: overview, rules, logo, typography, color, voice, illustration, architecture, imagery. `format_profile`: deck, newsletter. |

Every response is `{ ok, data | error, brand_version }`. Errors carry a `code` and a `fix`.

## Layout

```
data/
  figma/snapshot.json    Raw export of the Figma variables and styles (source of truth)
  tokens.json            Resolved tokens, generated from the snapshot
  rules/rules.json       Global rules, each with severity, locked flag and Figma source
  rules/open-questions.json  Places where the Figma file contradicts itself
  guidelines/*.md        Written guidance per section
  formats/*.json         Format profiles (draft values to confirm)
  version.json           brand_version, bumped on every data change
src/
  tools/                 Tool logic (plain JS, no MCP dependency)
  server.js              MCP server: tool registration and instructions
  app.js                 HTTP endpoint (POST /mcp), stateless
  local.js               Local runner
api/index.js             Vercel entry point
scripts/build-tokens.mjs Snapshot -> tokens.json
test/                    node --test suites
```

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
2. Name the version, describe the change, click **Save version & open pull request**. The plugin saves the version in Figma's version history, exports the variables and styles to `data/figma/snapshot.json` on a new `figma-sync/*` branch and opens the pull request. If nothing changed since `main`, it says so and opens nothing.
3. The **Figma sync** workflow rebuilds `data/tokens.json`, bumps `brand_version`, commits both to the branch and runs the tests. The pull request shows **Build and test** ✅ or ❌.
4. Merge. Vercel deploys `main`; every response then carries the new `brand_version`.

### Rules, format profiles, guidelines, code

Edit on a branch, then `npm run bump:version` (whenever anything in `data/` changes), `npm test`, push and open a pull request. The **CI** workflow checks that `tokens.json` matches the snapshot, that `brand_version` was bumped and that the tests pass.

### One-time setup

- **Plugin:** Figma desktop → Plugins → Development → *Import plugin from manifest…* → `figma-plugin/manifest.json`. Open it once and fill **GitHub settings**: repository `ayushi-io/faclon-brand-mcp`, base branch `main`, and a fine-grained token (GitHub → Settings → Developer settings → Fine-grained tokens) limited to this repository with **Contents: read & write** and **Pull requests: read & write**. The token is stored on that computer only.
- **Vercel:** the project must be connected to this GitHub repository with `main` as the production branch (Project → Settings → Git). Pull requests then also get preview deployments.
- **Optional, recommended:** protect `main` (Settings → Branches) and require the **Build and test** check, so nothing broken can be merged.

Why a plugin: the Figma Variables REST API needs an Enterprise plan, so variables are read inside Figma.

## Deploy

Vercel, no build step. The MCP URL is `https://<project>.vercel.app/mcp`. Add it in Claude as a custom connector.
