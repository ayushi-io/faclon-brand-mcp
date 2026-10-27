import { readData, dataExists, listDirs } from "../lib/data.js";
import { P } from "../lib/paths.js";
import { BrandError } from "../lib/envelope.js";
import { ASSET_BASE_URL } from "./assets.js";

// Generation layer: per-outcome templates (layout references from the Figma Template
// frames), in ds/04-templates/<outcome>/templates.json; thumbnails served at /templates/<outcome>/<file>.
const file = (dir) => `${P.templates}/${dir}/templates.json`;

function all() {
  const out = {};
  for (const dir of listDirs(P.templates)) if (dataExists(file(dir))) { const t = readData(file(dir)); out[t.format_profile] = { dir, data: t }; }
  return out;
}

const withUrls = (dir, data) => ({
  ...data,
  sections: data.sections.map((s) => ({ ...s, templates: s.templates.map((t) => ({ ...t, thumbnail_url: `${ASSET_BASE_URL}/templates/${dir}/${t.thumbnail}` })) })),
});

export function getTemplates({ format_profile } = {}) {
  const byFormat = all();
  if (!format_profile) {
    return {
      about: "Templates per outcome: layout references from the Figma Template frames. Pass format_profile to get one outcome's templates with thumbnails and layout notes.",
      outcomes: Object.entries(byFormat).map(([id, { data }]) => ({ format_profile: id, outcome: data.outcome, count: data.sections.reduce((n, s) => n + s.templates.length, 0), sections: data.sections.map((s) => s.name) })),
      not_yet: "A4 documents, newsletters, images, unique A4 and case studies have no templates yet.",
    };
  }
  const hit = byFormat[format_profile];
  if (!hit) {
    throw new BrandError("NO_TEMPLATES", `No templates for "${format_profile}" yet.`, `Templates exist for: ${Object.keys(byFormat).join(", ")}. For other outcomes, design from the format's rules and skill; do not borrow another outcome's templates.`);
  }
  return withUrls(hit.dir, hit.data);
}
