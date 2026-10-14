import { test } from "node:test";
import assert from "node:assert/strict";
import { readData } from "../src/lib/data.js";
import { getTokens } from "../src/tools/tokens.js";
import { getBrandGuidelines, mergeRules } from "../src/tools/guidelines.js";

const HEX = /^#[0-9A-F]{6}$/;
const snap = readData("figma/snapshot.json");
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
  assert.equal(tokens.styles.eyebrow.textCase, "uppercase");
  const mobile = getTokens({ category: "typography", mode: "mobile" }).tokens;
  assert.equal(mobile.styles["heading/h1"].size, 30);
});

test("spacing, radius, border and elevation come through", () => {
  assert.deepEqual(getTokens({ category: "spacing" }).tokens.scale, [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56]);
  assert.equal(getTokens({ category: "spacing", mode: "mobile" }).tokens.roles["padding/section"], 32);
  assert.equal(getTokens({ category: "radius" }).tokens.lg, 6);
  assert.equal(getTokens({ category: "border" }).tokens.width.thick, 2);
  assert.match(getTokens({ category: "elevation" }).tokens["mid-raised"].css, /8px 24px/);
});

test("CSS output has variables, dark theme and mobile overrides", () => {
  const { code } = getTokens({ as: "css" });
  assert.match(code, /--color-brand-500: #1655F2;/);
  assert.match(code, /:root\[data-theme="dark"\]/);
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
  assert.equal(voice.status, "not_written");
  const overview = getBrandGuidelines();
  assert.ok(overview.format_profiles.some((p) => p.id === "deck"));
  assert.equal(typeof overview.open_questions, "number");
});

test("format profiles can tighten rules but not loosen or touch locked ones", () => {
  const deck = getBrandGuidelines({ section: "rules", format_profile: "deck" });
  assert.equal(deck.rules.find((r) => r.id === "type.min-size").check.value, 24);
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
  const up = JSON.parse(fs.readFileSync(new URL("../data/sources/uploaded-2026-10-09/colors.json", import.meta.url)));
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
  assert.equal(roles.eyebrow.textCase, "uppercase");
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
    const bp = profile.format_profile.typography.breakpoint_mode;
    for (const [name, r] of Object.entries(roles)) {
      assert.ok(r.formats[format][bp].size >= min, `${name} is ${r.formats[format][bp].size}px in ${format} (${bp}), below ${min}px`);
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
  assert.match(css, /--role-eyebrow-text-transform: uppercase;/);
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
