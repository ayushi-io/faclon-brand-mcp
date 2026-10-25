import { readData } from "../lib/data.js";
import { P } from "../lib/paths.js";
import { BrandError } from "../lib/envelope.js";

export const CATEGORIES = ["color", "typography", "spacing", "radius", "border", "elevation", "opacity", "gradient"];
export const OUTPUTS = ["json", "css", "tailwind", "figma"];
export const MODES = ["light", "dark", "desktop", "mobile"];
export const FORMATS = ["document", "newsletter", "deck"];

const MODE_CATEGORIES = { light: ["color"], dark: ["color"], desktop: ["typography", "spacing"], mobile: ["typography", "spacing"] };
const tokens = () => readData(P.tokens);
const slug = (s) => String(s).replace(/[\/\s.]+/g, "-").toLowerCase();

export function getTokens({ category, as = "json", mode, format } = {}) {
  if (format) {
    if (!FORMATS.includes(format)) throw new BrandError("INVALID_PARAM", `Unknown format "${format}".`, `Use one of: ${FORMATS.join(", ")}.`);
    if (category && category !== "typography") {
      throw new BrandError("INVALID_PARAM", `Format "${format}" applies only to typography (text roles).`, `Pass category "typography", or omit category.`);
    }
  }
  if (category && !CATEGORIES.includes(category)) {
    throw new BrandError("INVALID_PARAM", `Unknown category "${category}".`, `Use one of: ${CATEGORIES.join(", ")}, or omit it for all tokens.`);
  }
  if (!OUTPUTS.includes(as)) {
    throw new BrandError("INVALID_PARAM", `Unknown output "${as}".`, `Use one of: ${OUTPUTS.join(", ")}.`);
  }
  if (mode) {
    if (!MODES.includes(mode)) throw new BrandError("INVALID_PARAM", `Unknown mode "${mode}".`, `Use one of: ${MODES.join(", ")}.`);
    if (!category || !MODE_CATEGORIES[mode].includes(category)) {
      throw new BrandError("INVALID_PARAM", `Mode "${mode}" applies only to: ${MODE_CATEGORIES[mode].join(", ")}.`, `Pass a matching category, or drop mode to get every mode.`);
    }
  }
  const cats = category ? [category] : CATEGORIES;
  switch (as) {
    case "json": return { category: category ?? "all", mode: mode ?? "all", format: format ?? "all", tokens: category ? jsonFor(category, mode, format) : Object.fromEntries(cats.map((c) => [c, jsonFor(c, undefined, format)])) };
    case "css": return { category: category ?? "all", format: format ?? "all", code: toCss(cats, format), usage: format ? `Paste into a stylesheet. Text roles are set for the ${format} format. Dark colours apply under [data-theme="dark"]; mobile sizes apply below 768px.` : 'Paste into a stylesheet. Text roles default to the document format; set data-format="newsletter" or "deck" on a container to switch. Dark colours apply under [data-theme="dark"]; mobile sizes apply below 768px.' };
    case "tailwind": return { category: category ?? "all", code: toTailwind(cats), usage: 'tailwind.config.js theme.extend. Values point at CSS variables, so also include get_tokens(as: "css").' };
    case "figma": return { category: category ?? "all", source: tokens().source, figma: toFigma(cats) };
  }
}

function jsonFor(category, mode, format) {
  const t = tokens();
  if (category === "color") {
    return mode ? { primitive: t.color.primitive, semantic: t.color.semantic[mode], overrides: t.color.overrides.filter((o) => o.mode === mode) } : t.color;
  }
  if (category === "typography") {
    // Roles narrow to one format and/or one breakpoint when asked.
    const roles = Object.fromEntries(Object.entries(t.typography.roles).map(([k, r]) => {
      const { formats, ...rest } = r;
      const picked = format ? { [format]: formats[format] } : formats;
      const shaped = Object.fromEntries(Object.entries(picked).map(([f, v]) => [f, mode ? { ref: v.ref, ...v[mode] } : v]));
      return [k, format ? { ...rest, ...shaped[format] } : { ...rest, formats: shaped }];
    }));
    if (!mode) return { ...t.typography, roles };
    const styles = Object.fromEntries(Object.entries(t.typography.styles).map(([k, s]) => {
      const { desktop, mobile, ...rest } = s;
      return [k, { ...rest, ...(mode === "desktop" ? desktop : mobile) }];
    }));
    return { ...t.typography, styles, roles };
  }
  if (category === "spacing") {
    return mode ? { scale: t.spacing.scale, roles: t.spacing.roles[mode] } : t.spacing;
  }
  return t[category];
}

// ---------- CSS ----------
function flatten(obj, prefix = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !("value" in v)) out.push(...flatten(v, [...prefix, k]));
    else out.push([[...prefix, k], v]);
  }
  return out;
}
const px = (n) => (n === 0 ? "0" : `${n}px`);

