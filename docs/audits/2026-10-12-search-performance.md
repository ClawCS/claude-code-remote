# Search-Abschluss: Medien, Schrift und Client-Payload

Lokale Task-3-Abnahme vom 12.10.2026. Gesamtgate, Linux-Release und öffentliche HTTPS-Abnahme bleiben beim Controller; keine Feld-CWV-, Ranking- oder KI-Zitatgarantie.

## Übernommen

Der vollständige mobile Film sinkt von **2.316.048 auf 980.962 Bytes (−57,6 %)**. 960×540, 24 fps, alle 360 Frames, 15 Sekunden, Stille und Szenenfolge bleiben erhalten. Mechanische FFmpeg-Transkodierung des unveränderten freigegebenen v4-Masters, keine Generierung, Retusche oder Beschneidung. Desktopfilm und vollständiges Poster sind bytegleich; alle Originale und bisherigen Derivate bleiben erhalten.

Sieben exakt geprüfte Medien-/Schriftpfade enthalten ihre SHA-256-Version und liefern `public, max-age=31536000, immutable`. Keine pauschale Erweiterung auf Videos, Handzettel, mutable Manifeste oder geschützte/operative Routen.

Cart/Wishlist sind statisch an die fünf tatsächlichen Konsumenten `/finder`, `/vermietung`, `/warenkorb`, `/merkzettel`, `/checkout` gebunden; Metadaten unverändert. Geschlossene Drawers werden nicht geladen. Geöffnete Drawers bleiben durch ein Portal außerhalb von `main` in ihrer ursprünglichen DOM-Umgebung und innerhalb der tatsächlichen React-Provider. Gewöhnliche, Karriere-, Bewerbungs- und Verwaltungsseiten initialisieren keine Katalogprovider. Die globale Bereinigung genau der bisherigen sieben stillgelegten persönlichen Speicherschlüssel bleibt idempotent und bei gesperrtem Storage fehlertolerant; andere Schlüssel bleiben erhalten.

Die vier bestehenden Plus-Jakarta-Sans-WOFF2-Dateien werden unverändert lokal geliefert. Familie, Normalstil, Unicode-Subsets, Gewichte 400/500/600/700/800 und Arial-Ausgleichsmetriken bleiben erhalten. Fontkit bestätigte in jedem Original die variable Achse 200–800. SIL-OFL-Lizenz und bereinigte Provenienz liegen bei. Kein Schriftneudesign, keine neue Abhängigkeit und kein Google-Font-Abruf beim Build. Dies umgeht die entfernte Build-Abhängigkeit, behauptet keinen reparierten Next-Upstreamfehler.

## Messprotokoll und Ergebnis

BASE `1abb8448d5ab5a23c03217a9ed4322ba017e489b`. Eigene Produktionskopien mit echter Uhr, `RENTAL_MODE=disabled`, ohne Testuhr: A unverändert, B verworfener dynamischer Rootprovider, C statische Routenprovider, D zusätzlich enger Prefetch-/Portal-Fix. Dev3000, `.next-dev`, primärer `.next` und fremde Arbeitsbereiche unverändert.

A/C: sechs Routen × 390×844/1440×900 × drei neue Kontexte × kalter und wiederholter Aufruf = je 72 Beobachtungen. D wurde frisch gebaut und `/produkte` in derselben 12-Beobachtungen-Matrix gezielt nachgemessen. Andere Tabellenwerte stammen ausdrücklich aus C, nicht aus einem erfundenen vollständigen D-Lauf. Transfer enthält Browser-Headerbuchung; dekodierte JS-Körper getrennt. Optimierer-Servercache nicht gelöscht; beobachtete spekulative Routenlast mitgezählt.

| Route | Kalter JS-Transfer A → Kandidat, Bytes | Änderung | Dekodiertes JS A → Kandidat, Bytes |
| --- | ---: | ---: | ---: |
| `/` (C) | 170.394 → 157.185 | −7,8 % | 571.753 → 512.881 |
| `/nl` (C) | 167.353 → 154.099 | −7,9 % | 562.855 → 503.924 |
| `/angebote` (C) | 174.822 → 154.099 | −11,9 % | 582.327 → 503.924 |
| `/produkte` (D) | 186.234 → 164.424 | −11,7 % | 617.152 → 557.481 |
| `/finder` (C) | 180.176 → 172.891 | −4,0 % | 600.591 → 580.222 |
| `/warenkorb` (C) | 175.834 → 168.545 | −4,1 % | 586.251 → 565.885 |

