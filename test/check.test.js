import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDesign } from "../src/tools/check.js";

const good = `<style>h1{font-family:"TASA Orbiter",Inter;font-size:40px;font-weight:700;color:var(--color-text-heading);border-radius:var(--radius-default)}
p{font-family:Inter;font-size:18px;color:#243547;border:1px solid var(--color-border-container);box-shadow:var(--shadow-low-raised)}</style>
<img alt="Faclon Labs" src="faclon.png"><h1>Title</h1><p>Body</p>`;

const rules = (r) => r.findings.map((f) => `${f.rule}:${f.severity}`);

test("check_design passes HTML built from tokens and styles", () => {
  const r = checkDesign({ html: good, format_profile: "document" });
  assert.equal(r.verdict, "pass", JSON.stringify(r.findings));
  assert.deepEqual(r.summary, { errors: 0, warnings: 0 });
});

test("check_design flags off-system values with the rule and a fix", () => {
  const bad = `<style>.h{font-family:Arial;font-size:9px;font-weight:300;color:#123456;border-radius:7px;border:7px solid var(--color-border-strong);box-shadow:0 0 20px #000;background:linear-gradient(#f00,#00f)}
p{text-shadow:0 0 4px #fff;backdrop-filter:blur(8px);color:var(--color-made-up)}</style><h1 class="h">Faclon Labs</h1><img src="x.png">`;
  const r = checkDesign({ html: bad, format_profile: "document" });
  assert.equal(r.verdict, "fail");
  for (const id of ["color.tokens-only:error", "type.two-families-only:error", "type.min-size:error", "type.weight-range:error", "radius.scale-only:error", "border.width-scale-only:error", "design.no-ai-slop:error", "images.alt-text:error"]) {
    assert.ok(rules(r).includes(id), `${id} not reported: ${rules(r)}`);
  }
  for (const f of r.findings) assert.ok(f.fix && f.evidence.length, f.rule);
  assert.ok(r.findings.find((f) => f.rule === "color.tokens-only" && f.evidence.includes("--color-made-up")), "unknown CSS variable");
});

test("check_design applies the format's own limits", () => {
  const big = `<style>h1{font-family:Inter;font-size:96px}</style><p>Faclon Labs</p>`;
  assert.ok(rules(checkDesign({ html: big, format_profile: "deck" })).includes("type.min-size:error"), "deck max 72px");
  const small = `<style>p{font-family:Inter;font-size:12px}</style><p>Faclon Labs</p>`;
  assert.ok(rules(checkDesign({ html: small, format_profile: "deck" })).includes("type.min-size:error"), "deck min 14px");
  assert.equal(checkDesign({ html: small, format_profile: "newsletter" }).findings.filter((f) => f.rule === "type.min-size").length, 0, "newsletter min 12px");
});

test("check_design checks Brevo rules for newsletters", () => {
  const nl = `<p style="font-family:Inter;font-size:16px">Faclon Labs 🔥 {{ firstname }}</p><a href=“{{ mirror }}”>View</a>`;
  const r = rules(checkDesign({ html: nl, format_profile: "newsletter" }));
  for (const id of ["newsletter.unsubscribe:error", "newsletter.invent-urls:error", "newsletter.straight-quotes:error", "newsletter.no-emoji:error"]) assert.ok(r.includes(id), id);
  const ok = rules(checkDesign({ html: `<p style="font-family:Inter;font-size:16px">Faclon Labs {{ contact.FIRSTNAME }}</p><a href="{{ unsubscribe }}">Unsubscribe</a>`, format_profile: "newsletter" }));
  assert.deepEqual(ok, []);
});

test("check_design allows only the gradient tokens, and Bruce AI's only on Bruce AI content", () => {
  const bruce = `<style>h1{font-family:Inter;font-size:40px;background:linear-gradient(90deg, #2436FB 0%, #F377F7 100%)}</style><h1>Faclon Labs</h1>`;
  assert.ok(rules(checkDesign({ html: bruce })).includes("design.no-ai-slop:warning"));
  assert.deepEqual(rules(checkDesign({ html: bruce.replace("Faclon Labs", "Faclon Labs Bruce AI") })), []);
});

