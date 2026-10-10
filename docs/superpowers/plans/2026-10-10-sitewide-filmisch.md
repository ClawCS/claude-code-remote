# Sitewide Filmisch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the approved cinematic design across the homepage, navigation and every customer-facing page/template, locally only.

**Architecture:** Keep the existing Next.js routes, content sources and business components. Introduce a small shared editorial presentation layer and a five-group navigation, then deliberately adapt each page family and its interactive states. CSS modules own family layouts; shared primitives own typography/spacing/controls, never a giant selector patch hiding old layouts.

**Tech Stack:** Existing Next.js 16.3.8 / React 19 / TypeScript / CSS Modules + Tailwind / Vitest / Playwright. No new dependency, provider, media generation or hosting.

**Spec:** `docs/superpowers/specs/2026-10-10-sitewide-filmisch-design.md` — fully approved by Niko: »ja leg los«. Execution continues in the existing isolated `codex/cinematic-production` worktree with implementation agents and separate review; no repeat design/method questionnaire.

## Global Constraints

- Umsetzung und Abnahme ausschließlich lokal; keine öffentliche Veröffentlichung aus diesem Auftragsschritt.
- Keine Änderung von Berliner Gültigkeitsberechnung, Wochenpaketen, Angebotszählung, Preisen, Rezepten, Quizlogik, Mietdauer-/Bestandsregeln, Empfängeradressen, Datenschutzregeln oder API-Verträgen.
- Keine Mail, Zahlung, Löschung, Anbieterbuchung, Hosting-/Sicherheitsänderung oder Bewerbungsaktivierung. `RENTAL_MODE=disabled` remains unchanged; no SMTP/IMAP/application administration actions.
- Fremde Arbeitsdateien bleiben unberührt. No `git add -A`, cleanup of old screenshots, branch switch or public deployment. Commit only owned files; controller pushes verified source commits.
- Keine unbestätigten Leistungen, Personen oder Motive wieder aufnehmen. Keine neuen KI-/Stockbilder aus diesem Designauftrag ableiten. Bereits belegte Quellen und Filmkennzeichnung erhalten.
- Original flyers, offer tiles, giveaways, logos and job posters remain complete/unwarped; exact prices and dates unchanged. Existing contact logos remain original colors without decorative frames.
- Five primary groups: Angebote, Sortiment, Party & Miete, Jammers entdecken, Dein Besuch. No destination silently lost; normal links navigate, separate disclosure toggles expand groups.
- Every public customer template, including noindex pages, retired-feature notices, dynamic details and 404, is included. Admin content, APIs, fixtures and external GrailBid are not redesigned or activated.
- Keep both RSC/client boundaries and semantic form behavior. No forced clicks, ignored errors, skipped tests or disabling accessibility requirements to obtain green tests.
- Only one implementation agent edits at a time. Build/content checks and browser acceptance must be serialized because content validation uses a temporary publication lock. Do not restart/delete other agents' local processes.

## Review Focus

- Navigation at desktop and touch widths: destination links and disclosure toggles must differ, nested targets remain reachable, Escape returns focus, pointer outside closes.
- Route changes must not leak old CSS or double headers/main landmarks, particularly `/nl`, client-side navigation and unknown/legacy URLs.
- Long Dutch titles, full-page poster/flyer originals and responsive images retain readable composition without crop/overflow at 360, 768 and 1440px.
- Empty/error/disabled and interaction states are part of the visual design; price/stock/quiz/search behaviors must remain unchanged.
- Every page family must be visually verified, not inferred from a token or hero test; noindex, archive and retired-feature routes are still customer-visible.

## File structure and responsibility

