# Monatsredaktion: Gewinnspiele

Stand: 05.10.2026. Geplante Kontrolle: **am 1. jedes Monats um 18:00 Uhr Europe/Berlin** im bestehenden Codex-Chat. Der lokale Mac und die Codex-App müssen dafür laufen; eine Anmeldung kann ablaufen. Diese Kontrolle ersetzt weder die sonntägliche Wochenwerbung noch deren tägliche Prüfung.

## Reihenfolge und Quellen

1. Im freigegebenen Worktree auf `codex/cinematic-production` zuerst `AGENTS.md` lesen, Git-Zustand prüfen und nach dessen Sync-Regel synchronisieren. Fremde Änderungen, private Originale und bestehende Screenshots bewahren.
2. Canva-Lesezugang und authentifizierten Originalexport prüfen. Instagram `@trinkgutjammers_goch` ausschließlich lesen. Keine Designs, Beiträge, Kommentare, Likes oder Account-Einstellungen verändern.
3. Seit der letzten erfolgreichen Prüfung veröffentlichte Monats- **und Sondergewinnspiele** lesen. Original-URL, tatsächlichen Veröffentlichungszeitpunkt, Gewinn, Jahr, Teilnahmeschluss und Abholbedingungen gegen den vollständigen Beitrag prüfen. Titel, Uploaddatum und ähnlich aussehende Gewinne sind kein Identitätsbeleg. Fehlt ein Original oder bleibt der Zeitraum widersprüchlich, keine Angaben erfinden.
4. Das genaue Beitragsmotiv im Canva-Bestand zuordnen und über den authentifizierten Browser original exportieren. Nur die ausdrücklich in `AGENTS.md` erlaubten Quellen-Ausnahmen anwenden: Die Internetfoto-Ausnahme für Cocktails erlaubt **nicht** automatisch Instagram-Gewinnspielbilder. Eine ausstehende Ausnahmefreigabe bleibt ein offener Punkt. Keine fremde Jahresversion oder abweichende Farbe als Ersatz verwenden.
5. Original, Identitätsabgleich, Exportdatum, Freigabe und SHA-256 privat unter `assets/source/giveaways/` sichern. Keine Cookies, Tokens, signierten URLs oder neue private Canva-Identitäten im öffentlichen Git-Repository speichern. Nur metadatenfreie, freigegebene Buildquellen und Web-Derivate veröffentlichen.

## Einbau und Anzeige

- `data/giveaways.ts` ist die gemeinsame Quelle für Startseite, `/gewinnspiel`, Jahresagenda und `/gewinnspiel/archiv`. Keine zweite manuelle Aktionsliste anlegen.
- Für neue Beiträge `publishedAt` als belegten ISO-Zeitpunkt mit Zeitzone, `verifiedEndsDate` als Originaldatum und die richtige Art (`monthly` oder `special`) pflegen. Neue Jahre im Datensatz und in der Agenda ausdrücklich prüfen; das vorige Jahr nicht nur umetikettieren.
- `GIVEAWAYS_UPDATED_ON` benennt die letzte redaktionelle Änderung, nicht die erneute Prüfung aller historischen Quellen. Einzelne Prüfstände bleiben nachvollziehbar.
- Neue Aktionen erst ab Originalveröffentlichung aktiv anzeigen. Nach dem Original-Enddatum bis 23:59 Uhr in Europe/Berlin automatisch ins Archiv wechseln lassen. Sommer-/Winterzeit berücksichtigen; keine Teilnahmefristen verlängern.
- Cover stets vollständig mit Originalseitenverhältnis darstellen: kein Crop, keine zusätzliche Beschriftungsüberlagerung, kein KI-Nachbau. Bildmaße, Alternativtext und Bezug zum Originalpost müssen stimmen. Fehlende Cover offen dokumentieren, nicht als erledigt behandeln.
- Die bisherige Canva-Marktbildpipeline und deren Manifest nur für wirklich belegte Canva-Quellen verwenden. Nicht ungeprüft `--prepare-sources` starten; siehe `CONTENT-UPDATE-RUNBOOK.md`.

## Prüfung und Übergabe

1. Datei dekodieren, Maße und SHA-256 prüfen; Quelle, Gewinn und Beschriftung visuell gegenprüfen.
2. `npm test -- lib/__tests__/giveaways.test.ts lib/__tests__/giveaway-pages.test.tsx lib/__tests__/giveaway-covers.test.tsx` und `npx tsc --noEmit` ausführen. Bei Assetänderungen auch `npm run assets:market:check`; vor Übergabe die vollständige Testsuite und den Build prüfen.
3. Startseite, Gewinnspielübersicht, Agenda und Archiv per HTTP und auf Desktop/Mobil kontrollieren. Originalpostlinks, vollständige Bilder, Beginn, Ablauf, Monats- und Jahreswechsel testen. Testuhren ausschließlich auf klar isolierten Testservern, niemals in der normalen Vorschau oder Produktion setzen.
4. Nur eigene geprüfte Dateien gezielt stagen, committen und pushen. Private Originale und fremde Auditdateien nicht aufnehmen. Unveränderter korrekter Inhalt braucht keinen leeren Commit.
5. Bericht unter `docs/audits/` mit getrennten Ergebnissen für Quelle, Import, lokale Darstellung und öffentliche Bereitstellung ablegen. Eine öffentliche Veröffentlichung nur auf der tatsächlich konfigurierten HTTPS-`publicUrl` bestätigen. Aktuell ist der Server nicht online; localhost und Git-Push sind kein Live-Nachweis.

Benachrichtigen bei neu aufgenommenen Aktionen, neuen relevanten Fehlern oder erforderlichem Nutzereingriff. Fehlende Anmeldung, Quelle oder Freigabe konkret einmal melden und bei unverändertem Zustand nicht monatlich identisch wiederholen. Ist noch kein neuer Beitrag erschienen, nichts erfinden; den Befund festhalten und ansonsten still bleiben.
