# Weekly Publication Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Geprüfte DE-/NL-Originale, Vorschauen und alle Angebotskacheln gemeinsam auf dem eigenen Server ausliefern und zuverlässig nach Originaldatum auswählen.

**Architecture:** Offizielle Quellmetadaten bleiben unverändert; versionierte Wochenmanifeste binden lokale Originaldateien und geprüfte Angebotsdatensätze. Ein gemeinsamer Server-Loader versorgt bestehende Flyeransichten und eine neue lesende Angebots-API. Import, Prüfung und Linux-Release bleiben getrennte, nachweisbare Schritte des bestehenden Ablaufs.

**Tech Stack:** Bestehende Next.js 16.3.8/React 19.2.4/TypeScript-Anwendung; Node >=22.13.0; pdf-lib, sharp, Vitest; bestehender Hetzner-/Caddy-Releaseweg. Keine neue Produktabhängigkeit.

**Spec:** `docs/superpowers/specs/2026-10-08-weekly-publication-packages-design.md`, am 08.10.2026 vom Betreiber freigegeben.

**Status:** Umgesetzt und unabhängig geprüft. App-Release `eb1338c` ist am 08.10.2026 um 20:08 UTC aktiviert; öffentliche Abnahme und bestehende Automationen sind dokumentiert in `docs/audits/2026-10-08-weekly-publication-packages.md`. Bekannte PDF-Browsergrenze und technische Entscheidungen stehen ausdrücklich im Bericht.

## Global Constraints

- „Das bestehende Erscheinungsbild bleibt erhalten.“
- „Die vorhandenen 107 DE- und 21 NL-Angebote bleiben erhalten.“
- „Keine stillen Preiskorrekturen.“
- „Falsche Woche, fehlender Ursprung, beschädigte Datei oder mehrseitige NL-PDF bleiben blockierend.“
- „Keine DNS-, Vertrags-, Zahlungs-, Miet- oder Mailänderungen.“ `RENTAL_MODE=disabled` bleibt gesetzt.
- „Nicht im laufenden `current` editieren.“ Nur neue geprüfte Linux-Releases aktivieren.
- „Private Canva-Identitäten, Authentifizierungsdaten und Roharbeitsordner gelangen weder in öffentliche APIs noch in Git oder den Release.“ Bestehende historische Provenienzdateien nicht neu als öffentliche API ausgeben.
- „Die Aufgaben bleiben vom eingeschalteten Mac, der laufenden Codex-App und erforderlichen Canva-/Browseranmeldungen abhängig.“ Zeitpläne Sonntag 17:00 und täglich 06:15 Europe/Berlin erhalten.
- Aktive Worktree und Branch aus AGENTS.md wiederverwenden; fremde Screenshots und die zwei alten unversionierten Berichte weder stagen noch verwerfen.
- Vor Codeänderungen die lokalen Next-Dokumente zu Route Handlers und öffentlichen Dateien lesen. Kein neues Frontend-Redesign, kein Server-Cron, kein CMS.

## Review Focus

1. Ein Download endet nach gültigem Anfang, liefert fremde Redirects oder überschreitet ohne Content-Length 50 MiB: abbrechen, bisherige Veröffentlichung bytegleich erhalten (Task 2).
2. Eine PDF wird bei gleicher Woche/ID ersetzt: alte Kacheln nicht durch gleiche URL/ID akzeptieren; PDF-Hash, lokale Quelle und Versionsbindung sind zwingend (Tasks 1–3).
3. Ein defektes NL-Paket oder ein fehlender Angebotsblock darf gültiges DE nicht verdecken und zugleich keinen vollständigen Erfolg melden (Tasks 1, 3, 4).
4. Sonntag-Vorbereitung und bereits geöffnete Tabs: laufende Woche bewahren, neue Woche erst nach Berliner Datumswechsel zeigen, alte Clientantworten nicht zurückschreiben lassen (Tasks 2–3).
5. Ein Release oder Rollback enthält nur historische Daten: kein Datumstrick und keine Anforderung, alte Quellen wieder online zu finden; wirklich fehlende aktuelle Werbung trotzdem im Tageslauf melden (Tasks 1, 4–5).

## Dateigrenzen und gemeinsame Verträge

