#!/usr/bin/env node
import { readdirSync, statSync, writeFileSync } from "fs";
import { join, extname } from "path";

const PUBLIC = join(process.cwd(), "public");
const BASE = join(PUBLIC, "handzettel");
const OUT = join(BASE, "manifest.json");

function parseKW(filename) {
  const match = filename.match(/KW(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function scanDE() {
  const dir = join(BASE, "de");
  const entries = [];
  try {
    for (const file of readdirSync(dir)) {
      if (statSync(join(dir, file)).isDirectory()) continue;
      const kw = parseKW(file);
      if (kw === null) continue;
      entries.push({
        kw,
        file: `/handzettel/de/${encodeURIComponent(file)}`,
        type: extname(file).toLowerCase() === ".pdf" ? "pdf" : "image",
      });
    }
  } catch (e) {
    console.warn("⚠ Could not scan handzettel/de/:", e.message);
  }
  return entries.sort((a, b) => b.kw - a.kw);
}

function scanNL() {
  const dir = join(BASE, "nl");
  const entries = [];
  try {
    for (const region of readdirSync(dir)) {
      const regionDir = join(dir, region);
      if (!statSync(regionDir).isDirectory()) continue;
      for (const file of readdirSync(regionDir)) {
        if (statSync(join(regionDir, file)).isDirectory()) continue;
        const kw = parseKW(file);
        if (kw === null) continue;
        entries.push({
          kw,
          region,
          file: `/handzettel/nl/${encodeURIComponent(region)}/${encodeURIComponent(file)}`,
          type: extname(file).toLowerCase() === ".pdf" ? "pdf" : "image",
        });
      }
    }
  } catch (e) {
    console.warn("⚠ Could not scan handzettel/nl/:", e.message);
  }
  return entries.sort((a, b) => b.kw - a.kw);
}

const manifest = {
  generated: new Date().toISOString(),
  de: scanDE(),
  nl: scanNL(),
};

writeFileSync(OUT, JSON.stringify(manifest, null, 2), "utf-8");
console.log(
  `Handzettel manifest: ${manifest.de.length} DE, ${manifest.nl.length} NL entries → ${OUT}`
);
