# Illustration

Faclon Labs uses two illustration styles, set by the brand team on 2026-10-26 from their references (Figma page Brand identity › Illustration). The references show layout and feel only; every illustration uses the design system's colours.

## Dot-matrix forms

Industrial objects (pipes, tanks, machines) drawn as a grid of small dots or characters on a solid brand-blue field.

- **Theme:** brand. Background `background/brand`; the form in `text/on-brand` (white).
- **Colour:** one colour on one background. The form gets depth from dot density, never from a gradient, glow or shading.
- **Composition:** one large form, cropped by the edge, with clear space left for the headline.
- **Use for:** covers, page breakers, hero areas and social post covers about plants and equipment.
- **Avoid:** several colours, glowing or 3D-shaded dots, AI cliche subjects (brains, circuits, robots), text set over the dots.

## Pixel dissolve

A field of square pixels that thins out across the page into a solid block that holds the headline.

- **Theme:** light. Page on `background/secondary`; pixels in brand blue (`container/brand`); the headline block on `container/inverse` with `text/inverse`.
- **Composition:** pixels are dense at one edge and fade toward the text block; the headline sits in the solid block, never on the pixels.
- **Use for:** statement and quote slides, poster-style covers and section openers.
- **Avoid:** randomly scattered dots with no direction, pixels behind text, more than one pixel colour.

## Rules for every illustration

- Use only the two styles above. They are the only illustration styles, and the no-AI-slop rule allows their dots and pixels (rule `design.no-ai-slop`, exceptions).
- Illustrations come from the user: they supply one, or generate it from these styles (the brief names the style, theme and subject). Claude never draws, generates or picks one; until one is supplied, leave a placeholder of the final size.
- Colours only from design-system tokens: one illustration colour on one background.
- No AI cliche imagery: glowing brains, circuits, robot hands, sparkles or rockets for AI.
- Text never sits on the dots or pixels; it goes in clear space or a solid block.
- The dot-particle form and the light streak are design elements, not illustrations; see section `design-elements`.