- `components/editorial/PageIntro.tsx` + `editorial.module.css`: small shared neutral page introduction and reusable presentation classnames, not an all-page renderer.
- `lib/cinematic/tokens.ts`, `app/globals.css`, `app/public-site.css`, `app/layout.tsx`: common palette and typography; preserve semantic/brand exceptions.
- Existing `components/cinematic/*Navigation*`, header/footer and `lib/cinematic/site.ts`: five-group desktop/mobile navigation and original destinations.
- Existing family components and pages: real presentation migration, retaining data and hooks.
- `e2e/sitewide-design-cases.ts`: complete route-template inventory and safe example URLs for visual coverage; tests use real local content, never production test clocks.
- Focused `e2e/sitewide-*.spec.ts` and `lib/cinematic/__tests__/sitewide-*.test.tsx`: executable coverage.
- `docs/audits/2026-10-10-sitewide-filmisch.md`: controller-owned running evidence and limits; `audit/screenshots/sitewide-filmisch-2026-10-10/`: only new screenshots.

---

### Task 1: Common editorial system and five-group navigation

**Files:**
- Create: `components/editorial/PageIntro.tsx`, `components/editorial/editorial.module.css`, `e2e/sitewide-design-cases.ts`, `e2e/sitewide-navigation.spec.ts`, `lib/cinematic/__tests__/sitewide-foundation.test.tsx`.
- Modify: `lib/cinematic/tokens.ts`, `lib/cinematic/site.ts`, `components/cinematic/CinematicHeader.tsx`, `NavigationDisclosure.tsx`, `MobileNavigation.tsx`, `LocationFooter.tsx`, `chrome.module.css`, `app/globals.css`, `app/public-site.css`, `app/layout.tsx`.
- Modify tests only where the approved five-group structure supersedes exact old nine-group assumptions: `lib/cinematic/__tests__/site.test.ts`, `header-navigation.test.tsx`, `nl-entry.test.tsx`, `tokens.test.ts`, `e2e/team-career-navigation.spec.ts`, `cocktail-header-navigation.spec.ts`, `social-header-responsive.spec.ts`.

**Interfaces:**
- Produce `PageIntro({eyebrow?, title, description?, breadcrumbs?, children?, className?, id?})`: `title/description/children` are ReactNode, breadcrumbs readonly `{label:string;href?:string}[]`; one semantic h1. Pure render component usable by server/client pages; no fetch/usePathname inside.
- Produce editorial CSS classes `container`, `section`, `grid`, `card`, `primaryLink`, `secondaryLink`, `prose`, `field`, `notice`, `emptyState`; family styles may extend them. Minimum interactive target 44px, visible focus, no hidden brand recoloring.
- Existing `CinematicHeader({nowIso,hasActions})` external signature retained. Extend navigation union as needed for direct-link + separate toggle and grouped discover links; later tasks consume this header unchanged.
- Produce `SITEWIDE_DESIGN_CASES` in the e2e cases file: entries `{family,template,path}` covering all 37 rendered customer templates, explicit redirect/admin/fixture exclusions exported separately. Dynamic example URLs must exist in current data, no guessed slug.

- [ ] **Step 1: RED contract tests.** Test five top labels in exact order; all existing target hrefs remain via nested links; party main link goes `/vermietung` separately from toggle; original logos and logo home link remain. Test PageIntro renders one h1 and real breadcrumb links. Assert global and home paper/surface tokens are shared neutral values `#FAF9F6`/`#F2F0EC` and readable dark text, not homepage-only overrides.
- [ ] **Step 2: Run RED.** `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-foundation.test.tsx --maxWorkers=2`. Expected assertions fail against nine-group/old-palette baseline (not import typo).
- [ ] **Step 3: Implement.** Light ~32px info strip, roomy white ~92px desktop header, prototype-aligned logo/spacing, five groups. Discover panel grouped as the spec; mobile clear expandable groups. NL entry always visible. Preserve hours computation, source links and contact branding. Use scoped primitives; do not globally erase all image captions/borders or target every button with `!important`.
- [ ] **Step 4: Verify navigation.** Add real browser click tests at 390 and 1440px for all internal navigation destinations and keyboard open/close/focus; responsive 768px no overflow; no-JS native navigation remains usable. Inspect links after client route changes. Use local dev server only; no external contact clicks.
- [ ] **Step 5: Verify and commit.** Focused tests plus existing header/navigation tests, `npx tsc --noEmit`, eslint changed files, `git diff --check`; run project tests once and name any baseline failures. Do not build/restart 3110. Commit owned files, report exact changed interfaces and evidence.

