// Builds data/components/components.json from data/figma/components-snapshot.json
// (exported by the Faclon Brand Sync plugin). Run after every new export:
// `npm run build:components` (add --verbose to list the details the file leaves out).
//
// Figma owns every value: props, layout, surface, parts and variants are read from
// each component's variable bindings, never from its description.
// components.json owns what Figma can't say: `about`, `usage`, each component's `use`,
// notes on parts and hints such as the text colour inside Card base. For a component
// already in the file the build keeps those, keeps the file's order (props, options,
// parts, variants, keys), and keeps out the optional details the file leaves out
// (`default`, an "(optional)" mark in `contains`). Every value it writes comes from Figma.
// New components get an empty `use` and are listed; removed ones are dropped and listed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SNAPSHOT = "data/figma/components-snapshot.json";
export const OUTPUT = "data/components/components.json";

const PROP_TYPES = { TEXT: "text", BOOLEAN: "boolean", SLOT: "slot", INSTANCE_SWAP: "instance" };
const SHAPES = new Set(["RECTANGLE", "ELLIPSE", "LINE", "VECTOR", "POLYGON", "STAR", "BOOLEAN_OPERATION"]);
const CONTAINERS = new Set(["FRAME", "GROUP"]);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const lower = (s) => s.trim().toLowerCase();
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isZero = (v) => v === 0 || v === undefined;

// ---------- deriving one component from the export ----------

function deriveAll(snapshot, existing, warn) {
  const known = new Map(existing.components.map((c) => [c.figma.node, c.id]));
  const byNode = new Map(snapshot.components.map((c) => [c.id, c]));
  const idOf = (node, name) => known.get(node) ?? slug(name);
  const ctx = { idOf, byNode, warn };
  return snapshot.components.map((c) => deriveComponent(c, ctx));
}

function deriveComponent(c, ctx) {
  const id = ctx.idOf(c.id, c.name);
  const variants = c.variants ?? [{ variant: {}, node: c.node }];
  const axes = Object.keys(c.properties).filter((k) => c.properties[k].type === "VARIANT");
  const base = variants.find((v) => axes.every((a) => v.variant[a] === c.properties[a].default)) ?? variants[0];
  const kind = c.page === "Badges" ? "control" : /\bcard\b/i.test(c.name) ? "card" : "atom";

  // Describe every variant (warnings only once, from the default one).
  const quiet = { ...ctx, warn: () => {} };
  const described = variants.map((v) => describe(v.node, v === base ? ctx : quiet, id));
  const main = described[variants.indexOf(base)];

  // Values that differ between variants move out of layout/surface/parts into `variants`,
  // grouped by the smallest set of variant properties they depend on.
  const factKeys = [...new Set(described.flatMap((d) => d.facts.map((f) => f.key)))];
  const groups = {};
  for (const key of factKeys) {
    const values = described.map((d) => d.facts.find((f) => f.key === key));
    const defined = values.map((f, i) => [i, f]).filter(([, f]) => f);
    if (new Set(defined.map(([, f]) => JSON.stringify(f.value))).size < 2) continue;
    const deps = smallestAxes(axes, defined.map(([i, f]) => [variants[i].variant, f.value]));
    const group = deps.join("/");
    groups[group] ??= {};
    for (const [i, f] of defined) {
      const option = deps.map((a) => variants[i].variant[a]).join("/");
      groups[group][option] ??= {};
      groups[group][option][key] = f.value;
    }
    const mine = main.facts.find((f) => f.key === key);
    if (mine?.path && !(kind === "card" && mine.path[0] === "surface")) unset(main, mine.path);
  }
  const parts = main.parts.filter((p) => Object.keys(p).some((k) => k !== "part" && k !== "optional"));

  const props = Object.fromEntries(Object.entries(c.properties).map(([k, d]) => [k, d.type === "VARIANT" ? d.options : PROP_TYPES[d.type] ?? lower(d.type)]));
  const out = { id, name: c.name, kind, figma: { page: c.page, node: c.id }, use: "" };
  if (Object.keys(props).length) out.props = props;
  if (main.layout && Object.keys(main.layout).length) out.layout = main.layout;
  if (main.surface && Object.keys(main.surface).length) out.surface = main.surface;
  if (main.size) out.size = main.size;
  if (parts.length) out.parts = parts;
  if (Object.keys(groups).length) out.variants = sortGroups(groups, axes);
  if (kind === "card") out.width = "fills its grid column";
  else if (main.width) out.width = main.width;
  if (out.width === "hug" && main.singleLine) out.wrap = "single line";
  if (axes.length) out.default = Object.fromEntries(axes.map((a) => [a, c.properties[a].default]));
  return { entry: out, factKeys: new Set(factKeys) };
}

