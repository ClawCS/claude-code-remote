# Bewerbungsupload — Zwischenstand am 09.10.2026

**Nicht fertig, nicht live aktiviert.** Dieser Bericht dokumentiert einen gesicherten Entwicklungsstand, keine Abnahme des Bewerbungsportals. Die bestehende Website, Mietanfragen, Newsletter, Werbung, DNS und Mailkonten wurden durch diese Umsetzung nicht verändert.

## Aktuelle Fortschreibung: Dokumentrekonstruktion

Niko hat sowohl die [schriftliche Ergänzung](../superpowers/specs/2026-10-09-application-document-reconstruction-design.md) als auch den [gezielten Plan-Nachtrag](../superpowers/plans/2026-10-09-application-document-reconstruction.md) bestätigt. Die zuvor offene Richtungsentscheidung ist erledigt; keine weitere Design- oder Methodenfreigabe erforderlich.

- **R1 lokal umgesetzt und unabhängig geprüft:** strikte Raster-/Quellverträge, unveränderte Sperre für direkten Original-PDF-Versand. Commit `ae7f4d6`; vollständiger damaliger Lauf: 93 Dateien / 1.725 Tests; fokussiert 151 Tests; Build, TypeScript und Lint erfolgreich.
- **R2 lokal umgesetzt und unabhängig geprüft:** vollständige neue PDF-/JPG-/PNG-Kopien, begrenzte Rohpixelverarbeitung, vollständige Ausgabeprüfung und Scanner-Schnittstelle. Commit `303d72b`; vollständiger Lauf vor der letzten reinen Erweiterung der visuellen Fixtures: 95 Dateien / 1.758 Tests. Danach fokussiert 52 Tests, davon 15 visuelle Tests, sowie Build, TypeScript und Lint erfolgreich. Keine echte ClamAV-Qualifikation daraus ableiten.
- Der Controller hat alle vier synthetischen PDF-Seitenpaare sowie größere JPEG-/PNG- und Transparenzmuster tatsächlich visuell verglichen. Lesbarkeit, Reihenfolge, Drehung, Seitenränder und leere Seite wurden lokal überprüft. Dies ersetzt weder Linux-Qualifikation noch Tests mit sämtlichen zugelassenen Grenzfällen.
- Beide unabhängigen Taskreviews sind ohne blockierenden Befund abgeschlossen. Drei kleinere Punkte bleiben für die abschließende Prüfung erfasst: abschließende Abbruchprüfung im Quellprüfhelfer, vollständiger Callback-Regressionstest der mehrdeutigen PDF und bessere Lesbarkeit des Raster-Kindprozesses. R2 dokumentiert außerdem ehrlich, dass sein erster RED-Lauf nur fehlende Module meldete; spätere verhaltensbezogene RED/GREEN-Nachweise ersetzen diese Prozessabweichung nicht rückwirkend.
- **R3 lokal umgesetzt und unabhängig geprüft:** verschlüsselte, unveränderliche Ausgabe-/MIME-Artefakte, authentifizierte Wiederaufnahme und gemeinsame Speicherbilanz. Commit `2d25e01`: vollständiger Lauf mit 98 Dateien / 1.787 Tests sowie Build, TypeScript und Lint erfolgreich. Der zuvor belegte offene Dateideskriptor führte zu einer expliziten, standardmäßig nicht verfügbaren Lebensdauer-/Quota-Schnittstelle; lokale Kindprozess-/Dateisystemtests sind kein echter Linux-Quota-Nachweis.
- Das R3-Review fand zwei Fehler: dauerhaft zu große Reserven nach Artefaktübernahme sowie liegen gebliebene Verarbeitungseigentümerschaft nach fehlgeschlagenem Verzeichnisanlegen. Beide sind in `8b6a750` mit verhaltensbezogenen RED/GREEN-Tests behoben. Danach bestanden 71 Tests in fünf abdeckenden Dateien, Build, TypeScript und Lint; die unabhängige Nachprüfung bestätigte beide Korrekturen ohne neuen blockierenden Befund. Der vollständige 1.787-Test-Lauf gehört zum Stand **vor** dieser Korrektur und wurde danach nicht wiederholt.
- Die lokale R1–R3-Integrationsprüfung bestätigt den Ersatzpfad über neu erzeugte, vollständig geprüfte und authentifiziert gespeicherte Dateien als Grundlage für die nächsten Umsetzungsschritte. Direkte Original-PDF-Weiterleitung bleibt gesperrt. Endgültige Freigabe erfordert weiterhin die späteren Mail-/Löschintegration und tatsächliche Linux-/Scanner-/Ressourcenqualifikation. Ein zusätzlicher kleinerer Testpunkt bleibt für die abschließende Prüfung erfasst: Quell-Dateilebensdauer im verschachtelten Verarbeitungsscope ausdrücklich mit einer echten Quelldatei testen.

