# Öffentlicher Website-Auftritt: Korrektur und Prüfstand

Stand: 30.09.2026, Europe/Berlin. Branch: `codex/cinematic-production`. Lokale Produktionsvorschau: <http://127.0.0.1:3103/> und <http://127.0.0.1:3000/>. Ein Git-Push ersetzt keine bestätigte Bereitstellung auf einer öffentlichen Domain.

## Ergebnis

Der warme Trinkgut-rote Auftritt gilt jetzt auch auf den Unterseiten. Fachnavigation und Warengruppen führen auf eigene URLs statt zurück zu Abschnitten der Startseite. Der alte Header/Footer, animierte Kategorieflächen und große Emoji-/Logo-Bildersatzflächen sind aus dem geprüften öffentlichen Auftritt entfernt. Funktionale kleine Bedienicons bleiben erhalten.

Chronologisch umgesetzt und gegengeprüft:

1. Fehler auf dem bestehenden Branch reproduziert; Ausgangssuite mit 330 Tests geprüft.
2. Einheitlichen Rahmen, Navigation, Warengruppen und Produktdetails korrigiert. Unbekannte Detail-/Kategorie-URLs liefern 404.
3. Zwanzig Leihartikel aus den Originaltabellen übernommen, Preise und Bestände mit Quellenstand versehen. Wiederholte Auswahl, Mengenänderung, Speicherwiederherstellung und Anfrage dürfen den physischen Bestand nicht überschreiten. Überlappende Garnitur-/Einzelmöbelauswahl ist konservativ gegen Doppelzählung abgesichert.
4. Elf frühere Teammitglieder mit Canva-zugeordneten Portraits ergänzt: Niko, Sven, Jasmin, Gabriella, Jan Niklas, Hanna, Nico, Nils, Henri, Tim und Hannah. Hanna und Hannah sind zwei verschiedene Personen; beide sowie Henri sind ausdrücklich bestätigt. Ausgeschlossene ehemalige Mitarbeiter werden nicht verwendet.
5. Eigene Gewinnspielseite, Archiv und Monatsagenda 2026 mit dreizehn belegten Aktionen erstellt: neun Monatsaktionen Januar–September und vier Sonderaktionen. Oktober–Dezember bleiben als nicht angekündigt gekennzeichnet. Berliner Tagesgrenzen, Wissensstand und Ablaufdatum steuern die Anzeige; Teilnahme bleibt beim verlinkten Originalbeitrag.
6. Fünfundsechzig Rezeptdetails und sechs Rezeptkategorien auf eigenen URLs bereitgestellt. Aus passenden Canva-Motiven eigene Seiten für Marktleben, Geschenkideen und regionale Spirituosen entwickelt.
7. Anfrageliste/Merkliste einschließlich Sammelaktion, verschachtelte Main-Landmarks, Drawer-Schichten, Agenda-Ziel und Flyer-Bedienung vor Hydration korrigiert. Abschließender unabhängiger Review fand doppelte Markenangaben in drei Seitentiteln; Browser-Regressionsprüfung zunächst rot, nach Korrektur grün.

## Bilder und Quellen

Alle neu verwendeten Fotos sind visuell gegen den verbundenen Canva-Bestand abgeglichen und privat mit Export, Identität, Hash, Rubrik und Ausschnitt dokumentiert. Canva-Originale und Instagram wurden nicht verändert. Es wurden keine KI-/Stock-Ersatzbilder eingeführt.

Die Teamquellen umfassen elf Portraits, ein Gruppenbild und das Duo Sven/Niko. Das Gruppenbild bleibt im natürlichen Format 900 × 875. Neu ergänzt sind Salitos-Aufbau, Geschenkkorb und Niko im Marktalltag. Der grüne Aufbau ist ausdrücklich Salitos, nicht Almdudler oder ein alkoholfreies Sortiment. Historische Aufbauten werden nicht als aktuelle Preisaktionen ausgegeben. Die drei Brüdergeist-Motive sind originale Produktgrafiken und auch so beschriftet.

Öffentliche Buildquellen enthalten keine neuen Canva-Account-/Design-/Seiten-IDs und keine EXIF/XMP/IPTC/ICC-Metadaten. Sie sind verlustfreie Kopien beziehungsweise freigegebene Ausschnitte. Private Rohoriginale und Herkunftsarchive sind Git-ignoriert und nicht für den öffentlichen Push vorgesehen. Die Asset-Pipelines prüfen Maße, SHA-256, Ausschnitte und Byte-Identität vor jedem Build. Das öffentliche Repository enthielt bereits vorher technische Canva-IDs in seiner Quellenkonfiguration; diese Bestandsdaten sind kein neuer Herkunftsnachweis. Die Repository-Sichtbarkeit sollte der Betreiber bewusst prüfen.

## Frische Verifikation der endgültigen Codefassung