Neue Dateien: `lib/weekly-publication-types.ts` (Datentypen), `lib/weekly-publication.ts` (Schema/Integrität/Datumswahl), `lib/official-publication-import.ts` (begrenzter Originalimport), `lib/weekly-offer-content.ts` (öffentliche Angebotsauswahl), `app/api/content/offers/route.ts` (nur GET), `data/editorial/weekly-publications/YYYY-MM-DD.json` (je Zielmontag), eigene Tests/Fixtures und Abschlussbericht.

Bestehende globale Angebotsdateien bleiben verwendbar: `data/weekly-offer-layout.json` kann Quellen mehrerer Wochen enthalten; `data/weekly-offers.json` enthält deren geprüfte Metadaten. `offers:build -- --week YYYY-MM-DD` ersetzt nur die Zielwoche und erhält andere Wochen. Keine zweite parallele Angebotsdatenbank einführen.

Gemeinsame Typen in `weekly-publication-types.ts`:

```ts
type LocalAsset = Readonly<{ path: string; sha256: string; bytes: number }>;
type PublishedOffer = ReturnType<typeof buildPublicOfferMetadata> & { imageSha256: string };
type EditionSource =
  | { kind: "trinkgut-official"; catalogId: string; catalogVersion: string; metadataSha256: string }
  | { kind: "canva"; flyerId: string };
type WeeklyEdition = Readonly<{
  id: string; language: "de" | "nl"; title: string; validFrom: string; validTo: string;
  source: EditionSource; pdf: LocalAsset; cover: LocalAsset; pageCount: number;
  review: { reviewedAt: string; printedValidFrom: string; printedValidTo: string; pageOfferCounts: readonly number[] };
  offerIds: readonly string[]; offersSha256: string;
}>;
type WeeklyPublication = Readonly<{ schemaVersion: 1; week: string; editions: readonly WeeklyEdition[] }>;
type VerifiedWeeklyEdition = Readonly<{ edition: WeeklyEdition; offers: readonly PublishedOffer[] }>;
type WeeklyPublicationIssue = Readonly<{ week: string | null; language?: "de" | "nl"; code: string }>;
type LoadedWeeklyPublications = Readonly<{ editions: readonly VerifiedWeeklyEdition[]; issues: readonly WeeklyPublicationIssue[] }>;
```

`offersSha256` ist SHA-256 der UTF-8-Bytes von `JSON.stringify(rows.toSorted((a,b)=>a.id.localeCompare(b.id)))`; `rows` werden zuvor über den kanonischen Metadatengenerator mit fester Feldreihenfolge erzeugt. Andere JSON-Schlüsselreihenfolge darf keine ungeprüften Daten einschleusen. `LocalAsset.path` ist relativ zur öffentlichen Origin, nicht zum Dateisystem. Katalog-Metadatenhash bindet die unveränderten gespeicherten JSON-Bytes. Privater Ursprung bleibt im Manifest/Import, nicht in öffentlichen Antworten.

## Task 1: Wochenmanifest und Dateiintegrität

**Files:** Neue Typen/Loader wie oben; Tests `lib/__tests__/weekly-publication.test.ts`; Fixture `lib/__tests__/fixtures/weekly-publication.ts`. Bestehende Datumshilfen und `validateCatalog`/`verifyFlyerFiles` wiederverwenden, keine Gültigkeitsausnahmen lockern.

**Interfaces:** `parseWeeklyPublication(value: unknown): WeeklyPublication`; `parseWeeklyEdition(value: unknown, week: string): WeeklyEdition`; `verifyWeeklyEdition(edition: WeeklyEdition, root: string): Promise<VerifiedWeeklyEdition>`; `loadWeeklyPublications(root = process.cwd()): Promise<LoadedWeeklyPublications>`; `selectPublishedEditions(loaded: LoadedWeeklyPublications, now: Date): readonly VerifiedWeeklyEdition[]`. Rohdateien/Manifest werden pro Produktionsprozess einmal geprüft; zeitabhängige Auswahl bei jedem Aufruf, nicht beim ersten Request einfrieren. Der Importparser verlangt alle vorhandenen Einträge valide; der Runtime-Loader validiert nach lesbarem Wochenheader jede Sprache getrennt, auch bei fehlerhaften Edition-Metadaten. Nicht lesbares JSON/ungültiger Wochenheader ist ein Wochenfehler. Öffentliche Auswahl meldet nur Fehler der betroffenen aktuellen Woche oder nicht zuordenbare Integritätsfehler; Vorbereitungsprüfung betrachtet ausdrücklich die Zielwoche.

