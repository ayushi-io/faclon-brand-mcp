# Asset library

Real files exported from the Figma file Design MCP, listed one per entry in `_index.json` (name, tags, file, size, rights, owner, Figma source node, last update). The MCP serves the list through `get_brand_guidelines(section: "assets")` (filter with `asset_category` and `asset_query`) and each file at `/assets/<file>`.

| Folder | What | Count |
|---|---|---|
| logos | Faclon Labs logo (blue, white), Faclon Labs logomark (only where the user asks), Bruce AI (light, dark), DeepSense, and the product marks I/O Connect, Deepsense, Forge, Foundry, I/O Sense, UNS Dark and UNS Light | 14 |
| partner-logos | Partnerships: Accenture, AWS (plus its version for dark backgrounds), Microsoft Azure, HPE; and the Faclon Labs and HPE co-branding lockup (reference for rule logo.co-branding) | 6 |
| client-logos | Client logos, one file per company, tagged with every industry it appears under | 83 |
| team-headshots | Leadership and SMEs with their roles (two left empty), cut out with no background (rule assets.headshots) | 14 |
| design-elements | Dot-particle form (dark only), light streak (brand only), dot wave (dark, light or brand) | 3 |
| icons/architecture | The Faclon architecture icon library, one folder per group | 199 |
| product-screenshots, photography | Not supplied yet | 0 |

Web and UI icons are not stored here: they come from Lucide (rule `icon.lucide-only`).

## Rules

- Client and partner logos are approved for external marketing (decided 2026-10-27).
- Fields marked "to add" (owners, headshot rights) are not recorded, and two headshot roles are left empty on purpose: never invent them.
- Next to the Faclon Labs logo, partner logos follow the co-branding lockup (rule `logo.co-branding`, `02-brand-elements/logo`).
- Logos are placed as supplied: never redrawn, recoloured or typeset. Logo usage rules are in `02-brand-elements/logo`.

## Refreshing from Figma

Figma is the source. Logos come from the ❑ Logo page (Client logos and Partner logos frames), the Company logo page and Doc building blocks; headshots from the People page (exported with the component fill off, so they are cut-outs); design elements from the Graphic elements page (the dot wave with its white frame fill off); icons from the icons_architecture page. Each entry's `source.figma_node` is the node to re-export (SVG for vector logos, PNG at 2x or 3x for image-based logos, headshots and icons), then rebuild `_index.json` and run `npm test`.
