# ARBEITSAUFTRAG — Trinkgut Jammers Goch: Homepage auf Weltklasse-Niveau

**Auftraggeber:** Niko, Inhaber Trinkgut Jammers Goch e.K., Jürgensstraße 20, 47574 Goch
**Ausführung:** Claude Code (autonome Session auf MacBook M5 Max)
**Steuerung:** Builder-Instanz + permanente Auditor-Instanz (Protokoll siehe §7)
**Deployment-Ziel:** Hetzner (bestehende Infrastruktur)
**Dieses Dokument** liegt im Projekt-Root als `ARBEITSAUFTRAG.md` und ist die verbindliche Spezifikation. Kein Feature, kein Design-Element außerhalb dieses Auftrags ohne Freigabe.

---

## §1 Mission & Qualitätsmaßstab

Die bestehende Homepage wirkt optisch billig. Sie wird ersetzt durch eine Seite, die sich mit apple.com, spacex.com und cloudflare.com messen lässt — der Besucher soll das Gefühl haben, dass 1–2 Mio. € Entwicklungsbudget eingeflossen sind.

„Weltklasse" ist kein Gefühl, sondern wird über folgende Kriterien erzwungen:

| Dimension | Messlatte |
|---|---|
| Design | Awwwards-Niveau: eigenes Design-System, ein Signature-Element, null Template-Optik, null Standard-Bootstrap/Tailwind-Look |
| Motion | Orchestrierte Scroll-Choreografie (Apple-Produktseiten-Prinzip), durchgängig 60 fps, `prefers-reduced-motion` respektiert |
| Performance | Lighthouse ≥ 95 in allen 4 Kategorien (Mobile UND Desktop), LCP < 1,5 s, CLS < 0,05, INP < 200 ms |
| Bildsprache | Einheitliches Grading über alle Fotos, kuratiert auf Menschen & Aktionen — keine sterilen Regalbilder |
| Copy | Kurz, konkret, impulsiv. Keine Marketing-Floskeln. DE muttersprachlich, NL von Muttersprachler-Qualität |
| Wirkung | Teilbar/„viral": jede Sektion muss als Screenshot auf Instagram funktionieren |

**Verbotene Muster (Auditor prüft aktiv dagegen):** generische Hero-Sektion „großer Titel + Subline + zwei Buttons + Gradient", Standard-Card-Grids ohne eigene Handschrift, Stock-Foto-Ästhetik, Emoji als Design-Ersatz, cremefarbener Hintergrund mit Terracotta-Akzent (KI-Standardlook), Lorem-Ipsum-artige Fülltexte.

---

## §2 Phase 0 — Bestandsaufnahme & Versionsklärung (VOR allem anderen)

Auf dem Schreibtisch liegen **zwei Ordner desselben Projekts**. Unklar, welcher aktueller ist. Claude Code klärt das als allererste Aktion:

```bash
# Beide Ordner identifizieren (Pfade beim Start abfragen bzw. auf ~/Desktop suchen)
# Pro Ordner:
git -C <ordner> log -1 --format="%ci %h %s" 2>/dev/null   # letzter Commit, falls Git-Repo
find <ordner> -type f -not -path "*/node_modules/*" -newermt "2026-01-01" -printf "%T@ %p\n" | sort -rn | head -20
diff -rq <ordner-A> <ordner-B> --exclude=node_modules | head -50
```

**Entscheidungsregel:** Ordner mit jüngstem Commit bzw. jüngsten Quelldatei-Änderungen (ohne `node_modules`, ohne Build-Artefakte) = **aktiver Stand**. Der andere wird als `_ARCHIV_<datum>` umbenannt und nicht mehr angefasst. Ergebnis mit Begründung in `AUDIT_LOG.md` dokumentieren und **von Niko bestätigen lassen (Gate G0)**, bevor irgendetwas gelöscht oder überschrieben wird.

Weitere Phase-0-Aufgaben:

1. **Asset-Inventar:** Alle Bilder aus dem aktiven Ordner katalogisieren → `assets/INVENTAR.md` mit Kategorien: (a) Menschen/Aktionen, (b) Eigenmarken-Liköre, (c) Markt/Gebäude, (d) Logo/CI, (e) unbrauchbar.
2. **CI-Extraktion:** Exakte Trinkgut-Farbwerte, Logo-Varianten und ggf. vorhandene Schriften aus den Assets ziehen → Basis für Design-Tokens (§3). Keine Farbwerte raten.
3. **Feature-Inventar Altseite:** Party-Kalkulator, WM-2026-Modul, Mehrsprachigkeit, Click-&-Collect-Ansätze — was existiert, was ist übernehmbar, was ist Neubau.
4. **Instagram-Analyse:** Automatisierter Zugriff auf instagram.com/trinkgutjammers_goch ist blockiert. Niko legt Screenshots (Grid-Übersicht + 5–10 Top-Posts) in `brand-input/instagram/` ab; alternativ Analyse via Claude-in-Chrome-Session. Ziel: Tonalität, Bildsprache und Farbwelt des Kanals in die Design-Richtung übersetzen.