// Text roles: --role-<name>-* custom properties for one format at one breakpoint.
function roleLines(t, format, bp) {
  const lines = [];
  for (const [name, r] of Object.entries(t.typography.roles)) {
    const v = r.formats[format][bp];
    lines.push(`--role-${name}-size: ${px(v.size)};`, `--role-${name}-line-height: ${px(v.lineHeight)};`, `--role-${name}-letter-spacing: ${px(v.letterSpacing)};`);
  }
  return lines;
}
function roleStatic(t) {
  const lines = [];
  for (const [name, r] of Object.entries(t.typography.roles)) {
    lines.push(`--role-${name}-font: var(--font-${r.family === t.typography.families.heading ? "heading" : "body"});`, `--role-${name}-weight: ${r.weight};`, `--role-${name}-text-transform: ${r.textCase};`);
  }
  return lines;
}

function toCss(cats, format) {
  const t = tokens();
  const root = [], dark = [], mobile = [];
  const formatBlocks = []; // [selector, desktop lines, mobile lines]
  if (cats.includes("color")) {
    for (const [p, v] of flatten(t.color.primitive)) root.push(`--color-${slug(p.join("-"))}: ${v};`);
    for (const [p, v] of flatten(t.color.semantic.light)) root.push(`--color-${slug(p.join("-"))}: ${v.ref ? `var(--color-${slug(v.ref)})` : v.value};`);
    for (const [p, v] of flatten(t.color.semantic.dark)) dark.push(`--color-${slug(p.join("-"))}: ${v.ref ? `var(--color-${slug(v.ref)})` : v.value};`);
  }
  if (cats.includes("typography")) {
    const ty = t.typography;
    // Two typefaces only: TASA Orbiter falls back to Inter and stops there (no generic or third font).
    root.push(`--font-heading: "${ty.families.heading}", "${ty.families.body}";`, `--font-body: "${ty.families.body}";`);
    for (const [name, s] of Object.entries(ty.styles)) {
      const n = slug(name);
      root.push(`--text-${n}-font: var(--font-${s.role});`, `--text-${n}-weight: ${s.weight};`,
        `--text-${n}-size: ${px(s.desktop.size)};`, `--text-${n}-line-height: ${px(s.desktop.lineHeight)};`, `--text-${n}-letter-spacing: ${px(s.desktop.letterSpacing)};`);
      if (s.mobile.size !== s.desktop.size) mobile.push(`--text-${n}-size: ${px(s.mobile.size)};`);
      if (s.mobile.lineHeight !== s.desktop.lineHeight) mobile.push(`--text-${n}-line-height: ${px(s.mobile.lineHeight)};`);
      if (s.mobile.letterSpacing !== s.desktop.letterSpacing) mobile.push(`--text-${n}-letter-spacing: ${px(s.mobile.letterSpacing)};`);
    }
    // Text roles: the default (or requested) format on :root; other formats under [data-format].
    const base = format ?? "document";
    root.push(...roleStatic(t), ...roleLines(t, base, "desktop"));
    mobile.push(...roleLines(t, base, "mobile"));
    if (!format) for (const f of ty.formats.filter((x) => x !== base)) formatBlocks.push([`[data-format="${f}"]`, roleLines(t, f, "desktop"), roleLines(t, f, "mobile")]);
  }
  if (cats.includes("spacing")) {
    for (const v of t.spacing.scale) root.push(`--space-${v}: ${px(v)};`);
    for (const [k, v] of Object.entries(t.spacing.roles.desktop)) root.push(`--${slug(k)}: ${px(v)};`);
    for (const [k, v] of Object.entries(t.spacing.roles.mobile)) if (v !== t.spacing.roles.desktop[k]) mobile.push(`--${slug(k)}: ${px(v)};`);
  }
  if (cats.includes("radius")) for (const [k, v] of Object.entries(t.radius)) root.push(`--radius-${k}: ${px(v)};`);
  if (cats.includes("border")) for (const [k, v] of Object.entries(t.border.width)) root.push(`--border-width-${k}: ${px(v)};`);
  if (cats.includes("elevation")) for (const [k, v] of Object.entries(t.elevation)) root.push(`--shadow-${k}: ${v.css};`);
  if (cats.includes("opacity")) for (const [k, v] of Object.entries(t.opacity)) root.push(`--opacity-${k}: ${v};`);
  if (cats.includes("gradient")) for (const [k, v] of Object.entries(t.gradient)) root.push(`--gradient-${k}: ${v.css};`);

  const block = (sel, lines, indent = "") => (lines.length ? `${indent}${sel} {\n${lines.map((l) => `${indent}  ${l}`).join("\n")}\n${indent}}\n` : "");
  let css = `/* Faclon brand tokens — generated from Figma "${t.source.fileName}" */\n`;
  css += block(":root", root);
  css += block(':root[data-theme="dark"], [data-theme="dark"]', dark);
  for (const [sel, lines] of formatBlocks) css += block(sel, lines);
  const mobileBlocks = block(":root", mobile, "  ") + formatBlocks.map(([sel, , m]) => block(sel, m, "  ")).join("");
  if (mobileBlocks) css += `@media (max-width: ${t.typography.breakpoint.mobileMax}px) {\n${mobileBlocks}}\n`;
  return css;
}