- [x] **1. Failing tests schreiben.** Fixture erzeugt lokale echte PDFs und dekodierbare Bilder, prüfbare DE-Metadaten, NL-Eintrag und Angebotsdaten in einem Temp-Verzeichnis; keine Produktionsdateien verändern. Testfälle `rejectsChangedOriginal`, `isolatesCorruptNl`, `acceptsHistoricalPackage`, `rejectsTraversalAndSymlinks`, `requiresExactCensus` mit Kernassertionen:
  ```ts
  await expect(verifyWeeklyEdition(changedHashEdition, root)).rejects.toThrow();
  expect((await loadWeeklyPublications(root)).editions.map(x => x.edition.language)).toEqual(["de"]);
  expect(selectPublishedEditions(validLoaded, new Date("2026-10-10T22:00:00Z"))).toEqual([]);
  ```
- [x] **2. Rot nachweisen:** `npm test -- lib/__tests__/weekly-publication.test.ts`; neue fehlende Exporte/Verhaltensassertionen müssen scheitern.
- [x] **3. Verträge implementieren:** strikte Version/Schlüssel, gültiger Montags-Dateiname, eindeutige IDs/Sprache, geprüfte tatsächliche Zeiträume, sichere Pfade unter `public`, keine Symlinks außerhalb des Roots, Hash/Dateigröße (max. 50 MiB), PDF-Seitenzahl (DE passend zum Katalog, NL genau eins), Bilddecodierung, Seiten-/Angebotszählung und identische Quellenhashes. Vollständige DE-/NL-Originalbindung prüfen; keine Canva-URL als öffentliche Quelle. Fehlende Pflichtsprache erst in der zeitbezogenen Auswahl verlangen.
- [x] **4. Grün nachweisen:** neuer Test plus `flyer-packages`, `official-catalog-packages`, `editorial-schedule`, `handzettel-catalog`; KW40-Ausnahme, normale Samstage, Sonntag, Jahreswechsel und Sommerzeit behalten.
- [x] **5. Nur diese geprüften Änderungen committen.** Noch kein Deployment.

## Task 2: Import und vollständige Angebotspakete vorbereiten

**Files:** `lib/official-publication-import.ts`, `scripts/content-weekly.ts`, `scripts/build-weekly-offers.ts`, `lib/weekly-offer-metadata.ts`; Tests `lib/__tests__/official-publication-import.test.ts`, bestehende `weekly-offer-metadata.test.ts` und `content-weekly.test.ts`/Fetch-Fixtures.

**Interfaces:** `importOfficialPublication(catalog: HandzettelCache, options: {root: string; fetchImpl?: typeof fetch}): Promise<{pdf: LocalAsset; cover: LocalAsset; stagingDirectory: string}>`; `assembleWeeklyPublication(week: string, root: string): Promise<WeeklyPublication>`. Der Import legt Bytes nur im privaten Staging ab; `LocalAsset.path` beschreibt den späteren öffentlichen Zielpfad. Die Assembly kopiert nach belegtem Review die gehashten Bytes an dieses Ziel und prüft sie erneut vor der Manifestbindung; `stagingDirectory` wird nie veröffentlicht. Der Metadatengenerator erhält `publishedPdfPath` als Pflichtfeld je Quelle und die Signatur `buildPublicOfferMetadata(source: WeeklyOfferPublicSource, page: number, offer: ReviewedWeeklyOffer, imagePath: string)`, damit sein Bildpfad an das zuvor erzeugte Derivat gebunden wird. `sourceUrl` in öffentlichen Angebotsdaten wird für beide Sprachen der lokale PDF-Pfad. Herkunfts-URLs bleiben im redaktionellen Layout. Das Layout erhält zusätzlich `printedValidFrom`, `printedValidTo` und `coverSha256` aus dem belegten Originalabgleich.