---

## §3 Design-System — das „1–2-Mio-€"-Gefühl

**Prozess:** In Phase 1 werden **zwei gegensätzliche Design-Richtungen** als klickbare Hero+Sektion-Prototypen gebaut (nicht nur Mockups). Niko wählt an Gate G1. Beide Richtungen müssen die Trinkgut-CI-Farben (aus §2 extrahiert) als präzise gesetzte Akzente tragen — nie als Flächen-Tapete.

Vorgeschlagene Spannbreite der zwei Richtungen:

- **Richtung A — „Cinematic Dark":** Tiefdunkle Bühne (SpaceX-Prinzip), Flaschen und Menschen treten wie ausgeleuchtet hervor, Trinkgut-Gelb/Rot als Lichtakzente, große kinetische Typo.
- **Richtung B — „Premium Light":** Viel Weißraum, harte Typo-Kontraste (Apple-Prinzip), Fotos in einheitlichem warmem Grading als tragendes Element, CI-Farben als chirurgische Akzente.

**Pflicht-Bausteine beider Richtungen:**

1. **Signature-Element (das eine Ding, das man sich merkt).** Kandidaten — finale Wahl in P1, technische Machbarkeit zählt:
   - Scroll-getriebene 3D-Flaschensequenz der Eigenmarken-Liköre (Three.js; Erfahrung aus dem Regal-Konfigurator ist vorhanden)
   - „Markt-Flythrough": scrollgesteuerte Kamerafahrt durch den 1.043-m²-Markt (aus Fotos/Video komponiert)
   - Kinetische Typo-Wand, die live Angebote/Events durchspielt
2. **Typografie:** Charakterstarke Display-Schrift + saubere Body-Schrift, beide selbst gehostet (kein Google-Fonts-CDN, DSGVO + Performance). Typo-Skala als Tokens.
3. **Foto-Pipeline (automatisiert, Sharp):**
   - Kuratierungsregel: **nur Fotos, auf denen Personen oder Aktionen im Fokus stehen** (Verkostung, Beratung, Team, Events). Sterile Regal-/Lagerbilder fliegen raus.
   - Ausnahme: **Eigenmarken-Liköre** werden als freigestellte Produkt-Heroes inszeniert (Schatten, Licht, ggf. 3D).
   - Einheitliches Grading/Duotone im CI-Look, Export AVIF/WebP mit Fallback, `srcset` für alle Breakpoints, Blur-up-Placeholder.
   - Rechtlicher Riegel: Bei klar erkennbaren Kunden ohne Einwilligung → Gesicht unkenntlich machen oder Bild verwerfen (Team-Fotos mit Einverständnis sind unkritisch).
4. **Micro-Interactions:** Hover-States, Magnetic Buttons, sanftes Parallax — dosiert. Ein orchestrierter Moment schlägt zehn verstreute Effekte.

---

## §4 Feature-Scope (vollständig, keine Ergänzungen ohne Freigabe)

### 4.1 Seitenstruktur

| Bereich | Inhalt / Anforderung |
|---|---|
| **Home** | Signature-Hero, aktuelle Angebote, Eigenmarken-Teaser, Events, IG-Grid, Standort-CTA |
| **Sortiment** | Kategorien nach HWG-Struktur (Bier, Wein, Spirituosen, AfG, …) — als visuelles Erlebnis, kein Katalog-Dump |
| **Eigenmarken-Liköre** | Eigene Bühne mit den vorhandenen Produktfotos, Story + Produkt-Heroes |
| **Getränke-Akademie** | Wissens-/Event-Sektion: Tastings, Warenkunde, Termine — redaktionell erweiterbar |
| **Verleih & Miete** | Zapfanlagen, Kühlanhänger/-wagen, Biertischgarnituren, Gläser etc. als Preis-/Anfragekarten mit Buchungsanfrage (Formular + WhatsApp-Deeplink) |
| **Click & Collect** | Stufe 1: Reservierungsanfrage per Formular/WhatsApp mit Bestätigungslogik — bewusst KEIN Shopsystem in diesem Auftrag. Architektur so bauen, dass ein Shop später andockbar ist |
| **Party-Kalkulator** | Bestehendes Feature übernehmen, im neuen Design-System neu bauen |
| **Events-Modul** | Generalisiertes, zeitgesteuertes Aktions-Modul. WM 2026 läuft nur noch bis 19.07.2026 — das Modul muss so gebaut sein, dass nach dem Finale nahtlos die nächste Aktion (Oktoberfest, Weihnachten, …) eingespielt wird, ohne Code-Umbau |
| **Über uns / Team** | Menschen-Fotos aus dem Asset-Pool, Geschichte, 1.043 m², Edeka/Trinkgut-Zugehörigkeit |
| **Kontakt & Anfahrt** | Öffnungszeiten, Karte, Anfahrt inkl. Routen aus NL |
| **Rechtliches** | Impressum, Datenschutzerklärung (inkl. Geo-IP-Wetter und Analytics), ggf. AGB Verleih |