function smallestAxes(axes, rows) {
  const subsets = [[]];
  for (const a of axes) for (const s of [...subsets]) subsets.push([...s, a]);
  subsets.sort((x, y) => x.length - y.length);
  for (const s of subsets) {
    const seen = new Map();
    if (rows.every(([variant, value]) => {
      const k = s.map((a) => variant[a]).join("/");
      if (!seen.has(k)) seen.set(k, JSON.stringify(value));
      return seen.get(k) === JSON.stringify(value);
    })) return s;
  }
  return axes;
}

function sortGroups(groups, axes) {
  const rank = (g) => g.split("/").map((a) => axes.indexOf(a)).join(",");
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => rank(a).localeCompare(rank(b))));
}

function unset(obj, p) {
  const parent = p.slice(0, -1).reduce((o, k) => o?.[k], obj);
  if (parent) delete parent[p.at(-1)];
}

// One variant: its surface, layout, parts and the facts that can vary between variants.
function describe(root, ctx, id) {
  const where = (s) => `${id}${s ? ` › ${s}` : ""}`;
  const token = (v, what, at) => {
    if (isObject(v) && "variable" in v) {
      if (v.collection.startsWith("Global ")) ctx.warn(`${where(at)}: ${what} is bound to the primitive ${v.collection} / ${v.variable}; use a semantic token`);
      return v.variable;
    }
    if (isObject(v) && "missing" in v) ctx.warn(`${where(at)}: ${what} is bound to a variable that no longer exists`);
    else if (typeof v === "number" && v !== 0) ctx.warn(`${where(at)}: ${what} is ${v}, not bound to a variable`);
    return v;
  };
  const paint = (list, what, at) => {
    const p = list?.[0];
    if (!p) return undefined;
    if (p.variable) return token(p.variable, what, at);
    ctx.warn(`${where(at)}: ${what} is ${p.color ?? p.type}, not bound to a colour variable`);
    return p.color ?? p.type;
  };
  const padding = (pad, at) => Object.fromEntries(["top", "right", "bottom", "left"].map((s) => [s, token(pad[s], `padding ${s}`, at)]));
  const facts = [];
  const fact = (key, value, p) => facts.push({ key, value, path: p });

  // The surface is the root, or the one shape/frame a bare root wraps (Chip, Image, Divider).
  const only = root.children?.length === 1 ? root.children[0] : null;
  const bare = !root.fills?.length && !root.strokes?.length && !root.effects;
  const S = bare && only && (only.type === "FRAME" || SHAPES.has(only.type)) ? only : root;
  const out = { facts };

  if (S.fills?.length || S.strokes?.length || S.effects || S.radius) {
    const surface = {};
    const fill = paint(S.fills, "fill");
    if (fill !== undefined) { surface.fill = fill; fact("fill", fill, ["surface", "fill"]); }
    const border = paint(S.strokes, "border");
    if (border !== undefined) surface.border = border;
    fact("border", border ?? null, ["surface", "border"]);
    if (S.strokes?.length) {
      surface.border_width = token(S.strokeWeight, "border width");
      fact("border_width", surface.border_width, ["surface", "border_width"]);
    }
    if (S.radius) {
      surface.radius = token(S.radius, "radius");
      fact("radius", surface.radius, ["surface", "radius"]);
    }
    const elevation = S.effects?.style ?? (S.effects ? null : "Elevation/None");
    if (S.effects && !S.effects.style) ctx.warn(`${where()}: effects are not an Elevation style`);
    if (elevation && elevation !== "Elevation/None") surface.elevation = elevation;
    fact("elevation", elevation, ["surface", "elevation"]);
    out.surface = surface;
  }

  if (S.layout) {
    const kids = S.children ?? [];
    if (kids.length === 1 && Object.values(S.layout.padding).every(isZero)) {
      // A single child with no padding: direction and gap mean nothing, only its width does.
      out.layout = { width: lower(kids[0].sizing.horizontal) };
    } else {
      out.layout = { direction: lower(S.layout.direction), padding: padding(S.layout.padding), gap: token(S.layout.gap, "gap") };
      fact("direction", out.layout.direction, ["layout", "direction"]);
      fact("padding", out.layout.padding, ["layout", "padding"]);
      fact("gap", out.layout.gap, ["layout", "gap"]);
    }
  }

  const placeholder = placeholderOf(root);
  if (placeholder) {
    const c = placeholder.constraints ?? {};
    out.size = { default: root.size, resizable: ["STRETCH", "SCALE"].includes(c.horizontal) && ["STRETCH", "SCALE"].includes(c.vertical) };
  }

  if (S.sizing?.horizontal === "HUG") out.width = "hug";
  const texts = [];
  const walk = (n) => { if (n.type === "TEXT") texts.push(n); n.children?.forEach(walk); };
  walk(S);
  out.singleLine = texts.length > 0 && texts.every((t) => t.text.autoResize === "WIDTH_AND_HEIGHT");

  out.parts = partsOf(S, { ctx, token, paint, padding, fact, where });
  return out;
}

