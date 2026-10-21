import { test } from "node:test";
import assert from "node:assert/strict";
import { readData } from "../src/lib/data.js";
import { buildComponents, formatReport } from "../scripts/build-components.mjs";

const snapshot = readData("figma/components-snapshot.json");
const file = readData("components/components.json");
const find = (s, name) => s.components.find((c) => c.name === name);

test("components.json matches the Figma components export", () => {
  const { data, report } = buildComponents(snapshot, file);
  assert.deepEqual(data, file, `components.json is out of date with data/figma/components-snapshot.json. Run 'npm run build:components'.\n${formatReport(report)}`);
  assert.deepEqual(file.source.pages, snapshot.pages);
  assert.deepEqual(file.components.map((c) => c.figma.node).sort(), snapshot.components.map((c) => c.id).sort(), "one entry per Figma component");
});

test("components export: a new component is added with an empty use line, and listed", () => {
  const s = structuredClone(snapshot);
  const added = structuredClone(find(s, "Icon Card"));
  Object.assign(added, { id: "1:1", name: "Quote Card" });
  s.components.push(added);
  const { data, report } = buildComponents(s, file);
  const quote = data.components.find((c) => c.figma.node === "1:1");
  assert.equal(quote.id, "quote-card");
  assert.equal(quote.kind, "card");
  assert.equal(quote.use, "");
  assert.deepEqual(quote.surface, file.components.find((c) => c.id === "icon-card").surface);
  assert.equal(data.components.indexOf(quote), data.components.findLastIndex((c) => c.kind === "card"), "new cards go after the other cards");
  assert.match(report.added[0], /^quote-card \(Quote Card/);
  assert.match(formatReport(report), /write a `use` line/);
});

test("components export: removed components are reported, and Figma values replace the file's", () => {
  const s = structuredClone(snapshot);
  s.components = s.components.filter((c) => c.name !== "FAQ Card");
  for (const v of find(s, "Chip").variants) v.node.children[0].layout.gap = { collection: "Semantic Spacing", variable: "spacing/8" };
  const { data, report } = buildComponents(s, file);
  assert.ok(!data.components.some((c) => c.id === "faq-card"));
  assert.match(report.removed[0], /^faq-card/);
  const chip = data.components.find((c) => c.id === "chip");
  assert.equal(chip.layout.gap, "spacing/8");
  assert.equal(chip.use, file.components.find((c) => c.id === "chip").use, "hand-written use is kept");
  assert.ok(report.changes.includes('chip › layout › gap: "spacing/4" → "spacing/8"'));
});

test("components export: hard-coded colours and primitives are flagged", () => {
  const s = structuredClone(snapshot);
  const label = find(s, "Tag").variants[0].node.children[0];
  label.fills = [{ color: "#123456", opacity: 1 }];
  find(s, "Divider").node.children[0].strokes = [{ variable: { collection: "Global Colors", variable: "neutral/300" } }];
  const { report } = buildComponents(s, file);
  assert.ok(report.warnings.some((w) => /^tag › label: colour is #123456, not bound/.test(w)), report.warnings.join("\n"));
  assert.ok(report.warnings.some((w) => /^divider: border is bound to the primitive Global Colors/.test(w)), report.warnings.join("\n"));
});
