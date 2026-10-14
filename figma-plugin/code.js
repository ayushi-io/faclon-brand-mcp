// Faclon Brand Sync — Figma side.
// 1. Saves a named version in the file's version history.
// 2. Exports variables, text styles and effect styles in the format of
//    data/figma/snapshot.json (the input of scripts/build-tokens.mjs).
// The UI (ui.html) then opens the pull request on GitHub.

figma.showUI(__html__, { width: 380, height: 520, themeColors: true });

// ---------- snapshot export (keep in sync with data/figma/snapshot.json) ----------
const hex2 = (n) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase();
const hexOf = (c) => "#" + hex2(c.r) + hex2(c.g) + hex2(c.b);

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
      figma.ui.postMessage({ type: "snapshot", snapshot, versionId: version.id });
    }
    if (msg.type === "open-url") figma.openExternal(msg.url);
    if (msg.type === "close") figma.closePlugin();
  } catch (err) {
    figma.ui.postMessage({ type: "error", message: String((err && err.message) || err) });
  }
};
