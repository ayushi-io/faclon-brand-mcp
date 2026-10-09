import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { run } from "./lib/envelope.js";
import { getTokens, CATEGORIES, OUTPUTS, MODES } from "./tools/tokens.js";
import { getBrandGuidelines, SECTIONS, formatProfiles } from "./tools/guidelines.js";

export const INSTRUCTIONS = `Faclon brand server. Use it whenever you create anything that should look or sound like Faclon.
1. Before building, call get_brand_guidelines with section "rules" (and format_profile when you know the output type). It returns the rules and the defaults to use whenever the request doesn't specify. Then call get_tokens for exact values.
2. Every colour, font, size, spacing, radius and shadow must come from get_tokens. Never sample a colour from an image or pick a near neighbour. Only TASA Orbiter and Inter may be used, with no other fallback font.
3. If a guideline section returns status "not_written", tell the user it is missing. Do not invent brand guidance.
4. Every response has ok, data or error, and brand_version. On an error, follow error.fix.`;

const readOnly = { readOnlyHint: true, openWorldHint: false };

export function createServer() {
  const server = new McpServer({ name: "faclon-brand", version: "0.1.0" }, { instructions: INSTRUCTIONS });

  server.registerTool(
    "get_tokens",
    {
      title: "Get design tokens",
      description:
        "Get Faclon design tokens from the Figma source. Every colour, font, size, spacing, radius and shadow in generated output must come from here. " +
        "Omit category for everything. Colours have light and dark modes; typography and spacing have desktop and mobile modes; omit mode to get all modes. " +
        'as: "json" (resolved values with their token references), "css" (custom properties), "tailwind" (theme.extend), "figma" (raw Figma variables).',
      inputSchema: {
        category: z.enum(CATEGORIES).optional().describe("Token group. Omit for all."),
        mode: z.enum(MODES).optional().describe("light/dark for color; desktop/mobile for typography and spacing. Omit for all modes."),
        as: z.enum(OUTPUTS).optional().describe('Output format. Default "json".'),
      },
      annotations: { title: "Get design tokens", ...readOnly },
    },
    run(getTokens),
  );

  server.registerTool(
    "get_brand_guidelines",
    {
      title: "Get brand guidelines",
      description:
        "Get Faclon brand guidance. Call this before building anything. " +
        'section "rules" returns machine-readable rules with severity (error or warning) and whether each is locked, the defaults to apply when a request doesn\'t specify, and open questions where the Figma file contradicts itself. ' +
        "Pass format_profile to merge an output type's rules (profiles can only tighten global rules). " +
        'Sections marked "not_written" are gaps in the brand file: report them, never fill them in.',
      inputSchema: {
        section: z.enum(SECTIONS).optional().describe('Default "overview".'),
        format_profile: z.string().optional().describe(`Output type. Currently: ${formatProfiles().join(", ")}.`),
      },
      annotations: { title: "Get brand guidelines", ...readOnly },
    },
    run(getBrandGuidelines),
  );

  return server;
}
