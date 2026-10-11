# SEO, GEO und AEO: lokaler Umsetzungs- und Abnahmenachweis

Stand: 11.10.2026. Die freigegebenen Suchverbesserungen sind lokal umgesetzt. Dieser Bericht ist **kein Nachweis eines öffentlichen Releases**. Die Veröffentlichung ist vom Betreiber nach bestandenen Prüfungen beauftragt; unabhängige Gesamtschlussprüfung, Push/Remote-SHA, frischer Linux-Webbuild und echte öffentliche Abnahme bleiben getrennte Controller-Gates. Die separat angefragte Entfernung dreier alter Releases ist noch nicht freigegeben. Rund 2,1 GiB freier Serverplatz reichen nicht als Nachweis, dass ein neuer Release sicher gebaut werden kann; nichts wurde dafür gelöscht.

## Ausgangs- und Endstand

Ausgangspunkt der Suche-Umsetzung: `ad83f26961f22e3094ccbe478589323d58b31edd`. App-Endstand nach Tasks 1–5: `292d5e78870b58fa80413e238db6697e9b3d3acc`. Lokal geprüft gegen die frische Produktionsvorschau auf Port 3110 mit Build-ID `LW_A9iQYKA5yjYXfwg1jf`, echter Uhr, `RENTAL_MODE=disabled` und ohne `CINEMATIC_E2E`/`CINEMATIC_TEST_NOW`. Spätere Audit-/Test-/Dokumentänderungen ändern nicht den laufenden Appbuild.

Laut gesonderter lesender Controllerprüfung läuft öffentlich weiterhin App-Release `2858e5256fd3ba1024b1a5f48d3b0cece234826e`; neun installierte Konfigurationshashes sind unverändert. Diese Serverauskunft ist kein öffentlicher Nachweis für die neuen Suchänderungen. Dev3000, fremde Screenshots, der vorhandene Bewerbungsaudit und private Quellen wurden bewahrt. Keine Konten, Automationen, Tracking-, Mail-, Upload-, Miet-, Zahlungs-, Lösch- oder Sicherheitsfunktionen geändert/aktiviert. Native Bewerbungsqualifikation bleibt offen.

## Umgesetzt

- Einheitliche absolute HTTPS-Canonicals und passende Dokument-/OpenGraph-Titel, Beschreibungen und URLs. Keine geerbte Startseitenidentität bei Detailseiten. `/handzettel` bleibt bewusst eine Ansicht mit Canonical `/angebote`; Merkzettel und Gewinnspielarchiv bleiben `noindex, follow`, Bewerbung/Verwaltung geschützt. Sitemap ohne diese Utility-/Duplikatziele; echte DE/NL-Wechselverweise nur für Startseite und `/nl`. Bekannte stillgelegte Produktbeispiele leiten dauerhaft 308 zur bereits zugeordneten Warengruppe, unbekannte bleiben 404. Finder verspricht keinen aktuellen Bestand, Vermietung keine unbelegten Bierzelte.
- Alle 65 vorhandenen Rezepte erhalten Recipe und echte BreadcrumbList aus vorhandenen Zutaten/Zubereitung. Nur die 55 individuell freigegebenen lokalen Fotos erscheinen im Recipe-Bildfeld; bei zehn Rezepten ohne freigegebenes Foto fehlt es. Keine erfundenen Bewertungen, Autoren, Zeiten, Nährwerte oder Prüfdatumsangaben. Bestehender sicherer JSON-LD-Serializer auch für feindliche Texte getestet. LocalBusiness um vorhandenes belegtes Marktbild und offizielles Trinkgut-Marktprofil ergänzt, ohne neue Koordinaten/Bewertungen.
- Kleine DE-/NL-Antwortbereiche für Besuch, Kontakt, Eigenmarken und Leihartikel aus bestätigten Fakten. Persönliche Mietbestätigung, Dreier-Werktagsblöcke und Abholung bleiben ausdrücklich; keine Buchungs-/Liefer-/Bestandszusage. Alle sechs NL-Eigenmarkenlinks führen zu vorhandenen stabilen Ankern. Keine FAQ-Rich-Result-Zusage.
- Acht Akademiekurswurzeln behalten Lektion 1; weitere 172 Lektionen besitzen eigene serverlesbare URLs und Metadaten. Echte Links statt ausschließlicher Clientauswahl. Quizzes, 70%-Grenze, Wiederholen, abgeschlossene Null-Punkte-Lektionen und kursbezogener Fortschritt bleiben; Navigations-/History-/Reset-Fälle geprüft. Alte `/lektion/1`-Form ist 308 zur Kurswurzel, ungültige IDs/Unbekannte 404. Die fachlichen Texte wurden dabei **nicht** redaktionell verifiziert.
- Drei quellengebundene KW42-Zusammenfassungen als sofort sichtbare Beschreibungsliste: Ahrtal Quelle, DE Red Bull und NL Coca-Cola/Fanta/Sprite. Jeweils Preis, Gebinde, Pfand und Grundpreis als geprüfter Originaltext, ohne Berechnung/numerisches Offer-Schema. Originalbilder und vollständige Bedingungen/Warnungen bleiben. Optionales Feld strikt validiert und in der Manifestprüfsumme; API v2 enthält es, v1 behält die alte Projektion. Alle 128 historischen Datensätze sind roh bytegleich; 82 KW42-Kachelpfade/-bytes/-hashes unverändert. Insgesamt 210 Angebote, genau drei mit Zusammenfassung.
- NL Red Bull bleibt ohne Pilotzusammenfassung. Der Originaldruck „0,25 ml Blik“ ist nun unverändert transkribiert und der widersprüchliche Einheitenwert ausdrücklich zur Klärung im Markt markiert. Keine stillschweigende Umrechnung oder Behauptung, das Original sei rechnerisch richtig.

