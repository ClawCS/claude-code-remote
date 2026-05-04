# Claude Code Prompt — Trinkgut Jammers Go-Live Fixes

Du arbeitest im Projekt:

`/Users/niko/Desktop/Homepage/trinkgut-jammers-v2`

Ziel: Die Website soll go-live-fähig werden. Bitte nicht kosmetisch herumspielen, sondern die unten priorisierten Bugs, Sicherheitsrisiken, Ungleichmäßigkeiten und Conversion-/Trust-Probleme sauber beheben.

Wichtig:
- Arbeite sorgfältig und inkrementell.
- Keine Secrets ausgeben oder committen.
- Keine bestehenden Inhalte löschen, außer sie sind klar kaputt/Platzhalter.
- Nach jedem größeren Block: `npm run build` und `npm run lint` prüfen.
- Am Ende eine klare Zusammenfassung liefern: was geändert wurde, was noch offen ist, welche Tests laufen.
- Falls du etwas nicht sicher entscheiden kannst: markiere es als TODO mit konkreter Empfehlung, aber blockiere nicht unnötig.

---

## 0. Aktueller Audit-Stand

Geprüft wurden alle App-Routen, Kategorien und Produktseiten.

Bekannte Gates:
- `npm run build`: läuft erfolgreich.
- `npm run lint`: aktuell fehlerhaft mit ca. 45 Errors / 10 Warnings.
- Interne Links: grob keine 404 gefunden.
- Viele Routen liefern HTTP 200, aber es gibt Go-Live-Blocker bei Form-Zustellung, Datenschutz, API-Schutz, Produktdaten und UX-Polish.

---

# PRIORITÄT 1 — Go-Live-Blocker

## 1. API-Key / Secrets / Abuse-Schutz

### Problem
`.env.local` enthält lokal einen echten `GEMINI_API_KEY`. Die Datei ist ignoriert, aber der Key sollte als sensibel behandelt werden.

### Aufgaben
- Prüfe `.gitignore`, dass `.env*`, `.env.local`, Upload-/Datenordner und private Bewerbungsdaten sicher ignoriert sind.
- Keine Secrets in Code, Logs oder Beispiel-Dateien schreiben.
- `.env.example` erstellen oder aktualisieren mit Platzhaltern:
  - `GEMINI_API_KEY=`
  - `CRON_SECRET=`
  - ggf. weitere benötigte Env-Variablen.
- In der finalen Antwort erwähnen: Key sollte rotiert werden, falls jemals geteilt/hochgeladen.

## 2. Öffentliche KI-Endpunkte absichern

Betroffene Dateien:
- `app/api/chat/route.ts`
- `app/api/kuehlschrank/route.ts`
- `app/api/leergut-scan/route.ts`

### Probleme
- Jeder Besucher kann Gemini-Kosten erzeugen.
- Upload-Endpunkte brauchen klare Dateigrößen-/MIME-Prüfung.
- Datenschutz muss Google/Gemini-Verarbeitung erklären.

### Aufgaben
- Einfaches serverseitiges Rate-Limit einbauen, mindestens in-memory pro IP/User-Agent für lokale/kleine Deployment-Variante.
- Bei Uploads prüfen:
  - nur `image/jpeg`, `image/png`, `image/webp`
  - max. Dateigröße sinnvoll begrenzen, z.B. 8–10 MB
  - bei invalidem Input saubere `400` JSON-Antwort.
- Fehlerantworten nutzerfreundlich und ohne interne Details.
- Optional: Kommentar/TODO für produktives Rate Limit via Upstash/Vercel KV/Cloudflare Turnstile.

## 3. Handzettel-Cron schützen

Datei:
- `app/api/handzettel/cron/route.ts`

### Problem
Schutz greift nur, wenn `CRON_SECRET` gesetzt ist. Ohne Secret ist der Endpoint öffentlich triggerbar.

