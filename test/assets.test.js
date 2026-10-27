import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readData, ROOT } from "../src/lib/data.js";
import { P } from "../src/lib/paths.js";
import { getBrandGuidelines } from "../src/tools/guidelines.js";
import { ASSET_CATEGORIES, ASSET_BASE_URL } from "../src/tools/assets.js";
import { app } from "../src/app.js";

const index = readData(P.assetIndex);
const file = (rel) => path.join(ROOT, P.assets, rel);

test("asset index: every entry is a real, valid file with the required fields", () => {
  const ids = new Set();
  for (const e of index.assets) {
    assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
    ids.add(e.id);
    assert.ok(ASSET_CATEGORIES.includes(e.category), `${e.id}: unknown category`);
    assert.ok(e.name && e.tags?.length && e.rights && e.owner && e.last_updated, `${e.id}: missing fields`);
    assert.match(e.source?.figma_node ?? "", /^\d+:\d+$/, `${e.id}: needs its Figma source node`);
    assert.ok(e.file.endsWith(`.${e.format}`) && e.file.startsWith(e.category === "icons" ? "icons/" : `${e.category}/`), `${e.id}: file path`);
    const head = fs.readFileSync(file(e.file)).subarray(0, 300);
    if (e.format === "png") assert.deepEqual([...head.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${e.id}: not a PNG`);
    else assert.ok(head.toString().includes("<svg"), `${e.id}: not an SVG`);
  }
  for (const c of ASSET_CATEGORIES) assert.equal(index.counts[c], index.assets.filter((e) => e.category === c).length, `counts.${c}`);
});

test("asset index: no file on disk is missing from the index", () => {
  const listed = new Set(index.assets.map((e) => e.file));
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
  const onDisk = walk(path.join(ROOT, P.assets)).filter((f) => /\.(png|svg)$/.test(f)).map((f) => path.relative(path.join(ROOT, P.assets), f));
  assert.deepEqual(onDisk.filter((f) => !listed.has(f)), []);
});

test("asset index: unknown facts stay 'to add', logomark is on request only", () => {
  const role = (n) => index.assets.find((e) => e.category === "team-headshots" && e.name === n).role;
  assert.equal(role("Rishi Sharma"), "CEO, Co-Founder");
  assert.equal(role("Rajveer Singh"), "");
  assert.equal(role("Sarang Vakharia"), "");
  assert.deepEqual(index.assets.filter((e) => e.category === "design-elements").map((e) => e.name).sort(), ["Dot wave", "Dot-particle form", "Light streak"]);
  assert.ok(index.assets.some((e) => e.name === "I/O Sense product mark") && !index.assets.some((e) => /product mark \d/i.test(e.name)));
  for (const e of index.assets.filter((x) => x.id.includes("logomark"))) assert.match(e.use, /explicitly asks/, e.id);
  const blue = index.assets.find((e) => e.id === "logos/faclon-labs-logo-blue");
  assert.equal(blue.background, "light background");
  assert.equal(index.assets.find((e) => e.id === "logos/faclon-labs-logo-white").background, "dark or brand background");
});

test("section assets: overview, category, query and errors", () => {
  const overview = getBrandGuidelines({ section: "assets" });
  assert.equal(overview.status, "written");
  assert.equal(overview.categories["client-logos"].count, index.counts["client-logos"]);
  assert.ok(overview.categories.icons.groups.PLC > 0);
  assert.deepEqual(overview.not_yet_supplied, ["product-screenshots", "photography"]);

  const steel = getBrandGuidelines({ section: "assets", asset_category: "client-logos", asset_query: "steel" });
  assert.ok(steel.assets.some((e) => e.name === "Tata Steel") && steel.assets.some((e) => e.name === "JSW Steel"));
  for (const e of steel.assets) assert.equal(e.url, `${ASSET_BASE_URL}/assets/${e.file}`);

  const none = getBrandGuidelines({ section: "assets", asset_query: "no such asset anywhere" });
  assert.equal(none.total, 0);
  assert.match(none.note, /not in the library/);

  assert.throws(() => getBrandGuidelines({ section: "assets", asset_category: "photos" }), { code: "INVALID_PARAM" });
  const overviewSections = getBrandGuidelines().sections;
  assert.ok(overviewSections.some((s) => s.section === "assets" && s.status === "written"));
});

test("co-branding: locked rule with token divider and a real reference lockup", () => {
  const rule = getBrandGuidelines({ section: "rules" }).rules.find((r) => r.id === "logo.co-branding");
  assert.ok(rule && rule.locked && rule.severity === "error");
  assert.deepEqual(rule.check.order, ["faclon-labs-logo", "divider", "partner-logo"]);
  assert.equal(rule.check.divider.colour, "border/strong");
  const ref = index.assets.find((e) => e.id === rule.check.reference);
  assert.ok(ref && fs.existsSync(file(ref.file)));
  assert.ok(index.assets.some((e) => e.id === "partner-logos/hpe"));
});

test("architecture rules point to the icon library, no longer 'until provided'", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "architecture" }).format_profile;
  assert.match(p.icons.source, /section: "assets", asset_category: "icons"/);
  assert.ok(!JSON.stringify(p).includes("until it is provided"));
});

test("HTTP: /assets serves listed files and nothing outside the asset folder", async () => {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const svg = await fetch(`${base}/assets/logos/faclon-labs-logo-blue.svg`);
    assert.equal(svg.status, 200);
    assert.match(svg.headers.get("content-type"), /image\/svg\+xml/);
    const png = await fetch(`${base}/assets/${index.assets.find((e) => e.format === "png").file}`);
    assert.equal(png.status, 200);
    assert.match(png.headers.get("content-type"), /image\/png/);
    assert.equal((await fetch(`${base}/assets/logos/nope.svg`)).status, 404);
    assert.notEqual((await fetch(`${base}/assets/..%2f..%2fpackage.json`)).status, 200);
  } finally {
    server.close();
  }
});
