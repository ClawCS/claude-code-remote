# Behutsame Redaktion und Navigation — 05.10.2026

## Auftrag und Grenzen

Freigegeben: Gewinnspiele aktualisieren, echte passende Cocktailfotos aus dem Internet ergänzen, die Getränkeakademie leichter auffindbar machen und das bestehende Design erhalten. Kein Relaunch, keine Hostingänderung, keine Änderung in Canva/Instagram und keine echten Bestellungen, E-Mails oder Zahlungen.

Arbeitsort: bestehender Worktree `cinematic-production`, Branch `codex/cinematic-production`. Ausgangspunkt `b1253c964b12bd73c1b3ef09975c90a7e8910bc5`; vor Beginn fetch/fast-forward geprüft, bereits synchron. 32 vorbestehend veränderte Audit-PNGs und zwei alte unversionierte Content-JSONs bleiben unangetastet und werden nicht mitgestaged.

## Umsetzung

- Rot, Hero, Teamdarstellung und grundlegender Seitenaufbau bleiben erhalten.
- Neun Hauptnavigationsplätze bleiben bestehen. „Rezepte & Wissen“ bündelt Cocktail-Rezepte und Getränkeakademie mit nativer Desktop-Aufklappnavigation und direkten mobilen Links.
- Kompakter Akademie-Einstieg im Sortiment auf Startseite und Produktübersicht; passende vorhandene Kurse bei Bier, alkoholfreien Getränken, Wein, Sekt, Spirituosen und Eigenmarken. Für Lebensmittel kein erfundener Kurs. Bestehende acht Kurse und deren Quiz unverändert.
- Produktfilter mechanisch in eine Client-Komponente ausgelagert; Akademie-Metadaten bleiben serverseitig. Produktsuche per URL und Eingabe im Browser geprüft.
- Originalbeiträge vom 01.10. (Everdure KILN R Staropramen, Frist 31.10.) und 04.10. (Disaronno Liegestuhl + Flasche, Frist 18.10.) eingearbeitet. Exakter Veröffentlichungszeitpunkt aktiviert neue Aktionen, Ablauf nach Berliner Kalendertag einschließlich Zeitumstellung getestet. September/Guinness bleiben korrekt im Archiv.
- Cocktailfotos werden nur bei geprüftem Freigabestatus lokal eingebunden, nicht aus ablaufenden Remote-URLs. Nachweise mit Urheber, Originalquelle, Lizenz und Änderungen sind am Bild erreichbar. Detail- und Übersichtsseiten verwenden dieselbe Darstellung; keine künstliche Bilderzeugung und keine Rezeptänderungen für ein Bild.
- Ein in der Vollprüfung reproduzierter Lint-Abbruch durch private CJS-Recherchedateien behoben: private Quellenverzeichnisse aus dem App-Lint ausnehmen und den React-Hook-Override auf den tatsächlichen Dateibereich des Next-Plugins beschränken. Zwei zunächst rote Regressionstests belegen den Fehler und dessen Behebung; keine allgemeine Abschaltung von Prüfregeln.

## Bildquellen und offene Punkte

Canva-Lesezugang und angemeldete Ansichten sind erreichbar. Die Hauptsammlung, der bekannte Carousel-Kandidat und 100 neueste Uploads wurden gezielt auf die beiden Oktobermotive geprüft. Kein exaktes Motiv zugeordnet; das ist kein behaupteter vollständiger Ausschluss aller Accountdateien. Private Belege liegen lokal, nicht im öffentlichen Repository.

Neun bestehende vollständige Canva-Cover bleiben aktiv. Für März (grüne Monster-Version), August, September, Guinness sowie die beiden Oktoberaktionen fehlen weiterhin die exakten Canva-Zuordnungen oder die ausdrücklich angefragte Ausnahme für die eigenen Instagram-Beitragsbilder. Sechs identische Instagram-Originale sind privat vorbereitet, **nicht veröffentlicht**. Beide neuen Originalposter sind bei Instagram als „KI-Inhalte“ gekennzeichnet; sie werden nicht als reale Marktfotografie bezeichnet.