### Aufgabe
- Wenn `CRON_SECRET` fehlt: nicht offen ausführen. Rückgabe `500` oder `401` mit sicherer Fehlermeldung.
- Wenn gesetzt: `Authorization: Bearer <CRON_SECRET>` verlangen.

## 4. Formulare: Bestellungen, Gewinnspiel, Newsletter

Betroffene Dateien:
- `app/checkout/page.tsx`
- `app/gewinnspiel/page.tsx`
- `components/NewsletterSignup.tsx`

### Problem
Aktuell läuft vieles über `mailto:` + localStorage. Nutzer können denken, etwas sei wirklich gesendet, obwohl nur der Mailclient geöffnet wurde oder gar nichts passiert.

### Aufgaben
Option A bevorzugt, wenn schnell sauber machbar:
- Server-API-Routes für Checkout/Bestellung, Gewinnspiel und Newsletter anlegen.
- Daten serverseitig validieren.
- Für lokale Übergangslösung: E-Mail-Versand nur vorbereiten, aber UX muss ehrlich sein.

Wenn echter Mailversand noch nicht eingerichtet ist:
- UI-Texte anpassen: „Mailprogramm öffnet sich — bitte dort absenden“.
- Keine falschen Erfolgsmeldungen anzeigen, solange keine serverseitige Bestätigung existiert.
- localStorage nicht als echte Zustellung darstellen.

## 5. Bewerbungen produktionsfähig machen oder ehrlich markieren

Betroffene Dateien:
- `app/api/bewerbung/route.ts`
- `app/bewerbung/page.tsx`

### Probleme
- Bewerbungen inkl. Anhänge werden lokal in `data/bewerbungen` gespeichert.
- Auf Vercel/serverless nicht persistent/zuverlässig.
- Sensible personenbezogene Daten brauchen Datenschutz/Retention/Zugriffsschutz.

### Aufgaben
- Wenn kein echtes Storage/Mail-System eingerichtet ist: UX ehrlich machen.
- Upload-Validierung prüfen/verbessern:
  - erlaubte MIME-Typen
  - Dateigrößenlimit
  - Gesamtlimit
  - sichere Dateinamen
- Datenschutz-Hinweis direkt am Formular ergänzen.
- In Datenschutzerklärung Bewerbungsdaten/Anhänge ergänzen.
- TODO-Kommentar für produktives Storage/Mail-System setzen, falls nicht direkt lösbar.

---

# PRIORITÄT 2 — Datenqualität, Trust, Produktseiten

## 6. Produktdetailseiten: `EAN: undefined` entfernen

Dateien:
- `app/produkte/[slug]/page.tsx`
- `data/products.json`

### Problem
143/143 Produkte haben keine `ean`, aber Detailseiten zeigen offenbar `EAN: undefined`.

### Aufgabe
- EAN-Feld nur anzeigen, wenn echte EAN vorhanden ist.
- Gleiches für andere optionale Felder prüfen: keine `undefined`, `null`, leere Labels oder kaputte Werte rendern.

## 7. Produkttexte mit harten `...` bereinigen

Datei:
- `data/products.json`

### Problem
Viele Beschreibungen/Units sind abgeschnitten: z.B. „1 l = € 1.97...“.

### Aufgaben
- UI robust machen: abgeschnittene Daten nicht unseriös darstellen.
- Falls Datenquelle nicht sofort besser verfügbar ist:
  - `...` sauber als gekürzten Text behandeln oder entfernen.
  - Einheit/Grundpreis nur anzeigen, wenn verständlich.
- Wichtig: Keine Produktdaten erfinden.

## 8. „Über 7.000 Artikel online bestellen“ ehrlich formulieren

Betroffene Dateien:
- `app/layout.tsx`
- `components/Hero.tsx`
- `app/page.tsx`
- ggf. Footer/SEO

### Problem
Online sichtbar sind aktuell 143 Produkte; Copy verspricht „7.000 Artikel online bestellen“. Das kann wie falsches Versprechen wirken.

