# Projektaudit nach Veröffentlichung — 11.10.2026

## Ergebnis und Freigabegrenze

Geprüfter öffentlicher App-Stand: `8c14f8580ad7b09164548021512f132e4fa7b610`, am 10.10.2026 um 23:54:18 Europe/Berlin auf https://trinkgut-jammers.de aktiviert. Die Prüfung lief über den echten Tageswechsel zum 11. Oktober; keine Testuhr gegen Produktion. Nachweis der Veröffentlichung: [Releasebericht](2026-10-10-subpage-continuity-live.md).

**Keine kritische oder hohe ausnutzbare Schwachstelle im laufenden Webbetrieb nachgewiesen. Zwei mittlere und sechs niedrige Befunde bleiben offen.** Das ist ein begrenzter technischer Audit, kein Sicherheits-, Rechts- oder Barrierefreiheitszertifikat. Die Entwicklungspaket-Warnung ist beim Hersteller als hoch bewertet; die projektbezogene Einstufung unten unterscheidet ihre nachgewiesene Reichweite.

Nach Veröffentlichung wurden keine Produkt-, Test-, Abhängigkeits- oder Sicherheitskonfigurationskorrekturen aus diesem Audit vorgenommen. Nur Berichte und Abschlussdokumentation werden gespeichert. **Alle vorgeschlagenen Korrekturen warten auf Nikos Freigabe.** Bewerbungsupload, automatischer Versand und Löschung, verbindlicher Mietbetrieb sowie Zahlungen bleiben deaktiviert. E-Mail-Bewerbung über den Kontaktlink ist kein nachgewiesener serverseitiger Versand.

## Drei getrennte Rollen und Gegenprüfung

- **Sicherheit:** `/root/postrelease_security_audit` — OWASP-relevante Grenzen, Authentifizierung/Autorisierung, CSRF, SQL/XSS/Befehlsaufrufe, Uploadvorbereitung, Sicherheitsheader, Abhängigkeiten und begrenzte Geheimnissuche.
- **Funktion:** `/root/postrelease_function_audit` — öffentliche Seiten/Ressourcen/APIs, Weiterleitungen, Navigation, synthetische Formularzustände, Mobilansicht und grundlegende Barrierefreiheit.
- **Codequalität:** `/root/sitewide_task4_review` — Inventur, statische Struktur, Fehlerbehandlung, tote Pfade, Metadaten, Sitemap und begrenzte Performance-Messung.

Die Sicherheitsrolle bestätigte unabhängig die beiden SEO-Befunde. Die Codequalitätsrolle bestätigte die Shell-Aufrufstellen, fehlende öffentliche Einbindung des alten CLI und die Entwicklungspaket-Einstufung. Der Controller prüfte Quellzeilen, Live-Release/Serverzustand, echte Desktop-/Mobilvideowiedergabe und die Handzettelansicht im App-Browser zusätzlich. Die drei Berichte liegen lokal unter `.superpowers/subpage-continuity-2026-10-10/postrelease-audit/`; die maßgebliche freizugebende Liste ist nachfolgend vollständig zusammengeführt.

## Inventur und belegte Abdeckung

