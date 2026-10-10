# Sitewide visual acceptance controller checklist

Prepared 2026-10-10 by independent read-only source inspection. This is a practical visual-review companion, not formal e2e cases or proof of passing UI. Product/tests/data untouched; no browser, server, mail, application, payment, or order action performed. Source paths below are relative to the cinematic-production worktree. Approved authority: `AGENTS.md` and `docs/superpowers/specs/2026-10-10-sitewide-filmisch-design.md`.

## Review discipline

- [ ] Use only the local preview origin, already started by the controller. Never deploy or change config.
- [ ] Capture each rendered family and significant state at desktop, tablet, and narrow mobile (suggested 1440×1000, 768×1024, 390×844), including scrolled content, not hero alone. These sizes are review choices, not product breakpoints.
- [ ] Use a dedicated fresh browser context. Cart, wishlist and leergut examples below change only disposable session state; do not clear a person's existing lists/history.
- [ ] Actual safe clicks for navigation and widget state transitions. No real order POST, mail/WhatsApp draft handoff, payment, application or upload. For unreachable success/failure states use existing synthetic response interception by the formal e2e owner; never enable functions or seed real backend data.
- [ ] All relative internal destinations stay on the local origin. External source links need only destination inspection; no external account login, giveaway participation, phone call or message.
- [ ] At every family inspect typography, widths, image framing, form controls, footer, focus outline, overflow, and stale beige/colorful rounded-card/glow/emoji styling. Labels here are source-derived; recheck after concurrent redesign edits.

## Complete rendered route families

32 static customer URLs plus 85 generated canonical detail URLs = 117 rendered customer URLs without order identities. Also inspect the safe rental status/error route, 107 redirect aliases and invalid paths. `noindex` is not an exemption.

| Family | Real routes | Significant visual coverage / source |
| --- | --- | --- |
| Entry | `/`, `/nl` | Full page: film controls, DE/NL offers and viewer, all six brands, stories/team placeholder, actions/GrailBid/contact; NL language entry visible on mobile. `app/page.tsx`, `components/cinematic/*`, `app/nl/page.tsx`, `app/nl/nl.module.css` |
| Offers / assortment | `/angebote`, `/handzettel`, `/produkte`; all six `/kategorie/*` below | DE/NL full artwork, search/language filters, conditions disclosure, warnings, empty results, academy entry. `components/ProductCatalogue.tsx`, `WeeklyOfferGrid.tsx`, `FlyerIndexView.tsx`, `app/kategorie/[slug]/page.tsx` |
| Brands / gifting | `/eigenmarke`, `/regionale-spirituosen`, `/geschenkideen` | Six brands, regional product stories, uncut original posters/price information and gifting scenes; no invented live stock/price. `app/{eigenmarke,regionale-spirituosen,geschenkideen}/page.tsx`, `data/eigenmarken.ts`, `data/regional-specialties.ts` |
| Recipes | `/cocktails`; six category URLs and 65 recipes below | Category chips, card photo/credit disclosure, recipe with photo and without photo, ingredients/instructions/tip, breadcrumbs. `lib/cocktail-routes.ts`, `data/cocktails.ts`, `components/recipes/*`, `app/cocktails/[slug]/page.tsx` |
| Academy | `/akademie`, `/akademie/zertifikate`; eight course URLs below | Course cards, certificate/external-information list (removed funding banner stays absent), responsive lessons/sidebar, quiz feedback, completion, exam and pass/fail. `data/akademie*.ts`, `app/akademie/[slug]/page.tsx`, `components/AcademyCover.tsx` |
| Market / people | `/marktleben`, `/galerie`, `/gewinnspiel`, `/gewinnspiel/archiv` | Full lower-page stories, seven current portraits plus approved team placeholder, covers/date badges/year agenda/pending months and handover photos. `app/{marktleben,galerie}/page.tsx`, `components/giveaways/*`, `data/user-market-photos.ts` |
| Career | `/bewerbung` | All three full job posters, fulltime/parttime disabled CTA, Ausbildung email-only, upload-unavailable notice and correct address; no upload/submit. `components/applications/ApplicationForm.tsx`, `lib/application-contact.ts` |
| Party / rental | `/partyplaner`, `/vermietung`, `/warenkorb`, `/checkout`, `/bestellungen`, `/mietbestellung/acceptance-missing-order` | Calculator valid/invalid/result, all 19 rental items, date/quantity alerts, local cart drawer/list, empty/mixed/inquiry checkout, delivery fields, missing-token status. `app/vermietung/page.tsx`, `components/rentals/*`, `data/rentals.ts` |
| Customer tools | `/finder`, `/merkzettel`, `/partyspiele`, `/leergut`, `/oeko-tracker` | All finder steps/results; empty/populated wishlist and drawer; eight game panels; calculator/history and eco manual/history/results. Source gestures below |
| Retired information | `/community`, `/kuehlschrank` | Existing retired-function notices and back/contact links; do not reactivate profiles/points/fridge. `app/community/page.tsx`, `app/kuehlschrank/page.tsx` |
| Visit / legal | `/kontakt`, `/impressum`, `/datenschutz`, `/agb` | Original frameless logo links; opening hours/address; long-text line lengths, headings, links and footer. Preserve legal wording. Corresponding `app/*/page.tsx` |
| System | `/acceptance-no-such-page`, `/kategorie/acceptance-missing`, `/produkte/acceptance-missing`, `/cocktails/acceptance-missing`, `/cocktails/kategorie/acceptance-missing`, `/akademie/acceptance-missing` | Global 404 versus academy's custom “Kurs nicht gefunden”; readable return links and common chrome. `app/not-found.tsx`, dynamic route files and layouts |