Für diese lokalen Prüfungen wurde Poppler 26.10.0 samt erforderlichem CMake/pkgconf ausschließlich im ignorierten, planbezogenen Werkzeugverzeichnis gebaut. Keine globale Installation, Änderung gebündelter Laufzeiten oder Serverinstallation in diesem Schritt. Offizielle HTTPS-Quellen, Hashes und Bibliotheken sind dort dokumentiert; vorhandene PGP-Signaturen wurden nicht verifiziert. Der macOS-Build ist kein Linux-Betriebsnachweis.

**Praxistest ausdrücklich genehmigt:** Erst nach bestandenen Sicherheitsprüfungen genau drei als TEST markierte Bewerbungen mit erfundenen Daten an `info@trinkgut-jammers.de`, eine Kopie im eigens angelegten Testordner, anschließend ausschließlich diese Testnachrichten einschließlich der Testkopie gezielt löschen. Bestehende Nachrichten bleiben unberührt. Die Zustimmung ist in `AGENTS.md` und Commit `8d9c958` gespeichert. Noch keine echte Testmail versandt, kein Postfach gelesen oder verändert; sichere Zugangsdaten und alle übrigen Gates bleiben erforderlich.

Sämtliche neuen Implementierungscommits bleiben lokal und ungepusht, solange die dokumentierten Sicherheits-/Linux-Gates offen sind. Keine Live-Aktivierung, kein neuer Website-Release. Der nachfolgende Abschnitt beschreibt den historischen Ausgangsbefund und wird nicht als aktueller unbeantworteter Freigabebedarf verstanden.

## Erledigte und unabhängig geprüfte Bausteine

1. Transaktionales privates Bewerbungsregister, Kapazitätsgrenzen und wiederholbare Annahme ohne doppelte Vorgänge. Task1 abgeschlossen.
2. Verschlüsselter Dateieingang, getrennte Worker-Kopie, dauerhafte Zuordnung und Wiederanlaufprüfung. Zwei im Review gefundene Fehler bei Abbruch/Dateieigentum wurden behoben und separat nachgeprüft. Task2 abgeschlossen.
3. Dateiidentität, begrenzte lokale PDF-/Bilddiagnostik und Scanner-Schnittstelle implementiert. **Task3 noch offen:** Die aktuelle PDF-Interpretation genügt nicht für unveränderte Weiterleitung aller zugelassenen PDFs. Die Produktivfreigabe dafür ist ausdrücklich blockiert.
4. **Task4A lokal abgeschlossen und unabhängig geprüft:** getrennte Annahmekonfiguration, signierte Sitzungsgrundlagen, dauerhaft begrenzte Annahmeversuche, verschlüsselter Name und unveränderliche Kennzeichnung synthetischer Testvorgänge. Commit `0906da8`: vollständiger Lauf mit 100 Dateien / 1.815 Tests, Backend-Build, TypeScript und Lint erfolgreich. Das Review fand eine mögliche gegenseitige Blockade zwischen Wiederanlaufprüfung und Artefaktverarbeitung sowie einen falsch platzierten öffentlichen Antworttyp. Beides ist in `b7fb73b` korrigiert; 139 abdeckende Tests und anschließend 29 RPC-Tests sowie Build, TypeScript und Lint bestanden. Die unabhängige Nachprüfung bestätigte beide Korrekturen. Der vollständige 1.815-Test-Lauf gehört zum Stand vor dieser Korrektur. Die öffentliche HTTP-Annahme (Task4B) wird gesondert umgesetzt und geprüft.