- Next.js 16.3.8 App Router, React 19.2.4, TypeScript strict, CSS Modules, Vitest, Playwright und axe. Server Node 22.23.3; Next hört hinter Caddy auf Loopback. Öffentlicher Stand, lokaler App-Commit und GitHub-App-Commit stimmen überein; spätere reine Berichtscommits verändern den laufenden App-Stand nicht.
- Quellinventur: 37 Kunden-Seitentemplates, 24 App-API-Handlerdateien; getrennte native Bewerbungsdienste, Laufzeit-/Betriebswerkzeuge und historische Extraktionsskripte. Prüfverträge/URLs sind keine Zählung sämtlicher interner Zustandskombinationen.
- Frischer öffentlicher HTTP-Audit: **117 Seiten, 3.055 lokale Ressourcen, 31 API-Methoden-/Zustandsverträge**, fünf erwartete unbekannte 404-Seiten, **0 Fehler / 0 Warnungen dieses HTTP-Prüfprogramms**. Das widerlegt nicht die separaten visuellen/Quellbefunde. 1.118 externe Links wurden nicht flächendeckend aufgerufen.
- Routeninventur: 121 kanonische/System-/Produktionsfixturepfade und **107 exakt passende 307-Weiterleitungen** ohne Abweichung. 15/15 tatsächliche Navigations-, Kontakt-, Tastatur- und Ohne-JavaScript-Fälle bestanden.
- **28 repräsentative Seiten-/Viewportkombinationen** bei 360, 390, 768 und 1440 Pixeln: keine gemeldeten axe-WCAG-A/AA-Verstöße, fehlenden img-alt-Attribute, horizontalen Überläufe oder Browser-`pageerror`. Das ist keine manuelle Screenreader-Vollprüfung und beweist nicht die redaktionelle Qualität jedes Alt-Textes.
- Fünf lokale synthetische Interaktions-/Fehlerfälle bestanden: Mietauswahl/Anfragevalidierung, Rechner/Finder, Akademie, abgefangene Bewerbungsformularzustände und ungültiger Mietstatus. Der erste Versuch scheiterte an beendetem lokalen Vorschauprozess; nach Neustart desselben Builds bestanden genau diese Fälle. Keine echten Eingaben oder Sendungen.
- Sicherheit: 32 begrenzte öffentliche Header-/Ablehnungsproben und 44/44 fokussierte reine/gemockte Tests bestanden. Upload-/KI-/Community-Schreibpfade und Miete bleiben geschlossen; fehlende Origin wird abgelehnt. Keine echten Admin-Anmeldungen oder Angriffs-/Lasttests.
- Begrenzte Geheimnissuche: 747 aktuelle versionierte Textdateien und 2.634 eindeutige erreichbare historische Textblobs aus 432 Commits, 39.342.498 historische Bytes; keine erkannten Schlüssel-/Tokenmuster. 13 große Blobs über 512 KiB ausgeschlossen. Binärdateien, nicht erreichbare Gitobjekte, private Quellen/Postfächer und echte lokale Geheimnisse wurden nicht geöffnet. Kein Beweis, dass niemals ein Geheimnis vorhanden war.
- Vor Release: lokal 1.660 Webtests, Linux-Webpartition 1.635 Tests/101 Dateien, Typprüfung, Lint ohne Fehler (21 bestehende Warnungen), 128 Originalangebote und Produktionsbuild bestanden. Die genaue Aufteilung mit vorherigen Fehlversuchen steht im [lokalen Abnahmebericht](2026-10-10-subpage-visual-continuity.md). Nicht als vollständiger nativer Gesamtprojekttest ausgegeben.

## Priorisierte Befundliste

| ID | Schwere | Bereich | Kurzfassung |
| --- | --- | --- | --- |
| F-01 | Mittel | Handzettelanzeige | Tatsächlicher App-Browser zeigt leere PDF-Einbettung ohne hilfreichen Fehlerzustand |
| S-01 | Mittel im Projekt; Hersteller hoch | Entwicklungspakete | Ein `braces`-DoS-Advisory zieht sich durch fünf Entwicklungspakete |
| S-02 | Niedrig | Historisches lokales CLI | Dateiname wird in zwei Shell-Befehle interpoliert |
| S-03 | Niedrig | Live-Sicherheitsheader | CSP erlaubt beliebige Inline-Skripte; keine XSS nachgewiesen |
| F-02 | Niedrig | Testabdeckung | Positiver PDF-Test liefert HTML statt echter PDF-Datei |
| Q-01 | Niedrig | Live-SEO | Kühlschrank-Metadaten versprechen eine stillgelegte Funktion |
| Q-02 | Niedrig | Live-SEO | Sitemap widerspricht noindex-/Canonical-Vorgaben |
| F-03 | Niedrig | Diagnose/Logging | Unbekannter statischer Kurs-Slug erzeugt interne Fehlermeldung trotz korrektem 404 |