### Task 2: Complete homepage and Dutch landing composition

**Files:**
- Modify: `components/cinematic/CinematicHome.tsx`, `CurrentSection.tsx`, `AssortmentSection.tsx`, `MarketDiscoveries.tsx`, `ServiceSection.tsx`, `SpotlightSection.tsx`, `ActionsSection.tsx`, `PeopleSection.tsx`, `GrailBidSection.tsx`, `InstagramSection.tsx`, corresponding `current.module.css`, `editorial.module.css`, `spotlight.module.css`, `warm.module.css`; `app/nl/page.tsx`, `app/nl/nl.module.css`.
- Create: `e2e/sitewide-landings.spec.ts`, `lib/cinematic/__tests__/sitewide-landings.test.tsx`.
- Existing hero player/media stay untouched unless a demonstrated integration issue requires a focused regression.

**Interfaces:**
- Consume common Task 1 tokens/header/PageIntro/CSS. Homepage content loaders/data types stay unchanged.
- Both landing pages own main/header/footer landmarks as currently; do not introduce duplicate PublicChrome. NL keeps localized links/labels and original dates.

- [ ] **Step 1: RED layout contracts.** Assert both real current flyer originals and their dates remain, desktop full covers have equal-weight editorial layout; no old repeated service/rental strip immediately under feature; all required destination sections and six eigenmarken remain reachable. Assert `/nl` neutral paper, restrained orange accent, full original flyers and localized visit controls.
- [ ] **Step 2: Run RED.** `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-landings.test.tsx --maxWorkers=2`; real missing structure assertions fail first.
- [ ] **Step 3: Implement deliberate composition.** Bring the whole approved prototype progression to the real page: editorial offers, confident service story, larger alternating market/brand imagery, clear giveaways/team/TCG entrances. Remove duplicated decorative marketing blocks while retaining every functional destination and required warning. Original film, view/pause behavior and six-bottle finale unchanged. NL uses same header proportions/type system with Dutch navigation; no orange full-page repaint.
- [ ] **Step 4: Browser verify.** 390/768/1440 full page views, film+finale, no horizontal overflow, complete poster/flyer motives, no stale beige/technical heading styles, no broken hash anchors. Include long NL current title and no-active-flyer state using marked fixtures only, never production clock override.
- [ ] **Step 5: Focused tests, TypeScript, changed-file lint, diff check, full web tests once, commit.** Use `NODE_ENV=test npm test -- lib --maxWorkers=2`. Native application prerequisites were diagnosed in Task1; unchanged native suites are consolidated in final acceptance, not repeated for each visual family. Keep evidence in own report; main controller handles shared final build.

### Task 3: Offers, catalogue, brands, people and action pages

**Files:**
- Modify: `components/FlyerIndexView.tsx`, `ProductCatalogue.tsx`, `WeeklyOfferGrid.tsx`, `EigenmarkenShowcase.tsx`, `components/giveaways/GiveawayCard.tsx`, `giveaways.module.css`; `app/kategorie/[slug]/page.tsx`, `app/eigenmarke/page.tsx`, `app/regionale-spirituosen/page.tsx`, `app/geschenkideen/page.tsx`, `app/marktleben/page.tsx`, `app/galerie/page.tsx`, `app/gewinnspiel/page.tsx`, `app/gewinnspiel/archiv/page.tsx` and scoped CSS modules they own.
- Create: `components/editorial/collection.module.css`, `e2e/sitewide-collections.spec.ts`, `lib/cinematic/__tests__/sitewide-collections.test.tsx`.
- `/angebote`, `/handzettel`, `/produkte` route wrappers may remain thin if their actual rendered component is fully migrated.

**Interfaces:**
- Consume Task 1 PageIntro and presentation classes. Existing prop/data/API interfaces remain unchanged.
- Keep original flyer viewer and offer validity behavior; presentation wrapping can change without rewriting their data flows.