- [x] **1. Failing tests schreiben:** lokale vollständige Bytes trotz späterem Ursprungsausfall; Ablehnung von fremdem Redirect, HTML, falscher Seitenzahl, vorzeitigem Streamende, Überschreitung von 50 MiB (auch ohne Header), abweichender Deckblattprüfung. `failedPreparationPreservesPreviousManifest` vergleicht die vorherigen Manifestbytes; `preparingNextWeekPreservesCurrentOffers` vergleicht sämtliche unveränderten aktuellen Zeilen. Tests für doppelte/ungültige `--week`-Optionen und idempotentes Wiederholen ergänzen.
  ```ts
  await expect(importOfficialPublication(catalog, {root, fetchImpl: foreignRedirectFetch})).rejects.toThrow();
  expect(await readFile(manifestPath, "utf8")).toBe(previousManifestBytes);
  expect(currentWeekRowsAfter).toEqual(currentWeekRowsBefore);
  ```
- [x] **2. Rot nachweisen:** `npm test -- lib/__tests__/official-publication-import.test.ts lib/__tests__/weekly-offer-metadata.test.ts lib/__tests__/content-weekly.test.ts`.
- [x] **3. Import erweitern:** GET mit begrenztem Stream und Timeout, offizielle Herkunft ohne fremde Weiterleitung; Quellmetadaten weiter strikt validieren. PDF unverändert, Cover vollständig speichern. Neue DE-Pfade `/handzettel/YYYY/de-<week>-<pdfSha256>.pdf` und `/images/content/de-<week>-<coverSha256>.jpg`; keine veröffentlichten Pfade mit anderen Bytes überschreiben. Bestehende gültige NL-Pfade erhalten; spätere geänderte NL-Versionen erhalten neue eindeutige Pfade.
- [x] **4. Vorbereitung vervollständigen:** erste Downloads dürfen vor der redaktionellen Abnahme nur einen Vorbereitungsstand unter ignoriertem `.superpowers/weekly-preparation/<week>/` erzeugen. Ohne Original-/Layoutprüfung bleibt der Bericht unvollständig. Nach datums-/sprach-/hashgebundenem Review und erfolgreichem `offers:build -- --week <week>` bindet `assembleWeeklyPublication` alle geprüften Dateien/Kacheln. Erst dann Wochenmanifest atomar schreiben. Eine isoliert geprüfte Sprache darf als Teilpaket bereitstehen; Exitcode bleibt wegen fehlender Pflichtteile ungleich null. Bestehende Lock-/Temp-/Fehlerbehandlung erhalten, bei Downloadfehler weder Katalogbindung noch Manifest ersetzen. Die CLI bietet keinen pauschalen `--force`-Bypass.
  Bereits gebundene identische Katalogmetadaten bei Wiederholung erhalten, statt allein `fetchedAt` zu überschreiben und dadurch den Metadatenhash ungültig zu machen. Neue Katalog-/Originalversion nur gemeinsam mit neuer geprüfter Quellenbindung übernehmen. Alle mehrteiligen Writes erfolgen ausschließlich in der redaktionellen Worktree, nie im laufenden Release; unterbrochene Zustände blockieren Build/Veröffentlichung.
- [x] **5. Angebotsgenerator aktualisieren:** `--week` baut/ersetzt nur diese Quellen; `--check` ohne Woche prüft sämtliche deklarierten Quellen. Bildpfade bei Neugenerierung mit Inhaltsfingerabdruck versehen, vorhandene KW41-Bildbytes und Bedingungen unverändert übernehmen. Vollständige Seitenliste inklusive Seiten mit null bepreisten Angeboten verlangen; Layout und publizierte IDs müssen exakt übereinstimmen. Alle Ausgaben vor dem Austausch vollständig prüfen; fehlerhafte Teilstände erhalten keine Wochenbindung.
- [x] **6. Grün nachweisen und gezielt committen:** dieselben Tests; zusätzlich ein Temp-Fixture mit zwei Wochen, einmal beide Sprachen und einmal fehlender NL-Ausgabe. Keine echten Quellen/Accounts im Test verändern.

## Task 3: Einheitliche öffentliche Auswahl und aktualisierbares Sortiment

**Files:** `lib/homepage-content.ts`, `lib/flyer-index.ts`, `lib/catalog.ts`, neue `lib/weekly-offer-content.ts`, neue `app/api/content/offers/route.ts`, `components/WeeklyOfferGrid.tsx`, `components/ProductCatalogue.tsx`, `components/FlyerIndexView.tsx`, `app/produkte/page.tsx`, `app/kategorie/[slug]/page.tsx`; betroffene Content-/Darstellungs-/E2E-Fixtures. Tests `weekly-assortment`, `homepage-content`, `flyer-index`, `weekly-offer-cards` sowie neu `weekly-offer-content.test.ts`.

