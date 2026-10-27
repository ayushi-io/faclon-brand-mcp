// check_design: a static check of finished HTML against the brand rules, run
// before delivery. Every allowed value comes from tokens.json and the merged
// rules, so the check follows Figma without its own list of values.
import { readData } from "../lib/data.js";
import { P } from "../lib/paths.js";
import { BrandError } from "../lib/envelope.js";
import { loadProfile, mergeRules } from "./guidelines.js";
import { getTokens } from "./tokens.js";

const MAX_HTML = 2_000_000;
const ALLOWED_FAMILIES = ["tasa orbiter", "inter"];
const GENERIC_FAMILIES = ["serif", "sans-serif", "monospace", "system-ui", "cursive", "fantasy", "ui-sans-serif", "ui-serif", "-apple-system", "blinkmacsystemfont"];
const KEYWORDS = new Set(["inherit", "initial", "unset", "revert", "transparent", "currentcolor", "none"]);
const NAMED = { white: "#FFFFFF", black: "#000000" };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F900}-\u{1F9FF}]/u;

// ---------- what the design system allows ----------
function allowed() {
  const t = readData(P.tokens);
  const colours = new Set();
  const walk = (v) => {
    if (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) colours.add(v.toUpperCase());
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(t.color);
  const sizes = new Set();
  for (const s of Object.values(t.typography.styles)) for (const bp of ["desktop", "mobile"]) if (s[bp]) sizes.add(s[bp].size);
  for (const r of Object.values(t.typography.roles)) for (const f of Object.values(r.formats)) for (const bp of ["desktop", "mobile"]) if (f[bp]) sizes.add(f[bp].size);
  const css = getTokens({ as: "css" }).code;
  const vars = new Set([...css.matchAll(/(--[a-z0-9-]+):/gi)].map((m) => m[1]));
  return {
    colours,
    sizes,
    vars,
    radius: new Set(Object.values(t.radius)),
    borders: new Set(Object.values(t.border.width)),
    shadows: new Set(Object.values(t.elevation).map((e) => norm(e.css))),
    gradients: Object.fromEntries(Object.entries(t.gradient ?? {}).map(([k, g]) => [norm(g.css), k])),
  };
}

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").replace(/\s*([(),])\s*/g, "$1").trim();
const hex = (h) => {
  h = h.replace("#", "");
  if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join("");
  return "#" + h.slice(0, 6).toUpperCase();
};
const rgbHex = (r, g, b) => "#" + [r, g, b].map((n) => Math.round(Number(n)).toString(16).padStart(2, "0")).join("").toUpperCase();
const px = (v) => {
  const m = String(v).trim().match(/^(-?[\d.]+)(px|rem|em|pt)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return { px: n, rem: n * 16, em: n * 16, pt: (n * 4) / 3 }[(m[2] || "px").toLowerCase()];
};

// ---------- reading the HTML ----------
function readHtml(html) {
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const inline = [...html.matchAll(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi)].map((m) => m[2] ?? m[3]);
  const css = [...styleBlocks, ...inline].join(";\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const decls = [...css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)]
    .filter((m) => !m[1].startsWith("--")) // custom property definitions are the tokens themselves
    .map((m) => ({ prop: m[1].toLowerCase(), value: m[2].trim().replace(/\s*!important$/i, "") }));
  const attrColours = [...html.matchAll(/\s(?:bgcolor|color)\s*=\s*["']?(#[0-9a-f]{3,8})/gi)].map((m) => m[1]);
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  return { decls, attrColours, text, imgs, html };
}

// ---------- the checks ----------
export function checkDesign({ html, format_profile } = {}) {
  if (typeof html !== "string" || !html.trim()) {
    throw new BrandError("INVALID_PARAM", "No HTML to check.", "Pass the finished HTML as the html argument.");
  }
  if (html.length > MAX_HTML) {
    throw new BrandError("INVALID_PARAM", "The HTML is too large to check.", "Check one page, slide or email at a time.");
  }
  const profile = format_profile ? loadProfile(format_profile) : null;
  const rules = mergeRules(profile).rules;
  const minSize = rules.find((r) => r.id === "type.min-size").check.value;
  const maxSize = profile?.typography?.max_size;
  const A = allowed();
  const doc = readHtml(html);
  const findings = [];
  const add = (rule, severity, message, evidence, fix) => {
    const ev = [...new Set(evidence)].slice(0, 6);
    if (ev.length) findings.push({ rule, severity, message, evidence: ev, fix });
  };
  const usesVar = (v) => {
    const names = [...v.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]);
    return { names, unknown: names.filter((n) => !A.vars.has(n)) };
  };

  // Variables must be the token custom properties.
  add("color.tokens-only", "error", "These CSS variables are not design-system tokens.",
    doc.decls.flatMap((d) => usesVar(d.value).unknown),
    'Use the custom properties from get_tokens(as: "css"), or define them from it; never invent a token name.');

  // Colours: literal values must equal a token value.
  const offColours = [];
  const tokenGradients = [];
  for (const d of doc.decls) {
    let v = d.value;
    for (const g of v.matchAll(/(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/gi)) {
      if (norm(g[0]) in A.gradients) tokenGradients.push(A.gradients[norm(g[0])]);
      v = v.replace(g[0], ""); // gradients are checked below
    }
    for (const m of v.matchAll(/#[0-9a-f]{3,8}\b/gi)) if (!A.colours.has(hex(m[0]))) offColours.push(m[0]);
    for (const m of v.matchAll(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)[^)]*\)/gi)) if (!A.colours.has(rgbHex(m[1], m[2], m[3]))) offColours.push(m[0]);
    for (const m of v.matchAll(/hsla?\([^)]*\)/gi)) offColours.push(m[0]);
    if (/^(color|background|background-color|border(-[a-z]+)?-color|fill|stroke|outline-color)$/.test(d.prop)) {
      const w = v.trim().toLowerCase();
      if (/^[a-z]+$/.test(w) && !KEYWORDS.has(w) && !(w in NAMED && A.colours.has(NAMED[w]))) offColours.push(w);
    }
  }
  for (const c of doc.attrColours) if (!A.colours.has(hex(c))) offColours.push(c);
  add("color.tokens-only", "error", "These colours are not design-system tokens.", offColours,
    'Use a colour token from get_tokens(category: "color"); never sample or approximate one.');

  // Architecture: brand blue only in the final outcome, which is placed as an image file,
  // so the diagram's own code uses no brand/500 or darker blue.
  if (profile?.id === "architecture") {
    const t = readData(P.tokens);
    const prim = t.color.primitive.brand;
    const dark = new Set(["500", "600", "700", "800", "900", "1000"].map((k) => (prim[k].value ?? prim[k]).toUpperCase()));
    const darkVars = /var\(\s*--color-(brand-(500|600|700|800|900|1000)|container-brand|background-brand|border-brand|text-brand|text-link|text-info|text-eyebrow|container-info-strong)\b/i;
    const hits = [];
    for (const d of doc.decls) {
      if (darkVars.test(d.value)) hits.push(`${d.prop}: ${d.value}`.slice(0, 80));
      for (const m of d.value.matchAll(/#[0-9a-f]{3,8}\b/gi)) if (dark.has(hex(m[0]))) hits.push(`${d.prop}: ${m[0]}`);
    }
    for (const a of doc.attrColours) if (dark.has(hex(a))) hits.push(a);
    add("architecture.brand-on-outcome", "error", "Brand blue (brand/500) or a darker blue is used outside the final outcome.", hits,
      "Use neutrals and light blue tints (brand/050 to brand/400) for tags, zones, arrows and text; brand blue lives only in the placed I/O Sense outcome (asset category architecture-outcomes).");
  }

  // Fonts.
  const offFonts = [];
  const genericFonts = [];
  for (const d of doc.decls.filter((x) => x.prop === "font-family" || x.prop === "font")) {
    const list = d.prop === "font" ? (d.value.match(/(?:\d[\w.%]*\s+)+(.+)$/)?.[1] ?? "") : d.value;
    for (const f of list.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)) {
      const l = f.toLowerCase();
      if (l.startsWith("var(") || KEYWORDS.has(l) || ALLOWED_FAMILIES.includes(l)) continue;
      (GENERIC_FAMILIES.includes(l) ? genericFonts : offFonts).push(f);
    }
  }
  add("type.two-families-only", "error", "Only TASA Orbiter and Inter may be used.", offFonts, "Set headings in TASA Orbiter and body text in Inter.");
  add("type.two-families-only", "warning", "Generic fallback fonts are listed. The brand falls back to Inter only.", genericFonts, "End the font stack with Inter and nothing else.");

  // Sizes and weights.
  const small = [], big = [], offScale = [];
  for (const d of doc.decls.filter((x) => x.prop === "font-size")) {
    if (/var\(/.test(d.value)) continue;
    const n = px(d.value);
    if (n == null) continue;
    if (n < minSize) small.push(d.value);
    else if (maxSize && n > maxSize) big.push(d.value);
    else if (!A.sizes.has(Math.round(n))) offScale.push(d.value);
  }
  add("type.min-size", "error", `Text below the ${minSize}px minimum${profile ? ` for ${profile.name}` : ""}.`, small,
    "Use a larger text style. If the content does not fit, tell the user and offer options; never shrink or cut it.");
  if (maxSize) add("type.min-size", "error", `Text above the ${maxSize}px maximum for ${profile.name}.`, big, `The largest style is ${profile.typography.max_style ?? "Display/XL"} (${maxSize}px).`);
  add("type.styles-only", "warning", "Font sizes that are not on the type scale.", offScale,
    'Use the size of a named text style or text role (get_tokens(category: "typography")).');
  const weights = [];
  for (const d of doc.decls.filter((x) => x.prop === "font-weight")) {
    const w = { normal: 400, bold: 700 }[d.value.toLowerCase()] ?? Number(d.value);
    if (!Number.isFinite(w) || w < 400 || w > 700 || w % 100) weights.push(d.value);
  }
  add("type.weight-range", "error", "Font weights must be 400, 500, 600 or 700.", weights, "Use Regular (400), Medium (500), Semi Bold (600) or Bold (700).");

  // Radius and borders.
  const offRadius = [], offBorder = [];
  for (const d of doc.decls) {
    const v = d.value.replace(/var\([^)]*\)/g, " ").trim(); // token parts are fine; check the rest
    if (!v) continue;
    if (/^border(-[a-z]+)*-radius$/.test(d.prop)) {
      for (const part of v.split(/[\s/]+/).filter(Boolean)) {
        if (part === "50%" || part === "0") continue;
        const n = px(part);
        if (n != null && n < 9999 && !A.radius.has(n)) offRadius.push(d.value);
      }
    }
    if (/^border(-(top|right|bottom|left))?(-width)?$/.test(d.prop) && d.prop !== "border-radius") {
      for (const m of v.matchAll(/(^|\s)([\d.]+)(px)?(?=\s|$)/g)) {
        const n = Number(m[2]);
        if (n !== 0 && !A.borders.has(n)) offBorder.push(d.value);
      }
    }
  }
  add("radius.scale-only", "error", "Corner radius not on the radius scale (2 to 24px, or pill).", offRadius, 'Use a radius token from get_tokens(category: "radius").');
  add("border.width-scale-only", "error", "Border width not on the border scale (1 to 6px).", offBorder, 'Use a border-width token from get_tokens(category: "border").');

  // No AI slop: effects, shadows, gradients. Glow (text-shadow, drop-shadow or blur
  // filters, centred box-shadows) is allowed on Bruce AI content only; glass never is.
  const bruceContent = /bruce/i.test(doc.text);
  const centred = (v) => /^\s*(inset\s+)?0(px)?\s+0(px)?\s/.test(v);
  const effects = [], shadows = [], gradients = [];
  for (const d of doc.decls) {
    if (d.prop === "text-shadow" && d.value !== "none" && !bruceContent) effects.push(`text-shadow: ${d.value}`);
    if (d.prop === "backdrop-filter" || d.prop === "-webkit-backdrop-filter") effects.push(`${d.prop}: ${d.value}`);
    if (d.prop === "filter" && /blur|drop-shadow|glow/i.test(d.value) && !bruceContent) effects.push(`filter: ${d.value}`);
    if (d.prop === "box-shadow" && d.value !== "none" && !/var\(--shadow-/.test(d.value) && !A.shadows.has(norm(d.value)) && !(bruceContent && d.value.split(/,(?![^(]*\))/).every(centred))) shadows.push(d.value);
    for (const g of d.value.matchAll(/(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/gi)) if (!(norm(g[0]) in A.gradients)) gradients.push(g[0].slice(0, 80));
  }
  add("design.no-ai-slop", "error", "Blur, glass, glow or text effects are not allowed (glow only on Bruce AI content; glass never).", effects, "Remove the effect; keep surfaces flat and text plain.");
  add("design.no-ai-slop", "error", "Shadows other than the Elevation tokens.", shadows, 'Use var(--shadow-low-raised) or another Elevation token, or no shadow.');
  add("design.no-ai-slop", "error", "Gradients other than the brand gradient styles.", gradients, 'Remove the gradient. Only the gradient tokens are allowed, where a rule allows them (get_tokens(category: "gradient")).');
  const usesBruce = tokenGradients.includes("bruce-ai") || doc.decls.some((d) => /var\(--gradient-bruce-ai\)/.test(d.value));
  if (usesBruce && !/bruce/i.test(doc.text)) {
    add("design.no-ai-slop", "warning", "The Bruce AI gradient is used, but the content does not mention Bruce AI.", ["--gradient-bruce-ai"], "Use the Bruce AI gradient only on Bruce AI content.");
  }

  // Images and logo.
  const noAlt = doc.imgs.filter((i) => !/\salt\s*=\s*["'][^"']+["']/i.test(i)).map((i) => i.slice(0, 80));
  const altSeverity = ["document", "newsletter"].includes(profile?.id) ? "error" : "warning";
  add(profile?.id === "newsletter" ? "newsletter.images" : "images.alt-text", altSeverity, "Images without alt text.", noAlt,
    profile?.id === "newsletter" ? "Add the user's alt text, or an ALT_TEXT_<NAME> placeholder." : "Add alt text that describes the image.");
  if (!/faclon/i.test(html)) {
    add("logo.default-position", "warning", "No Faclon Labs logo found.", ["no element mentions Faclon"], "Place the full Faclon Labs logo, top-right by default.");
  }

  // Newsletter (Brevo).
  if (profile?.id === "newsletter") {
    if (!/\{\{\s*unsubscribe\s*\}\}/.test(html)) add("newsletter.unsubscribe", "error", "No {{ unsubscribe }} link.", ["{{ unsubscribe }} missing"], 'Add <a href="{{ unsubscribe }}">Unsubscribe</a> in the footer.');
    const tags = [...html.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map((m) => m[1]).filter((t) => !/^(unsubscribe|mirror|contact\.[A-Z0-9_]+)$/.test(t));
    add("newsletter.invent-urls", "error", "Brevo {{ }} tags other than unsubscribe, mirror and contact attributes.", tags.map((t) => `{{ ${t} }}`),
      "Write placeholders as plain uppercase names (IMAGE_URL_..., LINK_URL_...), never in {{ }}.");
    add("newsletter.straight-quotes", "error", "Typographic quotes around Brevo tags.", [...html.matchAll(/[“”‘’]\s*\{\{[^}]*\}\}|\{\{[^}]*\}\}\s*[“”‘’]/g)].map((m) => m[0]), "Use straight double quotes around Brevo tags.");
    add("newsletter.no-emoji", "error", "Emoji in the newsletter.", [...doc.text.matchAll(new RegExp(EMOJI.source, "gu"))].map((m) => m[0]), "Remove the emoji; show the point with text styles and components.");
  }

  // Voice: these are the user's words, so flag them, never change them.
  const dashes = [...doc.text.matchAll(/.{0,20}[–—].{0,20}/g)].map((m) => m[0].trim());
  add("voice.dashes", "warning", "En or em dashes in the text (the voice uses hyphens or colons).", dashes,
    "These are the user's words: highlight them and suggest a hyphen or colon; change nothing unless the user approves.");
  const bangs = [...doc.text.matchAll(/.{0,25}!(?!=)/g)].map((m) => m[0].trim());
  add("voice.exclamation", "warning", "Exclamation marks in the text (the voice uses none).", bangs,
    "These are the user's words: highlight them and suggest a change; change nothing unless the user approves.");

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.length - errors;
  return {
    format_profile: profile?.id ?? null,
    verdict: errors ? "fail" : "pass",
    summary: { errors, warnings },
    findings,
    checked: "Colours, fonts, text sizes and weights, radius, borders, shadows, gradients and effects, image alt text, the logo, voice (dashes, exclamation marks)" + (profile?.id === "newsletter" ? ", and Brevo tags, quotes and emoji" : "") + ".",
    not_checked: "Layout, spacing, hierarchy, overflow, content changes and the format's design direction. Review those against the format's skill checklist.",
  };
}
