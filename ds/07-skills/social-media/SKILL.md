# Skill: social media

Make a Faclon Labs social media post for LinkedIn: a single post or a carousel, square (1:1) or portrait (4:5), delivered as HTML. Format id `social`.

## Your role

Claude, or any AI tool or platform using this skill, acts as a senior designer on the Faclon Labs marketing team first, and only then designs. A senior designer thinks like sales before touching the layout (who the buyer is, where they are in the sales pipeline, what they should do next), makes the design calls with confidence and explains the important ones briefly, and flags anything that would weaken the piece for the buyer instead of quietly working around it. Sales thinking shapes the design, never the user's words (design principle 7).

## When to use it

- The user asks for a LinkedIn post, social post, carousel or social graphic.
- Not for slides (decks), documents (A4 documents) or email (newsletters).

## What the user gives

- **Needed:** what the post is for and who it is for; the content and facts; a single post or a carousel, and how many slides.
- **Cover image:** the user generates it and shares it. Ask for it; never pick, generate or invent it.
- **Optional:** square or portrait (you can suggest one); a call to action and link; a theme for a slide.
- If the purpose, audience or scope is unclear, ask before designing. Never add a slide, number, customer or quote the user did not give.

## Steps

1. **Think like sales.** Who is the buyer, where are they in the pipeline and what should they do after seeing the post? Design so the post moves them one step. The user's words stay as they are.
2. **Load the rules and the files.**
   - `get_brand_guidelines(section: "rules", format_profile: "social")`, then `get_tokens()` (including category "gradient" for Bruce AI posts) and `get_brand_guidelines(section: "components", format_profile: "social")`.
   - `get_brand_guidelines(section: "templates", format_profile: "social")`: the brand team's posts and carousel slides, the look to aim for.
   - `get_brand_guidelines(section: "assets", asset_category: "logos")` for the logo files and `(asset_category: "design-elements")` for the design elements. Each entry has a `url`; place it as an `<img>`.
3. **Plan.** One message per post or slide. For each slide, name the shape of its content and the form you will draw it in (`content_forms` in the profile), pick the template whose layout fits, and pick its theme:
   - numbers or a result: one big number with a visual of the change (bars, a line settling into a band, a gauge), or stat tiles for several;
   - steps or a change in how work is done: an icon flow;
   - problem and solution, or before and after: a split, the problem in the Negative intent;
   - comparison: labelled bars or a compact table;
   - like items (data sources, capabilities, pain points): cards or tiles with an icon per item;
   - a quote: a quote card with the headshot from the asset library;
   - one statement or call to action: the headline as the hero, with a design element.
   A row of text cards or a bare list is never the form for steps, results or a problem.
   For numbers, steps, stages, cycles and systems, look at `get_brand_guidelines(section: "data-viz")`: reference layouts (stat layouts, charts, a funnel, a flywheel, a staircase of steps, plant drawings) that show the kinds of design you can build and how to place the number, caption, labels and source. They are references, not fixed layouts: build designs like them, adapted to the content and the space.
4. **Design** at 540px wide on the 12-column grid, starting from the template's layout and building every value from the design system. Put supporting text, stats and items in UI cards and boxes (see Structure), place the logo file on every slide, and use design elements wherever the background allows them.
5. **Check.** Run `check_design(html, format_profile: "social")` on the finished HTML, fix every error and run it again; flag warnings about the user's words to the user instead of changing them. Then go through the checklist at the end, which covers what the tool cannot see (layout, spacing, hierarchy, overflow).
6. **Deliver** one HTML file, named `<topic>_social_faclon_<YYYY-MM-DD>.html` (see section "export"), in the chat only, at the 540px design size, ready to export at 2x (1080px). The user converts it to PNG, JPG or PDF if needed.

## Structure

- **Canvas:** square 540 × 540 (exports 1080 × 1080) or portrait 540 × 675 (exports 1080 × 1350). A set of posts can mix both.
- **Safe area and grid:** 24px on all sides (spacing/24); content 492px wide; 12 columns of 30px with 12px gutters (spacing/12). Common splits: 6 + 6, 4 + 4 + 4, 3 + 3 + 3 + 3, 8 + 4. Elements start and end on column edges. Only images may bleed to the edge.
- **Logo:** the full Faclon Labs logo file on every post and slide, top-right by default (top-left when the slide design needs it), about 132px wide: `logos/faclon-labs-logo-blue` on light, `logos/faclon-labs-logo-white` on dark and brand, as an `<img>` from the asset's `url` with alt "Faclon Labs". Never a placeholder box, a text label or a redrawn logo.
- **Carousel themes:**
  - Cover: dark theme, with the user's image, the title and the subheader.
  - Content slides: no fixed theme or order. Pick light, dark or brand per slide from the templates and the content (the templates use brand blue for step posts with a big stat, dark for stat tiles, light for quotes), unless the user asks for one. Mix themes so the carousel never reads as one colour.
  - Closing slide: the cover's theme and colours.
