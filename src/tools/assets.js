import { readData } from "../lib/data.js";
import { P } from "../lib/paths.js";
import { BrandError } from "../lib/envelope.js";

// The Assets layer: real files exported from Figma, listed in ds/05-assets/_index.json
// and served by the HTTP app at /assets/<file>.
export const ASSET_CATEGORIES = ["logos", "partner-logos", "client-logos", "team-headshots", "design-elements", "architecture-outcomes", "icons"];
export const ASSET_BASE_URL = (process.env.ASSET_BASE_URL || "https://faclon-brand-mcp.vercel.app").replace(/\/$/, "");
const MAX = 80;

const USE = {
  logos: "Faclon Labs logo blue on light backgrounds, white on dark or brand backgrounds; full logo by default, the logomark only where the user asks. Never redraw, recolour or typeset a logo.",
  "partner-logos": "Partner logos (partnerships and OEM tie-ups), approved for external marketing. Use as supplied; never recolour. Next to the Faclon Labs logo, follow rule logo.co-branding (reference: the Faclon Labs and HPE lockup).",
  "client-logos": "Client logos, tagged by industry, approved for external marketing. Use as supplied, at a consistent height in a logo wall; never recolour.",
  "team-headshots": "Faclon leadership and SME headshots with their roles, with no background: fill the shape behind each with background/primary in the dark theme, and never crop from the top (rule assets.headshots). Where role is empty, show no role and never invent one.",
  "design-elements": "The brand design elements (dot-particle form: dark or brand; light streak: brand only; dot wave: dark, light or brand), the only exceptions to the no-AI-slop rule with the illustration styles. Use only on the backgrounds listed; place the file as it is.",
  "architecture-outcomes": "The I/O Sense outcomes (Faclon scope, Faclon scope with funnel, steam trap). Every architecture diagram ends in one of them, placed unchanged; Faclon scope by default, steam trap only for steam-trap diagrams. Change or rebuild only when the user asks.",
  icons: "The Faclon architecture icon library, for architecture diagrams only. Web and UI icons come from Lucide (rule icon.lucide-only).",
};

const withUrl = (e) => ({ ...e, url: `${ASSET_BASE_URL}/assets/${e.file}` });

export function getAssets({ asset_category, asset_query } = {}) {
  const index = readData(P.assetIndex);
  if (asset_category && !ASSET_CATEGORIES.includes(asset_category)) {
    throw new BrandError("INVALID_PARAM", `Unknown asset category "${asset_category}".`, `Use one of: ${ASSET_CATEGORIES.join(", ")}.`);
  }
  const base = { about: index.about, updated: index.updated, counts: index.counts, web_icons: index.web_icons, not_yet_supplied: index.not_yet_supplied };

  if (!asset_category && !asset_query) {
    // Overview: what exists, without every entry.
    const byCat = {};
    for (const c of ASSET_CATEGORIES) {
      const items = index.assets.filter((e) => e.category === c);
      const groups = {};
      for (const e of items) for (const t of e.tags) groups[t] = (groups[t] || 0) + 1;
      byCat[c] = { count: items.length, use: USE[c], groups, names: c === "icons" ? undefined : items.map((e) => e.name) };
    }
    return { ...base, categories: byCat, how_to_get_files: 'Pass asset_category and/or asset_query to get entries with their file URL (e.g. asset_category "client-logos", asset_query "steel").' };
  }

  const words = (asset_query || "").toLowerCase().split(/\s+/).filter(Boolean);
  const hay = (e) => [e.name, e.id, e.category, ...(e.tags || []), e.background || ""].join(" ").toLowerCase();
  const matches = index.assets.filter((e) => (!asset_category || e.category === asset_category) && words.every((w) => hay(e).includes(w)));
  return {
    ...base,
    asset_category,
    asset_query,
    use: asset_category ? USE[asset_category] : undefined,
    total: matches.length,
    shown: Math.min(matches.length, MAX),
    note: matches.length > MAX ? `Showing the first ${MAX}; narrow with asset_query.` : matches.length === 0 ? "Nothing matches. Tell the user the asset is not in the library; never substitute or draw one." : undefined,
    assets: matches.slice(0, MAX).map(withUrl),
  };
}
