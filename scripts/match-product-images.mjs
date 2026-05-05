#!/usr/bin/env node
/**
 * Matches products to trinkgut.de CDN packshot images via EAN codes.
 *
 * Usage:
 *   GEMINI_API_KEY=... node scripts/match-product-images.mjs
 *
 * What it does:
 *   1. Reads data/products.json
 *   2. For products without EAN, asks Gemini to identify the EAN code
 *   3. Constructs media.trinkgut.de CDN URLs
 *   4. Verifies URLs exist (HEAD request)
 *   5. Updates products.json with verified CDN image URLs
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const PRODUCTS_PATH = join(ROOT, "data/products.json");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error("GEMINI_API_KEY nicht gesetzt. Abbruch.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function cdnUrl(ean) {
  return `https://media.trinkgut.de/assets/gtin/${ean[0]}/${ean[1]}/${ean[2]}/${ean[3]}/${ean}-0.webp`;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function findEAN(productName, category, unit) {
  const prompt = `Du bist ein Experte für Getränke-EAN-Codes (GTIN-13) im deutschen Einzelhandel.

Produkt: "${productName}"
Kategorie: ${category}
Gebinde: ${unit}

Gib den wahrscheinlichsten 13-stelligen EAN/GTIN-Code für dieses Produkt zurück.
Antworte NUR mit der 13-stelligen Zahl, nichts anderes. Wenn du dir nicht sicher bist, antworte mit "UNKNOWN".`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (/^\d{13}$/.test(text)) return text;
    return null;
  } catch (e) {
    if (e.message?.includes("429") || e.message?.includes("quota")) {
      console.log("  Rate limit, warte 30s...");
      await sleep(30000);
      return findEAN(productName, category, unit);
    }
    console.warn(`  Fehler: ${e.message}`);
    return null;
  }
}

async function main() {
  const products = JSON.parse(readFileSync(PRODUCTS_PATH, "utf-8"));

  const needsMatch = products.filter((p) => !p.ean);
  console.log(`\n🔍 ${needsMatch.length} Produkte ohne EAN gefunden\n`);

  let matched = 0;
  let failed = 0;

  for (const product of needsMatch) {
    process.stdout.write(`  ${product.name}... `);

    const ean = await findEAN(product.name, product.category, product.unit);
    if (!ean) {
      console.log("❌ kein EAN gefunden");
      failed++;
      continue;
    }

    const url = cdnUrl(ean);
    const exists = await verifyUrl(url);

    if (exists) {
      product.ean = ean;
      product.extractedImage = product.image;
      product.image = url;
      console.log(`✅ ${ean}`);
      matched++;
    } else {
      console.log(`⚠️  EAN ${ean} — Bild nicht auf CDN`);
      failed++;
    }

    await sleep(1000);
  }

  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + "\n");
  console.log(`\n✅ Fertig: ${matched} neu gemappt, ${failed} ohne Bild`);
  console.log(`   Gesamt mit CDN-Bild: ${products.filter((p) => p.ean).length}/${products.length}`);
}

main().catch(console.error);
