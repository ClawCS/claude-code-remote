# Geprüfte Wochenpakete als regulärer Veröffentlichungsweg

Stand: 08.10.2026. Status: technischer Entwurf zur Freigabe; noch nicht implementiert oder veröffentlicht.

## Auftrag und Erfolgskriterium

Der Betreiber hat folgenden Ablauf ausdrücklich beauftragt: DE-Original von Trinkgut und NL-Original aus Canva beziehen, prüfen, zusammen mit Vorschauen und sämtlichen zugehörigen Sortimentsangeboten auf dem eigenen Hetzner-Server veröffentlichen, zum tatsächlichen Angebotszeitraum anzeigen und öffentlich kontrollieren. Besucher sollen die geprüften Originale von `https://trinkgut-jammers.de` erhalten; ausfallende Anbieterlinks dürfen ein bereits korrekt importiertes Wochenpaket nicht beeinträchtigen. Das bestehende Erscheinungsbild bleibt erhalten.

Es handelt sich um eine Erweiterung des bestehenden Content-/Releaseprozesses, nicht um ein neues CMS. Wegen der gemeinsamen Bindung von Quellen, Dateien, Angebotskacheln, Laufzeit-Auswahl und Abnahme ist dies eine Architekturänderung. Vor Umsetzung werden dieser Entwurf und anschließend der daraus abgeleitete Implementierungsplan freigegeben.

## Belegter Ausgangszustand

- Der DE-Import in `scripts/content-weekly.ts` speichert offizielle Katalogmetadaten. PDF und Bilder bleiben externe Links; der Import prüft sie nur per HEAD.
- `validateCatalog()` in `lib/handzettel-catalog.ts` bindet diese Quellmetadaten strikt an Markt 13027, Werbekreis 3.6, Katalogversion, Woche und offizielle URL-Muster. Diese Herkunftsprüfung bleibt erhalten.
- NL liegt bereits als lokale Original-PDF plus Vorschau mit SHA-256 und Einseitenprüfung vor.
- DE-Angebote werden derzeit über die Gleichheit von externer PDF-URL und `sourceUrl` freigeschaltet. Eine isolierte Linkänderung würde die 107 DE-Angebote ausblenden. NL ist bereits an den PDF-Hash gebunden.
- `offers:check` kontrolliert die kuratierten Ausschnitte, aber eine neue Handzettelwoche ohne neue Kacheln kann bislang dennoch erscheinen. Der Prebuild ruft die Angebotsprüfung nicht auf.
- Wochenpakete benötigen bereits heute einen Linux-Neubuild und kontrollierten Dienstneustart. Ein Git-Push veröffentlicht nicht.
- Erneute HTTP-Prüfung am 08.10.2026 um 15:02 UTC: öffentliche Flyer-API antwortet 200 und liefert für DE noch Anbieterlinks; DE-PDF und Titelseite liefern jeweils 404. NL ist lokal verlinkt. Der API-Status `ok` beweist daher derzeit keine erreichbaren DE-Dateien.
- Die bereits redaktionell geprüften lokalen DE-Originale für 05.–10.10.2026 sind unverändert vorhanden: PDF-SHA-256 `be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a`, Cover-SHA-256 `a9ac782ae646c830ea71b4448fda2ceac8ba06d5b9c0ec93c69fb51828220a51`. Beide Hashes wurden erneut gelesen. Das ist kein neuer Original-Datumsabgleich.

## Abgewogene Wege

1. **Gewählt: versionierte lokale Originale im bestehenden Release.** Ein nachprüfbares Paket wird gemeinsam mit der Website gebaut und atomar aktiviert. Die bestehenden Serverrechte und Rückfallmöglichkeiten bleiben erhalten.
2. Anbieterlinks oder ein Laufzeit-Proxy würden den Kundenabruf weiter von der externen Verfügbarkeit abhängig machen und erfüllen den Auftrag nicht.
3. Ein neues CMS oder ein schreibender Importdienst auf dem Produktivserver würde zusätzliche Zugangsdaten, Speicherrechte und Betriebskomponenten benötigen. Das ist für den beauftragten Ablauf nicht erforderlich und nicht Bestandteil dieses Entwurfs.

## 1. Quellen und veröffentlichte Dateien trennen

Offizielle Katalogmetadaten unter `data/editorial/official-catalogs/` bleiben unveränderte Herkunftsnachweise. Ihre externen URLs dienen dem Import, nicht der öffentlichen Dateiauslieferung.