### Korrektur des Auditpunkts C01

Der Ausgangsreport war zu pauschal: Bei allen 82 KW42-Angeboten bestanden bereits Preis-/Gebinde-/Pfandangaben als `conditions`-Text in nativen `details`. Der Pilot schafft **klar gegliederte, sofort sichtbare Zusammenfassungen**, nicht die ersten HTML-Preisangaben. Bestehende Redaktion und Originalbedingungen werden weiterverwendet. Das ist keine WWS-, Bestands- oder Preisnormalisierung.

## Unabhängige lokale Suchabnahme

Wiederholbarer rein lesender Check: `npx tsx scripts/audit-search-readiness.ts --url http://127.0.0.1:3110`. Er rekonstruiert ausschließlich erlaubte literale React-Streamingabschlüsse mit dem vorhandenen Parser; führt Antwortskripte nicht aus und verwirft Skript-/Template-/hidden-/aria-hidden-Inhalte. Quellenvergleich statt bloßer Stringsuche in RSC-Daten.

| Prüfung | Tatsächlicher Umfang / Ergebnis |
| --- | --- |
| Sitemap | Alle 280 eindeutigen Ziele 200, genau ein eigenes Canonical, kein Meta-/Header-noindex |
| Rezepte | Alle 65: JSON-LD genau aus Quelle; vollständige sichtbare Zutaten, Zubereitung, Tipp; nur freigegebene Fotos und tatsächlich gerenderte Bilder |
| Akademie | Alle 180 ausgewählten Lektionstexte vollständig und quellgleich im initialen gerenderten HTML; acht Wurzeln plus 172 neue Ziele |
| Alias-/Fehlergrenzen | Acht Lektion-1-Aliase plus ein bekannter Produktalias: exakte 308-Ziele; 59 ungültige/unbekannte Pfade echte 404 |
| Utilities/Schutz | Drei Utility-Canonical-/Indexregeln; drei geschützte noindex-Header und beide deaktivierten Betriebs-Konfigurationen bestätigt |
| Unabhängiger Controller-HTTP-Audit | 289 Seiten, 1.692 Ressourcen, 31 API-Verträge und fünf unbekannte Routen: null Fehler/Warnungen; lokaler Preview, nicht öffentliche Domain |

Der neue Harness wurde test-first eingeführt: drei Tests zuerst rot, danach grün. Zusätzlich wurden zwei falsche Erstbefunde nach Ursache korrigiert und mit roten Regressionen bewiesen: Root-Canonical ohne abschließenden Slash ist dieselbe Origin; Inline-Textknoten dürfen vor Satzzeichen keine erfundenen Leerzeichen erhalten. Der verworfene Erstlauf bleibt privat erhalten, keine Websiteänderung oder Testabschwächung dafür. Neues TypeScript-Map-Typinferenzproblem wurde vor dem abschließenden sauberen Typecheck behoben.

## Wocheninhalt und Browserabnahme

`content:check -- --url http://127.0.0.1:3110` sowie separat `content:check -- --week 2026-10-12 --url http://127.0.0.1:3110` liefen bei echter Sonntagszeit ohne `--now`. Beide: keine Fehler, `websiteVerified=true`, `deploymentVerified=false`. Der CLI-Status `degraded` bezeichnet hier die erwartete Warnung, dass nur eine lokale Vorschau statt der bestätigten Produktionsdomain geprüft wurde. Die normale Sonntagsauswahl ist leer; die gezielte Prüfung bestätigt die zukünftigen Original-/Cover-/Kachelbindungen, ohne Montagspreise zu aktivieren. `offers:check` anschließend seriell: alle 210 Originalangebote und Bilder geprüft. Kein neuer identischer Import.

