<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sync-Workflow (MANDATORY — Variante A)

Aktueller Stand, 8. Oktober 2026: Der freigegebene Arbeitsstand liegt lokal auf Nikos Mac unter `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production` im Branch `codex/cinematic-production`. Der frühere Claude-Code-Pfad ist archiviert; der übergeordnete Checkout auf `codex/p1-design-directions` ist nicht dieser Arbeitsstand. Gemeinsamer Treffpunkt ist **GitHub (`origin`)**. Die Website ist auf der neuen Hetzner-VM unter `https://trinkgut-jammers.de` öffentlich per HTTPS erreichbar; aktueller App-Release ist `077412b` (Google-Fotoerweiterung, Umschaltung 14:13 UTC, alle acht öffentlichen Bildhashes bestätigt). Erstabnahme unter `docs/audits/2026-10-08-hetzner-launch.md`, aktueller Fotorelease und offene externe DE-Handzettel-404 unter `docs/audits/2026-10-08-google-owner-photos.md`. Die Fotoabnahme ist bestanden, der vollständige Content-/HTTP-Audit wegen dieser externen DE-Dateien nicht. Ein reiner Dokumentationscommit ändert diesen App-Release nicht. `RENTAL_MODE=disabled` bleibt zwingend (nur Anfrage, kein SMTP-/Zahlungsbetrieb). Git-Push allein veröffentlicht keine Änderungen: neue geprüfte Commits benötigen einen Linux-Neubuild und versionierten Release gemäß `docs/DEPLOYMENT-RUNBOOK.md`; niemals im laufenden `current` editieren. Die redaktionellen Codex-Aufgaben bleiben Mac-/App-abhängig, ohne Server-Canva-Cron. Damit nie wieder verschiedene Versionen entstehen:

## Vor JEDEM neuen Auftrag:
1. **Immer zuerst synchronisieren**: Im aktiven Arbeitsverzeichnis `git fetch origin && git merge origin/codex/cinematic-production --ff-only` ausführen. Bei Arbeit an einem anderen ausdrücklich gewählten Branch dessen passenden Remote-Branch verwenden. Erst dann editieren; keine eigenmächtigen Branchwechsel.
2. Falls `--ff-only` fehlschlägt: Git-Zustand und Branch-Abweichung prüfen, nachfragen und keinen Merge erzwingen. Ein bloß lokal vorausliegender Branch beweist keine divergierte Historie.

## Nach JEDER Aenderung durch Claude:
1. `git add` der geaenderten Dateien (keine `git add -A` wegen Secrets-Risiko)
2. `git commit -m "..."` mit klarer Message
3. `git push -u origin <branch>` — bei Network-Fehlern Retry mit Exponential Backoff (2s/4s/8s/16s)
4. Am Ende bei externem oder zweitem Checkout den richtigen Pull nennen: **`cd /Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production && git pull --ff-only`**. Wenn direkt in dieser lokalen Worktree gearbeitet und ihr Commit gegen GitHub geprüft wurde, klar sagen, dass dieser Arbeitsstand bereits synchron ist; keinen Pull in den archivierten Pfad oder den anderen Branch empfehlen.

## Fuer Niko (Regel zum Einhalten):
- **Keine parallelen Edits** auf dem Mac waehrend Claude arbeitet
- Falls doch mal lokal editiert: **erst** `git add -A && git commit -m "..." && git push`, **dann** naechsten Auftrag an Claude geben
- Ansonsten gilt: Claude editiert → push → `git pull` auf dem Mac → fertig

**Zweck**: Eine einzige Source-of-Truth auf GitHub. Keine verlorenen Dateien, keine Merge-Konflikte, kein Pingpong.

# Browser auto-refresh workflow (MANDATORY)

Nach jeder Code-Aenderung an UI/Seiten (`app/**`, `components/**`, `lib/**`, `public/**`, `styles/**`, `*.css`) muss Claude:

1. **Dev-Server laufen lassen** — pruefen ob `http://localhost:3000` antwortet (`curl -sf -o /dev/null -m 3 http://localhost:3000/`). Laeuft er nicht, via `nohup npx next dev -p 3000 > /tmp/next-dev.log 2>&1 &` + `disown` starten und warten bis HTTP 200.
2. **Geaenderte Route verifizieren** — nach dem Edit die betroffene URL mit `curl -s http://localhost:3000/<pfad> | head -40` anfragen und bestaetigen, dass die neuen Strings/Elemente im HTML enthalten sind. **Nicht "fertig" melden ohne diesen Check.**
3. **Hard-Refresh-Hinweis** — dem User am Ende jeder UI-Aenderung klar sagen: "Im Browser bitte Strg+Shift+R (Mac: Cmd+Shift+R) druecken, damit der Cache bypasst wird." HMR liefert das Update automatisch, aber ein zwischengespeicherter Service-Worker oder Tab-Cache kann veraltete Assets zeigen.
4. **Hook-Backup** — `.claude/settings.json` enthaelt einen PostToolUse-Hook, der nach jedem Write/Edit auf Code-Dateien `localhost:3000` pingt, um Turbopack-Recompile + HMR-Push zu triggern. Der Hook ersetzt den manuellen Check NICHT — er beschleunigt ihn nur.

