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

test("places local market and gift motifs behind their own relevant rubric links", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<AssortmentSection />));
  expect(html).toContain("/images/editorial/google/verkostung.webp");
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
  for (const [source, destination] of [
    ["/images/editorial/google/verkostung.webp", "/marktleben"],
    ["/images/editorial/canva/gift-basket.webp", "/geschenkideen"],
    ["/images/editorial/canva/regional-tante-dele.webp", "/regionale-spirituosen"],
  ]) {
    const article = articles.find(item => item.includes(source));
    expect(article, `photo card for ${source}`).toBeDefined();
    expect(article).toContain(`href="${destination}"`);
  }
});

test("groups dated market moments while retaining the existing market photos and excluding the forklift photo", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<MarktlebenPage />));
  for (const heading of ["Menschen & Marktmomente", "Aufbauten & Entdeckungen", "Mehr als Getränke"]) {
    expect(html).toMatch(new RegExp(`<h2[^>]*>${heading.replaceAll("&", "&amp;")}<\\/h2>`));
  }
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
  expect(images).toHaveLength(7);
  for (const filename of ["niko-market-life.webp", "salitos-market.webp", "verkostung.webp", "desperados-detail.webp", "baileys-aufbau.webp", "regionaler-hofaufbau.webp", "grillbegleiter.webp"]) {
    expect(images.some(image => image.includes(filename)), filename).toBe(true);
  }
  for (const image of images) expect(image).toContain('loading="lazy"');
  expect(html).toContain("Rückblicke aus 2025");
  expect(html).toMatch(/sichtbare Preise[^<]*nicht aktuell/);
  expect(html).not.toMatch(/Justin|Gabelstapler|forklift|googleusercontent|maps\.google/i);
});

test("adds greeting-card photos to gift ideas without replacing the gift-basket introduction", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<GeschenkideenPage />));
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
  expect(images).toHaveLength(3);
  expect(images[0]).toContain("/images/editorial/canva/gift-basket.webp");
  for (const filename of ["grusskarten-detail.webp", "karten-mit-charakter.webp"]) {
    const image = images.find(item => item.includes(`/images/editorial/google/${filename}`));
    expect(image, filename).toBeDefined();
    expect(image).toContain('loading="lazy"');
  }
  expect(html).toContain('href="/kontakt"');
});