Excluded from redesign workflow: `/bewerbung/verwaltung`, `/markt/bestellungen`, `/test-fixtures/weekly-flyer`, `/test-fixtures/weekly-offers`, API routes, documents/emails, external GrailBid. Public access-denied shells may be observed without login or rights/config changes.

## Exact generated routes

Sources: `lib/utils.ts` (`categories`, `createSlug`), `lib/cocktail-routes.ts`, `data/cocktails.ts`, `data/akademie.ts` and six imported course files. Slugs are literal output, not inferred spellings.

- [ ] Categories: `/kategorie/bier`, `/kategorie/alkoholfrei`, `/kategorie/wein`, `/kategorie/sekt`, `/kategorie/spirituosen`, `/kategorie/lebensmittel`.
- [ ] Courses: `/akademie/bier`, `/akademie/whiskey`, `/akademie/mineralwasser`, `/akademie/saft`, `/akademie/wein`, `/akademie/schaumwein`, `/akademie/likoere`, `/akademie/rum`. Note `whiskey`, not `whisky`.
- [ ] Cocktail categories: `/cocktails/kategorie/rum`, `/cocktails/kategorie/vodka`, `/cocktails/kategorie/whiskey`, `/cocktails/kategorie/gin`, `/cocktails/kategorie/aperitif`, `/cocktails/kategorie/tequila`.
- [ ] Rum recipes (prefix `/cocktails/`): `mojito`, `cuba-libre`, `daiquiri`, `pi-a-colada`, `mai-tai`, `dark-n-stormy`, `zombie`, `rum-punch`, `planter-s-punch`, `caipirinha`, `hurricane`, `bahama-mama`.
- [ ] Vodka recipes (same prefix): `moscow-mule`, `cosmopolitan`, `vodka-martini`, `bloody-mary`, `espresso-martini`, `sex-on-the-beach`, `white-russian`, `black-russian`, `screwdriver`, `vodka-sour`, `lemon-drop`.
- [ ] Whiskey recipes: `jack-coke`, `old-fashioned`, `whiskey-sour`, `manhattan`, `mint-julep`, `irish-coffee`, `lynchburg-lemonade`, `penicillin`, `boulevardier`, `highball`, `sazerac`.
- [ ] Gin recipes: `gin-tonic`, `negroni`, `gin-fizz`, `tom-collins`, `gimlet`, `bramble`, `aviation`, `singapore-sling`, `last-word`, `french-75`, `bee-s-knees`.
- [ ] Aperitif recipes: `aperol-spritz`, `hugo`, `campari-spritz`, `bellini`, `kir-royal`, `mimosa`, `rossini`, `lillet-vive`, `americano`, `limoncello-spritz`.
- [ ] Tequila recipes: `margarita`, `paloma`, `tequila-sunrise`, `tommy-s-margarita`, `mezcal-mule`, `mezcal-negroni`, `el-diablo`, `mexican-mule`, `batanga`, `ranch-water`.
- [ ] At minimum visually compare `/cocktails/mojito` (approved photo), `/cocktails/mai-tai` (no approved photo), and the unusual actual slug `/cocktails/pi-a-colada`; expand “Foto & Lizenz” on collection cards. Sources: `data/cocktail-images.ts`, `components/recipes/CocktailPhoto.tsx`.

