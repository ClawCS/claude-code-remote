# Arbeits-Checkliste — Alle Bugs & Unstimmigkeiten

> Quelle: AUDIT.md (Durchgang 1 + 2). Wird der Reihe nach abgearbeitet und hier abgehakt.
> Legende: ⬜ offen · ✅ erledigt · ⏸ wartet auf Entscheidung · 🔴 rechtlich/finanziell riskant
> Stand: 04.07.2026

## Block 0 — Offene Entscheidungen (Niko)

- [x] **E1** ✅ 🔴 **Hosting: HETZNER** (entschieden 04.07.) → Block 6 entblockt. Datei-basierte Persistenz kann bleiben (VPS mit `next start`), muss aber abgesichert werden (Backups, Concurrency, Schreibpfad außerhalb des Deploy-Ordners).
- [x] **E2** ✅ Tippkick: **komplett entfernt** — entschieden 04.07., umgesetzt (siehe 1.1)
- [x] **E3** ✅ Glücksrad: **komplett entfernt** — entschieden 04.07., umgesetzt (siehe 1.2)
- [ ] **E4** ⬜ i18n: echtes Mehrsprachen-Setup ODER Umschalter + /nl-Seite entfernen? (Zwischenzustand schadet; → 8.1)

## Block 1 — Sofort: aktive Risiken & Falschangaben stoppen

- [x] **1.1** ✅ **Tippkick komplett entfernt** (04.07.): Route `app/tippkick/` gelöscht, WM-Trophy-Icon + Funktion aus `components/Header.tsx`, `trophyPulse`-CSS aus `globals.css`, Sitemap-Eintrag, Tippspiel-Versprechen aus Chat-Prompt (`app/api/chat/route.ts`), `nav.wmtipp`-Keys aus `lib/i18n.ts`. Verifiziert: /tippkick → 404, tsc sauber.
- [x] **1.2** ✅ **Glücksrad komplett entfernt** (04.07.): Route `app/gluecksrad/` gelöscht, Nav-Eintrag aus `components/Header.tsx`, Punkte-Aktion aus `app/api/community/route.ts` + `app/community/page.tsx` + `lib/points.ts`, Sitemap-Eintrag, `nav.gluecksrad`-Keys aus `lib/i18n.ts`. Verifiziert: /gluecksrad → 404, /community → 200, tsc sauber.
- [ ] **1.3** ⬜ 🔴 **Bierkarte deaktivieren** — 100 % falsche Länderzuordnungen (`data/country-products.ts` + `app/bierkarte/page.tsx:179-183`); Reaktivierung nach 2.11
- [ ] **1.4** ⬜ 🔴 **Abgelaufene Angebote** — Katalog KW 19/20, heute KW 27; `validFrom/validUntil` in `data/products.json` einführen + Abgelaufenes ausblenden
- [ ] **1.5** ⬜ **Battle: 7/10 tote Slugs filtern** statt 0,00 € rendern (`app/battle/page.tsx:50-74,95-107`)
- [ ] **1.6** ⬜ **Tote CDN-Bild-URLs in Battle** auf lokale `/images/`-Pfade zurücksetzen (vergessener Teil von Revert f738863; Tippkick-Teil durch Löschung erledigt)
- [ ] **1.7** ⬜ **`/api/handzettel/fetch?refresh=true` hinter CRON_SECRET** legen, timing-safe Vergleich
- [ ] **1.8** ⬜ **HTTP-Security-Header** in `next.config.ts` (X-Content-Type-Options, Referrer-Policy, HSTS, CSP report-only)
- [ ] **1.9** ⬜ **Chat-API härten**: `Array.isArray(messages)`-Check → 400, Anzahl-/Längenlimits (`app/api/chat/route.ts:146-152`)

## Block 2 — Rechenfehler & Spiel-Logik