Die vollständige öffentliche HTTP-Annahme, Mailzustellung/-abgleich, Mitarbeiterverwaltung, Fristen-/Postfachlöschung, Formularintegration und Linux-Betriebsqualifikation sind weitere offene Aufgaben des genehmigten Plans. Es wurde keine echte Bewerbung, Nachricht oder Zahlung erzeugt und keine Postfachnachricht gelesen oder gelöscht.

**Task4B lokal abgeschlossen und unabhängig geprüft:** `b225c02` enthält die begrenzte HTTP-Annahme, signierte Sitzung/Formnachweise und privaten Statusabruf. Vollständiger Lauf: 103 Dateien / 1.881 Tests, zusätzlich Build, TypeScript und Lint erfolgreich. Ein realer HTTP-Test zeigte, dass ein geänderter Wiederholungsversuch nach korrektem Konfliktfehler auch weitere Bewerbungen blockierte. `835cbf1` korrigiert dies ausschließlich nach nachgewiesener, zuständigkeitsgebundener Bereinigung; wirkliche Speicher-/Freigabefehler bleiben sperrend. Danach bestanden 111 abdeckende Tests sowie Build, TypeScript und Lint. Die unabhängige Prüfung bestätigte diese Korrektur und fand einen weiteren Fehler: ungültige Multipart-Header wurden vor ihrer Ablehnung bereits auf das Annahmelimit angerechnet. `50e0e28` zieht die nicht lesende Headerprüfung vor; 66 abdeckende Tests, Build, TypeScript und Lint bestanden, die separate Nachprüfung bestätigte die Korrektur ohne neue Befunde. Der vollständige 1.881-Test-Lauf gilt für den Stand vor beiden Korrekturen. Dies ist die lokale Taskabnahme, keine Live-Freigabe. Verlorene Reservierungsantworten erfordern weiterhin den tatsächlichen Wiederanlauf-/Lebensdauernachweis des späteren Workerbetriebs; kein ungeprüftes Freigeben belegter Dateien.

## Sicherheitsbefund und Korrekturen

**Task7A lokal abgeschlossen und unabhängig geprüft:** `25044db` ergänzt dauerhafte Mailkennungen, nachvollziehbare Versandversuche, begrenzte Wiederholungs-/Empfangsprüfzeiten und einen separat verschlüsselten minimalen Rückmeldekontakt. Das Register wird ohne erfundene Zustellnachweise auf Schema4 aktualisiert. 110 fokussierte Tests sowie der vollständige Lauf mit 110 Dateien / 2.061 Tests, Build, TypeScript und Lint bestanden. Das unabhängige Review fand einen Neustartfehler: Ein älterer unbeantworteter SMTP-Versuch konnte eine inzwischen bestätigte Zustellung oder endgültige manuelle Klärung wieder als unklar einstufen. `c075cc7` erhält diese späteren endgültigen Zustände, ohne einen SMTP-Erfolg zu erfinden. Drei neue Tests waren zuerst rot; anschließend bestanden alle 67 abdeckenden Tests sowie Build, TypeScript, Lint und Diffprüfung. Die unabhängige Nachprüfung bestätigt die Korrektur ohne neue Befunde. Der vollständige 2.061-Test-Lauf gilt für den Stand vor dieser Korrektur. Der ausführende Versandablauf (7B), Workerbetrieb (7C), tatsächliche Bereinigung und Linux-/IONOS-Qualifikation bleiben offen. Keine echte Nachricht versandt, gelesen oder gelöscht; Upload weiterhin nicht aktiviert.

