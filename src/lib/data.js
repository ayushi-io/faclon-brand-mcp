import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "data");
const cache = new Map();

export function readData(relPath, { json = true } = {}) {
  if (!cache.has(relPath)) {
    const text = fs.readFileSync(path.join(DATA, relPath), "utf8");
    cache.set(relPath, json ? JSON.parse(text) : text);
  }
  return cache.get(relPath);
}

export function dataExists(relPath) {
  return fs.existsSync(path.join(DATA, relPath));
}

export function listData(dir, ext) {
  return fs.readdirSync(path.join(DATA, dir)).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)).sort();
}

export const brandVersion = () => readData("version.json").brand_version;
