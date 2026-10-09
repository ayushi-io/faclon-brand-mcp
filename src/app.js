import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { brandVersion } from "./lib/data.js";

// Stateless Streamable HTTP: a fresh server per request, so it runs on
// serverless hosts (Vercel) as well as a long-running Node process.
export const app = express();
app.use(express.json({ limit: "4mb" }));

app.get("/", (_req, res) => res.json({ name: "faclon-brand-mcp", status: "ok", brand_version: brandVersion(), mcp_endpoint: "/mcp" }));

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
