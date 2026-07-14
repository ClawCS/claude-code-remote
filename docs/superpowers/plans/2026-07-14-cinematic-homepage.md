# Cinematic Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the root homepage with the approved production-ready Cinematic Dark system: authentic Jammers people and market imagery, a current-content stage, a progressive three-poster Spotlight Rail, precise service/contact information, and verified mobile, no-JS, accessibility, visual, and performance behavior.

**Architecture:** `app/page.tsx` remains a Server Component and calls the separately owned Hybrid content adapter once per request. It passes a serializable snapshot into focused server-rendered sections; only live status, mobile navigation enhancement, the optional flyer viewer, and GSAP/ScrollTrigger motion are client islands. A deeply frozen TypeScript token contract emits CSS custom properties into one root wrapper, while scoped CSS Modules and a curated Sharp asset pipeline keep the visual system deterministic and auditable.

**Tech Stack:** Existing Next.js 16.2.4 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4 plus CSS Modules, and Sharp 0.34.5; GSAP/ScrollTrigger, Vitest, Playwright, axe-core, and Lighthouse are installed at execution-time versions first verified as available and Node-compatible by `npm view`, then locked exactly in `package-lock.json`.

## Global Constraints

- Work only in the isolated `codex/cinematic-production` worktree, based on confirmed P0; do not cherry-pick the comparison branch or copy any excluded-direction route, asset, test, evidence, or commit.
- Keep Next.js 16 App Router and React 19. The root homepage must be predominantly a Server Component; only navigation enhancement, live status, flyer viewer, and motion may be client islands.
- Use the exact visible business data: `Trinkgut Jammers`, legal name `Getränkesupermarkt Jammers e.K.`, owner `Nikolaos Jammers`, `Jurgensstraße 20`, `47574 Goch`, Monday–Saturday `08:00–20:00`, phone `02823 418707`, WhatsApp `+49 175 2492386`, and `jammers-goch@trinkgut.de`.
- Use only the explicitly confirmed service claims: personal advice, party supplies, and rentals. Rental prices come from `public/images/Preislisten/2.png` dated `01.01.2026`; stock counts come from `public/images/Preislisten/1.png` dated `06.03.2026`.
- Use a single central TypeScript token contract for color, typography, spacing, layout, and motion. Production Cinematic CSS must contain no raw color literals, brand hex values, motion durations, or cubic-bezier values.
- Preserve the approved palette exactly: yellow `#FEE005`, red `#E20F1D`, blue `#0086C8`, gray `#414045`, black `#000000`, and white `#FFFFFF`. Yellow directs attention; red marks one decisive gesture per scene; blue remains a rare functional accent.
- Keep the existing self-hosted-at-build `Plus Jakarta Sans` and `Space Grotesk` setup through `next/font`; do not add a browser-time font request.
- Use authentic approved local Jammers images only. Do not add Canva stock, AI imagery, generic party imagery, fantasy labels, customer/child/winner imagery without a release, or a synthetic product cutout. Canva remains read-only.
- Niko's `14.07.2026` project approval is the rights basis for the existing local employee-gallery images used here. Continue to exclude customers, children, winners, and any recognisable third party outside that approved employee pool.
- The Spotlight Rail order is exactly `01 Pralle Kirsche`, `02 Schwarzer Teufel`, `03 Caramello`; each is labelled `Originalposter` and links to `/eigenmarke`. Do not add taste, quality, availability, or price claims.
- Do not use Three.js, a hero video, an Instagram embed, or a first-load map/embed. Use an external route link and local static Instagram/editorial images.
- Configure Next Image/Sharp for AVIF and WebP negotiation, responsive `srcset`, explicit `sizes`, intrinsic dimensions or stable aspect-ratio containers, blur placeholders, and no `unoptimized` prop in Cinematic components.
- Desktop at `>=64rem` may pin and horizontally drive the Spotlight Rail. Below `64rem`, use normal vertical document flow. `prefers-reduced-motion` and no-JS must disable pinning, parallax, and transform entrances while preserving all content in order. Native scrolling remains active; no smooth-scroll library is installed.
- Touch targets are at least `44 × 44` CSS pixels. Keep semantic landmarks, one `h1`, logical heading order, visible focus, keyboard-complete navigation/viewer/CTAs, and sufficient contrast for every yellow/red/white pairing.
- Acceptance viewports are exactly `360`, `390`, `768`, `1024`, `1440`, and `2560` CSS pixels wide. The mobile first viewport must show `Goch schenkt ein.`, the primary WhatsApp CTA, and authentic image evidence.
- Performance gates are Lighthouse `>=95` in Performance, Accessibility, Best Practices, and SEO on mobile and desktop; LCP `<1.5 s`, CLS `<0.05`, and interaction latency `<200 ms`.
- Browser console output on `/` must contain zero errors and zero warnings. axe-core must report zero critical or serious findings.
- Do not edit the Hybrid scheduler/source pipeline in this plan. Consume its exact public interface below and leave its source priority, status derivation, expiry, cron, API hardening, and audit logic to the separate Hybrid implementation plan.

---

## External Hybrid Interface Dependency

The separate Hybrid plan owns `lib/homepage-content.ts`. This plan may import it but must not create, modify, mock in production, or redefine it:

```ts
export type HomepageFlyer = Readonly<{
  id: string;
  title: string;
  validFrom: string;
  validTo: string;
  viewerUrl: string;
  pdfUrl: string;
  pageCount: number;
  coverUrl: string;
  sourceUrl: string;
}>;

export type HomepageEvent = Readonly<{
  id: string;
  title: string;
  summary: string;
  validFrom: string;
  validTo: string;
  image: string;
  href: string;
  sourceUrl: string;
}>;

export type HomepageArchiveItem = Readonly<{
  id: string;
  title: string;
  date: string;
  image: string;
  kind: "event" | "giveaway";
}>;

export type HomepageContent = Readonly<{
  generatedAt: string;
  flyer: HomepageFlyer | null;
  event: HomepageEvent | null;
  archive: readonly HomepageArchiveItem[];
  fallbackMessage: string | null;
}>;

export function getHomepageContent(now?: Date): Promise<HomepageContent>;
```

Visual ownership starts after that adapter returns. `CurrentSection` renders `flyer`, `event`, and `fallbackMessage`; `ActionsSection` renders `event` plus `archive`. Neither component derives `active`, extends dates, fetches a source, or turns an expired item into current content.

## File Map

| Path | Responsibility |
|---|---|
| `package.json`, `package-lock.json` | Exact motion/test/audit dependencies and scripts. |
| `vitest.config.ts`, `playwright.config.ts` | Node unit tests and Chromium E2E server configuration. |
| `next.config.ts` | AVIF/WebP negotiation and responsive image candidate sizes. |
| `lib/cinematic/tokens.ts` | Deeply frozen design tokens and CSS custom-property emitter. |
| `lib/cinematic/site.ts` | Verified market facts, links, nav contract, and Europe/Berlin live-status helper. |
| `lib/cinematic/metadata.ts` | Root metadata and LocalBusiness JSON-LD with exact legal/contact data. |
| `lib/cinematic/presentation.ts` | Date-range labels and pure visual view-model adapters for external Homepage content. |
| `lib/cinematic/css-audit.ts` | Production CSS token-boundary scanner used by tests. |
| `lib/chrome-visibility.ts` | Pure decision for suppressing legacy chrome on `/` and `/nl`. |
| `data/cinematic-editorial.ts` | Curated approved images, poster order/copy, service data, rental facts, and static Instagram selection. |
| `scripts/build-cinematic-assets.mjs` | Deterministic Sharp derivatives from exact approved originals. |
| `scripts/assert-homepage-audit.mjs` | Lighthouse/category/vital budget assertions and summarized evidence. |
| `public/images/home/cinematic/*` | Optimized committed homepage and Open Graph assets. |
| `app/layout.tsx` | Correct global metadata/JSON-LD while preserving existing app providers. |
| `app/page.tsx` | Server entry point; one Hybrid call and one `CinematicHome` render. |
| `app/home.module.css` | Root canvas, skip link, and cross-section layout boundary. |
| `components/DeChrome.tsx` | Route-gate and lazy-load legacy header/footer/drawers/floating widgets away from the production homepage bundle. |
| `components/cinematic/CinematicHome.tsx` | Server-side section composition and token scope. |
| `components/cinematic/CinematicHeader.tsx` | Dark compact logo/nav/WhatsApp/live-status shell. |
| `components/cinematic/MobileNavigation.tsx` | Native no-JS `<details>` navigation with Escape/outside-click enhancement. |
| `components/cinematic/LiveMarketStatus.tsx` | Minute-updated client status seeded from server time. |
| `components/cinematic/HeroSection.tsx` | Authentic hero, approved copy, CTAs, and market facts. |
| `components/cinematic/CurrentSection.tsx` | Server-rendered flyer/event/fallback current-content stage. |
| `components/cinematic/FlyerViewer.tsx` | Optional user-triggered accessible viewer dialog with external/PDF fallback. |
| `components/cinematic/PeopleSection.tsx` | Asymmetric editorial people/market image sequence. |
| `components/cinematic/ServiceSection.tsx` | Typographic service wall and sourced rental facts. |
| `components/cinematic/SpotlightSection.tsx` | Static-first three-poster signature sequence. |
| `components/cinematic/MotionIsland.tsx` | Page-local GSAP/ScrollTrigger enhancement and complete cleanup over native scrolling. |
| `components/cinematic/ActionsSection.tsx` | Current action plus dated archive chronology. |
| `components/cinematic/InstagramSection.tsx` | Local 4–6 item editorial grid with dates and profile links. |
| `components/cinematic/LocationFooter.tsx` | Address/contact/opening hours/route/NL/legal finale. |
| `components/cinematic/*.module.css` | Scoped chrome, hero, current, editorial, and Spotlight styling. |
| `lib/cinematic/__tests__/*.test.ts` | Token, fact, metadata, asset, date/view-model, editorial, and CSS contracts. |
| `e2e/homepage.spec.ts` | Semantic, content, keyboard, link, fallback, and console tests. |
| `e2e/homepage-motion.spec.ts` | Desktop enhancement, mobile flow, reduced-motion, runtime preference, no-JS, and cleanup tests. |
| `e2e/homepage-visual.spec.ts` | Six viewport screenshots, overflow and first-viewport geometry. |
| `e2e/homepage-performance.spec.ts` | LCP/CLS/interaction and first-load request/transfer budgets. |
| `audit/screenshots/cinematic-production/*` | Visually inspected screenshots. |
| `audit/lighthouse/cinematic-production/*` | Mobile/desktop Lighthouse JSON and HTML. |
| `audit/evidence/cinematic-production/homepage-audit.json` | Machine-checked audit summary. |

### Task 1: Establish the Test Harness, Token Contract, and Verified Site Facts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `lib/cinematic/tokens.ts`
- Create: `lib/cinematic/site.ts`
- Create: `lib/cinematic/__tests__/tokens.test.ts`
- Create: `lib/cinematic/__tests__/site.test.ts`

