# Components

Built components are designed in Figma (Design MCP, `components` and `Badges` pages) and derived into `components.json` by `npm run build:components`. Figma owns every value; `components.json` owns the `use` lines, `about` and `usage`. Each follows `_component-template.md`.

## Built (29)

- **Atoms:** Heading content, Body Text, Divider, Image, Chip, Accordion Item, Icon square (added 2026-10-31: the square behind a card icon, Size = icon size, used by Icon Card, Feature grid and List Item Card)
- **Cards:** Card base, Card, Icon Card, Highlight Card, List Item Card, Metric Card, Banner Card, Media Card, FAQ Card, Profile Card
- **Controls:** Badge, Button, Tag, Contact Pill
- **Blocks** (designed 2026-10-27, in the Figma section Blocks): Stat tile, Quote card, Logo wall, Feature grid, Process flow, Comparison table, CTA band, Cover block

New cards may be designed on Card base (decision `new-card-designs`).

| Block | For | Variants |
|---|---|---|
| Stat tile | One headline figure with a label | Tone Default, Brand, Inverse; Size Default, Large; optional trend chip |
| Quote card | A quote with the speaker | Tone Default, Inverse; Size Default, Large; optional avatar |
| Logo wall | Client or partner logos at one size | Columns 4, 6; optional caption |
| Feature grid | 3 or 4 features on the page | Columns 3, 4 |
| Process flow | Numbered steps with a connector | Steps 3, 4, 5 |
| Comparison table | Criteria against two options, Faclon Labs highlighted | one layout; rows as needed |
| CTA band | One message and one button | Tone Brand, Inverse, Default; Size Default, Large |
| Cover block | Opening of a document or deck | Tone Light, Dark, Brand (each keeps its colours on any page) |
