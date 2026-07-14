# Cinematic Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the root homepage with the approved production-ready Cinematic Dark system: authentic Jammers people and market imagery, a current-content stage, a progressive three-poster Spotlight Rail, precise service/contact information, and verified mobile, no-JS, accessibility, visual, and performance behavior.

**Architecture:** `app/page.tsx` remains a Server Component and calls the separately owned Hybrid content adapter once per request. It passes a serializable snapshot into focused server-rendered sections; only live status, mobile navigation enhancement, the optional flyer viewer, and GSAP/ScrollTrigger motion are client islands. A deeply frozen TypeScript token contract emits CSS custom properties into one root wrapper, while scoped CSS Modules and a curated Sharp asset pipeline keep the visual system deterministic and auditable.

**Tech Stack:** Existing Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4 plus CSS Modules, and Sharp 0.34.5; GSAP/ScrollTrigger, Vitest, Playwright, axe-core, and Lighthouse are installed at execution-time versions first verified as available and Node-compatible by `npm view`, then locked exactly in `package-lock.json`.

## Global Constraints

- Work only in the isolated `codex/cinematic-production` worktree, based on confirmed P0; do not cherry-pick the comparison branch or copy any excluded-direction route, asset, test, evidence, or commit.
- Keep Next.js 16 App Router and React 19. The root homepage must be predominantly a Server Component; only navigation enhancement, live status, flyer viewer, and motion may be client islands.
- Use the exact visible business data: `Trinkgut Jammers`, legal name `Getränkesupermarkt Jammers e.K.`, owner `Nikolaos Jammers`, `Jurgensstraße 20`, `47574 Goch`, Monday–Saturday `08:00–20:00`, phone `02823 418707`, WhatsApp `+49 175 2492386`, and `jammers-goch@trinkgut.de`.
- Use only the explicitly confirmed service claims: personal advice, party supplies, and rentals. Rental prices come from private repository evidence `assets/source/preislisten/2.png` dated `01.01.2026`; stock counts come from `assets/source/preislisten/1.png` dated `06.03.2026`. Never expose their Canva-metadata-bearing raw files as public URLs.
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
| `components/cinematic/InstagramSection.tsx` | Dated/release-gated local editorial grid when evidence exists; honest profile-CTA fallback otherwise. |
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
npm install --save-exact next@16.2.10 react@19.2.4 react-dom@19.2.4
npm install --save-dev --save-exact eslint-config-next@16.2.10
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

Expected: every `npm view` exits `0` and its `engines.node` range contains the printed Node version before installation. `npm ls next react react-dom eslint-config-next gsap vitest @playwright/test @axe-core/playwright lighthouse` exits `0`, keeps Next/React/React DOM at `16.2.10`/`19.2.4`/`19.2.4`, aligns `eslint-config-next` to `16.2.10`, and records exact non-range versions for every newly installed package in `package.json` and `package-lock.json`.

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
- Modify: `lib/cinematic/tokens.ts`
- Modify: `lib/cinematic/__tests__/tokens.test.ts`
- Modify: `assets/INVENTAR.md`
- Move with Git: `public/images/Preislisten/{1,2,3,4}.png` → `assets/source/preislisten/{1,2,3,4}.png`
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
- Consumes: five existing approved local employee-gallery originals, three existing original posters, the tracked Jammers raster logo, two private rental evidence images, pinned Sharp `0.34.5`, and Niko's `14.07.2026` project-use approval.
- `INSTAGRAM_SELECTION` is intentionally empty in this production pass. Until a local candidate has a genuine capture/publication date, rights evidence, caption, and source/deep-link, the homepage renders only an honest Instagram profile CTA—never a duplicated pseudo-feed.
- Rental source evidence is private repository data, not a public URL. Runtime copy exposes only source label and `asOf`; it never links the metadata-bearing Canva PNGs.

- [ ] **Step 1: Audit and lock approved inputs; define the privacy move without mutating yet**

Use only these tracked local files for this production pass:

| Source | Required pixels | Required SHA-256 | Sharp `extract` rectangle | Production derivative |
|---|---:|---|---|---|
| `public/images/gallery/team-sven-niko.jpg` | `1350 × 1688` | `c00d3e0e3b4b12b3a639322acf1cbfa653a08b59f4de3b8e7617f798ade3a908` | `{ left: 217, top: 383, width: 915, height: 803 }` | `hero-team.webp` |
| `public/images/gallery/team-gruppenfoto.jpg` | `1350 × 1688` | `56b8dd3d1bb23c710f4c8ab3ff5cb25acbdc23363c49fcba7e59b0eb86c726d3` | `{ left: 200, top: 350, width: 950, height: 840 }` | `team-group.webp` |
| `public/images/gallery/team-niko.jpg` | `1080 × 1350` | `ce5bc792792a4ea767a52cce59e1c24edea3b25307462b0fab2c82cd9c1ea889` | `{ left: 146, top: 220, width: 745, height: 727 }` | `team-niko.webp` |
| `public/images/gallery/team-jasmin.jpg` | `1080 × 1350` | `f4abdade990528506045f32f35b59868e486abb236813b11ffcfc0a7beff0846` | `{ left: 146, top: 231, width: 756, height: 718 }` | `team-jasmin.webp` |
| `public/images/gallery/team-gabriella.jpg` | `1080 × 1350` | `fc750f2e676888a79b426e05b35f84d20743ff5b3957411a1bf3892a6a159fdf` | `{ left: 145, top: 242, width: 762, height: 711 }` | `team-gabriella.webp` |

Lock these additional build inputs:

| Source | Required pixels | Required SHA-256 | Use |
|---|---:|---|---|
| `public/images/eigenmarken/pralle-kirsche.png` | `1054 × 1493` | `6b7d52284a6543a4c8a6922effa296b74e8ca8025db4549bc83c558f6904e694` | poster 01 |
| `public/images/eigenmarken/schwarzer-teufel.png` | `1054 × 1492` | `349bd8ca7c6912987857a1c76a97eb8fe45ac9093cf1fa233239687f1166dbdc` | poster 02 |
| `public/images/eigenmarken/caramello.png` | `1054 × 1493` | `9a1b89a5f3156981913561f0901f1f03c65f341ea4c1047d11d0b913db7b93dd` | poster 03 |
| `public/images/logo-trinkgut-jammers.png` | `828 × 324` | `275dbc9364073ca251933729218228bc661cc5f581fbd5a2107129bc69da09fb` | Open Graph branding |

Run:

```bash
for image in public/images/gallery/team-sven-niko.jpg public/images/gallery/team-gruppenfoto.jpg public/images/gallery/team-niko.jpg public/images/gallery/team-jasmin.jpg public/images/gallery/team-gabriella.jpg public/images/eigenmarken/pralle-kirsche.png public/images/eigenmarken/schwarzer-teufel.png public/images/eigenmarken/caramello.png public/images/logo-trinkgut-jammers.png; do sips -g pixelWidth -g pixelHeight "$image"; shasum -a 256 "$image"; done
```

Expected: all nine tracked build inputs exist with the exact dimensions and SHA-256 values above; no external download or new rights decision is needed.

All four current `public/images/Preislisten/*.png` files expose Canva XMP identifiers. Confirm that fact read-only now, but do not move them until the privacy regression is RED in Step 3. The implementation must then move them with `git mv` to `assets/source/preislisten/`, update `assets/INVENTAR.md`, and assert no `public/images/Preislisten` file remains. Preserve these exact private evidence hashes for the two used records:

- inventory `1.png`: `e75ce8cc5df983417bc8953226ff6a13de7b8f5e311d6e1295480327c2199336` (`1414 × 2000`, as of `06.03.2026`);
- price `2.png`: `6e14d9f95450550e1fb69861bccf4ba96d66f04d54c8ed3f14f04145ca944bee` (`1414 × 2000`, as of `01.01.2026`).

The Canva-named candidates remain a later review queue and are not downloaded or referenced by runtime code. Continue to exclude customers, children, winners, unverified third parties, and extra young-looking portraits from this pass.

- [ ] **Step 2: Write failing output and editorial-contract tests**

Create `lib/cinematic/__tests__/assets.test.ts`:

```ts
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import nextConfig from "../../../next.config";

const output = resolve(process.cwd(), "public/images/home/cinematic");
const expected = [
  { name: "hero-team.webp", format: "webp", width: 915, height: 803, maxBytes: 100_000 },
  { name: "team-group.webp", format: "webp", width: 950, height: 840, maxBytes: 100_000 },
  { name: "team-niko.webp", format: "webp", width: 745, height: 727, maxBytes: 60_000 },
  { name: "team-jasmin.webp", format: "webp", width: 756, height: 718, maxBytes: 90_000 },
  { name: "team-gabriella.webp", format: "webp", width: 762, height: 711, maxBytes: 70_000 },
  { name: "poster-pralle-kirsche.webp", format: "webp", width: 1054, height: 1493, maxBytes: 230_000 },
  { name: "poster-schwarzer-teufel.webp", format: "webp", width: 1054, height: 1492, maxBytes: 230_000 },
  { name: "poster-caramello.webp", format: "webp", width: 1054, height: 1493, maxBytes: 230_000 },
  { name: "og-home.jpg", format: "jpeg", width: 1200, height: 630, maxBytes: 160_000 },
] as const;

const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

describe("cinematic image pipeline", () => {
  test("pins the deterministic Sharp toolchain", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    expect(packageJson.dependencies.sharp).toBe("0.34.5");
  });

  test.each(expected)("creates exact, stripped $name", async ({ name, format, width, height, maxBytes }) => {
    const file = resolve(output, name);
    expect(existsSync(file)).toBe(true);
    const metadata = await sharp(file).metadata();
    expect(metadata).toMatchObject({ format, width, height });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
    expect(readFileSync(file).byteLength).toBeLessThan(maxBytes);
  });

  test("contains only the exact output allowlist", () => {
    expect(readdirSync(output).sort()).toEqual(expected.map(({ name }) => name).sort());
  });

  test("uses a valid ordered Next 16 candidate partition", () => {
    expect(nextConfig.images?.formats).toEqual(["image/avif", "image/webp"]);
    expect(nextConfig.images?.deviceSizes).toEqual([640, 768, 1024, 1280, 1440, 1920, 2560]);
    expect(nextConfig.images?.imageSizes).toEqual([32, 48, 64, 96, 128, 256, 360, 390, 512]);
    expect(Math.max(...nextConfig.images!.imageSizes!)).toBeLessThan(Math.min(...nextConfig.images!.deviceSizes!));
  });

  test("keeps Canva evidence private and source-bound", () => {
    expect(existsSync(resolve("public/images/Preislisten"))).toBe(false);
    expect(readdirSync(resolve("assets/source/preislisten")).sort()).toEqual(["1.png", "2.png", "3.png", "4.png"]);
    expect(sha256(resolve("assets/source/preislisten/1.png"))).toBe("e75ce8cc5df983417bc8953226ff6a13de7b8f5e311d6e1295480327c2199336");
    expect(sha256(resolve("assets/source/preislisten/2.png"))).toBe("6e14d9f95450550e1fb69861bccf4ba96d66f04d54c8ed3f14f04145ca944bee");
    expect(sha256(resolve("assets/source/preislisten/3.png"))).toBe("c623c88575d0e4f0c5fd11740e33967632720bc80ab1e9655629ed47dce10ffb");
    expect(sha256(resolve("assets/source/preislisten/4.png"))).toBe("9311dcdaba18705460faf12f43144fb5b2a55b3b2e079167cb4a912aa40cfdf2");
  });

  test("rebuilds byte-identically in a clean temp target and removes stale output", () => {
    const temp = mkdtempSync(join(tmpdir(), "jammers-cinematic-"));
    try {
      writeFileSync(join(temp, "stale.txt"), "must disappear");
      const env = { ...process.env, CINEMATIC_ASSET_OUTPUT_DIR: temp };
      execFileSync(process.execPath, ["scripts/build-cinematic-assets.mjs"], { env });
      const first = Object.fromEntries(readdirSync(temp).sort().map((name) => [name, sha256(join(temp, name))]));
      execFileSync(process.execPath, ["scripts/build-cinematic-assets.mjs"], { env });
      const second = Object.fromEntries(readdirSync(temp).sort().map((name) => [name, sha256(join(temp, name))]));
      expect(Object.keys(first)).toEqual(expected.map(({ name }) => name).sort());
      expect(second).toEqual(first);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
```