- [ ] **2.1** ⬜ **Partyplaner-Mengenlogik**: Gebindegröße pro Produkt pflegen, `ceil(Bedarf/Gebinde)` gegen echtes Produkt rechnen — aktuell 1 L statt 10 L Softdrinks (`app/partyplaner/page.tsx:32-38,56,64`)
- [ ] **2.2** ⬜ **Leergut: Bügelflasche 0,15 €** ergänzen — Flensburger-Kasten 31 % zu niedrig (`app/leergut/page.tsx:17-27`)
- [ ] **2.3** ⬜ **Leergut: Kasten-Semantik** vereinheitlichen (20er ohne, 24er/12er inkl. Flaschen → Doppelzählung +56 %) (`leergut/page.tsx:24-26`)
- [ ] **2.4** ⬜ **Öko-Tracker**: Kasten = 24 Flaschen (Faktor fehlt), „0 mal duschen"-Fun-Fact (`app/oeko-tracker/page.tsx:110-114`)
- [ ] **2.5** ⬜ **Trink-Roulette**: Zeiger ≠ Ergebnis (~50 % Widerspruch) — erst Gewinner ziehen, Rotation daraus berechnen (`app/partyspiele/page.tsx:133-137`)
- [ ] **2.6** ⬜ **Cocktail-Quiz**: Timeout folgenlos, „Nochmal spielen" doppelt Timer (`partyspiele/page.tsx:636-662`)
- [ ] **2.7** ⬜ **Bier-Pong**: keine Siegbedingung, Timer-Leak nach Modal-Schließen (`partyspiele/page.tsx:316-324`)
- ~~**2.8** Glücksrad: Rotations-Akkumulation~~ — hinfällig, Feature entfernt (E3)
- ~~**2.9** Glücksrad: Gewinnchancen~~ — hinfällig, Feature entfernt (E3)
- [ ] **2.10** ⬜ **Krombacher-Literpreis**: 5,00 €/L statt „1l = €2,50" (`data/products.json`)
- [ ] **2.11** ⬜ **country-products.ts neu mappen** (per Slug statt numerischer ID, gegen aktuelle products.json) → danach Bierkarte wieder aktivieren
- [ ] **2.12** ⬜ **Battle-Voting echt machen** (`/api/battle` GET/POST) oder Prozentbalken entfernen + ehrlich labeln (`app/battle/page.tsx:212-232,359-392`)
- [ ] **2.13** ⬜ **Battle-Wochenlogik**: Duellplan endet KW 18, stiller Fallback auf KW 14; „Vergangene Duelle" zeigt Zukünftiges (`battle/page.tsx:32-74,113-119,237`)

## Block 3 — API & Sicherheit

- [ ] **3.1** ⬜ **Bewerbung: MIME-Bypass fixen** — `!entry.type || !ALLOWED_TYPES.has(entry.type)` + Magic-Bytes-Check (`app/api/bewerbung/route.ts:97`)
- [ ] **3.2** ⬜ **Bewerbung: rateLimit()** ergänzen (30-MB-Bundles anonym unbegrenzt)
- [ ] **3.3** ⬜ **Community: rateLimit + Cooldowns/Tageslimits** — Punkte-Injection per curl, register-DoS (`app/api/community/route.ts:77,125-168`)
- [ ] **3.4** ⬜ **Upload-Routen: Content-Length prüfen VOR dem Buffern** (kuehlschrank, leergut-scan, bewerbung)
- [ ] **3.5** ⬜ **Chat: weatherContext** serverseitig erzeugen oder strikt validieren — aktuell Prompt-Injection in system_instruction (`app/api/chat/route.ts`)
- [ ] **3.6** ⬜ 🔴 **Chat: Jugendschutz-/Alkohol-Guardrails** in System-Prompt (keine Beratung Minderjähriger, Trinkverantwortung, keine verbindlichen Rabatt-Zusagen)
- [ ] **3.7** ⬜ **Cron-Secret-Vergleich timing-safe** (`app/api/handzettel/cron/route.ts`)

## Block 4 — Inhalt, Recht & Widersprüche

