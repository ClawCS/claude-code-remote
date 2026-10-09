# Bewerbungsunterlagen: bereinigte PDF-Kopien, JPG und PNG

Datum: 09.10.2026. **Schriftliche Ergänzung vom Betreiber mit „ergänzung passt, führe aUS“ bestätigt; noch keine technische Umsetzung oder Live-Aktivierung.** Niko hatte die Richtung mit „Bereinigte PDF-Kopien ausarbeiten und jpg/png“ gewählt. Der bereits genehmigte [Gesamtentwurf](2026-10-09-application-upload-design.md) und die gewählte subagentengestützte Ausführung bleiben bestehen. Dieser Nachtrag ändert ausschließlich die Behandlung der Dokumentanhänge und deren unmittelbar notwendige Schnittstellen, Hinweise und Tests. Der [gezielte Plan-Nachtrag](../plans/2026-10-09-application-document-reconstruction.md) konkretisiert die Umsetzung.

## 1. Ergebnis für Bewerber und Markt

- Bewerber können weiterhin **PDF, JPG/JPEG und PNG** hochladen. Unterlagen und Portrait bleiben freiwillig. Empfänger bleibt `info@trinkgut-jammers.de`.
- Von jeder PDF wird eine neue, bildbasierte PDF-Kopie erstellt: alle zugelassenen Seiten in Reihenfolge, vollständig und mit richtiger Ausrichtung. Keine Original-PDF wird als Anhang weitergeleitet.
- JPG/PNG werden vollständig dekodiert und als neue Bilddatei ohne übernommene private Metadaten gespeichert. Kein Beschneiden, Retuschieren, Schärfen, KI-Einsatz oder Ändern von Personen. Das ist eine zusätzlich vorgeschlagene technische Bereinigung, kein Bildgestaltungsauftrag.
- Der Markt erhält nur das vollständig geprüfte Versandpaket. Scheitert eine Datei, wird **nicht** heimlich eine unvollständige Bewerbung versandt. Der Besucher erhält einen verständlichen Status mit Referenz und Kontaktweg.

Die Umwandlung reduziert bestimmte Risiken aktiver/versteckter Dateistrukturen. Sie ist keine Garantie gegen sämtliche Sicherheitslücken, irreführende sichtbare Inhalte oder missbräuchliche Bewerbungen. Unterlagen gehen weder an KI-Dienste noch an öffentliche Prüf-/Konvertierungsdienste.

## 2. Sichtbarer Hinweis vor dem Absenden

Vorgesehener Text direkt bei der Dateiauswahl, nicht nur im Datenschutz:

> Zum Schutz unseres Teams bereiten wir hochgeladene Unterlagen technisch auf. PDFs werden als neue bildbasierte PDF-Kopie weitergeleitet. Textsuche, anklickbare Links, interaktive Funktionen und digitale Signaturen werden dabei nicht übernommen. JPG/PNG werden ohne private Bildmetadaten neu gespeichert. Bitte bewahre deine Originale auf. Wir verändern keine Inhalte redaktionell und verwenden keine KI.

Zusätzlich: „Digitale Unterschriften werden nicht verifiziert. Eine im Dokument sichtbare Unterschrift ist keine Echtheitsbestätigung.“ Es werden keine elektronischen Signaturkennzeichen als weiterhin gültig dargestellt. Formular-/Mailkennzeichnung nennt die Anhänge „technisch aufbereitete Kopien“; kein Versprechen einer rechtlich gleichwertigen Originaldatei.

Keine zusätzliche Pflicht-Datenschutz-Einwilligung oder Newsletter-Kopplung erfinden. Der Hinweis beschreibt die tatsächliche Verarbeitung. Eine Bewerbung ohne Dateien bleibt möglich; der Kontaktweg bleibt erreichbar. Keine Originale öffentlich bereitstellen und keinen späteren Download der Originaldatei anbieten.

## 3. Vollständigkeit und Darstellung

### PDF

Ein festgelegter lokaler Renderer erzeugt die sichtbaren Seiten als Rasterbilder. Daraus wird ein **vollständig neues** PDF aufgebaut, ohne Seitenobjekte, Schriftprogramme, Aktionen, Anhänge, Formulare, Links, Metadaten oder andere Strukturen aus dem Original zu kopieren. Sichtbare Schrift, Bilder und vorhandene sichtbare Unterschriften erscheinen nur als Pixel. Kein OCR, keine inhaltliche Zusammenfassung, keine Korrektur von Texten.

