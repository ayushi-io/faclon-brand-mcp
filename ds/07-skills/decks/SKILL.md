# Skill: decks

Make a Faclon Labs presentation: 16:9 slides, delivered as one HTML file. Format id `deck`.

## Your role

Claude, or any AI tool or platform using this skill, acts as a senior designer on the Faclon Labs marketing team first, and only then designs. A senior designer thinks like sales before touching the layout (who the buyer is, where they are in the sales pipeline, what they should do next), makes the design calls with confidence and explains the important ones briefly, and flags anything that would weaken the piece for the buyer instead of quietly working around it. Sales thinking shapes the design, never the user's words (design principle 7).

## When to use it

- The user asks for a deck, presentation, slides or a pitch.
- Not for a single social post or carousel (use social media), a printable document (use A4 documents) or a system diagram on its own (use architectures).

## What the user gives

- **Needed:** what the deck is for and who will see it; the content and facts, slide by slide or as a document to lay out.
- **Optional:** the number of slides; which page-breaker and closing design to use; whether the product stack or team slide is wanted.
- If the purpose, audience or scope is unclear, ask before designing. Never add a slide, claim or number the user did not give.

## Steps

1. **Think like sales.** Who is the buyer, where are they in the pipeline (first hearing of Faclon Labs, comparing options, ready to decide) and what should they do after the deck? Let that set the order of emphasis and the one message of each slide. It never changes the user's words.
2. **Load the rules.** `get_brand_guidelines(section: "rules", format_profile: "deck")`, then `get_tokens(format: "deck")` and `get_brand_guidelines(section: "components", format_profile: "deck")`.
3. **Plan the slides.** One message per slide. Spread the content across slides (unless the user set the number). Mark which slides use a reference slide and which you design. For every slide you design, name the shape of its content and the form you will draw it in (`content_forms` in the profile):
   - sequence or workflow: a flow or timeline with numbered nodes and connectors;
   - lifecycle or closed loop: a loop diagram with arrows back to the start;
   - phases or roadmap: a timeline or growing phase blocks;
   - problem and solution: a split contrast, the problem in the Negative intent;
   - numbers: big numbers, stat rows or a chart;
   - comparison: a comparison table or matrix;
   - architecture or data flow: an architecture diagram (see below);
   - like items: a grid with an icon per item, cards sized to their content;
   - people: the team reference slide or template.
   A grid of text cards is never the form for a process, lifecycle, architecture or set of numbers.
4. **Design.** Build each slide on the grid with the components and text styles below. Use the reference slides where they apply, and start other slides from the deck templates (`get_brand_guidelines(section: "templates", format_profile: "deck")`: cover, page breaker, content, product stack, dashboard and product, team, closing). Take a template's layout only, never its content.
   - **Architecture, data-flow and integration slides** follow the architecture format: call `get_brand_guidelines(section: "rules", format_profile: "architecture")` and use its zones, device styles, icons from the architecture icon library, arrows, colours and the I/O Sense outcome when the diagram ends in I/O Sense; start from the architecture templates; keep deck text at 14px or more.
   - **Product and dashboard slides** (what an operator or user sees in I/O Sense or another product) use the light theme and show a dashboard mockup. Until product screenshots are in the asset library, place a placeholder frame where the mockup goes (container/secondary, 1px dashed border/strong, radius/3xl, the label `DASHBOARD_MOCKUP_<NAME>` centred in Body/24 text/secondary). Never draw a fake product UI.
5. **Check.** Run `check_design(html, format_profile: "deck")` on the finished HTML, fix every error and run it again; flag warnings about the user's words to the user instead of changing them. Then go through the checklist at the end, which covers what the tool cannot see (layout, spacing, hierarchy, overflow).
6. **Deliver** one HTML file, named `<topic>_deck_faclon_<YYYY-MM-DD>.html` (see section "export"), in the chat only, plus a short note of anything you flagged (content that did not fit, a suggestion waiting for approval, each `DASHBOARD_MOCKUP_<NAME>` placeholder to replace).

## Structure

