# Data visualisation

Charts, stat layouts, funnels, cycles and plant drawings, set by the brand team on 2026-10-30 from their references (Figma page Brand identity › Data visualisation).

**These are references, not fixed layouts.** Each one shows a kind of design that can be built for content of that shape, and how its parts can be placed: the number, its caption, the labels, the key, the source. Build designs like these, adapt them to the content and the space, and combine them; nothing here has to be copied exactly. They work in every format (deck, A4 document, newsletter, social post), as a full slide, a page section, a card or a post. Some references come from outside Faclon: take the placement and feel, never their fonts or colours. Every value comes from the design system.

Images are served at `%DATAVIZ_URL%/<file>`.

## Picking a form

Name the shape of the content first, then pick a form that shows it. The references below are starting points for each:

| Content | Forms to build from |
|---|---|
| One key number and what it means | Stat layouts: big stat with a proportion grid, stat with a unit grid |
| A trend over time | Line chart |
| Amounts by period or category | Vertical bars |
| A ranking or share by category | Horizontal bars |
| Scenarios or forecasts | Labelled lines |
| Stages that narrow | Funnel |
| Steps that build on each other | Steps over a rising staircase |
| A repeating cycle | Flywheel |
| How Faclon layers on a plant | Exploded stack |
| Where something happens on the plant | Plant drawing with hotspots |

## What every form keeps

These come from the design system and apply whatever the layout:

- **Content:** numbers, labels and sources come from the user, unchanged. A value the user has not given stays a placeholder such as `[$__M]`, never invented or estimated; a source appears only when the user gives one.
- **One message:** each chart or stat says one thing, named in a short eyebrow title in caps (Role/Label, text/eyebrow).
- **Labels where they are:** label a series at the end of its line, inside its bar or beside its stage, name and value together ("Base · $100M"). Use a separate key only when direct labels do not fit.
- **Colour:** tokens only, never sampled from a reference. One series is brand. Several series follow meaning: the main series in text/heading or brand, best or positive in green, worst or negative in red.
- **Type:** big numbers in TASA Orbiter, labels, axes and captions in Inter, nothing below the format's minimum size.
- **Theme:** draw each form in the theme of the surface it sits on with that theme's tokens; every form here works on light and on dark.
- **No AI slop:** no 3D charts, shadows, glows or gradient fills or lines; axes are one solid baseline with light dashed gridlines (border/primary) and labels in text/tertiary.
- **HTML:** inline SVG with colours as CSS variables from get_tokens, lines 2px (border/width md), text as live text; never an image of a chart.

## Stat layouts

**Big stat with a proportion grid** (dark)

![Big stat with a proportion grid](%DATAVIZ_URL%/stat-dot-grid-dark.png)

The number at the largest text role, one caption line under it with the key phrase stressed by weight, then a grid of dots where filled dots show the share. For example: filled dots brand/500, empty dots brand/900 on a dark background. The reference's script lettering is not a Faclon font: stress by weight or text/brand instead.

**Stat with a unit grid** (light)

![Stat with a unit grid](%DATAVIZ_URL%/stat-unit-grid.png)

Headline and subline at the top; the number in text/brand beside a short bold caption; a 10 by 10 grid of squares where one square is 1%, filled in brand and empty in a light neutral, with its key under it ("1 square = 1% of …"); a hairline, then the source. The reference's purple and Roboto become brand blue and TASA Orbiter or Inter.

## Charts

**Line chart** (light)

![Line chart](%DATAVIZ_URL%/line-chart.png)

A trend over time: one smooth line in brand/500, a y-axis title, and up to four summary figures above the chart (label in text/tertiary, value in text/heading). The reference's line fades from green to blue; draw one token colour per line.

**Vertical bars** (light)

![Vertical bars](%DATAVIZ_URL%/bar-chart.png)

Amounts by month or category: evenly spaced bars in brand/300 with small rounded top corners from the radius scale, on dashed gridlines.

**Horizontal bars**

![Horizontal bars](%DATAVIZ_URL%/horizontal-bars.png)

A ranking or share by category: the label inside the bar in caps (Role/Label), a light brand track behind a stronger brand value bar.

**Labelled lines for scenarios** (dark)

![Scenario lines](%DATAVIZ_URL%/scenario-lines-dark.png)

Up to three lines with a dot on every point and the name and value at each line's end. For example: base solid in text/heading, best dashed in green (accent), worst dashed in red (red/400 on dark).

## Funnels and cycles

**Funnel** (dark)

![Funnel](%DATAVIZ_URL%/funnel-dark.png)

Stages that narrow: one trapezoid per stage, darkest brand at the top to lightest at the bottom (for example brand/500, brand/400, brand/300, brand/200), the count inside in TASA Orbiter (text/on-brand on the darker stages, text/inverse on the lighter), and a dot connector to the stage name and value. Draw only the stages the user gives.

**Flywheel** (dark and light)

![Flywheel](%DATAVIZ_URL%/flywheel.png)

A repeating cycle: a dashed brand ring with an arrow between steps, one hub in the centre (container/brand, text/on-brand, a soft brand halo) holding the key stat or the system's name, and one card per step around the ring. Each step card is on Card base: an icon tile with a Lucide icon, the number and step name in caps in text/brand, the step in text/heading and an optional line in text/secondary. Steps read clockwise from the top right.

**Steps over a rising staircase** (light)

![Steps over a rising staircase](%DATAVIZ_URL%/steps-staircase.png)

A numbered eyebrow, one statement line, then step cards on Card base (step number and duration on top, the step name, up to three short lines) set on rising bars that show progress, each joined to its bar by a thin connector. The reference's gradient bars become flat brand tints (brand/100 to brand/400).

## Plant and system drawings

**Exploded stack**

![Exploded stack](%DATAVIZ_URL%/exploded-stack.png)

How Faclon layers on a plant, as an isometric stack of plates from the bottom up: the plant's existing machines on a dark plate (neutral-light/1000 to 1200), each Faclon layer above it as one plate with one simple motif (data points, a network, app tiles), and a dashed outline at the top for the people or outcome it serves, with dashed guides joining the corners. Label each plate beside the stack in the user's words, one plate per layer the user names. The reference's green and purple gradient plates are not in the design system: draw the plates in brand tones (for example brand/500, brand/700, brand/300).

**Plant drawing with hotspots** (light)

![Plant drawing with hotspots](%DATAVIZ_URL%/plant-hotspots.png)

Where something happens on the plant: an isometric line drawing in a dark neutral stroke (neutral-light/1200) on white and neutral-light/100 faces, with hotspots as a ring and a dot. Colour by meaning: brand/500 where Faclon connects, green for a gain or a healthy asset, a dark brand tone for neutral points, red only for a fault the user names. Explain every hotspot with a label beside it or a numbered key, in the user's words.
