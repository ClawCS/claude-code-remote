import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
vi.mock("next/link", async () => {
  const React = await import("react");
  return { default: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) };
});
import AssortmentSection from "@/components/cinematic/AssortmentSection";
import MarketDiscoveries from "@/components/cinematic/MarketDiscoveries";
import MarktlebenPage from "@/app/marktleben/page";
import GeschenkideenPage from "@/app/geschenkideen/page";
import EigenmarkePage from "@/app/eigenmarke/page";
import RegionaleSpirituosenPage from "@/app/regionale-spirituosen/page";

test("places local market and gift motifs behind their own relevant rubric links", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<AssortmentSection />));
  expect(html).toContain("/images/editorial/canva/verkostung-moritz-fiege.webp");
  expect(html).toContain("/images/editorial/canva/gift-basket.webp");
  expect(html).toContain('href="/geschenkideen"');
  expect(html).toContain('href="/regionale-spirituosen"');
  expect(html).toContain('href="/marktleben"');
  expect(html).not.toContain("almdudler-market");
  expect(html).not.toContain("cdn.canva.com");
  expect(html).not.toContain('href="/#');
});

test("keeps the homepage discoveries bounded and pairs each photo with its matching destination", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<MarketDiscoveries />));
  const articles = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].map(([, article]) => article);
  expect(articles).toHaveLength(3);
  expect(html).not.toContain("<figcaption");
  for (const [source, destination] of [
    ["/images/editorial/canva/verkostung-moritz-fiege.webp", "/marktleben"],
    ["/images/editorial/canva/gift-basket.webp", "/geschenkideen"],
    ["/images/editorial/canva/regional-tante-dele.webp", "/regionale-spirituosen"],
  ]) {
    const article = articles.find(item => item.includes(source));
    expect(article, `photo card for ${source}`).toBeDefined();
    expect(article).toContain(`href="${destination}"`);
  }
});

test("keeps market groups and approved photos without decorative captions or the cleaning photo", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<MarktlebenPage />));
  for (const heading of ["Menschen & Marktmomente", "Aufbauten & Entdeckungen", "Mehr als Getränke"]) {
    expect(html).toMatch(new RegExp(`<h2[^>]*>${heading.replaceAll("&", "&amp;")}<\\/h2>`));
  }
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
  expect(images).toHaveLength(20);
  for (const filename of ["safari-display.webp", "salitos-market.webp", "verkostung.webp", "desperados-detail.webp", "baileys-aufbau.webp", "regionaler-hofaufbau.webp", "grillbegleiter.webp"]) {
    expect(images.some(image => image.includes(filename)), filename).toBe(true);
  }
  for (const image of images) expect(image).toContain('loading="lazy"');
  expect(html).not.toContain("<figcaption");
  expect(html).not.toMatch(/Rückblick|Mit Herz|mit anpacken|niko-market-life|Reinigungshandschuh|Sprühflasche|hinter die Kulissen mit Niko/i);
  expect(html).toMatch(/sichtbare Preise[^<]*nicht aktuell/);
  expect(html).not.toMatch(/Justin|Gabelstapler|forklift|googleusercontent|maps\.google/i);
});

test("places all four approved portfolio people photos in their relevant market groups", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<MarktlebenPage />));
  const tastings = html.match(/<section[^>]*aria-labelledby="menschen-marktmomente"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  const displays = html.match(/<section[^>]*aria-labelledby="aufbauten-entdeckungen"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  for (const [filename, height] of [
    ["verkostung-il-padrino.webp", 976],
    ["verkostung-moritz-fiege.webp", 976],
    ["likoer-verkostung.webp", 1007],
  ] as const) {
    const image = tastings?.match(/<img\b[^>]*>/g)?.find(item => item.includes(filename));
    expect(image, filename).toBeDefined();
    expect(image).toContain('width="660"');
    expect(image).toContain(`height="${height}"`);
    expect(image).toContain('loading="lazy"');
    expect(displays).not.toContain(filename);
  }
  const almdudler = displays?.match(/<article\b[^>]*>[\s\S]*?<\/article>/g)?.find(item => item.includes("almdudler-aufbau.webp"));
  expect(almdudler).toContain('width="660"');
  expect(almdudler).toContain('height="899"');
  expect(almdudler).toContain("keine aktuelle Gewinnspielankündigung");
  expect(almdudler).not.toMatch(/Jetzt gewinnen|Jetzt teilnehmen|26,99|Letzte Chance/);
  expect(tastings).not.toContain("almdudler-aufbau.webp");
  expect(html).not.toMatch(/pending-person-clearance|Portfolio Messe|DAGykk|export-download\.canva/);
});

test("places the price-free portfolio display with market discoveries, not current offers", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<MarktlebenPage />));
  const section = html.match(/<section[^>]*aria-labelledby="aufbauten-entdeckungen"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  expect(section).toContain("/images/editorial/canva/safari-display.webp");
  expect(section).not.toMatch(/8[,.]88|Jetzt kaufen|aktueller Preis/);
  expect(html).not.toMatch(/Portfolio Messe|DAGykk|export-download\.canva/);
});

test("adds greeting-card photos to gift ideas without replacing the gift-basket introduction", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<GeschenkideenPage />));
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image).filter(image => !image.includes('aria-hidden="true"'));
  expect(images).toHaveLength(3);
  expect(images[0]).toContain("/images/editorial/canva/gift-basket.webp");
  for (const filename of ["grusskarten-detail.webp", "karten-mit-charakter.webp"]) {
    const image = images.find(item => item.includes(`/images/editorial/google/${filename}`));
    expect(image, filename).toBeDefined();
    expect(image).toContain('loading="lazy"');
  }
  expect(html).toContain('href="/kontakt"');
  expect(html).not.toContain("<figcaption");
  expect(html).not.toMatch(/Rückblick.*2025/);
  expect(html).toContain("Die aktuell möglichen Produkte und Zusammenstellungen können davon abweichen.");
});

test.each([
  ["own brands", EigenmarkePage, 7],
  ["regional specialties", RegionaleSpirituosenPage, 3],
] as const)("retains %s images without decorative captions", (_name, Page, count) => {
  const html = renderToStaticMarkup(<Page />);
  expect([...html.matchAll(/<img\b[^>]*>/g)]).toHaveLength(count);
  expect(html).not.toContain("<figcaption");
});