## Actual safe gestures and conditional-state boundaries

### Academy

- [ ] On `/akademie/mineralwasser`, inspect initial lesson and disabled “📝 Abschlusstest” / “Erst alle Quiz abschließen”; mobile sidebar and active lesson indicator need their own capture.
- [ ] Use the lesson sidebar or progress button accessible name `Lektion N: <actual lesson title>`; use “Nächste Lektion →” and “← Vorherige” and verify active state/content. First previous button is disabled.
- [ ] Answer one visible quiz option: options immediately disable, correct option highlights, selection gets “✓ Richtig!” or “✗ Leider falsch.” plus explanation. After each choose “Nächste Frage →”; after question 3 choose “Ergebnis anzeigen” → “Quiz abgeschlossen — X/3 richtig”.
- [ ] Complete all 20 lesson quizzes on mineralwasser/saft/schaumwein/likoere (60 answer clicks). Bier/whiskey/wein/rum have 25 × 3. Any score unlocks the final, so do not fabricate a lesson completion by data edits.
- [ ] Open “📝 Abschlusstest” or “📝 Zum Abschlusstest”; inspect final header, 10-question quiz, progress/feedback and full result page. 7/10 passes; 6/10 or fewer fails; fail provides “Nochmal lernen”. Use `correct` indices in course data to deliberately get pass/fail through UI. Course progress is component state (no storage), so reload gives a fresh run.
- [ ] Unknown `/akademie/acceptance-missing` uses custom return-to-academy content, not necessarily global 404. Source: `app/akademie/[slug]/page.tsx`.

### Finder / wishlist / sample-product inquiry

- [ ] `/finder` → “Bierfinder” → “Pils – herb & frisch” → “Keine Präferenz” → “Feierabendbier”: currently 10 product examples, including Jever Pilsener. Capture selection, each question, progress and recommendation grid. Heading receives focus after state change.
- [ ] Reset via “Nochmal versuchen”, then “Bierfinder” → “Pils – herb & frisch” → “Klassisch” → “Party / Grillabend”: currently empty result. Also Weinfinder → Rotwein → Trocken → Zum Essen and Wasserfinder → Still / Naturell → Glasflasche (Mehrweg) → Täglicher Bedarf are empty with current catalog evidence. “← Zurück zur Auswahl” resets quiz.
- [ ] These are sanitized historical assortment examples, NOT current weekly prices/stock. `lib/catalog.ts` zeros price, marks no live stock and removes historical crops; finder `ProductGrid` is text-only without a decorative logo photo. Sources: `app/finder/page.tsx`, `lib/finder-products.ts`, `components/ProductCard.tsx`.
- [ ] On populated finder result scope a product card: click “Zum Merkzettel” (aria-pressed toggles; now “Vom Merkzettel entfernen”), visit `/merkzettel` or header “Merkzettel”. Capture empty/populated `components/WishlistDrawer.tsx`, selected card, “Alle zur Anfrageliste (N)” and local status. Wishlist key `trinkgut-wishlist` is sessionStorage.
- [ ] In the product card click “Anfragen” → cart drawer opens automatically; inspect its text-only product and quantity controls. Close with “Schließen”; source wishlist close label is “Schliessen”. Check Escape, backdrop close and focus return as expected by approved design. Source: `CartDrawer.tsx`, `WishlistDrawer.tsx`, `context/{Cart,Wishlist}Context.tsx`.
- [ ] Current `/produkte` and category pages use `WeeklyOfferGrid`, not `ProductGrid`: no heart/cart on original offer crops. To reach wishlist/product cart states use finder results, not an assumed weekly-offer button.

