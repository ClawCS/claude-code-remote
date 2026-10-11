# SEO, GEO und AEO: Umsetzungs- und öffentlicher Abnahmenachweis

Stand: 11.10.2026, 20:32 Europe/Berlin. Die freigegebenen Suchverbesserungen sind **live veröffentlicht und öffentlich geprüft**. Exakter App-Release `f0540ec67a10fb248ad87a8c8c8e2bb8997e541c`, Aktivierung 18:28:15 UTC / 20:28:15 Europe/Berlin, Linux-Build-ID `CjupFswvycpvVfG3-K2pQ`. Vorheriger geprüfter Release `2858e5256fd3ba1024b1a5f48d3b0cece234826e` bleibt als Rückrollziel erhalten. Die spätere reine Abschlussdokumentation benötigt keinen weiteren App-Release.

## Öffentliche Veröffentlichung und Abschlussprüfung

Niko genehmigte ausdrücklich die Entfernung ausschließlich der drei inaktiven Releases vom 8. Oktober `bce0e582b5b5137fc52f5a2d5d081c5c767c39b8`, `b0812f7592046b5fcc846ef166b08e710f4e0311`, `d93f932c69a097026624a56365bd58f2dba024a7`. Vor Entfernung: festes Host-/Pfadziel, keine aktiven Symlinks/Prozess-Arbeitsverzeichnisse oder verschachtelten Mounts, aktuelle und jüngste Rückfallversionen geprüft. Nur diese drei wurden entfernt; freier Platz stieg von rund 2,1 auf 6,5 GiB. Nach neuem Release und Entfernung ausschließlich des eigenen temporären Transportarchivs rund 4,9 GiB frei. Fehlgeschlagene Buildartefakte wurden für Diagnose erhalten.

GitHub-Synchronisation vor Arbeit per Fetch/Fast-forward: bereits aktuell, exakter Kandidat f0540ec. Quellarchiv über die Runbook-Positivliste, ohne private Arbeitsdaten, Secrets, Mac-Abhängigkeiten oder Mac-Builds. SHA-256 beim Transfer identisch: `a2ab729297e90d3917898dbcfa91a9e02ca9d9b5c387f12383cc61940ab6c69a`. Frischer Linux-Release als Benutzer jammers; `npm ci --include=dev --ignore-scripts`, ausschließlich genehmigter IMAP-Patch, Tests unter `NODE_ENV=test`, Build/Betrieb production ohne Testuhr. Keine installierten Sicherheitskonfigurationen geändert.

| Tatsächliche Schlussprüfung | Ergebnis |
| --- | --- |
| Frischer lokaler Webgate | 2.198/2.198 Tests, 116/116 Dateien bestanden, 32,54 s; native Bewerbungsqualifikation ausgeschlossen |
| Linux-Webgate | 2.163/2.163 Tests, 113/113 Dateien bestanden, 137,93 s; genau drei Chromiumdateien mit 35 Tests lokal statt auf Linux geprüft |
| Linux Releasegates | ESLint ohne Fehler, next typegen, TypeScript, 210 Originalangebote/Bilder und Produktionsbuild bestanden |
| Öffentlicher HTTP-Audit | 289 Seiten, 1.692 lokale Ressourcen, 5 unbekannte Pfade, 31 API-Verträge; null Fehler/Warnungen; externe Ziele nicht vollständig abgefragt |
| Unabhängiger SEO-GET-Audit | Alle 280 Sitemapziele, 65 Rezepte, 180 vollständige Lektionstexte/8 Wurzeln, 9 Weiterleitungen, 59 Fehlerpfade, 3 Utilities, 5 Schutz-/Konfigurationsprüfungen ohne Befund |
| CSS/Fonts | Fünf öffentliche Routen mit null Inline-CSS; unveränderlich cachebare gleichursprüngliche CSS-Dateien ohne Redirect. Vier WOFF2-GETs mit 200, korrektem Typ/Signatur, nichtleer |
| Gewinnspielbilder | 18 echte Original-/Optimierer-Bilddownloads, dekodiert, null Befunde |
| Inhalte bei echter Zeit | Normale und KW42-gezielte öffentliche content:check-Läufe: `status:ok`, `websiteVerified:true`, `deploymentVerified:true`, keine Warnungen/Fehler |
| Erreichbarkeit | IPv4/IPv6 HTTPS 200; HTTP 308 zu HTTPS; www 301 zum identischen Canonicalpfad samt Query; privates Manifest 404 |
| Betrieb | Dienst aktiv, richtiges current-Ziel, alle neun installierten Sicherheitskonfigurationshashes vor/nach identisch. Bewerbung/Mietbetrieb/Onlinezahlung weiterhin deaktiviert |

Die Umschaltung hatte eine automatische Rückrollabsicherung auf 2858e525 bei fehlender Bereitschaft. Der erste unmittelbare localhost-Versuch direkt beim Dienstneustart erhielt erwartbar connection-refused; begrenzter Retry bestätigte anschließend alle Bereitschaftskriterien. Kein Rollback nötig. Nach öffentlicher Abnahme Dienst und Dateirechte erneut geprüft: Quellcode root:root, nur Cache jammers:jammers 0750.

Öffentliche Browserabnahme bei 1440×900 und 390×844: korrektes filmisches Layout ohne horizontalen Überlauf, Desktop-/Mobilvideo tatsächlich geladen (readyState 4), Pause funktioniert, sechs Originalflaschen dekodiert, Fokus mit Sortennamen sichtbar. Native Untermenüs per Enter bedienbar; mobile Navigation → Akademie → Bier → neue Lektion 2 erfolgreich, Browser-zurück führt zu Lektion 1. Mobiles Mojito-Rezept mit Foto/Zutaten/Zubereitung und NL-Seite mit Besuchsantworten sichtbar. Browser-Screenshots bleiben beim privaten Prüfmaterial. Zwei anfängliche Testselektoren passten nicht zum nativen `summary`; nach DOM-Abgleich funktionierte der tatsächliche Summary-Enter-Test, keine Websiteänderung dafür. Lokale Reduced-Motion-/Quiz-/History-Gates sind getrennt vom begrenzten öffentlichen Browsertest dokumentiert.

