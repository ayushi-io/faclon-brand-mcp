// End-to-end through the real MCP protocol, using an in-memory client.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";

async function connect() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0" });
  await Promise.all([createServer().connect(a), client.connect(b)]);
  return client;
}
const body = (r) => JSON.parse(r.content[0].text);

test("server lists exactly the Brand tools and sends instructions", async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ["check_design", "get_brand_guidelines", "get_tokens"]);
  assert.match(client.getInstructions(), /get_brand_guidelines/);
});

test("get_tokens returns the envelope", async () => {
  const client = await connect();
  const r = body(await client.callTool({ name: "get_tokens", arguments: { category: "radius" } }));
  assert.equal(r.ok, true);
  assert.ok(r.brand_version);
  assert.equal(r.data.tokens.md, 4);
});

test("errors come back as isError with a fix", async () => {
  const client = await connect();
  const res = await client.callTool({ name: "get_brand_guidelines", arguments: { format_profile: "billboard" } });
  assert.equal(res.isError, true);
  const r = body(res);
  assert.equal(r.error.code, "INVALID_PROFILE");
  assert.ok(r.error.fix);
});

test("schema rejects an unknown enum value", async () => {
  const client = await connect();
  const res = await client.callTool({ name: "get_tokens", arguments: { category: "shadows" } });
  assert.equal(res.isError, true);
});

test("get_tokens accepts a format over the protocol", async () => {
  const client = await connect();
  const r = body(await client.callTool({ name: "get_tokens", arguments: { category: "typography", format: "newsletter" } }));
  assert.equal(r.ok, true);
  assert.equal(r.data.format, "newsletter");
  assert.equal(r.data.tokens.roles.body.desktop.size, 16);
});

test("check_design runs over the protocol", async () => {
  const client = await connect();
  const r = body(await client.callTool({ name: "check_design", arguments: { html: "<p style=\"font-family:Arial\">Faclon Labs</p>", format_profile: "social" } }));
  assert.equal(r.ok, true);
  assert.equal(r.data.verdict, "fail");
  assert.equal(r.data.findings[0].rule, "type.two-families-only");
});
