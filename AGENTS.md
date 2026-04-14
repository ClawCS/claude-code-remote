<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sync-Workflow (MANDATORY — Variante A)

Niko arbeitet lokal auf seinem Mac (`/Users/niko/Desktop/Claude Code/trinkgut-jammers-v2`), Claude arbeitet in einer Remote-Sandbox (`/home/user/claude-code-remote`). Gemeinsamer Treffpunkt ist **GitHub (`origin`)**. Damit nie wieder verschiedene Versionen entstehen:

## Vor JEDEM neuen Auftrag:
1. **Claude zieht immer zuerst**: `git fetch origin && git merge origin/main --ff-only` (bzw. den aktiven Branch). Erst dann anfangen zu editieren.
2. Falls `--ff-only` fehlschlaegt → Niko hat lokal committed aber nicht gepusht. Nachfragen, nicht einfach mergen.

## Nach JEDER Aenderung durch Claude:
1. `git add` der geaenderten Dateien (keine `git add -A` wegen Secrets-Risiko)
2. `git commit -m "..."` mit klarer Message
3. `git push -u origin <branch>` — bei Network-Fehlern Retry mit Exponential Backoff (2s/4s/8s/16s)
4. Am Ende dem User sagen: **"Pull jetzt: `cd ~/Desktop/Claude\\ Code/trinkgut-jammers-v2 && git pull`"**

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
