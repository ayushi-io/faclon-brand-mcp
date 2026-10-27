import { test } from "node:test";
import assert from "node:assert/strict";
import { readData } from "../src/lib/data.js";
import { P } from "../src/lib/paths.js";
import { getTokens } from "../src/tools/tokens.js";
import { getBrandGuidelines, mergeRules, tokenCssVars, componentRefs, formatProfiles, loadProfile } from "../src/tools/guidelines.js";

const HEX = /^#[0-9A-F]{6}$/;
const snap = readData(P.snapshot);
const varValue = (col, name, mode) => snap.collections.find((c) => c.name === col).variables.find((v) => v.name === name).values[mode];

test("every semantic colour resolves to a hex value in both modes", () => {
  const { tokens } = getTokens({ category: "color" });
  for (const mode of ["light", "dark"]) {
    const walk = (o) => Object.values(o).forEach((v) => ("value" in v ? assert.match(v.value, HEX) : walk(v)));
    walk(tokens.semantic[mode]);
  }
});

test("colour tokens match the Figma snapshot exactly", () => {
  const { tokens } = getTokens({ category: "color", mode: "light" });
  assert.equal(tokens.primitive.brand["500"], varValue("Global Colors", "brand/500", "Default"));
  assert.equal(tokens.semantic.background.primary.value, "#FFFFFF");
  assert.equal(tokens.semantic.background.primary.ref, "base/white");
  const dark = getTokens({ category: "color", mode: "dark" }).tokens;
  assert.equal(dark.semantic.background.primary.ref, "neutral-dark/1100");
});

test("typography sizes follow Desktop and Mobile modes", () => {
  const { tokens } = getTokens({ category: "typography" });
  const xl = tokens.styles["display/xl"];
  assert.equal(xl.family, "TASA Orbiter");
  assert.equal(xl.desktop.size, 72);
  assert.equal(xl.mobile.size, 40);
  assert.equal(tokens.styles["body/md"].family, "Inter");
  assert.equal(tokens.styles.eyebrow.textCase, "none"); // uppercase is optional (2026-10-26)
  const mobile = getTokens({ category: "typography", mode: "mobile" }).tokens;
  assert.equal(mobile.styles["heading/h1"].size, 30);
});

test("spacing, radius, border and elevation come through", () => {
  assert.deepEqual(getTokens({ category: "spacing" }).tokens.scale, [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56]);
  assert.equal(getTokens({ category: "spacing", mode: "mobile" }).tokens.roles["padding/section"], 32);
  assert.equal(getTokens({ category: "radius" }).tokens.lg, 6);
  assert.equal(getTokens({ category: "border" }).tokens.width.md, 2);
  assert.equal(getTokens({ category: "border" }).tokens.width["3xl"], 6);
  assert.match(getTokens({ category: "elevation" }).tokens["mid-raised"].css, /8px 24px/);
});

