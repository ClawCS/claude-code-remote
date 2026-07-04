# Audit-Report: trinkgut Jammers v2

> **Durchgang 1** (Opus 4.8): Multi-Agent-Audit, 9 Dimensionen, adversarial gegengeprüft, 92 Findungen + visuelle Stichprobe.
> **Durchgang 2** (Fable, 02.07.2026): Differential-Audit — Red-Team gegen Durchgang 1 + 8 neue Dimensionen. Siehe Abschnitt „Durchgang 2" unten.
> ⚠️ Einzelne v1-Findungen wurden in Durchgang 2 korrigiert — korrigierte Stellen sind markiert.

---

## 0. Visuelle Stichprobe (eigene Screenshots, Desktop + Mobile)

Direkt am laufenden Dev-Server beobachtet — ergänzt die statische Code-Analyse:

- **🔴 Produktbilder sind rohe Handzettel-Ausschnitte** (`/produkte`, Tippkick, Battle) — mit aufgedruckten Preisstörern (`10.⁹⁹`), Flyer-Rahmen und unterschiedlichen Croppings. **Das ist der mit Abstand stärkste „billig"-Eindruck der ganzen Seite.** Eine 50k-Seite hat freigestellte, einheitlich beleuchtete Produktfotos auf neutralem Grund. Solange hier Flyer-Crops liegen, kann kein Farb-/Font-Fix die Wertigkeit retten.
- **Floating-UI-Overkill:** AI-Bot (links) + Instagram/Maps/WhatsApp-Stack (rechts) + Cookie-Banner gleichzeitig am Bildrand — überlagert auf jeder Seite den Content. Auf Mobile kollidieren die Stacks am unteren Rand.
- **Mobile-Header überladen:** Logo + WM-Trophäe + Gewinnspiel-Geschenk + Suche + Herz + Hamburger auf 375 px — das rechte Icon clippt am Rand.
- **Ortswiderspruch sichtbar:** Footer nennt korrekt **Goch** (Jurgenstr. 20, 47574), das Wetter-Widget zeigt **Moers** und springende Temperaturen (27°/25°).
- **Stärkster Bereich = Getränkeakademie:** dunkle, konsistente Kurs-Header (Bierwissen, Whisky, Wassersommelier, Saft-Experte) wirken tatsächlich wertig — das ist die Design-Sprache, die für die ganze Seite gelten sollte.
- Keine Konsolen-Fehler auf den besuchten Seiten (`/`, `/produkte`, `/checkout`, `/akademie`).

---

## 1. Executive Summary

Die Seite hat echte Substanz und eine eigenständige Idee (Schiefer + Rot + Gold, cineastischer VideoHero, durchdachte Hover-/Stagger-Animationen, ein sauber gebautes Warenkorb-/Wishlist-State-System). Das Potenzial für einen Premium-Auftritt ist klar vorhanden. Aber sie wird auf mehreren Ebenen gleichzeitig untergraben: ein nur halb durchgesetztes Design-Token-System (Markenrot in drei Werten, Gold in drei Tönen, der wichtigste Wert der Seite — der Produktpreis — als unlesbares Gold mit 2,1:1 Kontrast), kritische Backend-Lücken (Persistenz schreibt auf ein read-only/ephemeres Vercel-Dateisystem → Bewerbungen, Punkte und Cache gehen verloren), mehrere faktische Widersprüche in den Texten, und Engagement-Features (Battle, Tippkick, Glücksrad), die Interaktion vortäuschen, aber nichts speichern.

**Gefühlte Preisklasse aktuell: „ambitionierter Freelancer / 3.000–6.000 €-Template", nicht 50.000 €-Agentur** — es wirkt „fast premium, aber von Hand zusammengeschraubt". Der Abstand zum Ziel ist nicht eine Frage von mehr Effekten, sondern von **Disziplin, Ehrlichkeit und Reduktion**: ein Rot, ein Gold, eine Display-Schrift, ein lesbarer Preis, echte Produktfotos, echte statt vorgetäuschte Features. Der teuerste Teil ist nicht das Design, sondern das Backend ehrlich zu machen.

## 2. Scorecard

