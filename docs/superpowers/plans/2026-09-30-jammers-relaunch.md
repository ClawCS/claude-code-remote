# Jammers Relaunch – Implementation Plan

> Ausführung: Root implementiert sequenziell in der vorhandenen isolierten Worktree; Subagents prüfen lesend. Niko hat Ausführung und Push bestätigt.

**Goal:** Warmer Marktauftritt mit ehrlichem Reservierungsfluss und geprüftem Wochenprozess.
**Architecture:** Bestehende Next-App, ein datierter Inhaltsspeicher, Import und öffentliche Auswahl getrennt, lokale Codex-Wochenautomationen.
**Tech Stack:** Next 16, React 19, TypeScript, Vitest, Playwright, Canva read-only.
**Spec:** docs/superpowers/specs/2026-09-30-jammers-relaunch-design.md

## Global Constraints

- Zeitentscheidungen ausschließlich Europe/Berlin; Sonntag 17:00, tägliche Kontrolle 06:15.
- Canva und Instagram lesen/exportieren; keine Inhalte dort ändern.
- Keine abgelaufenen Angebote als aktuell, keine fiktive Bestellung.
- Bestehende Nutzeränderungen bewahren; nur auf dem aktiven Branch committen/pushen.

## Review Focus

- Sonntagsexport vor Montagsbeginn bleibt geplant.
- DST und ISO-Jahreswechsel ohne KW+1-Arithmetik.
- Quellen- oder Dateifehler überschreiben keine geprüften Pakete.
- Öffnen eines Entwurfs behauptet keinen Versand.
- Kein Live-Erfolg ohne geprüfte öffentliche Bereitstellung.

## Tasks

- [x] Sicherheitsabhängigkeiten in package.json/lock aktualisieren und Produktionsaudit prüfen.
- [x] lib/editorial-schedule.ts auf 17:00 umstellen, aktive Woche separat bestimmen; Grenztests.
- [x] Offizielle Kataloge versioniert speichern; Datenmodell und Prüfungen für lokale Canva-Flyer mit Datum und SHA-256 einrichten.
- [x] scripts/content-weekly.ts für Import, Integritätsprüfung und Laufbericht ergänzen.
- [x] /handzettel und /angebote an die gemeinsame datierte Quelle anbinden.
- [x] Sonntagslauf und tägliche Prüfung im bestehenden Chat aktivieren; Laufanleitung dokumentieren.
- [x] Checkout, Bestellungen und Merkliste auf unverbindliche Anfrage umstellen; lokale PII-Altschlüssel entfernen.
- [x] Warme Homepage, Original-Logo, klarere Reihenfolge und GrailBid-Verbindung umsetzen.
- [x] Technische Funde zu Datenschutz, Altaktionen, API-Sicherheit und Metadaten bearbeiten.
- [x] Build, Typprüfung, 330 Einzeltests, 49 Browserprüfungen und frischer Code-Review.
- [ ] Canva-Browseranmeldung abschließen und originale datierte Exporte einspielen.
- [ ] Öffentliche Bereitstellung auf bestätigter Produktionsadresse prüfen.
- [ ] Betreiberangaben und rechtliche sowie niederländische Texte abschließend freigeben lassen.

Integration: gezielter Commit und Push auf dem bereits freigegebenen Branch `codex/cinematic-production`; keine automatische Zusammenführung mit main und keine Löschung der Vorschau-Worktree. Der Abnahmebericht dokumentiert die technischen Ergebnisse und offenen Freigaben.
