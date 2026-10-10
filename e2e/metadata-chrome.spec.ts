import {
  expect,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { test } from "./test-fixtures";
import type { HomepageContent } from "../lib/homepage-content";

const PRODUCTION_ORIGIN = "https://trinkgut-jammers.de";
const HOME_TITLE = "Goch schenkt ein. | Trinkgut Jammers";
const HOME_DESCRIPTION =
  "Persönliche Beratung, Partybedarf und Vermietung bei Trinkgut Jammers, Jurgensstraße 20 in Goch.";
const HOME_OG_IMAGE =
  "https://trinkgut-jammers.de/images/home/cinematic/og-home.jpg";
const NL_TITLE = "Jouw drankenadres in Goch | Trinkgut Jammers";
const NL_DESCRIPTION =
  "Bekijk de actuele folders van Trinkgut Jammers, Jurgensstraße 20 in Goch. Persoonlijk advies, feestbenodigdheden en verhuur. Plan je bezoek: ma–za 08:00–20:00 uur.";

const EXPECTED_LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LiquorStore",
  "@id": "https://trinkgut-jammers.de/#market",
  name: "Trinkgut Jammers",
  legalName: "Getränkesupermarkt Jammers e.K.",
  url: "https://trinkgut-jammers.de",
  telephone: "+49 2823 418707",
  email: "jammers-goch@trinkgut.de",
  owner: { "@type": "Person", name: "Nikolaos Jammers" },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jurgensstraße 20",
    postalCode: "47574",
    addressLocality: "Goch",
    addressCountry: "DE",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "08:00",
      closes: "20:00",
    },
  ],
  sameAs: ["https://www.instagram.com/trinkgutjammers_goch/"],
};

const RETIRED_CHROME_SENTINELS = {
  // The rental page legitimately links to its cart using "Warenkorb öffnen".
  // This marker identifies the retired header itself, not shared link copy.
  Header: "glass-header",
  Footer: "data-legacy-footer",
  WhatsAppButton: "WhatsApp Chat",
} as const;

const DRAWER_SENTINELS = {
  CartDrawer: "Deine Anfrageliste ist leer.",
  WishlistDrawer: "Dein Merkzettel ist leer",
} as const;

type ScriptObservation = {
  page: Page;
  bodies: Map<string, string>;
  requestedUrls: Set<string>;
  runtimeIssues: string[];
  waitForIdle: () => Promise<void>;
};

async function openRealProductResults(page: Page) {
  await page.goto("/finder");
  await page.getByRole("button", { name: /Bierfinder/ }).click();
  for (const name of ["Pils – herb & frisch", "Keine Präferenz", "Feierabendbier"]) await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("[data-product-card]").first()).toBeVisible();
}

async function expectBrands(page: Page) {
  for (const name of ["Pralle Kirsche", "Dicke Nüsse", "Süsse Sünde", "Caramello", "Schwarzer Teufel", "Weisser Engel"]) {
    await expect(page.locator("#eigenmarken ul").getByRole("link", { name, exact: true })).toHaveAttribute("href", "/eigenmarke");
  }
  const originals = page.locator("#eigenmarken figure img"); await expect(originals).toHaveCount(3);
  for (const image of await originals.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveCSS("object-fit", "contain");
    const ratio = await image.evaluate((node: HTMLImageElement) => ({ actual: node.clientWidth / node.clientHeight, original: node.naturalWidth / node.naturalHeight }));
    expect(ratio.actual).toBeCloseTo(ratio.original, 2);
  }
}