| Dimension | Note | Kernsatz |
|---|---|---|
| Funktionale Bugs & React-State | **C** | State-Architektur solide, aber datengetriebene Features sichtbar kaputt (Battle-Slugs 0,00 €, Fake-Voting, doppelte Tippkick-IDs). |
| API-Endpunkte & Server-Security | **D** | Keys korrekt versteckt, aber Persistenz schreibt auf ephemeres Vercel-FS (Datenverlust) + fehlende Validierung/Auth/Rate-Limiting an POST-Routen. |
| Navigation, Links & Assets | **B** | Verlinkung & Bilder solide; Schwächen: fehlende Videos/Lotties, Soft-404 statt echtem 404, /kontakt nicht im Menü, unvollständige Sitemap. |
| Design-System & visuelle Wertigkeit | **C** | Starke Identität, aber drei Rot- und drei Gold-Werte parallel und der Produktpreis als WCAG-Fail-Gold — „fast premium". |
| Inhalt, Texte & Widersprüche | **C** | Flüssiges Deutsch, aber harte Zahlen-Widersprüche und eine Datenschutzerklärung, die den Gemini-Einsatz verschweigt (rechtlich heikel). |
| Barrierefreiheit (WCAG 2.1) | **D** | Grundlagen teils da, aber Overlays sind keine echten Dialoge (kein Fokus-Trap/ESC), Kontrast-Fails, fehlende Labels. |
| Performance & Next.js 16 | **D** | Fast alles `"use client"`; ~190 KB Akademie-Daten in den Startseiten-Bundle gezogen, LCP-Hero `unoptimized` (476 KB). |
| UX & End-to-End-Flows | **C** | Shop-Flow durchgängig, aber Checkout = Mailto-Attrappe (unehrlich kommuniziert), Engagement-Features speichern nichts. |
| Responsive & Mobile | **B** | Insgesamt solide responsive; zu kleine Touch-Targets, Floating-Stack-Kollision unten, fehlendes overflow-x-Sicherheitsnetz. |

## 3. Top-Kritisch (priorisiert)

**P1 — Persistenz auf lokalem Dateisystem — Prod-Blocker FALLS Serverless-Hosting (CRITICAL, konditional)** *(⚠️ korrigiert in D2/K3: Vercel ist NICHT belegt — kein vercel.json/.vercel, Hosting lt. docs offen)*
`lib/community-db.ts:4,43` · `app/api/bewerbung/route.ts:7,125,147,156` · `app/api/handzettel/fetch/route.ts:8,85`
Impact: FALLS auf Vercel/Serverless deployt wird, ist das FS read-only/ephemer → **Bewerbungen (inkl. Uploads), Community-Punkte und Cache gehen verloren oder werfen EROFS.** Auf einem VPS mit `next start` funktioniert die fs-Persistenz (mit Backup-/Concurrency-Risiken).
Fix: **Zuerst Hosting-Entscheidung treffen (eigener Welle-1-Blocker).** Bei Serverless: KV/Blob-Stores. Bei VPS: Schreibpfad + Backups dokumentieren.

**P2 — Rate-Limiter wirkungslos + Gemini-Calls ungeschützt (HIGH)**
`lib/rate-limit.ts:7,9-15,17`
Impact: In-memory & per-Instanz → auf Vercel teilt sich kein State. IP aus erstem `x-forwarded-for`-Eintrag → frei spoofbar. Die teuren Gemini-Calls (chat/kuehlschrank/leergut) sind **ungeschützt gegen Kosten-Flooding**.
Fix: Redis/KV-basiertes Shared-Rate-Limiting; IP aus plattformgesetztem Hop bzw. `x-real-ip`.

**P3 — community POST ohne Auth/Rate-Limit → Leaderboard frei manipulierbar (MEDIUM, trivial ausnutzbar)** *(⚠️ korrigiert in D2/K1: Monatspreis ist ein Gratis-Kasten (~15–20 €), NICHT der 1.000-€-Gutschein — der gehört zu Tippkick)*
`app/api/community/route.ts:77,125-168`
Impact: `curl` mit `{action:"add_points",…}` = 20 Pkt/Call, beliebig oft. Monatssieger (ein Kasten gratis) trivial cheatbar; `register` bläht User-Store unbegrenzt auf (DoS).
Fix: `rateLimit()` ergänzen, Cooldowns/Tageslimits, Punkte an server-validierte Events binden.

**P4 — Battle-Voting ist eine Attrappe (HIGH-funktional)**
`app/battle/page.tsx:212-232,359-392`
Impact: Jeder sieht 100 %/0 %, Zähler steht auf 1. Feature funktionslos und sichtbar fake.
Fix: `/api/battle` (GET counts / POST vote), ODER Prozentbalken entfernen und ehrlich labeln.

**P5 — Battle-Daten: 7/10 Slugs existieren nicht → 0,00 € + leere Bilder (MEDIUM)** *(D2/K7: real 7, nicht 6 — einer per Inline-Fallback kaschiert)*
`app/battle/page.tsx:50-74,95-107`
Fix: Slugs gegen `products.json` korrigieren oder Duelle mit fehlendem Produkt herausfiltern.