**Interfaces:**
- Produces: `CINEMATIC_TOKENS`, `cinematicTokenStyle`, `MARKET`, `CINEMATIC_NAV`, `SITE_LINKS`, `getMarketStatus(now: Date): MarketStatus`.
- Consumes: Existing `--font-jakarta` and `--font-display` variables from `app/layout.tsx`.

- [ ] **Step 1: Install exact dependencies and add deterministic test scripts/configuration**

Run:

```bash
node --version
for package in gsap vitest @playwright/test @axe-core/playwright lighthouse; do npm view "$package" version engines --json; done
npm install --save-exact next@16.2.4 react@19.2.4 react-dom@19.2.4
npm install --save-dev --save-exact eslint-config-next@16.2.4
npm install --save-exact "gsap@$(npm view gsap version)"
npm install --save-dev --save-exact "vitest@$(npm view vitest version)" "@playwright/test@$(npm view @playwright/test version)" "@axe-core/playwright@$(npm view @axe-core/playwright version)" "lighthouse@$(npm view lighthouse version)"
npm pkg set scripts.test="vitest run" scripts.test:watch="vitest" scripts.test:e2e="playwright test" scripts.audit:lighthouse="lighthouse"
npx playwright install chromium
```

Create `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    exclude: [...defaultExclude, "e2e/**"],
  },
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1",
        reuseExistingServer: !process.env.CI,
        url: baseURL,
      },
});
```

Expected: every `npm view` exits `0` and its `engines.node` range contains the printed Node version before installation. `npm ls next react react-dom eslint-config-next gsap vitest @playwright/test @axe-core/playwright lighthouse` exits `0`, keeps Next/React/React DOM at `16.2.4`/`19.2.4`/`19.2.4`, aligns `eslint-config-next` to `16.2.4`, and records exact non-range versions for every newly installed package in `package.json` and `package-lock.json`.

- [ ] **Step 2: Write failing token and site-contract tests**

Create `lib/cinematic/__tests__/tokens.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { CINEMATIC_TOKENS, cinematicTokenStyle } from "@/lib/cinematic/tokens";

describe("cinematic token contract", () => {
  test("locks the approved six-color palette", () => {
    expect(CINEMATIC_TOKENS.color).toEqual({
      yellow: "#FEE005",
      red: "#E20F1D",
      blue: "#0086C8",
      gray: "#414045",
      black: "#000000",
      white: "#FFFFFF",
    });
  });

  test("is deeply frozen and emits stable full-path CSS variables", () => {
    expect(Object.isFrozen(CINEMATIC_TOKENS)).toBe(true);
    expect(Object.isFrozen(CINEMATIC_TOKENS.motion.runtime)).toBe(true);
    expect(Object.isFrozen(cinematicTokenStyle)).toBe(true);
    expect(cinematicTokenStyle).toMatchObject({
      "--cinematic-color-yellow": "#FEE005",
      "--cinematic-spacing-target": "2.75rem",
      "--cinematic-motion-runtime-scroll-scrub-seconds": 0.55,
    });
    expect(new Set(Object.keys(cinematicTokenStyle)).size).toBe(
      Object.keys(cinematicTokenStyle).length,
    );
  });
});
```

Create `lib/cinematic/__tests__/site.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import {
  CINEMATIC_NAV,
  MARKET,
  SITE_LINKS,
  getMarketStatus,
} from "@/lib/cinematic/site";

describe("verified market contract", () => {
  test("uses the approved legal, address, contact, and opening-hour values", () => {
    expect(MARKET).toMatchObject({
      displayName: "Trinkgut Jammers",
      legalName: "Getränkesupermarkt Jammers e.K.",
      owner: "Nikolaos Jammers",
      street: "Jurgensstraße 20",
      postalCode: "47574",
      city: "Goch",
      phoneDisplay: "02823 418707",
      phoneHref: "tel:+492823418707",
      whatsappDisplay: "+49 175 2492386",
      email: "jammers-goch@trinkgut.de",
      openingHours: "Mo–Sa 08:00–20:00 Uhr",
    });
    expect(SITE_LINKS.whatsapp).toContain("491752492386");
  });

  test("exposes the six approved homepage navigation labels in order", () => {
    expect(CINEMATIC_NAV).toEqual([
      { label: "Angebote", href: "#aktuell" },
      { label: "Party & Miete", href: "#service" },
      { label: "Eigenmarken", href: "#eigenmarken" },
      { label: "Aktionen", href: "#aktionen" },
      { label: "Über uns", href: "#menschen" },
      { label: "Kontakt", href: "#kontakt" },
    ]);
  });

  test.each([
    ["2026-07-13T05:59:00.000Z", false, "Heute geschlossen"],
    ["2026-07-13T06:00:00.000Z", true, "Heute bis 20 Uhr"],
    ["2026-07-13T17:59:00.000Z", true, "Heute bis 20 Uhr"],
    ["2026-07-13T18:00:00.000Z", false, "Heute geschlossen"],
    ["2026-07-19T10:00:00.000Z", false, "Heute geschlossen"],
  ])("derives Berlin status at %s", (iso, isOpen, label) => {
    expect(getMarketStatus(new Date(iso))).toEqual({ isOpen, label });
  });
});
```

- [ ] **Step 3: Run the focused tests to prove the red state**

Run: `npm test -- lib/cinematic/__tests__/tokens.test.ts lib/cinematic/__tests__/site.test.ts`

Expected: FAIL with unresolved imports for `@/lib/cinematic/tokens` and `@/lib/cinematic/site`.

- [ ] **Step 4: Implement the minimal complete token and site contracts**

Create `lib/cinematic/tokens.ts`:

```ts
import type { CSSProperties } from "react";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

function deepFreeze<T extends object>(value: T): DeepReadonly<T> {
  for (const entry of Object.values(value)) {
    if (typeof entry === "object" && entry !== null) deepFreeze(entry);
  }
  return Object.freeze(value) as DeepReadonly<T>;
}

export const CINEMATIC_TOKENS = deepFreeze({
  color: {
    yellow: "#FEE005",
    red: "#E20F1D",
    blue: "#0086C8",
    gray: "#414045",
    black: "#000000",
    white: "#FFFFFF",
  },
  typography: {
    family: {
      sans: "var(--font-jakarta)",
      display: "var(--font-display)",
    },
    size: {
      label: "0.75rem",
      small: "0.875rem",
      body: "1rem",
      lead: "clamp(1.0625rem, 1.8vw, 1.25rem)",
      heading: "clamp(2.5rem, 6vw, 5.5rem)",
      display: "clamp(3.4rem, 11vw, 10rem)",
    },
    lineHeight: { display: "0.86", heading: "0.94", body: "1.55" },
    weight: { regular: "400", medium: "500", semibold: "600", bold: "700", extraBold: "800" },
    tracking: { tight: "-0.045em", normal: "0em", wide: "0.14em" },
  },
  spacing: {
    none: "0rem",
    twoXs: "0.25rem",
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    twoXl: "3rem",
    threeXl: "4rem",
    fourXl: "6rem",
    target: "2.75rem",
    gutter: "clamp(1rem, 4vw, 4rem)",
    section: "clamp(4.5rem, 10vw, 10rem)",
  },
  layout: {
    contentMax: "120rem",
    textMeasure: "54ch",
    headerHeight: "4.5rem",
    posterWidth: "clamp(34rem, 68vw, 70rem)",
  },
  motion: {
    duration: { instant: "0ms", fast: "160ms", medium: "320ms", slow: "700ms", scene: "1200ms" },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
      exit: "cubic-bezier(0.7, 0, 0.84, 0)",
    },
    runtime: {
      scrollScrubSeconds: 0.55,
      revealDistancePx: 28,
      revealDurationSeconds: 0.8,
      revealStaggerSeconds: 0.09,
      parallaxTravelPercent: 8,
    },
  },
} as const);

type TokenLeaf = string | number;
type CinematicCustomProperty = `--cinematic-${string}`;

function kebabCase(segment: string): string {
  return segment.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
}

function tokenEntries(
  value: Readonly<Record<string, unknown>>,
  parent: readonly string[] = [],
): readonly (readonly [CinematicCustomProperty, TokenLeaf])[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = [...parent, key];
    if (typeof entry === "object" && entry !== null && !Array.isArray(entry)) {
      return tokenEntries(entry as Readonly<Record<string, unknown>>, path);
    }
    if (typeof entry !== "string" && typeof entry !== "number") {
      throw new TypeError(`Unsupported cinematic token at ${path.join(".")}`);
    }
    return [[`--cinematic-${path.map(kebabCase).join("-")}`, entry] as const];
  });
}

export const cinematicTokenStyle = Object.freeze(
  Object.fromEntries(tokenEntries(CINEMATIC_TOKENS)),
) as Readonly<CSSProperties & Record<CinematicCustomProperty, TokenLeaf>>;
```

Create `lib/cinematic/site.ts`:

```ts
export const MARKET = Object.freeze({
  displayName: "Trinkgut Jammers",
  legalName: "Getränkesupermarkt Jammers e.K.",
  owner: "Nikolaos Jammers",
  street: "Jurgensstraße 20",
  postalCode: "47574",
  city: "Goch",
  phoneDisplay: "02823 418707",
  phoneHref: "tel:+492823418707",
  whatsappDisplay: "+49 175 2492386",
  email: "jammers-goch@trinkgut.de",
  openingHours: "Mo–Sa 08:00–20:00 Uhr",
} as const);

export const SITE_LINKS = Object.freeze({
  whatsapp:
    "https://wa.me/491752492386?text=Hallo%20Trinkgut%20Jammers%2C%20ich%20habe%20eine%20Frage.",
  route:
    "https://www.google.com/maps/dir/?api=1&destination=Jurgensstra%C3%9Fe+20%2C+47574+Goch",
  instagram: "https://www.instagram.com/trinkgutjammers_goch/",
  nl: "/nl",
} as const);

export const CINEMATIC_NAV = Object.freeze([
  { label: "Angebote", href: "#aktuell" },
  { label: "Party & Miete", href: "#service" },
  { label: "Eigenmarken", href: "#eigenmarken" },
  { label: "Aktionen", href: "#aktionen" },
  { label: "Über uns", href: "#menschen" },
  { label: "Kontakt", href: "#kontakt" },
] as const);

export type MarketStatus = Readonly<{ isOpen: boolean; label: "Heute bis 20 Uhr" | "Heute geschlossen" }>;

const berlinClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const openDays = new Set(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);

export function getMarketStatus(now: Date): MarketStatus {
  const parts = Object.fromEntries(
    berlinClock
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const isOpen = openDays.has(parts.weekday) && minutes >= 8 * 60 && minutes < 20 * 60;
  return isOpen
    ? { isOpen: true, label: "Heute bis 20 Uhr" }
    : { isOpen: false, label: "Heute geschlossen" };
}
```