// A placeholder shape (Image): no auto-layout, one filled shape that is the whole component.
function placeholderOf(root) {
  const only = root.children?.length === 1 ? root.children[0] : null;
  return !root.layout && only && SHAPES.has(only.type) && only.fills?.length ? only : null;
}

function partsOf(root, h) {
  const { ctx, token, paint, padding, fact, where } = h;
  const parts = [];
  const textParts = (root.children ?? []).filter((n) => n.type === "TEXT").length;
  const componentId = (n) => {
    if (!n.instanceOf) return lower(n.name);
    if (!ctx.byNode.has(n.instanceOf.id)) ctx.warn(`${where(lower(n.name))}: uses "${n.instanceOf.name}", which is not on the components pages`);
    return ctx.idOf(n.instanceOf.id, n.instanceOf.name);
  };
  // An instance keeps its layer name, or the first word of its component when not renamed ("body" for Body Text).
  const instanceName = (n, component) => (n.instanceOf && n.name === n.instanceOf.name ? component.split("-")[0] : lower(n.name));
  const push = (part) => (parts.push(part), parts.length - 1);

  const textPart = (n, optional, extra = {}) => {
    const name = lower(n.name);
    const part = { part: name };
    const role = /^role\/(.+)\/size$/.exec(n.text.fontSize?.variable ?? "")?.[1];
    if (role) part.role = role;
    else ctx.warn(`${where(name)}: text is not on a text role (font size ${JSON.stringify(n.text.fontSize)})`);
    const color = paint(n.fills, "colour", name);
    if (color !== undefined) part.color = color;
    Object.assign(part, extra);
    if (optional || n.properties?.visible) part.optional = true;
    const i = push(part);
    if (role) fact(textParts === 1 ? "role" : `${name} role`, role, ["parts", i, "role"]);
    if (color !== undefined) fact(name, color, ["parts", i, "color"]);
  };

  const shapePart = (n, optional) => {
    const name = lower(n.name);
    const part = { part: name };
    if (n.strokes?.length) {
      part.stroke = paint(n.strokes, "stroke", name);
      part.border_width = token(n.strokeWeight, "stroke width", name);
    } else if (n.fills?.length) {
      part.fill = paint(n.fills, "fill", name);
      if (n.radius) part.radius = token(n.radius, "radius", name);
    } else return;
    if (optional || n.properties?.visible) part.optional = true;
    const i = push(part);
    if (part.stroke !== undefined) fact(name, part.stroke, ["parts", i, "stroke"]);
    if (part.fill !== undefined) fact(name, part.fill, ["parts", i, "fill"]);
  };

  // Colours inside nested instances (Card's title and body) only matter when they vary.
  // Hidden layers (Card's eyebrow) don't show, so they don't count.
  const innerFacts = (inst, key) => {
    const texts = [];
    const walk = (n) => { if (n.hidden) return; if (n.type === "TEXT") texts.push(n); n.children?.forEach(walk); };
    inst.children?.forEach(walk);
    for (const t of texts) {
      const color = paint(t.fills, "colour", `${key} › ${lower(t.name)}`);
      if (color !== undefined) fact(texts.length === 1 ? key : lower(t.name), color, null);
    }
  };

  const instancePart = (n, optional) => {
    const component = componentId(n);
    const name = instanceName(n, component);
    const part = { part: name, component };
    const main = ctx.byNode.get(n.instanceOf?.id);
    const mainRoot = main && (main.node ?? (main.variants.find((v) => same(v.variant, n.instanceOf.variant)) ?? main.variants[0]).node);
    if (mainRoot && placeholderOf(mainRoot) && n.sizing?.horizontal === "FILL") part.width = "fill";
    if (mainRoot?.layout && n.layout) {
      const layout = {};
      if (n.layout.direction !== mainRoot.layout.direction) layout.direction = lower(n.layout.direction);
      if (!same(n.layout.padding, mainRoot.layout.padding)) layout.padding = padding(n.layout.padding, name);
      if (!same(n.layout.gap, mainRoot.layout.gap)) layout.gap = token(n.layout.gap, "gap", name);
      if (Object.keys(layout).length) part.layout = layout;
    }
    if (optional || n.properties?.visible) part.optional = true;
    push(part);
    innerFacts(n, name);
  };

  // Cross-axis centring is noted only where it shows: not for one child, or a row of one repeated component.
  const alignOf = (n) => {
    if (n.layout.counterAlign !== "CENTER") return undefined;
    const kids = n.children ?? [];
    if (kids.length < 2 || kids.every((k) => k.instanceOf && k.instanceOf.id === kids[0].instanceOf?.id)) return undefined;
    return n.layout.primaryAlign === "SPACE_BETWEEN" ? "space-between" : "center";
  };

  const emit = (n, optional) => {
    if (n.type === "SLOT") return; // covered by the slot prop
    optional = optional || Boolean(n.properties?.visible);
    if (n.type === "TEXT") return textPart(n, optional);
    if (n.type === "INSTANCE") return instancePart(n, optional);
    if (SHAPES.has(n.type)) return shapePart(n, optional);
    if (!CONTAINERS.has(n.type) || !n.children?.length) return;

    // A bare frame around one shape is that shape (Button's Icon around its Arrow).
    if (!n.fills?.length && !n.strokes?.length && n.children.length === 1 && SHAPES.has(n.children[0].type)) return emit(n.children[0], optional);

    // A row named after its text (Accordion's Question with its chevron): one part.
    const named = n.layout && n.children.find((c) => c.type === "TEXT" && lower(c.name) === lower(n.name));
    if (named) {
      textPart(named, optional, { layout: { direction: lower(n.layout.direction), gap: token(n.layout.gap, "gap", lower(n.name)) } });
      for (const c of n.children) if (c !== named) emit(c, optional);
      return;
    }

    const name = lower(n.name);
    const part = { part: name };
    if (n.fills?.length) part.fill = paint(n.fills, "fill", name);
    if (n.radius) part.radius = token(n.radius, "radius", name);
    if (n.layout) {
      part.layout = { direction: lower(n.layout.direction) };
      if (!Object.values(n.layout.padding).every(isZero)) part.layout.padding = padding(n.layout.padding, name);
      part.layout.gap = token(n.layout.gap, "gap", name);
      const align = alignOf(n);
      if (align) part.layout.align = align;
    }
    const contains = [];
    const hoisted = [];
    // Nested frames are listed by name; their texts and shapes become parts of their own.
    const collect = (frame) => {
      frame.children.forEach((c, i) => {
        if (c.type === "INSTANCE") {
          const ref = componentId(c) + (c.properties?.visible ? " (optional)" : "");
          if (!contains.includes(ref)) contains.push(ref);
          innerFacts(c, lower(c.name));
        } else if (CONTAINERS.has(c.type) && c.children?.length) {
          if (!contains.includes(lower(c.name))) contains.push(lower(c.name));
          collect(c);
        } else {
          const below = frame !== n && frame.layout?.direction === "VERTICAL" && i < frame.children.length - 1;
          hoisted.push([c, below ? token(frame.layout.gap, "gap", lower(c.name)) : undefined]);
        }
      });
    };
    collect(n);
    if (contains.length) part.contains = contains;
    if (optional) part.optional = true;
    push(part);
    for (const [c, gapBelow] of hoisted) {
      if (c.type === "TEXT") textPart(c, optional, gapBelow === undefined ? {} : { layout: { gap_below: gapBelow } });
      else emit(c, optional);
    }
  };

  for (const n of root.children ?? []) emit(n, false);
  return parts;
}

