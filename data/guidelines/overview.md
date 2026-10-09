# Faclon brand system overview

Source: Figma file "Design MCP". Values come from its variables and styles.

- **Typefaces:** TASA Orbiter for headings, Inter for body text.
- **Colour:** brand blue scale (brand/050–1000, primary brand/500 #165FF2), green and red status scales, neutral-light and neutral-dark ramps, and a single accent (#68DD68). Use semantic tokens (background/*, container/*, text/*, border/*), which switch between Light and Dark.
- **Spacing:** 4px steps from 4 to 56, with roles for inline gaps, stacks, grids, container padding and section padding. Roles tighten on mobile.
- **Radius:** 2, 4, 6, 8, 10, 12 and pill.
- **Elevation:** flat by default; Low Raised for cards, Mid Raised for modals, popovers and dropdowns.
- **Responsive:** Desktop and Mobile modes; mobile applies below 768px.
- **Logos:** Faclon Labs (blue and white) and Bruce AI (light and dark background versions).

Call get_tokens for exact values and get_brand_guidelines(section: "rules") for the checkable rules.
