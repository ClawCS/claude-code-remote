# Lokale Filmvorschau mit einleitiger Jammers-Zapfanlage

## Freigabe und Umsetzung

Niko bestätigt die Größe und rechteckige Edelstahl-Bauform des gezeigten Beispielgeräts, ausdrücklich **einleitig** mit genau einem Hahn und Jammers-Logo auf der Rückseite. Das bearbeitete Standbild wurde anschließend mit »Ja, so ins Video übernehmen« freigegeben. Keine Behauptung, dass die illustrative Bauform ein fotografisch belegtes konkretes Mietgerät ist. Mietkatalog und Live-Seite bleiben unverändert.

Der Bildbearbeitungsworkflow erzeugte zunächst versehentlich zwei Griffe; erst die korrigierte Fassung mit einem einzelnen Griff wurde abgenommen und an den Videodienst gegeben. Eingaben, Prompts, Zwischenstände und Freigabe sind privat unter `.superpowers/hero-people-preview-2026-10-10/single-tap-keyframe-provenance.json` dokumentiert.

Runway-Aufgabe: `b6d193fe-f5c0-4133-b64f-f3f001d099d8`. In der Gartentotalen bleibt das einleitige rechteckige Gerät mit rückseitigem Logo sichtbar. Die zusätzliche generierte Geräte-Nahaufnahme verändert die Bauform; diese drei Sekunden wurden bewusst ausgeschlossen. Die finale lokale Fassung ist daher **15 statt 18 Sekunden** lang:

| Zeit | Schnittquelle |
| --- | --- |
| 0–4 s | Bisherige Anstoßszene, unveränderte Quelle |
| 4–7 s | Gartentotale mit einleitiger Jammers-Anlage |
| 7–11 s | Bestehende Eigenmarken-Einschenksequenz |
| 11–15 s | Bestehendes Finale mit sechs Flaschen und Gläsern |

Anstoß und letzte acht Sekunden wurden nicht neu generiert. Gesamtschnitt technisch neu encodiert; keine Byteidentität der abgeleiteten Segmente behaupten. Die bereits dokumentierten illustrativen Personen-/Kleidungskontinuitätsgrenzen des vorherigen Entwurfs bleiben bestehen. Das Logo ist im Bewegtbild erkennbar, jedoch keine pixelidentische Produktaufnahme.

## Dateien und Prüfung

- Neuer Film: `.superpowers/hero-people-preview-2026-10-10/.superpowers/brainstorm/44114-1791658740/content/jammers-hero-15s-v4.mp4`.
- 16.618.455 Bytes, SHA-256 `59a70d3ef71c8eef46396005b3242f2109e3570a46b286f1b7f3fadbe0cc81a2`.
- Native Exportprüfung: H.264, 1920 × 1080, 24 fps, exakt 15 s, keine Audiospur.
- Auswahl anhand extrahierter Einzelbilder; finales Anstoßen, Gartenszene, Einschenken und vollständiges Sechser-Finale kontrolliert.
- Lokaler Vorschauplayer auf Port 54251 lädt die neue v4-Datei. Wiedergabe/Pause und Sprünge auf Garten (4 s) bzw. Finale (11 s) geprüft. `duration=15`, `readyState=4`, seekable 0–15, kein Video-Fehler.
- Mobil bei 390 px: Film 354 × ca. 199 px, `object-fit: contain`, kein horizontaler Überlauf. Browsergröße anschließend zurückgesetzt. Keine erfassten Konsolenwarnungen/-fehler.
- Belege privat: `frames-final-v4/`, `preview-single-tap-desktop.png`, `preview-single-tap-mobile.png`; vollständiger Schnittnachweis in `single-tap-final-provenance.json`.

## Bereitstellung

Neue Fassung ausschließlich im getrennten lokalen, sitzungsgeschützten Player. Die eigentliche Homepage auf 3110 behält ihren bisherigen Hero-Film; das dort separat aktualisierte Eigenmarken-Gruppenfoto ist unter App-Commit `3470531` geprüft. Keine Änderung der App-Videos unter `public/videos/`, kein Deployment auf Hetzner, keine Betriebs-/Sicherheits-/Postfachänderung. Git-Synchronisation dieses Berichts ist keine Live-Veröffentlichung.