Transfermediane in beiden Viewports gleich. Font-Ersttransfer unverändert 27.572 Bytes (27.272 Body + 300 Buchung). Kalter Filmtransfer mobil 2.316.348 → 981.262, Desktop unverändert 4.785.665. Wiederholte JS-/Font-/Video-Transfers waren in A und C/D jeweils null: **kein zusätzlich bewiesener Wiederholungsgewinn gegenüber A**. Der bessere Cachevertrag ist durch tatsächliche GET-Header nachgewiesen.

Ungedrosselte LCP-Änderungen sind kleine Laborbeobachtungen, kein allgemeiner Geschwindigkeitsnachweis. Produktseite im gezielten D-Vergleich: mobil 64 → 68 ms, Desktop 76 → 80 ms; +4 ms wird nicht als Beschleunigung ausgegeben. Beobachtete CLS-Summen nicht materiell regressiert; keine vollständige Feld-CWV-Sessionfensterberechnung.

Zusätzlicher 390×844-Labortest A/C, je drei kalte plus warme Wiederholungen: CDP 150 ms Latenz, 1,6 Mbit/s Download, 0,75 Mbit/s Upload, 4× CPU-Verlangsamung. Kalter Median-LCP 2.824 → 2.756 ms, `loadEventEnd` 3.247 → 3.016 ms; warm LCP 376 → 252 ms, Load 378 → 325 ms. Kalte CLS-Summe 0,018974 → 0,018996, warm unverändert 0,002872. Kein echtes Mobilgerät/Feldmessnachweis; Byte- und Zeiteffekte getrennt.

## Qualität und Bedienung

FFmpeg 6.0/libx264, `veryslow`, CRF 28.25, vollständiger Lanczos-Downscale direkt vom Master, H.264 High/yuv420p, Fast-start, `map_metadata -1`. Technische Container-/Encoder-Tags bleiben, keine privaten Quellmetadaten. Gegen das alte Mobilvideo: SSIM 0,973944, mittlerer VMAF 90,599. Fünf tatsächlich dekodierte identische Zeitpunkte 2/5/9/12,5/14 Sekunden nebeneinander betrachtet: Personen, einzelne Zapfanlage, Jammers-Logo, sechs Flaschen/Namen und vollständiges Finale erhalten. Echte mobile Seitenwiedergabe visuell geprüft; keine pixelidentische Filmqualität behauptet.

Zwölf A/C-Ganzseitenaufnahmen: gleiche Maße/Text, **null unterschiedliche RGBA-Kanäle**. Zwei abschließende A/D-Produktseitenaufnahmen ebenso exakt gleich. Native Breiten des identischen DE-Textsamples bei 32 px für alle fünf Gewichte exakt gleich. Vier WOFF2-GETs: 200, `font/woff2`, Originalhash. MP4/Poster: komplette GETs, richtige Typen, gebundene Hashes.

Echte Quellenwahl/Playback/Play-Pause, Reduced-motion/Save-data-Poster ohne passive MP4-Anfrage, explizites Play, Desktop-Fokus/Inert-Finale, mobile Copy und Fallback geprüft. Finaler Mietdrawer bei 390/1440: Tab-Fang, Escape, bestehender Fokusfallback, Scrollfreigabe, identische A/D-Dialogpixel; Auswahl über Kontakt → Warenkorb → Checkout erhalten. Keine Anfrage versendet und keine operative Aktivierung.

## Verworfene Kandidaten und Prüfgrenzen

