# Arbeits-Checkliste — Alle Bugs & Unstimmigkeiten

> Quelle: AUDIT.md (Durchgang 1 + 2). Stand: 04.07.2026 nach autonomem Durchlauf.
> Legende: ✅ erledigt · ⚠️ teilweise · ⬜ offen · ⏸ bewusst zurückgestellt · 🔴 rechtlich/finanziell riskant

## Fortschritt autonomer Durchlauf (Zusammenfassung)

**Erledigt:** Tippkick/Glücksrad/Battle/Bierkarte entfernt · abgelaufene Angebote reframed · komplette API-Härtung (Header, Chat-Guardrails, Cron/Refresh-Secret, MIME, Rate-Limits) · Partyplaner-Mengenlogik · Krombacher/Leergut-Daten · Datenschutz-Gemini · Inhaltswidersprüche · SEO-Metas + LocalBusiness-JSON-LD · Design-Foundation (Display-Schrift, lesbarer Preis, ein Rot/ein Gold) · Hero-Redesign · Floating-UI entrümpelt · A11y-Drawer + reduced-motion + overflow-Netz.

**Bewusst zurückgestellt** (Aufwand/Daten/Deployment): echte Produktfotos, RSC-Migration, vollständiger A11y-Overlay-Umbau (AIAssistant/Header-Drawer), restliche SEO-Schema-Details, Hetzner-Deployment-Setup. Details unten.

---

## Block 0 — Entscheidungen

- [x] **E1** ✅ Hosting: **HETZNER** (Datei-Persistenz bleibt, Block 6 abgesichert dokumentiert)
- [x] **E2** ✅ Tippkick komplett entfernt
- [x] **E3** ✅ Glücksrad komplett entfernt
- [x] **E-neu** ✅ **Battle komplett entfernt** (04.07.)
- [x] **E-neu** ✅ **Abgelaufene Angebote raus** (Framing „Wochenangebote" → „Sortiment", live-Handzettel = Angebotsquelle)
- [ ] **E4** ⬜ i18n: echtes Setup ODER Umschalter+/nl entfernen (→ 8.1, offen)

## Block 1 — Sofort-Risiken

- [x] **1.1** ✅ Tippkick entfernt (Route, Nav, Sitemap, i18n, Chat-Prompt, Punkte)
- [x] **1.2** ✅ Glücksrad entfernt (dito)
- [x] **1.3** ✅ Bierkarte **entfernt** (100% falsche Länderdaten, nicht reparierbar aus DE/NL-Katalog) + country-products.ts gelöscht
- [x] **1.4** ✅ Abgelaufene Angebote: „Wochenangebote"-Behauptung raus, /produkte = Sortiment, Handzettel-Link
- [x] **1.5** ✅ Battle entfernt (statt Slug-Filter)
- [x] **1.6** ✅ Battle-CDN-Bilder mit Battle entfernt
- [x] **1.7** ✅ `/api/handzettel/fetch` refresh=true + POST hinter CRON_SECRET (timing-safe)
- [x] **1.8** ✅ HTTP-Security-Header in next.config.ts
- [x] **1.9** ✅ Chat-API: Array-Validierung (400 statt Crash) + Längenlimits

## Block 2 — Rechen-/Spiellogik

- [x] **2.1** ✅ Partyplaner: Liter-basiert, Stückzahl aus echter Gebindegröße (Soft 10l→10 statt 1)
- [x] **2.2** ✅ Leergut: Bügelflasche 0,15 € ergänzt
- [x] **2.3** ✅ Leergut: Kasten-Labels eindeutig (inkl./ohne Flaschen)
- [ ] **2.4** ⬜ Öko-Tracker: Kasten=24 Flaschen-Faktor, „0 mal duschen"
- [ ] **2.5** ⬜ Trink-Roulette: Zeiger ≠ Ergebnis (partyspiele)
- [ ] **2.6** ⬜ Cocktail-Quiz: Timeout folgenlos, Timer-Doppelung
- [ ] **2.7** ⬜ Bier-Pong: keine Siegbedingung, Timer-Leak
- [x] **2.10** ✅ Krombacher-Literpreis 5,00 €/L
- [x] **2.11** ✅ country-products (mit Bierkarte entfernt)
- [x] **2.12/2.13** ✅ Battle-Voting/Wochenlogik (mit Battle entfernt)

## Block 3 — API & Sicherheit

- [x] **3.1** ✅ Bewerbung MIME-Bypass gefixt (`!entry.type||…`) + Endungs-Check
- [x] **3.2** ✅ Bewerbung Rate-Limit
- [x] **3.3** ✅ Community Rate-Limit + Tageslimit pro Aktion
- [x] **3.4** ⚠️ Content-Length-Vorprüfung bei Bewerbung ✅ (kuehlschrank/leergut-scan noch offen)
- [x] **3.5** ✅ Chat weatherContext sanitisiert (Prompt-Injection)
- [x] **3.6** ✅ Chat Jugendschutz-/Alkohol-Guardrails
- [x] **3.7** ✅ Cron-Vergleich timing-safe (lib/cron-auth.ts)

## Block 4 — Inhalt & Recht