- [ ] **Step 5: Run unit tests and baseline quality checks**

Run:

```bash
npm test -- lib/cinematic/__tests__/tokens.test.ts lib/cinematic/__tests__/site.test.ts
npx tsc --noEmit
npm run lint
```

Expected: 8 unit assertions PASS, TypeScript exits `0`, and ESLint exits `0` with no new warnings beyond the documented 20 P0 warnings.

- [ ] **Step 6: Commit the foundation**

```bash
git add package.json package-lock.json vitest.config.ts playwright.config.ts lib/cinematic/tokens.ts lib/cinematic/site.ts lib/cinematic/__tests__/tokens.test.ts lib/cinematic/__tests__/site.test.ts
git commit -m "test: establish cinematic homepage contracts"
```

### Task 2: Build the Curated Authentic Image Pipeline and Editorial Manifest

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `next.config.ts`
- Create: `scripts/build-cinematic-assets.mjs`
- Create: `data/cinematic-editorial.ts`
- Create: `lib/cinematic/__tests__/assets.test.ts`
- Create: `lib/cinematic/__tests__/editorial.test.ts`
- Create: `public/images/home/cinematic/hero-team.webp`
- Create: `public/images/home/cinematic/team-group.webp`
- Create: `public/images/home/cinematic/team-niko.webp`
- Create: `public/images/home/cinematic/team-jasmin.webp`
- Create: `public/images/home/cinematic/team-gabriella.webp`
- Create: `public/images/home/cinematic/poster-pralle-kirsche.webp`
- Create: `public/images/home/cinematic/poster-schwarzer-teufel.webp`
- Create: `public/images/home/cinematic/poster-caramello.webp`
- Create: `public/images/home/cinematic/og-home.jpg`

**Interfaces:**
- Produces: `EDITORIAL_IMAGES`, `PEOPLE_STORY`, `INSTAGRAM_SELECTION`, `SPOTLIGHT_POSTERS`, `SERVICE_ITEMS`, and `RENTAL_HIGHLIGHTS` from `data/cinematic-editorial.ts`.
- Consumes: five existing approved local employee-gallery originals, three existing original posters, Sharp, and Niko's `14.07.2026` project-use approval.

- [ ] **Step 1: Verify the five already-local approved employee originals and keep Canva candidates review-only**

Use only these tracked local files for this production pass:

| Source | Required pixels | Sharp `extract` rectangle | Production derivative |
|---|---:|---|---|
| `public/images/gallery/team-sven-niko.jpg` | `1350 × 1688` | `{ left: 217, top: 383, width: 915, height: 803 }` | `hero-team.webp` |
| `public/images/gallery/team-gruppenfoto.jpg` | `1350 × 1688` | `{ left: 200, top: 350, width: 950, height: 840 }` | `team-group.webp` |
| `public/images/gallery/team-niko.jpg` | `1080 × 1350` | `{ left: 146, top: 220, width: 745, height: 727 }` | `team-niko.webp` |
| `public/images/gallery/team-jasmin.jpg` | `1080 × 1350` | `{ left: 146, top: 231, width: 756, height: 718 }` | `team-jasmin.webp` |
| `public/images/gallery/team-gabriella.jpg` | `1080 × 1350` | `{ left: 145, top: 242, width: 762, height: 711 }` | `team-gabriella.webp` |

The Canva-named candidates in the approved spec remain a later review queue and are not required, downloaded, or referenced by runtime code. Continue to exclude customers, children, winners, and unverified third parties.

Run:

```bash
for image in public/images/gallery/team-sven-niko.jpg public/images/gallery/team-gruppenfoto.jpg public/images/gallery/team-niko.jpg public/images/gallery/team-jasmin.jpg public/images/gallery/team-gabriella.jpg; do sips -g pixelWidth -g pixelHeight "$image"; done
```

Expected: all five tracked files exist and report the exact dimensions above; no external download or new rights decision is needed for these employee images.

- [ ] **Step 2: Write failing output and editorial-contract tests**

Create `lib/cinematic/__tests__/assets.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import nextConfig from "../../../next.config";

const output = resolve(process.cwd(), "public/images/home/cinematic");
const expected = [
  ["hero-team.webp", "webp", 915],
  ["team-group.webp", "webp", 950],
  ["team-niko.webp", "webp", 745],
  ["team-jasmin.webp", "webp", 756],
  ["team-gabriella.webp", "webp", 762],
  ["poster-pralle-kirsche.webp", "webp", 1054],
  ["poster-schwarzer-teufel.webp", "webp", 1054],
  ["poster-caramello.webp", "webp", 1054],
  ["og-home.jpg", "jpeg", 1200],
] as const;

describe("cinematic image pipeline", () => {
  test.each(expected)("creates %s as bounded %s", async (name, format, maxWidth) => {
    const file = resolve(output, name);
    expect(existsSync(file)).toBe(true);
    const metadata = await sharp(file).metadata();
    expect(metadata.format).toBe(format);
    expect(metadata.width).toBeLessThanOrEqual(maxWidth);
    expect(metadata.width).toBeGreaterThanOrEqual(name === "og-home.jpg" ? 1200 : 700);
    expect(readFileSync(file).byteLength).toBeLessThan(550_000);
  });

  test("negotiates AVIF/WebP and offers honest responsive candidates", () => {
    expect(nextConfig.images?.formats).toEqual(["image/avif", "image/webp"]);
    expect(nextConfig.images?.deviceSizes).toEqual([360, 390, 768, 1024, 1440, 1920, 2560]);
    expect(nextConfig.images?.imageSizes).toContain(512);
  });
});
```

Create `lib/cinematic/__tests__/editorial.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  INSTAGRAM_SELECTION,
  PEOPLE_STORY,
  RENTAL_HIGHLIGHTS,
  SERVICE_ITEMS,
  SPOTLIGHT_POSTERS,
} from "@/data/cinematic-editorial";

describe("cinematic editorial contract", () => {
  test("locks the approved poster order and evidence labels", () => {
    expect(SPOTLIGHT_POSTERS.map(({ number, name }) => [number, name])).toEqual([
      ["01", "Pralle Kirsche"],
      ["02", "Schwarzer Teufel"],
      ["03", "Caramello"],
    ]);
    expect(SPOTLIGHT_POSTERS.every(({ label, href }) => label === "Originalposter" && href === "/eigenmarke")).toBe(true);
  });

  test("keeps people and Instagram selections local, dated, and release-gated", () => {
    expect(PEOPLE_STORY).toHaveLength(5);
    expect(INSTAGRAM_SELECTION).toHaveLength(5);
    for (const item of [...PEOPLE_STORY, ...INSTAGRAM_SELECTION]) {
      expect(item.alt.length).toBeGreaterThan(12);
      expect(item.reviewedAt).toBe("2026-07-14");
      expect(item.releaseBasis).toBe("user-approved-local-employee-pool-2026-07-14");
    }
  });

  test("uses the sourced rental price and inventory facts", () => {
    expect(RENTAL_HIGHLIGHTS).toEqual([
      { name: "Kühlanhänger", price: "150 €", stock: 3 },
      { name: "Kühltruhe", price: "35 €", stock: 4 },
      { name: "Stehtisch", price: "12 €", stock: 20 },
      { name: "Zapfanlage", price: "25 €", stock: 3 },
      { name: "Bierzeltgarnitur", price: "15 €", stock: 13 },
    ]);
  });

  test("limits service promises to the three explicitly confirmed services", () => {
    expect(SERVICE_ITEMS.map(({ title }) => title)).toEqual(["Persönliche Beratung", "Partybedarf", "Vermietung"]);
  });
});
```

- [ ] **Step 3: Run the tests to prove the red state**

Run: `npm test -- lib/cinematic/__tests__/assets.test.ts lib/cinematic/__tests__/editorial.test.ts`

Expected: FAIL because the optimized outputs and `data/cinematic-editorial.ts` do not exist.

- [ ] **Step 4: Implement the deterministic Sharp build**

Create `scripts/build-cinematic-assets.mjs`:

```js
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const output = resolve(root, "public/images/home/cinematic");
await mkdir(output, { recursive: true });

const jobs = [
  { input: "public/images/gallery/team-sven-niko.jpg", name: "hero-team.webp", extract: { left: 217, top: 383, width: 915, height: 803 }, grade: true },
  { input: "public/images/gallery/team-gruppenfoto.jpg", name: "team-group.webp", extract: { left: 200, top: 350, width: 950, height: 840 }, grade: true },
  { input: "public/images/gallery/team-niko.jpg", name: "team-niko.webp", extract: { left: 146, top: 220, width: 745, height: 727 }, grade: true },
  { input: "public/images/gallery/team-jasmin.jpg", name: "team-jasmin.webp", extract: { left: 146, top: 231, width: 756, height: 718 }, grade: true },
  { input: "public/images/gallery/team-gabriella.jpg", name: "team-gabriella.webp", extract: { left: 145, top: 242, width: 762, height: 711 }, grade: true },
  { input: "public/images/eigenmarken/pralle-kirsche.png", name: "poster-pralle-kirsche.webp", extract: null, grade: false },
  { input: "public/images/eigenmarken/schwarzer-teufel.png", name: "poster-schwarzer-teufel.webp", extract: null, grade: false },
  { input: "public/images/eigenmarken/caramello.png", name: "poster-caramello.webp", extract: null, grade: false },
];

for (const { input, name, extract, grade } of jobs) {
  let pipeline = sharp(resolve(root, input)).rotate();
  if (extract) pipeline = pipeline.extract(extract);
  if (grade) pipeline = pipeline.modulate({ brightness: 0.82, saturation: 0.92 });
  await pipeline
    .webp({ quality: 82, effort: 6 })
    .toFile(resolve(output, name));
}

const ogPhoto = await sharp(resolve(root, "public/images/gallery/team-sven-niko.jpg"))
  .rotate()
  .extract({ left: 217, top: 383, width: 915, height: 803 })
  .resize({ height: 630, withoutEnlargement: true })
  .modulate({ brightness: 0.72, saturation: 0.88 })
  .jpeg({ quality: 84, mozjpeg: true })
  .toBuffer();

await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#000000" } })
  .composite([{ input: ogPhoto, left: 482, top: 0 }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(resolve(output, "og-home.jpg"));

console.log(`Built ${jobs.length + 1} Cinematic assets in ${output}`);
```

Add script `"assets:cinematic": "node scripts/build-cinematic-assets.mjs"` to `package.json`. In `next.config.ts`, add these keys inside the existing `images` object while preserving every existing route dependency:

```ts
formats: ["image/avif", "image/webp"],
deviceSizes: [360, 390, 768, 1024, 1440, 1920, 2560],
imageSizes: [32, 48, 64, 96, 128, 256, 384, 512],
```

Run: `npm run assets:cinematic`

