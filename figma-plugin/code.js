// Faclon Brand Sync — Figma side.
// 1. Saves a named version in the file's version history.
// 2. Exports variables, text styles and effect styles in the format of
//    sources/figma/snapshot.json (the input of scripts/build-tokens.mjs).
// 3. Exports the components on the components and Badges pages to
//    sources/figma/components-snapshot.json (the input of scripts/build-components.mjs).
// The UI (ui.html) then opens the pull request on GitHub.

figma.showUI(__html__, { width: 380, height: 520, themeColors: true });

// ---------- snapshot export (keep in sync with sources/figma/snapshot.json) ----------
const hex2 = (n) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase();
const hexOf = (c) => "#" + hex2(c.r) + hex2(c.g) + hex2(c.b);
const round4 = (n) => Math.round(n * 10000) / 10000;
// Figma's gradientTransform maps the node (0..1) into gradient space, where the gradient
// runs along x. Invert it, take the direction from (0, 0.5) to (1, 0.5) and turn it into
// a CSS angle (0deg = to top, 90deg = to right).
function gradientAngle(t) {
  const [[a, b, c], [d, e, f]] = t;
  const det = a * e - b * d;
  const inv = (gx, gy) => ({ x: (e * (gx - c) - b * (gy - f)) / det, y: (-d * (gx - c) + a * (gy - f)) / det });
  const p0 = inv(0, 0.5), p1 = inv(1, 0.5);
  return Math.round(((Math.atan2(p1.x - p0.x, -(p1.y - p0.y)) * 180) / Math.PI + 360) % 360);
}

async function buildSnapshot() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const byId = {};
  for (const c of collections) byId[c.id] = c;

  const outCollections = [];
  for (const c of collections) {
    const variables = [];
    for (const id of c.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      const values = {};
      for (const m of c.modes) {
        const raw = v.valuesByMode[m.modeId];
        if (raw && raw.type === "VARIABLE_ALIAS") {
          const a = await figma.variables.getVariableByIdAsync(raw.id);
          values[m.name] = { alias: a.name, collection: byId[a.variableCollectionId].name };
        } else {
          values[m.name] = v.resolvedType === "COLOR" ? hexOf(raw) : raw;
        }
      }
      variables.push({ name: v.name, type: v.resolvedType, values, description: v.description || "" });
    }
    outCollections.push({ name: c.name, modes: c.modes.map((m) => m.name), variables });
  }

  const textStyles = (await figma.getLocalTextStylesAsync()).map((s) => ({
    name: s.name,
    description: s.description || "",
    fontFamily: s.fontName.family,
    fontStyle: s.fontName.style,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight.unit === "AUTO" ? { unit: "AUTO" } : { unit: s.lineHeight.unit, value: s.lineHeight.value },
    letterSpacing: { unit: s.letterSpacing.unit, value: s.letterSpacing.value },
    textCase: s.textCase,
  }));

  const effectStyles = (await figma.getLocalEffectStylesAsync()).map((s) => ({
    name: s.name,
    description: s.description || "",
    effects: s.effects.map((e) => ({
      type: e.type,
      x: e.offset ? e.offset.x : 0,
      y: e.offset ? e.offset.y : 0,
      blur: e.radius,
      spread: e.spread || 0,
      color: e.color ? hexOf(e.color) + hex2(e.color.a) : null,
      opacity: e.color ? Math.round(e.color.a * 100) / 100 : null,
    })),
  }));

  // Gradient paint styles (gradient/*). The angle is the CSS linear-gradient angle,
  // read from the gradient transform on a square node.
  const paintStyles = (await figma.getLocalPaintStylesAsync()).map((s) => ({
    name: s.name,
    description: s.description || "",
    paints: s.paints.filter((p) => p.visible !== false).map((p) => {
      if (!p.type.startsWith("GRADIENT")) return { type: p.type, color: p.color ? hexOf(p.color) : null, opacity: round4(p.opacity ?? 1) };
      return {
        type: p.type,
        angle: gradientAngle(p.gradientTransform),
        stops: p.gradientStops.map((g) => ({ position: round4(g.position), color: hexOf(g.color), opacity: round4(g.color.a) })),
      };
    }),
  }));

  return {
    source: {
      fileName: figma.root.name,
      fileKey: figma.fileKey,
      extractedAt: new Date().toISOString(),
      method: "Faclon Brand Sync plugin",
    },
    collections: outCollections,
    textStyles,
    effectStyles,
    paintStyles,
  };
}

