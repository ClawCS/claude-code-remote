# Trinkgut Jammers Synchronisation am 1 Oktober 2026

## Auftrag und Umfang

Der Betreiber lässt den aktuellen Stand lokal und auf GitHub sichern und bestätigt, dass der Server noch nicht online ist. Dieser Auftrag aktualisiert die Dokumentation und sichert den Arbeitsstand; er veröffentlicht keine Website.

Arbeitsverzeichnis: `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`; Branch: `codex/cinematic-production`. Ausgangscommit: `74d4cc381e845f69b58e22a8d15cb82e3f8d3e89`. Vor Beginn wurden `origin` geladen und der aktive Branch mit `--ff-only` abgeglichen; er war bereits aktuell.

## Dokumentation

- `docs/PROJECT-STATUS.md` ersetzt alte Workspace-, Technik-, Shop-, Team- und Importangaben durch den aktuellen Stand.
- `docs/TODO-NAECHSTE-SESSION.md` ordnet Betreiberantworten, Kalender-/Contentreparaturen, Checkout-Ausbau und spätere Veröffentlichung.
- `docs/OFFENE-FRAGEN.md` speichert alle 30 Chatfragen mit derselben Nummerierung. Keine offene Empfehlung gilt als Antwort.
- README, Runbook, Abnahmeübersicht und Mietentwurf verweisen auf den aktuellen Stand beziehungsweise die bestätigte Nichtveröffentlichung. Historische Prüfergebnisse bleiben datiert.
- `AGENTS.md` erhält tatsächlichen Arbeitsort und aktive Branch-Zuordnung; gezieltes Staging und Schutz fremder Änderungen bleiben verbindlich.

## Sicherungsumfang

Anwendungscode unverändert. Keine Canva-/Instagram-Originale, Preise, Profile, Zahlungsanbieter, Versandkonten oder Hostingzugänge durch diesen Auftrag geändert. Keine Bestellungen, Rechnungen oder Nachrichten versandt.

Zu Beginn lagen 32 veränderte Audit-Screenshots und zwei unversionierte ältere Contentberichte vor. Sie bleiben unverändert und werden nicht ungeprüft öffentlich committed. Die lokale Projektsicherung umfasst sie sowie ignorierte private Canva-Originale und Herkunftsnachweise. Zugangsdaten, private Personendaten-Laufzeitbestände, Abhängigkeiten und erzeugbare Build-/Testcaches sind ausgeschlossen und bleiben am ursprünglichen Ort unberührt.

Zusätzliche lokale Sicherung außerhalb des Repositorys: `/Users/niko/Desktop/Homepage/Backups/`. Sie besteht aus Git-Bundle der Branchhistorie und Arbeitsstand-Archiv. Ein lokaler Sicherungsnachweis dokumentiert Commit, Dateihashes, Ausschlüsse und Bundle-/Archivprüfung. Private Originale werden nicht auf GitHub hochgeladen.

## Verifikation

- Frischer vollständiger Unit-Testlauf: `npm test`, Exitcode 0, **50 Testdateien und 613 Tests bestanden** am 1. Oktober 2026.
- Dokumentationsprüfung: neun bearbeitete/neu angelegte Dokumente, relative Dateilinks vorhanden, Fragen genau 1–30 und `publicUrl` weiterhin `null`.
- `git diff --check` erfolgreich. Vor Staging und nach Abschluss wird der Diff erneut geprüft; ausschließlich die eigenen Dokumentationsdateien kommen in den Commit.
- Kein neuer Build, Browserlauf, Canva-Export, Live- oder Rechtsnachweis durch diesen Auftrag. Bestandene Tests widerlegen nicht den bekannten Mietkalenderfehler und ersetzen keine offenen Geschäfts-/Quellenfreigaben.
- GitHub-Commit und lokale Bundle-/Archivintegrität werden nach Erstellung separat geprüft; konkreter Commit und SHA-256 stehen im lokalen Sicherungsnachweis.

Septemberberichte und der heutige Inhaltslauf bleiben datierte Nachweise ihres jeweiligen Prüfbereichs, keine umfassende heutige Abnahme.

Offen: NL KW40, vier Originalcover, Bildzuordnungen/Freigaben, Mietkalenderfehler, Geschäftskonditionen, Anbieter/Postfach/Rechnungswesen und fachliche Abnahmen. Öffentlicher Server nicht online; `publicUrl` bleibt `null`.
