<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Browser auto-refresh workflow (MANDATORY)

Nach jeder Code-Aenderung an UI/Seiten (`app/**`, `components/**`, `lib/**`, `public/**`, `styles/**`, `*.css`) muss Claude:

1. **Dev-Server laufen lassen** — pruefen ob `http://localhost:3000` antwortet (`curl -sf -o /dev/null -m 3 http://localhost:3000/`). Laeuft er nicht, via `nohup npx next dev -p 3000 > /tmp/next-dev.log 2>&1 &` + `disown` starten und warten bis HTTP 200.
2. **Geaenderte Route verifizieren** — nach dem Edit die betroffene URL mit `curl -s http://localhost:3000/<pfad> | head -40` anfragen und bestaetigen, dass die neuen Strings/Elemente im HTML enthalten sind. **Nicht "fertig" melden ohne diesen Check.**
3. **Hard-Refresh-Hinweis** — dem User am Ende jeder UI-Aenderung klar sagen: "Im Browser bitte Strg+Shift+R (Mac: Cmd+Shift+R) druecken, damit der Cache bypasst wird." HMR liefert das Update automatisch, aber ein zwischengespeicherter Service-Worker oder Tab-Cache kann veraltete Assets zeigen.
4. **Hook-Backup** — `.claude/settings.json` enthaelt einen PostToolUse-Hook, der nach jedem Write/Edit auf Code-Dateien `localhost:3000` pingt, um Turbopack-Recompile + HMR-Push zu triggern. Der Hook ersetzt den manuellen Check NICHT — er beschleunigt ihn nur.

Gilt fuer alle UI-/Seiten-Aenderungen. Reine Doku-/Konfig-Edits sind ausgenommen.