### Partyplaner

- [ ] `/partyplaner`: default 20 guests, 5 hours, shares 50/20/20/10. “Berechnen” shows exactly Bier, Wein, Softdrinks, Spirituosen, Wasser in liters plus explanatory text; no catalog/product/cart transfer.
- [ ] Inputs `#party-guests` (5–200 step5), `#party-duration` (2–12), `#party-beerDrinkers`, `#party-wineDrinkers`, `#party-softDrinkers`, `#party-spiritDrinkers` (0–100 step5). Set beer50→55 ⇒ Summe105% alert `#party-distribution-error`, disabled calculate and hidden previous result. Restore50 and recalculate. Keyboard arrows/Home/End on sliders verify labels/values/focus. Source: `app/partyplaner/page.tsx`, `lib/party-planner.ts`.

### Rental / cart / checkout / order status

- [ ] Fresh `/warenkorb` and `/checkout` give distinct empty list messages. `/bestellungen` is an informational retired-history view, not a real order listing.
- [ ] `/vermietung`: inspect all 19 item cards in Kühlung & Ausschank, Mobiliar & Zubehör and Gläser, KI-example labels, 3-workday pricing and glass breakage information.
- [ ] Set “Gewünschte Abholung” 2026-10-12 and “Gewünschte Rückgabe” 2026-10-14, input `#rental-quantity-20003` (Stehtisch) to1 ⇒ one block, €12 line/total. “In den Warenkorb” changes local session state only and opens drawer. Visit `/warenkorb` → quantity +/- and remove, local totals, rental date panel; no reservation is made.
- [ ] Stehtisch20→21 rejects with quantity alert. Kühlanhänger `#rental-quantity-20001` capacity3, qty4 likewise. Invalid date: set return first earlier than a later pickup; capture “Bitte einen gültigen Zeitraum auswählen; die Rückgabe darf nicht vor der Abholung liegen.” and disabled add. Fractional/negative quantity gives “Bitte eine ganze Menge ab 0 auswählen.” Inventory/shared furniture constraints remain unchanged.
- [ ] Furniture exclusivity: select Tisch einzeln20005 / Bank einzeln20006 then Bierzeltgarnitur20007; the conflicting local selection clears. Source `lib/cart-items.ts`; verify layout/status, not a new rule.
- [ ] Add a finder example via “Anfragen” to existing local rental list ⇒ mixed inquiry title/partial rental sum; never show a complete payable mixed total. Capture cart drawer and page.
- [ ] Current disabled rental config leads to `InquiryCheckout` even for valid fully-priced rentals. On `/checkout` select `#inquiry-method` option “Lieferung nach Absprache anfragen” ⇒ PLZ `#inquiry-postal`, Ort `#inquiry-city`, delivery notice; back to pickup hides fields. Inspect `#inquiry-name`, `#inquiry-notes` and summary. STOP before “E-Mail-Entwurf öffnen” / “WhatsApp-Nachricht öffnen” (external handoff).
- [ ] Safe `/mietbestellung/acceptance-missing-order` without token: loading → API error/alert + “Erneut laden”. Never guess actual IDs/tokens. Status submitted/accepted/declined/handed_over/returned, payment and receipt sections can only be reviewed from authorized existing synthetic interceptions. Do not create order, simulate payment, access private order or alter mode.
- [ ] Unreachable current-config variants: priced checkout form, config failure/loading, open-price cart, inquiry handoff/error and real status success need synthetic test-response coverage; all 19 present rental prices are numeric, so no real open-price product exists to click. Sources: `components/rentals/{RentalCheckout,InquiryCheckout,RentalOrderStatus}.tsx`, `lib/rental-cart.ts`, `data/rentals.ts`, `context/CartContext.tsx` (session key `trinkgut-cart`).