Eine gesonderte, strikt validierte Veröffentlichungsbindung verbindet je Woche:

- Zielmontag, tatsächlichen Zeitraum und Sprache;
- DE-Katalog-ID/-Version beziehungsweise den bestehenden NL-Flyereintrag;
- lokale PDF und vollständiges Cover, jeweils mit SHA-256;
- PDF-Seitenzahl, Prüfzeit und dokumentierten Originalabgleich;
- das vollständig geprüfte Angebotslayout, dessen Quelldateihashes und alle zugehörigen Angebots-IDs/Bildhashes.

Dateien liegen unter den bestehenden öffentlichen Pfaden `/handzettel/YYYY/…pdf`, `/images/content/…` und `/images/offers/…`. Neue Pfade enthalten eine eindeutige Wochen-/Versionsidentität; eine inhaltlich geänderte Datei überschreibt nicht stillschweigend eine veröffentlichte URL. Private Canva-Identitäten, Authentifizierungsdaten und Roharbeitsordner gelangen weder in öffentliche APIs noch in Git oder den Release.

Ein Paket wird erst gebunden, wenn seine Dateien vollständig geschrieben und geprüft sind. Fehlgeschlagene Downloads, Prüfungen oder abgebrochene Vorbereitungen verändern keine bereits gültige Veröffentlichung. Der bisherige veränderliche DE-Cache darf diese Bindung nicht umgehen oder die Ausgabe auf externe Links zurückstellen.

## 2. Import und redaktionelle Prüfung

Der bestehende Vorbereitungslauf wird erweitert, nicht durch einen unabhängigen zweiten Ablauf ersetzt:

1. Feste Zielwoche bestimmen; beim Wiederholen dieselbe Woche verwenden.
2. DE-Metadaten und Originalbytes vom geprüften offiziellen Ursprung laden. Fremde Weiterleitungen, HTML statt PDF, unvollständige Downloads, ungültige Dateien und Dateien über 50 MiB zurückweisen. PDF-Struktur/Seitenzahl und tatsächlich dekodierbares vollständiges Cover prüfen.
3. NL über den vorhandenen lesenden Canva-Zugang und authentifizierten Originalexport beziehen. Genau eine vollständige, unbeschnittene Seite; keine signierten Thumbnails als Original.
4. Gedruckten Zeitraum, Sprache, Markt, Vollständigkeit sowie Preis-/Pfand-/Mengenbedingungen visuell abgleichen. Dateihashes oder neue Änderungszeiten ersetzen diese Prüfung nicht.
5. Alle bepreisten Angebotsblöcke jeder Originalseite einzeln erfassen und passend kategorisieren. Zusammengehörige Varianten, Mengenstaffeln und Zugaben bleiben ein vollständiger Block. Unbepreiste Image-/Gewinnspiel-/Rezeptflächen zählen nicht als Produktangebote. Die bereits vorhandene Ausschnittpipeline weiterverwenden.
6. Dateien, Metadaten, Seitenzählung, Angebotszählung und Quellenbindung gemeinsam prüfen und als Wochenpaket bereitstellen.

Der einmalige Übergang für KW41 übernimmt die oben hashgebundenen, bereits geprüften DE-Originale unverändert. Es wird kein abweichender Handzettel gesucht, keine neue Preisdatei erfunden und kein falsches Datum eingetragen. Die vorhandenen 107 DE- und 21 NL-Angebote bleiben erhalten.

Unbekannte zukünftige Layouts benötigen weiterhin den vollständigen Originalabgleich und eine neue geprüfte Ausschnittzuordnung. Die Automationsaufgabe führt diese redaktionelle Arbeit aus; eine bloße PDF-Erkennung oder ein OCR-Ergebnis ist keine Veröffentlichungserlaubnis. Kann der Lauf die vollständige Zuordnung nicht belegen, meldet er die Lücke statt Vollständigkeit zu behaupten.

## 3. Gemeinsame Laufzeit-Auswahl

Homepage, `/angebote`, `/handzettel`, `/nl`, `/produkte`, Warengruppen und die beiden Inhalts-APIs nutzen dieselbe geprüfte Quellen-/Veröffentlichungsbindung.