async function expectCurrentPublication(page: Page) {
  const response = await page.request.get(new URL("/api/content/current", page.url()).href);
  expect(response.ok()).toBe(true);
  const content: HomepageContent = await response.json();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  expect(new Date(content.generatedAt).valueOf()).toBeGreaterThan(Date.now() - 60_000);
  await expect(page.locator("#aktuell h2")).toHaveText(/Deine Woche\.\s*Ein guter Einkauf\./);
  for (const [flyer, selector] of [[content.flyer, "[data-current-flyer]"], [content.nlFlyer, "[data-current-nl-flyer]"]] as const) {
    const card = page.locator(selector);
    if (!flyer) { await expect(card).toHaveCount(0); continue; }
    expect(flyer.validFrom <= today && today <= flyer.validTo).toBe(true);
    await expect(card.getByRole("heading", { level: 3 })).toHaveText(flyer.title);
    await expect(card.locator(`a[href="${flyer.pdfUrl}"]`)).toHaveCount(1);
    await expect(card.locator("img")).toHaveAttribute("src", new RegExp(encodeURIComponent(flyer.coverUrl).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    const from = flyer.validFrom.split("-").reverse(), to = flyer.validTo.split("-").reverse();
    const range = flyer.validFrom === flyer.validTo ? from.join(".") : from[1] === to[1] && from[2] === to[2] ? `${from[0]}.–${to.join(".")}` : from[2] === to[2] ? `${from[0]}.${from[1]}.–${to.join(".")}` : `${from.join(".")}–${to.join(".")}`;
    await expect(card).toContainText(range);
    await expect(card).toContainText(selector === "[data-current-flyer]" ? `${flyer.pageCount} ${flyer.pageCount === 1 ? "Seite" : "Seiten"}` : "1 pagina");
  }
  if (!content.flyer) await expect(page.locator("[data-current-fallback]")).toContainText(content.fallbackMessage ?? "Der nächste Handzettel wird vorbereitet.");
  else await expect(page.locator("[data-current-fallback]")).toHaveCount(0);
  for (const selector of ["[data-current-event]", "[data-action-current]"]) {
    if (!content.event) { await expect(page.locator(selector)).toHaveCount(0); continue; }
    expect(content.event.validFrom <= today && today <= content.event.validTo).toBe(true);
    await expect(page.locator(selector)).toContainText(content.event.summary);
    await expect(page.locator(selector).getByRole("heading", { level: 3 })).toHaveText(content.event.title);
    await expect(page.locator(selector).getByRole("link", { name: "Quelle öffnen", exact: true })).toHaveAttribute("href", content.event.sourceUrl);
  }
}

function localUrl(baseURL: string | undefined, pathname: string): string {
  if (!baseURL) throw new Error("Playwright baseURL is required");
  return new URL(pathname, baseURL).href;
}

function collectRuntimeIssues(page: Page): string[] {
  const issues: string[] = [];

  page.on("console", (message) => {
    const text = message.text();
    if (
      message.type() === "error" ||
      (message.type() === "warning" && /hydrat(?:e|ed|ion)|did not match/i.test(text))
    ) {
      issues.push(`console.${message.type()}: ${text}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));

  return issues;
}

function escapedVariants(value: string): string[] {
  const unicode = value.replace(/[^\x20-\x7e]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  const hexadecimal = value.replace(/[^\x20-\x7e]/g, (character) =>
    `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
  );
  return [
    value,
    unicode,
    hexadecimal,
    unicode.replaceAll("\\", "\\\\"),
    hexadecimal.replaceAll("\\", "\\\\"),
  ];
}

function containsSentinel(body: string, sentinel: string): boolean {
  const lowerBody = body.toLowerCase();
  return escapedVariants(sentinel).some((variant) =>
    lowerBody.includes(variant.toLowerCase()),
  );
}

async function observeScripts(
  context: BrowserContext,
  url: string,
): Promise<ScriptObservation> {
  const page = await context.newPage();
  const bodies = new Map<string, string>();
  const requestedUrls = new Set<string>();
  const pendingBodies = new Set<Promise<void>>();
  const runtimeIssues = collectRuntimeIssues(page);

  page.on("response", (response) => {
    const responseUrl = response.url();
    if (
      response.request().resourceType() !== "script" &&
      !/\.(?:js|mjs)(?:\?|$)/i.test(responseUrl)
    ) {
      return;
    }

    requestedUrls.add(responseUrl);
    const pending = response
      .text()
      .then((body) => {
        bodies.set(responseUrl, body);
      })
      .catch(() => undefined)
      .then(() => undefined);
    pendingBodies.add(pending);
    void pending.finally(() => pendingBodies.delete(pending));
  });

  const waitForIdle = async () => {
    await page.waitForLoadState("networkidle");
    await expect.poll(() => pendingBodies.size, { timeout: 10_000 }).toBe(0);
  };

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await waitForIdle();

  return { page, bodies, requestedUrls, runtimeIssues, waitForIdle };
}

async function expectAlternate(
  page: Page,
  hreflang: "de" | "nl",
  href: string,
): Promise<void> {
  const alternate = page.locator(
    `link[rel="alternate"][hreflang="${hreflang}"]`,
  );
  await expect(alternate).toHaveCount(1);
  await expectAbsoluteUrlAttribute(alternate, "href", href);
}

async function expectAbsoluteUrlAttribute(
  locator: Locator,
  attribute: "content" | "href",
  expected: string,
): Promise<void> {
  const rawValue = await locator.getAttribute(attribute);
  expect(rawValue).not.toBeNull();
  expect(new URL(rawValue!).href).toBe(expected);

  const expectedUrl = new URL(expected);
  if (expectedUrl.pathname !== "/" || expectedUrl.search || expectedUrl.hash) {
    expect(rawValue).toBe(expected);
  }
}

async function newIsolatedContext(browser: Browser): Promise<BrowserContext> {
  const context=await browser.newContext({ viewport: { width: 1280, height: 900 } });
  return context;
}

async function expectPublicChrome(page: Page): Promise<void> {
  await expect(page.locator("[data-cinematic-header]")).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.locator(".glass-header, [data-legacy-footer]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Warenkorb öffnen", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Chat öffnen", exact: true })).toHaveCount(0);
  await expect(page.locator("footer#kontakt")).toContainText("Jurgensstraße 20");
  await expect(page.locator("footer#kontakt")).toContainText("Mo–Sa 08:00–20:00 Uhr");
  for (const [label, href] of [
    ["Anfrageliste", "/warenkorb"],
    ["Merkzettel", "/merkzettel"],
    ["Cocktail-Rezepte", "/cocktails"],
    ["Party planen", "/partyplaner"],
  ]) {
    await expect(page.locator("footer").getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
  }
  const nav = page.getByRole("navigation", { name: "Hauptnavigation", includeHidden: true });
  for (const [label, href] of [
    ["Angebote", "/angebote"],
    ["Sortiment", "/produkte"],
    ["Party & Miete", "/vermietung"],
    ["Eigenmarken", "/eigenmarke"],
    ["Gewinnspiele", "/gewinnspiel"],
    ["Unser Team", "/galerie"],
    ["Offene Stellen & Bewerbung", "/bewerbung"],
    ["Dein Besuch", "/kontakt"],
  ]) {
    await expect(nav.getByRole("link", { name: label, exact: true, includeHidden: true })).toHaveAttribute("href", href);
  }
  await expect(nav.locator('a[href^="#"]')).toHaveCount(0);
}

async function expectNaturalPeopleStory(page: Page): Promise<void> {
  const details = page.locator("#menschen details");
  const initiallyOpen = await details.evaluate(node => (node as HTMLDetailsElement).open);
  if (!initiallyOpen) await details.locator("summary").click();
  await expect(page.locator("#menschen")).toContainText("Unser neues Teamfoto folgt");
  await expect(page.locator('#menschen img[src*="team-group"], #menschen img[src*="team-justin"], #menschen img[src*="team-harpe"]')).toHaveCount(0);
  await expect(page.locator("#menschen figure")).toHaveCount(8);
  await expect(page.locator("#menschen figcaption")).toHaveText([
    "Niko", "Sven", "Jasmin", "Jan Niklas", "Hanna",
    "Henri", "Hannah",
  ]);
  const photos = page.locator("#menschen figure img");
  await expect(photos).toHaveCount(8);
  for (const [index, source] of ["brand-logo", "team-niko", "team-sven", "team-jasmin", "team-jan-niklas", "team-hanna.", "team-henri", "team-hannah"].entries()) {
    await expect(photos.nth(index)).toHaveAttribute("src", new RegExp(source.replaceAll(".", "\\.")));
  }
  await expect(page.locator('#menschen img[src*="team-gabriella"]')).toHaveCount(0);
  for (const image of await photos.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveCSS("object-fit", "contain");
    const dimensions = await image.evaluate((element: HTMLImageElement) => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      natural: element.naturalWidth / element.naturalHeight,
    }));
    // Next's density-corrected intrinsic dimensions round to whole pixels.
    // Keep the full-image proportion contract within one rendered pixel.
    expect(Math.abs(dimensions.height - dimensions.width / dimensions.natural)).toBeLessThanOrEqual(1);
  }
  if (!initiallyOpen) await details.locator("summary").click();
}

test("[product-contract] binds exact homepage metadata and the local OG JPEG", async ({
  page,
  baseURL,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(HOME_TITLE);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    HOME_DESCRIPTION,
  );
  await expectAbsoluteUrlAttribute(
    page.locator('link[rel="canonical"]'),
    "href",
    `${PRODUCTION_ORIGIN}/`,
  );
  await expectAlternate(page, "de", `${PRODUCTION_ORIGIN}/`);
  await expectAlternate(page, "nl", `${PRODUCTION_ORIGIN}/nl`);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    HOME_TITLE,
  );
  await expectAbsoluteUrlAttribute(
    page.locator('meta[property="og:url"]'),
    "content",
    `${PRODUCTION_ORIGIN}/`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    HOME_OG_IMAGE,
  );

  const parsedOgImage = new URL(HOME_OG_IMAGE);
  expect(parsedOgImage.origin).toBe(PRODUCTION_ORIGIN);
  const localOgResponse = await page.request.get(
    localUrl(baseURL, parsedOgImage.pathname),
  );
  expect(localOgResponse.status()).toBe(200);
  expect(localOgResponse.headers()["content-type"]).toMatch(/^image\/jpeg\b/i);
  await expect(page.locator("[data-cinematic-root]")).toHaveCount(1);
  await expect(page.locator("[data-cinematic-handoff]")).toHaveCount(0);
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] renders one final landmark tree and ordered server sections", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  await expect(page.locator("[data-cinematic-root]")).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.locator('[id="main-content"]')).toHaveCount(1);
  await expect(
    page.getByRole("heading", { level: 1, name: "Goch schenkt ein." }),
  ).toHaveCount(1);
  await expect(page.locator("main header, main footer")).toHaveCount(0);
  await expectPublicChrome(page);

  const sectionOrder = await page
    .locator(
      "main#main-content > section, main#main-content > .pin-spacer > section",
    )
    .evaluateAll((sections) =>
      sections.map((section) => {
        if (section.getAttribute("data-hero") === "cinematic") return "hero";
        if (section.id) return section.id;
        if (section.getAttribute("aria-labelledby") === "instagram-title") {
          return "instagram";
        }
        return "unknown";
      }),
    );
  expect(sectionOrder).toEqual([
    "hero",
    "aktuell",
    "service",
    "sortiment",
    "eigenmarken",
    "aktionen",
    "menschen",
    "grailbid",
    "instagram",
  ]);

  await expect(page.getByText("Vom ersten Anstoßen bis zur großen Runde. Alles für deinen Anlass unter einem Dach.", { exact: true })).toBeVisible();
  await expectCurrentPublication(page);
  await expect(page.getByRole("heading", { name: "Menschen hinter Jammers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Du hast etwas vor. Wir sind dabei." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sechs eigene Charaktere." })).toBeVisible();
  await expectNaturalPeopleStory(page);
  await expect(page.locator("#eigenmarken figure")).toHaveCount(3);
  await expect(page.locator("#eigenmarken figcaption")).toHaveText([
    /Pralle Kirsche/,
    /Schwarzer Teufel/,
    /Caramello/,
  ]);
  await expect(page.getByText("Marktleben, neue Produkte, Verkostungen und Gewinnspiele – direkt von unserem Team. Folge uns und bleib dabei.", { exact: true })).toBeVisible();
  await expect(page.locator("footer#kontakt")).toContainText("Jurgensstraße 20");
  await expect(page.locator("footer#kontakt")).toContainText("Mo–Sa 08:00–20:00 Uhr");
  await expectBrands(page);

  const fragments = page.locator('a[href^="#"]:visible');
  for (let index = 0; index < (await fragments.count()); index += 1) {
    const href = await fragments.nth(index).getAttribute("href");
    expect(href).toMatch(/^#[A-Za-z][\w-]*$/);
    await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1);
  }
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] keeps the complete active homepage server-readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });

  try {
    const page = await context.newPage();
    const response = await page.goto(localUrl(baseURL, "/"), {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);

    await expect(page.locator("[data-cinematic-root]")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.locator("main#main-content")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: "Goch schenkt ein." })).toHaveCount(1);

    const sectionOrder = await page
      .locator("main#main-content > section")
      .evaluateAll((sections) =>
        sections.map((section) =>
          section.getAttribute("data-hero") === "cinematic"
            ? "hero"
            : section.id ||
              (section.getAttribute("aria-labelledby") === "instagram-title"
                ? "instagram"
                : "unknown"),
        ),
      );
    expect(sectionOrder).toEqual([
      "hero",
      "aktuell",
      "service",
      "sortiment",
      "eigenmarken",
      "aktionen",
      "menschen",
      "grailbid",
      "instagram",
    ]);

    for (const exactText of [
      "Vom ersten Anstoßen bis zur großen Runde. Alles für deinen Anlass unter einem Dach.",
      "Menschen hinter Jammers",
      "Pralle Kirsche",
      "Schwarzer Teufel",
      "Caramello",
      "Marktleben, neue Produkte, Verkostungen und Gewinnspiele – direkt von unserem Team. Folge uns und bleib dabei.",
    ]) {
      await expect(page.getByText(exactText, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Du hast etwas vor. Wir sind dabei.", exact: true })).toBeVisible();
    for (const text of ["Jurgensstraße 20", "Mo–Sa 08:00–20:00 Uhr"]) await expect(page.locator("footer#kontakt").getByText(text, { exact: true })).toBeVisible();
    await expectPublicChrome(page);
    await expectCurrentPublication(page);
    await expectNaturalPeopleStory(page);
    await expect(page.locator("#eigenmarken figure")).toHaveCount(3);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expectBrands(page);
  } finally {
    await context.close();
  }
});

test("[product-contract] renders one exact serializer-backed LocalBusiness script", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  const scripts = page.locator('script[type="application/ld+json"]');
  await expect(scripts).toHaveCount(1);
  const jsonLd = JSON.parse((await scripts.textContent()) ?? "null");
  expect(jsonLd).toEqual(EXPECTED_LOCAL_BUSINESS);

  const rawHtml = (await response?.text()) ?? "";
  const rawJsonLdSegments = [
    ...rawHtml.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  expect(rawJsonLdSegments).toHaveLength(1);
  const rawJsonLdPayload = rawJsonLdSegments[0][1];
  expect(rawJsonLdPayload).not.toContain("<");
  expect(rawJsonLdPayload).not.toContain("</script><script>");
  expect(JSON.parse(rawJsonLdPayload)).toEqual(EXPECTED_LOCAL_BUSINESS);
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] keeps homepage metadata off child routes and preserves NL metadata", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);

  for (const pathname of ["/kontakt", "/angebote"]) {
    const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    const childCanonicals = await page
      .locator('link[rel="canonical"]')
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href")).filter(Boolean),
      );
    expect(childCanonicals.map((href) => new URL(href!).href)).not.toContain(
      `${PRODUCTION_ORIGIN}/`,
    );
    await expect(
      page.locator(
        'meta[property="og:image"][content*="/images/home/cinematic/og-home.jpg"]',
      ),
    ).toHaveCount(0);
  }

  const nlResponse = await page.goto("/nl", { waitUntil: "domcontentloaded" });
  expect(nlResponse?.status()).toBe(200);
  await expect(page).toHaveTitle(NL_TITLE);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    NL_DESCRIPTION,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    NL_TITLE,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    NL_DESCRIPTION,
  );
  await expectAbsoluteUrlAttribute(
    page.locator('link[rel="canonical"]'),
    "href",
    `${PRODUCTION_ORIGIN}/nl`,
  );
  await expectAlternate(page, "de", `${PRODUCTION_ORIGIN}/`);
  await expectAlternate(page, "nl", `${PRODUCTION_ORIGIN}/nl`);
  await expect(page.getByRole("link", { name: /Aanbiedingen/ })).toBeVisible();
  await expect(page.locator(".glass-header")).toHaveCount(0);
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] excludes retired chrome chunks everywhere and keeps drawers off the homepage", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(60_000);
  const drawerScriptUrls = new Set<string>();

  for (const pathname of ["/angebote", "/vermietung", "/galerie", "/"]) {
    const context = await newIsolatedContext(browser);
    try {
      const observation = await observeScripts(context, localUrl(baseURL, pathname));
      await expectPublicChrome(observation.page);
      await expect(observation.page.getByRole("dialog")).toHaveCount(0);

      // Entering the viewport must not eagerly prefetch retired chrome.
      for (const link of await observation.page.locator('a[href^="/"]:visible').all()) {
        await link.scrollIntoViewIfNeeded();
      }
      await observation.waitForIdle();

      expect(observation.requestedUrls.size).toBeGreaterThan(0);
      for (const [moduleName, sentinel] of Object.entries(RETIRED_CHROME_SENTINELS)) {
        expect(
          [...observation.bodies.values()].some((body) => containsSentinel(body, sentinel)),
          moduleName + " retired chunk leaked into " + pathname,
        ).toBe(false);
      }

      for (const [moduleName, sentinel] of Object.entries(DRAWER_SENTINELS)) {
        const scriptUrls = [...observation.bodies.entries()]
          .filter(([, body]) => containsSentinel(body, sentinel))
          .map(([url]) => url);
        if (pathname === "/") {
          expect(scriptUrls, moduleName + " should remain lazy off the homepage").toEqual([]);
        } else {
          expect(scriptUrls.length, moduleName + " remains available on " + pathname).toBeGreaterThan(0);
          for (const url of scriptUrls) drawerScriptUrls.add(url);
        }
      }
      if (pathname === "/") {
        for (const url of drawerScriptUrls) {
          expect(observation.requestedUrls.has(url), "homepage requested an off-root drawer chunk").toBe(false);
        }
      }
      expect(observation.runtimeIssues).toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test("[product-contract] keeps the new chrome on direct routes and client navigation", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  for (const pathname of ["/", "/angebote", "/produkte", "/vermietung", "/gewinnspiel", "/galerie"]) {
    const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expectPublicChrome(page);
  }

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (const [label, pathname] of [
    ["Party & Miete", "/vermietung"],
    ["Gewinnspiele", "/gewinnspiel"],
    ["Unser Team", "/galerie"],
  ]) {
    const navigation = page.getByRole("navigation", { name: "Hauptnavigation" });
    if (label === "Unser Team" || label === "Gewinnspiele") {
      await navigation.locator("summary").filter({ hasText: "Jammers entdecken" }).click();
    }
    await navigation.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(pathname + "$"));
    await expectPublicChrome(page);
    await expect(page.locator("main#main-content")).toHaveCount(1);
  }
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] reaches inquiry and wishlist pages and preserves individual and bulk controls", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/angebote", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expectPublicChrome(page);
  await expect(page.locator("footer").getByRole("link", { name: "Per WhatsApp schreiben", exact: true })).toBeVisible();

  await page.locator("footer").getByRole("link", { name: "Anfrageliste", exact: true }).click();
  await expect(page).toHaveURL(/\/warenkorb$/);
  await expect(page.getByRole("heading", { level: 1, name: "Deine Anfrageliste ist leer" })).toBeVisible();
  await page.getByRole("link", { name: "Produkte entdecken" }).click();
  await expect(page).toHaveURL(/\/produkte$/);
  await expectPublicChrome(page);

  await openRealProductResults(page);
  const card = page.locator("[data-product-card]").first();
  const productName = (await card.getByRole("heading", { level: 2 }).textContent())!.trim();
  const productHref = await card.locator('a[href^="/produkte/"]').first().getAttribute("href");
  expect(productName.length).toBeGreaterThan(0);
  expect(productHref).toMatch(/^\/produkte\/[\w-]+$/);

  await card.getByRole("button", { name: "Zum Merkzettel", exact: true }).click();
  await expect(card.getByRole("button", { name: "Vom Merkzettel entfernen", exact: true })).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: "Anfragen", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Deine Anfrageliste", exact: true });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText(productName);
  await drawer.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Anfragen", exact: true })).toBeFocused();

  await page.locator("footer").getByRole("link", { name: "Anfrageliste", exact: true }).click();
  await expect(page).toHaveURL(/\/warenkorb$/);
  await expect(page.getByRole("heading", { level: 1, name: "Deine Anfrageliste", exact: true })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: productName, exact: true })).toHaveAttribute("href", productHref!);
  const increase = page.getByRole("button", { name: "Menge für " + productName + " erhöhen", exact: true });
  const count = increase.locator("..").locator("span");
  await expect(count).toHaveText("1");
  await increase.click();
  await expect(count).toHaveText("2");
  await page.getByRole("button", { name: "Menge für " + productName + " verringern", exact: true }).click();
  await expect(count).toHaveText("1");
  await expect(page.getByRole("link", { name: "Unverbindlich anfragen", exact: true })).toHaveAttribute("href", "/checkout");
  await page.getByRole("button", { name: "Entfernen", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Deine Anfrageliste ist leer" })).toBeVisible();

  await page.locator("footer").getByRole("link", { name: "Merkzettel", exact: true }).click();
  await expect(page).toHaveURL(/\/merkzettel$/);
  await expectPublicChrome(page);
  await expect(page.getByRole("heading", { level: 1, name: "Merkzettel", exact: true })).toBeVisible();
  await expect(page.locator("[data-product-card]")).toHaveCount(1);
  await expect(page.locator("[data-product-card]").getByRole("heading", { level: 2 })).toHaveText(productName);
  await page.getByRole("button", { name: "Vom Merkzettel entfernen", exact: true }).click();
  await expect(page.locator("[data-product-card]")).toHaveCount(0);
  await expect(page.getByText("Noch keine Getränke vorgemerkt.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sortiment entdecken", exact: true })).toHaveAttribute("href", "/produkte");

  await page.getByRole("link", { name: "Sortiment entdecken", exact: true }).click();
  await expect(page).toHaveURL(/\/produkte$/);
  await openRealProductResults(page);
  await page.locator("[data-product-card]").first().getByRole("button", { name: "Zum Merkzettel", exact: true }).click();
  await page.locator("footer").getByRole("link", { name: "Merkzettel", exact: true }).click();
  await expect(page).toHaveURL(/\/merkzettel$/);
  await page.getByRole("button", { name: "Alle zur Anfrageliste (1)", exact: true }).click();
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText(productName);
  await drawer.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("zur unverbindlichen Anfrageliste hinzugefügt");
  await page.getByRole("button", { name: "Merkzettel leeren", exact: true }).click();
  await expect(page.locator("[data-product-card]")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Dein Merkzettel wurde geleert.");
  await page.locator("footer").getByRole("link", { name: "Anfrageliste", exact: true }).click();
  await expect(page).toHaveURL(/\/warenkorb$/);
  await expect(page.locator("main").getByRole("link", { name: productName, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Liste leeren", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Deine Anfrageliste ist leer" })).toBeVisible();
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] keeps all seven approved portraits and the logo placeholder natural on desktop and mobile", async ({ page }) => {
  const runtimeIssues = collectRuntimeIssues(page);
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expectNaturalPeopleStory(page);
  }
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] avoids fake cookie consent and retains runtime diagnostics", async ({
  page,
}) => {
  const runtimeIssues = collectRuntimeIssues(page);
  await page.addInitScript(() => localStorage.clear());

  for (const pathname of ["/", "/angebote"]) {
    const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    expect(
      await page.evaluate(() => localStorage.getItem("cookie-consent")),
    ).toBeNull();
    await expect(page.getByText("Wir nutzen Cookies", { exact: true })).toHaveCount(0);
  }
  expect(runtimeIssues).toEqual([]);
});