// ---------- merging into the existing components.json ----------

// Keys the build derives; any other key in the file is hand-written and kept.
const DERIVED = new Set([
  "name", "figma", "page", "node", "props", "layout", "surface", "size", "default", "resizable", "parts", "variants", "width", "wrap",
  "direction", "padding", "top", "right", "bottom", "left", "gap", "align", "gap_below",
  "fill", "border", "border_width", "radius", "elevation", "part", "role", "color", "stroke", "component", "contains", "optional",
]);
const KEEP = new Set(["id", "kind", "use", "note"]); // identity and hand-written text: the file wins
const HIDDEN = new Set(["default"]); // written only where the file already writes it
const ALL = () => true;

export function buildComponents(snapshot, existing = { components: [] }) {
  const report = { changes: [], added: [], removed: [], needsUse: [], warnings: [], hidden: [] };
  const derived = deriveAll(snapshot, existing, (m) => report.warnings.push(m));
  const pending = new Map(derived.map((d) => [d.entry.figma.node, d]));

  const components = [];
  for (const e of existing.components) {
    const d = pending.get(e.figma.node) ?? [...pending.values()].find((x) => x.entry.name === e.name);
    if (!d) { report.removed.push(`${e.id} (${e.name}, node ${e.figma.node})`); continue; }
    pending.delete(d.entry.figma.node);
    const m = new Merge(report, d.factKeys);
    components.push(m.object(e, d.entry, e.id, (k) => DERIVED.has(k)));
  }
  // New components go after the last one of the same kind.
  for (const { entry } of pending.values()) {
    const last = components.findLastIndex((c) => c.kind === entry.kind);
    components.splice(last + 1 || components.length, 0, entry);
    report.added.push(`${entry.id} (${entry.name}, ${entry.figma.page} page, node ${entry.figma.node})`);
  }
  const added = new Set([...pending.values()].map((d) => d.entry.id));
  for (const c of components) if (!c.use && !added.has(c.id)) report.needsUse.push(`${c.id} (${c.name})`);

  const changed = !same(components, existing.components);
  const source = {
    ...existing.source,
    file: snapshot.source.fileName,
    fileKey: snapshot.source.fileKey,
    pages: snapshot.pages,
    extracted_on: changed || !existing.source?.extracted_on ? snapshot.source.extractedAt.slice(0, 10) : existing.source.extracted_on,
  };
  source.method ??= "Variable bindings on each component (not the description text)";
  return { data: { about: existing.about ?? "", source, usage: existing.usage ?? [], components }, report };
}