### Giveaway / flyer / original offer states

- [ ] `/gewinnspiel` jumps: “Offene Gewinnspiele” `#aktuell`, “Jahresagenda 2026” `#jahresagenda`, “Gewinnmomente” `#gewinnmomente`, “Zum Archiv” `/gewinnspiel/archiv`. On 2026-10-10 Berlin active: Everdure KILN R (ends31Oct) and Disaronno (ends18Oct); nine ended monthly cards, November/December “Noch nicht angekündigt”. Preserve full covers, dates, original-post links, no participation form. Archive has nine monthly and four ended specials. Sources: `data/giveaways.ts`, `lib/giveaways.ts`, giveaway pages/cards.
- [ ] `/handzettel`, `/angebote`, home offer area and `/nl#handzettel`: open DE and NL viewer. Source trigger “Handzettel ansehen” / “Folder bekijken”; dialog close aria-label “Handzettel schließen” / “Folder sluiten”; dialog `[data-flyer-dialog-state]` loading/ready/error, backdrop `[data-flyer-dialog-backdrop]`. Check Escape, Tab trap and return focus, then close/backdrop/reopen.
- [ ] Viewer is an iframe modal plus direct/PDF links, not an app-owned zoom/fullscreen toolbar. Embedded PDF/browser controls are separate. 8s load timeout produces fallback error links; cover failure shows no-preview text. Force failure only through isolated test interception, not broken production media.
- [ ] Snapshot KW41 valid05–10Oct2026: DE18 pages, NL1 page. Existing local originals: `/handzettel/2026/de-2026-10-05-be4b243ec0ddb84bee38054f051702a670ea8871fc897584190aefd9b8b4642a.pdf`, `/handzettel/2026/nl-2026-10-05.pdf`. Follow actual current data if calendar changes; expired output must not be presented current.
- [ ] `/produkte`: “Alle Angebote”, “Deutsch”, “Nederlands” pressed states; search “Krombacher” for matching crops and `acceptance-no-match-zzzz` or `/produkte?search=acceptance-no-match-zzzz` for empty list. Expand “Bedingungen zum Angebot” where present and inspect “Hinweis zum Original:” warnings. “Originalhandzettel öffnen ↗”/image destination includes `#page=N`. No normalized invented prices. Sources: `WeeklyOfferGrid.tsx`, `ProductCatalogue.tsx`, `FlyerIndexView.tsx`, `components/cinematic/FlyerViewer.tsx`, `data/editorial/weekly-publications/2026-10-05.json`.
- [ ] No-active-giveaway, no-current-flyer, missing-NL and scheduled-flyer notices are clock/data-dependent; reach them only with existing synthetic coverage, never source edits or server clock changes.

### Other utility states often missed below the hero