Expected: `Built 9 Cinematic assets` and all nine output files exist.

- [ ] **Step 5: Create the typed editorial manifest with concrete copy and sourced service facts**

Create `data/cinematic-editorial.ts` with static imports for all eight WebPs and these exact exported records:

```ts
import type { StaticImageData } from "next/image";
import heroTeam from "@/public/images/home/cinematic/hero-team.webp";
import posterCaramello from "@/public/images/home/cinematic/poster-caramello.webp";
import posterPralleKirsche from "@/public/images/home/cinematic/poster-pralle-kirsche.webp";
import posterSchwarzerTeufel from "@/public/images/home/cinematic/poster-schwarzer-teufel.webp";
import teamGabriella from "@/public/images/home/cinematic/team-gabriella.webp";
import teamGroup from "@/public/images/home/cinematic/team-group.webp";
import teamJasmin from "@/public/images/home/cinematic/team-jasmin.webp";
import teamNiko from "@/public/images/home/cinematic/team-niko.webp";
import { SITE_LINKS } from "@/lib/cinematic/site";

type EditorialImage = Readonly<{
  id: string;
  image: StaticImageData;
  alt: string;
  caption: string;
  reviewedAt: string;
  releaseBasis: "user-approved-local-employee-pool-2026-07-14";
}>;

export const EDITORIAL_IMAGES = Object.freeze({
  hero: { id: "hero-team", image: heroTeam, alt: "Sven und Niko von Trinkgut Jammers", caption: "Sven & Niko · vor Ort in Goch", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  group: { id: "team-group", image: teamGroup, alt: "Mitarbeiterinnen und Mitarbeiter von Trinkgut Jammers", caption: "Team Jammers", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  niko: { id: "team-niko", image: teamNiko, alt: "Nikolaos Jammers im Markt", caption: "Niko · Inhaber", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  jasmin: { id: "team-jasmin", image: teamJasmin, alt: "Jasmin von Trinkgut Jammers", caption: "Jasmin · Beratung im Markt", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  gabriella: { id: "team-gabriella", image: teamGabriella, alt: "Gabriella von Trinkgut Jammers", caption: "Gabriella · Verkauf im Markt", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
} as const satisfies Readonly<Record<string, EditorialImage>>);

export const PEOPLE_STORY = Object.freeze([
  EDITORIAL_IMAGES.group,
  EDITORIAL_IMAGES.hero,
  EDITORIAL_IMAGES.niko,
  EDITORIAL_IMAGES.jasmin,
  EDITORIAL_IMAGES.gabriella,
] as const);

export const INSTAGRAM_SELECTION = Object.freeze(
  PEOPLE_STORY.map((item) => ({ ...item, href: SITE_LINKS.instagram })),
);

export const SPOTLIGHT_POSTERS = Object.freeze([
  { number: "01", name: "Pralle Kirsche", label: "Originalposter", copy: "Rot im Bild. Goch im Rücken.", image: posterPralleKirsche, alt: "Originalposter Pralle Kirsche", href: "/eigenmarke" },
  { number: "02", name: "Schwarzer Teufel", label: "Originalposter", copy: "Schwarz gerahmt. Direkt ins Licht.", image: posterSchwarzerTeufel, alt: "Originalposter Schwarzer Teufel", href: "/eigenmarke" },
  { number: "03", name: "Caramello", label: "Originalposter", copy: "Goldener Auftritt. Teil der Jammers-Serie.", image: posterCaramello, alt: "Originalposter Caramello", href: "/eigenmarke" },
] as const);

export const SERVICE_ITEMS = Object.freeze([
  { number: "01", title: "Persönliche Beratung", text: "Direkter Kontakt mit dem Team im Markt.", href: "/kontakt" },
  { number: "02", title: "Partybedarf", text: "Partybedarf bei Trinkgut Jammers in Goch.", href: "/partyplaner" },
  { number: "03", title: "Vermietung", text: "Mietartikel anfragen und Verfügbarkeit bestätigen lassen.", href: "/vermietung" },
] as const);

export const RENTAL_HIGHLIGHTS = Object.freeze([
  { name: "Kühlanhänger", price: "150 €", stock: 3 },
  { name: "Kühltruhe", price: "35 €", stock: 4 },
  { name: "Stehtisch", price: "12 €", stock: 20 },
  { name: "Zapfanlage", price: "25 €", stock: 3 },
  { name: "Bierzeltgarnitur", price: "15 €", stock: 13 },
] as const);

export const RENTAL_SOURCES = Object.freeze({
  price: { href: "/images/Preislisten/2.png", asOf: "01.01.2026" },
  inventory: { href: "/images/Preislisten/1.png", asOf: "06.03.2026" },
} as const);
```

- [ ] **Step 6: Verify images, manifest, type safety, and absence of accidental raw sources**

Run:

```bash
npm test -- lib/cinematic/__tests__/assets.test.ts lib/cinematic/__tests__/editorial.test.ts
npx tsc --noEmit
git status --short
```

Expected: all asset/editorial assertions PASS; TypeScript exits `0`; `git status` lists only optimized outputs, code, package files, and image configuration—no new raw source directory.

- [ ] **Step 7: Commit the curated pipeline**

```bash
git add package.json package-lock.json next.config.ts scripts/build-cinematic-assets.mjs data/cinematic-editorial.ts lib/cinematic/__tests__/assets.test.ts lib/cinematic/__tests__/editorial.test.ts public/images/home/cinematic
git commit -m "feat: add curated cinematic image pipeline"
```

### Task 3: Correct Root Metadata and Isolate the Production Homepage Chrome

**Files:**
- Create: `lib/cinematic/metadata.ts`
- Create: `lib/chrome-visibility.ts`
- Create: `lib/cinematic/__tests__/metadata.test.ts`
- Create: `lib/cinematic/__tests__/chrome-visibility.test.ts`
- Modify: `app/layout.tsx`
- Modify: `components/DeChrome.tsx`

**Interfaces:**
- Produces: `SITE_METADATA: Metadata`, `HOMEPAGE_METADATA: Metadata`, `LOCAL_BUSINESS_JSON_LD`, and `shouldHideLegacyChrome(pathname: string): boolean`.
- Consumes: `MARKET` and `SITE_LINKS` from Task 1. Existing providers, cookie banner, and non-root route chrome remain intact; legacy chrome/drawers are lazy chunks that are not requested on `/`.

- [ ] **Step 1: Write failing metadata and route-boundary tests**

Create `lib/cinematic/__tests__/metadata.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { HOMEPAGE_METADATA, LOCAL_BUSINESS_JSON_LD } from "@/lib/cinematic/metadata";

describe("homepage metadata", () => {
  test("contains exact approved contact and LocalBusiness values", () => {
    expect(HOMEPAGE_METADATA.title).toEqual({ absolute: "Goch schenkt ein. | Trinkgut Jammers" });
    expect(HOMEPAGE_METADATA.alternates).toEqual({ canonical: "/" });
    expect(LOCAL_BUSINESS_JSON_LD).toMatchObject({
      "@type": "LiquorStore",
      name: "Getränkesupermarkt Jammers e.K.",
      telephone: "+49 2823 418707",
      email: "jammers-goch@trinkgut.de",
      address: { streetAddress: "Jurgensstraße 20", postalCode: "47574", addressLocality: "Goch" },
    });
    expect(JSON.stringify(LOCAL_BUSINESS_JSON_LD)).not.toMatch(/7\.000|Lieferung|inStock|priceRange/);
  });
});
```

Create `lib/cinematic/__tests__/chrome-visibility.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { shouldHideLegacyChrome } from "@/lib/chrome-visibility";

describe("legacy chrome boundary", () => {
  test.each([["/", true], ["/nl", true], ["/nl/angebote", true], ["/angebote", false], ["/kontakt", false]])(
    "%s => %s",
    (pathname, expected) => expect(shouldHideLegacyChrome(pathname)).toBe(expected),
  );
});
```

- [ ] **Step 2: Run the tests to prove the red state**

Run: `npm test -- lib/cinematic/__tests__/metadata.test.ts lib/cinematic/__tests__/chrome-visibility.test.ts`

Expected: FAIL with unresolved `metadata` and `chrome-visibility` imports.

- [ ] **Step 3: Implement metadata and the pure chrome boundary**

Create `lib/cinematic/metadata.ts`:

```ts
import type { Metadata } from "next";
import { MARKET, SITE_LINKS } from "@/lib/cinematic/site";

const description =
  "Persönliche Beratung, Partybedarf und Vermietung bei Trinkgut Jammers in der Jurgensstraße 20 in Goch.";

export const SITE_METADATA: Metadata = {
  metadataBase: new URL("https://trinkgut-jammers.de"),
  title: { default: "Trinkgut Jammers Goch", template: "%s | Trinkgut Jammers" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Trinkgut Jammers",
    title: "Goch schenkt ein. | Trinkgut Jammers",
    description,
    images: [{ url: "/images/home/cinematic/og-home.jpg", width: 1200, height: 630, alt: "Trinkgut Jammers – Goch schenkt ein." }],
  },
};

export const HOMEPAGE_METADATA: Metadata = {
  title: { absolute: "Goch schenkt ein. | Trinkgut Jammers" },
  description,
  alternates: { canonical: "/" },
};

export const LOCAL_BUSINESS_JSON_LD = Object.freeze({
  "@context": "https://schema.org",
  "@type": "LiquorStore",
  "@id": "https://trinkgut-jammers.de/#market",
  name: MARKET.legalName,
  alternateName: MARKET.displayName,
  url: "https://trinkgut-jammers.de",
  telephone: "+49 2823 418707",
  email: MARKET.email,
  founder: { "@type": "Person", name: MARKET.owner },
  address: {
    "@type": "PostalAddress",
    streetAddress: MARKET.street,
    postalCode: MARKET.postalCode,
    addressLocality: MARKET.city,
    addressCountry: "DE",
  },
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "20:00",
  }],
  sameAs: [SITE_LINKS.instagram],
});
```

Create `lib/chrome-visibility.ts`:

```ts
export function shouldHideLegacyChrome(pathname: string): boolean {
  return pathname === "/" || pathname === "/nl" || pathname.startsWith("/nl/");
}
```

Replace `components/DeChrome.tsx` with this route-gated lazy slot implementation so hidden legacy client modules are not requested by `/`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { shouldHideLegacyChrome } from "@/lib/chrome-visibility";

const Header = dynamic(() => import("@/components/Header"));
const Footer = dynamic(() => import("@/components/Footer"));
const CartDrawer = dynamic(() => import("@/components/CartDrawer"));
const WishlistDrawer = dynamic(() => import("@/components/WishlistDrawer"));
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"));
const AIAssistant = dynamic(() => import("@/components/AIAssistant"));

type LegacySlot = "header" | "footer" | "drawers" | "floating";

