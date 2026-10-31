# Iconography

Icons come from Lucide (lucide.dev, open source under the ISC license). Set by the brand team on 2026-10-30 (Figma page Brand identity › Iconography). Architecture diagrams use the Faclon architecture icon library instead (`get_brand_guidelines(section: "assets", asset_category: "icons")`), at the sizes of the architecture node styles.

## Drawing

- Lucide only, used as drawn: outline icons on a 24px grid with round caps and joins. Never fill an icon, add a second colour, change its corners or stroke ends, combine two icons or draw a new one.
- Stroke 2px (border/width md) at every icon size, as on the buttons, so the icons in one piece match each other and the text.
- If Lucide has no icon that names the item, use the nearest clear meaning; if there is none, ask the user. Never a generic placeholder icon.
- No AI cliche icons: glowing brains, circuits, robot hands, sparkles or rockets for AI.

## Where icons go

Icons can be used anywhere the content needs them: beside a header or title, inline with text, in list rows, in cards, in flows and steps, beside a number, or on their own. Each icon names what it sits with. In a list or grid of tools, capabilities, features, steps or outcomes, give every item an icon (decision `icons-on-lists`).

## Sizes per outcome

At each format's design size. "Beside text" is an icon next to its label or heading; "on its own" is an icon that leads a block, step or flow node without a square.

| Outcome | Beside text | On its own |
|---|---|---|
| Deck (1920 × 1080) | 32px | 48px |
| A4 document (794px) | 16px | 24px |
| Newsletter (600px) | 20px | 32px |
| Social post (540px, exported at 2x) | 24px | 48px |

### In a UI card: the icon follows the card

Inside a UI card the icon sits in a square, and both follow the size of the card: a bigger card gets a bigger icon and square, a smaller card a smaller one. Pick the step for the card's width at the design size:

| Outcome | Card width | Icon | Square |
|---|---|---|---|
| Deck | under 360px | 24px | 40px |
| Deck | 360 to 719px | 32px | 48px |
| Deck | 720px and wider | 40px | 56px |
| A4 document | under 300px | 16px | 32px |
| A4 document | 300px and wider | 24px | 40px |
| Newsletter | under 200px | 16px | 32px |
| Newsletter | 200 to 399px | 24px | 40px |
| Newsletter | 400px and wider | 32px | 48px |
| Social post | under 180px | 16px | 32px |
| Social post | 180 to 359px | 24px | 40px |
| Social post | 360px and wider | 32px | 48px |

The square is always the icon plus 8px (gap/inline) on every side, so it depends on the icon size. Each format profile carries these steps as `icons.in_card`. In Figma, Icon Card, Feature grid and List Item Card use the Icon square component, whose Size property is the icon size (16, 24, 32 or 40) and whose square grows with it.

In HTML, make the card a size container and set the step with container queries, so the icon follows the card wherever it is placed and on mobile:

```css
.card { container-type: inline-size; }
.icon-square { width: 40px; height: 40px; padding: 8px; }
.icon-square svg { width: 24px; height: 24px; }
@container (min-width: 360px) {
  .icon-square { width: 48px; height: 48px; }
  .icon-square svg { width: 32px; height: 32px; }
}
```

One size and one square style per set: every icon in a list, grid or flow has the same size, colour and square (cards of the same width in a row share a step). A highlighted step may use container/brand.

## The square

- **Square only.** An icon stands on its own or sits in a square. Never a circle, pill, hexagon or other polygon, unless the user asks for one.
- **A solid fill, no border.** The square is filled, with the icon centred and 8px (gap/inline) on every side. Never an outlined square, a border around the icon, or a bordered box with the icon inside it.
- **Corners:** radius/md (4px) on squares up to 32px, radius/xl (8px) on 40px and 48px squares.

## Colour and contrast

- The icon stands out clearly from its square, and an icon without a square from its background: a contrast of at least 4.5:1.
- Square and icon pairs that pass:

| Surface | Square | Icon | Contrast |
|---|---|---|---|
| Light | container/secondary | text/brand | 5.7:1 |
| Light or dark, highlighted | container/brand | text/on-brand | 5.8:1 |
| Dark | container/secondary | text/brand | 4.8:1 |
| Dark | container/primary | text/brand | 5.8:1 |
| Brand | container/primary (light) | text/brand | 6.3:1 |
| Problem or risk | container/error | text/error | 5.5:1 |
| Outcome or gain | container/success | text/success | 5.7:1 |

  Never a pair below 4.5:1, such as dark container/tertiary with text/brand (3.5:1).
- Without a square, colour the icon with one text token that suits the surface: the colour of its label, or text/brand on light to mark it; text/brand or text/heading on dark; text/on-brand on brand; in a button, the button's text colour. Never a gradient, glow or accent fill.
- Colour by meaning: text/error for problems and risks, text/success for outcomes, in the same set only when the content means it.

## Spacing

gap/inline (8px) between an icon or its square and a label beside it; gap/stack (12px) between it and text below it. An inline icon centres on the first line of its label; a lead icon lines up with the left edge of the text.

## In HTML

Inline the Lucide SVG (`viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, round caps and joins), set its width and height to the size, and colour it with `color: var(--color-text-…)`. An icon next to text gets `aria-hidden="true"`; an icon on its own gets an `aria-label`.

## What check_design checks

`check_design` finds every Lucide icon in the HTML (an `<svg>` with `viewBox="0 0 24 24"` and a stroke) and the square around it, and reports as errors: a stroke other than 2px, a filled icon, an icon size or square size that is not one of the format's, a square that is not square, a circle, pill or clipped shape, a border or outline on the square, corners other than radius/md or radius/xl, and an icon under 4.5:1 against its square or background. In an architecture diagram any Lucide icon is an error. It cannot see whether each card's icon is at the step for that card's width, or whether an icon names its item: check those against the skill's checklist.