- [ ] `/partyspiele`: open each named card (Trink-Roulette, Wahrheit oder Pflicht, Bier-Pong Scoreboard, Flunkyball Timer, Kings Cup, Ich hab noch nie..., Cocktail-Quiz, Getränke-Tabu), inspect scrollable panel and “Alkoholfrei” toggle, close button “Schließen” and backdrop. Check keyboard/focus behavior against approved spec; do not presume legacy modal implements Escape correctly.
- [ ] Roulette add fictional player with “+” then spin; Wahrheit/Pflicht draw each; Bier-Pong team inputs, Start/Stopp/Reset, scoring/cup-removal and rules disclosure; Flunkyball30s/60s/90s and +1 Punkt; Kings Cup draw and Neues Deck; statements draw; Cocktail-Quiz “Quiz starten” → answer feedback → ten-question result / “Nochmal spielen”; Tabu “Spiel starten” → Richtig!/Überspringen → timer/result. ShareButton is external/native clipboard share; do not click. Source `app/partyspiele/page.tsx`.
- [ ] `/leergut`: aria `Anzahl Einweg PET-Flasche` set2 ⇒ €0.50; “Speichern & zurücksetzen” creates disposable session history row. Inspect row/date/total, counters/reset and disabled “Foto-Scan derzeit nicht verfügbar”; no file/photo upload. Delete only your test row (“Eintrag löschen”), not any user's prior history. Photo/loading/success/error code remains dormant and is not permission to enable. Source `app/leergut/page.tsx`.
- [ ] In same disposable session `/oeko-tracker`: populated “Aus Leergut-Historie (N Flaschen)” vs “Manuell eingeben”; `#returned-bottles-count` 0 then1000 gives zero/full stats, progress/equivalents and higher achievement states; inspect lower cards. Fresh context has manual/no-history tip. Do not use share actions. History key `trinkgut-leergut-historie`; sources both utility pages.

## Shared chrome / hidden old-style reminders

- [ ] Five groups exactly: Angebote→/angebote; Sortiment→/produkte; Party & Miete main link→/vermietung plus separate submenu toggle; Jammers entdecken with Getränke / Erleben / Rezepte & Wissen / Team & Karriere; Dein Besuch→/kontakt. No duplicate legacy header after client navigation.
- [ ] Desktop mouse/touch/tab, submenu toggle distinct from real href, Escape closes, focus returns, menu closes after navigation. Mobile NL directly visible and nested groups usable; logo home; cart/wishlist access preserved. Active sources: `app/layout.tsx`, `components/PublicChrome.tsx`, `components/cinematic/{CinematicHeader,NavigationDisclosure,MobileNavigation,LocationFooter}.tsx`, `lib/cinematic/site.ts`.
- [ ] Current `app/layout.tsx` consumes `PublicChrome` for header/footer/drawers. It supplies `CinematicHeader`, `LocationFooter`, `CartDrawer` and `WishlistDrawer` on subpages, returning null for exact / and /nl because those landing pages own localized landmarks. `DeChrome`/legacy Header are not consumed by this layout; do not infer active subpage chrome from them. Compare /→/finder→/nl→/warenkorb client navigation and direct reloads for correct localized chrome and no duplicate landmarks.
- [ ] Inspect CartDrawer and WishlistDrawer independently: overlays, totals/partial totals, yellow rental badges, empty copy, footer actions, close labels and scroll. `components/CartDrawer.tsx`, `WishlistDrawer.tsx`.
- [ ] Course/exam feedback colors can carry semantic success/error; decorative beige course headers, emoji exam buttons, card radii and disabled controls must still fit new system.
- [ ] Party games' inner colored timers, result cards, scoreboard/winner panels, rules and share footer are separate from list hero. Leergut green gradient totals / history; eco floating leaves, badges / achievements and sharing; finder ProductCard hardcoded beige borders/text. Review these, not only global CSS.
- [ ] Career disabled contact area and three original posters; no removed employee/funding claims, old group photo, Gabriella/Justin or cleaning portrait reintroduced. Original flyers/posters/logo art remain uncut and uncolored; contact originals frameless.
- [ ] Preserve readable legal content and 404/restricted/information shells, standard focus state, reduced-motion preferences and no horizontal overflow at narrow widths. Persisted local list notices should not become unverified reservations.

## Retired product alias appendix

Each slug below means `/produkte/<slug>` redirects to its group's `/kategorie/<group>`, not a new detail page. Source: all107 rows in `data/products.json`, `app/produkte/[slug]/{layout,page}.tsx`. Minimum real clicks: /produkte/jever-pilsener→/kategorie/bier, /produkte/leonardi→/kategorie/wein, /produkte/cinzano-asti-spumante→/kategorie/sekt, /produkte/baileys→/kategorie/spirituosen, /produkte/coca-cola→/kategorie/alkoholfrei, /produkte/toffifee→/kategorie/lebensmittel. Invalid product must show404 instead.