export default function DeChrome({ slot }: { slot: LegacySlot }) {
  const pathname = usePathname();
  if (shouldHideLegacyChrome(pathname)) return null;
  if (slot === "header") return <Header />;
  if (slot === "footer") return <Footer />;
  if (slot === "drawers") return <><CartDrawer /><WishlistDrawer /></>;
  return <><WhatsAppButton /><AIAssistant /></>;
}
```

In `app/layout.tsx`, replace the inline metadata and JSON-LD object with imports and keep the existing fonts/providers unchanged:

```tsx
import { LOCAL_BUSINESS_JSON_LD, SITE_METADATA } from "@/lib/cinematic/metadata";
export const metadata = SITE_METADATA;
// Use JSON.stringify(LOCAL_BUSINESS_JSON_LD) in the existing application/ld+json script.
```

Also remove direct imports of `Header`, `Footer`, `CartDrawer`, `WishlistDrawer`, `WhatsAppButton`, and `AIAssistant`, then render the lazy slots inside the existing providers:

```tsx
<DeChrome slot="header" />
<main className="flex-1">{children}</main>
<DeChrome slot="footer" />
<DeChrome slot="drawers" />
<DeChrome slot="floating" />
<CookieBanner />
```

- [ ] **Step 4: Verify the metadata and ensure non-root chrome is unchanged**

Run:

```bash
npm test -- lib/cinematic/__tests__/metadata.test.ts lib/cinematic/__tests__/chrome-visibility.test.ts
npx tsc --noEmit
npm run lint
npm run build
```

Expected: 7 cases PASS; TypeScript/lint/build exit `0`; build still lists `/`, `/angebote`, `/kontakt`, and `/nl` without route errors.

- [ ] **Step 5: Commit metadata and chrome isolation**

```bash
git add lib/cinematic/metadata.ts lib/chrome-visibility.ts lib/cinematic/__tests__/metadata.test.ts lib/cinematic/__tests__/chrome-visibility.test.ts app/layout.tsx components/DeChrome.tsx
git commit -m "feat: isolate cinematic root chrome and metadata"
```

### Task 4: Compose the Static-First Homepage and Consume the Shared Content Adapter

**Files:**
- Modify: `app/page.tsx`
- Create: `app/home.module.css`
- Create: `lib/cinematic/presentation.ts`
- Create: `lib/cinematic/__tests__/presentation.test.ts`
- Create: `components/cinematic/CinematicHome.tsx`
- Create: `components/cinematic/CinematicHeader.tsx`
- Create: `components/cinematic/MobileNavigation.tsx`
- Create: `components/cinematic/LiveMarketStatus.tsx`
- Create: `components/cinematic/HeroSection.tsx`
- Create: `components/cinematic/CurrentSection.tsx`
- Create: `components/cinematic/FlyerViewer.tsx`
- Create: `components/cinematic/PeopleSection.tsx`
- Create: `components/cinematic/ServiceSection.tsx`
- Create: `components/cinematic/SpotlightSection.tsx`
- Create: `components/cinematic/ActionsSection.tsx`
- Create: `components/cinematic/InstagramSection.tsx`
- Create: `components/cinematic/LocationFooter.tsx`

**Interfaces:**
- Consumes exactly: `getHomepageContent(now?: Date): Promise<HomepageContent>` and the four types from `@/lib/homepage-content`.
- Produces: `CinematicHome({ content, nowIso }: { content: HomepageContent; nowIso: string })` and pure `buildCurrentView(content: HomepageContent): CurrentView`.
- Client boundaries: only `MobileNavigation`, `LiveMarketStatus`, and `FlyerViewer` carry `"use client"` in this task.

- [ ] **Step 1: Write failing presentation/view-model tests with an exact shared-interface fixture**

Create `lib/cinematic/__tests__/presentation.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import type { HomepageContent } from "@/lib/homepage-content";
import { buildCurrentView, formatDateRange } from "@/lib/cinematic/presentation";

const base: HomepageContent = {
  generatedAt: "2026-07-14T06:15:00.000Z",
  flyer: null,
  event: null,
  archive: [],
  fallbackMessage: null,
};

describe("homepage presentation adapter", () => {
  test("formats date-only ranges without timezone drift", () => {
    expect(formatDateRange("2026-07-13", "2026-07-18")).toBe("13.–18.07.2026");
  });

  test("maps the empty flyer state to the exact calm fallback", () => {
    expect(buildCurrentView(base)).toEqual({
      flyer: null,
      event: null,
      fallbackMessage: "Der nächste Handzettel wird vorbereitet",
    });
  });

  test("passes adapter-owned flyer/event records without deriving status", () => {
    const flyer = { id: "flyer-2026-29", title: "Handzettel", validFrom: "2026-07-13", validTo: "2026-07-18", viewerUrl: "https://example.test/view", pdfUrl: "https://example.test/flyer.pdf", pageCount: 8, coverUrl: "/images/flyer.webp", sourceUrl: "https://example.test/source" };
    const event = { id: "striker-2026", title: "Striker Ball Challenge", summary: "Am 24.07.2026 bei Trinkgut Jammers.", validFrom: "2026-07-14", validTo: "2026-07-24", image: "/images/events/strikerball.png", href: "/kontakt", sourceUrl: "https://example.test/event" };
    expect(buildCurrentView({ ...base, flyer, event })).toEqual({ flyer, event, fallbackMessage: null });
  });
});
```

- [ ] **Step 2: Run the test to prove the red state**

Run: `npm test -- lib/cinematic/__tests__/presentation.test.ts`

Expected: FAIL because `lib/cinematic/presentation.ts` does not exist. If `@/lib/homepage-content` is unresolved, stop and finish the separate Hybrid interface implementation before continuing; do not create a local substitute.

- [ ] **Step 3: Implement the pure visual adapter**

Create `lib/cinematic/presentation.ts`:

```ts
import type { HomepageContent, HomepageEvent, HomepageFlyer } from "@/lib/homepage-content";

export type CurrentView = Readonly<{
  flyer: HomepageFlyer | null;
  event: HomepageEvent | null;
  fallbackMessage: string | null;
}>;

const germanDate = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin",
});

function dateOnly(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

export function formatDateRange(validFrom: string, validTo: string): string {
  const from = germanDate.format(dateOnly(validFrom));
  const to = germanDate.format(dateOnly(validTo));
  const [fromDay, fromMonth, fromYear] = from.split(".");
  const [toDay, toMonth, toYear] = to.split(".");
  return fromMonth === toMonth && fromYear === toYear
    ? `${fromDay}.–${toDay}.${toMonth}.${toYear}`
    : `${from}–${to}`;
}

export function buildCurrentView(content: HomepageContent): CurrentView {
  return {
    flyer: content.flyer,
    event: content.event,
    fallbackMessage: content.flyer
      ? null
      : content.fallbackMessage ?? "Der nächste Handzettel wird vorbereitet",
  };
}
```

- [ ] **Step 4: Write the root Server Component and exact section composition**

Replace `app/page.tsx` completely:

```tsx
import { getHomepageContent } from "@/lib/homepage-content";
import { HOMEPAGE_METADATA } from "@/lib/cinematic/metadata";
import CinematicHome from "@/components/cinematic/CinematicHome";

export const metadata = HOMEPAGE_METADATA;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const now = new Date();
  const content = await getHomepageContent(now);
  return <CinematicHome content={content} nowIso={now.toISOString()} />;
}
```

Create `components/cinematic/CinematicHome.tsx` with exactly this ordering and no client directive:

```tsx
import type { HomepageContent } from "@/lib/homepage-content";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";
import ActionsSection from "./ActionsSection";
import CinematicHeader from "./CinematicHeader";
import CurrentSection from "./CurrentSection";
import HeroSection from "./HeroSection";
import InstagramSection from "./InstagramSection";
import LocationFooter from "./LocationFooter";
import PeopleSection from "./PeopleSection";
import ServiceSection from "./ServiceSection";
import SpotlightSection from "./SpotlightSection";
import styles from "@/app/home.module.css";

export default function CinematicHome({ content, nowIso }: { content: HomepageContent; nowIso: string }) {
  return (
    <div className={styles.home} data-cinematic-root data-motion-state="static" data-motion-controller-count="0" data-motion-trigger-count="0" style={cinematicTokenStyle}>
      <a className={styles.skipLink} href="#main-content">Zum Hauptinhalt</a>
      <CinematicHeader nowIso={nowIso} />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <CurrentSection content={content} />
        <PeopleSection />
        <ServiceSection />
        <SpotlightSection />
        <ActionsSection archive={content.archive} event={content.event} />
        <InstagramSection />
      </main>
      <LocationFooter />
    </div>
  );
}
```

- [ ] **Step 5: Implement semantic section markup and the three small interaction islands**

Use these exact public signatures and DOM contracts; every `Image` uses `placeholder="blur"` for static imports, `fill` plus a stable aspect-ratio wrapper for adapter URL strings, and an exact `sizes` string:

```tsx
// CinematicHeader.tsx (Server Component)
export default function CinematicHeader({ nowIso }: { nowIso: string }): React.JSX.Element;
// <header>, logo link, desktop <nav aria-label="Hauptnavigation"> using CINEMATIC_NAV,
// <LiveMarketStatus initialNowIso={nowIso} />, visible SITE_LINKS.whatsapp, <MobileNavigation />.

// MobileNavigation.tsx (Client enhancement over native no-JS details)
export default function MobileNavigation(): React.JSX.Element;
// <details data-mobile-navigation>, <summary aria-label="Menü öffnen">, same six links;
// Escape and outside pointer close details; link activation closes it; native details remains usable without JS.

// LiveMarketStatus.tsx (Client)
export default function LiveMarketStatus({ initialNowIso }: { initialNowIso: string }): React.JSX.Element;
// Seed getMarketStatus(new Date(initialNowIso)); refresh immediately and every 60_000 ms;
// render <span aria-live="polite" data-market-open={String(status.isOpen)}>status.label</span>.

// HeroSection.tsx (Server)
export default function HeroSection(): React.JSX.Element;
// section[data-hero="cinematic"] with kicker "Trinkgut Jammers · Goch", one h1 "Goch schenkt ein.",
// exact lead "Persönliche Beratung, Partybedarf und Vermietung vor Ort.", WhatsApp primary CTA,
// route secondary CTA, hero asset, and a three-item dl for Jurgensstraße 20 / Mo–Sa 08–20 Uhr / 47574 Goch.

// CurrentSection.tsx (Server)
export default function CurrentSection({ content }: { content: HomepageContent }): React.JSX.Element;
// section#aktuell aria-labelledby="aktuell-title"; flyer card with visible formatDateRange and pageCount;
// event summary only when event is non-null; no empty grid cell; fallback + WhatsApp when flyer is null.

// FlyerViewer.tsx (Client)
export default function FlyerViewer({ flyer }: { flyer: HomepageFlyer }): React.JSX.Element;
// Always render native external viewer and PDF links. Enhance with a button opening role="dialog" aria-modal="true";
// trap focus with useModalA11y, close on Escape, iframe only after open, 8-second loading timeout,
// and show external viewer/PDF fallback on timeout or iframe onError.

