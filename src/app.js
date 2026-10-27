import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import path from "node:path";
import { brandVersion, ROOT } from "./lib/data.js";
import { P } from "./lib/paths.js";

// Stateless Streamable HTTP: a fresh server per request, so it runs on
// serverless hosts (Vercel) as well as a long-running Node process.
export const app = express();
app.use(express.json({ limit: "4mb" }));

app.get("/", (_req, res) => res.json({ name: "faclon-brand-mcp", status: "ok", brand_version: brandVersion(), mcp_endpoint: "/mcp" }));

// Asset files (logos, headshots, icons) for HTML output: /assets/<file from _index.json>.
app.use("/assets", express.static(path.join(ROOT, P.assets), { index: false, dotfiles: "deny", maxAge: "1d", fallthrough: false }));
app.use("/assets", (err, _req, res, _next) => res.status(err.status || 500).json({ error: err.status === 404 ? "Asset not found. List assets with get_brand_guidelines(section: \"assets\")." : "Not allowed." }));

// Template thumbnails: /templates/<outcome>/thumbnails/<file>.png.
app.use("/templates", express.static(path.join(ROOT, P.templates), { index: false, dotfiles: "deny", maxAge: "1d", fallthrough: false, extensions: false }));
app.use("/templates", (err, _req, res, _next) => res.status(err.status || 500).json({ error: err.status === 404 ? "Template not found. List templates with get_brand_guidelines(section: \"templates\")." : "Not allowed." }));

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
  }
});

const notAllowed = (_req, res) => res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed. Use POST." }, id: null });
app.get("/mcp", notAllowed);
app.delete("/mcp", notAllowed);

export default app;
