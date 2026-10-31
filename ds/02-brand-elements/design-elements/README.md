# Design elements

Graphic elements that carry the brand in layouts, beyond shapes. They are on the Figma page Graphic elements, section Design elements. Each element is used only on the backgrounds listed for it.

| Element | Background | What it is |
|---|---|---|
| Dot-particle form | Dark and brand (background/inverse, background/brand) | A 3D form drawn in fine dots, fading into the background |
| Light streak | Brand only (background/brand) | A soft, blurred streak of light blue |
| Dot wave | Dark, light and brand | A wide wave of fine dots, blue fading to green |

## Rules

- Use the elements on any slide, post or page whose background allows them, not only covers and closing slides; they are what makes a piece read as Faclon Labs (decision design-elements-anywhere).
- Use an element only on the backgrounds listed above: the dot-particle form on dark or brand (as on the reference cover and closing slides), the light streak only on brand, the dot wave on dark, light or brand.
- The dot wave, as the brand team's three examples show (Figma Graphic elements page: Dark, Blue and White designs): it runs the full width of the layout, bleeding off both sides, in the lower half, below the main message and above the contact or footer line. On dark it fades into the background at the bottom. Text never sits on the dots; the message goes above the wave and the footer below it.
- The no-AI-slop rule (gradients, glows, decorative filler, dot meshes) does not apply to these elements. It still applies to everything else in the layout.
- Use the element files from the asset library (`get_brand_guidelines(section: "assets", asset_category: "design-elements")`) as they are; do not redraw, recolour or imitate them, and do not invent new elements.
- An element supports the content; text and data stay legible over or beside it.

## Gradients

Gradients are allowed only as the brand's gradient styles (get_tokens category "gradient", CSS `--gradient-*`), where a rule allows them:

- **gradient/bruce-ai** (`--gradient-bruce-ai`, blue #2436FB to pink #F377F7, left to right): Bruce AI content only, for example the headline or a highlight on a Bruce AI post.

Glow is approved for Bruce AI content only, for example the glowing product visual on the Bruce AI carousel cover; never on other content. The green gradient/brand style (`--gradient-brand`) is a brand gradient with no use defined yet; ask before using it. No other gradient is allowed.