- B dynamischer Rootprovider: Finder +33.801 Transferbytes/+160.174 dekodierte Bytes, Warenkorb +20.201/+100.422; Finder-Desktop-LCP 48 → 356 ms. Beide neuen Produktionsbytegates rot; Architektur verworfen.
- C-Produktseite +956 Transferbytes (+0,51 %), weil der sichtbare Finder-Link seine nun routengebundene Last spekulativ vorlud. Nur `prefetch={false}` an diesem Link geändert, Inhalt/Filter unverändert; D-Ergebnis in Tabelle.
- Drawer innerhalb `main`: tatsächliche 2-px-Zeilenhöhenabweichung, 61.498/64.458 geänderte Kanäle. Null-Differenz-Check vor Korrektur rot. Finales Portal stellt ursprüngliche Umgebung und null abweichende Dialogpixel wieder her.
- CRF28/slow 1.074.547 Bytes und CRF28/veryslow 1.013.560 überschritten 1 MB. CRF29/slow 944.750 war kleiner, aber schwächer (VMAF 89,786); qualitätsstärkere finale Variante übernommen.
- Zwei frühe Vitest-Filter erfassten private Baseline-Duplikate; kein grüner Gesamtgate. Korrekte fokussierte Läufe schließen `.superpowers/**` aus. Ein früher Framework-Harness musste Tailwind/server-only korrekt isolieren. Der Drawer-Harness wartete anfangs auf absichtlich lazy gelassene Offscreenbilder und erwartete den deaktivierten Opener statt des vorhandenen Fokusfallbacks; Harness korrigiert, nicht die Anwendung.

Frische isolierte Produktionsbuilds A/B/C/D bestanden; finaler D-Build `1KWfWgv9Z9nzKu725AtOH`. Finaler fokussierter Unitgate **131 Tests/10 Dateien**, echtes Chromium für Provider/Film plus bestehende Cart-/Inquiry-/Originalmedienprüfungen. Fokussiertes ESLint und Diff-Whitespaceprüfung ohne Fehler. C-Homepageproduktion **6/6**; D-Finder-/Cart-Bytegate und Drawer-Typografie/Fokus **3/3**. Header-/Provider-/Privacy-/Bytegrenzen mit dokumentiertem RED→GREEN abgesichert.

Private Messungen, verworfene Läufe, Framepaare und Screenshots: `.superpowers/sdd/2026-10-12-search-completion/performance/`. Kein System-/Projektpaket installiert; FFmpeg nur eigener privater temporärer Encoder. Keine Original-/historischen Medien, Angebote, externen Designs oder Sicherheits-/DNS-/Mail-/Upload-/Miet-/Zahlungs-/Löschbetriebs-Konfiguration verändert. Eigene Vorschauprozesse nach Abnahme beendet. Öffentliche Veröffentlichung durch diesen Bericht noch nicht bestätigt.

## Finale integrierte Produktionsqualifikation

Nach dem abschließenden Controller-Build wurde der unveränderte Messablauf erneut mit Kennung **FINAL** ausgeführt: sechs Routen × zwei Viewports × drei neue Browserkontexte × kalter und wiederholter Aufruf = **72 vollständige Beobachtungen**, dazu zwölf private Ganzseitenaufnahmen. FINAL ist der integrierte Stand einschließlich redaktioneller Quellen-/Angebotsdaten, Karriereinhalten und browserseitiger Sessionlisten-Hooks; Build-ID `5qMAaN-6uv_5fl0flbju8`. Vergleichsbasis bleiben die gespeicherten 72 A-Beobachtungen. Die früheren C-/D-Nachweise oben bleiben eigenständige historische Kandidatenprüfungen und werden nicht durch diesen Lauf ersetzt.

| Route | Kalter JS-Transfer A → FINAL, Bytes | Änderung | Dekodiertes JS A → FINAL, Bytes |
| --- | ---: | ---: | ---: |
| `/` | 170.394 → 157.170 | −7,8 % | 571.753 → 512.877 |
| `/nl` | 167.353 → 154.087 | −7,9 % | 562.855 → 503.920 |
| `/angebote` | 174.822 → 154.087 | −11,9 % | 582.327 → 503.920 |
| `/produkte` | 186.234 → 164.416 | −11,7 % | 617.152 → 557.474 |
| `/finder` | 180.176 → 173.212 | −3,9 % | 600.591 → 580.758 |
| `/warenkorb` | 175.834 → 168.880 | −4,0 % | 586.251 → 566.475 |

Die kalten Transfermediane sind in beiden Viewports gleich. Finder/Cart liegen gegenüber C um 321/335 Transferbytes und 536/590 dekodierte Bytes höher, bleiben gegenüber A jedoch um 6.964/6.954 Transferbytes kleiner. Keine materielle JS-Byteverschlechterung gegenüber A. Alle 36 Wiederholungen liefern weiterhin null JS-/Font-/MP4-Transferbytes, ohne einen zusätzlichen Gewinn gegenüber dem schon warmen A zu behaupten. Font-Ersttransfer bleibt 27.572 Bytes; mobiler MP4-Ersttransfer bleibt 981.262 statt 2.316.348 Bytes, Desktop 4.785.665 unverändert. Keine Browser-`pageerror`, kein horizontaler Überlauf und kein Fontstatus `error` in den 72 Beobachtungen; nicht benötigte Unicode-Fontfaces bleiben erwartungsgemäß ungeladen.

