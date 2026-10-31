import { readData, dataExists, listDirs, readDoc } from "../lib/data.js";
import { P, SECTION_FILES, SECTION_GROUPS, profileParts, GUARDRAIL_ORDER } from "../lib/paths.js";
import { BrandError } from "../lib/envelope.js";
import { getAssets, ASSET_BASE_URL } from "./assets.js";
import { getTemplates, withReferenceHtml } from "./templates.js";

export const SECTIONS = ["overview", "principles", "rules", "defaults", "components", "logo", "typography", "color", "voice", "design-elements", "illustration", "iconography", "data-viz", "architecture", "imagery", "assets", "templates", "examples", "export", "qa"];

// Outcomes in 07-skills that have rules, keyed by format id (deck, document…).
function outcomes() {
  const out = {};
  for (const dir of listDirs(P.skills)) {
    const file = `${P.skills}/${dir}/rules.json`;
    if (dataExists(file)) out[readData(file).id] = dir;
  }
  return out;
}

export const formatProfiles = () => Object.keys(outcomes()).sort();

const isGap = (section) => Boolean(SECTION_FILES[section]) && readDoc(SECTION_FILES[section]).meta.status === "not_written";

export function getBrandGuidelines({ section = "overview", format_profile, asset_category, asset_query } = {}) {
  if (!SECTIONS.includes(section)) {
    throw new BrandError("INVALID_PARAM", `Unknown section "${section}".`, `Use one of: ${SECTIONS.join(", ")}.`);
  }
  const profile = format_profile ? loadProfile(format_profile) : null;
  const profileInfo = profile ? summarizeProfile(profile) : undefined;

  if (section === "rules") {
    const { rules, applied, rejected } = mergeRules(profile);
    return {
      section,
      format_profile: profileInfo,
      rules,
      defaults: readData(P.defaults).defaults,
      overrides_applied: profile ? applied : undefined,
      overrides_rejected: profile && rejected.length ? rejected : undefined,
      open_questions: readData(P.openQuestions).items,
      figma_updates_needed: readData(P.openQuestions).figma_updates_needed,
    };
  }

  if (section === "defaults") {
    return { section, status: "written", about: readData(P.defaults).about, defaults: readData(P.defaults).defaults, format_profile: profileInfo };
  }

  if (SECTION_GROUPS[section]) {
    const docs = SECTION_GROUPS[section].map((f) => readDoc(f));
    if (docs.some((d) => d.meta.status === "not_written")) throw new BrandError("NOT_WRITTEN", `Part of section "${section}" is not written.`, "Report the gap to the user.");
    return { section, status: "written", guidance: docs.map((d) => d.body.trim()).join("\n\n---\n\n"), format_profile: profileInfo };
  }

  if (section === "templates") return { section, status: "written", ...getTemplates({ format_profile }), format_profile: profileInfo };

  if (section === "assets") return { section, status: "written", ...getAssets({ asset_category, asset_query }), format_profile: profileInfo };

  if (section === "components") return { section, status: "written", ...components(profile), format_profile: profileInfo };

  const doc = readDoc(SECTION_FILES[section]);
  if (doc.meta.status === "not_written") {
    return {
      section,
      status: "not_written",
      message: `The brand file has no ${section} guidance yet. Do not invent it; tell the user it is missing.`,
      needed: doc.meta.needed,
      format_profile: profileInfo,
    };
  }

  // Markdown may point at served files (example images, template thumbnails, data-viz references) through URL placeholders.
  const guidance = doc.body
    .replaceAll("%EXAMPLES_URL%", `${ASSET_BASE_URL}/examples`)
    .replaceAll("%TEMPLATES_URL%", `${ASSET_BASE_URL}/templates`)
    .replaceAll("%DATAVIZ_URL%", `${ASSET_BASE_URL}/data-viz`);
  const result = { section, status: "written", guidance, format_profile: profileInfo };
  if (section === "overview") {
    result.sections = SECTIONS.map((s) => ({ section: s, status: isGap(s) ? "not_written" : "written" }));
    result.format_profiles = formatProfiles().map((id) => {
      const p = loadProfile(id);
      return { id, name: p.name, status: p.status };
    });
    result.open_questions = readData(P.openQuestions).items.length;
  }
  return result;
}