- **Canvas:** 1920 × 1080 px, 52px safe area on every side (spacing/52), content area 1816 × 976, 12-column grid.
- **Reference slides** (Figma Design MCP › Layouts, listed in `04-templates/decks/reference-slides.json`):
  - Fixed: the product stack and team slides, used as designed whenever asked for.
  - Hero: page breakers and closing slides; pick one of the designs. Q&A slides use the brand-theme page breaker "Reference Slides for QnA".
  - Content: starting points for normal slides; adapt the layout to the content.
  - Reference slides with an `html` field ship as ready HTML: place the snippet as it is. The page breaker (also the Q&A slide) and closing slide have a backdrop and `data-slot` elements: fill only those with the user's words. The team and product stack slides are fixed renders of the Figma slide: nothing to fill. Never redraw a backdrop, move the text or swap in a design-element file.
  - The fixed team slide is the Faclon Labs leadership team. A project team (the people on one proposal) is designed from the user's content instead (content form `people`).
  - On every reference slide, map only four things to the design system: background colour to the theme token, fonts to the nearest text style (14 to 72px), chips to the chip tokens, and the logo to its placement.
- **Themes:** light (background/primary), dark (background/inverse) and brand (background/brand), each with its fixed text and logo colours. Other colours only when the user asks, and only design-system tokens.
- **AI slides** have no default theme: ask the user whether they want them dark; otherwise pick the theme for the slide like any other.
- **Design elements:** the dot-particle form on dark or brand, the light streak on brand only, as on the reference cover and closing slides. On a reference slide, place each element where the reference has it.
- **Logo:** top-right on the 52px edge by default; another corner only when the slide design needs it (for example a tab row across the top). White on dark and brand, blue on light.

## Rules that matter most

- Text uses the named style for its element (headline Display/LG Bold, hero Display/XL, body Body/24), in the Deck text-roles mode. Never below 14px, never above 72px.
- UI cards default to a 12px corner (Size Large, radius/3xl). The named cards are starting points; build new ones on Card base. Cards in one row share a design; vary the design between sections.
- Slides are infographics: each slide's content drawn in its form (step 3), not paragraphs and not a grid of text cards.
- Fill the content area with content, not empty boxes. Size cards to their content and never stretch them to fill a row or the slide; if a slide looks empty, raise the type a role or grow the visual. Every block of text sits in a container with its padding or has the same breathing room on the grid. On covers and hero slides, the title, subline and details form one group.
- Align: a label and its text share one line or first baseline, labels never wrap, left edges line up.
- Colour follows meaning: problems, risks and pain points in the Negative intent (red container tint, red heading or icon), not only a red chip; objectives and outcomes in brand or Positive.
- On dark slides, highlight a card with container/brand and text/on-brand, never a dark blue fill (brand/800 to brand/1000).
- Highlight key words with text/link on light, text/accent on dark and text/accent-on-brand on brand, within the accent budget (about 10-15%).
- No AI slop: no gradients, glows, glass, decorative filler or AI cliche icons; no template layouts.
- Never edit the user's content. If something does not fit, tell the user and offer options (split across slides, a different layout, a chart).

## Assets

- Image and illustration styles: `get_brand_guidelines(section: "imagery")` and `(section: "illustration")`. Images and illustrations come from the user, in those styles.
- Logos: the full Faclon Labs logo (blue or white); the logomark only where the user asks for it.
- Icons: Lucide, coloured with a text token. Give each item in a list or grid of tools, capabilities, features, steps or outcomes an icon that names it; no decorative icons and no icon on a heading that adds nothing. Architecture slides take their icons from the architecture icon library.
- Images, screenshots and photos: only what the user supplies. Product screens without a supplied screenshot get the `DASHBOARD_MOCKUP_<NAME>` placeholder.

## Checklist before delivery

- [ ] `check_design` returns "pass" (no errors).
- [ ] Every slide has one message, and nothing was added that the user did not ask for.
- [ ] The user's text is unchanged; any suggested change is flagged, not applied.
- [ ] Every colour, size, space and radius is a token or a named text style; text is between 14px and 72px.
- [ ] Nothing crosses the 52px safe area or overflows its card.
- [ ] Logo on the 52px edge, the right colour for the theme.
- [ ] Reference slides keep their design; only the four mappings changed.
- [ ] Every designed slide is drawn in its content form; no process, lifecycle, architecture or set of numbers is a grid of text cards.
- [ ] No empty boxes: cards are sized to their content, every block of text has padding, and the slide's type and visuals fill the content area.
- [ ] Labels and their text are aligned, labels do not wrap, left edges line up.
- [ ] Problems and risks are in the Negative intent; highlighted cards on dark slides use container/brand.
- [ ] Lists of tools, capabilities, steps or outcomes have an icon per item.
- [ ] Architecture slides use the architecture diagram language; product slides are light with a mockup placeholder, listed in the delivery note.
- [ ] AI slides: the user was asked whether they want them dark.
- [ ] No gradients or glows (except the Bruce AI gradient and glow on Bruce AI content), AI cliches or repeated template layouts.
- [ ] One HTML file.
