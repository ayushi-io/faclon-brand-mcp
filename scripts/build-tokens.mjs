// Builds data/tokens.json from data/figma/snapshot.json.
// Run after every new Figma snapshot: `npm run build:tokens`.
// Every alias is resolved to its final value, and the reference is kept
// alongside it so tools can show both ("#1655F2" and "brand/500").

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(fs.readFileSync(path.join(ROOT, "data/figma/snapshot.json"), "utf8"));

const collections = Object.fromEntries(snapshot.collections.map((c) => [c.name, c]));
const find = (collection, name) => {
  const v = collections[collection]?.variables.find((x) => x.name === name);
  if (!v) throw new Error(`Missing variable ${collection} / ${name}`);
  return v;
};

// Resolve a value for a mode, following aliases. A collection with a single
// mode is used for any requested mode (primitives have only "Default").
function resolve(collection, name, mode, trail = []) {
  const v = find(collection, name);
  const modes = collections[collection].modes;
  const m = modes.includes(mode) ? mode : modes[0];
  const raw = v.values[m];
  if (raw && typeof raw === "object" && "alias" in raw) {
    if (trail.length > 10) throw new Error(`Alias loop at ${name}`);
    return resolve(raw.collection, raw.alias, mode, [...trail, name]);
  }
  return raw;
}
const refOf = (collection, name, mode) => {
  const v = find(collection, name);
  const modes = collections[collection].modes;
  const raw = v.values[modes.includes(mode) ? mode : modes[0]];
  return raw && typeof raw === "object" && "alias" in raw ? raw.alias : null;
};
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const setPath = (obj, parts, value) => {
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p] ??= {};
  o[parts.at(-1)] = value;
};

// ---------- colour ----------
const color = { primitive: {}, semantic: { light: {}, dark: {} } };
for (const v of collections["Global Colors"].variables) setPath(color.primitive, v.name.split("/"), v.values.Default);
for (const v of collections["Semantic Colors"].variables) {
  for (const [mode, key] of [["Light", "light"], ["Dark", "dark"]]) {
    setPath(color.semantic[key], v.name.split("/"), {
      value: resolve("Semantic Colors", v.name, mode),
      ref: refOf("Semantic Colors", v.name, mode),
    });
  }
}

// Brand-team overrides (until Figma is updated). Each one is checked so a
// stale override can't silently point at a colour that doesn't exist.
const overrides = JSON.parse(fs.readFileSync(path.join(ROOT, "data/overrides/semantic-colors.json"), "utf8"));
const getPath = (obj, parts) => parts.reduce((o, p) => o?.[p], obj);
for (const p of overrides.primitives) setPath(color.primitive, p.path.split("/"), p.value);
color.overrides = [];
for (const o of overrides.semantic) {
  const primitive = getPath(color.primitive, o.ref.split("/"));
  if (primitive !== o.value) throw new Error(`Override ${o.token} (${o.mode}): ${o.ref} is ${primitive}, expected ${o.value}`);
  const parts = o.token.split("/");
  const current = getPath(color.semantic[o.mode], parts);
  if (!current) throw new Error(`Override for unknown token ${o.token}`);
  color.overrides.push({ token: o.token, mode: o.mode, figma: { ...current }, now: { value: o.value, ref: o.ref }, source: o.source });
  setPath(color.semantic[o.mode], parts, { value: o.value, ref: o.ref, overridden: true });
}

// ---------- typography ----------
const WEIGHT = { regular: 400, medium: 500, semibold: 600, "semi bold": 600, bold: 700, extrabold: 800, "extra bold": 800 };
const weightNum = (s) => WEIGHT[String(s).toLowerCase()] ?? null;
const ST = "Semantic Typography";

const families = {
  heading: resolve(ST, "family/heading", "Desktop"),
  body: resolve(ST, "family/body", "Desktop"),
};
const weights = { heading: {}, body: {} };
for (const role of ["heading", "body"]) {
  // Brand decision 2026-10-09: weights 400–700 only; ExtraBold and Black are banned.
  for (const w of ["regular", "medium", "semibold", "bold"]) {
    weights[role][w] = weightNum(resolve(ST, `weight/${role}/${w}`, "Desktop"));
  }
}

// Map a text style name to its semantic variable stem.
const stemFor = (name) => {
  const n = name.toLowerCase();
  if (n === "eyebrow") return { size: "size/eyebrow", lh: "line-height/eyebrow", ls: "letter-spacing/eyebrow" };
  const [group, step] = n.split("/");
  const key = `${group}/${step}`;
  return { size: `size/${key}`, lh: `line-height/${key}`, ls: `letter-spacing/${key}` };
};
const has = (name) => collections[ST].variables.some((v) => v.name === name);
// Use a semantic variable only when it agrees with the text style's own desktop
// value (i.e. the style really follows that variable). Otherwise the style wins
// in both modes. Example: Body styles have 0 tracking even though
// letter-spacing/body/* variables exist unbound.
const modeValue = (name, mode, styleValue) => {
  if (!has(name)) return styleValue;
  const desktop = resolve(ST, name, "Desktop");
  if (Math.abs(desktop - styleValue) > 0.01) return styleValue;
  return resolve(ST, name, mode);
};