### Aufgabe
Copy ändern zu z.B.:
- „Über 7.000 Artikel im Markt — online eine Auswahl entdecken.“
- „143 aktuelle Highlights online ansehen.“
- „Für vollständiges Sortiment: anrufen/WhatsApp/Marktbesuch.“

---

# PRIORITÄT 3 — Assets/Layout/Polish

## 9. Fehlende Assets/404-Hintergründe fixen

Betroffene Dateien:
- `components/Hero.tsx`
- `components/CategoryBackground.tsx`

Bekannt fehlend:
- `/images/gallery/ig-00.jpg`
- `/videos/categories/*.mp4`
- `/animations/*.json`

### Aufgaben
- Prüfe alle referenzierten lokalen Assets gegen `public/`.
- Fehlende Assets entweder hinzufügen, durch vorhandene Bilder ersetzen oder graceful fallback einbauen.
- Keine 404 für dekorative Medien im Go-Live-Zustand.

## 10. Deutsche Copy/Umlaute korrigieren

Betroffene Beispiele:
- `Kuehlschrank`, `ueber`, `fuer`, `Zurueck`, `Blaettere`, `Gueltig`, `Maerz`, `Geschaeftsfuehrer`, `Unterstuetzung`, `prasentiert`, `Jurgenstr.`

Betroffene Dateien u.a.:
- `components/VideoHero.tsx`
- `app/gewinnspiel/page.tsx`
- `app/handzettel/page.tsx`
- `app/akademie/zertifikate/page.tsx`
- `app/bewerbung/page.tsx`
- `app/community/page.tsx`
- `app/bierkarte/page.tsx`
- `data/gallery.ts`

### Aufgaben
- Sichtbare deutsche Texte auf echte Umlaute korrigieren:
  - ue → ü
  - ae → ä
  - oe → ö
  - ss → ß, wo passend
- Adresse prüfen: offiziell vermutlich `Jürgensstraße/Jurgenstr.?` Nicht blind ändern, aber sichtbare Schreibweise konsistent machen.
- Besonders Startseite/Event-Hero korrigieren:
  - „präsentiert“
  - „Unterstützung“
  - „für euch da“

## 11. Telefonnummern/WhatsApp konsistent machen

Betroffene Dateien:
- `components/Footer.tsx`
- `components/WhatsAppButton.tsx`
- `app/nl/page.tsx`
- `app/akademie/zertifikate/page.tsx`

### Probleme
- WhatsApp mal `0175...`, mal `0176...`
- `tel:+4928234187071` hat vermutlich eine Ziffer zu viel, sichtbarer Text ist `02823-418707`.

### Aufgaben
- Einheitliche Telefonnummer verwenden:
  - Markt: `02823-418707`
  - Mobil/WhatsApp: `0176-63228597`, falls korrekt.
- `tel:`-Links korrekt formatieren:
  - `tel:+492823418707`
  - `tel:+4917663228597`
- Alle Footer/Header/CTA/NL-Seite angleichen.

## 12. KI-Assistent menschlicher/lokaler machen

Dateien:
- `components/AIAssistant.tsx`
- `app/api/chat/route.ts`

### Problem
„Powered by Gemini AI“ und „Assistent über ALLES“ wirkt wie KI-Demo, nicht wie lokaler Getränkemarkt.

### Aufgaben
- Ton ändern: „Getränkeberater“ / „Frag uns“ / „Jammers Helfer“ statt AI-Hype.
- Erwartungen begrenzen:
  - Sortiment
  - Partyplanung
  - Öffnungszeiten
  - Leergut
  - Empfehlungen
- Kein übertriebener KI-Claim.
- Datenschutz-Hinweis ergänzen: keine sensiblen Daten eingeben.

---

# PRIORITÄT 4 — SEO, Navigation, rechtliche Klarheit

## 13. Metadata pro Route verbessern

Problem:
Viele Routen haben identischen Titel/Description: `Trinkgut Jammers Goch – Dein Getränkemarkt Online`.