**Task6 lokal abgeschlossen und unabhängig geprüft:** `5359ac4` ergänzt den begrenzten Postfachabgleich und ausschließlich gezielte Löschoperationen für erneut vollständig verifizierte einzelne Nachrichten. 55 fokussierte Protokoll-/Patchtests sowie der letzte vollständige Lauf mit 108 Dateien / 2.016 Tests bestanden; Build, TypeScript, Lint und kompiliertes Manifest wurden ebenfalls geprüft. Die tatsächlichen lokalen Protokolltests decken unter anderem fehlende oder während des Vorgangs entzogene UIDPLUS-Fähigkeit, falsche/duplizierte Kopfzeilen, veränderten Inhalt, Größenbegrenzungen, fehlendes Schreibrecht, Verbindungsabbrüche sowie unveränderte fremde Löschmarkierungen ab. Dafür wurde eine minimale versions- und hashgeprüfte Korrektur der beiden installierten ImapFlow-Modulformate eingeführt; künftige Abweichungen bleiben gesperrt, bis sie erneut geprüft sind. Das unabhängige Review ist ohne Befund abgeschlossen. Keine echte IONOS-Verbindung oder Postfachaktion; tatsächliche Ordnerrechte, Ressourcenisolation, Versand-/Fristenintegration und Produktionsfreigabe bleiben offen.

**Task5 lokal abgeschlossen und unabhängig geprüft:** Mailpakete werden ausschließlich aus den vollständig geprüften, neu erzeugten Dokumentkopien erstellt. Inhalt, Anhangsreihenfolge und Identität werden unabhängig neu berechnet und signiert; ein kopierter Herkunftsheader reicht nicht für Zustell- oder Löschnachweise. Commit `9075440`: 67 fokussierte Tests und vollständiger Lauf mit 106 Dateien / 1.954 Tests, Build, TypeScript und Lint bestanden. Das unabhängige Review fand zwei Fehler: Mail-Verbindungsfehler konnten eine Operation hängen lassen und gefaltete Kopfzeilen konnten bedeutende Leerzeichen verlieren. `32b1a8c` korrigiert beides; sechs verhaltensbezogene Tests waren zunächst rot, danach bestanden alle 74 abdeckenden Tests sowie Build, TypeScript, Lint und Diffprüfung. Die unabhängige Nachprüfung bestätigt beide Korrekturen ohne neue Befunde. Der vollständige 1.954-Test-Lauf gehört zum Stand vor dieser Korrektur. Dies ist weiterhin nur die lokale Umsetzung; echte IONOS-Zustellung, Postfachabgleich und Linux-Betrieb sind nicht nachgewiesen.

Das unabhängige Review von `78c6b8e` fand einen unzureichenden Laufzeitcheck für Prüfergebnisse. Dieser ist in `0c7a642` durch exakte erlaubte Status-/Ergebnisformen korrigiert; Regressionstests und eine zweite unabhängige Prüfung bestätigen die Korrektur. Zwei kleinere Befunde zur Dokumentation der Puffergrenzen und zur plattformabhängigen Testkonfiguration sind ebenfalls behoben. Die zweite Prüfung fand keine neue Verschlechterung durch diese Korrekturen.

Offen bleibt eine architektonische PDF-Grenze: Zwei synthetische PDFs enthalten doppelte Dokumentdefinitionen, davon eine mit aktiver Aktion. QPDF12.4.2 wählt die harmlose Definition und meldet keine Warnung. Damit ist die geforderte Eindeutigkeit der unveränderten Datei nicht belegt. Ein tatsächlich ausnutzbarer Fehler in einem bestimmten Empfängerprogramm wurde **nicht** nachgewiesen. Virenscanner und Linux-Isolation allein beheben diese Interpretationslücke nicht.

