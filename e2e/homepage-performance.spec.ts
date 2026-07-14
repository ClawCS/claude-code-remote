import { expect, test } from "@playwright/test";

type HomepageMetrics = Readonly<{
  cls: number;
  interaction: number;
  lcp: number;
}>;

type HomepageMetricsWindow = Window & {
  __homepageMetrics: HomepageMetrics;
};

interface LayoutShiftPerformanceEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface InteractionPerformanceEntry extends PerformanceEntry {
  interactionId: number;
}

interface EventPerformanceObserverInit extends PerformanceObserverInit {
  durationThreshold: number;
}

type ResourceEvidence = Readonly<{
  accountedBytes: number;
  accountingSource:
    | "encoded-body-fallback"
    | "transfer"
    | "unavailable-or-empty";
  budgetType: "img" | "script" | null;
  decodedBodySize: number;
  encodedBodySize: number;
  initiatorType: string;
  name: string;
  transferSize: number;
}>;

const SCRIPT_BUDGET_BYTES = 225 * 1024;
const IMAGE_BUDGET_BYTES = 1.25 * 1024 * 1024;
const RESOURCE_BUDGET_BYTES = 550 * 1024;

test.use({
  viewport: { width: 390, height: 844 },
  contextOptions: { reducedMotion: "no-preference" },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("cookie-consent", "declined");
    } catch {
      // The performance gate remains valid when storage is unavailable.
    }
  });
});

test("meets visual stability, interaction, transfer, and request budgets", async ({
  page,
}, testInfo) => {
  const client = await page.context().newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });

  await page.addInitScript(() => {
    const metrics = { cls: 0, interaction: 0, lcp: 0 };
    Object.defineProperty(window, "__homepageMetrics", {
      value: metrics,
      writable: false,
    });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftPerformanceEntry[]) {
        if (!entry.hadRecentInput) metrics.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });

    const eventObserverOptions: EventPerformanceObserverInit = {
      type: "event",
      buffered: true,
      durationThreshold: 16,
    };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as InteractionPerformanceEntry[]) {
        if (entry.interactionId > 0) {
          metrics.interaction = Math.max(metrics.interaction, entry.duration);
        }
      }
    }).observe(eventObserverOptions);
  });

  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");

  const menu = page.getByRole("button", { name: "Menü öffnen" });
  await menu.click();
  await menu.press("Escape");
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(
    () =>
      (window as unknown as HomepageMetricsWindow).__homepageMetrics,
  );
  const resources = await page.evaluate<ResourceEvidence[]>(() => {
    const timingEntries = [
      ...performance.getEntriesByType("navigation"),
      ...performance.getEntriesByType("resource"),
    ] as Array<PerformanceNavigationTiming | PerformanceResourceTiming>;

    return timingEntries.map((resource) => {
      const accountedBytes =
        resource.transferSize > 0
          ? resource.transferSize
          : resource.encodedBodySize;
      const pathname = new URL(resource.name).pathname;
      const initiatorType =
        resource.entryType === "navigation"
          ? "navigation"
          : (resource as PerformanceResourceTiming).initiatorType;
      const budgetType =
        initiatorType === "script" || /\.js$/i.test(pathname)
          ? "script"
          : initiatorType === "img" ||
              pathname === "/_next/image" ||
              /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(pathname)
            ? "img"
            : null;
      return {
        name: resource.name,
        initiatorType,
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize,
        decodedBodySize: resource.decodedBodySize,
        accountedBytes,
        budgetType,
        accountingSource:
          resource.transferSize > 0
            ? "transfer"
            : resource.encodedBodySize > 0
              ? "encoded-body-fallback"
              : "unavailable-or-empty",
      };
    });
  });

  const total = (type: string) =>
    resources
      .filter((resource) => resource.budgetType === type)
      .reduce((sum, resource) => sum + resource.accountedBytes, 0);
  const scriptBytes = total("script");
  const imageBytes = total("img");
  const largestResourceBytes = Math.max(
    0,
    ...resources.map((resource) => resource.accountedBytes),
  );
  const unmeasuredLoadedUrls = resources
    .filter(
      ({ accountedBytes, name }) =>
        accountedBytes === 0 && /^https?:\/\//i.test(name),
    )
    .map(({ name }) => name);
  const forbiddenUrls = resources
    .map(({ name }) => name)
    .filter((name) => /instagram|google\.com\/maps|\.mp4|viewer/i.test(name));
  const metricEvidence = {
    ...metrics,
    imageBytes,
    largestResourceBytes,
    resourceCount: resources.length,
    scriptBytes,
    unmeasuredLoadedUrls,
  };
  const metricsJson = JSON.stringify(metricEvidence, null, 2);
  const resourcesJson = JSON.stringify(resources, null, 2);

  console.log("homepage-performance metrics");
  console.log(metricsJson);
  console.log("homepage-performance resources");
  console.log(resourcesJson);
  await testInfo.attach("homepage-performance-metrics.json", {
    body: metricsJson,
    contentType: "application/json",
  });
  await testInfo.attach("homepage-performance-resources.json", {
    body: resourcesJson,
    contentType: "application/json",
  });

  expect.soft(metrics.lcp, "LCP must be observed").toBeGreaterThan(0);
  expect.soft(metrics.lcp, "LCP must remain below 1500 ms").toBeLessThan(1500);
  expect.soft(metrics.cls, "CLS must remain below 0.05").toBeLessThan(0.05);
  expect
    .soft(metrics.interaction, "an interaction duration must be observed")
    .toBeGreaterThan(0);
  expect
    .soft(metrics.interaction, "interaction duration must remain below 200 ms")
    .toBeLessThan(200);
  expect
    .soft(scriptBytes, "initial script transfer must remain within 225 KiB")
    .toBeLessThanOrEqual(SCRIPT_BUDGET_BYTES);
  expect
    .soft(imageBytes, "initial image transfer must remain within 1.25 MiB")
    .toBeLessThanOrEqual(IMAGE_BUDGET_BYTES);
  expect
    .soft(largestResourceBytes, "each first-load asset must remain within 550 KiB")
    .toBeLessThanOrEqual(RESOURCE_BUDGET_BYTES);
  expect.soft(unmeasuredLoadedUrls, "every loaded URL must report a size").toEqual([]);
  expect.soft(forbiddenUrls, "passive load must not request embeds or video").toEqual([]);

  await client.detach();
});