### F-01 — Mittel: leere Handzettel-Einbettung im App-Browser

**Datei/Zeile:** `components/cinematic/FlyerViewer.tsx:106` (Ready-Zustand), `:108` (Timeout löschen), `:109` (ready setzen), `:192` (iframe-onLoad).

**Reproduktion:** Die öffentliche `/angebote` und ausdrücklich auch das DE-Handzettelmodal wurden im App-Browser noch vor Mitternacht während der echten KW41-Gültigkeit geöffnet. Das Modal blieb für die Beobachtung offen. Controller-Beobachtung um etwa 22:03 UTC im temporären App-Tab 39: Auch nach mehr als vier Minuten bleibt die eingebettete Fläche dunkel/leer; es erscheint kein Fehlerhinweis. Der Link „Handzettel als PDF öffnen“ bleibt sichtbar. Frisch nach Ablauf geladene Seiten hatten korrekt keinen Viewer; eine spätere Wiederholung benötigt ein tatsächlich gültiges Paket oder eine isolierte lokale Datumsfixture, keine verstellte Produktionszeit. Screenshot wurde als Browser-Toolausgabe in dieser Unterhaltung erfasst, nicht als erfundene lokale Datei angegeben. In früheren Prüfungen war auch lokal die App-Einbettung leer; normale sichtbare Chrome-Ansichten stellten DE und NL dar.

**Ist/Soll und Reichweite:** iframe-`load` beweist nur einen Ladevorgang, keine sichtbaren PDF-Seiten. Dennoch wird damit der Timeout beendet. Die lokale und öffentliche Originalauslieferung war 200, vollständig und hashgleich; **kein fehlendes/beschädigtes Wochenpaket und kein allgemeiner Browserausfall nachgewiesen**. Mittlere UX-Einstufung wegen unbrauchbarer eingebetteter Kernansicht in dieser Umgebung, begrenzt durch den vorhandenen Direktlink. Der genaue interne PDF-Decodergrund im App-Browser ist nicht abschließend bewiesen.

**Vorschlag nach Freigabe:** Native Browser-PDF-Unterstützung nicht zur Voraussetzung der eingebetteten Ansicht machen. Vollständige, originalgebundene Seitenvorschauen oder einen separat geprüften lokalen PDF-Renderer mit erkennbarer Seitennavigation verwenden; Original-PDF direkt erreichbar lassen. DE mit allen Seiten, NL exakt eine Seite. Gültigkeit/Originale/Preise unverändert. Chrome, App-Browser, Firefox und Safari/iOS mit echten Dateien und sichtbarem Inhalt prüfen. Weder Sicherheitsheader lockern noch bloß den Timeout verlängern.

### S-01 — Mittel: betroffenes Entwicklungspaket

**Datei/Zeile:** `package-lock.json:4241` (`braces@3.0.3`), `:4244` (`dev:true`); direkte Entwicklungseinbindung `package.json:67`.