**Interfaces:** `mapPublishedEditionToFlyer(edition: WeeklyEdition): HomepageFlyer & {language: "de" | "nl"; pdfSha256: string}`; `getWeeklyOfferContent(now?: Date): Promise<WeeklyOfferContent>` mit `WeeklyOfferContent = {status: "ok" | "degraded"; issues: readonly string[]; generatedAt: string; flyers: readonly PublicFlyer[]; offers: readonly PublicOfferView[]}`. `PublicFlyer` ist der eben definierte öffentliche Mappertyp. `PublicOfferView` enthält nur `id`, `name`, `categorySlug`, `language`, `flyerId`, `validFrom`, `validTo`, `image`, `sourcePage`, `rect`, `pdfSha256`, `sourceUrl`, `conditions`, optional `sourceWarning`; keine privaten Layoutpfade, Review-/Canva-Daten. Typen in `weekly-publication-types.ts` deklarieren.

- [x] **1. Failing tests schreiben:** lokale Flyerlinks bei ausgefallenem Ursprung; kein externer Cache-Vorrang; gleiche Flyer-ID mit neuem Originalhash blendet alte Kacheln aus; NL-Defekt lässt DE übrig und meldet `degraded`; keine Lecks von `designId`, `privatePdf`, `sourceImage`, `canva.com`. Für `GET /api/content/offers` Status/No-Store und exakte öffentliche Felder prüfen.
  ```ts
  expect(mapPublishedEditionToFlyer(edition).pdfUrl).toBe(edition.pdf.path);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(JSON.stringify(content)).not.toMatch(/designId|privatePdf|sourceImage|canva\.com/);
  ```
- [x] **2. Rot nachweisen:** `npm test -- lib/__tests__/weekly-assortment.test.ts lib/__tests__/homepage-content.test.ts lib/__tests__/flyer-index.test.ts lib/__tests__/weekly-offer-content.test.ts`.
- [x] **3. Serverauswahl umstellen:** alle öffentlichen Flyer-/Angebotsverbraucher verwenden den Task-1-Loader; offizielle Quellcache-Funktionen bleiben für Import/Alttests, sind kein öffentlicher Fallback. PDF-/Viewer-/Source-Links lokal, Hashbindung für beide Sprachen. Fehlende aktuelle Ausgabe führt zu Hinweis/Issue, nicht zu einem externen „newest“-Link. Bestehende Kampagnen-/Archivlogik nicht verändern. Markierte Testuhr ausschließlich in isolierten Fixtures erhalten.
- [x] **4. Clientliste umstellen:** `WeeklyOfferGrid` und `ProductCatalogue` erhalten initial `WeeklyOfferContent` vom Server, keinen direkten Import von `data/weekly-offers.json`. Aktualisierung beim Mount, Sichtbarwerden und alle 60 Sekunden über die neue API; vorhandene Suche/Sprach-/Warengruppenfilter bleiben. Datum weiterhin regelmäßig prüfen; ungültige/fehlgeschlagene Antwort leert die Auswahl. Sequenzkennung/Abort verhindert, dass eine alte Antwort eine neuere ersetzt. Form-/Bildgestaltung bleibt identisch.
- [x] **5. Grenzen prüfen:** isolierte Browserfixture wechselt Sonntag/Montag ohne Neuladen von alter auf neue Liste; synthetische API-Antworten absichtlich umgekehrt abschließen und ältere verwerfen; am Ende der Woche keine alten Angebote. Initiales SSR und Client-Refresh müssen dieselben IDs zeigen. Fokussierte Unit-Tests grün; Browserprüfung über verfügbare Browserwerkzeuge, kein unzulässiger zweiter UI-Automationsweg.
- [x] **6. Gezielter Commit nach Tests.** Noch kein Deployment.

## Task 4: Vollständigkeitsprüfung vor Build und nach Veröffentlichung

**Files:** `scripts/validate-content-build.ts`, `scripts/content-weekly.ts`, `lib/content-verification.ts`, `scripts/audit-public-site.mjs`, `next.config.ts`; bestehende Tests `content-weekly`, `content-verification`, `official-catalog-packages`; neue `weekly-publication-build.test.ts`.