test("CSS output has variables, dark theme and mobile overrides", () => {
  const { code } = getTokens({ as: "css" });
  assert.match(code, /--color-brand-500: #1655F2;/);
  assert.match(code, /:root\[data-theme="dark"\], \[data-theme="dark"\] \{/);
  assert.match(code, /@media \(max-width: 767px\)/);
  assert.match(code, /--text-display-xl-size: 72px;/);
  assert.doesNotMatch(code, /undefined|NaN/);
});

test("Tailwind and Figma outputs are produced", () => {
  assert.match(getTokens({ as: "tailwind" }).code, /export default/);
  assert.equal(getTokens({ category: "color", as: "figma" }).figma.color.length, 2);
});

test("bad parameters give a clear error code", () => {
  assert.throws(() => getTokens({ category: "shadows" }), { code: "INVALID_PARAM" });
  assert.throws(() => getTokens({ category: "radius", mode: "dark" }), { code: "INVALID_PARAM" });
  assert.throws(() => getBrandGuidelines({ format_profile: "billboard" }), { code: "INVALID_PROFILE" });
});

test("guidelines: written sections, gaps and overview", () => {
  assert.match(getBrandGuidelines({ section: "logo" }).guidance, /white logo/i);
  const voice = getBrandGuidelines({ section: "voice" });
  assert.equal(voice.status, "written");
  assert.match(voice.guidance, /Faclon Labs by name/);
  // The voice bans en and em dashes, so its own text must not use them.
  assert.doesNotMatch(voice.guidance, /[–—]/);
  const principles = getBrandGuidelines({ section: "principles" });
  assert.equal(principles.status, "written");
  assert.equal((principles.guidance.match(/^## \d+\. /gm) || []).length, 7);
  assert.match(principles.guidance, /senior designer/);
  assert.doesNotMatch(principles.guidance, /[–—]/);
  const elements = getBrandGuidelines({ section: "design-elements" });
  assert.equal(elements.status, "written");
  assert.match(elements.guidance, /Dark only/);
  assert.match(elements.guidance, /Brand only/);
  for (const section of ["illustration", "imagery"]) {
    const g = getBrandGuidelines({ section });
    assert.equal(g.status, "written", section);
    assert.equal((g.guidance.match(/^## (?!Rules)/gm) || []).length, 2, `${section}: two styles`);
    assert.match(g.guidance, /\*\*Theme:\*\*/, `${section}: each style has a theme`);
    assert.doesNotMatch(g.guidance, /[–—]/, `${section}: no en or em dashes`);
  }
  const overview = getBrandGuidelines();
  assert.ok(overview.format_profiles.some((p) => p.id === "deck"));
  assert.equal(typeof overview.open_questions, "number");
});

test("format profiles can tighten rules but not loosen or touch locked ones", () => {
  const deck = getBrandGuidelines({ section: "rules", format_profile: "deck" });
  assert.equal(deck.rules.find((r) => r.id === "type.min-size").check.value, 14);
  const loosen = mergeRules({ id: "x", name: "X", overrides: [{ rule: "type.min-size", value: 8 }, { rule: "color.tokens-only", value: false }] });
  assert.equal(loosen.applied.length, 0);
  assert.equal(loosen.rejected.length, 2);
  assert.equal(loosen.rules.find((r) => r.id === "type.min-size").check.value, 10);
});

test("defaults come from Figma DEFAULT markers and ride along with the rules", () => {
  const d = getBrandGuidelines({ section: "defaults" }).defaults;
  assert.equal(d.canvas.fill, "background/primary");
  assert.equal(d.container.border, "border/container");
  assert.equal(d.eyebrow.size, 10);
  assert.equal(d.eyebrow.color, "text/eyebrow");
  assert.equal(d.font_fallback["TASA Orbiter"], "Inter");
  assert.ok(getBrandGuidelines({ section: "rules" }).defaults.radius);
});

test("two-typefaces rule: no third font anywhere in outputs or profiles", () => {
  const rule = getBrandGuidelines({ section: "rules" }).rules.find((r) => r.id === "type.two-families-only");
  assert.equal(rule.locked, true);
  const css = getTokens({ category: "typography", as: "css" }).code;
  assert.match(css, /--font-heading: "TASA Orbiter", "Inter";/);
  assert.doesNotMatch(css, /sans-serif|Arial|Helvetica/);
  const nl = JSON.stringify(getBrandGuidelines({ section: "overview", format_profile: "newsletter" }).format_profile);
  assert.doesNotMatch(nl, /Arial|sans-serif/);
});

test("every rule is well-formed and traceable to Figma", () => {
  const { rules } = getBrandGuidelines({ section: "rules" });
  const ids = new Set();
  for (const r of rules) {
    assert.ok(r.id && r.category && r.rule && r.check?.type && r.source, r.id);
    assert.ok(["error", "warning"].includes(r.severity), r.id);
    assert.equal(typeof r.locked, "boolean", r.id);
    assert.ok(!ids.has(r.id), `duplicate ${r.id}`);
    ids.add(r.id);
  }
});

test("body text has no letter spacing; headings keep theirs", () => {
  const { styles } = getTokens({ category: "typography" }).tokens;
  for (const k of ["body/xl", "body/lg", "body/md", "body/sm", "body/xs", "body/2xs"]) {
    assert.equal(styles[k].desktop.letterSpacing, 0, k);
    assert.equal(styles[k].mobile.letterSpacing, 0, k);
    assert.equal(styles[k].weight, 400, k);
  }
  assert.equal(styles["heading/h1"].desktop.letterSpacing, -0.4);
  assert.equal(styles["heading/h1"].mobile.letterSpacing, -0.3);
  assert.equal(styles["display/xl"].mobile.size, 40);
  assert.equal(styles.eyebrow.desktop.letterSpacing, 0.96);
});

test("uploaded token files agree with the server on every primitive", async () => {
  const fs = await import("node:fs");
  const up = JSON.parse(fs.readFileSync(new URL("../sources/uploaded-2026-10-09/colors.json", import.meta.url)));
  const { primitive } = getTokens({ category: "color", mode: "light" }).tokens;
  for (const [k, v] of Object.entries(up.brand)) assert.equal(primitive.brand[k], v);
  for (const [k, v] of Object.entries(up.neutralLight)) assert.equal(primitive["neutral-light"][k], v);
  for (const [k, v] of Object.entries(up.neutralDark)) assert.equal(primitive["neutral-dark"][k], v);
});

test("brand decisions 2026-10-09 are now in Figma itself: colours and weights 400–700", () => {
  const light = getTokens({ category: "color", mode: "light" }).tokens;
  const dark = getTokens({ category: "color", mode: "dark" }).tokens;
  assert.equal(light.primitive["neutral-light"]["1300"], "#0C1927");
  assert.equal(light.semantic.text.heading.value, "#0C1927");
  assert.equal(dark.semantic.text.heading.value, "#F1F5FA");
  assert.equal(dark.semantic.text.body.value, "#CBD5E2");
  assert.equal(dark.semantic.text.primary.value, dark.semantic.text.body.value);
  assert.equal(light.semantic.text.secondary.value, "#40566D");
  assert.equal(light.semantic.text.tertiary.value, "#768EA7");
  assert.equal(dark.semantic.background.secondary.value, "#0C1927");
  const css = getTokens({ category: "color", as: "css" }).code;
  assert.match(css, /--color-neutral-light-1300: #0C1927;/);
  assert.match(css, /--color-text-heading: var\(--color-neutral-light-1300\);/);
  const ty = getTokens({ category: "typography" }).tokens;
  assert.equal(Math.max(...Object.values(ty.weights.heading)), 700);
  assert.equal(ty.weights.heading.extrabold, undefined);
  for (const s of Object.values(ty.styles)) assert.ok(s.weight >= 400 && s.weight <= 700);
  const rule = getBrandGuidelines({ section: "rules" }).rules.find((r) => r.id === "type.weight-range");
  assert.equal(rule.check.max, 700);
});

test("Inter large body scale mirrors the TASA heading sizes", () => {
  const { styles } = getTokens({ category: "typography" }).tokens;
  const headingSizes = new Set(Object.entries(styles).filter(([, s]) => s.role === "heading").map(([, s]) => s.desktop.size));
  const bodySizes = new Set(Object.entries(styles).filter(([k]) => k.startsWith("body/")).map(([, s]) => s.desktop.size));
  for (const size of headingSizes) assert.ok(bodySizes.has(size), `no Inter body style at ${size}px`);
  const b40 = styles["body/40"];
  assert.equal(b40.family, "Inter");
  assert.deepEqual([b40.desktop.size, b40.desktop.lineHeight, b40.mobile.size, b40.mobile.lineHeight], [40, 48, 30, 36]);
  assert.equal(styles["body/72"].mobile.size, 40);
});

test("Mid Raised is modals and popovers only; no hover token", () => {
  const { tokens } = getTokens({ category: "elevation" });
  assert.doesNotMatch(tokens["mid-raised"].description, /dropdown/i);
  assert.equal(getTokens({ category: "color", mode: "light" }).tokens.semantic.container.hover, undefined);
});

test("every text style has all four weights (eyebrow: Medium and Semi Bold)", () => {
  const { styles } = getTokens({ category: "typography" }).tokens;
  assert.equal(Object.keys(styles).length, 22);
  for (const [k, s] of Object.entries(styles)) {
    const expected = k === "eyebrow" ? ["500", "600"] : ["400", "500", "600", "700"];
    assert.deepEqual(Object.keys(s.weights), expected, k);
  }
  assert.equal(styles["heading/h2"].weights["700"], "Heading/H2/Bold");
  assert.equal(styles["display/xl"].weight, 700);
  assert.equal(styles["heading/h1"].mobile.size, 30);
});

test("text roles resolve per format and breakpoint from the Text Roles collection", () => {
  const { roles, formats } = getTokens({ category: "typography" }).tokens;
  assert.deepEqual(formats, ["document", "newsletter", "deck"]);
  assert.equal(Object.keys(roles).length, 11);
  assert.equal(roles.eyebrow.textCase, "none");
  assert.deepEqual([roles.eyebrow.formats.document.desktop.size, roles.eyebrow.formats.document.desktop.lineHeight], [10, 16]);
  assert.deepEqual([roles.body.formats.document.desktop.size, roles.body.formats.newsletter.desktop.size, roles.body.formats.deck.desktop.size], [14, 16, 24]);
  assert.equal(roles.title.family, "TASA Orbiter");
  assert.equal(roles.body.family, "Inter");
  assert.equal(roles.metric.formats.deck.desktop.size, 48);
  assert.equal(roles.metric.formats.deck.ref, "size/display/md");
  // Inter body roles carry no tracking; TASA roles keep theirs.
  assert.equal(roles.body.formats.document.desktop.letterSpacing, 0);
  assert.ok(roles.title.formats.document.desktop.letterSpacing < 0);
});

test("every text role respects its format profile's minimum size", () => {
  const { roles } = getTokens({ category: "typography" }).tokens;
  for (const format of ["document", "newsletter", "deck"]) {
    const profile = getBrandGuidelines({ section: "rules", format_profile: format });
    const min = profile.rules.find((r) => r.id === "type.min-size").check.value;
    const ty = profile.format_profile.typography;
    for (const bp of ty.breakpoint_modes ?? [ty.breakpoint_mode]) {
      for (const [name, r] of Object.entries(roles)) {
        assert.ok(r.formats[format][bp].size >= min, `${name} is ${r.formats[format][bp].size}px in ${format} (${bp}), below ${min}px`);
      }
    }
  }
});

test("format narrows text roles and switches them in CSS", () => {
  const deck = getTokens({ category: "typography", format: "deck", mode: "desktop" }).tokens.roles;
  assert.equal(deck.body.size, 24);
  assert.equal(deck.body.formats, undefined);
  const css = getTokens({ category: "typography", as: "css" }).code;
  assert.match(css, /--role-body-size: 14px;/);
  assert.match(css, /\[data-format="deck"\] \{[^}]*--role-body-size: 24px;/);
  assert.match(css, /--role-eyebrow-text-transform: none;/);
  const nl = getTokens({ category: "typography", as: "css", format: "newsletter" }).code;
  assert.match(nl, /:root \{[^}]*--role-body-size: 16px;/);
  assert.doesNotMatch(nl, /data-format/);
  assert.throws(() => getTokens({ category: "color", format: "deck" }), (e) => e.code === "INVALID_PARAM");
  assert.throws(() => getTokens({ format: "billboard" }), (e) => e.code === "INVALID_PARAM");
});

test("information and strong status colours exist in both modes", () => {
  const { semantic } = getTokens({ category: "color" }).tokens;
  for (const mode of ["light", "dark"]) {
    for (const k of ["info", "info-strong", "success-strong", "error-strong"]) assert.match(semantic[mode].container[k].value, HEX, `${mode} container/${k}`);
    assert.equal(semantic[mode].text["on-strong"].value, "#FFFFFF");
  }
  assert.equal(semantic.light.container.info.ref, "brand/100");
  assert.equal(semantic.light.container["info-strong"].ref, "brand/800");
});

test("defaults agree with the status-container border rule", () => {
  const { defaults, rules } = getBrandGuidelines({ section: "rules" });
  const borders = rules.find((r) => r.id === "color.status-containers-border").check.borders;
  assert.equal(defaults.success_container.border, borders[defaults.success_container.fill]);
  assert.equal(defaults.error_container.border, borders[defaults.error_container.fill]);
});

test("format guardrails are complete and every item is grounded in the design system", () => {
  const rules = readData(P.rules).rules.map((r) => r.id);
  const defaults = readData(P.defaults).defaults;
  const decisions = readData(P.openQuestions).resolved.map((r) => r.id);
  const at = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  for (const format of ["document", "newsletter", "deck", "architecture", "social"]) {
    const profile = getBrandGuidelines({ section: "rules", format_profile: format }).format_profile;
    const g = profile.guardrails;
    assert.ok(g, `${format} has guardrails`);
    for (const part of ["fixed", "must_not", "avoid", "design_direction"]) {
      assert.ok(g[part].length > 0, `${format}.${part} is empty`);
      const ids = g[part].map((i) => i.id);
      assert.equal(new Set(ids).size, ids.length, `${format}.${part} has duplicate ids`);
      for (const item of g[part]) {
        assert.ok(item.text && item.basis.length, `${format}.${part}.${item.id} needs text and a basis`);
        for (const b of item.basis) {
          const [kind, ref] = [b.slice(0, b.indexOf(":")), b.slice(b.indexOf(":") + 1)];
          const ok = { rule: () => rules.includes(ref), default: () => ref in defaults, decision: () => decisions.includes(ref), profile: () => at(loadProfile(format), ref) !== undefined }[kind];
          assert.ok(ok && ok(), `${format}.${part}.${item.id}: basis "${b}" does not exist`);
        }
      }
    }
    assert.ok(g.claude_decides.length >= 4, `${format} must say what the designer decides`);
    assert.ok(g.user_decides.length >= 3, `${format} must say what the user decides`);
    assert.ok(g.user_decides.some((s) => /scope/i.test(s)), `${format}: the user controls scope`);
    // The minimum-size guardrail states the same number as the merged rule.
    const min = getBrandGuidelines({ section: "rules", format_profile: format }).rules.find((r) => r.id === "type.min-size").check.value;
    assert.match(g.must_not.find((i) => i.id === "min-size").text, new RegExp(`below ${min}px`));
  }
});

test("server instructions: the user decides what, Claude designs how, inside the frame", async () => {
  const { INSTRUCTIONS } = await import("../src/server.js");
  assert.match(INSTRUCTIONS, /The user decides what is made; you decide how it looks/);
  assert.match(INSTRUCTIONS, /Do not add sections, slides, pages, claims or content the user did not ask for/);
  assert.match(INSTRUCTIONS, /you are the designer/);
  assert.match(INSTRUCTIONS, /Hard rule: never edit or change the user's content/);
  assert.match(INSTRUCTIONS, /Nothing may overflow the canvas padding or its card, box or zone/);
  assert.match(INSTRUCTIONS, /never add a colour, font or value the system does not define/);
  assert.match(INSTRUCTIONS, /guardrails/);
  assert.match(INSTRUCTIONS, /No AI slop/);
});

test("no AI slop: a locked global rule, carried by every format profile", () => {
  const rule = readData(P.rules).rules.find((r) => r.id === "design.no-ai-slop");
  assert.ok(rule && rule.locked && rule.severity === "error");
  for (const format of formatProfiles()) {
    const g = getBrandGuidelines({ section: "rules", format_profile: format }).format_profile.guardrails;
    assert.ok(g.must_not.find((i) => i.id === "no-ai-slop").basis.includes("rule:design.no-ai-slop"), format);
    assert.ok(g.avoid.find((i) => i.id === "template-layouts"), format);
  }
});

test("architecture spec uses only design-system styles and tokens", () => {
  const { format_profile: p, rules } = getBrandGuidelines({ section: "rules", format_profile: "architecture" });
  const t = getTokens().tokens;
  assert.equal(rules.find((r) => r.id === "type.min-size").check.value, 10);
  assert.deepEqual([p.safe_area.top, p.safe_area.right, p.safe_area.bottom, p.safe_area.left, p.safe_area.token], [48, 48, 48, 48, "spacing/48"]);
  assert.deepEqual(p.canvas, { width: 1920, height: 1080, unit: "px", ratio: "16:9" });
  assert.equal(p.logo.position, "top-right");
  assert.deepEqual(p.export.file_types, ["html"]);
  // Text styles: each element x density is a real style with that weight, never below 12px.
  for (const [el, spec] of Object.entries(p.typography.styles)) {
    for (const d of ["dense", "medium", "open"]) {
      const s = t.typography.styles[spec[d].style];
      assert.ok(s, `${el}.${d}: no text style ${spec[d].style}`);
      assert.ok(s.weights[spec[d].weight], `${el}.${d}: ${spec[d].style} has no ${spec[d].weight} weight`);
      assert.ok(s.desktop.size >= 12, `${el}.${d}: ${s.desktop.size}px is below 12px`);
    }
    assert.ok(p.typography.styles[el].dense && t.color.semantic.light[spec.colour.split("/")[0]][spec.colour.split("/")[1]], `${el}: colour ${spec.colour} is not a token`);
  }
  // Sizes never shrink from open to dense.
  for (const spec of Object.values(p.typography.styles)) {
    const size = (d) => t.typography.styles[spec[d].style].desktop.size;
    assert.ok(size("open") >= size("medium") && size("medium") >= size("dense"));
  }
  // Every token name used anywhere in the spec exists.
  const colour = (n) => { const [g, k] = n.split("/"); return t.color.semantic.light[g]?.[k]; };
  const spacing = (n) => (n.startsWith("spacing/") ? t.spacing.scale.includes(Number(n.split("/")[1])) : n in t.spacing.roles.desktop);
  const walk = (o, out = []) => { for (const v of Object.values(o)) typeof v === "string" ? out.push(v) : v && typeof v === "object" && walk(v, out); return out; };
  for (const n of walk(p.spacing)) assert.ok(spacing(n), `spacing token ${n} does not exist`);
  for (const shape of Object.values(p.shapes)) {
    for (const k of ["fill", "border"]) if (shape[k]) assert.ok(colour(shape[k]), `colour token ${shape[k]} does not exist`);
    if (shape.radius) assert.ok(shape.radius.split("/")[1] in t.radius, `radius ${shape.radius} does not exist`);
    if (shape.border_width) assert.ok(shape.border_width.split("/")[1] in t.border.width, `${shape.border_width} does not exist`);
    if (shape.elevation) assert.ok(shape.elevation.replace("Elevation/", "").toLowerCase().replace(/\s+/g, "-") in t.elevation);
  }
  for (const a of [p.arrows.default, p.arrows.data_flow]) {
    assert.ok(colour(a.colour), `arrow colour ${a.colour} does not exist`);
    assert.ok(a.width.split("/")[1] in t.border.width);
  }
  for (const c of p.arrows.status.colours) assert.ok(colour(c));
});

test("A4 document padding, header and footer use design-system styles and tokens", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "document" }).format_profile;
  const t = getTokens().tokens;
  assert.deepEqual([p.safe_area.top, p.safe_area.right, p.safe_area.bottom, p.safe_area.left, p.safe_area.token], [36, 36, 36, 36, "spacing/36"]);
  assert.ok(t.spacing.scale.includes(36));
  assert.equal(p.content_width, p.canvas.width - 2 * p.safe_area.left);
  assert.equal(p.images.max_width, p.content_width);
  assert.equal(p.logo.position, "top-right");
  for (const s of [p.header.left_style, p.footer.style]) {
    assert.ok(t.typography.styles[s.style]?.weights[s.weight], `${s.style} ${s.weight} is not a text style`);
    const [g, k] = s.colour.split("/"); assert.ok(t.color.semantic.light[g]?.[k], `${s.colour} is not a token`);
  }
  assert.ok(p.header.gap_below in t.spacing.roles.desktop);
  assert.match(p.footer.default.left, /© Faclon Labs \| All Rights Reserved/);
});

test("A4 document spec uses only design-system styles and tokens", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "document" }).format_profile;
  const t = getTokens().tokens;
  const colour = (n) => { const [g, k] = n.split("/"); return t.color.semantic.light[g]?.[k]; };
  for (const [el, s] of Object.entries(p.typography.styles)) {
    const style = t.typography.styles[s.style];
    assert.ok(style?.weights[s.weight], `${el}: ${s.style} ${s.weight} is not a text style`);
    assert.ok(style.desktop.size >= p.typography.min_size, `${el} is below the minimum`);
    if (s.colour !== "per intent") assert.ok(colour(s.colour), `${el}: ${s.colour} is not a token`);
  }
  const spacing = (n) => (n.startsWith("spacing/") ? t.spacing.scale.includes(Number(n.split("/")[1])) : n in t.spacing.roles.desktop);
  const walk = (o, out = []) => { for (const v of Object.values(o)) typeof v === "string" ? out.push(v) : walk(v, out); return out; };
  for (const n of walk(p.spacing)) assert.ok(spacing(n), `spacing token ${n} does not exist`);
  // Max cards per row really fits: n × 200 + (n − 1) × gap/grid <= content width.
  const n = p.components.card.max_per_row, gap = t.spacing.roles.desktop["gap/grid"];
  assert.ok(n * 200 + (n - 1) * gap <= p.content_width && (n + 1) * 200 + n * gap > p.content_width);
});

test("A4 page breaks: cards move whole, text may split, content clears the footer", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "document" }).format_profile;
  const t = getTokens().tokens;
  assert.ok(p.page_breaks.keep_together.some((s) => /UI card/.test(s)));
  assert.deepEqual(p.page_breaks.may_split, ["paragraph", "list"]);
  const footerH = t.typography.styles[p.page_breaks.footer_zone.text_style].desktop.lineHeight;
  const gap = t.spacing.roles.desktop[p.page_breaks.content_to_footer];
  assert.equal(p.page_breaks.footer_zone.height, footerH);
  assert.equal(p.page_breaks.content_bottom_limit, p.canvas.height - p.safe_area.bottom - footerH - gap);
});

test("deck spec: styles between 14 and 72px, themes and chips use real tokens", () => {
  const { format_profile: p, rules } = getBrandGuidelines({ section: "rules", format_profile: "deck" });
  const t = getTokens().tokens;
  assert.equal(rules.find((r) => r.id === "type.min-size").check.value, 14);
  for (const [el, s] of Object.entries(p.typography.styles)) {
    const style = t.typography.styles[s.style];
    assert.ok(style?.weights[s.weight], `${el}: ${s.style} ${s.weight} is not a text style`);
    assert.ok(style.desktop.size >= 14 && style.desktop.size <= p.typography.max_size, `${el}: ${style.desktop.size}px is outside 14–72`);
  }
  const colour = (n) => { const [g, k] = n.split("/"); return t.color.semantic.light[g]?.[k]; };
  for (const [name, th] of Object.entries(p.themes)) {
    assert.ok(colour(th.background), `${name}: ${th.background}`);
    for (const v of Object.values(th.text)) assert.ok(colour(v.split(" ")[0]), `${name}: ${v}`);
  }
  assert.ok(p.ai_slides.ask_first);
  assert.equal(p.safe_area.token, "spacing/52");
});

test("newsletter spec: 600/400 breakpoints, 24px padding, token styles, placeholders", () => {
  const p = loadProfile("newsletter");
  const { desktop, mobile } = p.canvas.breakpoints;
  assert.deepEqual([desktop.width, mobile.width], [600, 400]);
  for (const bp of [desktop, mobile]) assert.equal(bp.content_width, bp.width - 2 * p.spacing.side_padding.value);
  assert.deepEqual(p.images.max_width, { desktop: desktop.content_width, mobile: mobile.content_width });
  assert.equal(p.logo.position, "top-center");
  assert.equal(p.typography.max_heading_chars, 60);
  const t = getTokens({ category: "typography" }).tokens;
  const min = getBrandGuidelines({ section: "rules", format_profile: "newsletter" }).rules.find((r) => r.id === "type.min-size").check.value;
  for (const [name, s] of Object.entries(p.typography.styles)) {
    for (const bp of ["desktop", "mobile"]) {
      const size = s.style ? t.styles[s.style]?.[bp]?.size : t.roles[s.role]?.formats.newsletter[bp].size;
      assert.ok(size >= min, `newsletter ${name} (${bp}) is ${size}px`);
    }
  }
  assert.ok(t.styles[p.typography.step_down.hero_title]);
  const sp = getTokens({ category: "spacing" }).tokens;
  assert.ok(sp.scale.includes(24));
  for (const k of ["between_sections", "between_blocks", "text_group", "inside_cards"]) {
    const s = p.spacing[k];
    assert.deepEqual([sp.roles.desktop[s.token], sp.roles.mobile[s.token]], [s.desktop, s.mobile], k);
  }
  const colours = getTokens({ category: "color", mode: "light" }).tokens.semantic;
  const has = (name) => name.split("/").reduce((o, k) => o?.[k], colours)?.value !== undefined;
  for (const c of [p.surfaces.outer, p.surfaces.content, p.hero.banner_fallback.background, p.hero.banner_fallback.text]) assert.ok(has(c), c);
  assert.doesNotMatch(JSON.stringify(p.placeholders.image_src + p.placeholders.link_href), /\{\{/);
});

test("no content edits is a locked, error-level rule cited by every format", () => {
  const r = readData(P.rules).rules.find((x) => x.id === "content.no-edits");
  assert.equal(r.severity, "error");
  assert.equal(r.locked, true);
  for (const format of ["document", "newsletter", "deck", "architecture", "social"]) {
    const g = getBrandGuidelines({ section: "rules", format_profile: format });
    assert.ok(g.rules.some((x) => x.id === "content.no-edits"), format);
    assert.ok(g.format_profile.guardrails.must_not.find((i) => i.id === "content-unchanged").basis.includes("rule:content.no-edits"), format);
  }
});

test("opacity: Figma stores 0–100, tokens serve 0–1", () => {
  const snap = readData(P.snapshot).collections.find((c) => c.name === "Global Styles").variables;
  for (const v of snap.filter((x) => /^global\/opacity\/\d+$/.test(x.name))) assert.equal(v.values.Default, Number(v.name.split("/").pop()), v.name);
  assert.deepEqual(getTokens({ category: "opacity" }).tokens, { subtle: 0.32, overlay: 0.48, muted: 0.72, full: 1 });
  assert.match(getTokens({ category: "opacity", as: "css" }).code, /--opacity-subtle: 0\.32;/);
});

test("components: every value is an existing token, role or component, with a CSS variable", () => {
  const { components } = readData(P.components);
  const vars = tokenCssVars();
  const css = getTokens({ as: "css" }).code;
  const roles = readData(P.tokens).typography.roles;
  const ids = components.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "component ids are unique");
  assert.equal(components.length, 20);
  const skip = new Set(["use", "name", "id", "width"]);
  const walk = (v, key, where) => {
    if (typeof v === "string") {
      if (key === "role") assert.ok(roles[v], `${where}: role "${v}" does not exist`);
      else if (key === "component") assert.ok(ids.includes(v), `${where}: component "${v}" does not exist`);
      else if (key === "contains") assert.ok(ids.includes(v.replace(/ \(optional\)$/, "")) || v === "metric", `${where}: "${v}" is not a component`);
      else if (v.includes("/") && !skip.has(key)) assert.ok(v in vars, `${where}: "${v}" is not a token`);
      return;
    }
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, Array.isArray(v) ? key : k, where);
  };
  for (const c of components) {
    assert.match(c.figma.node, /^\d+:\d+$/, c.id);
    walk({ ...c, figma: undefined }, null, c.id);
  }
  for (const tok of componentRefs(components).tokens) assert.match(css, new RegExp(`${vars[tok]}:`), `${tok} -> ${vars[tok]} missing from CSS`);
  for (const r of componentRefs(components).roles) assert.match(css, new RegExp(`--role-${r}-size:`), r);
});

test("components section: CSS variables, and role sizes for the requested format", () => {
  const all = getBrandGuidelines({ section: "components" });
  assert.equal(all.status, "written");
  assert.equal(all.css_vars["container/primary"], "var(--color-container-primary)");
  assert.equal(all.css_vars["padding/container"], "var(--padding-container)");
  assert.equal(all.text_roles.body.desktop, undefined);
  const deck = getBrandGuidelines({ section: "components", format_profile: "deck" });
  assert.equal(deck.text_roles.body.desktop.size, 24);
  const card = deck.components.find((c) => c.id === "card-base");
  assert.deepEqual(card.surface, { fill: "container/primary", border: "border/container", border_width: "border-width/default", radius: "radius/default" });
  assert.ok(card.variants.Tone.Featured && !card.variants.Tone.Selected, "the Selected tone is called Featured");
  const answer = deck.components.find((c) => c.id === "accordion-item").parts.find((x) => x.part === "answer");
  assert.deepEqual([answer.role, answer.color, answer.optional], ["body", "text/body", true]);
});

test("social media spec: 540 px design size, tokens and styles only", () => {
  const { format_profile: p, rules } = getBrandGuidelines({ section: "rules", format_profile: "social" });
  const t = getTokens().tokens;
  assert.equal(rules.find((r) => r.id === "type.min-size").check.value, 10);
  assert.deepEqual([p.canvas.formats.square.export, p.canvas.formats.portrait.export], [[1080, 1080], [1080, 1350]]);
  assert.equal(p.safe_area.token, "spacing/24");
  assert.ok(t.spacing.scale.includes(p.safe_area.top));
  assert.ok(t.spacing.scale.includes(Number(p.grid.gutter.split("/")[1])));
  assert.equal(p.grid.columns * p.grid.column_width + (p.grid.columns - 1) * Number(p.grid.gutter.split("/")[1]), p.content_area.width);
  assert.equal(p.content_area.width, p.canvas.width - p.safe_area.left - p.safe_area.right);
  for (const [el, s] of Object.entries(p.typography.styles)) {
    const style = t.typography.styles[s.style];
    assert.ok(style, `${el}: no text style ${s.style}`);
    assert.ok(style.weights[s.weight], `${el}: ${s.style} has no ${s.weight} weight`);
    assert.ok(style.desktop.size >= 10 && style.desktop.size <= 72, `${el}: ${style.desktop.size}px is outside 10-72`);
  }
  assert.deepEqual(p.export.file_types, ["html"]);
  assert.equal(p.carousel.cover.theme, "dark");
  assert.equal(p.carousel.rhythm.applies_from, 5);
});

test("no-ai-slop names its only exceptions: design elements, illustration styles and the Bruce AI gradient", () => {
  const rule = readData(P.rules).rules.find((r) => r.id === "design.no-ai-slop");
  assert.equal(rule.check.exceptions.length, 3);
  assert.match(rule.rule, /Glow effects are never allowed/);
});

test("gradients: only the gradient/* paint styles, served as CSS", () => {
  const g = getTokens({ category: "gradient" }).tokens;
  assert.deepEqual(Object.keys(g).sort(), ["brand", "bruce-ai"]);
  assert.equal(g["bruce-ai"].css, "linear-gradient(90deg, #2436FB 0%, #F377F7 100%)");
  assert.match(getTokens({ category: "gradient", as: "css" }).code, /--gradient-bruce-ai: linear-gradient/);
  const snap = readData(P.snapshot).paintStyles;
  for (const s of snap) assert.ok(s.name in Object.fromEntries(Object.values(g).map((x) => [x.figmaStyle, 1])), s.name);
});

test("every format with rules serves its written skill", () => {
  for (const format of formatProfiles()) {
    const p = getBrandGuidelines({ section: "rules", format_profile: format }).format_profile;
    assert.ok(p.skill, `${format}: SKILL.md is not written`);
    for (const part of ["## Your role", "## When to use it", "## What the user gives", "## Steps", "## Checklist before delivery"]) assert.ok(p.skill.includes(part), `${format}: skill has no "${part}"`);
    assert.match(p.skill, new RegExp(`format_profile: "${format}"`), `${format}: skill loads its own rules`);
    assert.doesNotMatch(p.skill, /[–—]/, `${format}: no en or em dashes`);
    assert.match(p.skill, /acts as a senior designer/, `${format}: the skill sets the senior-designer role`);
  }
});