**Reproduktion:** `npm audit --json --ignore-scripts` und `npm ls braces micromatch fast-glob eslint-config-next --all`. Die Kette lautet `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. Fünf hohe Paketeinträge beziehen sich auf **eine** Warnung, nicht fünf unabhängige Lücken. `npm audit --omit=dev --json --ignore-scripts` meldet null.

**Ist/Soll und Reichweite:** [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) beschreibt Stack-Erschöpfung bei tief verschachtelten Glob-Mustern; zum Prüfzeitpunkt keine gepatchte Version ausgewiesen. Herstellerbewertung hoch, projektbezogen mittel wegen nachgewiesener Entwicklungs-/Lintkette ohne belegten öffentlichen Eingabepfad. Null Produktionsadvisories beweist nicht, dass Entwicklungspakete auf der VM entfernt wurden. Kein DoS ausgeführt.

**Vorschlag nach Freigabe:** Kompatible korrigierte Kette bzw. gezielt geprüfte Begrenzung unsicherer Mustereingaben einführen, sobald belastbar möglich; Entwicklungstooling keine unkontrollierten Muster geben. Kein `npm audit fix --force`: der vorgeschlagene Downgrade auf Next-ESLint 14.2.35 wäre für dieses Next-16-Projekt keine saubere Reparatur.

### S-02 — Niedrig: Shell-Interpretation von Dateinamen im alten Extraktionsskript

**Datei/Zeile:** `scripts/extract-products.mjs:164` und `:249`.

**Reproduktion:** Isoliertes, folgenloses argv-Modell mit synthetischem Dateinamen `/synthetic/KW41-$(printf SECURITY_PROBE).pdf`; anstelle des Konverters wird nur ein Argumentdrucker aufgerufen. Ergebnis enthält `KW41-SECURITY_PROBE.pdf`: die Shell interpretiert den Dateinamen. Das eigentliche CLI wurde nicht gestartet.

**Ist/Soll und Reichweite:** `execSync` erhält einen Shell-String mit Dateiname. Doppelte Anführungszeichen verhindern Befehlsersetzung nicht. Betroffen ist ein historisches lokales CLI ohne gefundenen öffentlichen Aufrufer, nicht der aktive Wochenpaketprozess. Angriff setzt Kontrolle über lokale Eingabedateinamen und einen späteren Skriptaufruf voraus; bei Ausführung wären Operatorrechte betroffen.

**Vorschlag nach Freigabe:** Beide Aufrufe durch `execFileSync('pdftoppm', ['-png', '-r', '200', pdfPath, outputPrefix], ...)` ersetzen oder das bestätigtermaßen ungenutzte Werkzeug stilllegen. Metazeichen-Dateinamen mit folgenlosen Tests absichern. Keine echten Uploads als Test verwenden.

### S-03 — Niedrig: breite Inline-Skript-Freigabe in CSP

**Datei/Zeile:** `next.config.ts:58`.

**Reproduktion:** `curl -I https://trinkgut-jammers.de/` und `/bewerbung`; `script-src 'self' 'unsafe-inline'` ist ohne Nonce-/Hashbeschränkung vorhanden. Produktion lässt korrekt kein `unsafe-eval` zu.

**Ist/Soll und Reichweite:** Die CSP schützt bei einer späteren zusätzlichen HTML-Injection nicht vor beliebigem Inline-JavaScript. Keine reflektierte/gespeicherte/DOM-XSS in diesem Audit nachgewiesen; der überprüfte JSON-LD-Sink maskiert `<`. Daher Härtungsdefizit, nicht behaupteter erfolgreicher Angriff.

