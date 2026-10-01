# Trinkgut Jammers Goch

Websiteprojekt mit lokalem Marktauftritt, Sortiment, Wochenwerbung, Marktleben, Gewinnspielen, Cocktailrezepten und unverbindlichen Leihanfragen.

Stand 1. Oktober 2026: **Der öffentliche Server ist noch nicht online.** GitHub sichert den Entwicklungsstand, nicht eine Live-Veröffentlichung. Onlinezahlung, verbindlicher Mietcheckout und automatischer Rechnungs-/Lieferscheinversand sind angefragt, aber noch nicht umgesetzt oder freigegeben.

## Aktueller Stand und Aufgaben

- [Projektstand](docs/PROJECT-STATUS.md)
- [30 offene Betreiberfragen](docs/OFFENE-FRAGEN.md)
- [Nächste Arbeitsschritte](docs/TODO-NAECHSTE-SESSION.md)
- [Wochenwerbung und Prüfprozess](docs/CONTENT-UPDATE-RUNBOOK.md)
- [Mietcheckout-Entwurf](docs/superpowers/specs/2026-09-30-rental-order-design.md)
- [Synchronisationsbericht vom 1. Oktober](docs/audits/2026-10-01-project-sync.md)

Arbeitsverzeichnis: `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`, Branch `codex/cinematic-production`. Der übergeordnete Checkout auf einem anderen Branch und der archivierte Claude-Code-Pfad sind nicht dieser Arbeitsstand.

## Lokal entwickeln und prüfen

```sh
npm ci
npm run dev
```

Die lokale Standardadresse ist `http://localhost:3000`; ein tatsächlich laufender Prozess und freie Ports müssen geprüft werden. Nicht eigenmächtig fremde Server beenden.

```sh
npm test
npm run lint -- --quiet
npx tsc --noEmit
npm run build
```

Ein Build prüft zusätzlich die lokalen Content-/Bildquellen. Zeitgesteuerte Werbung und vollständige Originalexporte nach dem Runbook prüfen; isolierte Browserfixtures sind kein Live-Nachweis.

## Quellen und Sicherung

Nur belegte Canva-Fotos verwenden; Canva und Instagram unverändert lassen. Fehlende Originale oder Freigaben nicht durch KI-/Stockmotive ersetzen. Private Originale/Herkunftsnachweise und Zugangsdaten nicht ins öffentliche Repository committen.

GitHub versioniert freigegebene Projektdateien. Private Canva-Originale benötigen eine zusätzliche lokale Sicherung. Veröffentlichung, kostenpflichtige Anbieter und Livezahlungen erfolgen erst nach den jeweils konkreten Freigaben.