Create `lib/cinematic/__tests__/editorial.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  EDITORIAL_IMAGES,
  INSTAGRAM_SELECTION,
  PEOPLE_STORY,
  RENTAL_HIGHLIGHTS,
  RENTAL_SOURCES,
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

  test("keeps the approved people story local, unique, and release-gated", () => {
    expect(PEOPLE_STORY).toHaveLength(5);
    expect(new Set(PEOPLE_STORY.map(({ id }) => id)).size).toBe(5);
    for (const item of PEOPLE_STORY) {
      expect(item.alt.length).toBeGreaterThan(12);
      expect(item.reviewedAt).toBe("2026-07-14");
      expect(item.releaseBasis).toBe("user-approved-local-employee-pool-2026-07-14");
    }
    expect(EDITORIAL_IMAGES.jasmin.caption).toBe("Jasmin · Team Jammers");
    expect(EDITORIAL_IMAGES.gabriella.caption).toBe("Gabriella · Team Jammers");
  });

  test("does not fabricate a dated Instagram feed", () => {
    expect(INSTAGRAM_SELECTION).toEqual([]);
  });

  test("uses the sourced rental price and inventory facts", () => {
    expect(RENTAL_HIGHLIGHTS).toEqual([
      { name: "Kühlanhänger", price: "150 €", stock: 3 },
      { name: "Kühltruhe", price: "35 €", stock: 4 },
      { name: "Stehtisch", price: "12 €", stock: 20 },
      { name: "Zapfanlage", price: "25 €", stock: 3 },
      { name: "Bierzeltgarnitur", price: "15 €", stock: 13 },
    ]);
    expect(RENTAL_SOURCES).toEqual({
      price: { label: "Leihartikel-Preisliste", asOf: "01.01.2026" },
      inventory: { label: "Bestandsprüfung", asOf: "06.03.2026" },
    });
    expect(JSON.stringify(RENTAL_SOURCES)).not.toContain("Preislisten/");
    expect(JSON.stringify(RENTAL_SOURCES)).not.toContain("href");
  });

  test("limits service promises to the three explicitly confirmed services", () => {
    expect(SERVICE_ITEMS).toEqual([
      { number: "01", title: "Persönliche Beratung", text: "Direkter Kontakt mit dem Team im Markt.", href: "/kontakt" },
      { number: "02", title: "Partybedarf", text: "Partybedarf bei Trinkgut Jammers in Goch.", href: "/partyplaner" },
      { number: "03", title: "Vermietung", text: "Mietartikel anfragen und Verfügbarkeit bestätigen lassen.", href: "/vermietung" },
    ]);
  });

  test("deep-freezes every exported collection and nested record", () => {
    for (const value of [EDITORIAL_IMAGES, PEOPLE_STORY, INSTAGRAM_SELECTION, SPOTLIGHT_POSTERS, SERVICE_ITEMS, RENTAL_HIGHLIGHTS, RENTAL_SOURCES]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Object.values(EDITORIAL_IMAGES).every(Object.isFrozen)).toBe(true);
    expect([...SPOTLIGHT_POSTERS, ...SERVICE_ITEMS, ...RENTAL_HIGHLIGHTS].every(Object.isFrozen)).toBe(true);
  });
});
```

Before touching the token implementation, extend `lib/cinematic/__tests__/tokens.test.ts`:

```ts
test("caps every Spotlight frame at the 1054 CSS-pixel poster master", () => {
  expect(CINEMATIC_TOKENS.layout.posterWidth).toBe(
    "min(clamp(34rem, 64vw, 65.875rem), 1054px)",
  );
  expect(cinematicTokenStyle["--cinematic-layout-poster-width"]).toBe(
    "min(clamp(34rem, 64vw, 65.875rem), 1054px)",
  );
});
```

- [ ] **Step 3: Run the tests to prove the red state**

Run: `npm test -- lib/cinematic/__tests__/assets.test.ts lib/cinematic/__tests__/editorial.test.ts lib/cinematic/__tests__/tokens.test.ts`

Expected: FAIL because the private evidence move, exact outputs, build/check script, native-width token, and `data/cinematic-editorial.ts` do not exist. Record assertion failures separately from missing-module failures.

- [ ] **Step 4: Implement the deterministic Sharp build**

Create `scripts/build-cinematic-assets.mjs`:

Start implementation by creating `assets/source/preislisten/`, moving all four PNGs there with `git mv`, and updating the inventory note. Do not decode/re-encode or otherwise alter the private evidence bytes; the hash tests are the audit chain. No public derivative or manifest link is created for them.

Implement these exact invariants rather than the earlier minimal loop:

1. Store the nine source paths, exact dimensions, hashes, crops, and output dimensions in one frozen job table. Read and SHA-256 every input and inspect every source with Sharp **before** creating or replacing any output.
2. Accept `CINEMATIC_ASSET_OUTPUT_DIR` for temp-test builds; otherwise target `public/images/home/cinematic`. Build all nine outputs into a random same-parent staging directory. Validate its exact allowlist before replacing the destination; remove/rollback staging on error so a failed source/build never leaves a partial public directory. A successful rebuild removes stale outputs.
3. Apply `rotate()`, the exact approved crop, `toColourspace("srgb")`, the specified team grade, and `.webp({ quality: 82, effort: 6 })`. Never call `withMetadata`; output EXIF/XMP/ICC must be absent. Do not resize/upscale the eight WebPs.
4. Build `og-home.jpg` as `1200 × 630`: darkened authentic hero crop on the right; approved `logo-trinkgut-jammers.png` on the left; deterministic yellow/red brand geometry; and `GOCH SCHENKT EIN.` as path/rectangle geometry rather than environment-font-dependent SVG `<text>`. Use only approved palette literals in this build script. Visually inspect the result at full size before commit.
5. Support `--check`: build to temp, compare exact filenames and bytes against the committed destination, delete temp, and exit non-zero on drift without modifying tracked files.
6. Print `Built 9 Cinematic assets in …` only after a fully successful build. Never reference the duplicate uppercase poster directory.

Pin the already-installed runtime exactly:

```bash
npm install --save-exact sharp@0.34.5
npm pkg set scripts.assets:cinematic="node scripts/build-cinematic-assets.mjs"
npm pkg set scripts.assets:cinematic:check="node scripts/build-cinematic-assets.mjs --check"
```

In `next.config.ts`, add these keys inside the existing `images` object while preserving every existing route dependency:

```ts
formats: ["image/avif", "image/webp"],
deviceSizes: [640, 768, 1024, 1280, 1440, 1920, 2560],
imageSizes: [32, 48, 64, 96, 128, 256, 360, 390, 512],
```

Update the reviewed layout token to cap the poster at its native width:

```ts
layout: {
  // existing values unchanged
  posterWidth: "min(clamp(34rem, 64vw, 65.875rem), 1054px)",
},
```

The token regression must already be RED from Step 3. The outer pixel `min()` is mandatory: a rem-only maximum can exceed the 1054 CSS-pixel master when the user increases the root font size. Later image components must additionally cap every employee image to its own static-import intrinsic width and use honest `sizes`; no component may visually upscale a derivative.

Run:

```bash
npm run assets:cinematic
npm run assets:cinematic:check
```

Expected: build prints `Built 9 Cinematic assets`; check exits `0`; the nine exact outputs exist with no stale file and no tracked drift after the check.

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

function deepFreeze<T extends object>(value: T): T {
  for (const entry of Object.values(value)) {
    if (typeof entry === "object" && entry !== null && !Object.isFrozen(entry)) deepFreeze(entry);
  }
  return Object.freeze(value);
}

type EditorialImage = Readonly<{
  id: string;
  image: StaticImageData;
  alt: string;
  caption: string;
  reviewedAt: string;
  releaseBasis: "user-approved-local-employee-pool-2026-07-14";
}>;

export type InstagramSelectionItem = Readonly<{
  id: string;
  image: StaticImageData;
  date: string;
  dateKind: "captured" | "published";
  caption: string;
  href: string;
  sourceUrl: string;
  releaseBasis: string;
}>;