export function loadProfile(id) {
  const outcome = outcomes()[id];
  if (!/^[a-z0-9-]+$/.test(id) || !outcome) {
    throw new BrandError("INVALID_PROFILE", `Unknown format profile "${id}".`, `Use one of: ${formatProfiles().join(", ")}.`);
  }
  const parts = profileParts(id, outcome);
  const { id: _id, name, status, note, audience, guardrails, ...rest } = readData(parts.skill);
  const taste = readData(parts.taste);
  const merged = { ...guardrails, ...taste };
  const profile = { id, name, status, note, audience, ...readData(parts.grid), ...rest };
  for (const [key, file] of Object.entries(parts.extra)) {
    if (key) profile[key] = readData(file);
    else Object.assign(profile, readData(file));
  }
  if (profile.reference_slides) profile.reference_slides = withReferenceHtml(profile.reference_slides);
  profile.guardrails = Object.fromEntries(GUARDRAIL_ORDER.filter((k) => k in merged).map((k) => [k, merged[k]]));
  // The outcome's step-by-step skill, when it is written.
  const skill = `${P.skills}/${outcome}/SKILL.md`;
  if (dataExists(skill) && readDoc(skill).meta.status !== "not_written") profile.skill = readDoc(skill).body;
  return profile;
}

function summarizeProfile(p) {
  const { overrides, ...rest } = p;
  return rest;
}

// Profiles may only tighten global rules. Numeric minimums can be raised,
// never lowered; locked rules and anything we can't prove is tighter are rejected.
const TIGHTER = {
  "font-size-min": (current, next) => typeof next === "number" && next >= current,
};

export function mergeRules(profile) {
  const rules = readData(P.rules).rules.map((r) => ({ ...r, check: { ...r.check } }));
  const applied = [];
  const rejected = [];
  for (const o of profile?.overrides ?? []) {
    const rule = rules.find((r) => r.id === o.rule);
    if (!rule) { rejected.push({ ...o, why: "No global rule with this id." }); continue; }
    if (rule.locked) { rejected.push({ ...o, why: "Rule is locked." }); continue; }
    const isTighter = TIGHTER[rule.check.type];
    if (!isTighter || !isTighter(rule.check.value, o.value)) { rejected.push({ ...o, why: "Override would loosen the rule, or can't be shown to tighten it." }); continue; }
    applied.push({ rule: rule.id, from: rule.check.value, to: o.value, reason: o.reason });
    rule.check.value = o.value;
    rule.rule = `${rule.rule} For ${profile.name}: minimum ${o.value}px.`;
    rule.overridden_by = profile.id;
  }
  return { rules, applied, rejected };
}

// ---------- components ----------
const ROLE_FORMATS = { document: "document", newsletter: "newsletter", deck: "deck" };

// Every token name a component may use, mapped to its CSS custom property in get_tokens({ as: "css" }).
export function tokenCssVars() {
  const t = readData(P.tokens);
  const map = {};
  for (const [group, names] of Object.entries(t.color.semantic.light)) for (const name of Object.keys(names)) map[`${group}/${name}`] = `--color-${group}-${name}`;
  for (const n of t.spacing.scale) map[`spacing/${n}`] = `--space-${n}`;
  for (const name of Object.keys(t.spacing.roles.desktop)) map[name] = `--${name.replace("/", "-")}`;
  for (const name of Object.keys(t.radius)) map[`radius/${name}`] = `--radius-${name}`;
  for (const name of Object.keys(t.border.width)) map[`border-width/${name}`] = `--border-width-${name}`;
  for (const name of Object.keys(t.elevation)) map[`Elevation/${name.replace(/(^|-)([a-z])/g, (_, d, c) => (d ? " " : "") + c.toUpperCase())}`] = `--shadow-${name}`;
  return map;
}

// Token names and text roles a component spec refers to.
export function componentRefs(spec) {
  const vars = tokenCssVars();
  const tokens = new Set();
  const roles = new Set();
  const walk = (v, key) => {
    if (typeof v === "string") { if (key === "role") roles.add(v); else if (v in vars) tokens.add(v); return; }
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, Array.isArray(v) ? key : k);
  };
  walk(spec);
  return { tokens: [...tokens].sort(), roles: [...roles].sort() };
}

function components(profile) {
  const data = readData(P.components);
  const vars = tokenCssVars();
  const { tokens, roles } = componentRefs(data.components);
  const out = { about: data.about, source: data.source, usage: data.usage, components: data.components };
  out.css_vars = Object.fromEntries(tokens.map((t) => [t, `var(${vars[t]})`]));
  const allRoles = readData(P.tokens).typography.roles;
  const format = profile && ROLE_FORMATS[profile.id];
  out.text_roles = Object.fromEntries(roles.map((r) => {
    const role = allRoles[r];
    const base = { css: `--role-${r}-*`, family: role.family, weight: role.weight, textCase: role.textCase };
    if (!format) return [r, base];
    const f = role.formats[format];
    return [r, { ...base, desktop: { size: f.desktop.size, lineHeight: f.desktop.lineHeight }, mobile: { size: f.mobile.size, lineHeight: f.mobile.lineHeight } }];
  }));
  out.text_roles_note = format
    ? `Sizes for the ${profile.name} format (Text Roles mode ${format}).`
    : "Pass format_profile (document, newsletter or deck) to get each role's size for that format, or call get_tokens with category typography and the format.";
  return out;
}
