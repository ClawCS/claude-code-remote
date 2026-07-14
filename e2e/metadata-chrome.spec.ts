import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";

const PRODUCTION_ORIGIN = "https://trinkgut-jammers.de";
const HOME_TITLE = "Goch schenkt ein. | Trinkgut Jammers";
const HOME_DESCRIPTION =
  "Persönliche Beratung, Partybedarf und Vermietung bei Trinkgut Jammers in der Jurgensstraße 20 in Goch.";
const HOME_OG_IMAGE =
  "https://trinkgut-jammers.de/images/home/cinematic/og-home.jpg";
const NL_TITLE = "Informatie voor Nederlandse klanten | Trinkgut Jammers";
const NL_DESCRIPTION =
  "Persoonlijk advies, feestbenodigdheden en verhuur bij Trinkgut Jammers, Jurgensstraße 20 in Goch. Ma–za 08:00–20:00 uur.";

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

const LEGACY_SENTINELS = {
  Header: "Warenkorb öffnen",
  Footer: "Trinkgut Jammers Goch e.K.",
  CartDrawer: "Dein Warenkorb ist leer.",
  WishlistDrawer: "Dein Merkzettel ist leer",
  WhatsAppButton: "WhatsApp Chat",
  AIAssistant: "Jammers Assistent",
} as const;

type ScriptObservation = {
  page: Page;
  bodies: Map<string, string>;
  requestedUrls: Set<string>;
  runtimeIssues: string[];
  waitForIdle: () => Promise<void>;
};

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
  return browser.newContext({ viewport: { width: 1280, height: 900 } });
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
    "menschen",
    "service",
    "eigenmarken",
    "aktionen",
    "instagram",
  ]);

  await expect(page.getByText("Persönliche Beratung, Partybedarf und Vermietung vor Ort.", { exact: true })).toBeVisible();
  await expect(page.getByText("Angebote der Woche", { exact: true })).toBeVisible();
  await expect(page.getByText("Gültig 13.–18.07.2026", { exact: true })).toBeVisible();
  await expect(page.getByText("10 Seiten", { exact: true })).toBeVisible();
  await expect(
    page
      .locator("#aktuell")
      .getByText("Aktionszeitraum · 14.–24.07.2026", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("#aktionen")
      .getByText("Aktionszeitraum · 14.–24.07.2026", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("#aktuell")
      .getByText(
        "Dein Schuss. Dein Gewinn. Am 24. Juli bei Trinkgut Jammers.",
        { exact: true },
      ),
  ).toBeVisible();
  await expect(
    page
      .locator("#aktionen")
      .getByText(
        "Dein Schuss. Dein Gewinn. Am 24. Juli bei Trinkgut Jammers.",
        { exact: true },
      ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Menschen hinter Jammers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deine Party. Unser Service." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Drei Originale im Licht." })).toBeVisible();
  await expect(page.locator("#menschen figure")).toHaveCount(5);
  await expect(page.locator("#eigenmarken figure")).toHaveCount(3);
  await expect(page.locator("#eigenmarken figcaption")).toHaveText([
    /Pralle Kirsche/,
    /Schwarzer Teufel/,
    /Caramello/,
  ]);
  await expect(page.getByText("Neue Einblicke folgen", { exact: true })).toBeVisible();
  await expect(page.locator("footer#kontakt")).toContainText("Jurgensstraße 20");
  await expect(page.locator("footer#kontakt")).toContainText("Mo–Sa 08:00–20:00 Uhr");
  await expect(page.getByText("Der nächste Handzettel wird vorbereitet.", { exact: true })).toHaveCount(0);

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
      "menschen",
      "service",
      "eigenmarken",
      "aktionen",
      "instagram",
    ]);

    for (const exactText of [
      "Persönliche Beratung, Partybedarf und Vermietung vor Ort.",
      "Angebote der Woche",
      "Gültig 13.–18.07.2026",
      "10 Seiten",
      "Menschen hinter Jammers",
      "Deine Party. Unser Service.",
      "Pralle Kirsche",
      "Schwarzer Teufel",
      "Caramello",
      "Neue Einblicke folgen",
      "Jurgensstraße 20",
      "Mo–Sa 08:00–20:00 Uhr",
    ]) {
      await expect(page.getByText(exactText, { exact: true }).first()).toBeVisible();
    }
    await expect(page.locator("#menschen figure")).toHaveCount(5);
    await expect(page.locator("#eigenmarken figure")).toHaveCount(3);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByText("Der nächste Handzettel wird vorbereitet.", { exact: true })).toHaveCount(0);
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