Für die tatsächliche KW42-Startansicht wurde ausschließlich ein eigener klar markierter Entwicklungsfixture aus dem committed App-Endstand auf Port 3112 benutzt, mit eigener `.next-dev` und isoliertem Wochenroot. Server- und Browser-Testuhr dort: 12.10.2026 12:00 UTC. Kein Override gegen Produktion/öffentlich/Dev3000; fremder früherer KW42-Runtime unverändert.

Tatsächliche Chromium-Abnahme bei 390×844 und 1440×900: `/`, `/nl`, `/angebote`, `/handzettel` jeweils 200, zwei vollständig dekodierte `object-fit: contain`-Cover, gültige native PDF-Links, öffnender benannter Dialog mit Fokus, tatsächlichem iframe-Originalziel und Escape-Schließen, kein horizontaler Überlauf. Sortiment zeigt alle 82 aktiven Karten und exakt drei Zusammenfassungen; alle vier Texte pro Pilot, vollständige aufklappbare Originalbedingungen, Koffein-/Variantenangaben, NL-Red-Bull-Warnung ohne Zusammenfassung und die passende Warengruppe geprüft. Alle drei Content-APIs, versionsabhängiger no-store/Vary-Vertrag, unveränderte v1-Projektion und Legacy-DE-GET stimmen. Original-PDFs per GET: DE 6.829.343 Bytes/10 Seiten, NL 3.113.358 Bytes/1 Seite, jeweils exakter gebundener SHA-256. Acht Ganzseiten- und sechs Pilotkartenaufnahmen bleiben privat; mobile Pilottexte und Desktop-DE/NL-Paar visuell geprüft, unverzerrt und lesbar.

Der Standard-Playwright-Headless-Shell lieferte beim echten DE-PDF zwar HTTP 200/application-pdf, aber keinen iframe-load; nach Timeout zeigte die Website ihren bestehenden Ausweichlink. Diese erste strengere ready-Assertion gilt nicht als bestandener Nachweis. Genau eine gezielte Gegenprobe mit installiertem echtem Chromium (`channel: chromium`, neues Headless) am identischen Fixture/Original: `ready`, vier Frames, echte 200-PDF-Antwort und sichtbar gerenderter zehnseitiger PDF-Viewer. Das ist die maßgebliche tatsächliche PDF-Render-Evidenz, keine HTML-Ersatzantwort oder Mock. Die Matrix prüft daneben die vorhandenen App-Kriterien Dialog/Fokus/Originalziel/native Links. Keine App-Regression festgestellt oder wegkorrigiert. Ein früher privater Harnesslauf scheiterte an einem falschen String statt RegExp in `assert.match`; korrigiert, Fehlerlog erhalten. Dev-Workspace-root- und LCP-loading-Hinweise sind Entwicklungswarnungen, keine Feldmessung. Eigener Testserver nach Abnahme beendet; Dev3000 und Produktionspreview3110 unverändert.

## Gemessene CSS-Auslieferung

Task 5 verglich zwei frische Produktionsbuilds mit unverändertem CSS-Inhalt/-Reihenfolge, Rootlayout, JS, Medien und CSP. Variante A: `inlineCss=true`, B: externe gleichursprüngliche unveränderlich cachebare CSS-Dateien. B bleibt übernommen; kein Provider-/Video-/Cache-Umbau. Fünf Routen × zwei Viewports (390×844, 1440×900), je drei kalte Inkognito-Kontexte plus Wiederholungsaufruf: 40 Beobachtungen pro Variante. Keine Drosselung, Optimierercache nicht gelöscht. Alle tatsächlich beobachteten CSS-Dateien einschließlich spekulativ geladener Route-CSS gezählt.

| Route | HTML roh A → B, Bytes | Erste HTML+CSS-Gzipkörper-Ersparnis | Wiederholungstransfer-Ersparnis inkl. Header |
| --- | ---: | ---: | ---: |
| `/` | 874.390 → 182.754 | 50,1 % | 77,6 % |
| `/nl` | 787.079 → 98.162 | 55,2 % | 84,6 % |
| `/angebote` | 736.538 → 47.568 | 59,7 % | 90,7 % |
| `/produkte` | 731.218 → 42.223 | 59,9 % | 91,0 % |
| `/gewinnspiel` | 806.642 → 117.647 | 57,1 % | 86,4 % |

