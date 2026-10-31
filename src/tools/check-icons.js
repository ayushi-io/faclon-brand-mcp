// Icon checks for check_design (rules icon.style and icon.lucide-only). The flat
// declaration list in check.js cannot tell which element a rule styles, so this
// reads the HTML into elements, applies each <style> rule and inline style to the
// elements it selects, and resolves token variables, enough to follow an icon to
// its square and compare their colours. Selectors it cannot match (pseudo-classes,
// sibling combinators) are skipped, so a finding is never a guess.
import { readData } from "../lib/data.js";
import { P } from "../lib/paths.js";
import { formatProfiles, loadProfile } from "./guidelines.js";
import { getTokens } from "./tokens.js";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const MIN_CONTRAST = 4.5;

// ---------- HTML ----------
function parseHtml(html) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null, text: "" };
  let cur = root;
  const body = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g)) {
    if (m[5] != null) {
      if (m[5].trim()) for (let e = cur; e; e = e.parent) e.text += m[5].trim();
      continue;
    }
    const tag = m[2].toLowerCase();
    if (m[1]) {
      let e = cur;
      while (e && e.tag !== tag) e = e.parent;
      if (e && e.parent) cur = e.parent;
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? "";
    const el = { tag, attrs, children: [], parent: cur, text: "", decls: [] };
    cur.children.push(el);
    if (!m[4] && !VOID.has(tag)) cur = el;
  }
  return root;
}
const all = (el) => el.children.flatMap((c) => [c, ...all(c)]);

// ---------- CSS ----------
function parseRules(css, out = []) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const prelude = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    for (; j < css.length && depth; j++) depth += css[j] === "{" ? 1 : css[j] === "}" ? -1 : 0;
    const inner = css.slice(open + 1, j - 1);
    if (/^@(media|container|supports|layer)\b/i.test(prelude)) parseRules(inner, out);
    else if (!prelude.startsWith("@")) {
      const decls = [...inner.matchAll(/([a-z-]+)\s*:\s*([^;]+)/gi)].map((d) => ({ prop: d[1].toLowerCase(), value: d[2].trim().replace(/\s*!important$/i, "") }));
      out.push({ selectors: prelude.split(",").map((s) => s.trim()).filter(Boolean), decls });
    }
    i = j;
  }
  return out;
}