| Route | Kalter Median-LCP mobil A → FINAL, ms | Kalter Median-LCP Desktop A → FINAL, ms | Wiederholter Median-LCP mobil / Desktop A → FINAL, ms |
| --- | ---: | ---: | ---: |
| `/` | 64 → 72 | 92 → 96 | 68 → 64 / 76 → 80 |
| `/nl` | 44 → 48 | 56 → 48 | 36 → 32 / 44 → 40 |
| `/angebote` | 68 → 68 | 88 → 92 | 36 → 28 / 44 → 32 |
| `/produkte` | 64 → 76 | 76 → 84 | 60 → 68 / 68 → 68 |
| `/finder` | 36 → 40 | 48 → 48 | 24 → 16 / 36 → 28 |
| `/warenkorb` | 32 → 36 | 44 → 48 | 24 → 24 / 36 → 24 |

Höchster einzelner LCP dieses FINAL-Laufs: 108 ms. Die zwölf kalten CLS-Mediane sind jeweils gleich A; keine vollständige Feld-CWV-Sessionfensterberechnung. Der Anfang dieses FINAL-Laufs überlappte laut Controller mit dessen vollständigem HTTP-Audit. Die ungedrosselten Laufzeiten sind daher insbesondere bei den frühen Stichproben nicht kontrolliert und weder ein Feldgeschwindigkeitsnachweis noch eine allgemeine Timing-Regressionsgarantie. Ein separater Homepagegate des Controllers hatte während gleichzeitiger Auditlast zunächst 1.808 ms und damit einen roten 1.500-ms-Test; der unveränderte isolierte Wiederholungsgate lag bei 80/76/72 ms und 3/3 bestandenen Fällen. Diese fremden Gatewerte sind ausdrücklich Controller-Nachweise, keine weiteren Messpunkte der FINAL-Matrix.

Die sechs FINAL-Aufnahmen von Homepage, NL und Cart sind jeweils exakt pixelgleich A. Ein pauschaler Null-Differenz-Nachweis für alle zwölf FINAL-Aufnahmen wird **nicht** behauptet: Produktseiten enthalten jetzt die freigegebenen Originalpreis-/Mengenangaben (Textmenge und Seitenhöhe entsprechend größer). Die Angebote-Texte sind gleich, die Höhen dagegen 3.149 → 3.219 px mobil und 2.497 → 2.535 px Desktop. Ein frischer rein lesender Abruf der noch aktuellen öffentlichen Angebotsseite bestätigt jeweils FINAL-Höhe und FINAL-Text. Finder ist 2.169 → 2.120 px mobil beziehungsweise 1.545 → 1.529 px Desktop: Der private A-Build hatte die schon vorhandenen Tailwind-Utilityklassen seiner Kartenlabels nicht ausgeliefert. A zeigte 16 px/400, normale Schreibweise, Inline und keinen unteren Abstand; FINAL sowie die noch aktuelle öffentliche Finderseite zeigen identisch 12 px/600, 16 px Zeilenhöhe, Großschreibung, Block, 16 px unteren Abstand und 0,3 px Buchstabenabstand. Die unveränderte Quellmarkierung und öffentliche Gegenprüfung machen A für dieses CSS-Detail unrepräsentativ; daraus folgt kein belegter Live-Renderfehler und kein Auftrag zum Stilumbau. Die rein private A/C-Pixelgleichheit oben bleibt eine Aussage über diese isolierten Builds, nicht über jede Utilityklasse der veröffentlichten Seite.

FINAL-JSON, Vergleichs-JSON, zwölf Screenshots und öffentliche Stil-Gegenprüfung bleiben ausschließlich im privaten Evidenzverzeichnis. Diese Nachqualifikation änderte nur den vorliegenden Auditnachtrag und private Nachweise: kein Anwendungs-/Inhaltscode, kein Neubuild, keine Git-Operation und kein Start/Stop der Controller-Prozesse auf 3113/3117. Veröffentlichung und abschließende öffentliche Releaseabnahme bleiben beim Controller.
