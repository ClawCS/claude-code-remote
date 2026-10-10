# Desktop Photo Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 18 passende freigegebene Desktop-Motive mit korrigierten Stellenplakaten in die bestehende Website integrieren und geprüft veröffentlichen.

**Architecture:** Getrennter lokaler Bildbestand nach dem vorhandenen Google-Foto-Assetmuster, mit reproduzierbaren Derivaten und Build-Prüfung. Nur bestehende Rubriken ergänzen; keine Änderung von Wochenangeboten oder Bewerbungsdiensten.

**Tech Stack:** Bestehendes Next.js 16.3.8, React, TypeScript, Sharp 0.35.5, Vitest, CSS Modules/Tailwind. Keine neuen Abhängigkeiten.

**Spec:** `docs/superpowers/specs/2026-10-10-desktop-photo-integration.md`

**Status:** Zur Abnahme. Empfohlene Methode: direkte Umsetzung in dieser Worktree mit einer unabhängigen Abschlussprüfung. Noch keine Umsetzung oder Veröffentlichung des Einbauplans. Nicht-generative E-Mail-Korrektur benötigt die ausdrückliche Methodenbestätigung; generative Vorschauen nicht ungeprüft übernehmen.

## Global Constraints

- „Vorhandene Gestaltung und Rubriken bleiben erhalten.“
- „Auf den Stellenplakaten muss die Bewerbungsadresse `info@trinkgut-jammers.de` lauten.“
- „Bewerbungsupload bleibt gesperrt. Keine AppArmor-, Scanner-, Mail-, Zahlungs-, Lösch- oder Hostingkonfiguration ändern.“
- „Sortiment und Angebote enthalten weiterhin ausschließlich datumsrichtig geprüfte Handzettel-Angebote.“
- „Keine erfundenen Gewinnernamen, Monate oder Zuordnung zu laufenden Verlosungen.“
- Die 18 Originale und Ausschlüsse sind exakt in der Spec festgelegt; private Originale auf dem Desktop unverändert erhalten.
- Aktive Worktree/Branch erhalten; fremde Screenshot-/Auditänderungen nicht stagen oder verwerfen.

## Review Focus

- Richtige EXIF-Orientierung und vollständige Fotofläche bei sehr schmalen Portraits/Screenshot-Balken → Task 1 Assettest und Task 2 Browserabnahme.
- E-Mail-Korrektur verändert unbeabsichtigt Gesichter oder QR-Ziele → Task 1 Pixelvergleich außerhalb des E-Mail-Rechtecks und QR-Abgleich.
- Gaswerbung wird vom pauschalen Altpreis-Hinweis fälschlich als abgelaufen bezeichnet → Task 2 getrennte Abschnitts-/Copy-Tests.
- Neue Ausbildungsanzeige suggeriert verfügbaren Upload oder erweitert ungeprüft den Backend-Vertrag → Task 2 Bewerbungs-UI-/API-Regression.
- Quellen fehlen im Linux-Release oder Bilder werden abgeschnitten → Task 1 Archivfiltertest, Task 2 sauberer Linux-Build und öffentliche Bildabnahme.

---

### Task 1: Geprüfter lokaler Bildbestand

**Files:**
- Create: `assets/source/user-market-photos/manifest.json`, 18 bereinigte Bildquellen und `public/images/editorial/user/*.webp`.
- Create: `scripts/build-user-market-assets.mjs`, `data/user-market-photos.ts`, `lib/__tests__/user-market-assets.test.ts`.
- Modify: `scripts/validate-content-build.ts`, `lib/__tests__/build-asset-guard.test.ts`, `package.json`, `docs/DEPLOYMENT-RUNBOOK.md`, `AGENTS.md`.
- Record: `docs/audits/2026-10-10-desktop-photo-integration.md`; private Originalhash-/Transformationsdetails unter `.superpowers/desktop-photos-2026-10-10/`.