// ---------- components export (keep in sync with sources/figma/components-snapshot.json) ----------
// Every component and component set on these pages, per variant: property
// definitions, auto-layout, sizing and every variable binding, down through
// nested instances. Descriptions are not exported: the bindings are the spec.
const COMPONENT_PAGES = ["components", "Badges"];
const propName = (key) => key.replace(/#[^#]*$/, "");
const round2 = (n) => Math.round(n * 100) / 100;

async function buildComponentsSnapshot() {
  const vars = {};
  const varRef = async (alias) => {
    if (!(alias.id in vars)) {
      const v = await figma.variables.getVariableByIdAsync(alias.id);
      const c = v && (await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId));
      vars[alias.id] = v ? { collection: c.name, variable: v.name } : { missing: alias.id };
    }
    return vars[alias.id];
  };
  const styleName = async (id) => (typeof id === "string" && id ? ((await figma.getStyleByIdAsync(id)) || {}).name || null : null);
  // A bound variable, or the raw value when nothing is bound. figma.mixed (a symbol,
  // which postMessage cannot send) is exported as "mixed" so the build can name the layer.
  const plain = (v) => (typeof v === "symbol" ? "mixed" : v);
  const value = async (n, ...fields) => {
    for (const f of fields) if (n.boundVariables && n.boundVariables[f]) return varRef(n.boundVariables[f]);
    return plain(n[fields[0]]);
  };
  const paints = async (list) => {
    const out = [];
    for (const p of list) {
      if (p.visible === false) continue;
      if (p.boundVariables && p.boundVariables.color) out.push({ variable: await varRef(p.boundVariables.color) });
      else if (p.type === "SOLID") out.push({ color: hexOf(p.color), opacity: round2(p.opacity ?? 1) });
      else out.push({ type: p.type });
    }
    return out;
  };

  async function node(n, parent) {
    const o = { name: n.name, type: n.type };
    if (n.visible === false) o.hidden = true;
    const refs = n.componentPropertyReferences;
    if (refs && Object.keys(refs).length) o.properties = Object.fromEntries(Object.entries(refs).map(([k, v]) => [k, propName(v)]));
    if (!parent || parent.type === "COMPONENT_SET") o.size = [round2(n.width), round2(n.height)];
    if ("layoutSizingHorizontal" in n) o.sizing = { horizontal: n.layoutSizingHorizontal, vertical: n.layoutSizingVertical };
    if (parent && parent.type !== "COMPONENT_SET" && "layoutMode" in parent && parent.layoutMode === "NONE" && "constraints" in n) o.constraints = n.constraints;
    if ("layoutMode" in n && n.layoutMode !== "NONE") {
      o.layout = {
        direction: n.layoutMode,
        padding: {
          top: await value(n, "paddingTop"),
          right: await value(n, "paddingRight"),
          bottom: await value(n, "paddingBottom"),
          left: await value(n, "paddingLeft"),
        },
        gap: await value(n, "itemSpacing"),
        primaryAlign: n.primaryAxisAlignItems,
        counterAlign: n.counterAxisAlignItems,
      };
      if (n.layoutWrap === "WRAP") o.layout.wrap = true;
    }
    if ("fills" in n && Array.isArray(n.fills) && n.fills.length) o.fills = await paints(n.fills);
    if ("strokes" in n && n.strokes.length) {
      o.strokes = await paints(n.strokes);
      o.strokeWeight = await value(n, "strokeWeight", "strokeTopWeight");
    }
    if ("topLeftRadius" in n && n.type !== "TEXT") {
      const radius = await value(n, "topLeftRadius");
      if (typeof radius === "object" || radius) o.radius = radius;
    }
    if ("effects" in n && n.effects.length) {
      const style = await styleName(n.effectStyleId);
      o.effects = style ? { style } : n.effects.map((e) => ({ type: e.type }));
    }
    if (n.type === "TEXT") {
      const size = n.boundVariables && n.boundVariables.fontSize;
      o.text = {
        style: await styleName(n.textStyleId),
        fontSize: size ? await varRef(Array.isArray(size) ? size[0] : size) : plain(n.fontSize),
        autoResize: plain(n.textAutoResize),
      };
    }
    if (n.type === "INSTANCE") {
      const main = await n.getMainComponentAsync();
      const set = main && main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : null;
      o.instanceOf = main ? { id: (set || main).id, name: (set || main).name } : null;
      if (set) o.instanceOf.variant = main.variantProperties;
    }
    if ("children" in n) {
      o.children = [];
      for (const child of n.children) o.children.push(await node(child, n));
    }
    return o;
  }

  const properties = (defs) =>
    Object.fromEntries(
      Object.entries(defs).map(([key, d]) => {
        if (d.type === "VARIANT") return [propName(key), { type: d.type, options: d.variantOptions, default: d.defaultValue }];
        if (d.type === "BOOLEAN") return [propName(key), { type: d.type, default: d.defaultValue }];
        return [propName(key), { type: d.type }]; // text defaults are sample copy, not spec
      })
    );

  const components = [];
  for (const pageName of COMPONENT_PAGES) {
    const page = figma.root.children.find((p) => p.name === pageName);
    if (!page) throw new Error(`Page "${pageName}" not found: the components export reads ${COMPONENT_PAGES.join(" and ")}.`);
    await page.loadAsync();
    const found = page.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] }).filter((c) => c.type === "COMPONENT_SET" || c.parent.type !== "COMPONENT_SET");
    for (const c of found) {
      const entry = { page: pageName, id: c.id, name: c.name, type: c.type, properties: properties(c.componentPropertyDefinitions) };
      if (c.type === "COMPONENT_SET") {
        entry.variants = [];
        for (const v of c.children) entry.variants.push({ id: v.id, variant: v.variantProperties, node: await node(v, c) });
      } else {
        entry.node = await node(c, null);
      }
      components.push(entry);
    }
  }

  return {
    source: {
      fileName: figma.root.name,
      fileKey: figma.fileKey,
      extractedAt: new Date().toISOString(),
      method: "Faclon Brand Sync plugin",
    },
    pages: COMPONENT_PAGES,
    components,
  };
}

// ---------- messages from the UI ----------
const SETTINGS_KEY = "faclon-brand-sync/settings";

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "load-settings") {
      const saved = (await figma.clientStorage.getAsync(SETTINGS_KEY)) || {};
      figma.ui.postMessage({ type: "settings", settings: saved, fileName: figma.root.name });
    }
    if (msg.type === "save-settings") {
      await figma.clientStorage.setAsync(SETTINGS_KEY, msg.settings);
      figma.ui.postMessage({ type: "settings-saved" });
    }
    if (msg.type === "export") {
      // Save the version first, so the PR always points at a version that exists in Figma.
      const version = await figma.saveVersionHistoryAsync(msg.title, msg.description || "");
      const snapshot = await buildSnapshot();
      snapshot.source.figmaVersion = { id: version.id, title: msg.title };
      const components = await buildComponentsSnapshot();
      components.source.figmaVersion = { id: version.id, title: msg.title };
      figma.ui.postMessage({ type: "snapshot", snapshot, components, versionId: version.id });
    }
    if (msg.type === "open-url") figma.openExternal(msg.url);
    if (msg.type === "close") figma.closePlugin();
  } catch (err) {
    figma.ui.postMessage({ type: "error", message: String((err && err.message) || err) });
  }
};
