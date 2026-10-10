# Freigegebenes Design A: Filmisch & nahbar

## Auftrag und Freigabe

Niko hat den lokalen Entwurf A mit dem 15-Sekunden-Film betrachtet (»wirkt jetzt geil«) und anschließend den echten Design-Umbau beauftragt (»ok starte den design Umbau wie jetzt besprochen«). Die Richtung ist entschieden; keine neue A/B/C-Auswahl. Referenz ist `.superpowers/brainstorm/88954-1791640434/content/jammers-directions.html`, nicht dessen vereinfachter Datenbestand.

## Gestaltung

- Warmer, filmischer Einstieg: »Goch schenkt ein.«; Getränke, Partyservice und sechs eigene Liköre im Schlussmotiv.
- Große Bildflächen, ruhige fast weiße Hintergründe, dunkle gut lesbare Typografie und gezieltes Trinkgut-Rot. Kein Neon, keine künstlichen Glasscheiben, keine überladene Animation.
- Desktop: vollständiger 16:9-Film mit links darüberliegendem Einstieg. Schlussmotiv muss alle sechs Flaschen/Gläser zeigen. Text darf beim Finale ausblenden, aber nie während Fokus darin liegt; keine unsichtbaren fokussierbaren Links.
- Mobil: Text oberhalb des vollständig sichtbaren 16:9-Films, keine beschnittenen Flaschen. Standbild ohne Layoutsprung.
- Direkt darunter klare Einstiege für aktuelle Angebote, Partyplanung und Besuch. Routenlinks behalten das bestätigte offizielle Maps-Symbol.
- DE/NL-Handzettel gleichwertig nebeneinander, mobil untereinander, unverändert vollständige datierte Originale mit funktionierendem Viewer.
- Partyservice als große redaktionelle Bild-/Textfläche mit bereits freigegebenem passendem Marktbild. Alle bestehenden Serviceinformationen bleiben erreichbar.
- Sortiment, Eigenmarken, Gewinnspiele, Menschen, Marktleben, GrailBid, Instagram und Kontakt bleiben erhalten. Ruhigere Abstände und weniger dekorative Rahmen, ohne Inhalte stillschweigend zu entfernen.
- Gemeinsame Navigation/Footer harmonisieren die Unterseiten. Alle neun Hauptgruppen, Team & Karriere, Akademie/Cocktails, sichtbarer orangefarbener NL-Einstieg und Originalkontaktlogos bleiben erhalten. Fachformulare werden nicht neu gebaut.

## Film und Ladeverhalten

Ausdrücklich beauftragte neue Ausnahme zur Bildregel: KI-Werbefilm aus dem akzeptierten Entwurf; kein dokumentarisches Marktfoto. Dezente sichtbare Kennzeichnung »KI-Werbefilm · beispielhafte Partyszene« sowie zugängliche Beschreibung. Keine neue Generierung und keine fremden Markenreferenzen kopieren.

Quelle: `jammers-hero-15s-v2.mp4`, 15 Sekunden, 1920×1080, 24fps, ohne Ton. Das abgelehnte animierte Finale mit verändertem Alkoholgehalt darf nicht verwendet werden. Das akzeptierte Finale verwendet ein stehendes KI-Motiv mit minimalem Zoom; es ist keine pixelidentische Produktaufnahme.

Optimierte lokale MP4-Derivate (Desktop Ziel ≤6 MB, mobil ≤3 MB), vollständiges Poster und sanitisiertes Herkunftsmanifest. Keine externen Video-/Trackingdienste. Dateihashes und Dauer dokumentieren. Standbild zuerst; automatisches Laden/Starten erst nach Hydrierung und positiver Bewegungs-/Datensparprüfung. Bei reduced-motion oder saveData kein automatischer Videodownload; manuelles Abspielen möglich. Eindeutig zugängliche Play/Pause-Steuerung, Pause außerhalb des Sichtfelds und im Hintergrund, Fehlerfallback. Manuelles Pausieren respektieren. Ohne JavaScript bleiben Bild, Text und Links verwendbar.

## Unveränderte Geschäfts- und Inhaltsgrenzen

`getHomepageContent`, reale Berliner Gültigkeiten, APIs, alle Wochenpakete und Angebote bleiben unverändert. Keine hartcodierte KW41 aus der Vorschau. Keine Aktivierung von Bewerbung, SMTP, Löschung, Zahlungen oder Mietbestellungen. Keine Sicherheits-/Hosting-/Provideränderungen. Keine ausgeschlossenen Personenfotos, alten Gruppenbilder oder Weiterbildungsaussagen wieder aufnehmen. Eigene fremde Arbeitsänderungen bleiben unangetastet.

## Abnahme

Niko hat während der Umsetzung ausdrücklich »Zuerst lokal ansehen« gewählt. Kein öffentlicher Designrelease in diesem Auftragsschritt.

Funktions- und Datentests, TypeScript/Lint/Build sowie Browserprüfung auf 390px, 768px und 1440px. Video inklusive Finale, Tastatur, reduzierte Bewegung, Datensparen, Fehlerfallback und alle Navigationseinstiege prüfen. Gesamten lokalen Entwurf auf dem echten Next.js zeigen, nicht nur die Designstudie. Änderungen auf bestehendem Branch sichern/pushen. Öffentliche Umschaltung getrennt behandeln; diese Umsetzung veröffentlicht nicht ungeprüft einen umfassenden visuellen Umbau.
