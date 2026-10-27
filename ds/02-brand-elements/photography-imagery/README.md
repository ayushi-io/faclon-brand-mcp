# Image style

Faclon Labs uses two image styles, set by the brand team on 2026-10-26 from their references (Figma page Brand identity › Image style). The references show layout and feel only; every layout around an image uses the design system.

## Monochrome 3D renders

Clean white and light grey 3D renders of plants, equipment and installations on a light grid floor, with one element in brand blue.

- **Theme:** light. Sits on `background/primary` or `background/secondary`.
- **Colour:** neutral whites and greys, with one brand-blue highlight on the element the content is about (a tank, a sensor, a Faclon Labs panel).
- **Lighting:** soft, even studio light; no harsh shadows, no glow.
- **Use for:** product and solution visuals, plant overviews, covers and architecture context.
- **Avoid:** realistic colour textures, more than one highlight colour, busy backgrounds.

## Industrial photos with data overlay

Real photos of people and equipment on site, darkened, with a thin overlay of detection boxes, grid marks and labels that shows the AI at work.

- **Theme:** dark. The photo sits under `background/inverse` at `opacity/overlay` so text and lines read clearly.
- **Overlay:** thin 1px lines (`border-width/default`) in `text/accent`, a few boxes only around what the content is about, labels in Role/Label.
- **Headline:** in a solid `container/inverse` block with `text/inverse`, never directly on a busy part of the photo.
- **Subjects:** real workers, plants and machines in operation, with correct safety gear.
- **Use for:** case studies, covers and social posts about results on the shop floor.
- **Avoid:** stock-photo poses, staged smiles, fake interface clutter, glow on the overlay lines.

## Rules for every image

- Use only the two styles above.
- Images come from the user: they supply them, or generate them from these styles (the brief names the style, theme and subject). Claude never generates or picks an image; until one is supplied, leave a placeholder of the final size with a `container/secondary` fill.
- No AI cliche imagery: glowing brains, circuits, robot hands, sparkles or rockets for AI.
- A4: never make an image wider than the 722px content width, or leave it without alt text in HTML.
- Newsletter: never make an image wider than the content (552px desktop, 352px mobile) or leave it without alt text.