Seitenanzahl, Reihenfolge, Orientierung und Seitenformat werden vor und nach Verarbeitung abgeglichen. Verwendet wird die vollständige sichtbare Seitenfläche (CropBox), ohne zusätzlichen Zuschnitt; überstehende Inhalte außerhalb dieser vom Dokument definierten Fläche werden nicht künstlich sichtbar gemacht. Tatsächlich leere Seiten bleiben erhalten. Fehler beim Rendern dürfen niemals durch eine leere Ersatzseite verdeckt werden. Warnungen über beschädigte/reparierte Struktur, fehlende notwendige Schriften, unvollständige Ausgabe oder nicht unterstützte sichtbare Funktionen führen zum Abbruch. Verschlüsselte/passwortgeschützte und erkennbar aktive oder eingebettete Dokumente bleiben abgewiesen; die Bereinigung ist keine Erlaubnis, bekannte gefährliche Inhalte auszuführen.

Startprofil: **200 dpi**, Seitenbilder als neu erzeugte JPEGs mit **Qualität 94 und 4:4:4-Farbabtastung**, ohne Metadaten. Keine automatische Absenkung von Auflösung/Qualität, um eine Größenüberschreitung zu verstecken. Eine pixel- oder drucktechnisch verlustfreie Kopie wird nicht versprochen. Kleine Schrift, Linien, Scans und Farbe müssen die Qualitätsabnahme bestehen; andernfalls wird dieses Profil vor Freigabe angepasst und erneut geprüft, nicht ungeprüft aktiviert.

### JPG/PNG

Dateityp und Größe prüfen, vollständig dekodieren, EXIF-Ausrichtung tatsächlich auf die Pixel anwenden und in sRGB ausgeben. Originale Bildfläche und Seitenverhältnis bleiben erhalten; keine automatische Verkleinerung. JPG bleibt JPEG mit Qualität 94/4:4:4; PNG bleibt PNG mit erhaltener Transparenz. EXIF/GPS/XMP, Kommentare, eingebettete Vorschaubilder und sonstige Quellmetadaten werden nicht weitergegeben. Nötige Farb-/Ausrichtungsinformationen werden bei der Darstellung berücksichtigt, nicht unbesehen entfernt. JPEG-Neuspeicherung ist nicht mathematisch verlustfrei; deshalb gezielte Foto-/Texttests. Nicht unterstützte Farbprofile oder Mehrfachbilder werden abgewiesen statt still anders dargestellt.

## 4. Sicherheitsgrenze und vorgesehene Bausteine

Die bekannte QPDF-Grenze wird **nicht** durch eine angeblich strengere Originalprüfung wegdefiniert: Der Original-PDF-Pfad bleibt für unmittelbaren Versand gesperrt. Das neue Sicherheitsziel ist ein eigener, nachweislich neu aufgebauter und geprüfter Ausgabeinhalt. Ein Renderer-/Virenscanner-Erfolg allein schaltet keinen Versand frei.

Vorgesehen sind ein fest qualifizierter **Poppler-Renderer**, das vorhandene **Sharp** für Pixelkodierung und **pdf-lib ausschließlich zum Aufbau neuer PDFs**. pdf-lib lädt oder kopiert dabei keine Bewerber-PDF. Version, Build, Bibliotheken und Fonts werden im Betriebsnachweis festgehalten; Installation, Eignungsnachweis und Linux-Konfiguration gehören erst in die folgende Umsetzung. Keine neue externe Plattform oder kostenpflichtige Lizenz wird hiermit beauftragt.

Parser, PDF-Renderer und JPG-/PNG-Dekoder laufen ohne Netzwerk, Mailzugang oder andere Geheimnisse, mit nur lesbarer Quelldatei und begrenztem privatem Arbeitsspeicher. Renderer und Bilddekoder dürfen nur begrenzte Pixelrahmen liefern. Größen, Format, Kanalzahl und exakte Pixelbytezahl werden kontrolliert; eine vom isolierten Quellparser ausgegebene PDF/JPEG/PNG-Datei wird nicht direkt als vertrauenswürdiger Anhang übernommen. Die kontrollierte Kodierung erzeugt neue Bildbytes aus den geprüften Pixelrahmen. Die PDF-Erstellung importiert ausschließlich diese neu kodierten Bilder in ein neues Dokument. Kein Ausführen von PDF-JavaScript oder Formularaktionen, keine Shellargumente aus Dateinamen, keine frei wählbaren Pfade.

Vor Verarbeitung werden die stabilen Worker-Originale gehasht und virengeprüft; vor Versand werden die endgültigen Ausgaben nochmals gebunden validiert und mit aktuellen Signaturen geprüft. Bei fehlender Isolation, veraltetem Scanner, unvollständigem Ergebnis, Versionsabweichung, Absturz, Timeout oder Ressourcenüberschreitung: kein Versand und kein Rückfall auf Originalanhänge. Es bleibt höchstens eine aktive Vorverarbeitung einschließlich Scan.