Gilt fuer alle UI-/Seiten-Aenderungen. Reine Doku-/Konfig-Edits sind ausgenommen.

# Verbindliche Bildregel — Niko, 30.09.2026

## Ausdrückliche Ausnahme für eigene Google-Profilfotos — 08.10.2026

Niko hat die Übernahme möglichst vieler geeigneter eigener Fotos aus dem Google-Unternehmensprofil von Trinkgut Jammers ausdrücklich beauftragt. Nur eindeutig dem Betreiber zugeordnete Fotos aus „Vom Inhaber“ verwenden, keine Kundenfotos oder Street-View-Bilder. Die geprüften Motive passend zu Marktleben, Geschenkideen und Eigenmarken einordnen; ältere Aufbauten als Rückblicke kennzeichnen, nicht als aktuelle Preis-/Bestandszusage. Lokal optimierte, vollständige Web-Derivate mit eigener Google-Herkunft führen; nicht als Canva verifiziert ausgeben. Private Quellen-URLs, Foto-Identitäten und Exportnachweise bleiben unter `.superpowers/google-photos-2026-10-08/`; das öffentliche Buildmanifest unter `assets/source/google-market-photos/` enthält ausschließlich bereinigte Quellen, Freigabebasis, Maße und SHA-256. Google und Canva unverändert lassen, keine externen Fotoeinbettungen.

Das am 08.10. gezeigte Stapler-/Anlieferungsfoto ist laut Niko Justin zugeordnet und vollständig ausgeschlossen, auch als Ausschnitt. Die bisherigen Personen-Ausschlüsse bleiben bestehen; unbeschriftete Menschen nicht anhand ihrer Gesichter identifizieren.

## Ausdrückliche Ausnahme für Akademie und Leihartikel — 08.10.2026

Niko hat passende KI-generierte Themenbilder für alle Akademiekurse über Image sowie natürliche Beispielbilder für die Leihartikel ausdrücklich beauftragt und den Kurzdesign-Abgleich freigegeben. Diese Bilder lokal optimieren und in einem getrennten Herkunftsmanifest mit Prompt, Generator, Freigabedatum und SHA-256 dokumentieren. Akademiemotive als KI-generierte Themenbilder kenntlich machen; Leihbilder mit „KI-Beispielbild · Modell und Ausführung können abweichen“ kennzeichnen. Keine nicht belegten konkreten Modelle, Abmessungen oder Eigenschaften als zugesichert ausgeben. Diese Ausnahme gilt nicht für Cocktails, Marktfotos, Mitarbeiter, Werbung oder Gewinnspieloriginale. Vorhandene Canva-Verbindung bleibt unverändert.

## NL-Werbung: Betreiberfreigabe — 08.10.2026

Ergänzung nach ausdrücklicher Design-Abnahme am selben Tag: Für das Sortiment sind alle Angebotsblöcke beider aktuellen Originalhandzettel als vollständige, unveränderte Originalausschnitte freigegeben, auch die bisher zurückgehaltenen NL-Blöcke. App-/Mengenbedingungen erhalten; bekannte Originalwidersprüche am betreffenden Angebot kennzeichnen und nicht in erfundene oder stillschweigend korrigierte Einzelpreise umwandeln. Diese Freigabe betrifft Originalausschnitte, nicht normalisierte Preis- oder WWS-Daten.

Die datumsrichtige, vollständige NL-Originalseite darf auf ausdrückliche Betreiberanweisung trotz dokumentierter rechnerischer Preis-/Grundpreisabweichungen unverändert übernommen werden. Der Betreiber wurde über die KW41-Abweichungen einschließlich Krombacher-Mindestmenge informiert und hat anschließend die Umsetzung bestätigt. Preis-/Pfand-/Bedingungsabweichungen als redaktionelle Warnung melden und dokumentieren; nicht eigenmächtig korrigieren und nicht als rechnerisch fehlerfrei deklarieren. Falsche Woche, unklare Herkunft, fehlendes/defektes Original oder mehrseitige NL-PDF bleiben blockierend. Einzelangebote außerhalb des Originalflyers nur bei vollständig eindeutig belegten Angaben übernehmen; andernfalls auf den Originalhandzettel verweisen.

## Ausdrückliche Ausnahme für Cocktailrezepte — 05.10.2026

