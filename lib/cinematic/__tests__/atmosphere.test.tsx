import { build } from "esbuild";
import { chromium, type Browser } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import RouteContent from "@/components/RouteContent";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/editorial.module.css";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

const route = vi.hoisted(() => ({ pathname: "/" }));
// Only the framework URL source is replaced; the route wrapper and intro are real.
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

describe("closed presentation route boundary", () => {
  // Over-broad prefix matching would decorate unknown/protected routes; returning
  // product/category data instead of a mood would break the consumer attribute.
  test.each([
    ["/", "neutral"], ["/nl", "nl"], ["/angebote", "offers"], ["/handzettel", "offers"],
    ["/produkte", "offers"], ["/kategorie/bier", "beer"], ["/kategorie/alkoholfrei", "fresh"],
    ["/kategorie/wein", "wine"], ["/kategorie/sekt", "wine"], ["/kategorie/spirituosen", "spirits"],
    ["/kategorie/lebensmittel", "neutral"], ["/eigenmarke", "spirits"], ["/regionale-spirituosen", "spirits"],
    ["/vermietung", "party"], ["/partyplaner", "party"], ["/partyspiele", "party"],
    ["/akademie", "learning"], ["/akademie/zertifikate", "learning"], ["/cocktails", "learning"],
    ["/marktleben", "people"], ["/galerie", "people"], ["/karriere", "people"],
    ["/impressum", "neutral"], ["/datenschutz", "neutral"], ["/agb", "neutral"],
    ["/checkout", "neutral"], ["/warenkorb", "neutral"], ["/bewerbung/verwaltung", "neutral"],
    ["/markt/bestellungen", "neutral"], ["/test-fixtures/weekly-offers", "neutral"],
    ["/produkte/historical-product", "neutral"], ["/angebote/private", "neutral"],
    ["/kategorie/unknown", "neutral"], ["/nl-private", "neutral"], ["/unknown", "neutral"],
    ["/constructor", "neutral"], ["/toString", "neutral"],
  ])("exposes only a presentation mood for %s", (pathname, theme) => {
    route.pathname = pathname;
    const html = renderToStaticMarkup(<RouteContent><p>Unchanged route content</p></RouteContent>);
    expect(html).toContain(`data-atmosphere="${theme}"`);
    expect(html).toContain("<p>Unchanged route content</p>");
    if (["/", "/nl"].includes(pathname)) {
      expect(html).toMatch(/^<div\b/);
      expect(html).not.toContain("<main");
    } else {
      expect(html).toMatch(/^<main\b/);
      expect(html).toContain('id="main-content"');
      expect(html).toContain('tabindex="-1"');
      expect(html).toContain('class="flex-1 public-subpage"');
    }
  });
});

const intro = <PageIntro theme="beer" mediaFit="contain" title="Getränkespezialitäten entdecken" description="Originale und Informationen bleiben getrennt."
  breadcrumbs={[{ label: "Sortiment", href: "/produkte" }, { label: "Bier" }]}
  media={{ src: "/images/test-portrait.webp", alt: "Freigegebenes Hochformatmotiv", width: 600, height: 900, position: "50% 40%" }}>
  <a href="/kontakt">Besuch planen</a>
</PageIntro>;

test("optional media never replaces the static heading, destination or breadcrumb", () => {
  const html = renderToStaticMarkup(intro);
  expect(html).toContain('data-atmosphere="beer"');
  expect(html).toContain('data-intro-media');
  expect(html).toContain('data-intro-light');
  expect(html).toContain('alt="Freigegebenes Hochformatmotiv"');
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html).toContain("Getränkespezialitäten entdecken");
  expect(html).toContain('href="/produkte"');
  expect(html).toContain('aria-current="page"');
  expect(html).toContain('href="/kontakt"');
  const plain = renderToStaticMarkup(<PageIntro title="Rechtliches" />);
  expect(plain).not.toContain("<img");
  expect(plain).not.toContain("data-atmosphere="); // inherit the route when not overridden
});

let browser: Browser;
let css: string;
let markup: string;
beforeAll(async () => {
  const built = await build({
    stdin: { contents: 'import styles from "./components/editorial/editorial.module.css"; import "./app/public-site.css"; export default styles;', resolveDir: process.cwd(), loader: "ts" },
    bundle: true, write: false, outdir: "/tmp/intro-atmosphere-test", format: "cjs", loader: { ".module.css": "local-css" },
  });
  const output = { exports: {} as { default: Record<string, string> } };
  new Function("module", "exports", built.outputFiles.find(file => file.path.endsWith(".js"))!.text)(output, output.exports);
  const compiled = output.exports.default;
  markup = renderToStaticMarkup(intro).replace(/class="([^"]*)"/g, (_, classes: string) => `class="${classes.split(" ").map(value => {
    const key = Object.keys(compiled).find(key => styles[key] === value);
    return key ? compiled[key] : value;
  }).join(" ")}"`);
  css = built.outputFiles.find(file => file.path.endsWith(".css"))!.text;
  browser = await chromium.launch();
}, 30_000);
afterAll(async () => { await browser?.close(); });

// Cropping originals, overlaying copy on portraits, or making the mood require JS
// would break these observable presentation/accessibility contracts.
test.each([360, 1440])("keeps full media and readable native text separate without JS at %ipx", async width => {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, javaScriptEnabled: false, reducedMotion: "reduce" });
  try {
    await page.route("**/*", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="teal"/></svg>' }));
    const tokens = Object.entries(cinematicTokenStyle).map(([key, value]) => `${key}:${value}`).join(";");
    await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;font-family:sans-serif}${css}</style><main class="public-subpage" data-atmosphere="offers" style="${tokens}">${markup}<section id="facts">Quiet information</section></main>`);
    const media = page.locator("[data-intro-media] img");
    expect(await media.count()).toBe(1);
    const image = await media.boundingBox();
    const title = await page.locator("h1").boundingBox();
    expect(image).not.toBeNull();
    expect(title).not.toBeNull();
    expect(image!.x >= title!.x + title!.width || image!.y >= title!.y + title!.height
      || image!.x + image!.width <= title!.x || image!.y + image!.height <= title!.y).toBe(true);
    expect(await media.evaluate(node => getComputedStyle(node).objectFit)).toBe("contain");
    expect(await media.evaluate(node => getComputedStyle(node).animationName)).toBe("none");
    expect(await page.locator("[data-intro-light]").getAttribute("aria-hidden")).toBe("true");
    expect(await page.locator("[data-intro-light]").evaluate(node => getComputedStyle(node).pointerEvents)).toBe("none");
    expect(await page.locator("h1").isVisible()).toBe(true);
    expect(await page.getByRole("link", { name: "Besuch planen" }).getAttribute("href")).toBe("/kontakt");
    await page.getByRole("link", { name: "Besuch planen" }).focus();
    expect(await page.getByRole("link", { name: "Besuch planen" }).evaluate(node => getComputedStyle(node).outlineStyle)).toBe("solid");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await page.close(); }
});