// A selector is compounds joined by descendant or child combinators; anything else is skipped.
function parseSelector(sel) {
  if (/[+~]|::?(?!root\b)[a-z-]/i.test(sel)) return null;
  const parts = sel.replace(/\s*>\s*/g, " > ").split(/\s+/);
  const seq = [];
  for (const p of parts) {
    if (p === ">") { seq.push(">"); continue; }
    const m = p.match(/^([a-z][\w-]*|\*)?((?:[.#][\w-]+|\[[^\]]+\]|:root)*)$/i);
    if (!m) return null;
    seq.push({ tag: m[1]?.toLowerCase(), rest: [...m[2].matchAll(/([.#])([\w-]+)|\[([\w-]+)(?:([~|^$*]?=)["']?([^"'\]]*)["']?)?\]|(:root)/g)] });
  }
  return seq;
}
function matchCompound(el, c) {
  if (!el || el.tag === "#root") return false;
  if (c.tag && c.tag !== "*" && c.tag !== el.tag) return false;
  for (const r of c.rest) {
    if (r[6]) { if (el.tag !== "html" && el.parent?.tag !== "#root") return false; continue; }
    if (r[1] === ".") { if (!(el.attrs.class ?? "").split(/\s+/).includes(r[2])) return false; continue; }
    if (r[1] === "#") { if (el.attrs.id !== r[2]) return false; continue; }
    const v = el.attrs[r[3].toLowerCase()];
    if (v == null) return false;
    if (r[4] === "=" && v !== r[5]) return false;
    if (r[4] === "~=" && !v.split(/\s+/).includes(r[5])) return false;
    if (r[4] === "*=" && !v.includes(r[5])) return false;
    if (r[4] === "^=" && !v.startsWith(r[5])) return false;
    if (r[4] === "$=" && !v.endsWith(r[5])) return false;
  }
  return true;
}
function matches(el, seq, i = seq.length - 1) {
  if (!matchCompound(el, seq[i])) return false;
  if (i === 0) return true;
  if (seq[i - 1] === ">") return matches(el.parent, seq, i - 2);
  for (let a = el.parent; a && a.tag !== "#root"; a = a.parent) if (matches(a, seq, i - 1)) return true;
  return false;
}

// ---------- values ----------
function tokenVars() {
  const css = getTokens({ as: "css" }).code;
  const block = (re) => Object.fromEntries([...(css.match(re)?.[1] ?? "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  return { light: block(/:root\s*\{([^}]*)\}/), dark: block(/\[data-theme="dark"\]\s*\{([^}]*)\}/) };
}
const theme = (el) => { for (let e = el; e; e = e.parent) if (e.attrs?.["data-theme"]) return e.attrs["data-theme"] === "dark" ? "dark" : "light"; return "light"; };
function customProps(el) {
  const own = Object.fromEntries(el.decls.filter((d) => d.prop.startsWith("--")).map((d) => [d.prop, d.value]));
  return { ...(el.parent?.decls ? customProps(el.parent) : {}), ...own };
}
function resolve(value, el, T, depth = 0) {
  if (value == null || depth > 12) return value;
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => {
    const v = customProps(el)[name] ?? T[theme(el)][name] ?? T.light[name] ?? fallback;
    return v == null ? "" : resolve(v, el, T, depth + 1);
  });
}
const final = (el, prop) => el.decls.filter((d) => d.prop === prop).at(-1)?.value;
const every = (el, prop) => el.decls.filter((d) => d.prop === prop).map((d) => d.value);
const toPx = (v) => { const m = String(v ?? "").trim().match(/^([\d.]+)(px)?$/); return m ? Number(m[1]) : null; };
function toHex(v) {
  const s = String(v ?? "").trim().toLowerCase();
  let m;
  if ((m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/))) return "#" + (m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1]).toUpperCase();
  if ((m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/))) {
    if (m[4] != null && parseFloat(m[4]) < (m[4].endsWith("%") ? 100 : 1)) return null; // translucent: the colour depends on what is behind it
    return "#" + [m[1], m[2], m[3]].map((n) => Math.round(Number(n)).toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  return { white: "#FFFFFF", black: "#000000" }[s] ?? null;
}
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function color(el, T) {
  for (let e = el; e && e.decls; e = e.parent) {
    const v = final(e, "color");
    if (v && !/^(inherit|currentcolor)$/i.test(v)) return toHex(resolve(v, e, T));
  }
  return null;
}
function background(el, T) {
  const v = final(el, "background-color") ?? final(el, "background");
  if (!v) return null;
  const r = resolve(v, el, T).trim();
  return /^(none|transparent)$/i.test(r) ? null : toHex(r) ?? "unknown";
}

// Allowed icon and square sizes for one format, or for every format when none is given.
function sizesFor(profile) {
  const profiles = profile ? [profile] : formatProfiles().map(loadProfile);
  const icons = new Set(), squares = new Set();
  for (const p of profiles.filter((x) => x.icons)) {
    icons.add(p.icons.beside_text).add(p.icons.on_its_own);
    for (const s of p.icons.in_card) icons.add(s.icon), squares.add(s.square);
  }
  return { icons, squares };
}

// ---------- the checks ----------
export function checkIcons(html, profile, add) {
  const root = parseHtml(html);
  const els = all(root);
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  for (const rule of parseRules(css)) {
    for (const s of rule.selectors) {
      const seq = parseSelector(s);
      if (seq) for (const el of els) if (matches(el, seq)) el.decls.push(...rule.decls);
    }
  }
  for (const el of els) if (el.attrs.style) el.decls.push(...[...el.attrs.style.matchAll(/([a-z-]+)\s*:\s*([^;]+)/gi)].map((d) => ({ prop: d[1].toLowerCase(), value: d[2].trim() })));

  const T = tokenVars();
  const icons = els.filter((el) => el.tag === "svg" && /^0 0 24 24$/.test((el.attrs.viewbox ?? "").trim())
    && (el.attrs.stroke != null || /lucide/.test(el.attrs.class ?? "") || every(el, "stroke").length)
    && !/faclon/i.test(`${el.attrs["aria-label"] ?? ""} ${el.attrs.title ?? ""}`));
  if (!icons.length) return 0;
  const name = (el) => `<svg${el.attrs.class ? ` class="${el.attrs.class}"` : ""}>`;

  if (profile?.id === "architecture") {
    add("icon.lucide-only", "error", "Lucide-style icons in an architecture diagram.", icons.map(name),
      'Architecture diagrams use only the Faclon architecture icon library: place each icon file from get_brand_guidelines(section: "assets", asset_category: "icons") by its url.');
    return icons.length;
  }

  const { icons: iconSizes, squares } = sizesFor(profile);
  const forFormat = profile ? ` for ${profile.name}` : "";
  const strokes = [], filled = [], offSize = [], offSquare = [], notSquare = [], round = [], corners = [], bordered = [], low = [];
  for (const svg of icons) {
    for (const w of [svg.attrs["stroke-width"], ...every(svg, "stroke-width")].filter((v) => v != null)) {
      if (toPx(resolve(w, svg, T)) !== 2) strokes.push(`${name(svg)} stroke-width ${w}`);
    }
    const fill = final(svg, "fill") ?? svg.attrs.fill;
    if (fill && !/^(none|transparent)$/i.test(resolve(fill, svg, T).trim())) filled.push(`${name(svg)} fill ${fill}`);
    for (const v of [svg.attrs.width, svg.attrs.height, ...every(svg, "width"), ...every(svg, "height")].filter((x) => x != null)) {
      const n = toPx(resolve(v, svg, T));
      if (n != null && !iconSizes.has(n)) offSize.push(`${name(svg)} ${n}px`);
    }

    // The square: the nearest wrapper that holds only the icon and draws something (fill, border, corners).
    let box = null;
    for (let a = svg.parent; a && a.decls && !a.text; a = a.parent) {
      if (background(a, T) || every(a, "border").length || every(a, "border-width").length || every(a, "outline").length || every(a, "border-radius").length || every(a, "clip-path").length) { box = a; break; }
    }
    if (box) {
      const label = `<${box.tag}${box.attrs.class ? ` class="${box.attrs.class}"` : ""}>`;
      const ws = every(box, "width").map((v) => toPx(resolve(v, box, T)));
      const hs = every(box, "height").map((v) => toPx(resolve(v, box, T)));
      for (const n of [...ws, ...hs].filter((x) => x != null)) if (!squares.has(n)) offSquare.push(`${label} ${n}px`);
      const fw = toPx(resolve(final(box, "width"), box, T)), fh = toPx(resolve(final(box, "height"), box, T));
      if (fw != null && fh != null && fw !== fh) notSquare.push(`${label} ${fw} × ${fh}px`);
      for (const r of every(box, "border-radius").map((v) => resolve(v, box, T).trim())) {
        const n = toPx(r);
        if (/%/.test(r) ? parseFloat(r) >= 25 : n != null && (n >= 9999 || (fw && n >= fw / 2))) round.push(`${label} border-radius ${r}`);
        // With one size and one corner the pair is known; container-query steps are not paired.
        else if (n != null && fw && ws.length === 1 && every(box, "border-radius").length === 1 && n !== (fw <= 32 ? 4 : 8)) corners.push(`${label} ${fw}px square, border-radius ${r}`);
      }
      for (const c of every(box, "clip-path")) round.push(`${label} clip-path ${c}`.slice(0, 80));
      for (const prop of ["border", "border-width", "border-top", "border-right", "border-bottom", "border-left", "outline"]) {
        for (const v of every(box, prop).map((x) => resolve(x, box, T).trim())) if (!/^(none|0(px)?)( |$)/i.test(v) && !/\bnone\b/i.test(v)) bordered.push(`${label} ${prop}: ${v}`.slice(0, 80));
      }
    }

    // Contrast: the icon's stroke against its square, or the nearest background behind it.
    const stroke = [svg.attrs.stroke, final(svg, "stroke")].filter(Boolean).at(-1);
    const fg = stroke && !/^currentcolor$/i.test(stroke.trim()) ? toHex(resolve(stroke, svg, T)) : color(svg, T);
    let bg = null;
    for (let a = svg.parent; a && a.decls && !bg; a = a.parent) bg = background(a, T);
    if (fg && bg && bg !== "unknown") {
      const r = contrast(fg, bg);
      if (r < MIN_CONTRAST) low.push(`${name(svg)} ${fg} on ${bg}: ${r.toFixed(2)}:1`);
    }
  }

  const sizeList = (set) => [...set].sort((a, b) => a - b).join(", ");
  add("icon.style", "error", "Icon strokes must be 2px at every size.", strokes, 'Keep Lucide\'s stroke: stroke-width="2" on the <svg>, at every icon size.');
  add("icon.style", "error", "Filled icons. Lucide icons are outlines.", filled, 'Set fill="none" on the <svg> and colour the stroke with currentColor.');
  add("icon.style", "error", `Icon sizes that are not icon sizes${forFormat} (${sizeList(iconSizes)}px).`, offSize,
    'Use the format\'s icon sizes (profile icons): beside text, on its own, or the step for the card\'s width in a UI card (get_brand_guidelines(section: "iconography")).');
  add("icon.style", "error", `Icon squares that are not square sizes${forFormat} (${sizeList(squares)}px).`, offSquare,
    "Make the square the icon plus 8px (gap/inline) on every side, at the step for the card's width (icons.in_card).");
  add("icon.style", "error", "Icon containers that are not square.", notSquare, "Give the icon's square the same width and height.");
  add("icon.style", "error", "Icons in a circle, pill or other shape. Icons sit on their own or in a square only.", round,
    "Use a square with radius/md (squares up to 32px) or radius/xl (40px and up). Use a circle or another shape only if the user asked for it, and say so in the delivery note.");
  add("icon.style", "error", "Icon square corners off the rule.", corners, "Use radius/md (4px) on squares up to 32px and radius/xl (8px) on 40px and larger squares.");
  add("icon.style", "error", "Icon squares with a border or outline. The square is a solid fill.", bordered, "Remove the border and fill the square instead (container/secondary on light, container/brand to highlight).");
  add("icon.style", "error", `Icons with too little contrast against their square or background (under ${MIN_CONTRAST}:1).`, low,
    'Use a listed pair: container/secondary with text/brand, container/brand with text/on-brand, container/error with text/error, container/success with text/success (get_brand_guidelines(section: "iconography")).');
  return icons.length;
}