- DE und NL erhalten eigene lokale Original-PDF-/Coverlinks. Auch der Besucherlink „Original öffnen“ führt auf diese Datei, gegebenenfalls mit `#page=…`.
- Der öffentliche DE-Flyer enthält ebenso wie NL den PDF-Hash. Angebotskacheln müssen exakt zur Sprache, Flyer-ID, Gültigkeit, lokalen Originaldatei und deren Hash passen. Ein Versionswechsel darf alte Ausschnitte nicht freischalten.
- Aktuelle und vollständig vorbereitete zukünftige Wochen können gleichzeitig im Release liegen. Sonntags darf die Vorbereitung der Folgewoche keine noch gültigen Inhalte verdrängen.
- Aktivierung ab 00:00 Uhr des Originalstartdatums in Europe/Berlin; Entfernung aus allen aktuellen Ansichten nach dem Originalenddatum. Vorbereitete künftige Preise werden nicht vorzeitig als aktuelle Werbung angezeigt. Historische Dateien werden dadurch nicht aus dem Quellenarchiv gelöscht.
- Ab der Umstellung neu geladene Browseransichten müssen die aktuelle Auswahl erneut beziehen und abgelaufene Angebote ausblenden; ein späterer Wochenwechsel darf nicht dauerhaft eine leere oder überholte Auswahl erzeugen, wenn der Server bereits die neue vollständige Woche ausliefert. Bereits vor der Umstellung geladene alte Anwendungsversionen benötigen einmalig einen vollständigen Reload.
- Der bestehende KW40-Sonderfall bleibt unverändert. Neue Ausnahmen brauchen konkreten Originalnachweis; keine pauschale Feiertagsverlängerung.
- Es gibt keinen automatischen Rücksprung auf einen externen Anbieterlink, auf eine ältere Woche oder auf historische Beispielprodukte. Bei fehlender Ausgabe erscheint ein verständlicher Hinweis.

Die Darstellung DE links/NL rechts, mobil untereinander, und das bestehende Website-Design bleiben unverändert.

Die bisher fest in den Browser-Build eingebettete Angebotsliste wird für laufende Aktualisierungen durch einen lesenden öffentlichen Endpunkt `GET /api/content/offers` ergänzt. Er liefert ausschließlich die aktuell zulässigen öffentlichen Angebotsdaten samt zugehörigen lokalen Flyerlinks aus derselben serverseitigen Paketauswahl, mit `Cache-Control: no-store`. Keine privaten Layout-/Accountdaten, kein Schreibzugriff und kein Import über diesen Endpunkt. Die initial gerenderte Liste und spätere Aktualisierungen verwenden dieselbe Auswahlregel; der Client führt seine bestehende Suche und Kategorienfilterung darauf aus. Fehler leeren die betroffene aktuelle Auswahl, statt alte Preise fortzuschreiben. Der neue Endpunkt wird zusätzlich zu den beiden bestehenden Content-APIs geprüft.

## 4. Vollständigkeit und Fehlerverhalten

„Woche vollständig“ setzt beide gültigen Originale, beide Covers, alle geprüften Angebotsblöcke und sämtliche Datei-/Quellenprüfungen voraus. Ein einzelner erfolgreicher PDF-Import, ein Git-Push oder eine fehlerfreie API-Struktur reichen nicht.

Fehler werden getrennt ausgewiesen: Quelle/Anmeldung, Originalprüfung, fehlende Angebotszuordnung, Dateiintegrität, Build, Bereitstellung und öffentliche Abnahme. Ein externer Quellenausfall nach erfolgreichem Import ist kein Ausfall der weiterhin gültigen lokalen Veröffentlichung. Er kann die nächste Vorbereitung beeinträchtigen und wird entsprechend eingeordnet.

Die bestehende Vorgabe zur Teilverfügbarkeit bleibt bestehen: Fehlt beispielsweise NL, bleibt ein vollständig geprüftes DE-Original mit seinen korrekt gebundenen Angeboten verfügbar. Der Lauf steht trotzdem auf unvollständig/Fehler; es gibt keine vollständige Wochenfreigabe. Ungeprüfte Teile werden nicht veröffentlicht, alte Gültigkeiten nicht verlängert. Ein defekter Teil darf nicht durch eine Rückfallregel wieder erscheinen.

Bekannte, ausdrücklich freigegebene NL-Preis-/Grundpreisabweichungen bleiben im unveränderten Original mit den bestehenden Warnhinweisen erhalten. Keine stillen Preiskorrekturen. Falsche Woche, fehlender Ursprung, beschädigte Datei oder mehrseitige NL-PDF bleiben blockierend.

## 5. Build, Deployment und öffentliche Abnahme

Der Prebuild prüft lokale Originale und Covers sowie `offers:check`. Ein Build einer archivierten Woche setzt keine heute gültige Werbung voraus; er prüft die deklarierten Pakete. Der gezielte Wochenlauf prüft zusätzlich, ob die angeforderte Woche vollständig vorhanden ist.