test("voice issues in the user's words are warnings, never errors", () => {
  const r = checkDesign({ html: `<p style="font-family:Inter;font-size:16px">Faclon Labs — fast!</p>` });
  assert.equal(r.verdict, "pass");
  assert.deepEqual(rules(r).sort(), ["voice.dashes:warning", "voice.exclamation:warning"]);
});

test("check_design allows glow only on Bruce AI content, and glass never", () => {
  const glow = (text) => `<style>h1{font-family:Inter;font-size:40px;text-shadow:0 0 24px #B4FF6B} .chip{box-shadow:0 0 40px #1655F2;filter:drop-shadow(0 0 12px #1655F2)}</style><h1>${text}</h1><div class="chip"></div>`;
  assert.ok(rules(checkDesign({ html: glow("Faclon Labs") })).includes("design.no-ai-slop:error"));
  assert.deepEqual(rules(checkDesign({ html: glow("Expertise should scale with Bruce AI, Faclon Labs") })), []);
  const glass = `<style>.card{backdrop-filter:blur(12px)}</style><h1 style="font-family:Inter;font-size:40px">Bruce AI by Faclon Labs</h1><div class="card"></div>`;
  assert.ok(rules(checkDesign({ html: glass })).includes("design.no-ai-slop:error"));
});

test("check_design for architecture: the outcome stays a quarter of the width and text keeps one size", () => {
  const html = (w, sizes) => `<style>body{font-family:Inter}${sizes.map((z, i) => `.t${i}{font-size:${z}px}`).join("")}</style><img src="https://faclon-brand-mcp.vercel.app/assets/architecture-outcomes/faclon-scope.png" width="${w}" alt="I/O Sense outcome, Faclon Labs">`;
  const ok = rules(checkDesign({ html: html(386, [32, 20, 16, 14]), format_profile: "architecture" }));
  assert.ok(!ok.includes("architecture.outcome-balance:error") && !ok.includes("architecture.one-text-size:error"), ok.join());
  const bad = rules(checkDesign({ html: html(560, [32, 20, 18, 16, 14, 12]), format_profile: "architecture" }));
  assert.ok(bad.includes("architecture.outcome-balance:error") && bad.includes("architecture.one-text-size:error"), bad.join());
  assert.ok(!rules(checkDesign({ html: html(560, [32, 20, 18, 16, 14, 12]), format_profile: "deck" })).includes("architecture.one-text-size:error"));
});

test("check_design for architecture: brand blue only in the placed outcome, light blues elsewhere", () => {
  const base = (css) => `<style>body{font-family:Inter} .tag{font-size:14px;${css}}</style><div class="tag">Hart Gateway</div><img src="https://faclon-brand-mcp.vercel.app/assets/architecture-outcomes/faclon-scope.png" alt="I/O Sense outcome, Faclon Labs">`;
  const ok = checkDesign({ html: base("background:#DCE8FE;color:#0C1927;border-color:#8AB1FB"), format_profile: "architecture" });
  assert.ok(!rules(ok).includes("architecture.brand-on-outcome:error"), JSON.stringify(ok.findings));
  for (const bad of ["background:#1655F2;color:#FFFFFF", "background:var(--color-container-brand)", "color:var(--color-text-brand)", "border-color:#0E3FAA"]) {
    assert.ok(rules(checkDesign({ html: base(bad), format_profile: "architecture" })).includes("architecture.brand-on-outcome:error"), bad);
  }
  // Other formats may use brand blue freely.
  assert.ok(!rules(checkDesign({ html: base("background:#1655F2;color:#FFFFFF"), format_profile: "deck" })).includes("architecture.brand-on-outcome:error"));
});

