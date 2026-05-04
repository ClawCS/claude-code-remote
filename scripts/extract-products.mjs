#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, basename } from "path";
import { execSync } from "child_process";
import sharp from "sharp";

const ROOT = process.cwd();
const HZ_DIR = join(ROOT, "public/handzettel");
const OUT_DIR = join(ROOT, "public/data/products");
const EXTRACTED_DIR = join(ROOT, "public/handzettel/extracted");
const CATEGORIES = JSON.parse(readFileSync(join(ROOT, "config/categories.json"), "utf-8")).categories;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error("GEMINI_API_KEY nicht gesetzt. Abbruch.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

function parseKW(filename) {
  const m = filename.match(/KW(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function slug(title) {
  return title
    .toLowerCase()
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function kwDateRange(kw, year) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dow + 1 + (kw - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { validFrom: fmt(monday), validUntil: fmt(sunday) };
}

function publishAt(kw, year) {
  const { validFrom } = kwDateRange(kw, year);
  const monday = new Date(validFrom + "T00:00:00Z");
  const prevSunday = new Date(monday);
  prevSunday.setUTCDate(monday.getUTCDate() - 1);
  return prevSunday.toISOString().replace("T00:00:00.000Z", "T16:00:00+02:00");
}

const EXTRACTION_PROMPT = `Du bist ein Produkt-Extraktor für Getränkemarkt-Handzettel. Analysiere dieses Bild eines Handzettel-Prospekts und extrahiere ALLE sichtbaren Produkt-Angebote.

Für jedes Produkt gib zurück:
- "title": Produktname (z.B. "Krombacher Pils")
- "description": Gebindegröße/Inhalt (z.B. "Kasten 24×0,33L")
- "price": Angebotspreis als Zahl (z.B. 12.99)
- "priceUnit": Einheit des Preises (z.B. "Kasten", "Flasche", "Dose", "Liter", "Packung")
- "pricePerLiter": Literpreis als Zahl falls angegeben, sonst null
- "deposit": Pfandbetrag als Zahl falls angegeben, sonst null
- "category": Eine aus: ${CATEGORIES.map(c => c.id).join(", ")}
- "boundingBox": Ungefähre Position des Produkts auf der Seite als Objekt {"x": 0-100, "y": 0-100, "w": 10-50, "h": 10-50} in Prozent der Seitenmaße
- "needsReview": true wenn Preis/Titel unklar lesbar

Antworte NUR mit einem JSON-Array. Keine Erklärungen, kein Markdown. Beispiel:
[{"title":"Krombacher Pils","description":"Kasten 24×0,33L","price":12.99,"priceUnit":"Kasten","pricePerLiter":1.64,"deposit":3.42,"category":"bier","boundingBox":{"x":5,"y":10,"w":40,"h":30},"needsReview":false}]

Wenn keine Produkte erkennbar sind, antworte mit [].
Ignoriere Logos, Deko-Elemente und nicht-Produkt-Inhalte (Öffnungszeiten, Adressen etc.).`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractFromImage(imagePath, maxRetries = 4) {
  const imageData = readFileSync(imagePath);
  const base64 = imageData.toString("base64");
  const ext = extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent([
        EXTRACTION_PROMPT,
        { inlineData: { data: base64, mimeType } },
      ]);

      const text = result.response.text().trim();
      const jsonStr = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "");

      try {
        return JSON.parse(jsonStr);
      } catch {
        console.warn(`  ⚠ JSON-Parse fehlgeschlagen für ${basename(imagePath)}`);
        console.warn(`  Response: ${text.substring(0, 200)}...`);
        return [];
      }
    } catch (e) {
      const isRetryable = e.message?.includes("429") || e.message?.includes("quota") || e.message?.includes("503") || e.message?.includes("Service Unavailable");
      if (isRetryable && attempt < maxRetries) {
        const waitSec = Math.pow(2, attempt + 1) * 15;
        console.log(`    ⏳ Rate-Limit, warte ${waitSec}s (Versuch ${attempt + 1}/${maxRetries})...`);
        await sleep(waitSec * 1000);
      } else {
        throw e;
      }
    }
  }
  return [];
}

async function cropProductImage(sourceImage, bbox, outputPath) {
  try {
    const meta = await sharp(sourceImage).metadata();
    const x = Math.round((bbox.x / 100) * meta.width);
    const y = Math.round((bbox.y / 100) * meta.height);
    const w = Math.min(Math.round((bbox.w / 100) * meta.width), meta.width - x);
    const h = Math.min(Math.round((bbox.h / 100) * meta.height), meta.height - y);

    if (w < 10 || h < 10) return false;

    await sharp(sourceImage)
      .extract({ left: x, top: y, width: w, height: h })
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);
    return true;
  } catch (e) {
    console.warn(`  ⚠ Bild-Crop fehlgeschlagen: ${e.message}`);
    return false;
  }
}

async function processDE(kw, year) {
  const deDir = join(HZ_DIR, "de");
  if (!existsSync(deDir)) return [];

  const pdfs = readdirSync(deDir).filter(f => {
    const k = parseKW(f);
    return k === kw && extname(f).toLowerCase() === ".pdf";
  });

  if (pdfs.length === 0) {
    console.log(`  Keine DE-PDF für KW ${kw} gefunden.`);
    return [];
  }

  const products = [];
  for (const pdf of pdfs) {
    const pdfPath = join(deDir, pdf);
    console.log(`  📄 ${pdf}`);

    const tmpDir = join("/tmp", `hz-de-kw${kw}`);
    mkdirSync(tmpDir, { recursive: true });
    execSync(`pdftoppm -png -r 200 "${pdfPath}" "${tmpDir}/page"`, { stdio: "pipe" });

    const pages = readdirSync(tmpDir).filter(f => f.endsWith(".png")).sort();
    console.log(`  ${pages.length} Seiten gerendert`);

    const extractedDir = join(EXTRACTED_DIR, `kw${kw}`, "de");
    mkdirSync(extractedDir, { recursive: true });

    for (const page of pages) {
      const pagePath = join(tmpDir, page);
      console.log(`    → ${page}...`);

      const items = await extractFromImage(pagePath);
      console.log(`    ${items.length} Produkte erkannt`);

      for (const item of items) {
        const id = `kw${kw}-de-${String(products.length + 1).padStart(3, "0")}`;
        const s = slug(item.title || "unbekannt");
        const imgFile = `${s}.webp`;
        const imgPath = join(extractedDir, imgFile);

        let imageUrl = null;
        if (item.boundingBox) {
          const cropped = await cropProductImage(pagePath, item.boundingBox, imgPath);
          if (cropped) imageUrl = `/handzettel/extracted/kw${kw}/de/${imgFile}`;
        }

        const { validFrom, validUntil } = kwDateRange(kw, year);
        products.push({
          id,
          title: item.title || "Unbekannt",
          description: item.description || "",
          price: typeof item.price === "number" ? item.price : 0,
          priceUnit: item.priceUnit || "",
          pricePerLiter: item.pricePerLiter ?? null,
          deposit: item.deposit ?? null,
          imageUrl,
          category: CATEGORIES.some(c => c.id === item.category) ? item.category : "sonstiges",
          origin: "DE",
          validFrom,
          validUntil,
          kw,
          year,
          needsReview: item.needsReview || false,
        });
      }
    }
  }
  return products;
}

async function processNL(kw, year) {
  const nlDir = join(HZ_DIR, "nl");
  if (!existsSync(nlDir)) return [];

  const products = [];
  const regions = readdirSync(nlDir).filter(r => statSync(join(nlDir, r)).isDirectory());

  for (const region of regions) {
    const regionDir = join(nlDir, region);
    const files = readdirSync(regionDir).filter(f => {
      const k = parseKW(f);
      const ext = extname(f).toLowerCase();
      return k === kw && (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".pdf");
    });

    if (files.length === 0) continue;

    for (const file of files) {
      const filePath = join(regionDir, file);
      const ext = extname(file).toLowerCase();
      console.log(`  🇳🇱 ${region}/${file}`);

      const extractedDir = join(EXTRACTED_DIR, `kw${kw}`, "nl");
      mkdirSync(extractedDir, { recursive: true });

      let imagePaths = [];
      if (ext === ".pdf") {
        const tmpDir = join("/tmp", `hz-nl-kw${kw}-${slug(region)}`);
        mkdirSync(tmpDir, { recursive: true });
        execSync(`pdftoppm -png -r 200 "${filePath}" "${tmpDir}/page"`, { stdio: "pipe" });
        imagePaths = readdirSync(tmpDir).filter(f => f.endsWith(".png")).sort().map(f => join(tmpDir, f));
      } else {
        imagePaths = [filePath];
      }

      for (const imgPath of imagePaths) {
        console.log(`    → ${basename(imgPath)}...`);
        const items = await extractFromImage(imgPath);
        console.log(`    ${items.length} Produkte erkannt`);

        for (const item of items) {
          const id = `kw${kw}-nl-${String(products.length + 1).padStart(3, "0")}`;
          const s = slug(item.title || "unbekannt");
          const imgFile = `${s}.webp`;
          const outPath = join(extractedDir, imgFile);

          let imageUrl = null;
          if (item.boundingBox) {
            const cropped = await cropProductImage(imgPath, item.boundingBox, outPath);
            if (cropped) imageUrl = `/handzettel/extracted/kw${kw}/nl/${imgFile}`;
          }

          const { validFrom, validUntil } = kwDateRange(kw, year);
          products.push({
            id,
            title: item.title || "Unbekannt",
            description: item.description || "",
            price: typeof item.price === "number" ? item.price : 0,
            priceUnit: item.priceUnit || "",
            pricePerLiter: item.pricePerLiter ?? null,
            deposit: item.deposit ?? null,
            imageUrl,
            category: CATEGORIES.some(c => c.id === item.category) ? item.category : "sonstiges",
            origin: "NL",
            region,
            validFrom,
            validUntil,
            kw,
            year,
            needsReview: item.needsReview || false,
          });
        }
      }
    }
  }
  return products;
}

async function main() {
  console.log("🔍 Handzettel-Produkt-Extraktion\n");

  const allKWs = new Set();

  // DE KWs scannen
  const deDir = join(HZ_DIR, "de");
  if (existsSync(deDir)) {
    for (const f of readdirSync(deDir)) {
      const kw = parseKW(f);
      if (kw) allKWs.add(kw);
    }
  }

  // NL KWs scannen
  const nlDir = join(HZ_DIR, "nl");
  if (existsSync(nlDir)) {
    for (const region of readdirSync(nlDir)) {
      const rd = join(nlDir, region);
      if (!statSync(rd).isDirectory()) continue;
      for (const f of readdirSync(rd)) {
        const kw = parseKW(f);
        if (kw) allKWs.add(kw);
      }
    }
  }

  if (allKWs.size === 0) {
    console.log("Keine Handzettel gefunden. Leeres Manifest erstellt.");
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify({ available: [] }, null, 2));
    return;
  }

  const year = new Date().getFullYear();
  const manifest = { available: [] };

  for (const kw of [...allKWs].sort((a, b) => b - a)) {
    console.log(`\n━━━ KW ${kw} ━━━`);

    const deProducts = await processDE(kw, year);
    const nlProducts = await processNL(kw, year);
    const allProducts = [...deProducts, ...nlProducts];

    if (allProducts.length === 0) {
      console.log(`  Keine Produkte für KW ${kw} extrahiert.`);
      continue;
    }

    allProducts.sort((a, b) => {
      const catOrder = CATEGORIES.findIndex(c => c.id === a.category) - CATEGORIES.findIndex(c => c.id === b.category);
      if (catOrder !== 0) return catOrder;
      return a.title.localeCompare(b.title, "de");
    });

    const filename = `kw${kw}-${year}.json`;
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, filename), JSON.stringify(allProducts, null, 2));

    manifest.available.push({
      kw,
      year,
      publishAt: publishAt(kw, year),
      file: filename,
      productCount: allProducts.length,
      de: deProducts.length,
      nl: nlProducts.length,
    });

    console.log(`  ✅ ${allProducts.length} Produkte (${deProducts.length} DE, ${nlProducts.length} NL) → ${filename}`);
  }

  manifest.available.sort((a, b) => b.kw - a.kw);
  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n📦 Manifest: ${manifest.available.length} KW(s) → public/data/products/manifest.json`);
}

main().catch((e) => {
  console.error("❌ Fehler:", e.message);
  process.exit(1);
});