Veröffentlichung nach dem bestehenden `docs/DEPLOYMENT-RUNBOOK.md`: nur eigene geprüfte Dateien committen/pushen, frischen Release auf dem bestätigten Hetzner-Host bauen, Prüfungen unter Linux wiederholen, atomar umschalten, Bereitschaft prüfen und bei Fehler zum vorherigen Release zurückkehren. Nicht im laufenden `current` editieren. Keine DNS-, Vertrags-, Zahlungs-, Miet- oder Mailänderungen.

Die öffentliche Kontrolle lädt DE- und NL-PDF sowie Covers vom eigenen HTTPS-Origin herunter und vergleicht die tatsächlichen Bytes mit den Paket-Hashes. Sie gleicht beide Content-APIs und die sichtbaren Links/Bilder auf `/`, `/angebote`, `/handzettel`, `/nl` ab. Zusätzlich werden `/produkte` und die zugehörigen Warengruppen auf vollständige, zeit- und quellengerechte Angebotsauswahl sowie funktionierende Originalseitenlinks geprüft. Desktop-/Mobilprüfung bestätigt Lesbarkeit, vollständige Motive und unverändertes Layout.

Erst danach dürfen `websiteVerified` und `deploymentVerified` positiv sein. Vorbereitungsstatus, veröffentlichter Commit und Live-Prüfergebnis werden getrennt protokolliert.

## 6. Bestehende Automationen

Nach Implementierung werden die beiden bestehenden Aufgaben aktualisiert, nicht dupliziert:

- Sonntag 17:00 Europe/Berlin: Folgewoche vollständig beziehen, prüfen, einschließlich sämtlicher Angebotskacheln als neuen Release ausliefern und Startdatums-Auswahl testen.
- Täglich 06:15 Europe/Berlin: tatsächliche öffentliche Wochenanzeige, Originaldateien, Hashes, Kachelbindung und Ablauf prüfen. Bei reparierbarem Quellenproblem einmal gezielt nacharbeiten; unveränderte Blocker nicht täglich erneut melden.

Benachrichtigungen nur bei relevanter Änderung, Fehler, behobenem Ausfall oder nötiger Nutzeraktion. Die Aufgaben bleiben vom eingeschalteten Mac, der laufenden Codex-App und erforderlichen Canva-/Browseranmeldungen abhängig. Ein dauerhafter Server-Canva-Zugang oder unbeaufsichtigter Serverimport wird nicht behauptet und nicht neu eingerichtet.

## 7. Abnahmekriterien und Regressionen

- [ ] Geprüfter DE-Handzettel bleibt mit unterbrochenem externem Ursprung vollständig nutzbar.
- [ ] DE und NL verwenden auf sämtlichen genannten Seiten/APIs lokale Originale und vollständige Covers.
- [ ] Aktuelle KW41 enthält unverändert 107 DE- und 21 NL-Angebotsblöcke; Preise/Bedingungen bleiben Originalinhalt.
- [ ] Originalhash-/Versionswechsel, falsche Woche oder fehlendes Bild verhindern die betroffene Freigabe.
- [ ] Beschädigte PDF, falsche Seitenzahl, fremde Weiterleitung, Teil-Download und Größenüberschreitung haben Regressionstests.
- [ ] Teilfehler erhält andere gültige Inhalte, meldet aber keine vollständige Woche.
- [ ] Vorbereitung der Folgewoche beeinträchtigt die laufende Woche nicht; Berliner Start-/Endgrenzen, Sommerzeit und KW40-Ausnahme sind geprüft.
- [ ] Wochenwechsel funktioniert auch bei bereits geöffnetem Sortiment; keine dauerhafte alte Client-Auswahl.
- [ ] Sauberer Checkout und Linux-Release benötigen keine privaten Canva-Rohordner zur Prüfung veröffentlichter Dateien.
- [ ] Vollständiger Testlauf, Lint, TypeScript, Build, öffentlicher HTTP-Audit, Content-Prüfung und Desktop-/Mobilabnahme dokumentiert.
- [ ] Bestehende Sonntags-/Tagesaufgaben aktualisiert; Zeitplan und zurückhaltende Benachrichtigungen erhalten.

Nicht Bestandteil: Bewerbungsportal, Newsletter, neue Bestell-/Zahlungsfunktionen, Social-Icons, Personaländerungen oder ein WWS-Vollsortiment.