**P6 — bewerbung POST: MIME-Allowlist umgehbar + kein Rate-Limit (MEDIUM)**
`app/api/bewerbung/route.ts:62,97`
Impact: `entry.type &&` lässt leeren Content-Type durch → Allowlist umgangen; anonym beliebig viele 30-MB-Bundles auf die Platte (DoS).
Fix: `!entry.type || !ALLOWED_TYPES.has(entry.type)`, MIME per Magic-Bytes, `rateLimit()`, Uploads in Blob-Store.

**P7 — chat POST crasht bei Nicht-Array `messages` (LOW, sicherer 500 in Prod)**
`app/api/chat/route.ts:146-152`
Fix: `if (!Array.isArray(messages) || messages.length===0) return 400`; Anzahl/Länge begrenzen.

**P8 — Tippkick: Produkt-ID 68 doppelt → Warenkorb-Merge unter falschem Namen/Preis (MEDIUM)**
`app/tippkick/page.tsx:103,136`
Fix: Eindeutige/echte `products.json`-IDs.

## 4. Widersprüche & Falschangaben (Inhalt)

- **Mitarbeiterzahl: 10 vs. 14** auf verschiedenen Seiten — eine Zahl durchziehen.
- **Zwei verschiedene Instagram-Follower-Zahlen** + unbelegte „4.558 Follower / 217 Beiträge".
- **Zwei unterschiedliche Mobilnummern** — eine Single Source of Truth.
- **Divergierende Firmen-/Rechtsformbezeichnungen** zwischen Seiten (Impressum-Risiko).
- **Unbelegte „4,6 ★ Google"** ohne Bewertungsanzahl — mit `n` belegen oder entfernen.
- **🔴 Datenschutzerklärung deckt Google Gemini nicht ab** (Chat, Bild-Uploads bei Leergut-/Kühlschrank-Scan). **Rechtlich der kritischste Inhaltspunkt** — Nutzerbilder gehen an einen US-Anbieter, ohne dass die DSE das erwähnt. *(⚠️ korrigiert in D2/K4: das in v1 zitierte Cookie-Wortlaut-Zitat existiert so nicht in der DSE; der belegbare Kern — Gemini fehlt komplett — bleibt.)*
- **Veraltetes/inkonsistentes „aktuelles" Gewinnspiel** vs. Startseite.
- ~~**SocialProof-Sektion ist leer**~~ *(⚠️ GESTRICHEN in D2/K5: Sektion ist nicht leer, sondern ein Google-Reviews-CTA mit 4,6★-Anzeige. Nicht entfernen — stattdessen echte Zitate integrieren oder klar als Google-CTA gestalten.)*
- ~~**Ortswiderspruch:** Wetter-Widget = Moers~~ *(⚠️ GESTRICHEN in D2/K2: kein Bug — das Widget geolokalisiert bewusst die Besucher-IP mit Goch-Fallback; der Auditor sah sein eigenes Standort-Wetter.)*
- **Checkout = Mailto-Attrappe**, aber Hero verspricht „Online entdecken." → unehrlich kommuniziert.

## 5. Design-Upgrade: Der Plan zum 50k-Look

Die teuren Teile sind schon da (Schiefer-Textur, VideoHero, Hover). Was fehlt, ist **Disziplin und Reduktion**. Reihenfolge nach Wirkung/Aufwand:

**A) Echte Produktfotos statt Handzettel-Crops — der #1 Wertigkeits-Hebel (Aufwand L, aber unverzichtbar)**
Freigestellte Flaschen-/Kasten-Fotos auf neutralem Grund, einheitliche Beleuchtung/Croppings, KEINE aufgedruckten Preisstörer. Solange Flyer-Ausschnitte liegen, wirkt keine Karte teuer.

**B) Produktpreis lesbar machen (Aufwand S)** — `ProductCard.tsx:84` + `globals.css:614`
Vorher: `gold-price` = `#D4A853` auf `#FDFCFB` → ~2,15:1, WCAG-Fail, verwaschen.
Nachher: `color:#1A1A1A`, `font-weight:800`, `font-size:1.375rem`, `letter-spacing:-0.01em`, `text-shadow` entfernen. Gold nur noch als 3px-Akzentstrich darunter. Wertigkeit + Conversion + A11y in einer Regel.

**C) Eine echte Display-Schrift einführen (Aufwand S)** — `app/layout.tsx:2`
Aktuell ist **alles** Plus Jakarta Sans → liest sich wie ein Template. `--font-display` (Fraunces oder Clash Display) für alle H1/H2, Jakarta bleibt Body/UI.