- [x] **4.1** ✅ Datenschutz: Abschnitt Google Gemini (Chat + Bild-Uploads, Drittland, Art. 6 f)
- [x] **4.2** ✅ Mitarbeiterzahl konsistent 14
- [x] **4.3** ⚠️ WhatsApp-Nummern vereinheitlicht + kaputte wa.me gefixt (Handy 0176 vs 0175 als Handy/WhatsApp bleibt bewusst)
- [ ] **4.4** ⬜ Firmierung/Rechtsform seitenübergreifend prüfen
- [x] **4.5** ✅ Erfundene Follower-/Beitragszahlen entfernt
- [ ] **4.6** ⬜ „4,6★ Google" mit Anzahl belegen (Rating belassen — real)
- [x] **4.8** ✅ Checkout ehrlich (Mailto muss gesendet werden) + kein clearCart vor Versand
- [x] **4.11** ✅ /nl „Bespaar tot 40%" → 25%
- [ ] **4.12** ⬜ SocialProof: echte Google-Zitate einsetzen (Box bleibt als CTA)
- [ ] **4.13** ⬜ Hero-Versprechen „Online entdecken" schärfen

## Block 5 — SEO

- [x] **5.1** ✅ 19 kaputte Meta-Descriptions (Präfix „ Trinkgut Jammers|") bereinigt
- [x] **5.2** ✅ 7 Doppel-Brand-Titel bereinigt
- [x] **5.3** ✅ LocalBusiness-JSON-LD (LiquorStore, Adresse/Öffnungszeiten/Geo)
- [ ] **5.4** ⬜ Product-Schema auf Produktseiten
- [ ] **5.5** ⬜ OG-Karten pro Produkt + korrektes og:image
- [ ] **5.6** ⬜ Canonical-URLs
- [ ] **5.7** ⬜ Echte 404 via notFound() + generateStaticParams
- [x] **5.8** ✅ Sitemap: entfernte Routen raus (dynamische Slugs noch offen)
- [x] **5.9** ✅ /kontakt ins Footer-Menü
- [ ] **5.10** ⬜ hreflang reziprok (hängt an E4)

## Block 6 — Persistenz & Deployment (Hetzner) ⏸ Deployment-Arbeit vor Ort

- [ ] **6.1–6.7** ⏸ Persistenz-Volume, Backups, Bewerbungs-Mail, Reverse-Proxy/TLS, Firewall, Cron 16:00 — dokumentiert in AUDIT/CHECKLIST, umzusetzen beim Server-Setup. Code ist vorbereitet (dateibasiert, IP-Quelle proxy-tauglich, Cron-Doku auf So 16:00).

## Block 7 — Design „50k-Look"

- [x] **7.1** ✅ Produktpreis dunkel & lesbar (#1A1A1A, fett, 22px) statt Gold 2,15:1
- [x] **7.2** ✅ Hero-LCP-Bild optimiert (unoptimized entfernt)
- [x] **7.3** ✅ Display-Schrift Space Grotesk für H1/H2
- [x] **7.4** ✅ Ein Rot (Off-Brand rgba(196,30,58) weg), ein Gold (#C8962C)
- [x] **7.5** ✅ Hero beruhigt: ein Gold-Akzentwort statt Regenbogen, Partikel 30→7
- [x] **7.6** ⚠️ Eyebrows tracking-[0.25em] ✅ (Sektions-Spacing-Variation noch möglich)
- [x] **7.7** ✅ Hero-Kontraste erhöht (/75, /70)
- [x] **7.8** ✅ ProductCard-Spacing p-5
- [x] **7.9** ✅ Floating-UI entrümpelt (nur WhatsApp), + Live-Details (Parallax, Count-up)
- [ ] **7.10** ⏸ 🔴 Echte Produktfotos statt Handzettel-Crops — **größter offener Hebel**, braucht Fotomaterial (nicht automatisierbar)

## Block 8 — Struktur, Perf, A11y

- [ ] **8.1** ⬜ i18n-Grundsatzentscheidung (E4)
- [ ] **8.2** ⏸ RSC-Sanierung (use client / Akademie-Bundle) — größerer Umbau
- [ ] **8.3** ⬜ loading.tsx/Suspense + API-Caching
- [ ] **8.4** ⬜ Tote Video-/Lottie-Schicht aus CategoryBackground
- [x] **8.5** ⚠️ A11y-Overlays: Cart-/Wishlist-Drawer ✅ (role=dialog, ESC, Fokus-Trap, Scroll-Lock); AIAssistant + Header-Mobile-Drawer noch offen
- [x] **8.6** ⚠️ prefers-reduced-motion global ✅; einzelne fehlende Form-Labels noch offen
- [x] **8.7** ✅ Globales overflow-x-Netz (Touch-Targets-Sweep noch offen)
- [ ] **8.8** ⚠️ Git-Sync: nach jedem Batch committet+gepusht; Laufzeitdateien-.gitignore + alter Klon noch offen
- [ ] **8.9** ⬜ Dependencies (deprecated @google/generative-ai, ungenutzte Deps/PNGs)
- [ ] **8.10** ⬜ Toter Code (MobileLangButton etc.)
- [ ] **8.11** ⬜ setState-in-Effect-Pattern (niedrige Prio)

---

## Nicht mehr offen (gestrichen)

- ~~Wetter „auf Goch stellen"~~ — Feature, kein Bug (D2/K2)
- ~~SocialProof-Box entfernen~~ — Google-CTA (D2/K5)
- ~~Tippkick/Glücksrad/Battle/Bierkarte reparieren~~ — alle **entfernt**