Sonntags sind abgelaufene Wochenangebote korrekt nicht aktiv. Das KW42-Paar und alle 82 Originalkacheln sind öffentlich bereitgestellt und per tatsächlichem GET/Hash geprüft; die Angebote werden ausschließlich vom 12.–17.10. aktiv. Keine Produktionsuhr verändert. Regulärer NL-Handzettel stammt aus dem Agentur-/Betreiberordner Handzettel Holland (gerade KW42: De Maas Driehoek), nicht aus Canva. Maasduinen bleibt separat und ersetzt keine Woche.

### Build-Zwischenfehler transparent dokumentiert

Der erste Linux-Build und eine identische warme Wiederholung scheiterten mit 20 Next-Font-Importmap-Fehlern. Schriftdefinition und Lockfile waren gegenüber dem funktionierenden Release unverändert. Das Fehlermuster passt zum [bekannten Next-Font-URL-Parserproblem](https://github.com/vercel/next.js/issues/99114). Der [gepinnten Next-16.3.8-Implementierung](https://raw.githubusercontent.com/vercel/next.js/v16.3.8/crates/next-core/src/next_font/google/mod.rs) zufolge können Queryzeichen in einer extern gelieferten Font-URL die interne Importmap beschädigen. Der konkrete fehlgeschlagene Google-Antwortkörper wurde nicht erfasst; diese Ursache ist stark gestützt, nicht abschließend bewiesen.

Die installierte Next-Version hält Build-/Fetchzustand im persistenten Turbopack-Cache; tatsächlich lagen 100 MiB Cache vor. Ein frischer lesender Google-CSS-Abruf lieferte normale WOFF2-URLs. Nach unabhängiger Prüfung wurden ausschließlich die fehlgeschlagenen, nie aktiven Kandidaten-Builddateien beiseitegelegt. Ein sauberer Neubuild **desselben Codes** bestand: 21,6 s Kompilierung plus TypeScript/Seitenbuild. Keine Schriftmigration, Bibliotheksänderung, Mock-/Prüfungsumgehung oder Sicherheitsänderung. Das ist erfolgreiche Veröffentlichung, kein dauerhaft reparierter Upstream-Buildfehler. Eine separat geprüfte lokale Schriftquelle bleibt mögliche Folgearbeit.

## Abschließende Gegenprüfung und GitHub-Sicherung

Die unabhängige Gesamtprüfung von `ad83f26..376fc74` fand keine kritischen oder wichtigen Fehler. Der einzige kleine Befund am CSS-Prüfer wurde in `7e6a361a2b7a739419d68b431e45786eb67f053d` behoben; die einmalige, unabhängige Nachprüfung bestätigt „adressiert, keine neue Fehlfunktion“. Abschließender Webgate: **2.198 Tests / 116 Dateien bestanden**. Alle sechs lokalen Umsetzungsschritte sind fachlich-technisch im dokumentierten Umfang abgenommen; native Bewerbungsfunktionen und redaktionelle Kursfakten sind damit nicht qualifiziert.

`git push origin HEAD:codex/cinematic-production` war erfolgreich. Ein anschließendes `git ls-remote` bestätigte exakt `7e6a361a2b7a739419d68b431e45786eb67f053d` auf diesem Branch. Dieser Nachweis bezieht sich auf den geprüften Code-/Teststand; spätere reine Abschlussdokumentation ändert den Appstand nicht.

Historischer Vorabstand vor der gesonderten Bereinigungsfreigabe: Dienst2858e525 aktiv,95%Datenträgerbelegung/2,1GiB frei, öffentliche Startseite17:57:33UTC HTTPS200. Damals noch keine Serveränderung. Die anschließend konkret erteilte Freigabe, begrenzte Entfernung und vollständige Veröffentlichung sind im neuen Abschlussabschnitt oben belegt.

## Ausgangs- und Endstand

Ausgangspunkt der Suche-Umsetzung: `ad83f26961f22e3094ccbe478589323d58b31edd`. App-Endstand nach Tasks 1–5: `292d5e78870b58fa80413e238db6697e9b3d3acc`. Lokal geprüft gegen die frische Produktionsvorschau auf Port 3110 mit Build-ID `LW_A9iQYKA5yjYXfwg1jf`, echter Uhr, `RENTAL_MODE=disabled` und ohne `CINEMATIC_E2E`/`CINEMATIC_TEST_NOW`. Spätere Audit-/Test-/Dokumentänderungen ändern nicht den laufenden Appbuild.

Die frühere lesende Controllerprüfung bezog sich noch auf2858e525; sie wurde erst durch die oben dokumentierte tatsächliche f0540ec-Veröffentlichung abgelöst. Dev3000, fremde Screenshots, der vorhandene Bewerbungsaudit und private Quellen wurden bewahrt. Keine Konten, Automationen, Tracking-, Mail-, Upload-, Miet-, Zahlungs-, Lösch- oder Sicherheitsfunktionen geändert/aktiviert. Native Bewerbungsqualifikation bleibt offen.

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

Die öffentliche Abnahme und Linuxresultate sind im Abschlussabschnitt ergänzt. Messcheckliste und redaktionelle/externe Folgethemen bleiben offen; sie sind keine bereits nachgewiesenen Ranking-, Rich-Result- oder KI-Zitationsverbesserungen.