- [ ] bier (38): `altenmuenster-urig-wuerzig`, `bolten-altbier`, `budweiser-budvar-o-budvar-0-0`, `carlsberg-elephant-extra-strong`, `estrella-galicia`, `flensburger-pilsener-o-fruehlingsbock`, `frankenheim-alt-o-blue`, `franziskaner-weissbier`, `franziskaner-witbier`, `hb-witbier-muenchner-weisse`, `heren-handtas-xxl`, `hofbraeuhaus-muenchen-helles-vollbier`, `jever-pilsener`, `kloster-scheyern-kloster-gold-hell-oder-dunkel`, `koenig-pilsener-steinie`, `koestritzer-schwarzbier`, `leikeim-premium-pils`, `luebzer-pils`, `oberdorfer-helles`, `schneider-weisse-tap-7-witbier`, `stauder-blond-radler`, `traugott-simon-pilsener-o-landbier`, `traugott-simon-pilsener-steinie`, `veltins-helles-puelleken-helles-puelleken-0-0-o-helles-zitronken`, `warsteiner-pils`, `warsteiner-pilsener`, `zirndorfer`, `beck-s`, `bitburger-pils`, `desperados`, `erdinger-witbier`, `faxe-premium-lager`, `hertog-jan`, `hofbraeu-maibock`, `jupiler-pils`, `krombacher`, `traugott-pils`, `veltins`.

- [ ] wein (8): `grand-premier-cru-o-pfaffl`, `leonardi`, `oberrotweiler-winzerverein`, `reuter-dusemund-ortega`, `reuter-dusemund-regent`, `vier-jahreszeiten`, `maybach`, `wein-genuss`.

- [ ] sekt (4): `brut-dargent-ice-chardonnay-pinot-noir`, `cinzano-asti-spumante`, `rot-kaeppchen`, `soehnlein-brillant-sekt-o-white-ice`.

- [ ] spirituosen (25): `baileys`, `berentzen-riem`, `captain-morgan`, `chantr`, `chantr-brandewijn`, `cointreau-orangenlikoer`, `d-j-vu`, `gordon-s-london-dry-gin`, `j-walker-red-label`, `johnnie-walker-red-label`, `kilbeggan-irish-whiskey`, `label-5-blended-scotch-whisky`, `lillet-l-ap-ritif`, `mamont-vodka`, `ouzo-12-o-12-gold-anis-liqueur`, `ramazzotti`, `roku-gin`, `verpoorten-eierlikoer`, `vescovino-limoncello-spritz`, `villa-massa-limoncello`, `bacardi`, `chivas`, `don-papa-botucal`, `jim-beam`, `three-sixty`.

- [ ] alkoholfrei (29): `afri-cola-o-bluna`, `bad-brambacher-garten-limonade`, `bio-volvic-tee-o-vitamin`, `coca-cola`, `coca-cola-fanta-o-sprite`, `edeka-ice-tea`, `emsland-sonne-limonaden`, `landpark-bio-quelle-erfrischungsgetraenke`, `pepsi-cola-schwip-schwap-o-seven-up`, `pfanner-sparkling-eistee`, `thomas-henry-bitter-getraenke`, `tut-gut-malzbier`, `gerolsteiner-mineralwasser`, `landpark-bio-quelle-mineralwasser`, `nuerburg-quelle-o-purborn-mineralwasser`, `roemerwall-mineralwasser`, `st-leonhards-quelle`, `toenissteiner-mineralwasser`, `vitrex`, `warburger-waldquell-mineralwasser`, `capri-sun`, `hohes-c`, `leonie-saft`, `28-black-energy-drink`, `effect-energy-drink`, `goenrgy-energy-drink`, `elephant-bay`, `fuze-tea`, `monster`.

- [ ] lebensmittel (3): `funny-frisch-spezialitaeten`, `hawesta-heringsfilets`, `toffifee`.