- [ ] **Step 1: RED tests.** Assert rendered real catalogue/flyer/market/team/brand/action families use editorial introductions and scoped collection composition; existing coverage still asserts all offers, all seven current portraits, all active/archived giveaway covers and original-content warnings. Add browser checks for search-empty and invalid category 404.
- [ ] **Step 2: Run RED.** `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-collections.test.tsx --maxWorkers=2` shows missing new family structure.
- [ ] **Step 3: Implement.** Offers: calm language/date treatment and complete local originals; catalogue: clear search/filter toolbar with clean structured cards (not a made-up WWS catalogue). Brands/stories: large image+text editorial rhythm, no synthetic data. Team: portraits with names only and approved logo placeholder. Giveaways: complete post covers and real agenda retained, visually part of same site.
- [ ] **Step 4: Verify at 390/768/1440.** Representative route of every listed family plus `/kategorie/bier` (verify actual slug), search no-match and archive; inspect full motives and long titles, open actual flyer viewer, keyboard close/focus. No cross-family CSS leaks after navigation.
- [ ] **Step 5: Focused family tests, TypeScript, changed-file lint, diff check, full web tests once, commit.** Use `NODE_ENV=test npm test -- lib --maxWorkers=2`; unchanged native application suites are consolidated in final acceptance. Do not edit content manifests/assets/API or schedule, do not build concurrently.

### Task 4: Recipes, academy and interactive customer tools

**Files:**
- Modify: `components/recipes/RecipeCollection.tsx`, `CocktailPhoto.tsx`, `components/AcademyEntry.tsx`, `AcademyCover.tsx`, `academy-entry.module.css`, `components/ProductCard.tsx`, `ProductGrid.tsx`, `SearchBar.tsx`; `app/cocktails/page.tsx`, `app/cocktails/kategorie/[slug]/page.tsx`, `app/cocktails/[slug]/page.tsx`, `app/akademie/page.tsx`, `app/akademie/[slug]/page.tsx`, `app/akademie/zertifikate/page.tsx`, `app/finder/page.tsx`, `app/partyplaner/page.tsx`, `app/partyspiele/page.tsx`, `app/leergut/page.tsx`, `app/oeko-tracker/page.tsx`, `app/community/page.tsx`, `app/kuehlschrank/page.tsx`.
- Create: `components/editorial/learning.module.css`, `components/editorial/tools.module.css`, `e2e/sitewide-learning-tools.spec.ts`, `lib/cinematic/__tests__/sitewide-learning-tools.test.tsx`.

**Interfaces:**
- Consume common Task 1 system; preserve every interactive state and existing function signature in these pages. Styling and presentation markup only; do not rewrite calculators, quizzes, game rules or data persistence.
- ProductCard/ProductGrid also serve wishlist; Task 5 consumes their finished presentation.

- [ ] **Step 1: RED tests.** Assert each family uses editorial intro/layout with actual headings and readable labels; retain existing calculation/quiz tests. Browser test recipe category/detail navigation, lesson/quiz/result/retry, finder step/results/reset, litres-only partyplanner, party-game modal open/close and leergut input/result.
- [ ] **Step 2: Run RED.** `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-learning-tools.test.tsx --maxWorkers=2`; tests must expose old presentation or missing structure, not data stubs.
- [ ] **Step 3: Implement.** Recipes image-led with intact licenses; course navigation/readable lesson text with existing illustrative media. Tools become focused workspaces with clear step/progress/results layouts; remove decorative emoji, obsolete gradients/glows/oversized rounded tiles from rendered views without deleting functional text/states. Retired feature pages stay informative and disabled. No education funding claims or new promised expertise.
- [ ] **Step 4: Browser verify each family.** 390/768/1440 first view plus relevant active states; no controls hidden by sticky bars or inaccessible mobile lesson navigation; strong focus/contrast and intact input relationships.
- [ ] **Step 5: Focused tests, existing quiz/finder/calculator tests, TypeScript, changed-file lint, diff check, full web tests once, commit.** Use `NODE_ENV=test npm test -- lib --maxWorkers=2`; unchanged native application suites are consolidated in final acceptance. Do not change actual recipe/course/tool data.

### Task 5: Rental, career, lists, contact, legal and recovery pages

