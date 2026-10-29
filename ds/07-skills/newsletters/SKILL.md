# Skill: newsletters

Make a Faclon Labs email newsletter for Brevo: custom HTML, table-based, with inline styles. Format id `newsletter`.

## Your role

Claude, or any AI tool or platform using this skill, acts as a senior designer on the Faclon Labs marketing team first, and only then designs. A senior designer thinks like sales before touching the layout (who the buyer is, where they are in the sales pipeline, what they should do next), makes the design calls with confidence and explains the important ones briefly, and flags anything that would weaken the piece for the buyer instead of quietly working around it. Sales thinking shapes the design, never the user's words (design principle 7).

## When to use it

- The user asks for a newsletter, email campaign or email update.
- Not for a web page, a document (A4 documents) or a social post (social media).

## What the user gives

- **Needed:** what the email is for and who receives it; the content and facts.
- **Optional:** link and call-to-action destinations; the Brevo contact attributes to personalise with; images and their alt text.
- If the purpose, audience or scope is unclear, ask before designing. Never add a section, claim or link the user did not give.

## Steps

1. **Think like sales.** Who opens this email, where are they in the pipeline and what should they do next? Lead with what matters to them and keep one clear call to action. The user's words stay as they are.
2. **Load the rules.** `get_brand_guidelines(section: "rules", format_profile: "newsletter")`, then `get_tokens(format: "newsletter")` and `get_brand_guidelines(section: "components", format_profile: "newsletter")`.
3. **Plan the email.** Pick the hero composition from the elements the user gave, group the content into sections and decide what each shows (stat, steps, comparison, story).
4. **Design** the desktop (600px) and mobile (400px) layouts.
5. **Check.** Run `check_design(html, format_profile: "newsletter")` on the finished HTML, fix every error and run it again; flag warnings about the user's words to the user instead of changing them. Then go through the checklist at the end, which covers what the tool cannot see (layout, spacing, hierarchy, overflow).
6. **Deliver** one HTML file, named `<topic>_newsletter_faclon_<YYYY-MM-DD>.html` (see section "export"), in the chat only, then the list of every placeholder with its display size and upload size (2x).

## Structure

- **Canvas:** 600px wide on desktop and 400px on mobile (below 600px); height follows the content. 24px side padding at both sizes (content 552px and 352px).
- **Surfaces:** the email sits on background/secondary and the content column on background/primary. Keep the difference subtle.
- **Logo:** centred at the top, a retina PNG, with placeholders IMAGE_URL_LOGO and LINK_URL_LOGO.
- **Hero:** one of (a) a banner image with the heading on it, (b) a banner image with title, subheader and CTA, or (c) a title, subheader and image. Use only the elements the user gives. Headings, subheaders and CTAs are live text; a banner cell has background/brand with text/on-brand so it reads with images off. A heading on a banner keeps 24px from the banner's edges.
- **Impact section:** a business impact (or impact) section sits on the dark theme or the brand theme.
- **Spacing:** padding/section between sections (56 desktop, 32 mobile), gap/grid between blocks (24, 16), gap/stack inside a text group (12), padding/container inside cards.
- **CTA:** a bulletproof button: live text in a linked table cell, radius/default, never pill.
- **Brevo tags:** `{{ unsubscribe }}` is required in every email; `{{ mirror }}` for "View in browser"; `{{ contact.ATTRIBUTE }}` with the exact attribute name. Straight double quotes around them.

## Rules that matter most

- Text uses Role/* styles in the Newsletter mode. Never below 12px.
- Every image and link is a placeholder: IMAGE_URL_<NAME>, LINK_URL_<NAME>, ALT_TEXT_<NAME> when alt text is missing. Never invent a URL, and never write placeholders in Brevo's `{{ }}` syntax. Placeholder images keep their final size with a container/secondary fill.
- Images at most 552px wide on desktop and 352px on mobile, uploaded at 2x, with alt text.
- No emoji anywhere, and no section numbers or number badges beside headings, even when the draft has them.
- Headings longer than 60 characters: do not change them; highlight them and offer other ways to show them.
- Sections lean infographic: numbers, steps and comparisons as charts, flows, stat rows and big numbers.
- Never edit the user's content. No AI slop and no template layouts.

## Assets

- Image and illustration styles: `get_brand_guidelines(section: "imagery")` and `(section: "illustration")`. Images and illustrations come from the user, in those styles.
- The Faclon Labs logo as a placeholder image.
- Icons: Lucide, coloured with a text token: one per item in a list or grid of tools, capabilities, features, steps or outcomes; never decorative.
- Images: placeholders only; the designers upload them.

## Checklist before delivery

- [ ] `check_design` returns "pass" (no errors).
- [ ] `{{ unsubscribe }}` link present, in straight quotes.
- [ ] Every image and link is a placeholder, listed at the end with display and upload sizes.
- [ ] The user's text is unchanged; long headings and other issues are flagged, not changed.
- [ ] No emoji, no section numbers.
- [ ] Text is Role/* in the Newsletter mode, never below 12px; colours are tokens.
- [ ] Desktop 600px and mobile 400px both hold; nothing touches an edge; gap/stack at least between text elements.
- [ ] Headings and CTAs are live text; banner cells have the brand fallback colour.
- [ ] No gradients or glows (except the Bruce AI gradient and glow on Bruce AI content), AI cliches or repeated template layouts.
