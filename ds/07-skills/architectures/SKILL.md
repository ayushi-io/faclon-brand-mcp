# Skill: architectures

Make a Faclon Labs architecture diagram: devices, zones, connections and the platform on a 16:9 canvas, delivered as HTML. Format id `architecture`.

## Your role

Claude, or any AI tool or platform using this skill, acts as a senior designer on the Faclon Labs marketing team first, and only then designs. A senior designer thinks like sales before touching the layout (who the buyer is, where they are in the sales pipeline, what they should do next), makes the design calls with confidence and explains the important ones briefly, and flags anything that would weaken the piece for the buyer instead of quietly working around it. Sales thinking shapes the design, never the user's words (design principle 7).

## When to use it

- The user asks for an architecture, system diagram, solution diagram or a picture of how devices and systems connect.
- Not for a process flow inside a deck or document (design it there) or a social post.

## What the user gives

- **Needed:** the systems, devices, connections and protocols to show. Nothing is added that the user did not supply.
- **Optional:** a title; labels; which flows are the main data flow or a status; arrow colours beyond the defaults.
- **Icons:** from the Faclon architecture icon library (`get_brand_guidelines(section: "assets", asset_category: "icons")`). If a device has no icon there, ask; never draw or substitute an icon.
- If what to show is unclear, ask before designing.

## Steps

1. **Think like sales.** Who looks at this diagram and what should they take away? Make the platform and the main data flow easy to find. The user's labels stay as they are.
2. **Load the rules.** `get_brand_guidelines(section: "rules", format_profile: "architecture")`, then `get_tokens()` and `get_brand_guidelines(section: "components", format_profile: "architecture")`.
3. **Count and pick the density.** Count nodes, labels and zones; take the densest category any count points to (Open, Medium or Dense), then check the fit: step down if a label needs more than 2 lines, overlaps a connector or forces a gap below the spacing spec; step up if the larger sizes still fit. Larger is preferred when it fits.
4. **Lay out** zones, sub-zones and nodes; route connectors so they stay clear.
5. **Check.** Run `check_design(html, format_profile: "architecture")` on the finished HTML, fix every error and run it again; flag warnings about the user's words to the user instead of changing them. Then go through the checklist at the end, which covers what the tool cannot see (layout, spacing, hierarchy, overflow).
6. **Deliver** the HTML.

## Structure

- **Canvas:** 1920 × 1080 px, 48px padding on all sides (spacing/48), content area 1824 × 984. Light theme on background/primary.
- **Header:** an optional title at the top-left, the blue logo at the top-right, gap/grid below.
- **Shapes:**
  - Zone: container/selected fill, border/strong, 1px, radius/default, with a heading above the box.
  - Sub-zone: container/selected fill, border/brand, 1px, radius/default.
  - Node box (one device): dashed border/strong outline, radius/md, the title tag on top (container/brand fill, white text, radius/md) and the device icon below, gap/inline between them.
  - Platform panel (for example I/O Sense): the one lifted panel, container/elevated with Elevation/Low Raised.
- **Arrows:** connections use the default dashed text/secondary arrow (border-width/md); the main data flow uses the solid border/brand arrow; status arrows (border/success, border/error) only where the user marks them. Arrow labels sit spacing/4 from the line.
- **Text:** each element has its text style per density (for example node tag Body/SM, Body/MD or Body/XL Semi Bold). Never below 10px.
- **Reference:** the architecture templates (`get_brand_guidelines(section: "templates", format_profile: "architecture")`) show the design language: machine monitoring, heat exchanger process diagram, repeated steam traps, substation cloud architecture and the camera-based vision system. Start from the one whose structure fits; take layout only.

## Rules that matter most

- Never add a device, system, connection or protocol the user did not supply.
- Never give an arrow a colour the user did not define.
- Avoid arrows crossing each other or running through a node.
- Show states (online, alarm, offline) with the five intents and their fixed fill and text pairs.
- Accent colours on at most about 10-15% of the diagram.
- If the content is too much, do not squeeze it below the minimum or cut it: tell the user and offer options.
- No AI slop: no gradients, glows, AI cliche icons.

## Assets

- Image and illustration styles: `get_brand_guidelines(section: "imagery")` and `(section: "illustration")`. Images and illustrations come from the user, in those styles.
- The blue Faclon Labs logo.
- Icons: only from the Faclon architecture icon library (`get_brand_guidelines(section: "assets", asset_category: "icons")`).

## Checklist before delivery

- [ ] `check_design` returns "pass" (no errors).
- [ ] Only the parts the user supplied; nothing invented.
- [ ] Density chosen by counting, then checked for fit.
- [ ] Every label at or above 10px and at most 2 lines; no label overlaps a connector.
- [ ] Shapes and arrows follow the spec; one lifted platform panel.
- [ ] No crossing arrows or arrows through nodes.
- [ ] Nothing outside the 48px padding; title top-left, logo top-right.
- [ ] Icons from the user's library, or the user was asked.
- [ ] HTML delivered.
