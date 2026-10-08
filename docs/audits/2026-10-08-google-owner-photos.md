# Eigene Google-Profilfotos — Prüfung vom 08.10.2026

## Umfang und Freigabe

Auf Betreiberauftrag wurden 39 Einträge der öffentlich sichtbaren Google-Galerie „Vom Inhaber“ einschließlich Videos gesichtet und kategorisiert. Nicht alle Videos wurden abgespielt. Es wurde kein authentifizierter Google-Kontozugriff verwendet; Google und Canva blieben unverändert.

Acht geeignete Fotos wurden als lokale, metadatenbereinigte Vollbild-Derivate übernommen. Das vom Betreiber Justin zugeordnete Stapler-/Anlieferungsfoto ist vollständig ausgeschlossen, auch als Ausschnitt; es wurde nicht heruntergeladen. Das Drei-Personen-Verkostungsfoto blieb nach der Betreiberantwort zulässig, die ausschließlich das Staplerfoto ausschloss. Unbeschriftete Personen wurden nicht anhand ihrer Gesichter identifiziert.

## Einordnung und Darstellung

- **Startseite:** bestehende drei Entdeckungskarten erhalten; nur das Marktleben-Motiv durch die Verkostung ersetzt.
- **Marktleben:** sieben Fotos in drei Gruppen mit 2/3/2 Motiven; die beiden bisherigen Canva-Marktfotos bleiben. Neu: Verkostung, Desperados-Detail, Baileys-Aufbau, Bauernhof-Aufbau und Grillbegleiter.
- **Geschenkideen:** bisheriger Geschenkkorb erhalten, zwei Grußkartenfotos ergänzt.
- **Eigenmarken:** Foto der sechs Likörflaschen ergänzt, alle sechs bisherigen Originalposter erhalten.

Die neuen Fotos sind als Rückblicke aus 2025 gekennzeichnet. Sichtbare alte Preise werden nicht als aktuelle Preise ausgegeben; Marktleben weist ausdrücklich auf abweichendes Sortiment und die im Markt zu erfragende Verfügbarkeit hin. Die Bilder bleiben vollständig, unverzerrt und in natürlichen Proportionen. Die acht WebPs umfassen zusammen rund **856 KiB**.

## Herkunft, Datenschutz und Build

Öffentliche Renderdaten liegen in `data/google-market-photos.ts`, lokale WebPs unter `public/images/editorial/google/`. Acht bereinigte JPEG-Buildquellen und das Manifest unter `assets/source/google-market-photos/` dokumentieren Freigabebasis, Google-Betreiberherkunft, Maße, Vollbildausschnitt und SHA-256; sie enthalten keine privaten Quellen-URLs oder Fotoidentitäten. Google-Fotos werden nicht als Canva-verifiziert bezeichnet und nicht extern eingebettet.

Private Quellen-URLs, Fotoidentitäten, Exportnachweise und Rohdateien bleiben im Repository ausschließlich unter dem Git-ignorierten Verzeichnis `.superpowers/google-photos-2026-10-08/`. Dieses Verzeichnis gehört nicht ins Releasepaket. Der Deployment-Archivpfad wurde um die bereinigten Google-Buildquellen erweitert; sämtliche neuen Renderdaten, Quellen, Derivate und das Prüfskript müssen vor dem Release versioniert sein.

`scripts/build-google-market-assets.mjs` prüft Quellen- und Derivathashes, vollständige Ausschnitte, bereinigte Metadaten, Maße, Bytebudgets und die öffentliche Datei-Allowlist. `--check` rekonstruiert nur im Speicher und verändert keine Dateien. Die Prüfung ist in den Prebuild eingebunden.

## Verifikation und Review

Vom Hauptagenten bestätigt:

- `npm test`: 75 Testdateien und 1.251 Tests bestanden.
- Lint mit `--quiet`, Next-Typegen und TypeScript-Prüfung bestanden.
- Produktionsbuild, Google-Assetcheck für alle acht Fotos und Diffcheck bestanden.
- CUA-Prüfung bei 390 × 844 auf allen vier geänderten Routen (`/`, `/marktleben`, `/geschenkideen`, `/eigenmarke`): kein horizontaler Overflow, Bilder laden und behalten natürliche Proportionen.
- Desktop-Prüfung aller vier geänderten Routen bei 1.280 × 900 ebenfalls bestanden: kein horizontaler Overflow, alle neuen Motive laden in ihren natürlichen Proportionen. Die Browserkonsole meldete keine Fehler.
- Die betroffenen Routen wurden zusätzlich per lokalem HTTP-Aufruf auf die neuen Inhalte geprüft. Die angepasste E2E-Datei wurde in diesem Lauf nicht separat ausgeführt; die responsive Sichtprüfung erfolgte über CUA.

Die unabhängige, read-only Prüfung des aufgabenbezogenen Working Diffs ergab keine kritischen, wichtigen oder handlungsbedürftigen kleineren Befunde. Alle acht lokalen Motive wurden visuell geprüft; Google-Assetcheck und aufgabenbezogener Diffcheck wurden zusätzlich erfolgreich ausgeführt. Fremde Audit-Screenshots und die beiden nicht zugehörigen Audit-JSON-Dateien vom 30.09. waren ausdrücklich nicht Review-Gegenstand.

## Veröffentlichungsstatus

**Lokale Umsetzung geprüft; neues Deployment noch ausstehend.** Dieser Bericht bestätigt keine Veröffentlichung der Google-Fotos auf der Live-Website. Vor Freigabe ist der neue Commit gemäß Deployment-Runbook als versionierter Linux-Release zu bauen und anschließend öffentlich zu prüfen. `RENTAL_MODE=disabled` bleibt unverändert; keine externen Kontoänderungen, Nachrichten oder Transaktionen wurden vorgenommen.
