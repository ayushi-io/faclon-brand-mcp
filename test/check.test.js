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
