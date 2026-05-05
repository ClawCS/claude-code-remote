#!/usr/bin/env node
/**
 * Scrapt trinkgut.de/angebote/ und extrahiert echte Produkt-Bild-URLs.
 * Matcht sie per Namens-Ähnlichkeit mit unseren Produkten in products.json.
 *
 * Usage:
 *   node scripts/scrape-product-images.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const PRODUCTS_PATH = join(ROOT, "data/products.json");

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "");
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const words_a = a.toLowerCase().split(/[\s,.\-\/]+/).filter(w => w.length > 2);
  const words_b = b.toLowerCase().split(/[\s,.\-\/]+/).filter(w => w.length > 2);
  const common = words_a.filter(w => words_b.some(wb => wb.includes(w) || w.includes(wb)));
  return common.length / Math.max(words_a.length, words_b.length, 1);
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function main() {
  console.log("🔍 Scrape trinkgut.de Produktbilder...\n");

  const products = JSON.parse(readFileSync(PRODUCTS_PATH, "utf-8"));

  // 1. Versuche die Angebote-Seite zu laden
  let html;
  try {
    html = await fetchPage("https://www.trinkgut.de/angebote/");
    console.log(`✓ Angebote-Seite geladen (${(html.length / 1024).toFixed(0)} KB)\n`);
  } catch (e) {
    console.error(`✗ Konnte trinkgut.de nicht laden: ${e.message}`);
    console.log("\nVersuche alternative Methode...\n");
    html = null;
  }

  const foundImages = [];

  if (html) {
    // Extrahiere alle Bild-URLs aus dem HTML
    const imgPatterns = [
      // media.trinkgut.de CDN
      /https?:\/\/media\.trinkgut\.de\/[^"'\s)]+\.(webp|png|jpg|jpeg)/gi,
      // Inline JSON data
      /"image[Uu]rl?"\s*:\s*"(https?:\/\/[^"]+)"/g,
      // img src tags
      /src="(https?:\/\/media\.trinkgut\.de[^"]*)"/g,
      // Background images
      /url\(['"]?(https?:\/\/media\.trinkgut\.de[^'")\s]+)/g,
    ];

    const urls = new Set();
    for (const pattern of imgPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1] || match[0];
        if (url.includes("media.trinkgut.de") && !url.includes("logo") && !url.includes("icon")) {
          urls.add(url);
        }
      }
    }

    // Versuche auch eingebettetes JSON zu finden (Next.js __NEXT_DATA__ oder ähnlich)
    const jsonBlocks = html.match(/<script[^>]*>({.*?"props".*?})<\/script>/gs) || [];
    for (const block of jsonBlocks) {
      const jsonStr = block.replace(/<\/?script[^>]*>/g, "");
      try {
        const data = JSON.parse(jsonStr);
        const extractUrls = (obj) => {
          if (!obj || typeof obj !== "object") return;
          for (const [key, val] of Object.entries(obj)) {
            if (typeof val === "string" && val.includes("media.trinkgut.de")) {
              urls.add(val);
            } else if (typeof val === "object") {
              extractUrls(val);
            }
          }
        };
        extractUrls(data);
      } catch {}
    }

    console.log(`  ${urls.size} Bild-URLs auf trinkgut.de gefunden\n`);

    // Extrahiere Produktnamen aus URLs
    for (const url of urls) {
      // Promotion pattern: trinkgut-{slug}-{hash}.png
      const promoMatch = url.match(/trinkgut-(.+?)-[a-f0-9]{20,}\.(png|webp|jpg)/);
      if (promoMatch) {
        const slug = promoMatch[1].replace(/-/g, " ");
        foundImages.push({ url, name: slug, type: "promotion" });
      }
      // GTIN pattern: /assets/gtin/.../EAN-0.webp
      const gtinMatch = url.match(/assets\/gtin\/\d\/\d\/\d\/\d\/(\d+)-\d\.webp/);
      if (gtinMatch) {
        foundImages.push({ url, name: gtinMatch[1], type: "gtin", ean: gtinMatch[1] });
      }
    }

    console.log(`  ${foundImages.length} Produktbilder identifiziert\n`);
  }

  // Wenn keine Bilder gefunden, versuche die API
  if (foundImages.length === 0) {
    console.log("Versuche trinkgut.de API...\n");

    const apiUrls = [
      "https://www.trinkgut.de/api/offers",
      "https://www.trinkgut.de/api/products",
      "https://www.trinkgut.de/api/v1/offers",
      "https://api.trinkgut.de/offers",
      "https://www.trinkgut.de/_next/data/",
    ];

    for (const apiUrl of apiUrls) {
      try {
        const res = await fetch(apiUrl, {
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          console.log(`✓ API gefunden: ${apiUrl}`);
          console.log(JSON.stringify(data).substring(0, 500));
          break;
        }
      } catch {}
    }
  }

  // Matche gefundene Bilder mit unseren Produkten
  let matched = 0;
  if (foundImages.length > 0) {
    for (const product of products) {
      let bestMatch = null;
      let bestScore = 0;

      for (const img of foundImages) {
        const score = similarity(product.name, img.name);
        if (score > bestScore && score >= 0.5) {
          bestScore = score;
          bestMatch = img;
        }
      }

      if (bestMatch) {
        console.log(`  ✅ ${product.name} → ${bestMatch.url.substring(0, 80)}... (${(bestScore * 100).toFixed(0)}%)`);
        product.extractedImage = product.image;
        product.image = bestMatch.url;
        if (bestMatch.ean) product.ean = bestMatch.ean;
        matched++;
      }
    }
  }

  if (matched > 0) {
    writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + "\n");
    console.log(`\n✅ ${matched} Produkte mit CDN-Bildern aktualisiert`);
  } else {
    console.log("\n⚠️  Keine Matches gefunden.");
    console.log("\nAlternative: Öffne https://www.trinkgut.de/angebote/ im Browser,");
    console.log("dann Rechtsklick → Seitenquelltext anzeigen → suche nach 'media.trinkgut.de'");
    console.log("und teile die gefundenen Bild-URLs hier.");
  }
}

main().catch(console.error);
