# Echte Cocktailfotos pflegen

Niko hat am 05.10.2026 echte, rezeptgetreue Internetfotos für die Cocktails und eine behutsame Gestaltung freigegeben. Die übrigen Rubriken bleiben an die Quellenregel in `AGENTS.md` gebunden.

## Auswahl

- Maßgeblich ist das vorhandene Rezept in `data/cocktails.ts`: Spirituose, sichtbare Farbe, wesentliche Zutaten, Zubereitung und Darreichung vergleichen. Keine andere Geschmacksrichtung, Mocktail-Variante oder undurchsichtige Werbetasse als angeblich passendes Getränk ausgeben. Kleine Unterschiede bei Glas oder Garnitur nachvollziehbar dokumentieren; exakte Milliliterangaben lassen sich nicht aus einem Foto beweisen.
- Nur echte Fotografien mit belegter kommerzieller Wiederverwendung. Quelle, Urheber, Titel, konkrete Lizenz und gegebenenfalls Änderungen müssen nachvollziehbar sein. Ein Suchergebnis oder ein Downloadbutton allein ist keine Nutzungserlaubnis. Keine NC-Lizenzen, ungeklärten Blogbilder oder KI-Motive verwenden; keine kostenpflichtigen Lizenzen ohne Betreiberfreigabe kaufen.
- Original und Lizenzbeleg bleiben lokal unter dem ignorierten Verzeichnis `assets/source/cocktails/`. Bei Flickr-Ursprüngen Quelle und aktuellen Lizenznachweis direkt abgleichen. Ratenbegrenzungen respektieren; keine Proxy-/Zugriffsumgehung. Fehlende oder abgelehnte Motive nicht als fertig melden.

## Einbau

`data/cocktail-photo-candidates.json` dokumentiert die Auswahl. Ausschließlich `status: "approved"` wird von `data/cocktail-images.ts` ausgeliefert. Ein ungeprüfter Eintrag erzeugt kein Ersatzbild. Pro Rezept genau ein passender Name; die bestehende Rezept-URL wird nicht vom Dateinamen abgeleitet.

Freigegebene lokale WebP-Dateien liegen in `public/images/cocktails/`, mit Originalquelle, Urheber, Lizenzlink, Bildmaßen und SHA-256 im Datensatz. Nicht freigegebene Derivate bleiben privat und gehören nicht in `public/`. Metadaten entfernen; Farben und Rezeptmotiv nicht künstlich verändern. Ein sinnvoller redaktioneller Ausschnitt ist nur mit passender Lizenz und ausdrücklichem Änderungshinweis zulässig.

`CocktailPhoto` wird in Übersicht, Kategorie und Detailseite wiederverwendet. Der vollständige lokale Bildausschnitt wird mit `object-contain` angezeigt. In Karten sind die Bildnachweise unter „Foto & Lizenz“ zugänglich, auf der Detailseite direkt sichtbar. BY-SA-Webfassungen behalten die entsprechende Lizenz; Herkunft und Änderungen nicht verstecken.

## Abnahme

1. Jedes ausgewählte Foto visuell prüfen, nicht nur den Titel. Namen, Maße und Hash gegen die lokale Datei abgleichen.
2. `npm test -- lib/__tests__/cocktail-photos.test.tsx lib/__tests__/cocktail-routes.test.ts` ausführen. Die Tests prüfen Auswahlstatus, Quellen-/Lizenzfelder, Metadatenfreiheit, Maße, Hash, Bildanzeige und Rezeptlinks.
3. Übersicht, mindestens eine Kategorie und neue Detailseiten per HTTP sowie auf Desktop und Mobil prüfen. Erst nach tatsächlichem Laden des Bildes Screenshots aufnehmen; die anfängliche Lazy-Loading-Fläche ist keine Bildabnahme. Keine horizontalen Überläufe oder abgeschnittenen Gläser durch CSS.
4. Vor Übergabe TypeScript, vollständige Testsuite, Lint und Build erneut prüfen. Nur eigene freigegebene Quellenmetadaten, Webbilder und Code stagen; private Originale und fremde Auditdateien auslassen.

Ein öffentlich erreichbarer Produktionsserver ist derzeit nicht eingerichtet. Git-Push und lokale Vorschau sichern beziehungsweise zeigen den Arbeitsstand, sind aber kein Live-Nachweis.