// PeopleSection.tsx (Server)
export default function PeopleSection(): React.JSX.Element;
// section#menschen with h2 "Menschen hinter Jammers" and five PEOPLE_STORY figures in array order.

// ServiceSection.tsx (Server)
export default function ServiceSection(): React.JSX.Element;
// section#service with h2 "Deine Party. Unser Service.", the three confirmed SERVICE_ITEMS, five RENTAL_HIGHLIGHTS,
// visible source dates 01.01.2026 and 06.03.2026, and text "Bestand laut Liste. Reservierung erforderlich."

// SpotlightSection.tsx (Server)
export default function SpotlightSection(): React.JSX.Element;
// section#eigenmarken[data-signature="cinematic"], h2 "Drei Originale im Licht.",
// div[data-rail="cinematic"] containing all three SPOTLIGHT_POSTERS as linked figures in array order.

// ActionsSection.tsx (Server)
export default function ActionsSection(props: { event: HomepageEvent | null; archive: readonly HomepageArchiveItem[] }): React.JSX.Element | null;
// section#aktionen only if event or archive exists; current event with date/CTA/source link; archive ordered as received,
// each labelled "Rückblick" plus formatted date; kind never changes visual validity.

// InstagramSection.tsx (Server)
export default function InstagramSection(): React.JSX.Element;
// section aria-labelledby="instagram-title" with exactly five local INSTAGRAM_SELECTION figures, caption, external link.

// LocationFooter.tsx (Server)
export default function LocationFooter(): React.JSX.Element;
// footer#kontakt with MARKET data, route/WhatsApp/Instagram/NL links, and /kontakt /impressum /datenschutz /agb.
```

`app/home.module.css` must initially define `.home` (black background, white text, sans font, isolation) and `.skipLink` (off-screen until `:focus-visible`, then fixed top-left with yellow background/black text and a `44px` minimum target). Section-specific CSS is Task 5.

- [ ] **Step 6: Run the server-render and route smoke checks**

Run:

```bash
npm test -- lib/cinematic/__tests__/presentation.test.ts
npx tsc --noEmit
npm run lint
npm run build
npm run dev -- --hostname 127.0.0.1
```

In another terminal run:

```bash
curl -s http://127.0.0.1:3000/ | rg 'Goch schenkt ein|Menschen hinter Jammers|Deine Party\. Unser Service|Drei Originale im Licht|Jurgensstraße 20'
```

Expected: 3 presentation tests PASS, type/lint/build PASS, and `curl` finds every string in server HTML without requiring JavaScript.

- [ ] **Step 7: Commit the complete static-first homepage markup**

```bash
git add app/page.tsx app/home.module.css lib/cinematic/presentation.ts lib/cinematic/__tests__/presentation.test.ts components/cinematic
git commit -m "feat: compose cinematic homepage sections"
```

### Task 5: Apply the Cinematic Visual System and Responsive Editorial Layout

**Files:**
- Modify: `app/home.module.css`
- Create: `components/cinematic/chrome.module.css`
- Create: `components/cinematic/hero.module.css`
- Create: `components/cinematic/current.module.css`
- Create: `components/cinematic/editorial.module.css`
- Create: `components/cinematic/spotlight.module.css`
- Create: `lib/cinematic/css-audit.ts`
- Create: `lib/cinematic/__tests__/css-audit.test.ts`
- Modify: all `components/cinematic/*.tsx` files created in Task 4 to bind only their matching CSS Module classes

**Interfaces:**
- Consumes: CSS custom properties emitted by `cinematicTokenStyle`.
- Produces: five scoped style boundaries and `auditCinematicCss(source: string): readonly string[]`.

- [ ] **Step 1: Write the failing production-CSS boundary test**

Create `lib/cinematic/__tests__/css-audit.test.ts`:

```ts
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { auditCinematicCss } from "@/lib/cinematic/css-audit";

const files = [
  resolve(process.cwd(), "app/home.module.css"),
  ...readdirSync(resolve(process.cwd(), "components/cinematic"))
    .filter((name) => name.endsWith(".module.css"))
    .map((name) => resolve(process.cwd(), "components/cinematic", name)),
];

describe("cinematic CSS boundary", () => {
  test.each([
    ["hex", ".x{color:#FEE005}"],
    ["rgb", ".x{background:rgb(0 0 0)}"],
    ["duration", ".x{transition-duration:200ms}"],
    ["easing", ".x{transition-timing-function:cubic-bezier(0,0,1,1)}"],
    ["raw spacing", ".x{padding:13px}"],
    ["wrong category", ".x{padding:var(--cinematic-color-yellow)}"],
  ])("rejects %s", (_name, css) => expect(auditCinematicCss(css)).not.toEqual([]));

  test("accepts category-correct tokens", () => {
    expect(auditCinematicCss(`.x{color:var(--cinematic-color-white);padding:var(--cinematic-spacing-md);transition-duration:var(--cinematic-motion-duration-fast);transition-timing-function:var(--cinematic-motion-easing-standard)}`)).toEqual([]);
  });

  test("audits every production Cinematic CSS Module", () => {
    for (const file of files) expect(auditCinematicCss(readFileSync(file, "utf8")), file).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the CSS test to prove the red state**

Run: `npm test -- lib/cinematic/__tests__/css-audit.test.ts`

Expected: FAIL because `lib/cinematic/css-audit.ts` and the section modules do not exist.

- [ ] **Step 3: Implement the CSS auditor**

Create `lib/cinematic/css-audit.ts`:

```ts
const categoryPrefixes = {
  color: "--cinematic-color-",
  spacing: "--cinematic-spacing-",
  typography: "--cinematic-typography-",
  motion: "--cinematic-motion-",
} as const;
type Category = keyof typeof categoryPrefixes;

function category(property: string): Category | null {
  if (/^(?:color|background(?:-color)?|border(?:-[a-z-]+)?-color|outline-color|fill|stroke|text-decoration-color)$/.test(property)) return "color";
  if (/^(?:margin|padding|gap|row-gap|column-gap)(?:-[a-z]+)*$/.test(property)) return "spacing";
  if (/^(?:font-family|font-size|font-weight|line-height|letter-spacing)$/.test(property)) return "typography";
  if (/^(?:transition|animation)(?:-(?:duration|delay|timing-function))?$/.test(property)) return "motion";
  return null;
}

export function auditCinematicCss(source: string): readonly string[] {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const findings: string[] = [];
  if (/#[\da-f]{3,8}\b|(?:rgb|hsl)a?\(/i.test(css)) findings.push("raw color literal");
  if (/\b\d*\.?\d+m?s\b|cubic-bezier\(|steps\(/i.test(css)) findings.push("raw motion literal");
  for (const match of css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)[;}]/gi)) {
    const property = match[1].toLowerCase();
    const value = match[2].trim();
    const kind = category(property);
    if (!kind) continue;
    const variables = [...value.matchAll(/var\((--cinematic-[a-z\d-]+)/gi)].map((entry) => entry[1]);
    if (variables.some((variable) => !variable.startsWith(categoryPrefixes[kind]))) findings.push(`${property} uses wrong token category`);
    const safe = /^(?:0|auto|none|inherit|initial|unset|transparent|currentcolor)(?:\s+(?:0|auto))*$/i.test(value);
    if (!safe && variables.length === 0) findings.push(`${property} lacks ${kind} token`);
  }
  return findings;
}
```

- [ ] **Step 4: Implement the exact visual and responsive contracts in scoped modules**

Use token variables for every color/font/spacing/motion declaration and implement this complete selector/geometry matrix:

| File/selectors | Required geometry and behavior |
|---|---|
| `app/home.module.css`: `.home`, `.skipLink` | Black isolated canvas; white sans text; `overflow: clip`; skip link appears on `:focus-visible`; `scroll-margin-top` on every section heading target. |
| `chrome.module.css`: `.header`, `.headerInner`, `.logo`, `.desktopNav`, `.status`, `.whatsapp`, `.mobileDetails`, `.mobilePanel` | Sticky compact black header, yellow lower rule, max `120rem`; desktop nav at `>=64rem`; native details below; panel is absolute below header rather than fixed over hero; every link/summary `min-block-size: var(--cinematic-spacing-target)`; visible yellow focus outline. |
| `hero.module.css`: `.hero`, `.grid`, `.lightAxis`, `.copy`, `.kicker`, `.title`, `.lead`, `.actions`, `.primary`, `.secondary`, `.portrait`, `.portraitImage`, `.redGesture`, `.facts` | `min-height: calc(100svh - headerHeight)`; 12-column structural grid; yellow light axis; uppercase three-line display title with `schenkt` yellow; authentic portrait crop; exactly one red circular gesture; facts use three non-overlapping columns at `>=48rem`, two columns at `390px`, and one column at `360px`; primary CTA and portrait are inside the first `844px` at `390px`. |
| `current.module.css`: `.section`, `.heading`, `.stage`, `.flyer`, `.cover`, `.validity`, `.event`, `.fallback`, `.viewerDialog`, `.viewerFrame` | Black/white editorial cover card, yellow validity band, event card absent without event, fallback occupies the flyer column without a hole; dialog stays within viewport, close button first in tab order, iframe not present while closed. |
| `editorial.module.css`: `.section`, `.sectionHeading`, `.peopleGrid`, `.figure`, `.image`, `.caption`, `.serviceWall`, `.serviceRow`, `.rentalStrip`, `.actionsStage`, `.archive`, `.instagramGrid`, `.footer`, `.legal` | People mosaic uses asymmetric `7/5` and `5/7` spans desktop and one column mobile; image wrappers never exceed intrinsic display width; service is full-width numbered rows, never a four-card grid; rental facts use a horizontally wrapping definition list; Instagram is 2 columns mobile/5 desktop; footer contains route/NL/legal links without an embed. |
| `spotlight.module.css`: `.section`, `.intro`, `.railViewport`, `.rail`, `.frame`, `.posterWindow`, `.posterImage`, `.number`, `.posterMeta` | Static HTML starts as a vertical grid. At `>=64rem` the rail becomes `display:flex;width:max-content`; each frame width uses the poster token; full original poster remains visible with `object-fit:contain`; below `64rem`, reduced motion, and `(scripting:none)` force a normal one-column grid and clear transforms. |

Add these exact global fallbacks to the end of `spotlight.module.css`:

```css
@media (max-width: 63.999rem), (prefers-reduced-motion: reduce), (scripting: none) {
  .section { min-height: auto; overflow: visible; }
  .railViewport { overflow: visible; }
  .rail { display: grid; width: 100%; transform: none !important; }
  .frame { width: min(100%, 58rem); transform: none !important; }
}

@media (prefers-reduced-motion: reduce) {
  .section *, .section *::before, .section *::after {
    scroll-behavior: auto !important;
    animation-duration: var(--cinematic-motion-duration-instant) !important;
    transition-duration: var(--cinematic-motion-duration-instant) !important;
  }
}
```

Use only one red-gesture element in the hero and one red current/action accent per corresponding scene. Do not add a red decorative gesture to people, service, Spotlight, Instagram, or location.

- [ ] **Step 5: Verify CSS contracts, responsive compilation, and production build**

Run:

```bash
npm test -- lib/cinematic/__tests__/css-audit.test.ts
rg -n 'unoptimized|#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(' components/cinematic app/home.module.css
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all 8 CSS-audit cases PASS; `rg` exits `1` with no matches; type/lint/build exit `0`.

- [ ] **Step 6: Commit the production visual system**

```bash
git add app/home.module.css components/cinematic lib/cinematic/css-audit.ts lib/cinematic/__tests__/css-audit.test.ts
git commit -m "feat: apply cinematic editorial visual system"
```

### Task 6: Add Progressive Motion with Complete Reduced-Motion and Cleanup Behavior

**Files:**
- Create: `components/cinematic/MotionIsland.tsx`
- Modify: `components/cinematic/CinematicHome.tsx`
- Create: `e2e/homepage-motion.spec.ts`

**Interfaces:**
- Consumes DOM hooks: `[data-cinematic-root]`, `[data-motion]`, `[data-parallax]`, `[data-signature="cinematic"]`, and `[data-rail="cinematic"]`.
- Produces root diagnostics: `data-motion-state="static|enhanced|reduced"`, `data-motion-controller-count`, and `data-motion-trigger-count`.

- [ ] **Step 1: Write failing motion/no-JS/reduced-motion tests**

Create `e2e/homepage-motion.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("enhances only the desktop Spotlight rail and owns one controller", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const root = page.locator("[data-cinematic-root]");
  await expect(root).toHaveAttribute("data-motion-state", "enhanced");
  await expect(root).toHaveAttribute("data-motion-controller-count", "1");
  await expect(root).toHaveAttribute("data-motion-trigger-count", /[1-9]\d*/);
  const rail = root.locator('[data-rail="cinematic"]');
  const before = await rail.evaluate((node) => getComputedStyle(node).transform);
  await root.locator('[data-signature="cinematic"]').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 900);
  await expect.poll(() => rail.evaluate((node) => getComputedStyle(node).transform)).not.toBe(before);
});

