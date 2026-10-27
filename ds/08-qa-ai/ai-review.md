# AI review

What Claude checks on every piece before it is delivered, in this order.

1. **Content unchanged.** Every word, number and claim is the user's, exactly as given: nothing rewritten, shortened, cut, reordered, added or corrected. Suggestions are flagged, never applied without approval. Nothing is copied from a template.
2. **Scope.** Only the sections, slides, pages or posts the user asked for.
3. **Brand check.** Run `check_design(html, format_profile)`. Fix every error and run it again until the verdict is pass; flag warnings about the user's words instead of changing them.
4. **Format checklist.** Go through the "Checklist before delivery" in the format's skill (`format_profile.skill`), which covers what the tool cannot see: layout, spacing, hierarchy, overflow, rhythm.
5. **Assets.** Logos, headshots, icons and design elements are real files from the asset library, on the backgrounds their rules allow; headshots are not cropped from the top; the full logo unless the user asked for the logomark.
6. **Nothing overflows** the canvas, safe area, card, box or zone, and no text is below the format's minimum size.
7. **File.** One HTML file at the format's page size (`10-export/html-specs.md`), named `<topic>_<outcometype>_faclon_<YYYY-MM-DD>.html` (`10-export/naming.md`).
8. **Delivery.** In the chat only, with a short note of anything flagged (`10-export/delivery.md`).
