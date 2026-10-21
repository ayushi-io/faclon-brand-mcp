import { readData, dataExists, listData } from "../lib/data.js";
import { BrandError } from "../lib/envelope.js";

export const SECTIONS = ["overview", "rules", "defaults", "components", "logo", "typography", "color", "voice", "illustration", "architecture", "imagery"];

// Sections the Figma file does not cover yet. Returned as gaps, never invented.
const NOT_WRITTEN = {
  illustration: "Illustration style: line/flat/isometric, palette use, composition, do/don't examples.",
  architecture: "Architecture diagram conventions: shapes, connectors, icon set, colour coding, levels of detail.",
  imagery: "Photography and imagery: subjects, lighting, cropping, overlays, what to avoid.",
};

export const formatProfiles = () => listData("formats", ".json");

export function getBrandGuidelines({ section = "overview", format_profile } = {}) {
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
      defaults: readData("rules/defaults.json").defaults,
      overrides_applied: profile ? applied : undefined,
      overrides_rejected: profile && rejected.length ? rejected : undefined,
      open_questions: readData("rules/open-questions.json").items,
      figma_updates_needed: readData("rules/open-questions.json").figma_updates_needed,
    };
  }

  if (section === "defaults") {
    return { section, status: "written", about: readData("rules/defaults.json").about, defaults: readData("rules/defaults.json").defaults, format_profile: profileInfo };
  }

  if (section === "components") return { section, status: "written", ...components(profile), format_profile: profileInfo };

  if (NOT_WRITTEN[section]) {
    return {
      section,
      status: "not_written",
      message: `The brand file has no ${section} guidance yet. Do not invent it; tell the user it is missing.`,
      needed: NOT_WRITTEN[section],
      format_profile: profileInfo,
    };
  }

  const result = { section, status: "written", guidance: readData(`guidelines/${section}.md`, { json: false }), format_profile: profileInfo };
  if (section === "overview") {
    result.sections = SECTIONS.map((s) => ({ section: s, status: NOT_WRITTEN[s] ? "not_written" : "written" }));
    result.format_profiles = formatProfiles().map((id) => {
      const p = readData(`formats/${id}.json`);
      return { id, name: p.name, status: p.status };
    });
    result.open_questions = readData("rules/open-questions.json").items.length;
  }
  return result;
}

function loadProfile(id) {
  if (!/^[a-z0-9-]+$/.test(id) || !dataExists(`formats/${id}.json`)) {
    throw new BrandError("INVALID_PROFILE", `Unknown format profile "${id}".`, `Use one of: ${formatProfiles().join(", ")}.`);
  }
  return readData(`formats/${id}.json`);
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
  const rules = readData("rules/rules.json").rules.map((r) => ({ ...r, check: { ...r.check } }));
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
  const t = readData("tokens.json");
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
  const data = readData("components/components.json");
  const vars = tokenCssVars();
  const { tokens, roles } = componentRefs(data.components);
  const out = { about: data.about, source: data.source, usage: data.usage, components: data.components };
  out.css_vars = Object.fromEntries(tokens.map((t) => [t, `var(${vars[t]})`]));
  const allRoles = readData("tokens.json").typography.roles;
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