test("keeps mobile in normal document flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('[data-rail="cinematic"]')).toHaveCSS("display", "grid");
  await expect(page.locator('[data-signature="cinematic"]')).not.toHaveCSS("position", "fixed");
});

test("owns no motion resources under reduced motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const root = page.locator("[data-cinematic-root]");
  await expect(root).toHaveAttribute("data-motion-state", "reduced");
  await expect(root).toHaveAttribute("data-motion-controller-count", "0");
  await expect(root).toHaveAttribute("data-motion-trigger-count", "0");
  await expect(root.locator('[data-rail="cinematic"]')).toHaveCSS("transform", "none");
  await context.close();
});

test("keeps all posters and links without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator('[data-rail="cinematic"] figure')).toHaveCount(3);
  await expect(page.getByRole("link", { name: /Pralle Kirsche/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Schwarzer Teufel/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Caramello/ })).toBeVisible();
  await context.close();
});

test("cleans page-local motion when navigating away", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.goto("/kontakt");
  await page.goto("/");
  await expect(page.locator("[data-cinematic-root]")).toHaveAttribute("data-motion-controller-count", "1");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
});
```

- [ ] **Step 2: Run the motion tests to prove the red state**

Run: `npm run test:e2e -- e2e/homepage-motion.spec.ts`

Expected: desktop diagnostic/enhancement tests FAIL because `MotionIsland` is absent; static mobile/no-JS content remains visible.

- [ ] **Step 3: Implement the page-local enhancement and cleanup**

Create `components/cinematic/MotionIsland.tsx` as a client component. Register `ScrollTrigger` once at module scope. In its effect:

```ts
const root = anchorRef.current?.closest<HTMLElement>("[data-cinematic-root]");
const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
```

On reduced motion, set diagnostics to `motionState: "reduced"`, `motionControllerCount: "0"`, `motionTriggerCount: "0"` and create no GSAP context, matchMedia, animation, or trigger. Otherwise create exactly one `gsap.context` scoped to `root` and use native browser scrolling. Track every returned `ScrollTrigger` in a `Set`; animate `[data-motion]` once from the tokenized reveal distance, animate `[data-parallax]` only inside desktop `gsap.matchMedia("(min-width: 64rem)")`, and pin only the Spotlight section while translating its rail by `Math.max(0, rail.scrollWidth - section.clientWidth)` with `invalidateOnRefresh: true`. After setup, assign `motionState: "enhanced"`, `motionControllerCount: "1"`, and `motionTriggerCount: String(ownedTriggers.size)`.

The single cleanup function must execute in this exact order:

```ts
desktopMedia.revert();
motionContext.revert();
for (const trigger of ownedTriggers) trigger.kill();
ownedTriggers.clear();
Object.assign(root.dataset, {
  motionState: "static",
  motionControllerCount: "0",
  motionTriggerCount: "0",
});
```

Listen for the preference `change` event, clean the active controller before rebuilding, and remove the listener on unmount. Render only `<span ref={anchorRef} hidden aria-hidden="true" />`. Add `<MotionIsland />` as the last child inside the token-scoped root in `CinematicHome.tsx`.

- [ ] **Step 4: Verify enhancement, fallbacks, runtime cleanup, and full unit suite**

Run:

```bash
npm run test:e2e -- e2e/homepage-motion.spec.ts
npm test
npx tsc --noEmit
npm run lint
```

Expected: 5 motion tests PASS; all unit tests PASS; type/lint exit `0`; no motion-owned inline transform remains after route cleanup or reduced-motion activation.

- [ ] **Step 5: Commit motion enhancement**

```bash
git add components/cinematic/MotionIsland.tsx components/cinematic/CinematicHome.tsx e2e/homepage-motion.spec.ts
git commit -m "feat: add resilient cinematic spotlight motion"
```

### Task 7: Gate Semantics, Keyboard Access, No-JS Content, Links, and Six Responsive Viewports

**Files:**
- Create: `e2e/homepage.spec.ts`
- Create: `e2e/homepage-visual.spec.ts`
- Modify: Cinematic TSX/CSS files only when a failing test identifies a concrete issue
- Create: `audit/screenshots/cinematic-production/home-360x844.png`
- Create: `audit/screenshots/cinematic-production/home-390x844.png`
- Create: `audit/screenshots/cinematic-production/home-768x1024.png`
- Create: `audit/screenshots/cinematic-production/home-1024x1024.png`
- Create: `audit/screenshots/cinematic-production/home-1440x900.png`
- Create: `audit/screenshots/cinematic-production/home-2560x1440.png`

**Interfaces:**
- Consumes the public DOM/links defined in Tasks 4–6.
- Produces a stable E2E acceptance contract and six reviewable screenshots.

- [ ] **Step 1: Write failing semantic, keyboard, link, console, and axe tests**

Create `e2e/homepage.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") messages.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(messages).toEqual([]);
});

test("renders exact landmarks, heading hierarchy, facts, and section order", async ({ page }) => {
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Goch schenkt ein." })).toHaveCount(1);
  await expect(page.getByText("Jurgensstraße 20", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Mo–Sa 08:00–20:00 Uhr", { exact: true }).first()).toBeVisible();
  expect(await page.locator("main > section").count()).toBeGreaterThanOrEqual(6);
});

test("offers exact navigation, contact, route, Instagram, NL, and legal links", async ({ page }) => {
  for (const label of ["Angebote", "Party & Miete", "Eigenmarken", "Aktionen", "Über uns", "Kontakt"]) {
    await expect(page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link", { name: label })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /wa\.me\/491752492386/);
  await expect(page.getByRole("link", { name: /Route/ }).last()).toHaveAttribute("href", /google\.com\/maps\/dir/);
  await expect(page.getByRole("link", { name: /Instagram/ }).last()).toHaveAttribute("href", "https://www.instagram.com/trinkgutjammers_goch/");
  await expect(page.getByRole("link", { name: /Niederländisch|Grenzkunden/ })).toHaveAttribute("href", "/nl");
  for (const href of ["/kontakt", "/impressum", "/datenschutz", "/agb"]) await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
});

test("supports a visible keyboard path through skip link, navigation, and CTAs", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Zum Hauptinhalt" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Zum Hauptinhalt" })).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("mobile details navigation works by keyboard and never covers the first hero message", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const summary = page.getByRole("button", { name: "Menü öffnen" });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-mobile-navigation]")).toHaveAttribute("open", "");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-mobile-navigation]")).not.toHaveAttribute("open", "");
});

test("has no critical or serious axe findings", async ({ page }) => {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
});

test("never first-loads video, Instagram, map, or flyer iframes", async ({ page }) => {
  const urls = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  expect(urls.some((url) => /instagram|google\.com\/maps|\.mp4|viewer/i.test(url))).toBe(false);
  await expect(page.locator("iframe")).toHaveCount(0);
});
```

- [ ] **Step 2: Write six-viewport geometry and screenshot tests**

Create `e2e/homepage-visual.spec.ts`:

```ts
import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 360, height: 844 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1024, height: 1024 },
  { width: 1440, height: 900 }, { width: 2560, height: 1440 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.width}x${viewport.height} has no overflow and stores a full-page review image`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const geometry = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (viewport.width <= 390) {
      const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
      const cta = await page.getByRole("link", { name: /WhatsApp/ }).nth(1).boundingBox();
      const heroImage = await page.locator('[data-hero="cinematic"] img').boundingBox();
      expect(h1 && h1.y + h1.height).toBeLessThan(viewport.height);
      expect(cta && cta.y + cta.height).toBeLessThan(viewport.height);
      expect(heroImage && heroImage.y).toBeLessThan(viewport.height);
    }
    mkdirSync("audit/screenshots/cinematic-production", { recursive: true });
    await page.screenshot({ fullPage: true, path: `audit/screenshots/cinematic-production/home-${viewport.width}x${viewport.height}.png` });
  });
}

test("360px facts occupy separate rows without collisions", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto("/");
  const boxes = await page.locator('[data-hero="cinematic"] dl > div').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()));
  for (let index = 1; index < boxes.length; index += 1) expect(boxes[index].top).toBeGreaterThanOrEqual(boxes[index - 1].bottom);
});
```

- [ ] **Step 3: Run both suites to collect the red findings**

Run: `npm run test:e2e -- e2e/homepage.spec.ts e2e/homepage-visual.spec.ts`

Expected: at least one failing assertion on focus, mobile geometry, contrast, or exact link/landmark markup before the QA fixes; keep the trace/screenshot for each failure.

