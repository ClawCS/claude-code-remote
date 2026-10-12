# Sitewide Atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die echte Jammers-Website lokal in eine kohärente atmosphärische Getränkewelt überführen.

**Architecture:** Reine Präsentationserweiterungen auf bestehenden Layouts und Komponenten. Gemeinsame Atmosphären-Tokens und explizite Seitenfamilien kapseln Farben/Licht; originale Medien und HTML-Inhalte bleiben getrennt. Neue Eigenmarken-Komponenten ergänzen nur eine neue Detailroute, ohne Geschäftslogik zu ersetzen.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Vitest, Playwright.

**Spec:** docs/superpowers/specs/2026-10-12-sitewide-atmosphere-design.md

## Global Constraints

- Die echte Next.js-Website lokal gestalten; die öffentliche Website unverändert lassen.
- Originales Markenlogo, URLs, Daten, Preise, Gültigkeitszeiten, Produktfakten, Berechnungen, Anfragewege und Sicherheits-/Betriebssperren erhalten.
- Keine allgemeinen cremefarbenen/beigen Flächen. Weiß, kühles Hellgrau und Graphit bilden die Basis; Wärme entsteht aus Bildern, Licht und Rot-/Kupferakzenten.
- Die Startseite bleibt kurz. Entfernte Entdecker-, Akademie-, Cocktail- und Teamblöcke sowie GrailBid/TCG nicht wieder einführen.
- Keine erfundenen Produktangaben, Bestände, Rabatte oder Markt-/Teamaufnahmen. Originalflaschen, Handzettel, Angebotsausschnitte, Rezeptfotos und Anzeigenmotive unverändert und vollständig darstellen.
- Keine echten Bestellungen, E-Mails, Zahlungen, Uploads oder Löschungen auslösen. Bewerbungsupload, Newsletter und Mietbestellbetrieb nicht aktivieren.
- Keine Server-, DNS-, Sicherheits-, Mail- oder Accountänderungen; Canva und Instagram nicht verändern.

## Review Focus

- Lange deutsche/niederländische Überschriften bei 360px: kein horizontaler Überlauf (Task 3 Browsermatrix).
- Kategorien mit null gültigen Angeboten: ehrlicher Leerzustand, keine erfundenen Ersatzprodukte (Task 1 Regression und Task 3 Browsermatrix).
- Portaled Warenkorb/Merkzettel und dynamische Akademie-Zustände: gleiche Flächen/Fokus und unveränderte Logik (Task 3).
- Originale im Hochformat und Flaschen auf Mobilgeräten: vollständiges Motiv, kein Poster-Layout oder verzerrte Panoramaverwendung (Task 2 und 3).
- Ohne JS/reduced-motion: neue Detailroute, Navigation und Text bleiben erreichbar; kein verdecktes Pflichtinhalt (Task 2 und 3).

## Preflight and Ownership

| Interface / shared file | Producer | Consumer / consistency check |
| --- | --- | --- |
| `AtmosphereTheme`, `PageIntroProps.theme/media` | Task 1 | Task 2/3 import the same optional types; old calls remain valid |
| Route presentation attributes | Task 1 | Task 3 CSS only; RouteContent retains main/no-main behavior |
| Shared palette CSS / PageIntro | Task 1 | Task 3 extends family CSS, not business components |
| Pralle route and original bottle assets | Task 2 | Task 3 route census is exactly 41 public templates |
| No-JS and static presentation | Task 1/2 | Task 3 verifies browser behavior and reduced-motion |

Current clean product-source baseline: HEAD 7331962; foreign audit screenshots, interim application document and existing audit JSON stay untouched. Fresh web baseline: 129 files / 2,366 tests passed, native applications excluded. Existing cinematic-production worktree reused; no submodule parent. Tasks are implemented sequentially with independent review gates. Operator's explicit local implementation instruction authorizes execution of this bounded plan; no new design choice or deployment authority is inferred.

### Task 1: Shared atmosphere foundation and page-family continuity

**Files:**
- Create: `lib/cinematic/atmosphere.ts`
- Modify: `components/RouteContent.tsx`, `components/editorial/PageIntro.tsx`, `components/editorial/editorial.module.css`, `app/public-site.css`
- Modify: `app/home.module.css` and existing homepage CSS modules only for continuity (no section additions)
- Test: `lib/cinematic/__tests__/atmosphere.test.tsx`

**Interfaces:**
- Produces: `AtmosphereTheme = 'neutral' | 'offers' | 'beer' | 'fresh' | 'wine' | 'spirits' | 'party' | 'learning' | 'people' | 'nl'` and `getAtmosphereTheme(pathname: string): AtmosphereTheme` (closed path map, neutral fallback).
- Produces: optional `PageIntroProps.theme?: AtmosphereTheme` and `media?: Readonly<{src:string; alt:string; width:number; height:number; position?:string}>`; native HTML text/breadcrumbs remain in foreground, media separate.
- RouteContent sets `data-atmosphere` on its existing outer wrapper, preserves main id/tabIndex and provider/navigation logic.