| Prüfung | Ergebnis und Umfang |
| --- | --- |
| `npm test` | 47 Dateien, 484 Tests bestanden; 16,60 s |
| `npx tsc --noEmit` | Exit 0 |
| `npm run lint` | Exit 0; 0 Fehler, 20 bestehende Warnungen |
| `npm run build` | Exit 0; 230 statisch generierte Seiten; Asset-/Content-Vorprüfung erfolgreich |
| Bestehende Browser-Kontraktsuite | 61/61 bestanden; 35,8 s; feste Juli-Testuhr und isolierte Werbe-Fixtures |
| Reale Produktions-Browserprüfung | 24/24 bestanden; 46,2 s; 12 URLs × Desktop/Mobil, reale Uhr, keine Fixtures |
| HTTP/SSR-Audit | 224 Seiten, 364 lokale Ressourcen, 5 unbekannte Pfade, 13 API-Verträge; 0 Fehler, 0 Warnungen |
| Bildpipelines | 17 Cinematic- und 6 Marktbild-Derivate geprüft; Reproduzierbarkeit und Quellenvalidierung in der Unit-Suite |
| Sichtprüfung | 54 aktuelle Produktions-Screenshots; Hero, Aktionen, Team, Geschenkideen, Marktleben und Regionalmotive persönlich geprüft |

Die reale Browserprüfung bestätigt geladene, unverzerrte Bilder, natürliche Seitenverhältnisse, passende Originalmaße, elf Portraitnamen, einen gemeinsamen Rahmen und je ein Main/H1/Banner/Footer. Keine horizontalen Überläufe oder abgeschnittenen Bedienflächen, keine Browser-Laufzeit-/Hydrationsfehler und keine schweren/kritischen Axe-Verstöße in diesen 24 Prüfungen. Dies ist keine vollständige manuelle WCAG-Zertifizierung.

HTTP-Evidenz: `audit/evidence/public-site-completion-2026-09-30.json`. Die API-Prüfung verwendet nur Lesezugriffe und leere, nicht authentifizierte Ablehnungsproben an überprüften gesperrten/geschützten Endpunkten. Keine Nachrichten, Bewerbungen, Bestellungen oder autorisierten Refresh-Jobs wurden ausgelöst. 1.407 externe Linkvorkommen wurden nicht aufgerufen; deren gesamte Zielsysteme sind daher nicht als geprüft auszugeben.

In der festen Juli-Kontraktsuite protokolliert Next bei absichtlich unbekannten Pfaden `NoFallbackError`; die erwarteten 404-Verträge bestehen. Einzelne nicht durch Fixtures ersetzte Juli-Werbezugriffe liefern upstream 403; die vorgesehenen Fallback-/No-JavaScript-Verträge bestehen. Die aktuelle Produktionsprüfung verwendet weder diese Juli-Ausgabe noch das isolierte Titelseiten-Fixture. Die 20 Lint-Warnungen betreffen vorhandene ungenutzte Variablen und React-Effektmuster; es wird keine warnungsfreie Gesamt-Codebasis behauptet.

Die sechs Dateien unter `audit/screenshots/relaunch-2026-09-30/` stammen aus der festen Juli-Testuhr. Für den aktuellen visuellen Stand ausschließlich `audit/screenshots/public-site-completion-2026-09-30/` heranziehen.

## Noch offene Abnahmepunkte

- Für konkrete Leihgeräte und einzelne Cocktailrezepte fehlen sicher zugeordnete, geeignete Canva-Originalfotos. Die betreffenden Seiten bleiben ohne thematisch falsche Ersatzfotos funktionsfähig.
- Die aktuellen Canva-Poster für Veltins und Guinness sind noch nicht sicher identifiziert/exportiert. Termine und Gewinne sind über die Instagram-Originale belegt; die Textagenda ist vorhanden. Die erfolgten gezielten Such-/Exportprüfungen sind keine Behauptung, der gesamte Canva-Bestand sei lückenlos inventarisiert.
- Die ursprünglichen Leihpreisquellen bestätigen nicht für jede Zeile einen Preis oder einen Mietzeitraum. Unklare Glas-/Thekenpreise werden angefragt statt erfunden. Bruchersatz wird nicht als Kaution ausgegeben. Bestandsstand 06.03.2026 ist eine physische Obergrenze, keine Live-Buchungsverfügbarkeit; Preisstand 01.01.2026.
- Es liegt kein aktuelles Canva-Handzettel-PDF-Paket im Website-Index vor. Die gültige offizielle Goch-Werbung 28.09.–03.10.2026 wird verwendet. Der letzte lokale Kontrolllauf `2026-09-30T14-04-49-612Z-check-2323babc` bestätigt diese Quelle und `websiteVerified=true`, bleibt wegen fehlender NL-Ausgabe und öffentlicher Produktionsadresse aber `degraded` und `deploymentVerified=false`. Sonntags 17:00 ist Vorbereitung, täglich 06:15 Kontrolle eingerichtet; erfolgreiche Canva-Anmeldung, eingeschalteter Mac und laufende Codex-App bleiben Voraussetzungen.
- `publicUrl` ist nicht konfiguriert: lokale Websiteprüfung möglich, `deploymentVerified=false`. Die öffentliche Domain, Hosting-/Deployment-Anbindung und tatsächliche Live-Auslieferung sind vor einer öffentlichen Freigabe zu bestätigen. GrailBid ist als externer Shop verlinkt; sein Shopsystem wurde nicht verändert oder vollständig auditiert.
- Dieser technische Quellen-/Funktionscheck ist kein Rechtsgutachten und keine pauschale Bestätigung vollständiger Gesetzeskonformität. Rechtliche Endabnahme, aktuelle Betreiberangaben und etwaige künftige Gewinnspielbedingungen müssen zum tatsächlichen Veröffentlichungsstand bestätigt werden.

Bedien-/Wiederholungsanleitung: `docs/CONTENT-UPDATE-RUNBOOK.md`. Nach einem lokalen Versionswechsel im Browser `Cmd+Shift+R` verwenden.
