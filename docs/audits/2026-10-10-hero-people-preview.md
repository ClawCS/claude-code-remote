# Lokale Filmvorschau: Anstoßen, Gartenrunde und Eigenmarken

## Auftrag und Grenze

Niko hat die nächste **lokale Videovorschau ohne Änderung der Live-Seite** ausdrücklich beauftragt. Neue illustrative Gartenszenen wurden über den verbundenen Runway-Account erstellt. Keine echten Mitarbeiter-/Marktaufnahmen und keine Zusicherung eines bestimmten Leihgerätemodells.

Die Website-Quellen, die bestehenden Hero-Dateien in `public/videos/` und der Hetzner-Release wurden nicht verändert. Auch die laufende lokale Homepage-Vorschau auf Port 3110 enthält weiterhin den bisherigen Film. Diese Fassung liegt ausschließlich in einer getrennten lokalen Vorschau; keine Veröffentlichung oder Betriebsaktivierung.

## Schnitt

| Zeit | Inhalt |
| --- | --- |
| 0–4 s | Erwachsene Gäste stoßen im warmen Abendlicht an |
| 4–7 s | Gartenrunde am Tisch mit sichtbarer Zapfanlage |
| 7–10 s | Detail der Zapfanlage und eines Bierglases |
| 10–14 s | Bestehende Einschenksequenz |
| 14–18 s | Bestehendes Finale mit sechs Eigenmarken |

Die letzten acht Sekunden stammen aus dem bereits akzeptierten 15-Sekunden-Film, Quellbereich 7–15 s. Keine neue Generierung, kein neuer Zoom und kein Beschnitt des Finales; technisch erneut als Gesamtfilm encodiert, daher keine Byteidentität des abgeleiteten Ausschnitts behauptet.

## Herkunft und lokale Ablage

- Arbeitsverzeichnis: `.superpowers/hero-people-preview-2026-10-10/` (ignoriert, nicht im öffentlichen Git-Repository).
- Vollständige Prompts, Freigabe, Quelldateien, Einzelbilder und Herkunft: dort in `provenance.json`, `opening-source.mp4`, `frames-opening/` und `frames-final/`.
- Gewählte Runway-Aufgabe: `c3cff79c-87fc-47b2-a6df-147cb7579339`.
- Erste Aufgabe `0717fb9a-8962-4aed-a87f-542a41f442e1` nicht verwendet: Anbieter kürzte die langen Einzelprompts auf 500 Zeichen und entfernte dabei die eigentlichen Szenenanweisungen. Die vollständigen korrigierten Prompts blieben unter dieser Grenze und wurden in den Task-Optionen überprüft.
- Film: `.superpowers/hero-people-preview-2026-10-10/.superpowers/brainstorm/44114-1791658740/content/jammers-hero-18s-v3.mp4`.
- Metadaten: H.264, 1920 × 1080, 24 fps, exakt 18,000 s, ohne Audiospur; 21.307.331 Bytes.
- Film-SHA-256: `cdf08094f4e268154ba0f07a963d70b0e52510a53e9990ecf7e514184aab98ee`.
- Neues Original-SHA-256: `03c51ead20d886543a7f856100df022613315ba45314c0c4b145d94b5cdf8cd9`.
- Bisheriger 15-s-Film-SHA-256: `dfb37e4e0ea987dce428afeaf93eb2c3030849603901264967671141289202c7`.

Keine signierten Medien-URLs, lokalen Sitzungsschlüssel oder privaten Zugangsdaten in diesem Bericht.

## Prüfungen

- AVFoundation-Export prüft H.264, Auflösung, 24 fps, 18 Sekunden und fehlende Audiospur: bestanden.
- Zehn Einzelbilder des neuen Einstiegs und sieben Bilder des Gesamtschnitts geprüft. Einschenken sowie alle sechs Flaschen und Gläser am Ende vollständig sichtbar.
- Unabhängige Sichtprüfung des Einstiegs ohne wesentliche Anatomie-/Glasfehler in den untersuchten Bildern. **Verbleibende Entwurfsgrenze:** Ein männlicher Gast hat zwischen Anstoß- und Tischszene abweichende Haar-/Kleidungsdarstellung. Keine perfekte Personen-/Kleidungskontinuität behaupten; vor endgültiger Filmübernahme gestalterisch abnehmen.
- Browser: Wiedergabe, Pause und Szenensprung zum Finale funktionieren; `duration=18`, `videoWidth=1920`, `videoHeight=1080`, `readyState=4`, `error=null`, seekable 0–18 s.
- 390-px-Prüfung: Dokumentbreite 390 px, Video 354 × 199,125 px, vollständiges Querformat und kein horizontaler Überlauf. Temporäre Browsergrößenänderung anschließend zurückgesetzt.
- Keine erfassten Browser-Konsolenwarnungen/-fehler. Screenshots privat im Arbeitsverzeichnis.
- Der ursprüngliche lokale Begleitserver bot keine Byte-Range-Auslieferung, wodurch Szenensprünge auf 0 zurückfielen. Ausschließlich eine private Kopie des Begleitservers um korrekten MP4-Typ, Content-Length und Byte-Range ergänzt. Authentifizierung und Loopback-Bindung bleiben erhalten; Plugin-Dateien unverändert. Geprüft: anonym 403, authentifizierter Teilabruf 206 mit korrekten Bytes, Suffixabruf, ungültiger Bereich 416 sowie erfolgreicher Browser-Sprung auf 14 s.
- Bestehende App-Videos unverändert: Desktop `f74801aa87f6c6545ad8eb7b404e801d059f2441ff304617e5f9cf598909739c`, Mobil `db6b240fee5bef822bedfc4f98f6a5dde86a9cf403917df9b48a3768fca4a3ac`.

## Bereitstellung

Lokaler, sitzungsgeschützter Vorschau-Player auf Loopback-Port 54251, maximal vier Stunden ohne Aktivität. Medien bleiben danach auf dem Mac gespeichert. Die vorhandene öffentliche Website bleibt unverändert. Ein Git-Push dieses Berichts ist ausdrücklich kein Website-Deployment.