## 5. Explizite Grenzen

| Grenze | Vorgabe dieses Entwurfs |
| --- | --- |
| Upload | unverändert höchstens 5 Dateien, 5 MiB je Datei, 10 MiB insgesamt |
| PDF-Seiten | höchstens 20 pro PDF und 40 insgesamt pro Bewerbung; ersetzt den früheren technischen Planwert 50 pro PDF |
| PDF-Raster | 200 dpi, höchstens 8 Megapixel je Seite und 8192 Pixel je Kante; seitenweise Verarbeitung |
| Einzelbilder | höchstens 25 Megapixel und 8192 Pixel je Kante, nur ein Bild pro Datei |
| Bereinigte Anhänge | höchstens 5 MiB je Datei und 10 MiB insgesamt |
| Tatsächliche fertige E-Mail | höchstens 16 MiB einschließlich MIME-Kodierung und Headern |
| Zeit | höchstens 90 Sekunden für Prüfung/Rekonstruktion aller Dateien einer Bewerbung; jeder Teilprozess höchstens 30 Sekunden und nie über das verbleibende Gesamtbudget hinaus; zusätzlich Original- und Ausgabescan jeweils höchstens 30 Sekunden für den ganzen Satz |
| Verarbeitung | höchstens 512 MiB für die gesamte Verarbeitung einschließlich Nachkommen, Koordinatorpuffern und temporärem Speicher; privater temporärer Speicher zusätzlich auf 128 MiB begrenzt |
| Dauerhafte private Daten | bestehende 250-MiB-Grenze bleibt; Originale, Ausgaben, MIME-Pakete, Zwischenkopien, Reservierungen und verwaiste Restdateien müssen gemeinsam berücksichtigt sein |

Diese Startwerte benötigen reale Linux-Last-/Qualitätstests. Höchstens 20 wartende Vorgänge bedeutet nicht, dass 20 maximal große Bewerbungen gleichzeitig Platz haben müssen; die zuerst erreichte Grenze stoppt weitere Annahmen. Vor Annahme müssen auch benötigter Ausgabespeicher und die Verarbeitungskapazität reservierbar sein. Es gibt kein Ausweichen in unkontrollierten Swap, öffentliches Verzeichnis oder unverschlüsselte dauerhafte Zwischenablage.

**Wichtige Grenze:** Eine kleine komprimierte Eingangsdatei kann nach der Aufbereitung erheblich größer werden. Die Eingangsgrenze allein garantiert deshalb keine erfolgreiche Rekonstruktion. Dateityp-/Seiten-/Ausgangsgrenzen werden vor dem Upload genannt. Bei Überschreitung wird keine Seite ausgelassen, Auflösung reduziert oder Originaldatei stattdessen versandt. Der Status erklärt: „Die Unterlagen konnten nicht vollständig aufbereitet werden. Bitte nutze die Referenz … für die Rückfrage.“ Der bestehende Kontaktweg ist verfügbar, aber kein ungeprüfter automatischer Zweitversand.

## 6. Stabile Zustellung, Datenschutz und Löschung

Der Inhaltsfingerabdruck der **ursprünglichen** Bewerbung bleibt Grundlage für Idempotenz. Derselbe Schlüssel mit geänderten Originalen bleibt ein Konflikt. Er wird niemals durch den Hash der bereinigten Datei überschrieben.

Erst wenn alle ausgewählten Dateien erfolgreich aufbereitet sind, wird ein verschlüsseltes, unveränderliches Ausgabepaket dauerhaft übernommen. Sein privates Manifest bindet die Reihenfolge, Quelldateizuordnung, Ausgabedateinamen, MIME-Typen, Größe, SHA-256 sowie die Aufbereitungsversion. Der Datensatz unterscheidet ausdrücklich Originaleingang und erlaubte Versandkopie; bloß `parsed/pdf` oder eine vom Annahmedienst gesetzte Kennzeichnung reicht nicht.

Vor dem ersten SMTP-Versuch wird die tatsächlich erzeugte, signierte MIME-Nachricht unveränderlich gesichert. Erneute Versandversuche verwenden exakt dieselben gespeicherten Bytes, nicht einen neuen Renderdurchlauf oder neue Message-ID. Nach unklarem SMTP-Ausgang erfolgt nur der bereits festgelegte Postfachabgleich. SMTP-/IMAP-Zuordnung und spätere gezielte Löschung beziehen sich auf **die tatsächlich versandten Ausgabedaten**, nicht auf die Hashes der hochgeladenen Originale. Keine Dokumente in Logs oder im dauerhaft reduzierten Löschregister.

