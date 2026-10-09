import { readData } from "../lib/data.js";
import { BrandError } from "../lib/envelope.js";

export const CATEGORIES = ["color", "typography", "spacing", "radius", "border", "elevation", "opacity"];
export const OUTPUTS = ["json", "css", "tailwind", "figma"];
export const MODES = ["light", "dark", "desktop", "mobile"];

const MODE_CATEGORIES = { light: ["color"], dark: ["color"], desktop: ["typography", "spacing"], mobile: ["typography", "spacing"] };
const tokens = () => readData("tokens.json");
const slug = (s) => String(s).replace(/[\/\s.]+/g, "-").toLowerCase();

export function getTokens({ category, as = "json", mode } = {}) {
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
    case "json": return { category: category ?? "all", mode: mode ?? "all", tokens: category ? jsonFor(category, mode) : Object.fromEntries(cats.map((c) => [c, jsonFor(c)])) };
    case "css": return { category: category ?? "all", code: toCss(cats), usage: 'Paste into a stylesheet. Dark colours apply under [data-theme="dark"]; mobile sizes apply below 768px.' };
    case "tailwind": return { category: category ?? "all", code: toTailwind(cats), usage: 'tailwind.config.js theme.extend. Values point at CSS variables, so also include get_tokens(as: "css").' };
    case "figma": return { category: category ?? "all", source: tokens().source, figma: toFigma(cats) };
  }
}

function jsonFor(category, mode) {
  const t = tokens();
  if (category === "color") {
    return mode ? { primitive: t.color.primitive, semantic: t.color.semantic[mode], overrides: t.color.overrides.filter((o) => o.mode === mode) } : t.color;
  }
  if (category === "typography") {
    if (!mode) return t.typography;
    const styles = Object.fromEntries(Object.entries(t.typography.styles).map(([k, s]) => {
      const { desktop, mobile, ...rest } = s;
      return [k, { ...rest, ...(mode === "desktop" ? desktop : mobile) }];
    }));
    return { ...t.typography, styles };
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

function toCss(cats) {
  const t = tokens();
  const root = [], dark = [], mobile = [];
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

  const block = (sel, lines, indent = "") => (lines.length ? `${indent}${sel} {\n${lines.map((l) => `${indent}  ${l}`).join("\n")}\n${indent}}\n` : "");
  let css = `/* Faclon brand tokens — generated from Figma "${t.source.fileName}" */\n`;
  css += block(":root", root);
  css += block(':root[data-theme="dark"]', dark);
  if (mobile.length) css += `@media (max-width: ${t.typography.breakpoint.mobileMax}px) {\n${block(":root", mobile, "  ")}}\n`;
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
  }
  if (cats.includes("spacing")) {
    extend.spacing = Object.fromEntries(t.spacing.scale.map((v) => [String(v / 4), `${v}px`]));
    for (const k of Object.keys(t.spacing.roles.desktop)) extend.spacing[slug(k)] = `var(--${slug(k)})`;
  }
  if (cats.includes("radius")) extend.borderRadius = Object.fromEntries(Object.entries(t.radius).map(([k, v]) => [k === "default" ? "DEFAULT" : k, `${v}px`]));
  if (cats.includes("border")) extend.borderWidth = Object.fromEntries(Object.entries(t.border.width).map(([k, v]) => [k === "default" ? "DEFAULT" : k, `${v}px`]));
  if (cats.includes("elevation")) extend.boxShadow = Object.fromEntries(Object.entries(t.elevation).map(([k, v]) => [k, v.css]));
  if (cats.includes("opacity")) extend.opacity = Object.fromEntries(Object.entries(t.opacity).map(([k, v]) => [k, String(v)]));
  return `// Faclon brand tokens for Tailwind — generated from Figma "${t.source.fileName}"\nexport default {\n  theme: {\n    extend: ${JSON.stringify(extend, null, 2).replace(/\n/g, "\n    ")}\n  }\n};\n`;
}
function setIn(obj, parts, value) {
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p] = typeof o[p] === "object" ? o[p] : {};
  o[parts.at(-1)] = value;
}

// ---------- Figma (raw variables, aliases unresolved) ----------
function toFigma(cats) {
  const snap = readData("figma/snapshot.json");
  const byName = Object.fromEntries(snap.collections.map((c) => [c.name, c]));
  const pick = (name, prefix) => {
    const c = byName[name];
    const variables = prefix ? c.variables.filter((v) => v.name.startsWith(prefix)) : c.variables;
    return { name: c.name, modes: c.modes, variables };
  };
  const out = {};
  if (cats.includes("color")) out.color = [pick("Global Colors"), pick("Semantic Colors")];
  if (cats.includes("typography")) out.typography = { collections: [pick("Global Typography"), pick("Semantic Typography"), pick("Header Weights")], textStyles: snap.textStyles };
  if (cats.includes("spacing")) out.spacing = [pick("Global Spacing"), pick("Semantic Spacing")];
  if (cats.includes("radius")) out.radius = [pick("Global Styles", "global/radius"), pick("Semantic Styles", "radius")];
  if (cats.includes("border")) out.border = [pick("Global Styles", "global/border-width"), pick("Semantic Styles", "border-width")];
  if (cats.includes("opacity")) out.opacity = [pick("Global Styles", "global/opacity"), pick("Semantic Styles", "opacity")];
  if (cats.includes("elevation")) out.elevation = snap.effectStyles;
  return out;
}
