# Design elements

Graphic elements that carry the brand in layouts, beyond shapes. They are on the Figma page Graphic elements, section Design elements. Each element is used only on its own background.

| Element | Background | What it is |
|---|---|---|
| Dot-particle form | Dark only (background/inverse) | A 3D form drawn in fine dots, fading into the dark background |
| Light streak | Brand only (background/brand) | A soft, blurred streak of light blue |

## Rules

- Use an element only on its background above; never on light, and never swap backgrounds.
- The no-AI-slop rule (gradients, glows, decorative filler, dot meshes) does not apply to these elements. It still applies to everything else in the layout.
- Use the element files from Figma as they are; do not redraw, recolour or imitate them, and do not invent new elements.
- An element supports the content; text and data stay legible over or beside it.

## Gradients

Gradients are allowed only as the brand's gradient styles (get_tokens category "gradient", CSS `--gradient-*`), where a rule allows them:

- **gradient/bruce-ai** (`--gradient-bruce-ai`, blue #2436FB to pink #F377F7, left to right): Bruce AI content only, for example the headline or a highlight on a Bruce AI post.

Glow effects are not approved. The green gradient/brand style (`--gradient-brand`) is a brand gradient with no use defined yet; ask before using it. No other gradient is allowed.