- [ ] Write failing tests for mapping, neutral unknown routes, unchanged main wrapper, optional themed/media intro and static content without JS. Assert offers never map to product data and legal routes remain neutral.
- [ ] Run `NODE_ENV=test npx vitest run lib/cinematic/__tests__/atmosphere.test.tsx`; prove the failure concerns missing presentation behavior.
- [ ] Implement restrained scene/light/presentation layers, fresh palette, responsive typography and quiet functional surfaces. Keep logo header, original contact icons, V6 movie and icon-only control untouched. No asset or data substitutions.
- [ ] Run focused atmosphere/foundation/short-home/accent tests and TypeScript. Adjust only deliberate visual expectations, not functional assertions.
- [ ] Commit only Task 1 paths; write report and independently review before Task 2.

### Task 2: Native original-bottle brand world and Pralle Kirsche

**Files:**
- Create: `components/eigenmarken/BrandWorld.tsx`, `components/eigenmarken/PralleKirscheDetail.tsx`, `components/eigenmarken/brand-world.module.css`
- Create: `app/eigenmarke/pralle-kirsche/page.tsx`
- Create: hash-named cherry-background WebP under `public/images/eigenmarken-scenes/` and internal source record `data/editorial/eigenmarken-atmosphere.json`
- Modify: `app/eigenmarke/page.tsx`, `app/sitemap.ts`, `e2e/sitewide-design-cases.ts`, `lib/cinematic/__tests__/sitewide-foundation.test.tsx`
- Test: `lib/cinematic/__tests__/brand-world.test.tsx`

**Interfaces:**
- Consumes: existing `eigenmarken` facts and original `/images/eigenmarken-bottles/{slug}.png`; PageIntro optional presentation props from Task 1.
- Produces: overview with six existing hash anchors and ONLY new detail route `/eigenmarke/pralle-kirsche`, canonical metadata and sitemap entry.
- Approved cherry source: `.superpowers/brainstorm/37080-1791822500/content/cherry-scene.webp`, SHA256 `b26593bf6dc63fc1fba4b9487efed5c629d5777e1be1b388ec3c0913e4b048f3`.

- [ ] Write failing tests: all six names and original image sources, all existing ids, no invented price/stock/tagline, separate background/product/light/text, detail facts 15% Vol. and 700 ml, current contact/academy paths, accessible static navigation and exact 41-template census.
- [ ] Run new tests red; implement overview and detail using original bottle bytes. Graphite stage with individual accents; rubin/cherry hero then white/coolgray detail. Mobile stacks text/product independently, no tiny labels or image clipping.
- [ ] Copy approved background only after hash verification; save provenance without exposing private source paths in public page/DTO. Keep Jammers-hilft as separate symbol, no new donation copy.
- [ ] Run focused brand/foundation/metadata tests and TypeScript; compare six original bottle hashes before/after.
- [ ] Commit only Task 2 paths; write report and independently review before Task 3.

### Task 3: Complete family pass and local acceptance

**Files:**
- Modify: `components/editorial/collection.module.css`, `learning.module.css`, `transaction.module.css`, `tools.module.css`, `components/giveaways.module.css`, `app/nl/nl.module.css`
- Modify: `app/kategorie/[slug]/page.tsx` to opt into explicit category media/theme, no data/query changes
- Modify only other public page presentation props if needed; list them explicitly in report
- Create: `e2e/atmosphere.spec.ts`, `docs/audits/2026-10-12-sitewide-atmosphere.md`

**Interfaces:**
- Consumes: Task 1 themes and Task 2 detail route; existing 41-template census plus 404.
- Category approved side images: bueble-aufbau, spezi-regal, weinregal, baileys-aufbau; preserve natural portrait composition. Party garden illustration only party service/planner. Academy images only academy. Offer/PDF, rental, recipe and job images stay full contain.

- [ ] Add failing representative browser assertions for thematic/category presentation, quiet transaction/legal surfaces, preserved no-offer state, mobile overflow, full original images, portaled drawers and no-JS detail navigation.
- [ ] Implement family surfaces and continuity, preserving all controls/empty/error/loading/quiz/result states and original localized NL content. Do not rewrite business logic or legal prose.
- [ ] Run full `NODE_ENV=test npx vitest run --exclude 'services/applications/**' --exclude '.superpowers/**'`, lint, `next typegen`, `tsc --noEmit`, `npm run offers:check` and production build with real clock/no test clock. Record exact commands/results and baseline warnings.
- [ ] Start an owned isolated production preview port; preserve Port 3000 and existing previews. Check all public template families desktop/mobile, keyboard, no-JS, reduced motion, originals/links and content APIs. Use only marked local fixtures for transaction states; no external writes.
- [ ] Independent whole-branch review and scoped commit/push. Document known 10 cocktail-image gaps and unqualified native application operation separately from visual acceptance.
- [ ] Open the actual local site at overview, Pralle detail and representative category/academy/rental/NL routes. Report local completeness, remaining visual issues and live-readiness honestly; do not deploy without fresh authorization.
