// Bumps ds/00-start-here/version.json brand_version to today's YYYY.MM.DD-n.
// Same day: n + 1. New day: n = 1. Dates use the TZ environment variable
// (the sync workflow sets Asia/Kolkata).
// Usage: node scripts/bump-version.mjs        -> prints the new version

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../ds/00-start-here/version.json");
const text = fs.readFileSync(file, "utf8");
const { brand_version: current } = JSON.parse(text);

const d = new Date();
const today = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
const [day, n] = current.split("-");
const next = day === today ? `${today}-${Number(n) + 1}` : `${today}-1`;

// Replace only the value so the file keeps its formatting.
fs.writeFileSync(file, text.replace(`"brand_version": "${current}"`, `"brand_version": "${next}"`));
console.log(next);
