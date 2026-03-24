# Trinkgut Jammers – Projektstand

## Workspace
`/Users/niko/Desktop/Claude Code/trinkgut-jammers/`

## Tech-Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Dev-Server: `npm run dev` (Port dynamisch)

## Phasen-Status (aus Projektplan)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Grundlagen (Next.js, Struktur) | ✅ Done |
| 2 | Shop (143 Produkte, Warenkorb, Checkout) | ✅ Done |
| 3 | EAN Bildsystem (Bilder von trinkgut.de) | ✅ Done |
| 4 | Partyplaner (Mengenberechnung + Warenkorb) | ✅ Done |
| 5 | Angebote (Star der Woche, Prospekt, Instagram-Rabatt) | ✅ Done |
| 6 | Finder Tools (Bier/Wein/Wasser Quiz) | ✅ Done |
| 7 | Gewinnspiele (Monster Cooler, HOTT Sport, Salitos) | ✅ Done |
| 8 | Tippkick (Registrierung, Tipps, Rangliste) | ✅ Done |
| 9 | Content & Kurse (65 Cocktail-Rezepte) | ✅ Done |
| 10 | WhatsApp (Floating Button + Click-to-Chat) | ✅ Done |
| 11 | Testing & UX-Optimierung | 🔄 In Progress |
| 12 | Launch | ❌ Pending |

## Zusätzliche Features
- Vermietung / Leihsortiment-Seite
- Impressum (echte Daten von trinkgut.de/markt/jammers)
- Datenschutzerklärung (DSGVO)
- Cookie-Consent-Banner
- SEO (Meta-Tags, Open Graph, Title Templates)
- next/image Optimierung (Remote Patterns)
- Mega-Menü Navigation (Desktop Dropdowns + Mobile Drawer)
- CSS-Animationen (Scroll-Reveals, Stagger, Glassmorphism)
- Skeleton Loading Components

## Datenquellen
- **Produkte:** 143 Artikel gescraped von trinkgut.de/angebote (23.03.2026)
- **Impressum:** trinkgut.de/markt/jammers
- **Instagram-Content:** @trinkgutjammers_goch (Gewinnspiele, Aktionen)
- **Logo:** Trinkgut SVG von trinkgut.de + "Jammers" Text

## Kontaktdaten (Impressum)
- Trinkgut Jammers, Jammers e.K.
- Inhaber: Nikolaos Jammers
- Jurgenstr. 20, 47574 Goch
- Tel: 02823-418707 | Fax: 02823-18680
- E-Mail: jammers-goch@trinkgut.de
- Mo-Sa 08:00-20:00 Uhr
- HRA 5711 (AG Kleve) | USt-IdNr: DE369759343

## Seiten-Übersicht
- `/` – Startseite (Hero, Kategorien, Highlights, Services, Instagram-CTA)
- `/produkte` – 143 Produkte mit Suche + 6 Kategorie-Filter
- `/produkte/[slug]` – Produktdetailseite
- `/kategorie/[slug]` – Kategorie-Übersicht
- `/angebote` – Star der Woche, Prospekt, Kategorie-Deals
- `/partyplaner` – Mengenberechnung + Warenkorb-Integration
- `/vermietung` – Leihsortiment (12 Artikel)
- `/finder` – Bier/Wein/Wasser-Quiz
- `/cocktails` – 65 Rezepte in 6 Kategorien
- `/gewinnspiel` – 3 aktive Gewinnspiele + Instagram-CTA
- `/tippkick` – Bundesliga-Tippspiel
- `/warenkorb` – Warenkorb
- `/checkout` – Checkout mit Abholung/Lieferung
- `/impressum` – Rechtliche Angaben
- `/datenschutz` – DSGVO-Datenschutzerklärung

## Neue Features (Session 2)
- Handzettel DE/NL (`/handzettel`) — Flaggen-Toggle, länderspezifische Texte und Farben
- Getränkeakademie (`/akademie`) — 7 Kurse mit 33 Lektionen (Bier, Whisky, Wein, Mineralwasser, Saft, Schaumwein, Liköre)
- 65 Cocktail-Rezepte (12 Rum, 11 Vodka, 11 Whiskey, 11 Gin, 10 Aperitif, 10 Tequila)
- CSS-Animationen: fadeInUp, slideIn, stagger-children, card-hover, btn-hover
- Glassmorphism (.glass, .glass-dark), Gradient-Text, Custom Scrollbar
- Skeleton Loading Components
- Cookie-Consent-Banner + Datenschutzseite

## Geplanter Datenimport (wartet auf User)
Der User wird einen Ordner bereitstellen mit:
- **Fotos vom Laden** → für Hero, About-Section, Galerie
- **Excel mit allen Artikeln + eigene UVPs** → ersetzt aktuelle products.json
- **EAN-Codes** → für automatischen Produktbild-Lookup über APIs (Open Food Facts, UPCitemdb)

### Import-Workflow:
1. Excel einlesen (xlsx-Skill)
2. Artikel-Daten in products.json konvertieren
3. Pro EAN: Produktbild über API suchen, lokal speichern
4. Fallback: Bild von trinkgut.de oder Placeholder
5. UVPs als Normalpreise, Werbepreise als Angebotspreise

## TODO
- [ ] Echtes Trinkgut Jammers Logo als Bilddatei einbinden (User muss von Instagram speichern)
- [ ] Markt-Fotos einbinden (wartet auf User-Ordner)
- [ ] Excel-Import der echten Artikeldaten (wartet auf User-Ordner)
- [ ] EAN → Produktbild API Integration
- [ ] Backend/API für Formulare (Checkout, Gewinnspiel, Tippkick)
- [ ] Lighthouse Performance Audit
- [ ] Launch-Vorbereitung (Domain, Hosting, SSL)
