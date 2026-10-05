<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sync-Workflow (MANDATORY — Variante A)

Aktueller Stand, 1. Oktober 2026: Der freigegebene Arbeitsstand liegt lokal auf Nikos Mac unter `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production` im Branch `codex/cinematic-production`. Der frühere Claude-Code-Pfad ist archiviert; der übergeordnete Checkout auf `codex/p1-design-directions` ist nicht dieser Arbeitsstand. Gemeinsamer Treffpunkt ist **GitHub (`origin`)**. Der öffentliche Server ist noch nicht online. Damit nie wieder verschiedene Versionen entstehen:

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

## Ausdrückliche Ausnahme für Cocktailrezepte — 05.10.2026

Niko hat echte, rezeptgetreue Cocktailfotos aus dem Internet ausdrücklich beauftragt und die behutsame Umsetzung freigegeben. Für Cocktailrezepte sind daher einzeln belegte, kommerziell nutzbare Fotografien externer Quellen zulässig. Motiv, Rezeptvariante, Glas und Garnitur prüfen; keine KI-Ersatzbilder und keine Rezeptänderung, nur um ein Bild passend zu machen. Urheber, Originalquelle, konkrete Lizenz, Änderungen und lokale Dateihashes dokumentieren; erforderliche Bildnachweise öffentlich am Foto zugänglich halten. Originale und ausführliche Quellenbelege unter `assets/source/cocktails/` bleiben privat. Diese Ausnahme gilt nicht automatisch für andere Rubriken.

## Grundregel für die übrigen Rubriken

- Für die Homepage ausschließlich Fotos aus Nikos verbundenem Canva-Bestand verwenden. Eine lokale Datei oder frühere Fotofreigabe allein beweist diese Herkunft nicht. Keine KI-generierten Ersatzfotos oder externen Stockfotos einsetzen.
- Vor Veröffentlichung jedes Foto einer belegten Canva-Design-/Seiten- oder Upload-Asset-Identität zuordnen; Originalexport, Dateihash, Freigabe und vorgesehene Rubrik dokumentieren. Ungeklärte Motive nicht als Canva-verifiziert ausgeben und keine neuen ungeklärten Motive einbauen. Bereits aktive, noch ungeklärte Bilder müssen vor der endgültigen Abnahme geklärt oder ersetzt werden.
- Fotos redaktionell passend ordnen: Markt und Beratung zum Einstieg/Markt; Portraits und Gruppenbilder zum Team; tatsächliche Leihartikel zur Vermietung; Sortimentfotos zur passenden Getränkekategorie; Aktionsfotos nur zur belegten Aktion beziehungsweise zum datierten Rückblick. Kein Motiv als beliebige Dekoration über mehrere unpassende Rubriken verteilen.
- Pro Motiv sinnvollen Ausschnitt und Fokuspunkt festlegen. Desktop und Mobil separat prüfen: Köpfe, Hände, Produkte und wichtige Beschriftung dürfen nicht ungewollt angeschnitten werden. Gruppenfotos brauchen ein breites oder natürliches Format; fertig beschnittene Bilder nicht nochmals pauschal in 4:5 zwingen. Zentrierung ist ein gestalterisches Ergebnis, kein universeller `object-position:center`-Ersatz für die Prüfung.
- Originale in Canva unverändert lassen. Nur lokale Web-Derivate optimieren: richtige Größe, natürliche Farben, keine Verzerrung, kein künstlicher KI-Look. Logos, Originalposter und datierte Handzettel sind Marken-/Werbemittel, keine dekorativen Ersatzfotos; vollständig und lesbar darstellen.
- Die Canva-Verbindung als redaktionelle Quelle eingerichtet lassen, nicht entfernen. Bei jedem Content-Lauf Lesefunktion und Exportzugang prüfen. Abgelaufene Anmeldung/Autorisierung konkret melden und vom Betreiber erneuern lassen; dauerhafte Verfügbarkeit nicht versprechen. Keine Account- oder Designänderungen und kein Login-Umgehen.
- Die Website verwendet geprüfte lokale Exporte, keine ablaufenden signierten Canva-Thumbnail-URLs und keine vom Besucher abhängigen Canva-Logins. Interne Herkunftsnachweise und Account-Metadaten nicht öffentlich ausgeben.
