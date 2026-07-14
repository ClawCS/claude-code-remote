import { mkdir, readFile, writeFile } from "node:fs/promises";

const EXPECTED_URL = "http://127.0.0.1:3103/";
const EXPECTED_LIGHTHOUSE_VERSION = "13.4.0";
const CATEGORY_NAMES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];
const profiles = {
  mobile: {
    json: "audit/lighthouse/cinematic-production/mobile.json",
    html: "audit/lighthouse/cinematic-production/mobile.html",
    throttlingMethod: "devtools",
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.5600000000002,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    },
  },
  desktop: {
    json: "audit/lighthouse/cinematic-production/desktop.json",
    html: "audit/lighthouse/cinematic-production/desktop.html",
    throttlingMethod: "simulate",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
  },
};
const simulateDiagnosticPaths = {
  json: "audit/lighthouse/cinematic-production/mobile-simulate-diagnostic.json",
  html: "audit/lighthouse/cinematic-production/mobile-simulate-diagnostic.html",
};

function finiteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return value;
}

function exact(value, expected, label) {
  if (value !== expected) {
    throw new Error(`${label} ${JSON.stringify(value)} !== ${JSON.stringify(expected)}`);
  }
}

function exactJson(value, expected, label) {
  if (JSON.stringify(value) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} ${JSON.stringify(value)} !== ${JSON.stringify(expected)}`,
    );
  }
}

function extractEmbeddedReport(html, label) {
  const marker = "<script>window.__LIGHTHOUSE_JSON__ = ";
  const start = html.indexOf(marker);
  const end = html.indexOf(";</script>", start + marker.length);
  if (start < 0 || end < 0) {
    throw new Error(`${label} does not contain an embedded Lighthouse report`);
  }
  return JSON.parse(html.slice(start + marker.length, end));
}

async function readReportPair(label, paths) {
  const [json, html] = await Promise.all([
    readFile(paths.json, "utf8"),
    readFile(paths.html, "utf8"),
  ]);
  const report = JSON.parse(json);
  const embeddedReport = extractEmbeddedReport(html, paths.html);
  exactJson(embeddedReport, report, `${label} HTML/JSON report pair`);
  return report;
}

function assertReportIdentity(report, label, method, formFactor, settings) {
  if (report.runtimeError) {
    throw new Error(`${label} runtime error: ${JSON.stringify(report.runtimeError)}`);
  }

  exactJson(report.runWarnings, [], `${label} runWarnings`);
  exact(report.lighthouseVersion, EXPECTED_LIGHTHOUSE_VERSION, `${label} Lighthouse version`);
  exact(report.gatherMode, "navigation", `${label} gather mode`);
  exact(report.requestedUrl, EXPECTED_URL, `${label} requested URL`);
  exact(report.mainDocumentUrl, EXPECTED_URL, `${label} main document URL`);
  exact(report.finalDisplayedUrl, EXPECTED_URL, `${label} displayed URL`);
  exact(report.finalUrl, EXPECTED_URL, `${label} final URL`);
  exact(report.configSettings?.formFactor, formFactor, `${label} form factor`);
  exact(report.configSettings?.throttlingMethod, method, `${label} throttling method`);
  exactJson(
    report.configSettings?.screenEmulation,
    settings.screenEmulation,
    `${label} screen emulation`,
  );
  exactJson(
    report.configSettings?.throttling,
    settings.throttling,
    `${label} throttling preset`,
  );

  if (!Number.isFinite(Date.parse(report.fetchTime))) {
    throw new TypeError(`${label} fetchTime must be a valid instant`);
  }
}

function readMetrics(report, label) {
  const lcp = finiteNumber(
    report.audits?.["largest-contentful-paint"]?.numericValue,
    `${label} LCP`,
  );
  const cls = finiteNumber(
    report.audits?.["cumulative-layout-shift"]?.numericValue,
    `${label} CLS`,
  );
  const observedLcp = finiteNumber(
    report.audits?.metrics?.details?.items?.[0]?.observedLargestContentfulPaint,
    `${label} observed LCP`,
  );
  return { cls, lcp, observedLcp };
}

const summary = {};

for (const [profile, settings] of Object.entries(profiles)) {
  const report = await readReportPair(profile, settings);
  assertReportIdentity(
    report,
    profile,
    settings.throttlingMethod,
    profile,
    settings,
  );

  const rawScores = Object.fromEntries(
    CATEGORY_NAMES.map((name) => {
      const score = finiteNumber(
        report.categories?.[name]?.score,
        `${profile} ${name} score`,
      );
      if (score < 0.95) throw new Error(`${profile} ${name} ${score} < 0.95`);
      return [name, score];
    }),
  );
  const scores = Object.fromEntries(
    Object.entries(rawScores).map(([name, score]) => [
      name,
      Math.round(score * 100),
    ]),
  );
  const { cls, lcp, observedLcp } = readMetrics(report, profile);

  if (lcp <= 0 || lcp >= 1500) {
    throw new Error(`${profile} LCP ${lcp} must be > 0 and < 1500 ms`);
  }
  if (cls < 0 || cls >= 0.05) {
    throw new Error(`${profile} CLS ${cls} must be >= 0 and < 0.05`);
  }
  if (
    settings.throttlingMethod === "devtools" &&
    Math.abs(lcp - observedLcp) > 1
  ) {
    throw new Error(
      `${profile} devtools LCP ${lcp} differs from observed LCP ${observedLcp}`,
    );
  }

  summary[profile] = {
    fetchTime: report.fetchTime,
    finalUrl: report.finalUrl,
    lighthouseVersion: report.lighthouseVersion,
    formFactor: report.configSettings.formFactor,
    throttlingMethod: report.configSettings.throttlingMethod,
    htmlReportMatchesJson: true,
    rawScores,
    scores,
    lcp,
    observedLcp,
    cls,
  };
}

const simulateDiagnostic = await readReportPair(
  "mobile simulate diagnostic",
  simulateDiagnosticPaths,
);
assertReportIdentity(
  simulateDiagnostic,
  "mobile simulate diagnostic",
  "simulate",
  "mobile",
  profiles.mobile,
);
const diagnosticMetrics = readMetrics(
  simulateDiagnostic,
  "mobile simulate diagnostic",
);
const diagnosticPerformanceScore = finiteNumber(
  simulateDiagnostic.categories?.performance?.score,
  "mobile simulate diagnostic performance score",
);

await mkdir("audit/evidence/cinematic-production", { recursive: true });
await writeFile(
  "audit/evidence/cinematic-production/homepage-audit.json",
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      measurementNote:
        "Mobile uses DevTools-mode Lighthouse so the canonical slow-4G and 4x CPU profile is applied in Chromium. Desktop uses Lighthouse's canonical simulated desktop profile. The separate mobile Lighthouse 13.4.0 simulate pair is retained as a diagnostic because its Lantern estimate diverges materially from the observed trace; it is not used as a passing substitute.",
      simulateDiagnostic: {
        files: simulateDiagnosticPaths,
        fetchTime: simulateDiagnostic.fetchTime,
        throttlingMethod: simulateDiagnostic.configSettings.throttlingMethod,
        performanceScore: diagnosticPerformanceScore,
        ...diagnosticMetrics,
        htmlReportMatchesJson: true,
      },
      ...summary,
    },
    null,
    2,
  )}\n`,
);

console.log(JSON.stringify({ ...summary, simulateDiagnostic: diagnosticMetrics }));
