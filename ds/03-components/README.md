# Components

Built components are designed in Figma (Design MCP, `components` and `Badges` pages) and derived into `components.json` by `npm run build:components`. Figma owns every value; `components.json` owns the `use` lines, `about` and `usage`. Each follows `_component-template.md`.

## Built (20)

- **Atoms:** Heading content, Body Text, Divider, Image, Chip, Accordion Item
- **Cards:** Card base, Card, Icon Card, Highlight Card, List Item Card, Metric Card, Banner Card, Media Card, FAQ Card, Profile Card
- **Controls:** Badge, Button, Tag, Contact Pill

New cards may be designed on Card base (decision `new-card-designs`).

## To design (8)

Each has a folder with what is needed. Not built until designed in Figma.

| Component | Closest existing component |
|---|---|
| stat-tile | Metric Card |
| quote-card | none |
| logo-wall | none |
| feature-grid | Icon Card in a grid |
| process-flow | none |
| comparison-table | none |
| cta-band | Banner Card |
| cover-block | none |
