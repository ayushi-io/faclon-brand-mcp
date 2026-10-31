// Where everything lives. ds/ is the design system (faclon-marketing-ds tree);
// sources/ holds raw inputs (Figma exports, brand-team overrides, uploaded files).
export const P = {
  version: "ds/00-start-here/version.json",
  openQuestions: "ds/00-start-here/open-questions.json",
  tokens: "ds/01-foundations/tokens.json",
  defaults: "ds/01-foundations/defaults.json",
  components: "ds/03-components/components.json",
  rules: "ds/09-brand-validator/validator-rules.json",
  skills: "ds/07-skills",
  assets: "ds/05-assets",
  templates: "ds/04-templates",
  examples: "ds/06-taste/good-vs-bad-examples",
  dataViz: "ds/02-brand-elements/data-viz",
  assetIndex: "ds/05-assets/_index.json",
  snapshot: "sources/figma/snapshot.json",
  componentsSnapshot: "sources/figma/components-snapshot.json",
  overrides: "sources/overrides/semantic-colors.json",
};

// get_brand_guidelines sections backed by a Markdown file. A file whose front
// matter says `status: not_written` is a gap: served as such, never invented.
export const SECTION_FILES = {
  overview: "ds/00-start-here/README.md",
  principles: "ds/00-start-here/principles.md",
  logo: "ds/02-brand-elements/logo/logo.md",
  typography: "ds/01-foundations/typography/typography.md",
  color: "ds/01-foundations/color/color.md",
  voice: "ds/01-foundations/voice/voice.md",
  "design-elements": "ds/02-brand-elements/design-elements/README.md",
  illustration: "ds/02-brand-elements/illustration/README.md",
  "data-viz": "ds/02-brand-elements/data-viz/README.md",
  iconography: "ds/02-brand-elements/iconography/README.md",
  architecture: "ds/02-brand-elements/diagrams/README.md",
  imagery: "ds/02-brand-elements/photography-imagery/README.md",
  examples: "ds/06-taste/good-vs-bad-examples/README.md",
};

// Sections served from several Markdown files, joined in order.
export const SECTION_GROUPS = {
  export: ["ds/10-export/html-specs.md", "ds/10-export/naming.md", "ds/10-export/delivery.md"],
  qa: ["ds/08-qa-ai/ai-review.md", "ds/08-qa-ai/checklists/README.md"],
};

// A format profile is assembled from the files that own each part of it:
// the outcome's rules in 07-skills, its canvas in 01-foundations/grid-layout,
// its taste (must_not, avoid, design_direction) in 06-taste, plus format-specific
// pieces kept with their own layer (deck reference slides, architecture diagram conventions).
export const profileParts = (id, outcome) => ({
  skill: `${P.skills}/${outcome}/rules.json`,
  grid: `ds/01-foundations/grid-layout/${id}.json`,
  taste: `ds/06-taste/per-format-rules/${id}.json`,
  extra: {
    deck: { reference_slides: "ds/04-templates/decks/reference-slides.json" },
    architecture: { "": "ds/02-brand-elements/diagrams/architecture.json" },
  }[id] ?? {},
});

export const GUARDRAIL_ORDER = ["status", "note", "user_decides", "fixed", "must_not", "avoid", "design_direction", "claude_decides", "to_define"];