**Interfaces:**
- Consumes: 18 Originale aus der Spec; bestätigte E-Mail-Textkorrektur-Methode. Bestehendes Muster `scripts/build-google-market-assets.mjs`, ohne dessen Quellen/Derivate zu verändern.
- Produces: `EditorialPhoto = Readonly<{src:string;width:number;height:number;alt:string}>`; `USER_MARKET_PHOTOS` mit Schlüsseln `bueble`, `erdinger`, `wineShelf`, `mixedBeer`, `schneiderWeisse`, `spezi`, `salitosPoster`, `liefmansPoster`, `gasExchange`, `tcgShelf`; `PRIZE_HANDOVER_PHOTOS: readonly EditorialPhoto[]` (5); `USER_JOB_POSTERS` mit `fulltime`, `parttime`, `apprentice`.
- Produces: `node scripts/build-user-market-assets.mjs --check` ist strikt lesend; Aufruf ohne Argumente baut ausschließlich freigegebene Derivate atomar neu.
- Manifest folgt dem bestehenden strikten Schema mit Quellenart `operator-approved-desktop`, Freigabebasis `user-approved-desktop-2026-10-10`, Hashes, Maßen und vollständigem Quellrechteck. Keine privaten Pfade oder Identitäten.

- [ ] **Step 1: Write failing tests.** Assetfixture validiert exakt 18 eindeutige Bildzuordnungen; keine ausgeschlossenen Dateien; gültige Hashes/Proportionen; keine EXIF/GPS/XMP/IPTC; Quelle innerhalb Quellordner. Mutationstests für falschen Hash, Zusatzdatei, Symlink-Ausbruch, falsche Maße, Budgetüberschreitung und abweichende Quellenart. Build-Guard verlangt den neuen Prüfer vor Manifestgenerierung. Deployment-Archiv muss `assets/source/user-market-photos` enthalten.
- [ ] **Step 2: Verify RED.** `NODE_ENV=test npm test -- lib/__tests__/user-market-assets.test.ts lib/__tests__/build-asset-guard.test.ts`; erwarteter Ausfall wegen fehlendem Bestand/Prüfer.
- [ ] **Step 3: Prepare approved sources.** Metadaten bereinigen und natürliche Orientierung festschreiben. Nach Methodenfreigabe drei E-Mail-Zeilen präzise ersetzen; vor Kompression Pixelgleichheit außerhalb des jeweils protokollierten Rechtecks beweisen, QR-Ziel abgleichen und Text visuell prüfen. Generative Ganzbildvorschauen nicht veröffentlichen. Spezi nur um äußere schwarze Balken bereinigen. Originalhash und Transformation privat dokumentieren.
- [ ] **Step 4: Implement pipeline and public data.** Sharp 0.35.5, sRGB, fit-inside ohne Vergrößerung: maximal 1200×1600, WebP Qualität 82 für Fotos bzw. 90 für Plakate, effort 6. Maximal 350.000 Byte je Foto bzw. 500.000 Byte je Plakat. Vollständige kanonische PNG-/JPEG-Quelle, getrennte öffentliche WebP-Datei. Strikte Manifest-/Pfad-/Dateiliste nach vorhandenem Muster, Prüfung reproduziert Ausgabe im Speicher. Build-Guard und Release-Positivfilter ergänzen, kein Sicherheitsdienst anfassen.
- [ ] **Step 5: Verify GREEN.** Gleiche Tests wie Step 2, zusätzlich `node scripts/build-user-market-assets.mjs --check`. Alle Tests grün, 18 Bilder geprüft, keine Mutation im Check-Modus. Kontaktbogen ausschließlich der ausgewählten Bilder visuell prüfen; Alternativtexte anhand tatsächlicher Motive formulieren.
- [ ] **Step 6: Commit.** Nur die expliziten eigenen Task-Dateien stagen, `git commit -m "feat: prepare approved desktop photo assets"`. Keine Rohquellen aus anderen Ordnern und keine fremden Auditdateien.

### Task 2: Rubriken ergänzen, prüfen und veröffentlichen