- [ ] **Step 4: Fix only evidenced failures and re-run until every gate is green**

For each failure, edit the smallest matching Cinematic TSX/CSS file. Do not relax selectors, add pixel tolerances beyond the explicit `+1` overflow allowance, disable axe rules, skip a viewport, hide content, or remove console listeners.

Run:

```bash
npm run test:e2e -- e2e/homepage.spec.ts e2e/homepage-motion.spec.ts e2e/homepage-visual.spec.ts
npm test
npx tsc --noEmit
npm run lint
```

Expected: all homepage E2E tests and all unit tests PASS; TypeScript/lint exit `0`; six screenshot files exist.

- [ ] **Step 5: Visually inspect all six screenshots at original detail**

Open each file with the workspace image viewer at original resolution. Explicitly verify: authentic/non-stretched faces; hero crop; one red gesture; readable flyer dates; no facts collision; all three complete posters; no small-image upscaling; no empty event hole; dates on archive/Instagram; visible focus; legal/contact finale; no accidental legacy header/footer/floating widgets.

Expected: zero open visual P1/P2 findings. Any finding returns to Step 4 and regenerates all six screenshots.

- [ ] **Step 6: Commit accessibility, responsive tests, fixes, and inspected evidence**

```bash
git add e2e/homepage.spec.ts e2e/homepage-visual.spec.ts app/home.module.css components/cinematic audit/screenshots/cinematic-production
git commit -m "test: gate cinematic homepage accessibility and viewports"
```

### Task 8: Enforce Performance Budgets and Complete the Final Production Audit

**Files:**
- Create: `e2e/homepage-performance.spec.ts`
- Create: `scripts/assert-homepage-audit.mjs`
- Create: `audit/lighthouse/cinematic-production/mobile.json`
- Create: `audit/lighthouse/cinematic-production/mobile.html`
- Create: `audit/lighthouse/cinematic-production/desktop.json`
- Create: `audit/lighthouse/cinematic-production/desktop.html`
- Create: `audit/evidence/cinematic-production/homepage-audit.json`
- Modify: Cinematic files only for evidence-backed performance corrections

**Interfaces:**
- Produces: hard budgets for LCP `<1500 ms`, CLS `<0.05`, observed interaction duration `<200 ms`, initial JS `<=225 KiB`, initial images `<=1.25 MiB`, and every first-load asset `<=550 KiB`.
- Consumes: production build at `http://127.0.0.1:3000` and Lighthouse JSON.

- [ ] **Step 1: Write the failing browser-performance test**

Create `e2e/homepage-performance.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" });

test("meets visual stability, interaction, transfer, and request budgets", async ({ page }) => {
  await page.addInitScript(() => {
    const metrics = { cls: 0, lcp: 0, interaction: 0 };
    Object.defineProperty(window, "__homepageMetrics", { value: metrics, writable: false });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries() as PerformanceEntryList & Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) if (!entry.hadRecentInput) metrics.cls += entry.value ?? 0; }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) metrics.interaction = Math.max(metrics.interaction, entry.duration); }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Menü öffnen" }).click();
  await page.getByRole("button", { name: "Menü öffnen" }).press("Escape");
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => (window as typeof window & { __homepageMetrics: { cls: number; lcp: number; interaction: number } }).__homepageMetrics);
  expect(metrics.lcp).toBeGreaterThan(0);
  expect(metrics.lcp).toBeLessThan(1500);
  expect(metrics.cls).toBeLessThan(0.05);
  expect(metrics.interaction).toBeGreaterThan(0);
  expect(metrics.interaction).toBeLessThan(200);
  const resources = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => ({ name: entry.name, transferSize: (entry as PerformanceResourceTiming).transferSize, initiatorType: (entry as PerformanceResourceTiming).initiatorType })));
  const total = (type: string) => resources.filter((item) => item.initiatorType === type).reduce((sum, item) => sum + item.transferSize, 0);
  expect(total("script")).toBeLessThanOrEqual(225 * 1024);
  expect(total("img")).toBeLessThanOrEqual(1.25 * 1024 * 1024);
  expect(Math.max(...resources.map(({ transferSize }) => transferSize))).toBeLessThanOrEqual(550 * 1024);
  expect(resources.some(({ name }) => /instagram|google\.com\/maps|\.mp4|viewer/i.test(name))).toBe(false);
});
```

- [ ] **Step 2: Run against a production server to prove the red or capture the first green baseline**

Run:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 > /tmp/cinematic-homepage-next.log 2>&1 &
APP_PID=$!
for attempt in {1..30}; do curl -sf http://127.0.0.1:3000/ >/dev/null && break; sleep 1; done
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e -- e2e/homepage-performance.spec.ts
kill "$APP_PID"
```

Expected: the test reports exact measured values. If a budget fails, retain the trace and proceed to Step 3; if it passes, record those values without weakening any bound.

- [ ] **Step 3: Make evidence-backed performance corrections**

Use this fixed decision order: correct an inaccurate `sizes` string; reduce the relevant Sharp master width/quality without upscaling; remove an accidental eager/priority image (only hero remains `priority` with `fetchPriority="high"`); defer the flyer iframe until user action; reduce client imports by moving markup/data back to Server Components; finally reduce motion work. Re-run Task 2's asset build/tests after any asset change and Task 6's cleanup tests after any motion change.

Expected: production Playwright performance test PASS with all five budgets.

- [ ] **Step 4: Run mobile and desktop Lighthouse and save both JSON and HTML**

With the same production server running, execute:

```bash
mkdir -p audit/lighthouse/cinematic-production audit/evidence/cinematic-production
npx lighthouse http://127.0.0.1:3000/ --quiet --output=json --output=html --output-path=audit/lighthouse/cinematic-production/mobile --form-factor=mobile --screenEmulation.mobile=true --chrome-flags="--headless=new"
npx lighthouse http://127.0.0.1:3000/ --quiet --output=json --output=html --output-path=audit/lighthouse/cinematic-production/desktop --preset=desktop --chrome-flags="--headless=new"
mv audit/lighthouse/cinematic-production/mobile.report.json audit/lighthouse/cinematic-production/mobile.json
mv audit/lighthouse/cinematic-production/mobile.report.html audit/lighthouse/cinematic-production/mobile.html
mv audit/lighthouse/cinematic-production/desktop.report.json audit/lighthouse/cinematic-production/desktop.json
mv audit/lighthouse/cinematic-production/desktop.report.html audit/lighthouse/cinematic-production/desktop.html
```

Expected files: `mobile.json`, `mobile.html`, `desktop.json`, and `desktop.html` at the exact paths in this task's file list.

- [ ] **Step 5: Implement and run the audit assertion script**

Create `scripts/assert-homepage-audit.mjs`:

```js
import { mkdir, readFile, writeFile } from "node:fs/promises";

const paths = {
  mobile: "audit/lighthouse/cinematic-production/mobile.json",
  desktop: "audit/lighthouse/cinematic-production/desktop.json",
};
const summary = {};
for (const [profile, path] of Object.entries(paths)) {
  const report = JSON.parse(await readFile(path, "utf8"));
  const scores = Object.fromEntries(["performance", "accessibility", "best-practices", "seo"].map((name) => [name, Math.round(report.categories[name].score * 100)]));
  for (const [name, score] of Object.entries(scores)) if (score < 95) throw new Error(`${profile} ${name} ${score} < 95`);
  const lcp = report.audits["largest-contentful-paint"].numericValue;
  const cls = report.audits["cumulative-layout-shift"].numericValue;
  if (lcp >= 1500) throw new Error(`${profile} LCP ${lcp} >= 1500ms`);
  if (cls >= 0.05) throw new Error(`${profile} CLS ${cls} >= 0.05`);
  summary[profile] = { scores, lcp, cls };
}
await mkdir("audit/evidence/cinematic-production", { recursive: true });
await writeFile("audit/evidence/cinematic-production/homepage-audit.json", `${JSON.stringify({ generatedAt: new Date().toISOString(), ...summary }, null, 2)}\n`);
console.log(JSON.stringify(summary));
```

Run: `node scripts/assert-homepage-audit.mjs`

Expected: exits `0`, prints mobile/desktop scores each `>=95`, LCP values `<1500`, CLS values `<0.05`, and creates `homepage-audit.json`.

- [ ] **Step 6: Run the full final verification matrix from a clean production build**

Run:

```bash
rm -rf .next
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e -- e2e/homepage.spec.ts e2e/homepage-motion.spec.ts e2e/homepage-visual.spec.ts e2e/homepage-performance.spec.ts
node scripts/assert-homepage-audit.mjs
```

Expected: every command exits `0`; lint has no new warnings beyond the 20 documented P0 warnings; build completes; homepage console/axe/no-JS/reduced-motion/viewport/performance gates all PASS.

- [ ] **Step 7: Audit the Cinematic-only tree and branch path history**

Run:

```bash
git ls-tree -r --name-only HEAD | rg -i '(^|/)(premium-light|premium_light)(/|$)|^app/design/'
git log --format= --name-only origin/codex/p0-bestandsaufnahme..HEAD | rg -i '(^|/)(premium-light|premium_light)(/|$)|^app/design/'
rg -n -i 'premium-light|premium_light|/design/premium' app components lib data public e2e audit package.json next.config.ts
git status --short
```

Expected: each of the first three scans exits `1` with no output; `git status --short` lists only the final audit artifacts or evidence-backed Cinematic corrections intended for the final commit.

- [ ] **Step 8: Commit final performance evidence and audit corrections**

```bash
git add e2e/homepage-performance.spec.ts scripts/assert-homepage-audit.mjs audit/lighthouse/cinematic-production audit/evidence/cinematic-production app/page.tsx app/layout.tsx app/home.module.css components/cinematic data/cinematic-editorial.ts public/images/home/cinematic
git commit -m "test: certify cinematic homepage production gates"
```

- [ ] **Step 9: Push the verified production branch**

Run:

```bash
git status --short --branch
git log --oneline origin/codex/p0-bestandsaufnahme..HEAD
git push -u origin codex/cinematic-production
```

Expected: clean working tree on `codex/cinematic-production`; the range contains only the approved design/spec baseline plus the focused Cinematic homepage commits from this plan; the push exits `0`, and `origin/codex/cinematic-production` points to `HEAD`. The user's 14 July 2026 authorization covers this push. Do not create a pull request unless separately requested.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-14-cinematic-homepage.md`. Two execution options:

1. **Subagent-Driven (recommended)** — use `superpowers:subagent-driven-development`, dispatch a fresh implementation agent per task, and run specification plus quality review between tasks.
2. **Inline Execution** — use `superpowers:executing-plans`, execute in checkpointed batches, and stop at every review gate.

The implementation session must start by confirming that the external `@/lib/homepage-content` interface exists exactly as declared and by retaining the 14 July 2026 user approval as the rights basis for the five existing employee images. Customers, children, prize winners, or other unapproved recognizable people remain excluded.