Die neue Sperre `PDF_AMBIGUITY_UNRESOLVED` verhindert eine produktiv gültige PDF-Freigabe auch dann, wenn ein späterer Prüfer lediglich die Kennzeichnung `linux-sandbox` liefert. Die lokale Diagnose darf den Befund weiterhin sichtbar machen. Diese Sperre ist eine Schutzmaßnahme, **keine Fertigstellung der PDF-Funktion**.

Eine begrenzte Untersuchung der QPDF-C-API bestätigte das Verhalten. Die ebenfalls geprüften öffentlichen Quellen zu pdfcpu zeigen keine nachgewiesene Lösung für diese beiden Fälle. Es wurden dafür keine weiteren Programme installiert und keine Hersteller kontaktiert.

## Historische Entscheidungsvorlage — inzwischen beantwortet

Niko wurde gefragt, ob eine Änderung des bisherigen Konzepts ausgearbeitet werden soll:

- Empfehlung: PDF-Seiten in einer isolierten Verarbeitung in eine neue, bildbasierte PDF-Kopie übertragen und nur diese Kopie versenden. Der Bewerber muss darüber informiert werden; Textsuche, anklickbare Links und digitale Signaturen gehen verloren. Lesbarkeit, vollständige Seiten und Größen-/Ressourcengrenzen wären zusätzlich nachzuweisen.
- Alternative: vorerst nur JPG/PNG-Anhänge zulassen. Dies wäre ebenfalls eine ausdrückliche Änderung des vereinbarten Uploadumfangs, keine stillschweigende Ersatzlösung.