Die Cocktailausnahme ist in `AGENTS.md` dokumentiert; sie erweitert nicht die Quellenfreigabe für andere Rubriken. **39 von 65 Rezepten haben geprüfte Fotos**, 26 bleiben ausdrücklich offen: 17 recherchierte Kandidaten warten nach HTTP 429/Retry-After 600 auf Download und visuelle Prüfung, für neun Rezepte fehlt eine geeignete offen lizenzierte Variante. Alle 65 Rezepte sind im Fotokatalog genau einmal als freigegeben oder ungeklärt erfasst. Das öffentliche Fotoverzeichnis enthält ausschließlich die 39 freigegebenen WebP-Dateien. Nicht freigegebene Kandidaten und Originalbelege verbleiben privat. Explizite Download-Cooldowns wurden eingehalten; alternativ nur belegte Originalquellen der jeweiligen Fotografen verwendet. Die drei abschließenden Kontaktbögen wurden visuell geprüft.

## Regelmäßige Prüfung

Die zusätzliche lokale Monatsaufgabe `jammers-monatliche-gewinnspiele-pr-fen` ist aktiv: **1. jedes Monats, 18:00 Europe/Berlin**. Erstellung und gespeicherte Konfiguration geprüft. Sie liest Originalposts und Canva, prüft Cover/Fristen, führt Regressionen aus und berichtet nur relevante Änderungen oder benötigten Nutzereingriff. Ablauf in `docs/GIVEAWAY-UPDATE-RUNBOOK.md`. Mac und Codex-App müssen laufen; keine unabhängige Serverautomatik oder dauerhaft gültige Anmeldung behauptet. Bestehende Wochen-/Tagesaufgaben unverändert.

## Verifikation

- Unabhängiges Code-Review: kein belegter blockierender Fehler; Hinweis zur Bildstatus-/Assetabdeckung durch zusätzliche Tests umgesetzt.
- 91 betroffene HTTP-Routen mit HTTP 200 und gerendertem H1: alle 65 Cocktailrezepte, sechs Cocktailkategorien, acht Kurse und die betroffenen Einstiegsseiten. Skriptinhalte vor HTML-Prüfung entfernt.
- Desktop: Dropdown öffnet, Escape schließt, Tastatur öffnet erneut, Akademieziel erreichbar; Rezeptkarte führt zur Detailseite und Bildnachweise sind vorhanden. Produktsuche „Veltins“ und Wechsel auf „Krombacher“ funktionieren.
- Mobil bei tatsächlich gemessenen 390×844 Pixeln in Chrome: beide Wissenslinks sichtbar; Menü schließt nach Navigation; Akademie und Bierkurs erreichbar; Rezeptdetail ohne Horizontalüberlauf, geladenes Foto vollständig per `contain`. Die IAB-Viewport-Vorgabe hatte keine tatsächliche Größenänderung bewirkt und wurde nicht als Mobilprüfung gewertet.
- Screenshots ausschließlich im neuen Verzeichnis `audit/screenshots/editorial-refresh-2026-10-05/`; vorhandene Auditbilder nicht überschrieben.
- Abschließende Vollprüfung des eingefrorenen Code-/Fotostands: **66 Testdateien, 967 Tests bestanden**, `npx tsc --noEmit` und Produktionsbuild mit **228 statischen Seiten** erfolgreich. Bildstatus, vollständige Rezeptzuordnung, exakte öffentliche Dateiliste, Lizenzen, Dateihashes, dekodierte Abmessungen und fehlende Metadaten sind durch Regressionstests abgedeckt.
- `npm run lint`: erfolgreich, **0 Fehler und 20 bestehende Warnungen**; keine Warnungsfreiheit behauptet. Der aktualisierte Playwright-Test wurde nicht als separate CLI-Suite ausgeführt; Browsernachweise stammen aus den oben beschriebenen tatsächlichen Desktop-/Mobilprüfungen.

## Bereitstellung

Öffentlicher Server weiterhin nicht online, `publicUrl` weiterhin nicht konfiguriert. Lokale Browserprüfung und GitHub-Sicherung sind getrennt von einer Live-Veröffentlichung. Kein öffentlicher HTTPS-Nachweis und keine vollständige Website-/Rechtsabnahme aus diesem begrenzten Auftrag ableiten.