**D) Ein Rot, ein Gold — Token-Disziplin (Aufwand L)**
Verifizierte Streuung: **83× hartkodiertes `[#DC2626]`**, **15× abweichendes `#C41E3A`/`rgba(196,30,58)`**, Gold in drei Tönen (`#D4A853`/`#F59E0B`/`#FFD700`), plus eingestreute Tailwind-`red-*`. Ziel-Tokens in `@theme inline` (`globals.css:3`):
```
--color-primary:      #DC2626   /* EINZIGES Rot — #C41E3A eliminieren */
--color-primary-dark: #B91C1C
--color-primary-deep: #7A1428   /* Burgundy als Token */
--color-gold:         #C8962C   /* EIN Gold als Text — erfüllt Kontrast */
--color-gold-bright:  #F0C24B   /* nur Glows/Shimmer auf Dunkel */
--color-ink:          #1A1A1A
```

**E) Hero an VideoHero angleichen (Aufwand M)** — `Hero.tsx`
Hero ist bunt/„festlich" (30 Shimmer-Partikel Z.37, Regenbogen-Gradient-Headline Z.85), direkt darunter der cineastische VideoHero. Partikel 30 → 6–8, nur Gold, eine Ecke. Gradient-Headline → eine ruhige Farbe (Weiß + ein Gold-Akzent). Whitespace statt Effekt-Dichte.

**F) Homepage-Rhythmus brechen (Aufwand M)** — `app/page.tsx`
5 von 7 Sektionen mit identischem `py-20 md:py-24`, identischem Eyebrow (6× wörtlich gleich), gleicher H2-Größe *(D2/K7: Zahlen korrigiert — These bleibt gültig)*. Vertikalen Rhythmus variieren, 1–2 Sektionen bewusst breiter/dunkler, Eyebrow auf `tracking-[0.25em]`.

**G) Kontrast auf Dunkel (Aufwand S)** — `Hero.tsx:92,128`
Subtitle `text-white/60` und Trust-Labels `text-white/40` (~1,8:1, Fail) → `/75` bzw. `/85`.

**H) Floating-UI entrümpeln (Aufwand S)** — AI-Bot + Instagram/Maps/WhatsApp + Cookie gleichzeitig. Auf einen dezenten Stack reduzieren, Mobile-Kollision unten lösen.

## 6. Quick Wins (<1 Tag, hohe Wirkung)

1. **Preis-CSS fixen** (`globals.css:614`) — dunkel statt Gold.
2. **`unoptimized` vom LCP-Hero entfernen** (`Hero.tsx:15-22`) — 476 KB → ~70–120 KB AVIF/WebP.
3. **chat-Route gegen Nicht-Array härten** (`app/api/chat/route.ts:146`).
4. ~~Leere SocialProof-Box entfernen~~ → **korrigiert (D2/K5):** Box ist ein Google-Reviews-CTA; echte Zitate ergänzen statt entfernen.
5. **Hero-Kontrast** `text-white/40`/`/60` → `/75`–`/85` (`Hero.tsx:92,128`).
6. **`4,6★` mit Bewertungsanzahl belegen** oder entfernen.
7. **Tote Video-/Lottie-Schicht aus `CategoryBackground.tsx` entfernen** (Z.24,122).
8. **/kontakt in Footer/Header-Menü aufnehmen.**
9. **Battle: fehlende Slugs filtern** statt 0,00 € rendern (`app/battle/page.tsx:50-74`).
10. **Tippkick-Duplikat-ID 68 auflösen** (`app/tippkick/page.tsx:103,136`).
11. **Eyebrow auf `tracking-[0.25em]`** über alle 6 Vorkommen in `page.tsx`.
12. **Checkout-Erfolgsmeldung ehrlich** formulieren; `clearCart` nicht vor bestätigtem Versand.
13. ~~Wetter-Widget auf Goch stellen~~ → **GESTRICHEN (D2/K2):** IP-Geolokalisierung ist ein Feature, kein Bug.

## 7. Roadmap

**Welle 1 — Sofort (heute/morgen)**
- Preis-CSS dunkel + lesbar · LCP-Hero `unoptimized` raus · chat-Route Array-Validierung
- Hero-Kontrast & Eyebrow-Tracking · Leere SocialProof-Box entfernen
- Battle-Slugs filtern, Tippkick-ID-Dublette fixen · Wetter-Ort korrigieren · Floating-UI reduzieren

**Welle 2 — Diese Woche**
- **Persistenz auf KV/Blob umstellen** (Community, Bewerbungen, Cache) — der eigentliche Prod-Blocker
- Rate-Limiter auf Redis/KV + IP-Quelle fixen; `rateLimit()` an community & bewerbung
- bewerbung MIME-Allowlist + Magic-Bytes
- **Datenschutzerklärung um Gemini-Einsatz erweitern** (rechtlich) + Cookie-Aussage korrigieren
- Inhaltliche Widersprüche bereinigen (Mitarbeiterzahl, Nummern, Follower, Rechtsform)
- Display-Font einführen · Token-Disziplin Phase 1 (ein Rot/ein Gold)