test("[product-contract] keeps homepage metadata off child routes and neutralizes NL metadata", async ({
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

test("[product-contract] loads all six legacy chunks off-root and none on root", async ({
  browser,
  baseURL,
}) => {
  const legacyContext = await newIsolatedContext(browser);
  let legacyObservation: ScriptObservation | undefined;

  try {
    legacyObservation = await observeScripts(
      legacyContext,
      localUrl(baseURL, "/angebote"),
    );
    await expect
      .poll(
        () =>
          Object.values(LEGACY_SENTINELS).filter(
            (sentinel) =>
              ![...legacyObservation!.bodies.values()].some((body) =>
                containsSentinel(body, sentinel),
              ),
          ),
        { timeout: 10_000 },
      )
      .toEqual([]);

    const sentinelUrls = new Map<string, string>();
    for (const [moduleName, sentinel] of Object.entries(LEGACY_SENTINELS)) {
      const scriptUrl = [...legacyObservation.bodies.entries()].find(([, body]) =>
        containsSentinel(body, sentinel),
      )?.[0];
      expect(scriptUrl, `${moduleName} chunk sentinel`).toBeTruthy();
      sentinelUrls.set(moduleName, scriptUrl!);
    }
    expect(sentinelUrls.size).toBe(6);
    expect(legacyObservation.runtimeIssues).toEqual([]);

    const rootContext = await newIsolatedContext(browser);
    try {
      const rootObservation = await observeScripts(
        rootContext,
        localUrl(baseURL, "/"),
      );
      await expect(rootObservation.page.locator(".glass-header")).toHaveCount(0);
      await expect(
        rootObservation.page.getByRole("button", { name: "Warenkorb öffnen" }),
      ).toHaveCount(0);
      await expect(
        rootObservation.page.getByRole("button", { name: "Merkzettel" }),
      ).toHaveCount(0);
      await expect(
        rootObservation.page.getByRole("button", { name: "Chat öffnen" }),
      ).toHaveCount(0);
      await expect(rootObservation.page.getByRole("dialog")).toHaveCount(0);

      const rootInternalLinks = rootObservation.page.locator(
        'a[href^="/"]:visible',
      );
      for (
        let index = 0;
        index < (await rootInternalLinks.count());
        index += 1
      ) {
        await rootInternalLinks.nth(index).scrollIntoViewIfNeeded();
        await rootObservation.page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
      }
      await rootObservation.waitForIdle();

      for (const [moduleName, sentinel] of Object.entries(LEGACY_SENTINELS)) {
        expect(
          [...rootObservation.bodies.values()].some((body) =>
            containsSentinel(body, sentinel),
          ),
          `${moduleName} sentinel leaked into a root script`,
        ).toBe(false);
      }
      for (const [moduleName, scriptUrl] of sentinelUrls) {
        expect(
          rootObservation.requestedUrls.has(scriptUrl),
          `${moduleName} legacy script was requested by root`,
        ).toBe(false);
      }
      expect(rootObservation.runtimeIssues).toEqual([]);
    } finally {
      await rootContext.close();
    }
  } finally {
    await legacyContext.close();
  }
});

test("[product-contract] preserves the off-root legacy controls and named dialogs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeIssues = collectRuntimeIssues(page);
  const response = await page.goto("/angebote", {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(200);

  await expect(page.locator(".glass-header")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Per WhatsApp schreiben" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Chat öffnen" })).toBeVisible();

  const cartButton = page.getByRole("button", { name: "Warenkorb öffnen" });
  await expect(cartButton).toBeVisible();
  await cartButton.click();
  const cartDialog = page.getByRole("dialog", { name: "Warenkorb" });
  await expect(cartDialog).toBeVisible();
  await cartDialog.getByRole("button", { name: "Schließen" }).click();
  await expect(cartDialog).toHaveCount(0);

  await page.getByRole("button", { name: "Merkzettel" }).click();
  const wishlistDialog = page.getByRole("dialog", { name: /Merkzettel/ });
  await expect(wishlistDialog).toBeVisible();
  await wishlistDialog.getByRole("button", { name: "Schliessen" }).click();
  await expect(wishlistDialog).toHaveCount(0);

  const menuButton = page.getByRole("button", { name: "Menü" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  const menuDialog = page.getByRole("dialog", { name: "Navigationsmenü" });
  await expect(menuDialog).toBeVisible();
  await menuDialog.getByRole("button", { name: "Schließen" }).click();
  await expect(menuDialog).toHaveCount(0);
  expect(runtimeIssues).toEqual([]);
});

test("[product-contract] keeps cookie consent and runtime diagnostics on root and legacy routes", async ({
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
    await expect(page.getByText("Wir nutzen Cookies", { exact: true })).toBeVisible();
  }
  expect(runtimeIssues).toEqual([]);
});