- [ ] **4.1** ⬜ 🔴 **Datenschutzerklärung: Google Gemini ergänzen** — Chat + Bild-Uploads (Kühlschrank-/Leergut-Scan) gehen an US-Anbieter, DSE erwähnt nichts (`app/datenschutz/page.tsx`)
- [ ] **4.2** ⬜ **Mitarbeiterzahl** 10 vs. 14 — eine Zahl überall
- [ ] **4.3** ⬜ **Zwei Mobilnummern** — eine Single Source of Truth (zentrale Kontakt-Konstante)
- [ ] **4.4** ⬜ **Firmierung/Rechtsform** einheitlich (Impressum-Risiko)
- [ ] **4.5** ⬜ **Instagram-Zahlen** („4.558 Follower / 217 Beiträge") aktualisieren oder weglassen
- [ ] **4.6** ⬜ **„4,6 ★ Google"** mit Bewertungsanzahl belegen oder entfernen (Hero + SocialProof)
- [ ] **4.7** ⬜ **Gewinnspiel-Seite** aktualisieren (zeigt Veraltetes, inkonsistent zur Startseite)
- [ ] **4.8** ⬜ **Checkout ehrlich machen**: „Bitte sende die geöffnete E-Mail ab" + `clearCart` erst nach bestätigtem Versand (`app/checkout/page.tsx:119`)
- ~~**4.9** Glücksrad: Teilnahmebedingungen~~ — hinfällig, Feature entfernt (E3)
- ~~**4.10** Glücksrad-Kontaktpflichtfeld~~ — hinfällig, Feature entfernt (E3)
- [ ] **4.11** ⬜ **/nl: „Bespaar tot 40 %"** korrigieren (real max. ~26 % nach eigener Formel)
- [ ] **4.12** ⬜ **SocialProof**: 2–3 echte Google-Zitate einsetzen (Box NICHT entfernen — ist der Reviews-CTA)
- [ ] **4.13** ⬜ **Hero-Versprechen „Online entdecken"** vs. Abhol-Realität — Formulierung schärfen

## Block 5 — SEO & Auffindbarkeit

- [ ] **5.1** ⬜ **Korrupte Meta-Descriptions in 22 Layouts** — Literal-Präfix „ Trinkgut Jammers|" entfernen (Suchen/Ersetzen)
- [ ] **5.2** ⬜ **Doppelter Brand-Suffix in Titles** („… – Trinkgut Jammers Goch – Trinkgut Jammers Goch")
- [ ] **5.3** ⬜ **LocalBusiness-JSON-LD** ins Root-Layout (Adresse, Öffnungszeiten, Geo) — wichtigstes Local-SEO-Asset
- [ ] **5.4** ⬜ **Product-Schema** auf den 107 Produktseiten
- [ ] **5.5** ⬜ **OG-Karten pro Produkt** (WhatsApp-Teilen!) + og:image in echtem 1200×630
- [ ] **5.6** ⬜ **Canonical-URLs** projektweit (aktuell null)
- [ ] **5.7** ⬜ **Echte 404** via `notFound()` + `generateStaticParams` auf produkte/kategorie/akademie-[slug]
- [ ] **5.8** ⬜ **Sitemap dynamisch**: Produkte/Kategorien/Akademie-Slugs ergänzen
- [ ] **5.9** ⬜ **/kontakt in Header-/Footer-Menü** aufnehmen (Seite existiert, ist unauffindbar)
- [ ] **5.10** ⬜ **hreflang reziprok** machen ODER entfernen (hängt an E4)

## Block 6 — Persistenz & Deployment (Hetzner VPS, E1 = Hetzner)

> Auf Hetzner mit `next start` funktioniert die Datei-Persistenz — Fokus liegt auf Robustheit, Backups und Concurrency, NICHT auf externem KV/Blob.

- [ ] **6.1** ⬜ 🔴 **Bewerbungen speicherfest**: Schreibpfad auf ein persistentes Volume außerhalb des Deploy-/Git-Ordners legen (z. B. `/var/lib/trinkgut/`), damit Deploys nichts überschreiben; Datei-Locking gegen parallele Schreibzugriffe
- [ ] **6.2** ⬜ **Bewerbungs-Benachrichtigung**: E-Mail an Niko bei Eingang (SMTP/Resend) — aktuell merkt niemand etwas
- [ ] **6.3** ⬜ **Community-Punkte + Handzettel-Cache** auf dasselbe persistente Volume; atomare Writes (temp-Datei + rename) gegen Korruption
- [ ] **6.4** ⬜ **Automatisches Backup** des Daten-Volumes (Cron + Hetzner Storage Box / Snapshot)
- [ ] **6.5** ⬜ **Rate-Limiter**: In-Memory reicht bei Single-Instance auf einem VPS; IP-Quelle an den Reverse-Proxy anpassen (nginx/Caddy setzt `x-real-ip` vertrauenswürdig) → nur den vom Proxy gesetzten Hop lesen
- [ ] **6.6** ⬜ **Deployment-Setup**: Node-Prozess via systemd/PM2, Reverse-Proxy (Caddy/nginx) + TLS, `CRON_SECRET`/`GEMINI_API_KEY` als Env-Vars, Cron-Job für `/api/handzettel/cron`
- [ ] **6.7** ⬜ **Server-Security**: Firewall (nur 80/443/SSH), SSH-Key-only, automatische Sicherheitsupdates, fail2ban

## Block 7 — Design „50k-Look"

- [ ] **7.1** ⬜ **Produktpreis lesbar**: `#1A1A1A`, fett, statt Gold 2,15:1 (`globals.css:614` + `ProductCard.tsx:84`) — Wertigkeit+Conversion+A11y in einer Regel
- [ ] **7.2** ⬜ **Hero-Bild `unoptimized` entfernen** — 476 KB → ~100 KB (`Hero.tsx:15-22`)
- [ ] **7.3** ⬜ **Display-Font für H1/H2** (Fraunces o. Clash Display), Jakarta bleibt Body
- [ ] **7.4** ⬜ **Ein Rot, ein Gold**: `#C41E3A`/`rgba(196,30,58)` (15×) eliminieren, 83× `[#DC2626]` auf Token, Gold-Wildwuchs (3 Töne) konsolidieren
- [ ] **7.5** ⬜ **Hero beruhigen**: Partikel 30 → 6–8 (nur Gold, eine Ecke), Gradient-Headline → Weiß + ein Gold-Akzent
- [ ] **7.6** ⬜ **Homepage-Rhythmus**: Spacing variieren (5/7 Sektionen identisch), Eyebrow `tracking-[0.25em]`
- [ ] **7.7** ⬜ **Kontraste auf Dunkel**: `text-white/40`/`60` → `/75`–`/85` (`Hero.tsx:92,128` u. a.)
- [ ] **7.8** ⬜ **Karten-Spacing** `p-4` → `p-5` (`ProductCard.tsx:45,74`)
- [ ] **7.9** ⬜ **Floating-UI reduzieren**: Bot + Insta/Maps/WhatsApp + Cookie überlagern Content, kollidieren mobil
- [ ] **7.10** ⬜ **Echte Produktfotos** (freigestellt, einheitlich) statt Handzettel-Crops mit Preisstörern — größter Einzelhebel, Aufwand L

## Block 8 — Struktur, Performance, A11y, Aufräumen

- [ ] **8.1** ⬜ **i18n-Entscheidung umsetzen** (E4): echtes URL-basiertes i18n ODER Umschalter + /nl-Fassade raus; /nl hat `lang="de"`, 32/35 Routen hart deutsch
- [ ] **8.2** ⬜ **RSC-Sanierung**: 27/35 Routen `use client`; Akademie-Daten (~190 KB → 1,1-MB-Chunk) aus dem Startseiten-Bundle
- [ ] **8.3** ⬜ **loading.tsx/Suspense** + API-Caching-Strategie
- [ ] **8.4** ⬜ **Tote Video-/Lottie-Schicht** aus `CategoryBackground.tsx` (6 Videos + 6 Lotties fehlen)
- [ ] **8.5** ⬜ **A11y-Overlays**: CartDrawer/WishlistDrawer/AIAssistant/Mobile-Drawer → `role="dialog"`, `aria-modal`, Focus-Trap, ESC, Body-Scroll-Lock
- [ ] **8.6** ⬜ **A11y**: `prefers-reduced-motion` global, fehlende Form-Labels (Checkout/Gewinnspiel/Newsletter/Chat), Touch-Targets ≥ 44 px
- [ ] **8.7** ⬜ **Mobile**: Header-Icon-Clipping bei 375 px, globales `overflow-x`-Sicherheitsnetz
- [ ] **8.8** ⬜ **Git/Sync**: `data/community.json` + `public/handzettel/manifest.json` aus git (.gitignore + Seed), alten Klon `~/Desktop/Claude Code/` löschen, AGENTS.md-Pfad korrigieren
- [ ] **8.9** ⬜ **Dependencies**: `@google/generative-ai` (deprecated) → `@google/genai`, ~42 MB ungenutzte Deps, 13 MB PNGs im Root, tote Gemini-Pipeline entfernen
- [ ] **8.10** ⬜ **Toter Code** (ESLint): `getLevel`, `RentalIcon`, `MobileLangButton` (fehlt der mobile Sprachumschalter?), unused vars
- [ ] **8.11** ⬜ **setState-in-Effect-Pattern** in 13 Dateien modernisieren (niedrige Prio, kein Nutzer-Impact)

---

## Nicht mehr offen (aus Audits gestrichen)

- ~~Wetter-Widget „auf Goch stellen"~~ — kein Bug, IP-Geolokalisierung ist ein Feature (D2/K2)
- ~~SocialProof-Box entfernen~~ — ist der Google-Reviews-CTA; stattdessen 4.12 (D2/K5)
- ~~Tippkick reparieren (N6)~~ — Feature komplett entfernt (E2/1.1)
- ~~Glücksrad absichern/reparieren (N3, 2.8, 2.9, 4.9, 4.10)~~ — Feature komplett entfernt (E3/1.2)
