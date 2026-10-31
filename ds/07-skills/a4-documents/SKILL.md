# Skill: A4 documents

Make a Faclon Labs A4 document: a 2-pager, one-pager, whitepaper, proposal, report or another document type, delivered as HTML. Format id `document`.

## Your role

Claude, or any AI tool or platform using this skill, acts as a senior designer on the Faclon Labs marketing team first, and only then designs. A senior designer thinks like sales before touching the layout (who the buyer is, where they are in the sales pipeline, what they should do next), makes the design calls with confidence and explains the important ones briefly, and flags anything that would weaken the piece for the buyer instead of quietly working around it. Sales thinking shapes the design, never the user's words (design principle 7).

## When to use it

- The user asks for a 2-pager, one-pager, datasheet, whitepaper, proposal, report or any printable A4 document.
- Not for forms or one-off A4 layouts (unique A4, not set up yet), slides (decks) or email (newsletters).

## What the user gives

- **Needed:** what the document is for and who will read it; the content and facts; whether it is a 2-pager or a longer document.
- **Optional:** the header's context label (for example "// Cement Manufacturing //"); a footer, if it should differ from the default.
- If the purpose, audience or scope is unclear, ask before designing. Never add a section, claim or number the user did not give.

## Steps

1. **Think like sales.** Who reads this, where are they in the pipeline and what should they do next? Put the outcome first and make the proof easy to find. The user's words stay as they are.
2. **Load the rules.** `get_brand_guidelines(section: "rules", format_profile: "document")`, then `get_tokens(format: "document")` and `get_brand_guidelines(section: "components", format_profile: "document")`.
3. **Plan the pages.** Sections, what leads, which content becomes cards, stats, charts, tables or images. Draw each section in the form its content has: numbers as a stat layout or a chart, steps as a flow or a staircase, stages as a funnel, a cycle as a flywheel, never paragraphs or a grid of text cards for them. For numbers, steps, stages, cycles and systems, look at `get_brand_guidelines(section: "data-viz")`: reference layouts (stat layouts, charts, a funnel, a flywheel, a staircase of steps, plant drawings) that show the kinds of design you can build and how to place the number, caption, labels and source. They are references, not fixed layouts: build designs like them, adapted to the content and the space.
4. **Design** on the grid with the components and text styles below. Flow the content across pages with the page-break rules.
5. **Check.** Run `check_design(html, format_profile: "document")` on the finished HTML, fix every error and run it again; flag warnings about the user's words to the user instead of changing them. Then go through the checklist at the end, which covers what the tool cannot see (layout, spacing, hierarchy, overflow).
6. **Deliver** one HTML file, named `<topic>_document_faclon_<YYYY-MM-DD>.html` (see section "export"), in the chat only, plus a note of anything flagged.

## Structure

- **Canvas:** A4 portrait, 794 × 1123 px at 96 dpi. 36px padding on all sides (spacing/36); content 722px wide; 12-column grid with gap/grid gutters.
- **Header:** one row at the top. Left: the optional context label (Body/XS, text/brand). Right: the blue Faclon Labs logo (default height spacing/32; size may vary). padding/container below it.
- **Footer (default):** "© Faclon Labs | All Rights Reserved" at the left and a two-digit page number (01, 02) at the right, Body/XS Medium, text/brand, no divider. A footer the user gives replaces it.
- **Theme:** light, on background/primary.
- **Spacing:** padding/section between sections, gap/stack inside a text group and between paragraphs, gap/grid between cards, padding/container inside cards.
- **Page breaks:** never cut a card, a table row, an image with its caption, or a heading from its first paragraph; move the whole block to the next page. Paragraphs and lists may continue. Nothing goes below 1045px from the top of the page (gap/grid above the footer).

## Rules that matter most

- **2-pager:** exactly two pages. If the content flows past two pages, do not cut or squeeze it: highlight it to the user and offer options.
- Text uses the style set for its element (title Heading/H2 Semi Bold, body Body/SM, caption Body/XS). Never below 10px.
- Cards are built on Card base, at most 3 in a row. Default corner radius/default (2px); a card at least half the content width uses Size Large (12px). Nest with container/secondary, then container/tertiary.
- Images at most 722px wide, with alt text in HTML.
- Never edit the user's content. Highlight, suggest, and change nothing until the user approves.
- No AI slop and no template layouts.

## Assets

- Image and illustration styles: `get_brand_guidelines(section: "imagery")` and `(section: "illustration")`. Images and illustrations come from the user, in those styles.
- The full Faclon Labs logo, blue (`logos/faclon-labs-logo-blue`): the file from the asset library (`get_brand_guidelines(section: "assets", asset_category: "logos")`), placed as an `<img>` by its `url`, never a placeholder box, a text label or a redrawn logo. The logomark only where the user asks for it.
- Icons: Lucide, anywhere the content needs them (headers, inline, lists, cards, flows), and one per item in a list or grid of tools, capabilities, features, steps or outcomes. 16px beside text, 24px on its own, in a UI card an icon square that grows with the card (the step for the card's width in `icons.in_card`, set with container queries); square only, a solid fill with no border, at least 4.5:1 contrast (section "iconography").
- Images and screenshots: only what the user supplies.

## Checklist before delivery

- [ ] `check_design` returns "pass" (no errors).
- [ ] A 2-pager is exactly two pages, or the overflow is flagged to the user.
- [ ] The user's text is unchanged; nothing was added.
- [ ] Header and footer as specified; logo blue, top-right.
- [ ] No card, table row, captioned image or heading is split across pages; nothing below 1045px.
- [ ] Every value is a token or a named text style; nothing below 10px.
- [ ] At most 3 cards in a row; images at most 722px wide, with alt text.
- [ ] No gradients or glows (except the Bruce AI gradient and glow on Bruce AI content), AI cliches or repeated template layouts.
- [ ] HTML delivered.