Inline-CSS sinkt von 224.852–226.292 Bytes auf null. B-CSS-GETs: 200, `text/css`, immutable; Wiederholung CSS-Transfer null. CSS-Inhalt/-Reihenfolge exakt gleich nach ausschließlich dem Auflösen von 20 Font-URL-Referenzen. Zehn A/B-Ganzseitenscreenshots: gleiche Maße, null abweichende RGB-Kanäle. 30 zusätzliche Browserchecks: zehn Ganzseiten-axe-Scans ohne Verletzungen, Navigation/Zurück, Skiplink/Fokus und zehn Ohne-JS-Ansichten; keine erforderlichen Ressourcen-/Konsolen-/Seitenfehler. 35 explizite Chromium-Unitfälle grün.

Lokaler ungedrosselter Cold-Median-LCP: mobil A 40–64 ms, B 36–60 ms; Desktop A 48–80 ms, B 48–92 ms. Startseite Desktop +12 ms bleibt sichtbar berichtet. Kein vorab definierter Regressionsschwellwert ausgelöst. Beobachtete CLS-Summen nicht regressiert. Dies sind kurze Laborbeobachtungen, **keine Feld-CWV**, keine vollständige CWV-Sessionfensterberechnung, keine Ranking-/KI-Zitatgarantie und kein allgemeiner Langsamnetz-/Mobilgerätenachweis. Roh-/Gzip-/Header-/Transferzahlen sind getrennt, keine Gleichsetzung von Byteeinsparung und Geschwindigkeit.

JS-Erstübertragungen und Video unverändert. Beobachtete Startseiten-Videochunks bis zum Messende: mobil 2.316.048, Desktop 4.785.365 Bytes; das ist kein neuer Gesamtvideo- oder Speednachweis. Video-/Provider-/Lazy-Loading-Optimierung, weitere CSS-Aufteilung und reale langsame Netztests bleiben gesondert zu messende Kandidaten, nicht „erledigt“.

## Gates, frühere Fehler und Grenzen

Task 5: zwei frische Produktionsbuilds bestanden; vollständiger Webgate 2.192 Tests/114 Dateien; typegen/tsc grün; Lint null Fehler, 21 bestehende Warnungen in unveränderten Bereichen. Task 6 mit neuem Audit-Test: vollständiger Webgate **2.195 Tests/115 Dateien** in 29,07 s; TypeScript und fokussierter ESLint ohne Diagnosen. Kein neuer Appcode nach dem frischen B-Build, daher kein verschwenderischer identischer Neubuild. Die drei erforderlichen Chromium-Unitdateien liefen im vollständigen Gate mit. Native Services und private Scratchduplikate ausdrücklich ausgeschlossen, keine weitere stille Ausschlussliste.

Die Baseline mit ungefiltertem `npm test` wurde vor Änderungen wegen nativer Versions-/Fixturefehler und privater Runtime-Testduplikate abgebrochen. Das ist **kein Gesamtprojekt-Pass**. Weitere dokumentierte Zwischenfehler: alte relative Metadata-/Routen-Census-Assertions; ein bewusst streng beibehaltener Kontakt-Textbaseline, dessen neu hinzugefügte, separat geprüfte Antwortsektion gezielt ausgeklammert wurde; eine echte Akademie-Wiederholen-Transition-Race, mit rotem Browsertest korrigiert. Fünf Homepage-Fixtures hatten ihren Wochenloader, nicht aber den Zusatzloader isoliert: realer Check-Lock im fremden Root konnte sie unterdrücken. Das wurde mit zwei ausschließlich temporären Roots nachgewiesen und in Task 4 durch explizites gleiches Root-Injection regressionsgeprüft, ohne Produktionsschutz aufzuheben. Angebots-/Manifesttransaktionen und Tests bleiben seriell.

Alte A-/A-rejected-Messungen und eine neue verworfene A-Prefetch-Matrix gelten nicht als Baseline. Nur eng nachgewiesene same-origin-200-`text/x-component`-RSC-Prefetch-Abbrüche (`ERR_ABORTED`, Router-Prefetch) wurden separat als erwartete Next-Spekulationsabbrüche gezählt; andere Fehler bleiben ablehnend. Zwei falsche Browser-Harness-Headerannahmen wurden sichtbar korrigiert. Keine installierten neuen Abhängigkeiten.