### Aufgaben
Für wichtige Seiten eigene Metadata setzen:
- `/produkte`
- `/angebote`
- `/partyplaner`
- `/vermietung`
- `/finder`
- `/leergut`
- `/cocktails`
- `/akademie`
- `/bewerbung`
- `/gewinnspiel`
- `/nl`
- Kategorien `/kategorie/[slug]`
- Produktdetails `/produkte/[slug]`

## 14. Sitemap erweitern

Datei:
- `app/sitemap.ts`

### Aufgaben
Sitemap erweitern um:
- alle statischen App-Routen
- Kategorien
- Produkte
- Akademie-Kurse

Keine kaputten/experimentellen Seiten aufnehmen, wenn sie nicht live sichtbar sein sollen.

## 15. Header-Navigation prüfen

Datei:
- `components/Header.tsx`

### Problem
`/angebote` existiert, ist aber im Header nicht sauber sichtbar; Header führt primär zu `/handzettel`.

### Aufgaben
- „Angebote“ prominent einbauen oder klar mit Handzettel koppeln.
- Mobile Navigation ebenfalls prüfen.
- Keine wichtigen Live-Seiten verstecken.

## 16. Gewinnspiele/Leaderboard rechtlich klarer machen

Betroffene Dateien:
- `app/gewinnspiel/page.tsx`
- `app/tippkick/page.tsx`
- `app/community/page.tsx`

### Aufgaben
- Teilnahmebedingungen sichtbarer machen.
- Altershinweis, Laufzeit, Ausschluss Rechtsweg, Veranstalter, Datenschutz ergänzen.
- Bei alkoholbezogenen Gewinnen Altersprüfung/18+ Hinweis ergänzen.

---

# PRIORITÄT 5 — Lint/Codequalität

## 17. `npm run lint` auf grün bringen

Bekannte Probleme:
- `components/CategoryBackground.tsx`: Hook-Regel verletzt.
- `app/gluecksrad/page.tsx`: `Math.random()` im Render.
- `app/battle/page.tsx`: `Math.random()` im Render.
- Viele `<a href="/">` statt `Link` von `next/link`.
- `context/WishlistContext.tsx`: synchrones `setState` in Effect.
- `lib/i18n.ts`: synchrones `setState` in Effect.

### Aufgaben
- Lint-Fehler sauber beheben, nicht einfach Regeln deaktivieren.
- Interne Navigation mit `next/link`.
- Randomisierte Werte in `useMemo`/`useEffect`/State verlagern, damit Render stabil ist.
- React-Hook-Regeln einhalten.

## 18. Next.js / Dependencies aktualisieren

Problem:
`npm audit --omit=dev` meldet Next.js high severity; Fix auf `next@16.2.4` verfügbar. Außerdem PostCSS moderate.

### Aufgaben
- Next.js auf sichere Patch-Version aktualisieren, wenn kompatibel.
- Lockfile aktualisieren.
- Danach Build/Lint testen.

## 19. Turbopack Root Warning beheben

Problem:
Next erkennt wegen `/Users/niko/package-lock.json` falschen Workspace Root.

### Aufgabe
- In `next.config.ts` `turbopack.root` explizit auf Projektordner setzen oder andere saubere Lösung wählen.
- Keine zufälligen Dateien außerhalb des Projekts löschen, außer ausdrücklich sicher.

---

# Erwartetes Endergebnis

Bitte am Ende liefern:

1. Kurze Zusammenfassung der wichtigsten Fixes.
2. Liste der geänderten Dateien.
3. Testergebnisse:
   - `npm run build`
   - `npm run lint`
   - ggf. `npm audit --omit=dev`
4. Offene Punkte, falls echte externe Dienste fehlen, z.B. Mailversand, Storage, Captcha, Vercel KV.
5. Einschätzung: „Go-live bereit“ oder „noch blockiert durch …“.

Arbeite jetzt die Punkte nach Priorität ab. Starte mit Security/Formularen/Datenschutz, dann Produkt-/UX-Polish, dann Lint/SEO.
