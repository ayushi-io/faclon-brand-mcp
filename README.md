# faclon-brand-mcp

MCP server for the Faclon brand. Built from scratch on 2026-10-08 from the Figma file **Design MCP** (`UDARPzxpNySOS2F3mxhgUs`).

This is layer 1 of 6 (Brand). Assets, Content, Generation, QA and Export come next.

## Tools

| Tool | What it does |
|---|---|
| `get_tokens(category?, mode?, as?)` | Design tokens. `category`: color, typography, spacing, radius, border, elevation, opacity. `mode`: light/dark (color), desktop/mobile (typography, spacing). `as`: json, css, tailwind, figma. |
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

## Updating from Figma

1. Re-export the snapshot from Figma into `data/figma/snapshot.json` (currently done with the figma-console Desktop Bridge, because the Figma Variables REST API needs an Enterprise plan).
2. `npm run build:tokens`
3. Bump `data/version.json`.
4. `npm test`

## Deploy

Vercel: import the repo as a new project, no build step needed. The MCP URL is `https://<project>.vercel.app/mcp`. Add it in Claude as a custom connector.