Der kleine Task-5-Reviewpunkt zum CSS-Prüfer ist lokal korrigiert: Der CSS-Fetch verwendet jetzt `redirect: "error"`, sodass weder gleichursprüngliche noch externe Redirectziele stillschweigend als bestandene Stylesheet-Auslieferung gelten. Die reale lokale HTTP-Regression in `lib/__tests__/stylesheet-delivery-audit.test.ts` bewies vor der Änderung zwei falsche Exit-0-Ergebnisse bei 302-Redirects; der direkte CSS-Kontrollfall bestand. Danach: drei Tests grün, Redirectfälle Exit 1 und null Folgeabrufe der Redirectziele. Vollständiger Webgate nach dieser eng begrenzten Korrektur: 2.198 Tests/116 Dateien grün in 24,87 s; fokussierter ESLint und `tsc --noEmit` ohne Diagnosen. Der geänderte Prüfer bestand alle fünf Routen gegen denselben unveränderten B-Build `LW_A9iQYKA5yjYXfwg1jf` auf 3110. Zunächst fehlte dort der Listener (ECONNREFUSED); nach freiem Port-/CWD-/Build-ID-Check wurde ausschließlich dieser bestehende Produktionspreview mit ausdrücklicher Controllerfreigabe neu gestartet, echter Uhr, `RENTAL_MODE=disabled` und ohne Testflags. Ursache des fehlenden Listeners unbestätigt; keine Appregression daraus behauptet. Dev3000 unverändert. Kein neuer Build, A/B- oder vollständiger Browserlauf. Die gezielte Nachprüfung und alle Release-/öffentlichen Gates bleiben beim Controller; dies ist kein Abschlussnachweis der Gesamtschlussprüfung oder Veröffentlichung.

## Redaktion und externe Zugänge

Search Console, Bing-Webmaster/GBP-Messzugang und verifizierte Sichtbarkeits-/Crawlerdaten sind **ausstehend**. Keine Konto-/Profiländerung, Anmeldungseinrichtung, Sitemapübermittlung oder Messautomation erfolgt. Maschinenlesbarkeit/Schema ist keine Bestätigung einer Suchmaschinenaufnahme oder Rich-Result-Eignung.

Die private Akademie-Nachprüfung hält eng begrenzte offene Wein-Lektion-1-Befunde zu Rebsorten/Kreuzungen, Mindestalkohol/Quiz, Oechsle-Umrechnung und Süßebezeichnungen sowie einen begrenzten Schadensscan „Wein und Gesundheit“ fest. Korrekturvorschläge wurden nicht umgesetzt. Kein gesamter Wein-/Akademiekurs oder alle Gesundheits-/Rechtsbehauptungen sind fachgeprüft. Keine erfundene Autorenqualifikation oder redaktionelles Prüfdatum ergänzt. Breitere fachliche Prüfung und Betreiberentscheidung zu konkreten Korrekturen bleiben eigene Folgearbeit; private Vollbelege bleiben privat.

## Messcheckliste ohne neue Automation

Zeitpunkte relativ zum **tatsächlich öffentlich abgenommenen** Release, nicht zu diesem lokalen Bericht:

- [ ] Tag 7: Mit freigegebenem lesendem Zugang Sitemapabruf/-annahme, Indexierungs-/Canonical-Ausschlüsse, Crawl-/404-/308-Befunde und sichtbare Schemafehler prüfen. Öffentliches Release/Datum notieren; Performance mit gleichem Gerät/Netz/Cacheprotokoll nachmessen. Fehlender Zugang bleibt „nicht gemessen“.
- [ ] Tag 28: Suchimpressionen/Klicks/CTR für Rezepte, Akademie, lokale Besuchsfragen und NL getrennt mit gleich langem Vorzeitraum vergleichen; Position nur mit Quelle/Zeitraum/Volumen. Neue URLs haben keinen erfundenen historischen Null-Baseline. Saisonalität, Angebotswochen und andere Änderungen nennen; Schema-Ausspielung nicht voraussetzen. GBP-Aufrufe/Interaktionen nur aus echtem freigegebenem Export.
- [ ] Tag 90: Stabile Indexierung, relevante Query-/Landingpagegruppen und messbare Besuchsaktionen aus vorhandenen zulässigen Daten bewerten. Feld-CWV nur bei verfügbarer ausreichender Quelle/Abdeckung, ansonsten begrenzte Labordaten. Reproduzierbar dokumentierte KI-Antwort-/Zitatproben als Einzelfälle, nicht als repräsentativer Sichtbarkeitsindex. Editorial-/Performancefolgearbeit nach Wirkung priorisieren; keine kausale Rankingzusage aus Vorher/Nachher ableiten.

Öffentliche Abnahme, Remote-SHA und Linuxresultate müssen nach tatsächlichem Release ergänzt werden. Bis dahin lautet der Status: lokal geprüfte Umsetzung, öffentlich weiterhin vorheriger Release.