Niko hat echte, rezeptgetreue Cocktailfotos aus dem Internet ausdrücklich beauftragt und die behutsame Umsetzung freigegeben. Für Cocktailrezepte sind daher einzeln belegte, kommerziell nutzbare Fotografien externer Quellen zulässig. Motiv, Rezeptvariante, Glas und Garnitur prüfen; keine KI-Ersatzbilder und keine Rezeptänderung, nur um ein Bild passend zu machen. Urheber, Originalquelle, konkrete Lizenz, Änderungen und lokale Dateihashes dokumentieren; erforderliche Bildnachweise öffentlich am Foto zugänglich halten. Originale und ausführliche Quellenbelege unter `assets/source/cocktails/` bleiben privat. Diese Ausnahme gilt nicht automatisch für andere Rubriken.

## Ausdrückliche Ausnahme für eigene Instagram-Gewinnspielcover — 05.10.2026

Niko hat die Verwendung der eigenen Instagram-Originalbeitragsbilder ausdrücklich freigegeben: „freigabe instagram, hol sie aus insta und render diese“. Für Gewinnspielcover aus `@trinkgutjammers_goch` darf daher das genaue vollständige Originalmotiv direkt aus dem zugehörigen Instagram-Beitrag übernommen werden, wenn die exakte Canva-Quelle nicht zugeordnet ist. Das gilt auch beim beauftragten monatlichen Gewinnspielabgleich. Keine fremden Accounts, Teilnehmerbilder oder beliebigen Instagram-Fotos daraus ableiten. Beitrag, Motiv, Gewinn und Frist belegen; vollständig und unbeschnitten lokal optimieren, Herkunft und SHA-256 dokumentieren. Instagram-Exporte nicht als Canva-verifiziert kennzeichnen; keine signierten CDN-URLs einbetten. Die vorhandene Canva-Verbindung bleibt bestehen. Diese Freigabe hebt die frühere Wartestellung der sechs vorbereiteten Gewinnspielcover auf.

## Grundregel für die übrigen Rubriken

- Für die Homepage ausschließlich Fotos aus Nikos verbundenem Canva-Bestand verwenden. Eine lokale Datei oder frühere Fotofreigabe allein beweist diese Herkunft nicht. Keine KI-generierten Ersatzfotos oder externen Stockfotos einsetzen.
- Vor Veröffentlichung jedes Foto einer belegten Canva-Design-/Seiten- oder Upload-Asset-Identität zuordnen; Originalexport, Dateihash, Freigabe und vorgesehene Rubrik dokumentieren. Ungeklärte Motive nicht als Canva-verifiziert ausgeben und keine neuen ungeklärten Motive einbauen. Bereits aktive, noch ungeklärte Bilder müssen vor der endgültigen Abnahme geklärt oder ersetzt werden.
- Fotos redaktionell passend ordnen: Markt und Beratung zum Einstieg/Markt; Portraits und Gruppenbilder zum Team; tatsächliche Leihartikel zur Vermietung; Sortimentfotos zur passenden Getränkekategorie; Aktionsfotos nur zur belegten Aktion beziehungsweise zum datierten Rückblick. Kein Motiv als beliebige Dekoration über mehrere unpassende Rubriken verteilen.
- Pro Motiv sinnvollen Ausschnitt und Fokuspunkt festlegen. Desktop und Mobil separat prüfen: Köpfe, Hände, Produkte und wichtige Beschriftung dürfen nicht ungewollt angeschnitten werden. Gruppenfotos brauchen ein breites oder natürliches Format; fertig beschnittene Bilder nicht nochmals pauschal in 4:5 zwingen. Zentrierung ist ein gestalterisches Ergebnis, kein universeller `object-position:center`-Ersatz für die Prüfung.
- Originale in Canva unverändert lassen. Nur lokale Web-Derivate optimieren: richtige Größe, natürliche Farben, keine Verzerrung, kein künstlicher KI-Look. Logos, Originalposter und datierte Handzettel sind Marken-/Werbemittel, keine dekorativen Ersatzfotos; vollständig und lesbar darstellen.
- Die Canva-Verbindung als redaktionelle Quelle eingerichtet lassen, nicht entfernen. Bei jedem Content-Lauf Lesefunktion und Exportzugang prüfen. Abgelaufene Anmeldung/Autorisierung konkret melden und vom Betreiber erneuern lassen; dauerhafte Verfügbarkeit nicht versprechen. Keine Account- oder Designänderungen und kein Login-Umgehen.
- Die Website verwendet geprüfte lokale Exporte, keine ablaufenden signierten Canva-Thumbnail-URLs und keine vom Besucher abhängigen Canva-Logins. Interne Herkunftsnachweise und Account-Metadaten nicht öffentlich ausgeben.