export const EDITORIAL_IMAGES = deepFreeze({
  hero: { id: "hero-team", image: heroTeam, alt: "Sven und Niko von Trinkgut Jammers", caption: "Sven & Niko · vor Ort in Goch", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  group: { id: "team-group", image: teamGroup, alt: "Mitarbeiterinnen und Mitarbeiter von Trinkgut Jammers", caption: "Team Jammers", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  niko: { id: "team-niko", image: teamNiko, alt: "Nikolaos Jammers im Markt", caption: "Niko · Inhaber", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  jasmin: { id: "team-jasmin", image: teamJasmin, alt: "Jasmin von Trinkgut Jammers", caption: "Jasmin · Team Jammers", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
  gabriella: { id: "team-gabriella", image: teamGabriella, alt: "Gabriella von Trinkgut Jammers", caption: "Gabriella · Team Jammers", reviewedAt: "2026-07-14", releaseBasis: "user-approved-local-employee-pool-2026-07-14" },
} as const satisfies Readonly<Record<string, EditorialImage>>);

export const PEOPLE_STORY = deepFreeze([
  EDITORIAL_IMAGES.group,
  EDITORIAL_IMAGES.hero,
  EDITORIAL_IMAGES.niko,
  EDITORIAL_IMAGES.jasmin,
  EDITORIAL_IMAGES.gabriella,
] as const);

export const INSTAGRAM_SELECTION: readonly InstagramSelectionItem[] = deepFreeze([] as InstagramSelectionItem[]);

export const SPOTLIGHT_POSTERS = deepFreeze([
  { number: "01", name: "Pralle Kirsche", label: "Originalposter", copy: "Rot im Bild. Goch im Rücken.", image: posterPralleKirsche, alt: "Originalposter Pralle Kirsche", href: "/eigenmarke" },
  { number: "02", name: "Schwarzer Teufel", label: "Originalposter", copy: "Schwarz gerahmt. Direkt ins Licht.", image: posterSchwarzerTeufel, alt: "Originalposter Schwarzer Teufel", href: "/eigenmarke" },
  { number: "03", name: "Caramello", label: "Originalposter", copy: "Goldener Auftritt. Teil der Jammers-Serie.", image: posterCaramello, alt: "Originalposter Caramello", href: "/eigenmarke" },
] as const);

export const SERVICE_ITEMS = deepFreeze([
  { number: "01", title: "Persönliche Beratung", text: "Direkter Kontakt mit dem Team im Markt.", href: "/kontakt" },
  { number: "02", title: "Partybedarf", text: "Partybedarf bei Trinkgut Jammers in Goch.", href: "/partyplaner" },
  { number: "03", title: "Vermietung", text: "Mietartikel anfragen und Verfügbarkeit bestätigen lassen.", href: "/vermietung" },
] as const);

export const RENTAL_HIGHLIGHTS = deepFreeze([
  { name: "Kühlanhänger", price: "150 €", stock: 3 },
  { name: "Kühltruhe", price: "35 €", stock: 4 },
  { name: "Stehtisch", price: "12 €", stock: 20 },
  { name: "Zapfanlage", price: "25 €", stock: 3 },
  { name: "Bierzeltgarnitur", price: "15 €", stock: 13 },
] as const);

export const RENTAL_SOURCES = deepFreeze({
  price: { label: "Leihartikel-Preisliste", asOf: "01.01.2026" },
  inventory: { label: "Bestandsprüfung", asOf: "06.03.2026" },
} as const);
```

Do not add a capture/publication date to a team image unless it is evidenced. `reviewedAt` is a rights/editorial review date only and is never rendered as an Instagram post date. `Niko · Inhaber` is verified; Jasmin and Gabriella remain neutral team labels until separately confirmed. Keep all poster copy visual/character-based and add no taste, quality, price, or availability claim.

- [ ] **Step 6: Verify images, manifest, type safety, and absence of accidental raw sources**

Run:

```bash
npm test -- lib/cinematic/__tests__/assets.test.ts lib/cinematic/__tests__/editorial.test.ts
npm test -- lib/cinematic/__tests__/tokens.test.ts lib/cinematic/__tests__/site.test.ts
npm run assets:cinematic:check
npx tsc --noEmit
npm run lint
npm run build
test -d .next
set +e
rg -l 'assets/source/preislisten' .next --glob '*.nft.json'
trace_status=$?
set -e
test "$trace_status" -eq 1
git status --short
```

Expected: all tests, deterministic check, TypeScript, lint, build, and private-trace exclusion PASS; only `rg` exit `1` means no traced match, while exit `2` remains a failure. If Next traces a private evidence file, add the narrow supported `outputFileTracingExcludes` rule and rebuild until the assertion is clean. View every derivative at original size. Confirm crops contain only the approved employee pool; posters are complete/not upscaled; OG has authentic team evidence, logo, claim geometry, and no blank accidental panel. Before staging, `git status` shows the four old `public/images/Preislisten` paths exclusively as deletions and the four new `assets/source/preislisten` paths exclusively as untracked private files; no public replacement, external download, or other raw source appears.

- [ ] **Step 7: Commit the curated pipeline**

```bash
git add package.json package-lock.json next.config.ts lib/cinematic/tokens.ts lib/cinematic/__tests__/tokens.test.ts scripts/build-cinematic-assets.mjs data/cinematic-editorial.ts lib/cinematic/__tests__/assets.test.ts lib/cinematic/__tests__/editorial.test.ts public/images/home/cinematic assets/INVENTAR.md
git add -u public/images/Preislisten
git add assets/source/preislisten
git commit -m "feat: add curated cinematic image pipeline"
```

### Task 3: Correct Root Metadata and Isolate the Production Homepage Chrome

**Hard prerequisite and atomic handoff:**

- Task 2 must be committed, independently review-clean, and green through `npm run assets:cinematic:check` and `npm run build`; `public/images/home/cinematic/og-home.jpg` is a required 1200×630 JPEG input, not an optional future asset.
- Start from a clean worktree. Do not create a local substitute for the Task-1 fact contract or the Task-2 OG asset.
- This task deliberately removes the legacy root shell before Task 4 supplies the Cinematic banner/main/contentinfo. Its commit is therefore a non-deployable intermediate state. Do not push, deploy, or pause the handoff between Task 3 and Task 4; final root-landmark and no-JS acceptance is completed in Task 4.

**Files:**
- Create: `lib/cinematic/metadata.ts`
- Create: `lib/chrome-visibility.ts`
- Create: `lib/cinematic/__tests__/metadata.test.ts`
- Create: `lib/cinematic/__tests__/chrome-visibility.test.ts`
- Create: `lib/cinematic/__tests__/json-ld-script.test.tsx`
- Create: `components/JsonLdScript.tsx`
- Create: `components/RouteContent.tsx`
- Create: `e2e/metadata-chrome.spec.ts`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/nl/layout.tsx`
- Modify: `components/DeChrome.tsx`
- Modify: `components/Header.tsx`

**Interfaces:**
- Produces: `SITE_METADATA: Metadata`, `HOMEPAGE_METADATA: Metadata`, `LOCAL_BUSINESS_JSON_LD`, `serializeJsonLd(value)`, and `shouldHideLegacyChrome(pathname: string): boolean`.
- Consumes: `MARKET` and `SITE_LINKS` from Task 1 plus the exact Task-2 asset `public/images/home/cinematic/og-home.jpg`.
- `SITE_METADATA` is site-wide and must never assign the root canonical or the homepage-specific OG image to child routes. `HOMEPAGE_METADATA` owns the complete root canonical, reciprocal `de`/`nl` alternates, and homepage OG record.
- Existing cart/wishlist providers, cookie banner, and non-root route chrome remain intact. Legacy header/footer/drawers/floating tools become lazy chunks and are not requested on `/` or `/nl`.
- `RouteContent` preserves the existing global `<main>` on every non-root route, including `/nl`, but uses a neutral `<div>` on `/` so Task 4 can own the root banner/main/contentinfo without nested landmarks.
- Because the predecessor `app/page.tsx` is a Client Component and cannot export metadata, Task 3 replaces it with a minimal Server Component handoff that exports `HOMEPAGE_METADATA`. This intentionally non-deployable surface contains only `data-cinematic-handoff`; Task 4 immediately replaces it with the complete Cinematic homepage. Do not retain or relocate the old client homepage.

- [ ] **Step 1: Write failing metadata, serializer, and route-boundary tests**

Before creating any RED test file, produce and freeze the clean Task-2 predecessor build:

```bash
npm run build
test -s .next/BUILD_ID
cp .next/BUILD_ID /tmp/cinematic-task3-predecessor-build-id
```

This is a baseline artifact check, not a GREEN result for Task 3. After the RED files exist, do not rebuild the predecessor: `tsconfig.json` intentionally includes those unresolved unit-test imports. The browser RED must start this exact captured `.next` build and first pass `cmp -s .next/BUILD_ID /tmp/cinematic-task3-predecessor-build-id`.

Create `lib/cinematic/__tests__/metadata.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { metadata as nlMetadata } from "@/app/nl/layout";
import {
  HOMEPAGE_METADATA,
  LOCAL_BUSINESS_JSON_LD,
  SITE_METADATA,
  serializeJsonLd,
} from "@/lib/cinematic/metadata";

describe("homepage metadata", () => {
  test("keeps root-only canonical, hreflang, and OG out of site metadata", () => {
    expect(SITE_METADATA.alternates?.canonical).toBeUndefined();
    expect(SITE_METADATA.openGraph).toBeUndefined();
    expect(HOMEPAGE_METADATA.title).toEqual({ absolute: "Goch schenkt ein. | Trinkgut Jammers" });
    expect(HOMEPAGE_METADATA.alternates).toEqual({
      canonical: "/",
      languages: { de: "/", nl: "/nl" },
    });
    expect(HOMEPAGE_METADATA.openGraph).toMatchObject({
      url: "/",
      title: "Goch schenkt ein. | Trinkgut Jammers",
      images: [{
        url: "/images/home/cinematic/og-home.jpg",
        width: 1200,
        height: 630,
      }],
    });
    expect(nlMetadata.alternates).toEqual({
      canonical: "/nl",
      languages: { de: "/", nl: "/nl" },
    });
    expect(nlMetadata.keywords).toBeUndefined();
    expect(JSON.stringify(nlMetadata)).not.toMatch(/25\s*%|7(?:[.,\s]?000)|3\s*km|gratis parkeren|wij spreken|goedko(?:op|per)|bespaar|Duitse prijzen/i);
  });

  test("contains exactly the approved LocalBusiness facts", () => {
    expect(LOCAL_BUSINESS_JSON_LD).toEqual({
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
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "20:00",
      }],
      sameAs: ["https://www.instagram.com/trinkgutjammers_goch/"],
    });
    expect(JSON.stringify(LOCAL_BUSINESS_JSON_LD)).not.toMatch(
      /7(?:[.,\s]?000)|liefer(?:ung|n)|inStock|priceRange|25\s*%/i,
    );
  });

  test("serializes JSON-LD without a script-breakout sequence", () => {
    const serialized = serializeJsonLd({ probe: "</script><script>alert(1)</script>" });
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
  });
});
```

Create `lib/cinematic/__tests__/json-ld-script.test.tsx` before implementation. Render `JsonLdScript` with `renderToStaticMarkup` and the sentinel `</script><script>alert(1)</script>`. Assert that the output contains one `application/ld+json` script, contains `\\u003c/script>`, and contains neither the raw sentinel nor a second script element. This test proves the serializer is used at the real script sink rather than only in isolation.

Create `lib/cinematic/__tests__/chrome-visibility.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { shouldHideLegacyChrome } from "@/lib/chrome-visibility";

describe("legacy chrome boundary", () => {
  test.each([["/", true], ["/nl", true], ["/nl/angebote", true], ["/nlde", false], ["/angebote", false], ["/kontakt", false]])(
    "%s => %s",
    (pathname, expected) => expect(shouldHideLegacyChrome(pathname)).toBe(expected),
  );
});
```

Also create the complete `e2e/metadata-chrome.spec.ts` contract described in Step 5 now, before any Task-3 production change. Prefix every pre-implementation browser contract title with `[product-contract]` so the RED harness can distinguish intended assertion failures from infrastructure failures. Keep all expected title, metadata, URL, JSON-LD, sentinel, and accessibility values as test-owned literals: the E2E file must not import the not-yet-existing `LOCAL_BUSINESS_JSON_LD`, serializer, chrome helper, or any Cinematic component before the browser RED.

- [ ] **Step 2: Run the tests to prove the red state**

Run the focused unit tests, verify the frozen predecessor `BUILD_ID` is unchanged, start that already-built artifact on an isolated verified port without invoking `next build`, and run `e2e/metadata-chrome.spec.ts` once before implementation. Capture both REDs explicitly; a later successful command must never mask them.

```bash
set -euo pipefail
set +e
npm test -- lib/cinematic/__tests__/metadata.test.ts lib/cinematic/__tests__/chrome-visibility.test.ts lib/cinematic/__tests__/json-ld-script.test.tsx > /tmp/cinematic-task3-unit-red.log 2>&1
UNIT_RED=$?
set -e
cat /tmp/cinematic-task3-unit-red.log
test "$UNIT_RED" -ne 0
rg -q 'Cannot find|Failed to resolve|does not provide an export|expected' /tmp/cinematic-task3-unit-red.log
cmp -s .next/BUILD_ID /tmp/cinematic-task3-predecessor-build-id
```

For the browser RED, use the owned-process harness from Step 6 but accept any `200` root response as readiness because the predecessor has no Task-3 marker yet. Port freedom, live PID, explicit readiness, and cleanup are still mandatory. Run Playwright with `--reporter=json` under a temporary `set +e`, store `BROWSER_RED=$?`, restore `set -e`, and require all of: nonzero `BROWSER_RED`, at least one `[product-contract]` record with an `unexpected` result, and no `ECONNREFUSED`, `ERR_CONNECTION_REFUSED`, port-collision, missing-test-file, or config/import error. Expected: unit RED from unresolved Task-3 modules; browser RED from concrete old-metadata, legacy-root, Unicode-name, and chunk-boundary assertions. A missing server, port collision, or broken test import does not count as product RED.

```bash
set +e
PLAYWRIGHT_BASE_URL="http://127.0.0.1:$PORT" npm run test:e2e -- e2e/metadata-chrome.spec.ts --reporter=json > /tmp/cinematic-task3-browser-red.json 2>&1
BROWSER_RED=$?
set -e
test "$BROWSER_RED" -ne 0
rg -Fq '[product-contract]' /tmp/cinematic-task3-browser-red.json
rg -q '"status"[[:space:]]*:[[:space:]]*"unexpected"' /tmp/cinematic-task3-browser-red.json
! rg -qi 'ECONNREFUSED|ERR_CONNECTION_REFUSED|address already in use|No tests found|Cannot find module|Failed to resolve import' /tmp/cinematic-task3-browser-red.json
```

- [ ] **Step 3: Implement split metadata, exact JSON-LD semantics, and safe serialization**

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
};

export const HOMEPAGE_METADATA: Metadata = {
  title: { absolute: "Goch schenkt ein. | Trinkgut Jammers" },
  description,
  alternates: { canonical: "/", languages: { de: "/", nl: "/nl" } },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Trinkgut Jammers",
    url: "/",
    title: "Goch schenkt ein. | Trinkgut Jammers",
    description,
    images: [{ url: "/images/home/cinematic/og-home.jpg", width: 1200, height: 630, alt: "Trinkgut Jammers – Goch schenkt ein." }],
  },
};

export const LOCAL_BUSINESS_JSON_LD = Object.freeze({
  "@context": "https://schema.org",
  "@type": "LiquorStore",
  "@id": "https://trinkgut-jammers.de/#market",
  name: MARKET.displayName,
  legalName: MARKET.legalName,
  url: "https://trinkgut-jammers.de",
  telephone: "+49 2823 418707",
  email: MARKET.email,
  owner: { "@type": "Person", name: MARKET.owner },
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

export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError("JSON-LD value is not serializable");
  return serialized.replace(/</g, "\\u003c");
}
```

Do not place any root canonical or `og-home.jpg` reference in `SITE_METADATA`. Do not reintroduce `founder`, `alternateName`, `priceRange`, delivery, assortment-size, stock, discount, or unverified social claims.

Create `components/JsonLdScript.tsx` as a Server Component. It accepts `value: unknown` and is the only production sink for JSON-LD:

```tsx
import { serializeJsonLd } from "@/lib/cinematic/metadata";

export default function JsonLdScript({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
```

- [ ] **Step 4: Implement the pure chrome boundary, lazy slots, and route-sensitive content wrapper**

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

Create `components/RouteContent.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";

export default function RouteContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname === "/"
    ? <div className="flex-1">{children}</div>
    : <main className="flex-1">{children}</main>;
}
```

In `app/layout.tsx`, replace the inline metadata and JSON-LD object with imports and keep the existing fonts/providers unchanged:

```tsx
import {
  LOCAL_BUSINESS_JSON_LD,
  SITE_METADATA,
} from "@/lib/cinematic/metadata";
import JsonLdScript from "@/components/JsonLdScript";
export const metadata = SITE_METADATA;
// Render <JsonLdScript value={LOCAL_BUSINESS_JSON_LD} />; do not keep a second inline script sink.
```

Also remove direct imports of `Header`, `Footer`, `CartDrawer`, `WishlistDrawer`, `WhatsAppButton`, and `AIAssistant`, then render the lazy slots inside the existing providers:

```tsx
<DeChrome slot="header" />
<RouteContent>{children}</RouteContent>
<DeChrome slot="footer" />
<DeChrome slot="drawers" />
<DeChrome slot="floating" />
<CookieBanner />
```

Keep provider order unchanged. In `components/Header.tsx`, fix the three JSX-attribute literals so their accessible names are real Unicode text: `Warenkorb öffnen`, `Menü`, and `Schließen`; JavaScript `\\u` escapes inside a quoted JSX attribute are otherwise exposed literally.

In `app/nl/layout.tsx`, add `canonical: "/nl"`, retain the reciprocal `languages: { de: "/", nl: "/nl" }` set, delete the entire legacy `keywords` field, and replace every unverified metadata claim (`25%`, `7.000+`, `3 km`, free parking, language promise, `goedkoop`/`goedkoper`, `bespaar`, or `Duitse prijzen`) with neutral confirmed copy: a Dutch-information title plus personal advice, party supplies, rental, Jurgensstraße 20, and Mo–Sa 08:00–20:00. Neutralize title, description, and Open Graph together. Keep the existing NL page body out of this homepage task, but do not publish unsupported claims in its metadata.

Replace the legacy client `app/page.tsx` with the explicit atomic-handoff Server Component so the Task-3 metadata contract is actually bound to `/` before its browser smoke:

```tsx
import { HOMEPAGE_METADATA } from "@/lib/cinematic/metadata";

export const metadata = HOMEPAGE_METADATA;

export default function CinematicHandoff() {
  return <div data-cinematic-handoff />;
}
```

Do not move the predecessor page to another production file. Its unsupported content and default-prefetch links must not survive as an unused bundle or contaminate the root chunk-isolation smoke. This handoff file is replaced—not wrapped—by Task 4.

- [ ] **Step 5: Add a real production metadata/chrome smoke**

Create `e2e/metadata-chrome.spec.ts` against a production build. It must fail before the Task-3 implementation and prove all of the following without weak URL-only assertions:

- `/` head: exact absolute title, canonical `/`, reciprocal `de`/`nl` alternates, homepage OG title, absolute OG image meta value `https://trinkgut-jammers.de/images/home/cinematic/og-home.jpg`, and absolute `og:url` `https://trinkgut-jammers.de/`. Do not request the production origin: parse the asserted OG value, request only its pathname `/images/home/cinematic/og-home.jpg` against Playwright's local `baseURL`, and require local `200` plus `content-type: image/jpeg`.
- `/` body contains exactly one `script[type="application/ld+json"]`; parse that real script sink and require deep equality with the approved object, including nested `@type` values, while the raw response contains no `</script><script>` breakout sequence.
- `/kontakt` and `/angebote`: neither route inherits canonical `/` nor `og-home.jpg`.
- `/nl`: canonical `/nl`, reciprocal `de`/`nl` alternates, custom NL navigation present, no legacy `.glass-header`.
- Prove the chunk detector first in a fresh `/angebote` context: capture JavaScript response bodies and map all six unique sentinels to their loaded script URLs—Header `Warenkorb öffnen`, Footer `Trinkgut Jammers Goch e.K.`, CartDrawer `Dein Warenkorb ist leer.`, WishlistDrawer `Dein Merkzettel ist leer`, WhatsAppButton `WhatsApp Chat`, and AIAssistant `Jammers Assistent`. Fail if any sentinel is not found; two strings are not sufficient evidence for six modules.
- In a separate fresh `/` context: no `.glass-header`, legacy floating control, cart/wishlist drawer, any of the six sentinels, or any script URL proven above may be requested. Count production prefetch downloads as real downloads; if a root link causes legacy chunks to load, set `prefetch={false}` on that root link in Task 4 rather than weakening this assertion.
- `/angebote`: legacy header, footer, WhatsApp/floating tools remain; both `Warenkorb öffnen` and `Merkzettel` open their named dialogs and can close again.
- With `localStorage` empty, `Wir nutzen Cookies` remains visible on `/` and `/angebote`.
- Capture `console.error`, console warnings containing hydration text, and `pageerror`; require an empty list.

This Task-3 smoke requires exactly one `[data-cinematic-handoff]` and intentionally does not accept the final root landmark tree because the Cinematic shell is created in Task 4. It also proves the retired legacy root page contributes no content or prefetch downloads. Task 4 replaces the handoff with exactly one root banner/main/contentinfo, no nesting, and No-JS server content.

- [ ] **Step 6: Verify unit contracts and the real production boundary**

Run:

```bash
set -euo pipefail
npm test -- lib/cinematic/__tests__/metadata.test.ts lib/cinematic/__tests__/chrome-visibility.test.ts lib/cinematic/__tests__/json-ld-script.test.tsx
npm test
npx tsc --noEmit
npm run lint
npm run build
PORT=3102
LOG=/tmp/cinematic-task3.log
HTML=/tmp/cinematic-task3.html
test -z "$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t)"
: > "$LOG"
APP_PID=""
cleanup() {
  exit_code=$?
  trap - EXIT
  trap '' INT TERM
  if test -n "$APP_PID"; then
    if kill -0 "$APP_PID" 2>/dev/null; then kill "$APP_PID" 2>/dev/null || true; fi
    wait "$APP_PID" 2>/dev/null || true
  fi
  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port "$PORT" > "$LOG" 2>&1 &
APP_PID=$!
READY=0
for attempt in {1..30}; do
  kill -0 "$APP_PID" 2>/dev/null || { tail -80 "$LOG"; exit 1; }
  if curl -fsS "http://127.0.0.1:$PORT/" > "$HTML" &&
    rg -q 'images/home/cinematic/og-home\.jpg' "$HTML" &&
    rg -q 'data-cinematic-handoff' "$HTML"; then
    READY=1
    break
  fi
  sleep 1
done
test "$READY" -eq 1
PLAYWRIGHT_BASE_URL="http://127.0.0.1:$PORT" npm run test:e2e -- e2e/metadata-chrome.spec.ts
test "$(curl -fsSI "http://127.0.0.1:$PORT/images/home/cinematic/og-home.jpg" | awk 'BEGIN{IGNORECASE=1} /^content-type:/{print tolower($0)}' | tr -d '\r')" = "content-type: image/jpeg"
```

Expected: all unit and production-browser assertions PASS; TypeScript/lint/build exit `0`; build still lists `/`, `/angebote`, `/kontakt`, and `/nl`; the process is always cleaned up. Confirm `git diff --check` and a targeted scope diff before commit.

- [ ] **Step 7: Commit the non-deployable metadata/chrome half of the atomic handoff**

```bash
git add lib/cinematic/metadata.ts lib/chrome-visibility.ts lib/cinematic/__tests__/metadata.test.ts lib/cinematic/__tests__/chrome-visibility.test.ts lib/cinematic/__tests__/json-ld-script.test.tsx app/page.tsx app/layout.tsx app/nl/layout.tsx components/JsonLdScript.tsx components/DeChrome.tsx components/RouteContent.tsx components/Header.tsx e2e/metadata-chrome.spec.ts
git commit -m "feat: isolate cinematic root chrome and metadata"
```

Immediately continue to Task 4. Do not push or deploy this intermediate commit.

### Task 4: Compose the Static-First Homepage and Consume the Shared Content Adapter

**Hard start gate:**

- Tasks 2 and 3 must be committed, independently review-clean, and green through their production builds and Task-3 browser smoke. `HOMEPAGE_METADATA`, `RouteContent`, the lazy chrome boundary, and all Task-2 assets must exist for real; do not create local substitutes.
- Start from a clean worktree at the reviewed Task-3 head. Task 3 is not separately deployable, so finish and review this task before any push or deployment.
- Use an isolated production port, never the ambient port 3000 or an already-running checkout.

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/page.tsx`
- Create: `app/home.module.css`
- Create: `lib/cinematic/presentation.ts`
- Create: `lib/cinematic/server-clock.ts`
- Create: `lib/cinematic/__tests__/presentation.test.ts`
- Create: `lib/cinematic/__tests__/server-clock.test.ts`
- Create: `lib/cinematic/__tests__/handzettel-e2e-fixture.test.ts`
- Create: `lib/cinematic/__tests__/composition.test.tsx`
- Create: `lib/cinematic/__tests__/component-boundaries.test.ts`
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
- Create: `e2e/fixtures/handzettel-cache.json`
- Create: `e2e/homepage-interactions.spec.ts`
- Modify: `e2e/metadata-chrome.spec.ts`

**Interfaces:**
- Consumes exactly: `getHomepageContent(now?: Date): Promise<HomepageContent>` and the four types from `@/lib/homepage-content`.
- Produces: `CinematicHome({ content, nowIso }: { content: HomepageContent; nowIso: string })`, pure `buildCurrentView(content)`, `formatDate(dateKey)`, `formatDateRange(from, to)`, `formatPageCount(count)`, and fail-closed `canRenderHomepageImage(src)`.
- `resolveHomepageNow()` is the only root server clock. It uses real time unless both `CINEMATIC_E2E=1` and a strict canonical `CINEMATIC_TEST_NOW` are present; no global Date monkeypatch is permitted.
- Client boundaries: only `MobileNavigation`, `LiveMarketStatus`, and `FlyerViewer` carry `"use client"` in this task.
- The Hybrid adapter owns validity and fallback text. Presentation code never re-derives `active`/`expired`, extends a date, or invents a second fallback string.
- `validFrom`/`validTo` are a publication or action-validity interval, not proof of an event appointment. Render them only as `Gültig …` or `Aktionszeitraum …`; an actual appointment may appear only in the approved `summary`.
- Every non-root `Link` rendered by the root homepage uses `prefetch={false}` so production prefetch cannot download legacy route chrome on `/`.

- [ ] **Step 1: Write failing presentation, image-policy, composition, and client-boundary tests**

Before creating any Task-4 RED file, freeze the clean, review-green Task-3 predecessor build:

```bash
npm run build
test -s .next/BUILD_ID
cp .next/BUILD_ID /tmp/cinematic-task4-predecessor-build-id
```

Do not rebuild after the intentionally unresolved Task-4 unit imports are written. The browser RED starts this exact captured Task-3 artifact and first passes `cmp -s .next/BUILD_ID /tmp/cinematic-task4-predecessor-build-id`.

As test-infrastructure setup in this same RED step, add `/data/.handzettel-cache.*` to `.gitignore` before the cache harness is ever run, and prove both `data/.handzettel-cache.backup.probe` and `data/.handzettel-cache.install.probe` are ignored with `git check-ignore -q`. This protects the worktree even if the shell itself is killed before its EXIT trap can run; it does not alter application behavior.

Create `lib/cinematic/__tests__/presentation.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import type { HomepageContent } from "@/lib/homepage-content";
import nextConfig from "../../../next.config";
import {
  buildCurrentView,
  canRenderHomepageImage,
  formatDate,
  formatDateRange,
  formatPageCount,
} from "@/lib/cinematic/presentation";

const base: HomepageContent = {
  generatedAt: "2026-07-14T06:15:00.000Z",
  flyer: null,
  event: null,
  archive: [],
  fallbackMessage: "Der nächste Handzettel wird vorbereitet.",
};

describe("homepage presentation adapter", () => {
  test("formats date-only values and ranges without timezone drift", () => {
    expect(formatDate("2026-07-24")).toBe("24.07.2026");
    expect(formatDateRange("2026-07-24", "2026-07-24")).toBe("24.07.2026");
    expect(formatDateRange("2026-07-13", "2026-07-18")).toBe("13.–18.07.2026");
    expect(formatDateRange("2026-07-30", "2026-08-02")).toBe("30.07.–02.08.2026");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("30.12.2026–02.01.2027");
    expect(formatPageCount(1)).toBe("1 Seite");
    expect(formatPageCount(10)).toBe("10 Seiten");
  });

  test("passes the adapter-owned empty state through verbatim", () => {
    expect(buildCurrentView(base)).toEqual({
      flyer: null,
      event: null,
      fallbackMessage: "Der nächste Handzettel wird vorbereitet.",
    });
  });

  test("passes adapter-owned flyer/event records without deriving status", () => {
    const flyer = { id: "flyer-2026-29", title: "Handzettel", validFrom: "2026-07-13", validTo: "2026-07-18", viewerUrl: "https://example.test/view", pdfUrl: "https://example.test/flyer.pdf", pageCount: 8, coverUrl: "/images/flyer.webp", sourceUrl: "https://example.test/source" };
    const event = { id: "striker-2026", title: "Striker Ball Challenge", summary: "Am 24.07.2026 bei Trinkgut Jammers.", validFrom: "2026-07-14", validTo: "2026-07-24", image: "/images/events/strikerball.png", href: "/kontakt", sourceUrl: "https://example.test/event" };
    expect(buildCurrentView({ ...base, flyer, event })).toEqual({ flyer, event, fallbackMessage: null });
  });

  test("allows only local image assets and configured official remote hosts", () => {
    const configured = nextConfig.images?.remotePatterns?.map(({ hostname }) => hostname);
    expect(configured).toEqual(expect.arrayContaining([
      "media.trinkgut.de",
      "www.trinkgut.de",
      "werbung.trinkgut.de",
    ]));
    expect(canRenderHomepageImage("/images/events/strikerball.png")).toBe(true);
    expect(canRenderHomepageImage("https://werbung.trinkgut.de/catalog/cover.jpg")).toBe(true);
    expect(canRenderHomepageImage("https://unconfigured.example/asset.jpg")).toBe(false);
    expect(canRenderHomepageImage("/api/content/current")).toBe(false);
    expect(canRenderHomepageImage("/images/../api/content.jpg")).toBe(false);
    expect(canRenderHomepageImage("/images/%252e%252e/api/content.jpg")).toBe(false);
    expect(canRenderHomepageImage("/images/%252525252e%252525252e/api/content.jpg")).toBe(false);
    expect(canRenderHomepageImage("/images/%25252525252e%25252525252e/api/content.jpg")).toBe(false);
    expect(canRenderHomepageImage("/images/poster.jpg%0a")).toBe(false);
    expect(canRenderHomepageImage("//attacker.example/images/event.jpg")).toBe(false);
    expect(canRenderHomepageImage(" https://werbung.trinkgut.de/catalog/cover.jpg")).toBe(false);
    expect(canRenderHomepageImage("https://werbung.trinkgut.de/catalog/cover.jpg ")).toBe(false);
    expect(canRenderHomepageImage("https://werbung.trinkgut.de/catalog\\cover.jpg")).toBe(false);
    expect(canRenderHomepageImage("https://werbung.trinkgut.de:444/catalog/cover.jpg")).toBe(false);
    expect(canRenderHomepageImage("https://werbung.trinkgut.de/catalog/cover.jpg%250a")).toBe(false);
    expect(canRenderHomepageImage("https://werbung.trinkgut.de/%252525252e%252525252e/cover.jpg")).toBe(false);
  });
});
```

Create `lib/cinematic/__tests__/composition.test.tsx` with `renderToStaticMarkup` and deterministic empty and populated `HomepageContent` fixtures. Mock `next/link` before importing the components so its `prefetch` prop is exposed as `data-prefetch`; mock `next/image` as a semantic test `<img>` while removing Next-only props. Real image optimization and chunk loading remain production-build/browser gates. Before creating components, lock all of these assertions:

- exactly one `h1` and, inside `CinematicHome`, exactly one `header`, `main`, and `footer`; neither header nor footer is a descendant of main;
- order: Hero → Aktuell → Menschen → Service → Spotlight → optional Aktionen → Instagram → Footer;
- exactly five People figures and three poster figures in manifest order;
- empty state uses the adapter text with its final period; populated state uses only fixture flyer/event/archive data;
- no iframe while closed; flyer external viewer and PDF links already exist in server HTML;
- the dedicated event-interval element equals `Aktionszeitraum · ${formatDateRange(...)}` and never derives `Termin` or `Am …` from validity keys; do not scan the approved summary globally because it may legitimately contain `Am 24. Juli`; archive uses `Rückblick · 01.07.2026`;
- empty action state has neither `section#aktionen` nor a matching desktop/mobile navigation link; event or archive makes both appear, with every visible fragment link resolving to exactly one ID;
- audited Instagram fallback contains `Neue Einblicke folgen`, zero Instagram figures, and zero `<time>` elements; `reviewedAt` never appears;
- no `assets/source`, `Preislisten`, raw private path, unverified `7.000`, delivery, `inStock`, `sofort verfügbar`, or discount claim appears;
- exact Hero lead, rental evidence wording, reserve wording, contact links, WhatsApp, route, Instagram, NL, and legal links;
- HTTPS external event/source/viewer/PDF links carry `target="_blank" rel="noopener noreferrer"`; an internal event `href` such as `/kontakt` remains same-tab and, like every root link leaving `/`, exposes `prefetch={false}` through the Link mock.

Create `lib/cinematic/__tests__/component-boundaries.test.ts`. Read the Task-4 TSX sources and require that exactly `MobileNavigation.tsx`, `LiveMarketStatus.tsx`, and `FlyerViewer.tsx` start with `"use client"`; `app/page.tsx`, `CinematicHome`, and every section remain Server Components. Require `lib/cinematic/server-clock.ts` to begin with `import "server-only";`, and prove none of the three client islands imports `server-clock`. Task 6 may later extend this allowlist only with `MotionIsland.tsx`.

Create `lib/cinematic/__tests__/server-clock.test.ts` before production code. Hoist `vi.mock("server-only", () => ({}))` before importing the resolver so Vitest substitutes only the marker package while the real Next build still enforces the boundary. The tests must prove: absent test variables call an injected real-clock function; a fixed value without `CINEMATIC_E2E=1` fails closed; malformed, whitespace-padded, or non-canonical ISO values fail; and the exact guarded value `2026-07-14T12:00:00.000Z` resolves without changing global `Date` or `Date.now()`.

Create the tracked `e2e/fixtures/handzettel-cache.json` from the already validated official KW29/2026 catalog with these exact identity fields: `catalogId: "1335913"`, `catalogVersion: "2"`, `storeId: "13027"`, `werbekreis: "3.6"`, `kw: 29`, `year: 2026`, `validFrom: "2026-07-13"`, `validTo: "2026-07-18"`, `fetchedAt: "2026-07-14T10:00:00.000Z"`, and `status: "ok"`. Use the exact official viewer/PDF paths, `pageCount: 10`, and ten consecutively numbered official normal/thumbnail page URLs. Create `lib/cinematic/__tests__/handzettel-e2e-fixture.test.ts`: in an isolated temporary working directory, install that fixture as `data/handzettel-cache.json`, call `loadValidatedHandzettelCache(new Date("2026-07-14T12:00:00.000Z"))`, require deep equality with all identity fields and the exact ten-page catalog, then restore the original cwd and delete the temp tree. Never touch the user's ignored real cache in this unit test.

Also, before Task-4 implementation, extend `e2e/metadata-chrome.spec.ts` with the final root landmark/no-JS/chunk assertions from Step 6 and create the complete `e2e/homepage-interactions.spec.ts` contract from Step 6. Prefix the Task-4 cases with `[product-contract]`. Keep expected dates, flyer values, labels, section order, and accessible names as test-owned literals; these browser files must not import `formatDateRange`, `resolveHomepageNow`, presentation helpers, or any not-yet-existing Cinematic component before RED. The browser tests must exist and fail on concrete missing Cinematic behavior before any Task-4 production file is created.

- [ ] **Step 2: Run the test to prove the red state**

Run:

```bash
set -euo pipefail
set +e
npm test -- lib/cinematic/__tests__/presentation.test.ts lib/cinematic/__tests__/server-clock.test.ts lib/cinematic/__tests__/handzettel-e2e-fixture.test.ts lib/cinematic/__tests__/composition.test.tsx lib/cinematic/__tests__/component-boundaries.test.ts > /tmp/cinematic-task4-unit-red.log 2>&1
UNIT_RED=$?
set -e
cat /tmp/cinematic-task4-unit-red.log
test "$UNIT_RED" -ne 0
rg -q 'Cannot find|Failed to resolve|expected' /tmp/cinematic-task4-unit-red.log
cmp -s .next/BUILD_ID /tmp/cinematic-task4-predecessor-build-id
```

Then install the tracked flyer fixture with the backup/restore harness from Step 7, start the unchanged Task-3 head, and run the two root browser specs once. Expected: focused unit RED because presentation/server-clock/Cinematic modules do not exist, plus browser RED from concrete missing root landmarks/sections/dialog behavior. If `@/lib/homepage-content`, Task-3 metadata/route shell, or Task-2 editorial imports are unresolved, stop and finish the prerequisite instead of creating a substitute. Missing server, cache corruption, or a port collision does not count as product RED.

For this pre-implementation browser RED only, reuse the Step-7 port ownership, cache backup/restore, live-PID, signal, and cleanup logic but treat a generic successful root `200` as readiness; `data-cinematic-root`, the active flyer title, and the page-count marker are the behavior under test and must not be used as the RED server-readiness condition.

```bash
set +e
PLAYWRIGHT_BASE_URL="http://127.0.0.1:$PORT" npm run test:e2e -- e2e/metadata-chrome.spec.ts e2e/homepage-interactions.spec.ts --reporter=json > /tmp/cinematic-task4-browser-red.json 2>&1
BROWSER_RED=$?
set -e
test "$BROWSER_RED" -ne 0
rg -Fq '[product-contract]' /tmp/cinematic-task4-browser-red.json
rg -q '"status"[[:space:]]*:[[:space:]]*"unexpected"' /tmp/cinematic-task4-browser-red.json
! rg -qi 'ECONNREFUSED|ERR_CONNECTION_REFUSED|address already in use|No tests found|Cannot find module|Failed to resolve import' /tmp/cinematic-task4-browser-red.json
```

- [ ] **Step 3: Implement the pure date, page-count, image-policy, and view-model adapter**

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

const homepageRemoteImageHosts = new Set([
  "media.trinkgut.de",
  "www.trinkgut.de",
  "werbung.trinkgut.de",
]);

const unsafeUrlCharacters = /[\u0000-\u001f\u007f\\]/;
const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

function decodeToFixedPoint(
  value: string,
  decode: (input: string) => string,
): string | null {
  if (value !== value.trim() || unsafeUrlCharacters.test(value)) return null;
  let decoded = value;
  for (let depth = 0; depth < 4; depth += 1) {
    try {
      const next = decode(decoded);
      if (unsafeUrlCharacters.test(next)) return null;
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }
  try {
    if (decode(decoded) !== decoded) return null;
  } catch {
    return null;
  }
  return decoded;
}

function hasSafeUrlEncoding(src: string): boolean {
  const decodedUrl = decodeToFixedPoint(src, decodeURI);
  if (!decodedUrl) return false;
  try {
    const schemeEnd = decodedUrl.indexOf("://");
    const pathStart = schemeEnd < 0 ? -1 : decodedUrl.indexOf("/", schemeEnd + 3);
    const rawPathAndSuffix = pathStart < 0 ? "/" : decodedUrl.slice(pathStart);
    const pathEnd = Math.min(
      ...[rawPathAndSuffix.indexOf("?"), rawPathAndSuffix.indexOf("#")]
        .filter((index) => index >= 0),
      rawPathAndSuffix.length,
    );
    const decodedPath = decodeToFixedPoint(
      rawPathAndSuffix.slice(0, pathEnd),
      decodeURIComponent,
    );
    if (!decodedPath) return false;
    const segments = decodedPath.split("/");
    if (segments.some((segment) => segment === "." || segment === "..")) return false;
    const url = new URL(decodedUrl);
    return url.href === new URL(src).href && imageExtension.test(decodedPath);
  } catch {
    return false;
  }
}

function isRenderSafeLocalImage(src: string): boolean {
  if (!src.startsWith("/") || src.startsWith("//") || unsafeUrlCharacters.test(src)) return false;
  const delimiters = [src.indexOf("?"), src.indexOf("#")].filter((index) => index >= 0);
  const pathEnd = Math.min(...delimiters, src.length);
  const decoded = decodeToFixedPoint(src.slice(0, pathEnd), decodeURIComponent);
  if (!decoded) return false;
  const segments = decoded.split("/");
  return decoded.startsWith("/images/") &&
    !segments.some((segment) => segment === "." || segment === "..") &&
    imageExtension.test(decoded);
}

function dateOnly(value: string): { date: Date; year: string; month: string; day: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new TypeError(`Invalid date key: ${value}`);
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  if (date.toISOString().slice(0, 10) !== value) throw new TypeError(`Invalid date key: ${value}`);
  return { date, year, month, day };
}

export function formatDate(value: string): string {
  return germanDate.format(dateOnly(value).date);
}

export function formatDateRange(validFrom: string, validTo: string): string {
  const from = dateOnly(validFrom);
  const to = dateOnly(validTo);
  if (validFrom === validTo) return formatDate(validFrom);
  if (from.year === to.year && from.month === to.month) {
    return `${from.day}.–${to.day}.${to.month}.${to.year}`;
  }
  if (from.year === to.year) {
    return `${from.day}.${from.month}.–${to.day}.${to.month}.${to.year}`;
  }
  return `${formatDate(validFrom)}–${formatDate(validTo)}`;
}

export function formatPageCount(pageCount: number): string {
  return `${pageCount} ${pageCount === 1 ? "Seite" : "Seiten"}`;
}

export function canRenderHomepageImage(src: string): boolean {
  if (src.startsWith("/")) return isRenderSafeLocalImage(src);
  if (!hasSafeUrlEncoding(src)) return false;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && homepageRemoteImageHosts.has(url.hostname);
  } catch {
    return false;
  }
}

export function buildCurrentView(content: HomepageContent): CurrentView {
  return {
    flyer: content.flyer,
    event: content.event,
    fallbackMessage: content.flyer ? null : content.fallbackMessage,
  };
}
```

The local branch may be stricter than the Hybrid adapter and fail closed to text; it must never be broader. Tests compare every allowed remote host with the real `next.config.ts`. Do not use `unoptimized` to bypass this boundary.

- [ ] **Step 4: Write the root Server Component and exact section composition**

Replace `app/page.tsx` completely:

```tsx
import { getHomepageContent } from "@/lib/homepage-content";
import { HOMEPAGE_METADATA } from "@/lib/cinematic/metadata";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
import CinematicHome from "@/components/cinematic/CinematicHome";

export const metadata = HOMEPAGE_METADATA;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const now = resolveHomepageNow();
  const content = await getHomepageContent(now);
  return <CinematicHome content={content} nowIso={now.toISOString()} />;
}
```

Install the exact React/Next marker package with `npm install --save-exact server-only@0.0.1`, then create `lib/cinematic/server-clock.ts` as the only root-page clock. The test override is deliberately double-gated and dependency-injected for unit tests; a supplied override without the exact guard throws instead of silently changing production time:

```ts
import "server-only";

type ClockEnvironment = Readonly<{
  CINEMATIC_E2E?: string;
  CINEMATIC_TEST_NOW?: string;
}>;

type ClockOptions = Readonly<{
  env?: ClockEnvironment;
  realNow?: () => Date;
}>;

const canonicalInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function resolveHomepageNow({
  env = process.env,
  realNow = () => new Date(),
}: ClockOptions = {}): Date {
  const fixed = env.CINEMATIC_TEST_NOW;
  if (fixed === undefined) return realNow();
  if (env.CINEMATIC_E2E !== "1") {
    throw new TypeError("CINEMATIC_TEST_NOW requires CINEMATIC_E2E=1");
  }
  if (!canonicalInstant.test(fixed)) throw new TypeError("invalid CINEMATIC_TEST_NOW");
  const parsed = new Date(fixed);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== fixed) {
    throw new TypeError("invalid CINEMATIC_TEST_NOW");
  }
  return parsed;
}
```

`server-clock.test.ts` passes explicit `env` objects and a spy `realNow`; it never mutates `process.env`. It snapshots `globalThis.Date` and `Date.now`, calls every branch, and proves both identities remain unchanged.

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
  const hasActions = Boolean(content.event || content.archive.length);
  return (
    <div className={styles.home} data-cinematic-root data-motion-state="static" data-motion-controller-count="0" data-motion-trigger-count="0" style={cinematicTokenStyle}>
      <a className={styles.skipLink} href="#main-content">Zum Hauptinhalt</a>
      <CinematicHeader nowIso={nowIso} hasActions={hasActions} />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <CurrentSection content={content} />
        <PeopleSection />
        <ServiceSection />
        <SpotlightSection />
        {hasActions ? <ActionsSection archive={content.archive} event={content.event} /> : null}
        <InstagramSection />
      </main>
      <LocationFooter />
    </div>
  );
}
```

`CinematicHome` owns the only root banner/main/contentinfo. `RouteContent` from Task 3 remains a neutral root wrapper. No section may add another `<main>`.

- [ ] **Step 5: Implement semantic section markup and the three small interaction islands**

Use these exact public signatures and DOM contracts. Static imports use `placeholder="blur"`. Adapter URL strings use `fill`, a stable aspect-ratio wrapper, an exact `sizes` string, and `canRenderHomepageImage`; unsupported hosts render the already-present text/poster surface and never reach `Image`. Do not use `unoptimized`.

```tsx
// CinematicHeader.tsx (Server Component)
export default function CinematicHeader({ nowIso, hasActions }: { nowIso: string; hasActions: boolean }): React.JSX.Element;
// Filter CINEMATIC_NAV exactly once when hasActions is false. Desktop and MobileNavigation receive the same list.
// <header>, logo link named "Trinkgut Jammers – Startseite", <nav aria-label="Hauptnavigation">,
// <LiveMarketStatus initialNowIso={nowIso} />, safe external WhatsApp link, <MobileNavigation items={items} />.

// MobileNavigation.tsx (Client enhancement over native no-JS details)
export default function MobileNavigation({ items }: { items: readonly NavItem[] }): React.JSX.Element;
// <details data-mobile-navigation>, <summary aria-label="Menü öffnen">, exactly the server-filtered links;
// Escape and outside pointer close details; link activation closes it; native details remains usable without JS.

// LiveMarketStatus.tsx (Client)
export default function LiveMarketStatus({ initialNowIso }: { initialNowIso: string }): React.JSX.Element;
// Seed getMarketStatus(new Date(initialNowIso)); refresh immediately and every 60_000 ms;
// render <span aria-live="polite" aria-atomic="true" data-market-open={String(status.isOpen)}>status.label</span>.

// HeroSection.tsx (Server)
export default function HeroSection(): React.JSX.Element;
// section[data-hero="cinematic"] with kicker "Trinkgut Jammers · Goch", one h1 "Goch schenkt ein.",
// exact lead "Persönliche Beratung, Partybedarf und Vermietung vor Ort.", WhatsApp primary CTA,
// route secondary CTA, hero asset, and a three-item dl for Jurgensstraße 20 / Mo–Sa 08:00–20:00 Uhr / 47574 Goch.

// CurrentSection.tsx (Server)
export default function CurrentSection({ content }: { content: HomepageContent }): React.JSX.Element;
// Call buildCurrentView(content) exactly once. section#aktuell aria-labelledby="aktuell-title";
// flyer card labelled `Gültig …` plus dynamic `1 Seite`/`n Seiten`; event interval labelled `Aktionszeitraum …`;
// event summary only when event is non-null; no empty grid cell; exact adapter fallback + WhatsApp when flyer is null.

// FlyerViewer.tsx (Client)
export default function FlyerViewer({ flyer }: { flyer: HomepageFlyer }): React.JSX.Element;
// Server HTML always contains visible text fallback plus safe external viewer/PDF links.
// Cover rendering and its error state stay inside this existing island—do not add a fourth client island.
// Enhance with a button opening role="dialog" aria-modal="true" aria-labelledby=<visible heading id>.
// Memoize onClose with useCallback; make the close button the first focusable element; trap focus with useModalA11y.
// Create the titled iframe only after open. Clear the 8-second timeout on success, close, and unmount;
// reset timeout/error on every reopen. Escape closes and restores trigger focus. Timeout/onError shows both external links.

// PeopleSection.tsx (Server)
export default function PeopleSection(): React.JSX.Element;
// section#menschen with h2 "Menschen hinter Jammers" and five PEOPLE_STORY figures in array order.

// ServiceSection.tsx (Server)
export default function ServiceSection(): React.JSX.Element;
// section#service with h2 "Deine Party. Unser Service.", the three confirmed SERVICE_ITEMS, five RENTAL_HIGHLIGHTS,
// each price labelled "Preis laut Leihartikel-Preisliste · Stand 01.01.2026",
// stock labelled "Bestand laut Liste · Stand 06.03.2026", and exact text
// "Bestand laut Liste. Reservierung erforderlich." Never imply current availability.

// SpotlightSection.tsx (Server)
export default function SpotlightSection(): React.JSX.Element;
// section#eigenmarken[data-signature="cinematic"], h2 "Drei Originale im Licht.",
// div[data-rail="cinematic"] containing all three SPOTLIGHT_POSTERS as linked figures in array order.

// ActionsSection.tsx (Server)
export default function ActionsSection(props: { event: HomepageEvent | null; archive: readonly HomepageArchiveItem[] }): React.JSX.Element | null;
// section#aktionen only if event or archive exists; adapter-filtered records stay in received order/status.
// Event interval is `Aktionszeitraum · ${formatDateRange(...)}`—never an appointment inferred from validFrom/validTo.
// Archive is `Rückblick · ${formatDate(item.date)}`. kind never changes visual validity.

// InstagramSection.tsx (Server)
export default function InstagramSection(): React.JSX.Element;
// section aria-labelledby="instagram-title"; render dated local figures only when INSTAGRAM_SELECTION is non-empty.
// In the audited first production pass it is empty, so render an honest profile CTA plus "Neue Einblicke folgen"—no empty grid,
// duplicated PEOPLE_STORY images, invented post dates, or implication that the local team archive is an Instagram publication.

// LocationFooter.tsx (Server)
export default function LocationFooter(): React.JSX.Element;
// footer#kontakt with MARKET data, route/WhatsApp/Instagram/NL links, and /kontakt /impressum /datenschutz /agb.
```

Every section has one unique `aria-labelledby` target and no duplicate ID. External HTTPS WhatsApp, route, Instagram, event/source, viewer, and PDF links use `target="_blank" rel="noopener noreferrer"`. Internal event CTAs and all other internal links remain same-tab and use `prefetch={false}` when leaving root. Footer phone is `tel:+492823418707`; email is `mailto:jammers-goch@trinkgut.de`.

`app/home.module.css` initially defines `.home` (black background, white text, sans font, isolation) and `.skipLink` (off-screen until `:focus-visible`, then fixed top-left with yellow background/black text and a 44×44 CSS-pixel minimum target). The skip link focuses `#main-content`. Section-specific layout CSS is Task 5; all interactive DOM is classable for the later 44×44 gate.

- [ ] **Step 6: Verify the already-written deterministic interaction and landmark contracts**

Do not add browser coverage after seeing the implementation. The final assertions below were created in Step 1 and were already observed RED against the unchanged Task-3 head. Run them unchanged against the composed Task-4 page, using only the guarded `resolveHomepageNow()` environment and the tracked, validated flyer cache fixture installed by the Step-7 backup/restore harness.

The Task-4 additions already present in `e2e/metadata-chrome.spec.ts` prove:

- `/` has exactly one banner, main, and contentinfo; banner/contentinfo are not descendants of main; no duplicate `main-content` ID.
- all required sections are server-readable and in order; every visible fragment link resolves to exactly one target.
- a `javaScriptEnabled: false` context still sees the h1, exact fallback/current copy, people, services, posters, Instagram fallback, and location finale.
- root still requests no legacy-identifying script after all non-root links render with prefetch disabled.

The already-present `e2e/homepage-interactions.spec.ts` proves against that isolated production server:

- first load has zero iframe and no Instagram/map/viewer request;
- flyer dialog has a visible accessible name, close button receives first focus, iframe has a title and appears only after click;
- Escape closes and returns focus to the trigger;
- use Playwright clock control or an aborted viewer request to reach timeout/error deterministically; both safe external viewer/PDF links remain visible;
- reopening resets the error state and creates a fresh timeout;
- mobile details closes on Escape, outside pointer, and link activation while its native HTML remains useful without JavaScript;
- console errors, hydration warnings, and page errors remain empty.

The flyer fixture must be visible through the real `loadValidatedHandzettelCache` path as `Angebote der Woche`, `Gültig 13.–18.07.2026`, and `10 Seiten`. No test may mock `getHomepageContent`, patch global `Date`, or bypass the filesystem loader in this browser gate.

- [ ] **Step 7: Run the full server-render, browser, and route smoke checks**

Run:

```bash
set -euo pipefail
npm test -- lib/cinematic/__tests__/presentation.test.ts lib/cinematic/__tests__/server-clock.test.ts lib/cinematic/__tests__/handzettel-e2e-fixture.test.ts lib/cinematic/__tests__/composition.test.tsx lib/cinematic/__tests__/component-boundaries.test.ts
npm test
npx tsc --noEmit
npm run lint
npm run build
PORT=3103
LOG=/tmp/cinematic-task4.log
HTML=/tmp/cinematic-task4.html
CACHE=data/handzettel-cache.json
FIXTURE=e2e/fixtures/handzettel-cache.json
test -z "$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t)"
mkdir -p data
BACKUP=""
INSTALL=""
BACKUP_READY=0
CACHE_REPLACED=0
if test -e "$CACHE"; then
  BACKUP="$(mktemp data/.handzettel-cache.backup.XXXXXX)"
  if cp -p "$CACHE" "$BACKUP" && cmp -s "$CACHE" "$BACKUP"; then
    BACKUP_READY=1
  else
    rm -f "$BACKUP"
    echo "Cache backup failed; original cache was not intentionally modified." >&2
    exit 1
  fi
fi
APP_PID=""
cleanup() {
  exit_code=$?
  restore_status=0
  trap - EXIT
  trap '' INT TERM
  if test -n "$APP_PID"; then
    if kill -0 "$APP_PID" 2>/dev/null; then kill "$APP_PID" 2>/dev/null || true; fi
    wait "$APP_PID" 2>/dev/null || true
  fi
  if test "$CACHE_REPLACED" -eq 1; then
    if test "$BACKUP_READY" -eq 1; then
      if mv -f "$BACKUP" "$CACHE"; then
        BACKUP_READY=0
      else
        restore_status=1
        echo "Cache restore failed; verified backup preserved at $BACKUP" >&2
      fi
    else
      if ! rm -f "$CACHE"; then
        restore_status=1
        echo "Temporary cache removal failed; inspect $CACHE" >&2
      fi
    fi
  elif test "$BACKUP_READY" -eq 1; then
    rm -f "$BACKUP" || restore_status=$?
  fi
  if test -n "$INSTALL" && test -e "$INSTALL"; then
    if ! rm -f "$INSTALL"; then
      if test "$restore_status" -eq 0; then restore_status=1; fi
    fi
  fi
  if test "$exit_code" -eq 0 && test "$restore_status" -ne 0; then exit_code=$restore_status; fi
  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
INSTALL="$(mktemp data/.handzettel-cache.install.XXXXXX)"
cp "$FIXTURE" "$INSTALL"
cmp -s "$FIXTURE" "$INSTALL"
CACHE_REPLACED=1
mv -f "$INSTALL" "$CACHE"
INSTALL=""
: > "$LOG"
CINEMATIC_E2E=1 CINEMATIC_TEST_NOW=2026-07-14T12:00:00.000Z node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port "$PORT" > "$LOG" 2>&1 &
APP_PID=$!
READY=0
for attempt in {1..30}; do
  kill -0 "$APP_PID" 2>/dev/null || { tail -80 "$LOG"; exit 1; }
  if curl -fsS "http://127.0.0.1:$PORT/" > "$HTML" &&
    rg -q 'data-cinematic-root' "$HTML" &&
    rg -Fq 'Angebote der Woche' "$HTML"; then
    READY=1
    break
  fi
  sleep 1
done
test "$READY" -eq 1
kill -0 "$APP_PID"
PLAYWRIGHT_BASE_URL="http://127.0.0.1:$PORT" npm run test:e2e -- e2e/metadata-chrome.spec.ts e2e/homepage-interactions.spec.ts
kill -0 "$APP_PID"
for marker in 'Goch schenkt ein' 'Angebote der Woche' 'Gültig' '13.–18.07.2026' '10 Seiten' 'Menschen hinter Jammers' 'Deine Party. Unser Service' 'Drei Originale im Licht' 'Jurgensstraße 20' 'Neue Einblicke folgen'; do
  rg -Fq "$marker" "$HTML"
done
! rg '<iframe|assets/source|Preislisten|glass-header|Jammers Assistent|Der nächste Handzettel wird vorbereitet\.' "$HTML"
```

Expected: unit/SSR/boundary tests, full suite, type/lint/build, production browser tests, and curl assertions PASS. Root has exactly one valid landmark tree, the real validated active flyer, no legacy shell or private path, no first-load iframe, and complete server-readable content. The owned process is killed and waited for; the ignored pre-existing cache is byte-preservingly restored (or the temporary cache removed) on success, failure, SIGINT, and SIGTERM. `git diff --check` and the targeted scope diff are clean.

- [ ] **Step 8: Commit the deployable static-first half of the atomic handoff**

```bash
git add .gitignore package.json package-lock.json app/page.tsx app/home.module.css lib/cinematic/presentation.ts lib/cinematic/server-clock.ts lib/cinematic/__tests__/presentation.test.ts lib/cinematic/__tests__/server-clock.test.ts lib/cinematic/__tests__/handzettel-e2e-fixture.test.ts lib/cinematic/__tests__/composition.test.tsx lib/cinematic/__tests__/component-boundaries.test.ts components/cinematic e2e/fixtures/handzettel-cache.json e2e/homepage-interactions.spec.ts e2e/metadata-chrome.spec.ts
git commit -m "feat: compose cinematic homepage sections"
```

Re-run the combined Task-3/Task-4 production smoke after commit. Only this two-commit state may proceed to visual styling; neither commit is pushed yet.

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
| `editorial.module.css`: `.section`, `.sectionHeading`, `.peopleGrid`, `.figure`, `.image`, `.caption`, `.serviceWall`, `.serviceRow`, `.rentalStrip`, `.actionsStage`, `.archive`, `.instagramGrid`, `.instagramFallback`, `.footer`, `.legal` | People mosaic uses asymmetric `7/5` and `5/7` spans desktop and one column mobile; image wrappers never exceed intrinsic display width; service is full-width numbered rows, never a four-card grid; rental facts use a horizontally wrapping definition list; a non-empty audited Instagram selection is 2 columns mobile/5 desktop, while the initial empty selection renders a deliberate profile-CTA fallback; footer contains route/NL/legal links without an embed. |
| `spotlight.module.css`: `.section`, `.intro`, `.railViewport`, `.rail`, `.frame`, `.posterWindow`, `.posterImage`, `.number`, `.posterMeta` | Static HTML starts as a vertical grid. At `>=64rem` the rail becomes `display:flex;width:max-content`; each frame width uses the corrected `min(..., 1054px)` poster token and never exceeds the native 1054 CSS pixels even with an enlarged root font; full original poster remains visible with `object-fit:contain` and honest `sizes`; below `64rem`, reduced motion, and `(scripting:none)` force a normal one-column grid and clear transforms. |

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
  const navigation = page.getByRole("navigation", { name: "Hauptnavigation" });
  for (const label of ["Angebote", "Party & Miete", "Eigenmarken", "Über uns", "Kontakt"]) {
    await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  }
  const actionSections = await page.locator("section#aktionen").count();
  await expect(navigation.getByRole("link", { name: "Aktionen" })).toHaveCount(actionSections);
  for (const link of await navigation.locator('a[href^="#"]').all()) {
    const href = await link.getAttribute("href");
    expect(href).not.toBeNull();
    await expect(page.locator(href!)).toHaveCount(1);
  }
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /wa\.me\/491752492386/);
  await expect(page.getByRole("link", { name: /Route/ }).last()).toHaveAttribute("href", /google\.com\/maps\/dir/);
  await expect(page.getByRole("link", { name: /Instagram/ }).last()).toHaveAttribute("href", "https://www.instagram.com/trinkgutjammers_goch/");
  await expect(page.getByRole("link", { name: /Niederländisch|Grenzkunden/ })).toHaveAttribute("href", "/nl");
  for (const href of ["/kontakt", "/impressum", "/datenschutz", "/agb"]) await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
});

test("renders the audited Instagram fallback without fabricated posts or dates", async ({ page }) => {
  const section = page.locator('section[aria-labelledby="instagram-title"]');
  await expect(section.getByText("Neue Einblicke folgen", { exact: true })).toBeVisible();
  await expect(section.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
    "href",
    "https://www.instagram.com/trinkgutjammers_goch/",
  );
  await expect(section.locator("figure")).toHaveCount(0);
  await expect(section.locator("time")).toHaveCount(0);
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

Open each file with the workspace image viewer at original resolution. Explicitly verify: authentic/non-stretched faces; hero crop; one red gesture; readable flyer dates; no facts collision; all three complete posters; no small-image upscaling; no empty event hole; dates on every rendered archive item and on Instagram items only when an audited selection is non-empty; otherwise the intentional `Neue Einblicke folgen` profile fallback with no figures/times; visible focus; legal/contact finale; no accidental legacy header/footer/floating widgets.

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