class Merge {
  constructor(report, factKeys) {
    this.report = report;
    this.factKeys = factKeys;
  }

  // Keys in the file's order, then new ones. Figma's value wins for every derived key.
  object(e, g, where, derivable, inner = (ev, gv, at, k) => this.value(ev, gv, at, k)) {
    const out = {};
    for (const k of [...Object.keys(e), ...Object.keys(g).filter((k) => !(k in e))]) {
      const at = `${where} › ${k}`;
      if (KEEP.has(k) && k in e) out[k] = e[k];
      else if (!(k in g)) {
        if (derivable(k)) this.report.changes.push(`${at}: removed (was ${JSON.stringify(e[k])})`);
        else out[k] = e[k];
      } else if (!(k in e)) {
        if (HIDDEN.has(k)) this.report.hidden.push(`${at}: ${JSON.stringify(g[k])}`);
        else { out[k] = g[k]; this.report.changes.push(`${at}: added ${JSON.stringify(g[k])}`); }
      } else out[k] = inner(e[k], g[k], at, k);
    }
    return out;
  }

  value(e, g, where, key) {
    if (key === "parts" && Array.isArray(e) && Array.isArray(g)) return this.parts(e, g, where);
    if (key === "variants" && isObject(e) && isObject(g)) {
      // group › option › values. Inside an option, keys that are not variant values (Card base's `text`) are hand-written.
      return this.object(e, g, where, ALL, (eo, go, at) =>
        this.object(eo, go, at, ALL, (ev, gv, at2) => this.object(ev, gv, at2, (k) => this.factKeys.has(k))));
    }
    if (Array.isArray(e) && Array.isArray(g) && g.every((x) => typeof x === "string")) return this.list(e, g, where, key);
    if (isObject(e) && isObject(g)) return this.object(e, g, where, ["props", "default", "padding"].includes(key) ? ALL : (k) => DERIVED.has(k));
    if (!same(e, g)) this.report.changes.push(`${where}: ${JSON.stringify(e)} → ${JSON.stringify(g)}`);
    return g;
  }

