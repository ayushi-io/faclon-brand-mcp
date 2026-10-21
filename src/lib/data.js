import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { P } from "./paths.js";

// Paths are relative to the repo root (ds/…, sources/…); see paths.js.
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cache = new Map();

export function readData(relPath, { json = true } = {}) {
  if (!cache.has(relPath)) {
    const text = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    cache.set(relPath, json ? JSON.parse(text) : text);
  }
  return cache.get(relPath);
}

export function dataExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

export function listDirs(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

// Markdown with optional front matter (`key: value` lines between --- fences).
export function readDoc(relPath) {
  const text = readData(relPath, { json: false });
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = Object.fromEntries(m[1].split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]));
  return { meta, body: text.slice(m[0].length) };
}

export const brandVersion = () => readData(P.version).brand_version;