### 4.2 NL-Landingpage (eigenständig, nicht nur Übersetzung)

- Route `/nl` mit eigener Dramaturgie für niederländische Grenzkunden (Nijmegen, Boxmeer, Gennep, Cuijk): Preisvorteil, Sortimentsbreite, Anfahrtszeit, Pfandsystem kurz erklärt.
- Sprachlogik: `hreflang` de/nl/en, automatische Sprachempfehlung per Browser-Locale (dezenter Banner, kein Zwangs-Redirect).
- NL-Texte in Muttersprachler-Qualität; finale NL-Korrektur als expliziter Audit-Punkt (Gate G4).

### 4.3 Interaktive Extras

- **Wetter nach Orts-IP:** Geo-IP (z. B. geojs.io, keine Speicherung) → nächstgelegene Stadt → Open-Meteo-API (kostenlos, kein Key). Fallback: Goch. Verwendung als charmantes Kontext-Element („18 °C in Nijmegen — perfektes Terrassenwetter, Radler ist kalt"). Datenschutzerklärung entsprechend ergänzen.
- **WhatsApp:** Floating-Button + Kanal-CTA prominent in Hero und Footer. Die Seite ist aktives Wachstumsinstrument für das Kanal-Ziel **5.000 Abonnenten bis Ende 2026** — jede Angebots-Sektion endet in einem Kanal-CTA.
- **Instagram:** Kuratiertes statisches Grid (Performance!) mit Deep-Link zum Profil; optional später Graph-API-Anbindung. Kein lahmes Embed-Widget von Drittanbietern.
- **Sprachen:** DE (primär), NL (Landingpage + Vollnavigation), EN (Basis).

---

## §5 Technik-Stack (verbindlich, Abweichung nur mit Begründung an Gate G1)

| Ebene | Vorgabe |
|---|---|
| Framework | **Astro** (static-first, Islands für Interaktion) — beste Performance-Basis für Hetzner-Static-Hosting. Alternative Next.js nur, falls Phase 0 zeigt, dass der aktive Stand bereits sauber auf Next.js läuft |
| Styling | Tailwind CSS v4 + eigene Design-Tokens (Farben, Typo, Spacing, Motion) — Tokens sind die einzige Quelle der Wahrheit |
| Motion | GSAP + ScrollTrigger, Lenis Smooth-Scroll; Three.js nur für das Signature-Element |
| Bilder | Sharp-Build-Pipeline gemäß §3.3 |
| Formulare | Serverless/PHP-Mailer je nach Hetzner-Setup, Spam-Schutz ohne Captcha-Drittanbieter (Honeypot + Time-Trap) |
| Analytics | Plausible oder Umami (cookielos, DSGVO-konform, kein Consent-Banner nötig) |
| SEO | `LocalBusiness`-Schema mit Öffnungszeiten, OG-Images pro Sektion, Sitemap, hreflang, Meta DE/NL/EN, lokale Keywords (Goch, Kleve, Grenzregion, „drankenhandel Duitsland") |
| Repo | Git, Feature-Branches pro Phase, Tags an jedem Gate (`gate-0` … `gate-6`) — Rollback jederzeit möglich |

---

## §6 Phasenplan mit Gates

Kein Phasenübergang ohne Auditor-PASS **und** Niko-Freigabe am Gate.

| Phase | Inhalt | Gate |
|---|---|---|
| **P0** | Versionsklärung, Asset-Inventar, CI-Extraktion, IG-Analyse, Feature-Inventar | **G0:** Niko bestätigt aktiven Ordner + Inventar |
| **P1** | Design-Tokens, zwei klickbare Design-Richtungen (Hero + 1 Sektion), Signature-Konzept mit Machbarkeitsnachweis | **G1:** Niko wählt Richtung |
| **P2** | Core-Build: Layout-System, Navigation, Home komplett, Design-System durchdekliniert | **G2:** Auditor-PASS Design + Technik |
| **P3** | Alle Sektionen aus §4.1, NL-Landingpage, Wetter, WhatsApp/IG, i18n | **G3:** Feature-Vollständigkeit gegen §4 |
| **P4** | Foto-Pipeline über alle Assets, finale Copy DE/NL/EN, Rechtstexte | **G4:** Content-Audit inkl. NL-Muttersprachler-Check |
| **P5** | Performance-Härtung, A11y, SEO, Visual-QA 360 px–4K, Cross-Browser | **G5:** alle Messwerte aus §1 erreicht |
| **P6** | Hetzner-Deploy (Staging → Prod), DNS/SSL-Check, Monitoring, Übergabe-Doku | **G6:** Live-Abnahme durch Niko |

---

## §7 Auditor-Protokoll (permanent, bis Fertigstellung)

**Setup:** Zwei parallele Claude-Code-Instanzen via tmux — `builder` und `auditor` — oder Auditor als Subagent, der nach jedem abgeschlossenen Arbeitspaket automatisch läuft. Der Auditor schreibt **nie** Feature-Code; er prüft, dokumentiert, blockiert.

**Gemeinsame Dateien im Repo-Root:**

- `AUDIT_LOG.md` — jedes Finding mit ID, Schweregrad (P1 Blocker / P2 Major / P3 Minor), Screenshot-Referenz, Status (offen/behoben/verifiziert)
- `DECISIONS.md` — jede Design-/Tech-Entscheidung mit Begründung (verhindert Stil-Drift über die Session-Laufzeit)

**Audit-Kadenz:**

1. Nach jedem abgeschlossenen Arbeitspaket: Kurz-Audit (Design-Regeln §1/§3, Token-Treue, Konsole fehlerfrei).
2. An jedem Gate: Voll-Audit mit der Checkliste unten.
3. Werkzeuge: Playwright-Screenshots aller Seiten bei 360/768/1024/1440/2560 px (der Auditor **schaut** die Screenshots an — Design-Bewertung nur am Bild, nie am Code), Lighthouse-CI, axe-core, Link-Checker, HTML-Validator.

**Voll-Audit-Checkliste (Gate-Pflicht):**

- [ ] Kein verbotenes Muster aus §1 vorhanden; Seite bei 5-Sekunden-Blindtest nicht als „Template/KI-Standard" erkennbar
- [ ] Signature-Element vorhanden, 60 fps (DevTools-Performance-Trace), Reduced-Motion-Fallback funktioniert
- [ ] Design-Tokens einzige Farb-/Typo-Quelle — keine hartkodierten Hex-Werte im Code
- [ ] Lighthouse Mobile & Desktop ≥ 95/95/95/95; LCP < 1,5 s, CLS < 0,05, INP < 200 ms (4G-Throttle)
- [ ] axe-core: 0 kritische Issues; Tastaturnavigation vollständig; Fokus sichtbar
- [ ] Alle 3 Sprachen vollständig, keine Mischsprachen-Fragmente, NL geprüft
- [ ] Alle Bilder durch Pipeline (AVIF/WebP, srcset, Placeholder); keine erkennbaren Kunden ohne Freigabe
- [ ] Formulare + WhatsApp-Deeplinks + Wetter-Fallback auf echtem Mobilgerät getestet
- [ ] Impressum/Datenschutz vollständig (inkl. Geo-IP, Analytics); keine externen Requests außer den in §5 genannten
- [ ] Git-Tag am Gate gesetzt, `AUDIT_LOG.md` ohne offene P1/P2

**Eskalationsregel:** Jedes P1-Finding stoppt den Builder sofort. Drei fehlgeschlagene Fix-Versuche am selben Finding → Stopp und Rückfrage an Niko statt Workarounds.

---

## §8 Definition of Done

Der Auftrag ist abgeschlossen, wenn: alle Gates G0–G6 mit PASS + Freigabe dokumentiert sind, sämtliche Messwerte aus §1 auf der Live-Domain erreicht werden, `AUDIT_LOG.md` keine offenen P1/P2 enthält, die Übergabe-Doku (Deploy-Prozess, Content-Pflege des Events-Moduls, Bild-Pipeline-Nutzung) vorliegt und Niko die Live-Seite abgenommen hat.

---

## §9 Input von Niko (vor Start P0 bzw. bis G1)

1. **Pfade der beiden Projektordner** auf dem Schreibtisch (oder Claude Code direkt auf `~/Desktop` suchen lassen).
2. **Instagram-Screenshots** (Grid + Top-Posts) in `brand-input/instagram/` — oder Claude-in-Chrome freigeben.
3. **Logo als SVG/Vektor**, falls nicht in den Ordnern enthalten.
4. **Verleih-Sortiment mit Preisen** (Zapfanlagen, Kühlanhänger, Garnituren, Gläser, Kautionen).
5. **Impressumsdaten + Öffnungszeiten** bestätigen (sofern nicht 1:1 aus Altseite übernehmbar).
6. Entscheidung an G1: Design-Richtung A oder B.