Zum Zeitpunkt des ursprünglichen Berichts lag noch keine Antwort vor. Inzwischen gilt die bestätigte Ergänzung und der oben dokumentierte Umsetzungsstand. Inhaltsbereinigung ist ein möglicher Bestandteil eines mehrschichtigen Schutzkonzepts, keine allgemeine Sicherheitsgarantie; siehe [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Die ursprünglich separat angefragte Freigabe für drei eindeutig markierte synthetische TEST-Bewerbungen ist inzwischen erteilt (genauer Umfang oben). Keine echte Mailprüfung ohne die übrigen Betriebsnachweise.

## Prüfnachweise

| Stand | Nachweis |
| --- | --- |
| Task1 |42 fokussierte Tests; vollständiger damaliger Lauf1490 Tests; Build/TypeScript/Lint erfolgreich; unabhängiges Review abgeschlossen |
| Task2 | ursprünglicher vollständiger Lauf1526 Tests; Korrekturrunde36 abdeckende Tests; Build/TypeScript/Lint und separates Review erfolgreich |
| Task3 vor Korrektur,78c6b8e |92 Dateien/1614 Unit-Tests erfolgreich; Backend-Build, TypeScript, Lint und kompiliertes Laufzeitsmoke ohne tsx erfolgreich |
| Task3 Korrektur,0c7a642 |111 abdeckende Tests in vier Dateien erfolgreich; Backend-Build, TypeScript, Lint ohne Warnungen, Diffprüfung erfolgreich; unabhängige Nachprüfung: Laufzeitfehler und kleinere Befunde behoben, PDF-Architekturpunkt bleibt offen |

Der vollständige1614-Test-Lauf war **vor** der Korrektur; er wird nicht als danach erneut ausgeführt dargestellt. Die tatsächliche ClamAV-Engine ist nicht installiert/geprüft; bisher gibt es lokale Protokollfixtures. Unterschiedliche Linux-Benutzerrechte, harte Ressourcenbegrenzung, Virensignaturen, kompletter Versand-/Löschablauf und produktive Bereitschaft sind noch nachzuweisen.

Die PDF-Tests brauchen jetzt ausdrücklich `APPLICATIONS_TEST_QPDF` mit einem absoluten Pfad auf die geprüfte QPDF-Version. Letzter lokaler Korrekturlauf:

```sh
APPLICATIONS_TEST_QPDF=/opt/homebrew/opt/qpdf/bin/qpdf NODE_ENV=test npx vitest run services/applications/tests/file-validation.test.ts services/applications/tests/parser-process.test.ts services/applications/tests/pdf-policy.test.ts services/applications/tests/scanner.test.ts
npm run applications:build
npx tsc --noEmit
```

Die Linux-Test-/Bereitstellungsumgebung ist dafür noch nicht eingerichtet. Dieser Stand darf nicht ungeprüft in die reguläre Website-Veröffentlichung übernommen werden.

## Speicherung und Live-Status

- Branch `codex/cinematic-production` in der vorhandenen Worktree.
- Task1/Task2 bis `4c3d410` wurden nach Review auf GitHub gesichert; der Remote-Stand wurde erneut abgerufen.
- Task3 und die Schutzkorrektur sind lokal als `78c6b8e` und `0c7a642` committet. **Nicht gepusht oder deployed**, solange der offene Prüfpunkt und die Linux-Testabhängigkeit nicht geklärt sind.
-32 fremde geänderte Screenshots und10 fremde unversionierte Content-Prüfberichte wurden weder übernommen noch verworfen.
- Der zuletzt nur lesend geprüfte Live-Release war `b2383232fb5dfdb3a25a96d01995d470b0a54889`. In diesem Auftrag wurde kein neuer Live-Release ausgerollt. Kein Push oder lokaler Test wird als Live-Nachweis ausgegeben.

## Lokale Werkzeugänderungen

Für die Parserprüfung wurde QPDF über Homebrew eingerichtet, zunächst12.3.2 aus veralteten Metadaten und anschließend geprüft12.4.2 (Formel12.4.2_1). Bei der ersten Installation löschte Homebrews automatische Aufräumfunktion unerwartet alte Homebrew-Caches/Manifeste/Logs und ein Verzeichnis. Bei weiteren Aufrufen war diese Aufräumfunktion deaktiviert.

Der erlaubte gezielte Upgrade zog notwendige Abhängigkeiten nach: jpeg-turbo3.2.0, ca-certificates2026-09-25 und openssl@4 4.0.3. Homebrew löste dabei die bisherigen openssl@3-Verknüpfungen und aktualisierte seinen portablen Ruby auf4.0.7. Es wurden keine blinden Rückverknüpfungen, allgemeinen Paket-Upgrades oder Dienststarts vorgenommen. Diese lokalen Änderungen sind vom unveränderten Live-Server zu unterscheiden.

## Fortsetzung

1. Die lokal unabhängig geprüften R1–R3- und Task4A/4B/5/6/7A-Bausteine nicht erneut implementieren. Als Nächstes den wiederanlaufbaren Versandablauf (7B), anschließend Lebensdauer-/Bereitschaftsintegration (7C) umsetzen und separat prüfen. Das auf Version 4 migrierte Schema und die neu geprüften Speichergrenzen berücksichtigen. Verwaltungsanmeldung und Kalenderfristen sind lesend vorbereitet, noch nicht umgesetzt oder eingerichtet.
2. Task3-FindingF2 erst durch vollständige Mail-/Löschintegration und tatsächliche Linux-/Scannerqualifikation endgültig schließen; lokale Diagnose nicht als Produktivfreigabe umdeuten.
3. Erfasste kleinere Reviewpunkte in der abschließenden Prüfung bearbeiten; sichere Standardeinstellung bleibt deaktiviert.
4. Die bereits erteilte begrenzte Testfreigabe beachten; sichere Geheimnisbereitstellung, Aufbewahrungs-/Backupgrenzen und Linux-/Scannerkapazität vor Pilot/Live-Aktivierung nachweisen.

Arbeitsplan: [2026-10-09-application-upload.md](../superpowers/plans/2026-10-09-application-upload.md). Der lokale planbezogene Fortschrittsledger bleibt erhalten; Task3 ist nicht als abgeschlossen markiert.