  // Parts are matched by name.
  parts(e, g, where) {
    const out = [];
    for (const ep of e) {
      const gp = g.find((p) => p.part === ep.part);
      if (gp) out.push(this.object(ep, gp, `${where} › ${ep.part}`, (k) => DERIVED.has(k)));
      else this.report.changes.push(`${where} › ${ep.part}: removed`);
    }
    for (const gp of g.filter((p) => !e.some((x) => x.part === p.part))) {
      out.push(gp);
      this.report.changes.push(`${where} › ${gp.part}: added ${JSON.stringify(gp)}`);
    }
    return out;
  }

  // Same items keep the file's order. An "(optional)" mark the file leaves out of `contains` stays out.
  list(e, g, where, key) {
    if (key === "contains") {
      g = g.map((x) => {
        const plain = x.replace(/ \(optional\)$/, "");
        if (x === plain || e.includes(x) || !e.includes(plain) || g.includes(plain)) return x;
        this.report.hidden.push(`${where}: ${x}`);
        return plain;
      });
    }
    const out = [...e.filter((x) => g.includes(x)), ...g.filter((x) => !e.includes(x))];
    if (!same(e, out)) this.report.changes.push(`${where}: ${JSON.stringify(e)} → ${JSON.stringify(out)}`);
    return out;
  }
}

// ---------- command line ----------

export function formatReport(report, { verbose = false } = {}) {
  const lines = [];
  const section = (title, items) => { if (items.length) lines.push("", title, ...items.map((i) => `- ${i}`)); };
  const counts = [[report.changes, "value change(s)"], [report.added, "new component(s)"], [report.removed, "removed component(s)"]].filter(([l]) => l.length);
  lines.push(counts.length ? `components.json: ${counts.map(([l, what]) => `${l.length} ${what}`).join(", ")} from Figma.` : "components.json: up to date with Figma.");
  section("Changes:", report.changes);
  section("New components (write a `use` line for each in data/components/components.json):", report.added);
  section("Removed from Figma, dropped from components.json:", report.removed);
  section("Components that still need a `use` line:", report.needsUse);
  section("Warnings (bindings to fix in Figma):", report.warnings);
  if (verbose) section("In Figma but left out by components.json:", report.hidden);
  return lines.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const snapshot = JSON.parse(fs.readFileSync(path.join(ROOT, SNAPSHOT), "utf8"));
  const file = path.join(ROOT, OUTPUT);
  const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const { data, report } = buildComponents(snapshot, before === null ? undefined : JSON.parse(before));
  const after = JSON.stringify(data, null, 2) + "\n";
  if (after !== before) fs.writeFileSync(file, after);
  console.log(formatReport(report, { verbose: process.argv.includes("--verbose") }));
}