**Interfaces:** `verifyPublishedOfferContent(expected: WeeklyOfferContent, actual: unknown): string[]`; öffentliche Dateiverifikation lädt beide Originale/Covers und überprüft Typ, Größe, SHA-256, nicht nur HEAD. Bestehende CLI-Optionen behalten; `--week` bleibt Montag und `--now` eine explizite Test-/Prüfuhr, keine Produktionsuhrumschaltung.

- [x] **1. Failing tests schreiben:** korrekte API-Metadaten mit falschen DE-Bytes muss fehlschlagen; fehlende Kachel oder falscher Hash in Offers-API ebenso. Vollständig importierter Stand besteht bei blockierten externen Anbieterhosts. Sonntag ohne aktuelle Werbung ist regulär leer; Sonntagsvorbereitung verlangt vollständige Folgewoche. Archivbuild ist ohne private Originalordner möglich.
  ```ts
  expect(verifyPublishedOfferContent(expected, missingOfferResponse)).not.toEqual([]);
  expect(corruptDeRun.report.deploymentVerified).toBe(false);
  expect(offlineOriginRun.report.errors).toEqual([]);
  ```
- [x] **2. Rot nachweisen:** fokussierte Tests der vier oben genannten Testdateien; Fixture-Netzwerk nicht versehentlich durch echten Internetzugang ersetzen.
- [x] **3. Prebuild härten:** lokale gebundene Ausgaben und sämtliche deklarierten Kacheln mit `offers:check` prüfen. Alte reine Quellenmetadaten dürfen historische Evidenz bleiben, aber keine öffentliche Ausgabe erzeugen. Abgebrochene Vorbereitungsstände sind kein Buildinput. Dateitracing für neue API und lokale Wochenmetadaten/-dateien ergänzen.
- [x] **4. Liveprüfung vervollständigen:** bestehende vier Flyeransichten und beide APIs plus `/api/content/offers`, `/produkte`, belegte Warengruppen und ihre Originalseitenlinks abgleichen. Checks für regulären Ablauf/Teilverfügbarkeit und korrekte Dateihashes; keine Quelle zum reinen Kundenabruf nachladen. `websiteVerified`/`deploymentVerified` erst nach allen notwendigen Prüfungen positiv. Der HTTP-Audit bekommt den neuen lesenden API-Vertrag; POST muss abgewiesen werden.
- [x] **5. Grün nachweisen und gezielt committen.** Fehlende öffentliche Bereitstellung bleibt separater Status; Loopback darf nie als Produktionsnachweis gelten.

## Task 5: KW41 übernehmen, gesamthaft prüfen und regulär veröffentlichen

**Files:** neues `data/editorial/weekly-publications/2026-10-05.json`, neue öffentliche DE-PDF/Cover, gezielte Updates `data/weekly-offer-layout.json`/`data/weekly-offers.json`, gegebenenfalls gehashte Angebotsbildpfade; `docs/CONTENT-UPDATE-RUNBOOK.md`, `docs/DEPLOYMENT-RUNBOOK.md`, `AGENTS.md`, eigener Bericht `docs/audits/2026-10-08-weekly-publication-packages.md` und eigene Belegscreenshots. Bestehende Automations-IDs nur über das Produktwerkzeug aktualisieren.

**Interfaces:** bestehende Import-/Validierungsverträge aus Tasks 1–4. Bestehende NL-Ausgabe und alle Kacheln bleiben quellengleich. Keine unspezifische Dateiübernahme aus privaten Ordnern.

- [x] **1. KW41-Regression zuerst festlegen:** `weekly-assortment.test.ts` verlangt 107 DE plus 21 NL; DE-Seitenzählung `[10,10,9,9,10,0,1,4,9,8,5,5,4,5,5,5,7,1]`. Vor Migration muss die fehlende lokale DE-Bindung reproduzierbar scheitern.
  ```ts
  expect(content.offers.filter(x => x.language === "de")).toHaveLength(107);
  expect(content.offers.filter(x => x.language === "nl")).toHaveLength(21);
  expect(content.flyers.every(x => x.pdfUrl.startsWith("/handzettel/"))).toBe(true);
  ```
