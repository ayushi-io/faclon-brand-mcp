import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readData, ROOT } from "../src/lib/data.js";
import { P } from "../src/lib/paths.js";
import { getBrandGuidelines } from "../src/tools/guidelines.js";
import { ASSET_CATEGORIES, ASSET_BASE_URL } from "../src/tools/assets.js";
import { app } from "../src/app.js";
import { getTemplates } from "../src/tools/templates.js";

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

test("templates: deck, architecture and social, each with real thumbnails and layout notes", async () => {
  const overview = getTemplates();
  assert.deepEqual(overview.outcomes.map((o) => o.format_profile).sort(), ["architecture", "deck", "social"]);
  const counts = Object.fromEntries(overview.outcomes.map((o) => [o.format_profile, o.count]));
  assert.deepEqual(counts, { deck: 21, architecture: 6, social: 8 });
  for (const { format_profile, outcome } of overview.outcomes) {
    const t = getTemplates({ format_profile });
    assert.match(t.use, /Never copy their text, numbers/);
    for (const s of t.sections) for (const x of s.templates) {
      assert.ok(x.layout.length > 40 && ["dark", "light", "brand"].includes(x.theme), x.id);
      assert.match(x.figma_node, /^\d+:\d+$/);
      assert.ok(fs.existsSync(path.join(ROOT, P.templates, outcome, x.thumbnail)), x.thumbnail);
      assert.equal(x.thumbnail_url, `${ASSET_BASE_URL}/templates/${outcome}/${x.thumbnail}`);
    }
  }
  assert.throws(() => getTemplates({ format_profile: "document" }), { code: "NO_TEMPLATES" });
  assert.equal(getBrandGuidelines({ section: "templates", format_profile: "architecture" }).sections[0].templates.at(-1).name, "Camera-based vision system");
  const server = app.listen(0);
  try {
    const x = getTemplates({ format_profile: "deck" }).sections[0].templates[0];
    const r = await fetch(`http://127.0.0.1:${server.address().port}/templates/decks/${x.thumbnail}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /image\/png/);
  } finally { server.close(); }
});

test("export and qa sections: HTML specs, naming topic_outcometype_faclon_date, delivery in chat", async () => {
  const ex = getBrandGuidelines({ section: "export" });
  assert.equal(ex.status, "written");
  assert.match(ex.guidance, /<topic>_<outcometype>_faclon_<date>\.html/);
  assert.match(ex.guidance, /delivered in the chat only/);
  assert.match(ex.guidance, /fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600;700&family=TASA\+Orbiter/);
  for (const [format, size] of [["deck", "1920 x 1080"], ["document", "794 x 1123"], ["social", "540 x 540"]]) assert.ok(ex.guidance.includes(size), format);
  const qa = getBrandGuidelines({ section: "qa" });
  assert.match(qa.guidance, /check_design/);
  assert.match(qa.guidance, /Checklist before delivery/);
  const { INSTRUCTIONS } = await import("../src/server.js");
  assert.match(INSTRUCTIONS, /in the chat only, named <topic>_<outcometype>_faclon_<YYYY-MM-DD>\.html/);
  for (const f of ["decks", "a4-documents", "newsletters", "architectures", "social-media"]) {
    assert.match(fs.readFileSync(path.join(ROOT, "ds/07-skills", f, "SKILL.md"), "utf8"), /_faclon_<YYYY-MM-DD>\.html` \(see section "export"\), in the chat only/, f);
  }
});

test("architecture: ends in an I/O Sense outcome placed unchanged; brand blue only there", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "architecture" }).format_profile;
  assert.equal(p.final_outcome.default, "architecture-outcomes/faclon-scope");
  for (const id of p.final_outcome.options) assert.ok(index.assets.find((e) => e.id === id && e.category === "architecture-outcomes"), id);
  assert.equal(p.shapes.platform_panel, undefined);
  assert.equal(p.shapes.node_tag.fill, "container/info");
  assert.equal(p.arrows.data_flow.colour, "brand/400");
  assert.equal(p.typography.styles.title.colour, "text/heading");
  assert.ok(p.guardrails.must_not.some((i) => i.id === "brand-blue-outside-outcome"));
  assert.ok(p.guardrails.design_direction.some((i) => i.id === "final-outcome"));
  assert.match(p.skill, /end the diagram in one I\/O Sense outcome/);
});

test("architecture: three Figma outcomes and four icon + content device styles", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "architecture" }).format_profile;
  assert.deepEqual(index.assets.filter((e) => e.category === "architecture-outcomes").map((e) => e.id).sort(), [...p.final_outcome.options].sort());
  assert.match(p.final_outcome.choose, /steam trap only for steam-trap diagrams/);
  assert.deepEqual(Object.keys(p.node_styles.styles), ["boxed_tag", "tag", "label", "caption"]);
  const roles = p.typography.styles;
  for (const [id, s] of Object.entries(p.node_styles.styles)) {
    for (const ref of [s.box, s.tag, s.text].filter(Boolean)) {
      const [root, ...rest] = ref.split(".");
      const target = root === "shapes" ? p.shapes[rest[0]] : roles[rest.at(-1)];
      assert.ok(target, `${id}: ${ref} does not resolve`);
    }
  }
  assert.equal(roles.device_label.colour, "text/secondary");
  assert.ok(roles.device_caption.dense.style === "body/xs", "caption stays at body/xs (12px) or larger");
  const t = getTemplates({ format_profile: "architecture" }).sections.find((s) => s.name === "Icon + content design");
  assert.equal(t.templates[0].figma_node, "3271:31036");
  assert.match(t.use, /light blue/);
  assert.match(p.skill, /four icon \+ content styles/);
});

test("architecture: balanced outcome and one diagram text size", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "architecture" }).format_profile;
  for (const id of p.final_outcome.options) {
    const n = p.final_outcome.native[id], e = index.assets.find((x) => x.id === id);
    assert.ok(n && Math.abs(e.width / 2 - n.width) <= 1 && Math.abs(e.height / 2 - n.height) <= 1, `${id}: native size matches the @2x file`);
  }
  assert.match(p.final_outcome.size.max_width, /456px/);
  const s = p.typography.styles;
  for (const d of ["dense", "medium", "open"]) {
    const sizes = new Set(["node_tag", "device_label", "device_caption", "arrow_label"].map((k) => s[k][d].style));
    assert.equal(sizes.size, 1, `${d}: device text uses one style`);
  }
  // At Medium (14px) Faclon scope scales to 386px wide: inside the quarter-width cap.
  assert.ok((14 / p.final_outcome.native["architecture-outcomes/faclon-scope"].body_text) * 276 <= 456);
  assert.ok(p.guardrails.must_not.some((i) => i.id === "outcome-dominates"));
});

test("architecture: zone colours only on request, legend always asked", () => {
  const p = getBrandGuidelines({ section: "rules", format_profile: "architecture" }).format_profile;
  assert.ok(p.guardrails.user_decides.some((x) => /colour-coding.*only when the user asks/.test(x)));
  assert.ok(p.guardrails.user_decides.some((x) => /legend: always ask/.test(x)));
  assert.ok(!(p.guardrails.to_define ?? []).some((x) => /legend|Zone colour/.test(x)));
  for (const id of ["zone-colours", "legend-unasked"]) assert.ok(p.guardrails.must_not.some((i) => i.id === id), id);
  assert.match(p.skill, /\*\*Always ask:\*\* whether they want a legend/);
});
