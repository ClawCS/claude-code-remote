# SEO / GEO / AEO: Abschluss der Website-Restpunkte

Auftrag: freigegebener Abschluss des Reports vom 11.10.2026. Quellbasis `1abb8448d5ab5a23c03217a9ed4322ba017e489b`. Dieser Bericht trennt umgesetzte Website-Arbeit, tatsächliche Veröffentlichung, externe Dienste und spätere Wirkungsdaten. Er ist keine Ranking-, Rechts-, Experten- oder Feld-CWV-Zertifizierung.

## Umgesetzte Restpunkte

| Paket | Ergebnis |
| --- | --- |
| Angebote / C01 | Alle 82 KW42-Originalangebote (70 DE + 12 NL) mit geprüften Preis-, Gebinde-, Pfand- und Grundpreistexten. Varianten und App-/Mengenbedingungen sowie Originalwarnungen erhalten. Die 128 historischen Angebote und alle 210 Kachelbytes bleiben unverändert. Künftige reguläre Wochen benötigen vollständige Zusammenfassungen. |
| Wissen / C02–C03 | Alle 180 Lektionen, 65 Rezepte und 620 Quiz-/Prüfungsfragen gelesen. Fehlerhafte Aussagen und Lösungsschlüssel korrigiert; pro Inhalt erreichbare Quellen-/Standansicht mit tatsächlichem Prüfdatum und begrenztem Prüfumfang. Genau 245 Inhalts-IDs, 268 Quellenrecords und 263 unterschiedliche Primärquellen-URLs; der Build verwirft fehlende oder zusätzliche IDs. |
| Karriere / T08 | Öffentliche Übersicht und drei eigene Stellenziele mit vollständigen Plakaten und E-Mail-Bewerbung an info@trinkgut-jammers.de. Geschützter Bewerbungsbereich und Uploads bleiben getrennt und deaktiviert. JobPosting bewusst zurückgehalten: „ab sofort“ ist Arbeitsbeginn, kein belegtes ursprüngliches Anzeigendatum; vollständige Tätigkeiten/Anforderungen fehlen ebenfalls. |
| Metadaten | Tatsächliche Inhaltsänderungsdaten statt Build-Frische. Quellenabgleich bestimmt Akademie-/Rezeptdaten; bestätigte öffentliche Seitenänderungen und wöchentliche Änderungen separat geführt. Die vorhandene technische Bereinigung von Canonicals, noindex, Rezept-/Breadcrumbdaten, DE/NL-Zielen und Alt-Weiterleitungen bleibt erhalten. |
| Performance / P02 | Mobilfilm vollständig auf 980.962 Bytes reduziert (vorher 2.316.048); 15 Sekunden und 360 Frames erhalten. Desktopfilm/Poster bytegleich. Eng begrenzte, hashversionierte Medien-/Fontcaches; vier identische lokale WOFF2-Dateien, keine Google-Font-Buildabhängigkeit. Shoppingprovider nur auf tatsächlichen Verbraucherouten, geschlossene Drawers zurückgestellt. |
| Speicherrobustheit | In der unabhängigen Prüfung reproduzierter Auswahlverlust bei blockiertem Browserstorage behoben. Warenkorb und Merkzettel bleiben beim Routenwechsel im selben Tab erhalten, auch bei gesperrten Reads oder überschrittenem Schreibkontingent; Löschen und erneutes Mounten ebenfalls getestet. Keine serverseitig geteilten Kundendaten. |
| Lokale Identität | Bestehendes Google-Unternehmensprofil geöffnet und bestätigte Geschäftsdaten abgeglichen. Website-Link auf die eigene Hauptdomain geändert und anschließend in der Kontaktansicht ohne ausstehenden Prüfhinweis bestätigt. Keine anderen Profil-/Accountänderungen. |
| Messprozess | Reproduzierbares 7-/28-/90-Tage-Verfahren und echte abgeschlossene September-Profilbaseline dokumentiert. Search Console/Bing und tatsächlicher Release-Tag 0 werden erst nach öffentlicher Abnahme als erledigt bezeichnet. |

## Redaktion und unabhängige Gegenprüfung

Die Quellenprüfung erfolgte in getrennten Fachpaketen; anschließend wurde die integrierte Umsetzung unabhängig geprüft. Die Gegenprüfung bestätigte den exakten 245-Census, 620 gültige Antwortindizes, unveränderte historische Angebote und tatsächliche Kachelhashes. Zwei wichtige Befunde wurden vor dem Release geschlossen: Verlust flüchtiger Auswahl bei Providerwechsel sowie unbelegte JobPosting-Datierung. Ein veralteter Pilot-/19-Uhr-Runbooktext wurde ebenfalls berichtigt. Abschließende sieben Testvertragsanpassungen wurden separat geprüft und nicht als Lockerung der Schutz-/Inhaltsgates bewertet.