**Vorschlag nach Freigabe:** Separat eine mit Next kompatible Nonce-/Hash-Strategie entwerfen und Hydration, statische/dynamische Seiten, Widgets und PDF-Anzeige testen. Nicht blind `unsafe-inline` entfernen. [MDN script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) und [Next CSP-Dokumentation](https://nextjs.org/docs/app/guides/content-security-policy) beschreiben Regeln und Auswirkungen auf dynamisches Rendering. Bestehende Sicherheitskonfigurationssperre beachten; gesonderte Freigabe erforderlich.

### F-02 — Niedrig: PDF-Positivtest prüft nur HTML-Lifecycle

**Datei/Zeile:** `e2e/homepage-interactions.spec.ts:94`, insbesondere `:97` (`contentType: "text/html"`) und `:98` (HTML-Antwort).

**Reproduktion:** Den Test `[product-contract] flyer dialog is named, focus-trapped, lazy, and restores focus on Escape` in seiner markierten lokalen Testumgebung betrachten/ausführen: PDF-Anfrage wird als HTML beantwortet, danach `ready` geprüft.

**Ist/Soll und Reichweite:** Der Test ist für Fokus/Lazy-Loading nützlich, beweist aber keine PDF-Darstellung. In echtem headless Chromium wurden trotz HTTP200 `net::ERR_ABORTED` und nach acht Sekunden die vom Nutzer genannte Fehlermeldung reproduziert — auch ohne Request-Interception. [Playwright dokumentiert die Headless-PDF-Einschränkung](https://playwright.dev/docs/api/class-page#page-goto); das ist kein unabhängiger Nachweis eines Defekts in normalem Chrome.

**Vorschlag nach Freigabe:** Bestehenden Lifecycle-Test klar benennen und durch echte, gültige PDF-Bytes in PDF-fähigen sichtbaren Browsern bzw. Tests des gewählten verlässlichen Renderers ergänzen. Sichtbaren Inhalt, komplette Seiten und Direktlink prüfen. Mit F-01 gemeinsam bearbeiten.

### Q-01 — Niedrig: veraltetes Leistungsversprechen im Seitentitel

**Datei/Zeile:** `app/kuehlschrank/layout.tsx:4` und `:5`; widersprechender sichtbarer Inhalt `app/kuehlschrank/page.tsx:11`.

**Reproduktion:** GET `https://trinkgut-jammers.de/kuehlschrank`: Titel „Kühlschrank-Manager — Vorrat im Blick“, Beschreibung „Verwalte deinen Getränkevorrat ...“. Die Seite erklärt hingegen, dass der frühere Foto-Check nicht verfügbar ist.

**Ist/Soll und Reichweite:** Indexierbare Metadaten versprechen eine nicht angebotene Funktion. Kein nachgewiesener Rankingverlust. **Vorschlag nach Freigabe:** Titel/Beschreibung an den tatsächlichen Beratungs-/Stilllegungsinhalt anpassen und Metadatentest ergänzen. Keine Wiederaktivierung. [Google zu beschreibenden Titeln](https://developers.google.com/search/docs/appearance/title-link).

### Q-02 — Niedrig: widersprüchliche Sitemap-Signale

**Datei/Zeile:** `app/sitemap.ts:14` und `:27`; `app/handzettel/layout.tsx:6`; `app/gewinnspiel/archiv/page.tsx:11`; bisherige Testvorgabe `lib/__tests__/public-sitemap.test.ts:18`.

**Reproduktion:** `/sitemap.xml`, `/handzettel` und `/gewinnspiel/archiv` per GET vergleichen. Sitemap enthält beide URLs; Handzettel erklärt `/angebote` als Canonical, Archiv ist `noindex, follow`.

**Ist/Soll und Reichweite:** Sitemap sollte die beabsichtigten indexierbaren kanonischen Ziele unterstützen. Aufnahme hebt `noindex` nicht auf und ist kein nachgewiesenes Datenschutzleck. **Vorschlag nach Freigabe:** Archiv aus Sitemap entfernen; bei unverändert gewünschtem Canonical `/angebote` auch `/handzettel` dort weglassen. Route und Kundennavigation behalten; Test auf konsistente Signale umstellen. [Google zu konsistenten Canonical-/Sitemap-Angaben](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

### F-03 — Niedrig: interne Fehlermeldung bei korrekt abgelehntem unbekanntem Kurs

**Datei/Zeile:** `app/akademie/[slug]/layout.tsx:5` (statische Parameter), `:8` (`dynamicParams=false`). Diese Zeile identifiziert den Routingvertrag, nicht eine bewiesene fehlerhafte Zeile im Anwendungscode.

**Reproduktion:** Im unveränderten Produktionsbuild `curl http://127.0.0.1:3110/akademie/__audit_unknown__` ausführen und gleichzeitig Serverausgabe ansehen. Nach vorher leerer Ausgabe kommt HTTP404 plus `Error: Internal: NoFallbackError / at ignore-listed frames`. Öffentlicher Server meldete seit Aktivierung drei solche Zeilen; regulärer HTTP-Audit blieb ohne Statusfehler. Keine ENOENT/EACCES, kein Neustart.

**Ist/Soll und Reichweite:** Erwartete ungültige Slugs werden korrekt mit 404 abgewehrt, erzeugen aber irreführende interne Fehlerausgabe. Kein belegter Kunden-500 oder allgemeiner Ausfall. Grund im Framework-/Fallback-Handling ist noch nicht abschließend isoliert. **Vorschlag nach Freigabe:** Minimalreproduktion für installierte Next-Version und Routingkonfiguration erstellen, gezielte kompatible Framework-/Routingkorrektur prüfen. Nicht pauschal Logs unterdrücken oder ungültige Kurse zulassen.

## Performance und SEO: Messung statt pauschaler Bewertung

Einzelmessungen auf lokalem Mac, frisch geöffnetes headless Chromium, 390×844, Browsercache aus, ohne CPU-/Netzdrosselung, anfänglicher Viewport. Servercache nicht kontrolliert; kein RUM/CrUX/INP-Nachweis, keine vollständige Feld-CWV-Bewertung.

| Route | TTFB | beobachtetes LCP | kurzer CLS-Ausschnitt | übertragenes JavaScript |
| --- | ---: | ---: | ---: | ---: |
| `/` | 156,5 ms | 528 ms | 0,0488 | 164,9 KiB |
| `/cocktails` | 86,8 ms | 448 ms | 0,0009 | 165,8 KiB |
| `/akademie/whiskey` | 181,1 ms | 644 ms | 0,0004 | 463,4 KiB |

Startseitenfilm zusätzlich rund 2,21 MiB. Startseitenmessung liegt innerhalb der dokumentierten Einstiegslimits; keine fremden Ressourcen-Origins, Browserfehler oder Anfangsüberläufe in diesen drei Stichproben. Das ist keine Garantie für langsame Endgeräte.

Nachgelagerte Optimierungsvorschläge, **keine weiteren bewiesenen Funktionsfehler**:

- `app/akademie/[slug]/page.tsx:9` lädt den gesamten Kurskatalog in die Clientseite. Nur gewählten Kurs serverseitig übergeben, Quiz clientseitig belassen; zuvor auf langsamem Mobilprofil messen.
- `next.config.ts:13` und globale CSS-Imports: große gemeinsame Inline-HTML/CSS-Mengen separat vergleichen; nicht ungeprüft Inlining abschalten. Gemessene dekodierte HTML-Dokumente etwa 705–838 kB.
- `components/cinematic/MotionIsland.tsx:124`: ungenutzter alter Signature-Rail-/Pin-Pfad, kein Produktionsimport gefunden. Vor Entfernung beabsichtigte Wiederverwendung klären.
- SEO-Strategie für `/merkzettel` bewusst festlegen; generische Metadaten/fehlendes Canonical allein sind noch kein bewiesener Indexierungsfehler.
- `README.md:5` enthält historischen Offline-Stand; bei späterer Dokumentationspflege eindeutig als historisch kennzeichnen. Aktuelle AGENTS-Releaseangabe ist korrekt.
- Kein eigener `error.tsx`/`global-error.tsx` gefunden; geeigneten Fehlerzustand erst nach lokal kontrolliertem Ausfalltest entwerfen.
- Serverdateisystem am Abschlusszeitpunkt 90 % belegt, etwa 3,9 GiB frei. Kapazität und alte nicht mehr benötigte Releases vor weiterer Veröffentlichung prüfen; nichts pauschal gelöscht, aktuelles Release und Rückfallrelease bleiben erhalten.

## Live-Medien, Handzettel und tatsächlicher Tageswechsel

Beide KW41-Originale wurden vor Mitternacht über den öffentlichen Server vollständig geladen und gegen SHA-256 geprüft: DE 18 Seiten, NL eine vollständige Seite. 128 Angebotsausschnitte unverändert gebunden. Öffentlicher Contentcheck ohne Fehler/Warnungen; Bericht `audit/content-runs/2026-10-10T21-55-57-771Z-check-e26ce15c.json`. Das ist Dateiauslieferung, nicht pauschale Bestätigung aller nativen PDF-Einbettungen.

Um **00:00:14 Europe/Berlin am 11.10.2026** lieferten beide Auswahl-APIs nach belegtem Ende null aktive Handzettel/Angebote; Startseite, NL, Angebote, Handzettel und Sortiment entfernten die abgelaufenen Daten. Erwarteter Ablauf, keine Ersatzwoche oder verlängerten Preise. Neues Wochenpaket bleibt Gegenstand des regulären Sonntagsprozesses.

Tatsächlicher sichtbarer Chrome: Desktop-v4-Film lief von 6,97 auf 14,50 Sekunden, Mobil-v4 bei 390 Pixeln von 0,14 auf 8,01 Sekunden; echte Pausentasten stoppten. Reduced-motion-Kontext lud zunächst keinen MP4, erst explizites Abspielen; Pause bestanden. Reine Seek-Tests wurden nicht als Zeitfortschritt ausgegeben.

IPv4 und IPv6 lieferten öffentlich geprüft HTTPS200 mit normaler Zertifikatsprüfung. Release-Symlink unverändert, Dienst aktiv, automatische Neustarts null. Drei `NoFallbackError`-Meldungen werden oben ausdrücklich geführt; Serverausgabe ist daher nicht als vollständig fehlerfrei bezeichnet.

## Was ausdrücklich nicht fertig oder bewiesen ist

- **Bewerbungsupload/automatischer Versand/Löschung:** weiter deaktiviert. Native Parser-/Raster-/Rekonstruktions-/Scannerqualifikation, sichere Linux-Abschottung, Admin-/MFA-/Wiederherstellungsabnahme, SMTP/IMAP-/Postfachkopien-/Restore-Integration und begrenzter synthetischer Praxistest nicht erfolgreich abgeschlossen. Fehlende IONOS-Wiederherstellungs-/Archivierungsangaben bleiben offen. Die bisherige Untersagung weiterer Sicherheitskonfiguration bleibt bestehen. 44 bestandene Web-Sicherheitstests ersetzen diese Betriebsabnahme nicht.
- **Newsletter, echte Bestellungen, Zahlungen und Belege:** kein neuer Betriebs-/Versandnachweis; nicht aktiviert oder heimlich getestet.
- Keine flächendeckenden echten Transaktionen, Mailbox-/Kundendatenzugriffe, Geheimniswerte, Last-/DoS-/Bruteforceversuche, externe Accountänderungen oder Sicherheitskonfigurationsänderungen.
- Keine vollständige Safari/iOS-/Firefox-/Screenreaderabnahme, kein unabhängiges Rechtsgutachten, keine Aussage zur Echtheit aller historischen Werbemotive. Quellen-/Freigaberegeln wurden unverändert erhalten.
- Entwicklungsfixture hatte trotz zwei funktionaler Tests eine dokumentierte Next-Routerstartwarnung; 21 bestehende Lintwarnungen nicht wegdefiniert. Native Testfehler/fehlende Werkzeuge sind nicht als bestanden verbucht.

## Empfohlene Freigabereihenfolge

1. **F-01/F-02 gemeinsam:** verlässliche vollständige Handzettelansicht samt echter Browsertests.
2. **S-02, Q-01, Q-02:** begrenzte lokale CLI-/Metadaten-/Sitemapkorrekturen mit Regressionstests.
3. **S-01:** kompatible Entwicklungspaket-Maßnahme nach tatsächlich verfügbarer Lösung; kein erzwungener Versionsbruch.
4. **F-03:** minimale Routing-/Framework-Reproduktion und gezielte Diagnosekorrektur.
5. **S-03 und Performance:** eigener geprüft begrenzter Härtungs-/Optimierungsschritt, Sicherheitsfreigabe ausdrücklich klären.

Dies ist eine Empfehlung, keine vorweggenommene Umsetzungserlaubnis. Der veröffentlichte Design-/Kontaktstand bleibt während der Entscheidung unverändert.