- [x] **2. Originale übernehmen:** private verifizierte PDF/Cover unter `assets/source/canva-exports-2026-09-30/weekly-2026-10-05/` nur nach Hashvergleich mit Spec in die veröffentlichten eindeutigen Pfade kopieren. Diese Wiederherstellung benutzt die normale Dateiprüfung, keinen dauerhaften Sonder-Fallback. Gedruckte Daten und vollständige Motive gegen vorhandenen Abnahmebeleg prüfen; neue Abweichung nicht stillschweigend akzeptieren. Manifest an echte 18 DE-Seiten und genau eine NL-Seite binden, alle 128 originalgleichen Ausschnitte erhalten.
- [x] **3. Gesamttests:** `npm test`, `npm run lint -- --quiet`, `npx next typegen`, `npx tsc --noEmit`, `npm run offers:check`, `npm run build`, `npm audit --omit=dev`, `git diff --check`. Erfolg/Fehlerzahlen ehrlich protokollieren. Bekannte andere Dev-Abhängigkeiten nicht beiläufig ändern. Unabhängiges Review des Gesamtdiffs, Befunde beheben und betroffene Prüfungen wiederholen.
- [x] **4. Lokal abnehmen:** `localhost:3000` muss richtige Worktree bedienen; betroffene HTML-/API-/PDF-/Bildpfade prüfen. Desktop/Mobil `/`, `/angebote`, `/handzettel`, `/nl`, `/produkte` und Warengruppen mit echten Bildern kontrollieren. Eigene Screenshots, keine Überschreibung fremder Auditdateien. Ursprungs-404 darf keinen lokalen Bild-/PDF-Ausfall verursachen.
- [x] **5. Code/Content gezielt committen und pushen:** nur eigene positive Dateiliste. Frischen Commit archivieren, Hash prüfen, auf bestätigter VM als `jammers` unter Linux installieren/testen/bauen. Release root-eigen, nur `.next/cache` schreibbar. Aktuellen Release vorher notieren, atomar wechseln und Bereitschaft bounded prüfen; nötigenfalls Rollback nach Runbook. Kein DNS-/Caddy-/SMTP-/Mietbetriebsumbau.
- [x] **6. Öffentlich abnehmen:** `npm run content:check -- --url https://trinkgut-jammers.de` und `npm run audit:public -- --url https://trinkgut-jammers.de --output /tmp/jammers-weekly-publication-live.json`; alle Assets und APIs auf dem tatsächlichen HTTPS-Origin, Angeboteanzahl, Desktop/Mobil und deaktivierten Mietbetrieb prüfen. Beim aktuellen Datum exakt 128 Angebote erwarten; Tests an anderer Uhr nicht als reale aktuelle Werbung ausgeben. Zeitpunkt/Release/Dateihashes und Browsergrenzen im Bericht nennen.
- [x] **7. Bestehende Automationen aktualisieren:** `jammers-werbung-der-folgewoche` und `jammers-werbung-und-ver-ffentlichung-pr-fen` vorher lesen; volle Felder erhalten, nur Prompt an umgesetzten Ablauf anpassen. Sonntag 17:00, täglich 06:15, Europe/Berlin und stille unveränderte Zustände erhalten. Quellenexport, vollständige Kachelerfassung, Paketbindung, Linux-Release und echte öffentliche Prüfung ausdrücklich aufnehmen. Fehlendes NL/Kacheln als Fehler, gültiges DE erhalten, keine falschen Ersatzwochen. Monatsgewinnspiel-Aufgabe unverändert.
- [x] **8. Dokumentation/Belege speichern und pushen:** Laufbericht und aktuelle Runbooks auf denselben Code-/Contentrelease beziehen; separat erklären, dass spätere Dokumentationscommits keinen neuen Apprelease bedeuten. Final nur belegten Live-Erfolg nennen; verbleibende Grenzen und Cmd+Shift+R/Strg+Shift+R erwähnen.

## Selbstprüfung und Freigabe

Spec-Abdeckung: Quellen/Integrität → Tasks 1–2; gemeinsame Auswahl und offene Tabs → Task 3; Fehlerzustände und Abnahme → Task 4; Migration/Release/Automationen → Task 5. Alle fünf Review-Fokusfälle besitzen einen konkreten Testschritt. Keine Produktivänderung vor Planfreigabe und Auswahl der Ausführungsmethode. Andere offene Betreiberfragen aus `docs/OFFENE-FRAGEN.md` blockieren diese abgegrenzte Umsetzung nicht.