test("check_design wants the logo file, not a placeholder, where the format places one", () => {
  const post = (logo) => `<style>h1{font-family:"TASA Orbiter";font-size:40px}</style>${logo}<h1>Results</h1>`;
  const placeholder = post(`<div>Faclon Labs logo (white)</div>`);
  assert.ok(rules(checkDesign({ html: placeholder, format_profile: "social" })).includes("logo.default-position:error"));
  assert.ok(rules(checkDesign({ html: placeholder, format_profile: "deck" })).includes("logo.default-position:warning"));
  const real = post(`<img alt="Faclon Labs" src="https://example.com/assets/logos/faclon-labs-logo-white.svg">`);
  assert.equal(checkDesign({ html: real, format_profile: "social" }).findings.filter((f) => f.rule === "logo.default-position").length, 0);
});

test("check_design checks icons: a token square that follows the card passes", () => {
  const icon = (size) => `<svg class="lucide" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 20h20"/></svg>`;
  const html = `<style>.card{container-type:inline-size}
.sq{width:40px;height:40px;padding:8px;background:var(--color-container-secondary);color:var(--color-text-brand);border-radius:var(--radius-xl)}
.sq svg{width:24px;height:24px}
@container (min-width:360px){.sq{width:48px;height:48px}.sq svg{width:32px;height:32px}}
h3{font-family:Inter;font-size:18px}</style>
<img alt="Faclon Labs" src="faclon-labs-logo-blue.svg"><div class="card"><div class="sq">${icon(24)}</div><h3>Energy</h3></div>
<p style="color:var(--color-text-brand)">${icon(24)} Beside text</p>`;
  const r = checkDesign({ html, format_profile: "social" });
  assert.deepEqual(r.findings.filter((f) => f.rule.startsWith("icon.")), []);
  assert.match(r.checked, /2 icons/);
});

test("check_design flags icons off the iconography rules", () => {
  const svg = (attrs = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ${attrs}><path d="M2 20h20"/></svg>`;
  const found = (html, format = "social") => checkDesign({ html: `<img alt="Faclon Labs" src="faclon-labs-logo-blue.svg">${html}`, format_profile: format }).findings.filter((f) => f.rule === "icon.style").map((f) => f.message);
  const has = (html, re, format) => assert.ok(found(html, format).some((m) => re.test(m)), `${re} not found in ${JSON.stringify(found(html, format))}`);
  has(svg('width="24" height="24" stroke-width="1.5"').replace('stroke-width="2" ', ""), /stroke/i);
  has(svg('width="24" height="24"').replace('fill="none"', 'fill="currentColor"'), /Filled/);
  has(svg('width="30" height="30"'), /not icon sizes for Social/);
  has(`<div style="width:40px;height:40px;background:var(--color-container-secondary);border-radius:50%">${svg('width="24" height="24"')}</div>`, /circle/);
  has(`<div style="width:40px;height:40px;border:1px solid var(--color-border-primary);border-radius:8px">${svg('width="24" height="24"')}</div>`, /border/);
  has(`<div style="width:44px;height:44px;background:var(--color-container-secondary);border-radius:8px">${svg('width="24" height="24"')}</div>`, /not square sizes/);
  has(`<div style="width:40px;height:40px;background:var(--color-container-secondary);border-radius:12px">${svg('width="24" height="24"')}</div>`, /corners/);
  // Dark container/tertiary with text/brand is 3.5:1.
  has(`<div data-theme="dark"><div style="width:40px;height:40px;background:var(--color-container-tertiary);color:var(--color-text-brand);border-radius:8px">${svg('width="24" height="24"')}</div></div>`, /contrast/);
  // Sizes follow the format: 32px beside text is a deck size, not a document size.
  assert.equal(found(svg('width="32" height="32"'), "deck").length, 0);
  has(svg('width="32" height="32"'), /not icon sizes for Document/, "document");
});

test("check_design: Lucide icons in an architecture diagram are not from the icon library", () => {
  const html = `<img alt="Faclon Labs" src="faclon-labs-logo-blue.svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M2 20h20"/></svg>`;
  assert.ok(rules(checkDesign({ html, format_profile: "architecture" })).includes("icon.lucide-only:error"));
});