- **Spacing (desktop values at 540px; double at 1080):** gap/inline 8 between adjacent items, gap/stack 12 inside a card, gap/grid 24 between cards, padding/container 16 inside every card and box, padding/section 56 between sections.
- **UI cards:** supporting text, stats and items sit in cards and boxes with the container default: container/primary, 1px border/container, radius/3xl (12px), padding/container; on brand slides container/inverse with text/inverse, as in the templates. The named cards and blocks (Stat tile, Quote card, Feature grid, Process flow) are starting points; build new ones on Card base.
- **Type (at 540px; double at 1080):** headline Heading/H1 Bold (40); cover headline Display/MD (48); subheadline Heading/H2 Bold (32) beside a big number, or Body/XL (20) under a title; big numbers Display/XL Regular (72), Display/LG (60) in a stat grid; body Body/LG (18); labels Role/Label (12); CTA Role/Button (16); caption Role/Caption (12); footnotes Body/2XS (10). Never below 10px, never above 72px.

## Rules that matter most

- Every post combines colours; never a single colour. Brand blue with the neutrals and an accent highlight, all from tokens.
- Big numbers in Regular so they stay easy on the eye; Bold only when the user asks.
- **Bruce AI posts** use the Bruce AI gradient (`--gradient-bruce-ai`), for example on the headline or a highlight. No other post uses it. Bruce AI posts may also use glow (for example on the product visual); no other post does.
- **Design elements** make a post read as Faclon Labs: use them on any slide whose background allows them, not only the cover and closing. The dot-particle form on dark or brand, the light streak only on brand, the dot wave on dark, light or brand. Text never sits on the dots. They are exempt from the no-AI-slop rule; nothing else is.
- Every slide is drawn in its content form (step 3): big numbers with a visual, icon flows, stat tiles, bars, splits, not paragraphs, lists or rows of text cards. Avoid text-heavy posts: if the content is long, tell the user and offer options (a carousel, a shorter visual with detail in the post text).
- Fill the slide with content, not empty space: size cards to their content and never stretch them or pin short cards to the bottom; if a slide looks empty, raise the type a role or grow the visual. Labels and their text share a line or first baseline; left edges line up.
- Carousel slides share one grid and one type scale; vary the layout with the content.
- Never edit the user's content. The templates (`get_brand_guidelines(section: "templates", format_profile: "social")`: case study cover, step posts with a big stat, results tiles, Bruce AI cover, quote with headshot) show layout and feel only; the design system sets every value.

## Assets

- Image and illustration styles: `get_brand_guidelines(section: "imagery")` and `(section: "illustration")`. Images and illustrations come from the user, in those styles.
- Logos: the full Faclon Labs logo file from the asset library (`logos/faclon-labs-logo-blue` or `logos/faclon-labs-logo-white`, section "assets"), placed by its `url`; the logomark only where the user asks.
- The cover image: from the user.
- Photos (case-study covers, quote backgrounds): from the user only; there is no photography library. Never stock, generated or sampled.
- Product screens: the user's screenshot; without one, a `DASHBOARD_MOCKUP_<NAME>` placeholder (container/secondary, 1px dashed border/strong, radius/3xl, the label centred in Body/LG text/secondary), listed in the delivery note. Never draw a fake product UI.
- Design elements: the files in the asset library (section "assets", asset_category "design-elements"), placed by their `url` as they are.
- Headshots for quote slides: the asset library (asset_category "team-headshots") where they exist; otherwise ask the user.
- Icons: Lucide, anywhere the content needs them (headers, inline, lists, cards, flows), and one per item in a list or grid of tools, capabilities, features, steps or outcomes. 24px beside text, 48px on its own, in a UI card an icon square that grows with the card (the step for the card's width in `icons.in_card`, set with container queries); square only, a solid fill with no border, at least 4.5:1 contrast (section "iconography").

## Checklist before delivery

- [ ] `check_design` returns "pass" (no errors).
- [ ] The cover image came from the user.
- [ ] Photos and product screens came from the user, or are placeholders listed in the delivery note; no drawn product UI.
- [ ] Cover dark; content slide themes picked from the templates and mixed; closing like the cover.
- [ ] The logo file (not a placeholder) at the top of every post and slide, the right colour for the theme.
- [ ] Every slide is drawn in its content form; no row of text cards or bare list for steps, results or a problem.
- [ ] Supporting text, stats and items sit in UI cards with padding/container; cards sized to their content, no empty space left by stretched or pinned cards.
- [ ] Design elements used where the background allows them.
- [ ] Nothing outside the 24px safe area except images; elements on column edges.
- [ ] Text between 10px and 72px, in the set styles; colours are tokens; the post is not a single colour.
- [ ] Bruce AI gradient only on Bruce AI content; design elements only on their backgrounds.
- [ ] The user's text is unchanged; nothing was added.
- [ ] No glows (except on Bruce AI posts), AI cliches or repeated template layouts.
- [ ] HTML at 540px, ready for 2x export.