**Welle 3 — Größer**
- **Echte Produktfotografie** (freigestellt) statt Handzettel-Crops
- Server/Client-Boundary sanieren: Startseite & Detailrouten zu RSC, Akademie-Daten aus Client-Bundle ziehen, `loading.tsx`/Suspense
- Echte 404 via `notFound()` + `generateStaticParams`/`dynamicParams=false`; Sitemap dynamisch
- A11y-Overhaul der Overlays: `role="dialog"`, `aria-modal`, Fokus-Trap, ESC, Body-Scroll-Lock; `prefers-reduced-motion` global; fehlende Form-Labels
- Battle-Voting/Tippkick-Tipps/Glücksrad-Kontakt serverseitig persistieren/versenden
- Hero & Homepage-Rhythmus-Redesign · Mobile: Touch-Targets 44px, Floating-Stack-Kollision lösen, globales `overflow-x`-Netz

---

**Gefühlte Preisklasse heute: ~3.000–6.000 €-Template. Mit Welle 1+2: solides Mittelfeld. Für 50k (Welle 3): Ehrlichkeit im Backend + Reduktion im Design + echte Produktfotos sind die Differenzierer — nicht mehr Effekte, sondern weniger und konsequenter.**

---
---

# Durchgang 2 — Differential-Audit (Fable, 02.07.2026)

> Red-Team gegen Durchgang 1 + 8 neue Dimensionen. NUR Neues + Korrekturen; nichts aus v1 wiederholt.
> Harte Vorab-Evidenz: `tsc --noEmit` = 0 Fehler · ESLint = 0 Errors / 23 Warnings.

## 1. Das Wichtigste Neue

Durchgang 2 hat dort gegraben, wo v1 nur an der Oberfläche war — und findet eine **Schicht funktionaler Falschheit unter der technisch stabilen Fassade**: Alle 7 Spiel-/Rechner-Features enthalten nachrechenbare Logik- oder Rechenfehler (Partyplaner bestellt 1 L statt 10 L Softdrinks, Glücksrad ist ein manipulierbares Gewinnspiel mit realen Sachpreisen), die Bierkarte zeigt wegen eines fremden Alt-Produktkatalogs praktisch **jedes Produkt unter dem falschen Land** (Frankreich → Toffifee & Heringsfilets), und die als „Alle Angebote" verkauften Preise sind ~7 Wochen abgelaufen (KW 19/20 vs. Live-Handzettel KW 27). Zwei ganze Feature-Ebenen sind **Fassaden**: Der DE/EN/NL-Sprachumschalter übersetzt nur 89 Strings in 3 von ~30 Bereichen, und das Local-SEO fehlt komplett (kein LocalBusiness-Schema, 22 Routen mit korrupter Meta-Description „ Trinkgut Jammers|", null Canonicals).

**Positiv und neu bestätigt:** XSS-frei, keine Secrets in der Git-History, alle 41 Routen liefern 200 ohne Hydration-Fehler, products.json intern sauber, und **alle 620 Akademie-Quizfragen sind fachlich fehlerfrei**.

**Gesamturteil ändert sich:** v1 sah eine 3–6k-Template-Site mit Sicherheits-/Persistenzlücken; Durchgang 2 zeigt, dass zusätzlich die *inhaltliche Korrektheit* der interaktiven Features (das eigentliche 50k-Differenzierungsmerkmal) systematisch defekt ist — der Weg zum 50k-Ziel führt nicht über mehr Features, sondern über das Reparieren bzw. Abschalten der vorhandenen.

## 2. Korrekturen an Audit v1 (Red-Team, Note B)

Kern von v1 exakt bestätigt (83× `#DC2626`, 15× `rgba(196,30,58)`, Kontrast 2,15:1, 476-KB-Hero, 190-KB-akademie.ts im Client-Bundle, `entry.type`-Bypass, doppelte Tippkick-ID, `clearCart` nach `mailto`, unauth Community-POST). Aber:

| # | v1-Aussage | Korrektur |
|---|---|---|
| K1 | P3: „1.000-€-Reisegutschein cheatbar" | Community-Monatspreis ist **ein Kasten gratis** (`community/page.tsx:352`); der Gutschein gehört zu Tippkick. Schaden ~Faktor 50 überzeichnet. |
| K2 | „Wetter zeigt Moers" + Quick Win 13 | **Kein Bug**: `WeatherWidget.tsx:47ff.` geolokalisiert bewusst die Besucher-IP, Fallback Goch. Quick Win 13 hätte ein Feature entfernt. |
| K3 | P1/P2 setzen Vercel als Fakt | Kein `vercel.json`/`.vercel`; Hosting lt. `docs/PROJECT-STATUS.md` offen. Auf VPS funktioniert fs-Persistenz. → P1/P2 konditional; **Hosting-Entscheidung = eigener Blocker**. |
| K4 | DSE-Cookie-Zitat | Zitat existiert so nicht. Belegbarer Kern (Gemini fehlt in DSE) bleibt. |
| K5 | „Leere SocialProof-Box entfernen" | Box ist ein Google-Reviews-CTA mit 4,6★ — entfernen hätte den einzigen Reviews-Einstieg gelöscht. |
| K6 | P2-Fix „IP aus x-real-ip" | `rate-limit.ts:12-13` liest `x-real-ip` bereits — genauso spoofbar. Deployment-abhängige IP-Quelle + token-basierte Limits nötig. |
| K7 | Zählfehler | „9 Sektionen" → 5/7; „12 H2" → 6; „20/26 use client" → **27/35**; Battle „6/10" → **7/10**. Thesen bleiben gültig. |
| K8 | Kleinere Übertreibungen | Instagram-Zahlen (4.558 vs „4.500+") konsistent, nur veraltend; „Regenbogen-Gradient" real 2-Farb-Verlauf Rot→Amber. |

## 3. Neue Scorecard (Durchgang 2)

| Dimension | Note | Kernaussage |
|---|---|---|
| Spiel-Logik & Rechenfehler | **D** | Jede der 7 Spiel-/Rechner-Seiten hat mind. einen nachrechenbaren Fehler; Partyplaner & Glücksrad für ihren Kernzweck unbrauchbar bzw. geschäftsschädigend. |
| Datenintegrität | **C** | products.json sauber, 620 Quizfragen fachlich korrekt — aber country-products.ts zeigt auf fremden Alt-Katalog, Angebotspreise ~7 Wochen abgelaufen. |
| Internationalisierung | **D** | i18n-Fassade: 89 Strings übersetzt, 32/35 Routen hart deutsch, /nl entkoppelt mit fabriziertem „Bespaar tot 40%", SEO-unsichtbar. |
| SEO & Auffindbarkeit | **D** | Fundament ok (Titel, Sitemap, SSR-Content), aber null strukturierte Daten, 22 korrupte Meta-Descriptions, keine Canonicals, kaputtes hreflang, falsche OG-Karten. |
| Deep-Security (jenseits v1) | **C** | XSS- & Secrets-frei; aber Gemini-Chat ohne Jugendschutz-Guardrails, Prompt-Injection via weatherContext, unauth Refresh-Endpoint, keine Security-Header. |
| Runtime-Smoke-Test | **B** | Alle 41 Routen 200 <0,6 s, kein NaN/Hydration-Fehler; kaputte Meta-Descriptions shippen aber live. |
| Code-Qualität & Konfiguration | **D** | 0 tsc-Fehler, aber 27 tote CDN-Bild-URLs (Revert vergaß 2 Dateien), tote Gemini-Pipeline, ~42 MB ungenutzte Dependencies, gebrochener Sync-Workflow (zwei divergente Klone). |

## 4. Neue Top-Findungen (priorisiert)

### HIGH

**N1 — Bierkarte ordnet praktisch jedes Produkt dem falschen Land zu** · `data/country-products.ts` + `app/bierkarte/page.tsx:179-183`
31 von 108 IDs existieren nicht, **alle 77 auflösbaren IDs zeigen auf falsche Produkte** (USA „Jack Daniel's" → Desperados; Griechenland „Metaxa" → Monster Energy; Frankreich → Toffifee & Heringsfilets). Filter entfernt nur `undefined`.
Fix: Mapping gegen aktuelle products.json neu aufbauen (per Slug statt numerischer ID); bis dahin Bierkarte deaktivieren.

**N2 — Partyplaner bestellt drastisch falsche Mengen** · `app/partyplaner/page.tsx:32-38,56,64`
Hartkodierte Gebinde (20×0,5 L, 12-L-Kisten) passen nicht zu den empfohlenen Produkten (16×0,33 L, 1-L-Flasche, 18-L-Doppelkasten). 20 Gäste: 10 L Softdrink-Bedarf → **1 Liter im Warenkorb** (0,99 €); Bier 47 % Unterdeckung, Wasser 80 % Überdeckung.
Fix: Gebindegröße pro Produkt pflegen, `quantity = ceil(BedarfLiter / GebindeLiter)` gegen das konkrete Produkt.

**N3 — Glücksrad: real einlösbare Sachpreise, komplett clientseitig manipulierbar** · `app/gluecksrad/page.tsx:28,110-116,189`
Jackpot (Gratis-Kasten) ~4,6 %/Dreh; 24-h-Cooldown nur localStorage (löschbar/Inkognito); kein Gewinncode, keine Server-Registrierung — jeder Screenshot „beweist" einen Gewinn. Verdeckt gewichtete Segmente (Nieten 36,7 % statt optisch 25 %) bei Pflicht-Kontaktdaten ohne Teilnahmebedingungen — wettbewerbsrechtlich heikel. **Direktes Kostenrisiko.**
Fix: Serverseitige Auslosung + Einmal-Code + Validierung im Markt; Chancen offenlegen. Bis dahin: offline.

**N4 — „Alle Angebote" ~7 Wochen abgelaufen, ohne Gültigkeitsfelder** · `data/products.json` vs. Handzettel-Cache
Katalog KW 19/20, Live-Handzettel KW 27. Kunden sehen am Regal andere Preise. Plus: Krombacher 25 €/5 L als „1l = €2,50" (korrekt: 5,00 €/L).
Fix: `validFrom/validUntil` pflegen, Abgelaufenes ausblenden; Literpreis korrigieren.

**N5 — 27 tote CDN-Bild-URLs in Tippkick & Battle** · `app/tippkick/page.tsx`, `app/battle/page.tsx`
Revert f738863 hat nur products.json zurückgesetzt — die hartkodierten `media.trinkgut.de`-URLs in diesen zwei Dateien liefern weiter 404.
Fix: auf lokale `/images/`-Pfade zurücksetzen.

### MEDIUM

**N6 — Tippkick zeitlich tot & faktisch falsch** · `app/tippkick/page.tsx:34-39,147-156,370`
Alle 6 Wochentage falsch (11.06.2026 = Do, nicht Mi); Countdown seit 11.06. dauerhaft 00:00, Tippen auf gespielte Spiele möglich; Leaderboard mit unmöglichen 42 Pkt. (max. 18) — bei Echtpreisen (1.000-€-Gutschein, PS5 Pro) rechtlich riskant.
Fix: ISO-Timestamps + berechnete Wochentage, Tippsperre nach Anpfiff, Leaderboard raus/kennzeichnen — oder abschalten.

**N7 — Battle-Duellplan seit KW 18 tot, stiller Fallback auf KW 14** · `app/battle/page.tsx:32-74,113-119,237`
Heute (KW 27) rendert die Seite das KW-14-Duell, Countdown verspricht wöchentliche Rotation; „Vergangene Duelle" zeigt auch Zukünftiges.
Fix: Jüngstes vergangenes Duell als Fallback, Countdown nur bei real geplantem Folge-Duell.

**N8 — Trink-Roulette: Zeiger und Ergebnis entkoppelt** · `app/partyspiele/page.tsx:133-137`
Rotation und Gewinner getrennt ausgewürfelt — bei 2 Spielern widerspricht die Anzeige in ~50 % dem Ergebnis.
Fix: Erst Gewinner-Index ziehen, Zielrotation daraus berechnen.

**N9 — Leergut-Rechner: 0,15-€-Bügelflasche fehlt** · `app/leergut/page.tsx:17-27`
Flensburger/Altenmünster im Sortiment, aber Mehrweg-Bier nur 0,08 €. 20er-Flensburger: 3,10 € statt 4,50 € (31 % zu wenig).
Fix: Bügelflaschen-Typ ergänzen, Öko-Tracker nachziehen.

**N10 — Gemini-Chat: Prompt-Injection + keine Alkohol-/Jugendschutz-Guardrails** · `app/api/chat/route.ts`
Client-kontrollierter `weatherContext` wird ungefiltert in die `system_instruction` konkateniert; keine Guardrails für ein Alkohol-Sortiment.
Fix: weatherContext serverseitig erzeugen/validieren; Guardrail-Block (keine Beratung Minderjähriger, Trinkverantwortung).

**N11 — Unauth Re-Scrape-Endpoint hebelt Cron-Schutz aus** · `/api/handzettel/fetch?refresh=true`
Jeder kann Outbound-Requests + Disk-Writes auslösen. Dazu: keine HTTP-Security-Header, Cron-Vergleich nicht timing-safe, Upload-Routen puffern Body vor Größen-Check.
Fix: refresh hinter CRON_SECRET (timing-safe), Security-Header in next.config, Content-Length vor Buffering.

**N12 — Sync-Workflow real gebrochen** · AGENTS.md vs. Realität
Der dokumentierte Mac-Klon (`~/Desktop/Claude Code/…`) steht auf Uralt-Commit, der aktive (`~/Desktop/Homepage/…`) ist behind+dirty; `data/community.json` + `public/handzettel/manifest.json` sind git-getrackt, werden aber zur Laufzeit mutiert — Merge-Konflikte/Datenverlust vorprogrammiert.
Fix: Alten Klon entfernen, Laufzeitdateien aus git (.gitignore + Seed), AGENTS.md-Pfad korrigieren.

### LOW (Auswahl, neu)

- **Glücksrad-Rotationsakkumulation** (`gluecksrad/page.tsx:173`): ab Spin 2 stoppt der Zeiger falsch — Offset normalisieren.
- **Cocktail-Quiz** (`partyspiele/page.tsx:636-662`): Timeout folgenlos; „Nochmal spielen" doppelt den Timer.
- **Bier-Pong** (`partyspiele/page.tsx:316-324`): keine Siegbedingung, Timer-Leak nach Modal-Schließen.
- **Öko-Tracker** (`oeko-tracker/page.tsx:110-114`): Kästen zählen als „1 Flasche" (Faktor 24 daneben); „0 mal duschen"-Fun-Fact.
- **Leergut-Kasten-Semantik** (`leergut/page.tsx:24-26`): 20er ohne, 24er/12er inkl. Flaschen — Doppelzählung (+56 %).
- **/nl-Landingpage**: fabriziertes „Bespaar tot 40 %" (max. ~26 % nach eigener Formel), `lang="de"`, vom Umschalter entkoppelt.
- **13 MB unbenutzte PNGs im Repo-Root**, ~42 MB Dependencies ohne Nutzen (1 deprecated: `@google/generative-ai`), tote Gemini-Extraktions-Pipeline.

## 5. Quick Wins NEU (<1 Tag, nicht in v1)

1. **Meta-Description-Präfix „ Trinkgut Jammers|" in 22 Layouts entfernen** + doppelten Brand-Suffix in Titles fixen — jedes Google-Snippet betroffen.
2. **27 tote media.trinkgut.de-URLs** in tippkick/battle auf lokale Bilder zurücksetzen.
3. **Tippkick-Tippabgabe deaktivieren** + Countdown durch „WM läuft"-Zustand ersetzen.
4. **Glücksrad offline nehmen** oder Gewinne auf Nicht-Sachpreise umstellen, bis serverseitige Auslosung existiert.
5. **Bierkarte deaktivieren**, bis country-products.ts neu gemappt ist.
6. **Bügelflasche 0,15 € im Leergut-Rechner** ergänzen (2 Zeilen).
7. **Krombacher-Literpreis korrigieren** (5,00 €/L).
8. **`refresh=true` hinter CRON_SECRET** legen (timing-safe).
9. **Security-Header-Block in next.config** (CSP report-only, X-Content-Type-Options, Referrer-Policy, HSTS).
10. **LocalBusiness-JSON-LD ins Root-Layout** (Adresse, Öffnungszeiten, Geo) — wichtigstes Local-SEO-Asset, ~2 h.
11. **data/community.json + manifest.json aus git nehmen.**
12. **Tippkick-Wochentage aus ISO-Datum berechnen.**

## 6. Aktualisierte Prioritäten (3-Wellen-Roadmap)

**Welle 1 (Sofort) — kommt dazu:** Glücksrad absichern/abschalten (N3, einziges Finding mit direktem Kostenrisiko) · Bierkarte deaktivieren (N1) · abgelaufene Angebote ausblenden (N4) · refresh-Endpoint + Security-Header (N11). **Verschiebt sich:** P1/P2 werden konditional — **Hosting-Entscheidung (Vercel vs. VPS) ist der neue explizite Welle-1-Blocker**; P3-Impact herabgestuft.

**Welle 2 (Funktionale Korrektheit) — neuer Schwerpunkt:** Partyplaner-Gebindelogik (N2) · Tippkick/Battle zeitlich ehrlich machen oder saisonal abschalten (N6/N7) · Trink-Roulette/Quiz/Bier-Pong (N8+Lows) · LocalBusiness- + Product-Schema, Canonicals, OG-Karten · Leergut/Öko-Tracker (N9+Lows).

**Welle 3 (Struktur) — kommt dazu:** **i18n-Grundsatzentscheidung** (echtes URL-basiertes i18n ODER Umschalter + /nl-Fassade entfernen — der Zwischenzustand schadet) · Sync-Workflow reparieren (N12) · tote Pipeline/Dependencies/PNGs entfernen.

**Netto-Verschiebung:** v1 priorisierte Sicherheit → Design → Content. Durchgang 2 zwingt eine neue Achse dazwischen: **funktionale und inhaltliche Wahrheit** (richtige Mengen, richtige Länder, gültige Preise, laufende statt toter Aktionen). Ohne diese Welle bleibt jede Design- und SEO-Investition Fassade auf falschen Daten.