**Files:**
- Modify: `data/market-photos.ts`, `app/marktleben/page.tsx`, `app/gewinnspiel/page.tsx`, `components/giveaways/giveaways.module.css`, `components/cinematic/GrailBidSection.tsx`, `components/cinematic/warm.module.css`, `components/applications/ApplicationForm.tsx`.
- Test: `lib/__tests__/market-photo-rubrics.test.tsx`, new `lib/__tests__/desktop-photo-placement.test.tsx`, existing `lib/__tests__/application-ui-contract.test.ts` and giveaway contracts.
- Record: `docs/audits/2026-10-10-desktop-photo-integration.md`, final release note in `AGENTS.md`.

**Interfaces:**
- Consumes: Task 1 exports in `data/user-market-photos.ts`; existing `APPLICATION_EMAIL`, `SITE_LINKS.grailbid`, `ApplicationForm` readiness/role contracts.
- Produces: Same public routes, same APIs and header/navigation; 18 new motifs in their specified rubrics. Homepage keeps 3 discovery cards; Job upload remains unavailable until its separate safety gates pass.

- [ ] **Step 1: Write failing placement tests.** Homepage exactly 3 cards, market card `schneider-weisse.webp` → `/marktleben`, remaining destinations unchanged. Marktleben includes 6 new photos plus 3 posters, no captions/private paths/excluded photos. Gas section contains original €14.99/€25.99 poster separately from the old-photo price notice. Giveaway handovers count 5 with no month attributes and no active-giveaway replacement. GrailBid uses `tcg-regal.webp` and same external link. Jobs contains 3 correct posters, apprentice mailto targets `info@trinkgut-jammers.de`, API roles remain exactly existing 2 and upload stays disabled.
- [ ] **Step 2: Verify RED.** `NODE_ENV=test npm test -- lib/__tests__/market-photo-rubrics.test.tsx lib/__tests__/desktop-photo-placement.test.tsx lib/__tests__/application-ui-contract.test.ts`; expected failures on missing new images/sections, not altered old business contracts.
- [ ] **Step 3: Implement scoped rendering.** Apply the eight display rules in the spec. Natural-ratio `next/image`; no hidden informative TCG photo via `aria-hidden`. Accessible full-view links for posters. Add images to existing sales cards and a separate apprentice email card without changing form transport/role selection. Do not alter homepage hero, existing team portraits, rental data or content package logic.
- [ ] **Step 4: Verify locally.** Repeat focused tests; run `NODE_ENV=test npm test -- lib/ --maxWorkers=2`, `npm run lint -- --quiet`, `npx next typegen`, `npx tsc --noEmit`, asset check and production build. Start/verify local dev server and exact changed routes per AGENTS. Browser checks at mobile 390px and desktop 1440px: complete posters, all 5 handovers, GrailBid photo, readable headings, keyboard links, no overflow. No real form submissions.
- [ ] **Step 5: Independent review and commit.** One fresh reviewer checks full diff against spec, exclusions, prices, upload boundary and source integrity. Reproduce important findings with regression tests before fixes. Commit only own checked page/test/docs changes and push verified branch; preserve foreign changes.
- [ ] **Step 6: Release and public verification.** Read deployment runbook including website-only boundary. Fresh git-archive release including sanitized user-image source folder; verify archive/hash, native Linux web tests/build. Switch only website release, keep previous release for rollback; do not install security configs. Confirm readiness then `npm run content:check -- --url https://trinkgut-jammers.de` and `npm run audit:public -- --url https://trinkgut-jammers.de` according to actual CLI signatures. Check all 18 public image downloads, changed pages, unchanged disabled application config and live layout. No test clock against production.
- [ ] **Step 7: Record outcome.** Document selected images, exact email edit, hashes, tests, commit/release and rollback IDs; separate prepared/Git/live states. Final UI message includes Mac `Cmd+Shift+R` / Windows `Strg+Shift+R`. Do not claim completed applicant workflow.

## Self-review

Spec coverage: all 18 motifs assigned; all excluded motifs remain excluded; source approval, email edit, accessible full-size poster rendering, applicant boundaries and deployment are covered. Interfaces have one source of truth in Task 1; no new API jobs or normalized offer prices. Five review-focus failure modes have explicit checks. Execution is intentionally two bounded tasks, not a new design system or site rebuild.