**Files:**
- Modify: `app/vermietung/page.tsx`, `app/warenkorb/page.tsx`, `app/merkzettel/page.tsx`, `app/bewerbung/page.tsx`, `app/bestellungen/page.tsx`, `app/kontakt/page.tsx`, `app/impressum/page.tsx`, `app/datenschutz/page.tsx`, `app/agb/page.tsx`, `app/not-found.tsx`; `components/rentals/InquiryCheckout.tsx`, `RentalCheckout.tsx`, `RentalOrderStatus.tsx`, `components/applications/ApplicationForm.tsx`, `components/CartDrawer.tsx`, `WishlistDrawer.tsx`.
- `/checkout`, `/mietbestellung/[id]` wrappers may stay thin if actual rendered components migrate.
- Create: `components/editorial/transaction.module.css`, `e2e/sitewide-service-pages.spec.ts`, `lib/cinematic/__tests__/sitewide-service-pages.test.tsx`.

**Interfaces:**
- Consume Task 1 editorial primitives and Task 4 ProductCard. Keep all props, event handlers, form attributes, API calls and request types unchanged.
- Legal/contact copy remains exact aside from removing decorative icons and adding purely navigational labels. Do not edit protected admin components.

- [ ] **Step 1: RED tests.** New presentation assertions for actual forms/cards/headings plus guard tests compare unchanged meaningful controls/addresses/legal text. Browser test quantity +/- and error, dated quote, empty/mixed/unpriced list behavior, disabled upload fallback and contact links. Invalid status ID must remain safe. Never submit real applications/messages.
- [ ] **Step 2: Run RED.** `NODE_ENV=test npx vitest run lib/cinematic/__tests__/sitewide-service-pages.test.tsx --maxWorkers=2` fails on old presentation.
- [ ] **Step 3: Implement.** Rental product choice and summary become a calm useful catalogue/form, consistent controls and mobile stacking. Career job originals remain full and prominent with clear info mailbox CTA and unchanged gates. Lists/drawers/checkout states consistent. Contact receives useful grouped information, legal pages comfortable reading widths, 404 straightforward links rather than emoji cards.
- [ ] **Step 4: Browser verify.** All listed families at 390/768/1440, important form/empty/error states, Escape drawer close/focus; no business mutation or inferred activation. Inspect inherited admin shell read-only for layout regression without admin login or protected data.
- [ ] **Step 5: Focused tests, existing rental/application/read-only web tests, TypeScript, changed-file lint, diff check, full web tests once, commit.** Use `NODE_ENV=test npm test -- lib --maxWorkers=2`; unchanged native application suites are consolidated in final acceptance. Report residual native prerequisites honestly; no service/security fixes from this scope.

## Controller final acceptance

- [ ] Run `NODE_ENV=test npm test -- lib --maxWorkers=2`, `npx tsc --noEmit`, `npm run lint`, one full project test run with known native prerequisites reported, `npm run offers:check`, `npm run build` (serialized).
- [ ] Stop only the controller-owned local production preview, restart the newly built app on loopback port 3110, keep dev 3000 available; no public server actions.
- [ ] Run real-page tests from the five new sitewide E2E files plus compatible original contact/film/functional suites against local production. Tests labelled `[fixture]` run separately on the explicitly marked development server, never against production (whose fixture gates must remain closed). Run both groups; do not silently skip coverage. No external HTTP-origin/test-clock substitution.
- [ ] Run `npm run audit:public -- --url http://127.0.0.1:3110 --output audit/evidence/sitewide-filmisch-2026-10-10.json` and local content check. Check actual original hashes and offer counts unchanged.
- [ ] Controller uses CUA to inspect and capture every page family and major interaction states; compare header directly to screenshot/prototype and full-page flow to approved design, with proof inventory by route. Unknown/legacy routes and same-origin menu clicks tested explicitly.
- [ ] Fresh whole-change reviewer sees complete diff from `6d60875` plus per-task reports and coverage evidence. Fix reproduced issues through scoped implementation/re-review.
- [ ] Only verified owned commits/docs/screenshots pushed. Open actual rebuilt local homepage, reset temporary viewport, show screenshot and clearly state not live. Don't claim application/full native system acceptance from web tests.