// Weight variants ("Heading/H1/Bold", "Eyebrow/Semi Bold") share size, line
// height and tracking with their base style; they're listed under the base.
const isVariant = (name) => /^(regular|medium|semi ?bold|bold)$/i.test(name.split("/").at(-1));
const isRole = (name) => name.startsWith("Role/");
const styles = {};
for (const s of snapshot.textStyles) {
  if (isVariant(s.name) || isRole(s.name)) continue;
  const parts = s.name.split("/");
  const stem = stemFor(s.name);
  const ls = s.letterSpacing.unit === "PIXELS" ? s.letterSpacing.value : (s.letterSpacing.value / 100) * s.fontSize;
  styles[s.name.toLowerCase()] = {
    family: s.fontFamily,
    role: s.fontFamily === families.heading ? "heading" : "body",
    weight: weightNum(s.fontStyle),
    textCase: s.textCase === "UPPER" ? "uppercase" : "none",
    desktop: {
      size: modeValue(stem.size, "Desktop", s.fontSize),
      lineHeight: modeValue(stem.lh, "Desktop", s.lineHeight.value),
      letterSpacing: round(modeValue(stem.ls, "Desktop", ls)),
    },
    mobile: {
      size: modeValue(stem.size, "Mobile", s.fontSize),
      lineHeight: modeValue(stem.lh, "Mobile", s.lineHeight.value),
      letterSpacing: round(modeValue(stem.ls, "Mobile", ls)),
    },
    figmaTextStyle: s.name,
    weights: {},
  };
}
for (const s of snapshot.textStyles.filter((x) => isVariant(x.name))) {
  const base = s.name.split("/").slice(0, -1).join("/").toLowerCase();
  if (!styles[base]) throw new Error(`Weight variant ${s.name} has no base style`);
  styles[base].weights[weightNum(s.fontStyle)] = s.name;
}
for (const st of Object.values(styles)) {
  st.weights[st.weight] ??= st.figmaTextStyle; // the base style itself is its default weight
  st.weights = Object.fromEntries(Object.entries(st.weights).sort(([a], [b]) => a - b));
}
// Text roles: one Role/* style per purpose. The Text Roles collection picks a
// semantic size per format (Document, Newsletter, Deck); that size then still
// follows Desktop/Mobile, so each role resolves to format x breakpoint.
const TR = "Text Roles";
const roles = {};
const roleRef = (name, format) => {
  const raw = find(TR, name).values[format];
  if (!(raw && typeof raw === "object" && "alias" in raw)) throw new Error(`${name} (${format}) must alias a Semantic Typography variable`);
  return raw.alias;
};
for (const s of snapshot.textStyles.filter((x) => isRole(x.name))) {
  const key = s.name.slice("Role/".length).toLowerCase().replace(/\s+/g, "-");
  const hasLs = collections[TR].variables.some((v) => v.name === `role/${key}/letter-spacing`);
  const formats = {};
  for (const format of collections[TR].modes) {
    const refs = { size: roleRef(`role/${key}/size`, format), lineHeight: roleRef(`role/${key}/line-height`, format), letterSpacing: hasLs ? roleRef(`role/${key}/letter-spacing`, format) : null };
    const at = (mode) => ({
      size: resolve(ST, refs.size, mode),
      lineHeight: resolve(ST, refs.lineHeight, mode),
      letterSpacing: refs.letterSpacing ? round(resolve(ST, refs.letterSpacing, mode)) : 0,
    });
    formats[format.toLowerCase()] = { ref: refs.size, desktop: at("Desktop"), mobile: at("Mobile") };
  }
  roles[key] = {
    family: s.fontFamily,
    weight: weightNum(s.fontStyle),
    textCase: s.textCase === "UPPER" ? "uppercase" : "none",
    use: s.description.split(". ")[0].replace(/\.$/, ""),
    figmaTextStyle: s.name,
    formats,
  };
}
const typography = { families, weights, styles, roles, formats: collections[TR].modes.map((m) => m.toLowerCase()), breakpoint: { mobileMax: 767 } };

// ---------- spacing ----------
const spacing = {
  scale: collections["Global Spacing"].variables.map((v) => v.values.Default).sort((a, b) => a - b),
  roles: { desktop: {}, mobile: {} },
};
for (const v of collections["Semantic Spacing"].variables) {
  if (/^spacing\/\d+$/.test(v.name)) continue; // 1:1 copies of the scale
  for (const [mode, key] of [["Desktop", "desktop"], ["Mobile", "mobile"]]) {
    spacing.roles[key][v.name] = resolve("Semantic Spacing", v.name, mode);
  }
}

// ---------- radius / border / opacity ----------
const fromSemantic = (prefix) => {
  const out = {};
  for (const v of collections["Semantic Styles"].variables.filter((x) => x.name.startsWith(prefix + "/"))) {
    out[v.name.slice(prefix.length + 1)] = round(resolve("Semantic Styles", v.name, "Default"));
  }
  return out;
};
const radius = fromSemantic("radius");
const border = { width: fromSemantic("border-width") };
// Figma stores opacity variables as 0–100 (it reads them as percentages); CSS wants 0–1.
const opacity = Object.fromEntries(Object.entries(fromSemantic("opacity")).map(([k, v]) => [k, round(v / 100)]));

// ---------- elevation ----------
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const elevation = {};
for (const s of snapshot.effectStyles) {
  const key = s.name.replace(/^Elevation\//, "").toLowerCase().replace(/\s+/g, "-");
  const shadows = s.effects.filter((e) => e.type === "DROP_SHADOW");
  elevation[key] = {
    description: s.description,
    shadows: shadows.map(({ x, y, blur, spread, color: c, opacity: a }) => ({ x, y, blur, spread, color: c.slice(0, 7), opacity: a })),
    css: shadows.length ? shadows.map((e) => `${e.x}px ${e.y}px ${e.blur}px ${e.spread}px ${rgba(e.color, e.opacity)}`).join(", ") : "none",
  };
}

const tokens = {
  source: snapshot.source,
  color,
  typography,
  spacing,
  radius,
  border,
  elevation,
  opacity,
};

fs.writeFileSync(path.join(ROOT, "data/tokens.json"), JSON.stringify(tokens, null, 2) + "\n");
console.log("Wrote data/tokens.json");