// ---------- Tailwind ----------
function toTailwind(cats) {
  const t = tokens();
  const extend = {};
  if (cats.includes("color")) {
    const colors = {};
    for (const [p, v] of flatten(t.color.primitive)) setIn(colors, p, v);
    for (const [p] of flatten(t.color.semantic.light)) setIn(colors, p, `var(--color-${slug(p.join("-"))})`);
    extend.colors = colors;
  }
  if (cats.includes("typography")) {
    extend.fontFamily = { heading: ["var(--font-heading)"], body: ["var(--font-body)"] };
    extend.fontSize = Object.fromEntries(Object.entries(t.typography.styles).map(([name, s]) => {
      const n = slug(name);
      return [n, [`var(--text-${n}-size)`, { lineHeight: `var(--text-${n}-line-height)`, letterSpacing: `var(--text-${n}-letter-spacing)`, fontWeight: String(s.weight) }]];
    }));
    for (const [name, r] of Object.entries(t.typography.roles)) {
      extend.fontSize[`role-${name}`] = [`var(--role-${name}-size)`, { lineHeight: `var(--role-${name}-line-height)`, letterSpacing: `var(--role-${name}-letter-spacing)`, fontWeight: String(r.weight) }];
    }
  }
  if (cats.includes("spacing")) {
    extend.spacing = Object.fromEntries(t.spacing.scale.map((v) => [String(v / 4), `${v}px`]));
    for (const k of Object.keys(t.spacing.roles.desktop)) extend.spacing[slug(k)] = `var(--${slug(k)})`;
  }
  if (cats.includes("radius")) extend.borderRadius = Object.fromEntries(Object.entries(t.radius).map(([k, v]) => [k === "default" ? "DEFAULT" : k, `${v}px`]));
  if (cats.includes("border")) extend.borderWidth = Object.fromEntries(Object.entries(t.border.width).map(([k, v]) => [k === "default" ? "DEFAULT" : k, `${v}px`]));
  if (cats.includes("elevation")) extend.boxShadow = Object.fromEntries(Object.entries(t.elevation).map(([k, v]) => [k, v.css]));
  if (cats.includes("opacity")) extend.opacity = Object.fromEntries(Object.entries(t.opacity).map(([k, v]) => [k, String(v)]));
  if (cats.includes("gradient")) extend.backgroundImage = Object.fromEntries(Object.keys(t.gradient).map((k) => [`gradient-${k}`, `var(--gradient-${k})`]));
  return `// Faclon brand tokens for Tailwind — generated from Figma "${t.source.fileName}"\nexport default {\n  theme: {\n    extend: ${JSON.stringify(extend, null, 2).replace(/\n/g, "\n    ")}\n  }\n};\n`;
}
function setIn(obj, parts, value) {
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p] = typeof o[p] === "object" ? o[p] : {};
  o[parts.at(-1)] = value;
}

// ---------- Figma (raw variables, aliases unresolved) ----------
function toFigma(cats) {
  const snap = readData(P.snapshot);
  const byName = Object.fromEntries(snap.collections.map((c) => [c.name, c]));
  const pick = (name, prefix) => {
    const c = byName[name];
    const variables = prefix ? c.variables.filter((v) => v.name.startsWith(prefix)) : c.variables;
    return { name: c.name, modes: c.modes, variables };
  };
  const out = {};
  if (cats.includes("color")) out.color = [pick("Global Colors"), pick("Semantic Colors")];
  if (cats.includes("typography")) out.typography = { collections: [pick("Global Typography"), pick("Semantic Typography"), pick("Header Weights"), pick("Text Roles")], textStyles: snap.textStyles };
  if (cats.includes("spacing")) out.spacing = [pick("Global Spacing"), pick("Semantic Spacing")];
  if (cats.includes("radius")) out.radius = [pick("Global Styles", "global/radius"), pick("Semantic Styles", "radius")];
  if (cats.includes("border")) out.border = [pick("Global Styles", "global/border-width"), pick("Semantic Styles", "border-width")];
  if (cats.includes("opacity")) out.opacity = [pick("Global Styles", "global/opacity"), pick("Semantic Styles", "opacity")];
  if (cats.includes("elevation")) out.elevation = snap.effectStyles;
  if (cats.includes("gradient")) out.gradient = snap.paintStyles ?? [];
  return out;
}