Eine Quellenzuordnung ist keine unabhängige Zertifizierung jeder Geschmacksnote, Servierpräferenz oder geheimen Herstellerrezeptur. Gesundheits-/Rechts-/Zahlenangaben wurden priorisiert, unbelegte Garantien entfernt und die Grenzen pro Beitrag festgehalten. Manche Originaltexte waren nur über tatsächlich abrufbaren ausführlichen Primärtext verfügbar; dies ist im Spezialaudit dokumentiert.

## Prüf- und Veröffentlichungsstand

Lokale Gesamtgates bestanden: **2.354 Tests / 128 Dateien**, ESLint ohne Fehler (20 bereits bekannte Warnungen), Next-Typegen, TypeScript, `offers:check` mit allen 210 Originalangeboten und Produktionsbuild ohne Testuhr. Der Build prüft vorab die exakte 245-Inhaltsabdeckung. Such-HTTP-Prüfung: 284 Sitemapziele, 65 Rezepte, 180 vollständige Lektionen, 245 Quellenansichten, drei Stellen, neun Aliasse, 59 ungültige Ziele und geschützte/Utility-Verträge ohne Befund. Lokaler Gesamt-HTTP-Audit: 293 geprüfte Seiten, 2.615 lokale Ressourcen und 31 API-Verträge, keine Fehler oder Warnungen.

Fokussierte Produktions-Browserprüfung: 16 Fälle zu Stellen, Quellen ohne JavaScript, Tastatur, Navigation, Finder-/Cart-Bytebudgets und Drawer bestanden. Der parallel zum umfassenden HTTP-Audit gestartete erste Homepage-Laborlauf überschritt das enge 1.500-ms-LCP-Testlimit mit 1.808 ms; kein allgemeiner Ursachenbeweis aus dieser Korrelation. Derselbe unveränderte Test danach isoliert dreimal bestanden (80/76/72 ms). Beide Befunde bleiben erhalten; dies ist weder ein Feld-CWV-Nachweis noch eine Zusage für jeden kalten Optimiererzustand.

Der frische Linux-Release **`3cbce2652040f3271464bb573ac121bf1cd47a9a`** wurde am **12.10.2026, 11:21:52 UTC / 13:21:52 Europe/Berlin**, nach 2.298 Tests / 124 Dateien, Lint, Typegen, TypeScript, 210-Angebotsprüfung und Produktionsbuild aktiviert. Vier namentlich dokumentierte Chromiumdateien mit insgesamt 56 Fällen bleiben ausschließlich lokal qualifiziert; native Bewerbungs-/Scannerqualifikation ist nicht eingeschlossen. Rückrollziel ist `6314600b83915127bb0d570e3f1a5a3d1455ccd0`. Die Bereitschaftsprüfung bestätigt deaktivierten Miet-/Bewerbungsbetrieb und 82 aktuell gültige Angebote mit 82 Zusammenfassungen. Neun Sicherheitskonfigurationshashes bleiben vor/nach dem Release gleich. Rund 4,85 GB waren nach Umschaltung frei, vor Entfernung des ausschließlich eigenen temporären Uploadarchivs.

Tatsächliche öffentliche Abnahme auf **https://trinkgut-jammers.de**: normale datumsrichtige Inhaltsprüfung erfolgreich, vollständige Original-PDFs/Covers/Kacheln gebunden; HTTP-Audit 293 Seiten / 2.615 lokale Ressourcen / 31 API-Verträge ohne Befund. Suchaudit am 12.10.2026 um 11:26:07 UTC bestätigt alle 284 Sitemapziele, 65 Rezepte, 180 vollständige Lektionen, 245 Quellenansichten, drei Stellen, Aliasse/404-/Utility-/Schutzverträge. Zusätzlich 16 öffentliche Chromiumfälle, sieben vollständige Medien-/Font-GETs mit exakten Hashes/Cacheverträgen, reale Play/Pause-/Fokus-/Reduced-motion-Prüfung und alle 18 Gewinnspiel-Bild-GETs bestanden. Keine Testuhr gegen Produktion. Der damalige frühe lokale LCP-Ausreißer wird nicht durch diese Funktionsabnahme als allgemeine Feldleistung widerlegt.

## Suchdienste und Folgekontrollen

Google Search Console und Bing haben das Eigentum an `https://trinkgut-jammers.de/` über die jeweils originalen öffentlich bytegleich geprüften HTML-/XML-Dateien bestätigt. Diese Dateien bleiben erhalten. Die vollständige Sitemap wurde bei beiden Diensten eingereicht und die jeweilige Annahme sichtbar bestätigt. Bing zeigt die Zeile als **Submitted / Processing**.