Originale, bereinigte Dateien, gespeicherte MIME-Pakete und Arbeitsreste unterliegen den bereits festgelegten Fristen: nach bestätigter Zustellung beziehungsweise ungültigem Vorgang spätestens 24 Stunden; bei zulässiger Zustellstörung Dokumentkopien höchstens 7 Tage ab Annahme. Wiederholungen verlängern keine Frist. Nicht mehr benötigte Originale/Zwischenkopien werden nach gesicherter Übernahme früher entfernt; ein unterbrochener Übernahme-/Löschschritt darf weder die einzige brauchbare Kopie verlieren noch Daten aus der Speicherbilanz verschwinden lassen. Die Sechsmonatsregel für abgelehnte Bewerbungen einschließlich verifizierter Postfachkopien bleibt unverändert.

## 7. Notwendige Abnahme und Folgen für den vorhandenen Plan

Vor Aufheben der PDF-Sperre sind mindestens nachzuweisen:

1. Beide bekannten mehrdeutigen PDF-Testdateien werden entweder klar abgewiesen oder ausschließlich in neu gebaute, geprüfte Bild-PDFs überführt. Nie Originalbytes versenden; keine Behauptung, nun alle Mehrdeutigkeiten in Originalen erkennen zu können. Ausgaben enthalten keine übernommenen aktiven/historischen Objekte oder Dateianhänge.
2. Visuelle synthetische Muster mit kleiner Schrift, Tabellen, Scans, Farben, sichtbaren Unterschriften, gedrehten/verschieden großen Seiten, leerer Seite, EXIF-Ausrichtung und PNG-Transparenz: vollständige verständliche Ausgabe, keine unerklärlichen Leerbilder, falsche Farben oder vertauschte Seiten. Die Ausgabe wird gerendert und visuell geprüft. Reine Seitenzählung beweist keine Darstellungsqualität.
3. Verschlüsselte/defekte Dateien, Parser-/Rendererwarnungen, Ausgabebomben, knappe Grenzwerte, fehlende Fonts, Abbruch, OOM/Timeout und ein Fehler in nur einem von mehreren Anhängen: kein unvollständiger Versand und keine Original-Ausweichroute.
4. Neustarts vor/nach der Paketübernahme und während SMTP: gleiche Referenz, stabiler Requesthash, kein doppelter Versand, keine neu gerenderte Ersatznachricht bei unklarem Ausgang. IMAP-Inhaltsabgleich und Testlöschung ausschließlich gegen die exakten bereinigten Versandkopien.
5. Reale Prozess-/Speicher-/Dateirechte, gemeinsame Kapazitätsrechnung, Crashbereinigung, fristgerechte Löschung und gleichzeitiger Websitebetrieb unter Linux. Echte Testmails und gezielte Testlöschung erst nach der weiterhin separaten konkreten Freigabe.

Der nächste Schritt nach schriftlicher Bestätigung ist eine **gezielte Ergänzung** des vorhandenen Implementierungsplans: Rekonstruktion/Ausgabepaket nach der stabilen Worker-Übernahme; Anpassung der betroffenen Schnittstellen für Dateiannahme, Mailmanifest, Versand, Aufbewahrung, Hinweise und Betrieb. Bereits geprüfte Register-/Übergabefunktionen werden nicht neu gebaut. Die gewählte Ausführungsmethode bleibt bestehen; kein erneuter vollständiger Projektstart.

Dieser Entwurf schließt den Befund F2 noch nicht technisch. Die Sperre bleibt bis zur implementierten und unabhängig geprüften Ersatzverarbeitung bestehen. Sonstige Websitefunktionen und öffentliche Bereitstellung bleiben in diesem Schritt unverändert.

## Quellen und Evidenzgrenzen

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): mehrschichtige Uploadkontrollen sowie anwendbare Inhaltsbereinigung und Bild-Neukodierung; keine einzelne Maßnahme ist eine Sicherheitsgarantie.
- [Offizielles Poppler-Projekt](https://poppler.freedesktop.org/): lokale PDF-Renderingbibliothek; die Website nennt am 09.10.2026 Version 26.10.0. Das ist keine Qualifikation für unseren Host oder unsere Testfälle.
- [Dokumentierter lokaler Zwischenstand](../../audits/2026-10-09-application-upload-interim.md): bisherige Tests, PDF-Befund und unveränderter Live-Status.

Für diesen Entwurf wurden nur Dokumentation, vorhandene Schnittstellen und öffentliche Primärquellen geprüft. Keine Dateien konvertiert, neuen Programme installiert, echten Bewerbungen verarbeitet oder Dienste aktiviert.