Google zeigte unmittelbar danach **„Konnte nicht abgerufen werden / Sitemap konnte nicht gelesen werden“**. Das ist ausdrücklich noch keine erfolgreiche Sitemap-Verarbeitung. Sichere Gegenprüfung: GET und HEAD liefern 200, `application/xml`, 284 Ziele und keinen noindex-Header; `xmllint` bestätigt wohlgeformtes XML, robots.txt erlaubt den Abruf. Gleiches Ergebnis mit simulierten Bot-User-Agents (kein Beweis echten Botzugriffs); der konfigurierte IPv6-Endpunkt liefert ebenfalls 200. Anschließend bestätigte **Googles eigener Live-URL-Test** am 12.10.2026 um **13:36:17 Europe/Berlin**: **Crawling erlaubt: Ja; Seitenabruf: Erfolgreich**. Keine nachgewiesene Betreiberursache, keine Sicherheits-/DNS-Änderung, URL-Variante oder andere Umgehung daraus ableiten. Endgültigen Sitemap-Verarbeitungsstatus in der Nachkontrolle erneut lesen; der Live-Test garantiert weder Sitemap-Parsen noch Indexierung. Vorgehen gemäß [Google: Sitemaps-Bericht](https://support.google.com/webmasters/answer/7451001?hl=en).

Leistungs- und Indexierungsberichte der neu bestätigten Google-Property sind noch in Verarbeitung; keine erfundenen Index-, Klick- oder Impressionennullen. Die echte abgeschlossene September-Profilbaseline bleibt getrennt dokumentiert. Der Google-Profillink auf die eigene Domain ist gespeichert; die fremde Trinkgut-Marktplattform bleibt ohne Verwaltungszugang unverändert.

Die drei einmaligen App-Folgekontrollen sind ACTIVE und im bestehenden Chat gespeichert: **19.10.2026 (Tag 7), 09.11.2026 (Tag 28), 10.01.2027 (Tag 90), jeweils 14:00 Europe/Berlin**. Jede läuft genau einmal und entfernt anschließend nur ihre eigene Aufgabe. Bestätigte Regeln/Chatzuordnung erneut aus den gespeicherten App-Metadaten gelesen. Ausschließlich lesende Nachmessung, keine eigenständigen Code-/Betriebsänderungen; Mac, Codex-App und erforderliche Anmeldungen müssen verfügbar sein. Kein Server-Cron und keine Wiederaktivierung der pausierten Tageswerbung.

Bereits belegte Teilgates: 41 integrierte Quellen-/Fakten-/Schema-/Renderprüfungen; 17 Bier-/Whiskey-Risikofälle; 10 Wasser-/Saft-Risikofälle; 21 echte Chromium-Providerfälle einschließlich gesperrten Storagegettern und Quota-Fehlern; 102 nachgeschärfte Fixture-/Design-/Originaltextfälle. Teilzahlen werden nicht zu einer erfundenen Gesamtsuite addiert. Produktions-A/B-Messung und Videoqualität stehen im separaten Performancebericht; dort sind die Kandidaten und Messbedingungen ausdrücklich benannt.

## Grenzen und getrennte Folgearbeit

- Suchindex, Rich Results, Rankings und generative Zitate benötigen tatsächliche spätere Beobachtungen. Nicht verfügbare Zahlen sind unbekannt, nicht null; keine beliebige SEO-Punktzahl.
- 55 Rezepte haben belegte passende Originalfotos; für zehn bleibt die vorhandene Foto-Lizenz-/Motivprüfung offen. Der Quellenabgleich aller 65 Rezepttexte ist hiervon getrennt vollständig. Keine Ersatzbilder oder universelle Rich-Result-Eignung aller Rezepte behaupten; fehlende Fotos nicht in strukturierte Daten erfinden.
- Änderungen der fremden offiziellen Trinkgut-Marktplattform benötigen deren Verwaltungszugang. Der eigene Google-Profillink ist hiervon getrennt abgeschlossen.
- Bewerbungsupload, Scanner, Postfachversand/-löschung, Mietbestellungen und Zahlungen bleiben deaktiviert bzw. außerhalb dieses Suchauftrags. Kein AppArmor-/Caddy-/DNS-/Mail-/SMTP-/Sicherheitsumbau.
- Die tägliche Werbekontrolle bleibt PAUSED; die bestehende Wochenaufgabe bleibt Sonntag 16:00 ACTIVE. Die vollständige DE/NL-Folgewoche einschließlich Angebotskarten erscheint nach der bestätigten Vorschau-Regel; gedruckte Angebotsdaten bleiben unverändert. Maasduinen nur mit tatsächlich belegter eigenständiger Ausgabe.
- Fremde Screenshots, das bestehende Bewerbungs-Audit und private Quellen werden bewahrt. Ausschließlich die separat freigegebenen drei inaktiven Releases wurden zur Platzschaffung entfernt; laufende Website und jüngere Rückfallversionen blieben erhalten.

## Detailnachweise

- `2026-10-12-offer-summary-completion.md`
- `2026-10-12-editorial-source-review.md`
- `2026-10-12-editorial-water-juice.md`
- `2026-10-12-editorial-beer-whisky.md`
- `2026-10-12-search-performance.md`
- `2026-10-12-search-baseline.md`
- `../SEARCH-MEASUREMENT-RUNBOOK.md`
