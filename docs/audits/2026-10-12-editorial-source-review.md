# Editorial source review — 2026-10-12

## Status

The editorial review is integrated for all 245 actual entries: 180 lessons across eight courses and 65 recipes. All 620 lesson and final-exam questions were included in the reading and answer-key review. The registry has 268 resolving source records covering 263 distinct primary-source URLs.

| Course | Lessons | Lesson / final-exam questions |
| --- | ---: | ---: |
| Beer | 25 | 75 / 10 |
| Whiskey | 25 | 75 / 10 |
| Wine | 25 | 75 / 10 |
| Rum | 25 | 75 / 10 |
| Mineral water | 20 | 60 / 10 |
| Juice | 20 | 60 / 10 |
| Liqueurs | 20 | 60 / 10 |
| Sparkling wine | 20 | 60 / 10 |

This is an editorial content and answer-key review, not an external professional accreditation. Full lesson bodies, ingredient/preparation instructions, quizzes and final exams were read. The public registry records the actual date, selected primary sources and a bounded scope per item. It does not claim that subjective aromas, pairings or a secret producer recipe are independently certified.

## Important corrections

- Legal definitions and answer keys: regional wine alcohol minima; German Prädikat versus residual sugar; rum flavouring versus allowed sweetening; youngest-component age; liqueur sugar exceptions; crème de cassis and egg liqueur; current Prosecco Rosé, Cava and Franciacorta rules.
- Health and safety: removed alleged safe drinking thresholds, digestive health promises, tobacco pairing coaching and rum investment-return claims. Optional unheated egg is specified as pasteurised; Batanga uses a bar spoon. Sparkling wine glasses must be clean, corks controlled and bottles pointed away from people. Carbon dioxide is not taught as dissolving fat or fish protein.
- Origin and manufacture: Deutscher Sekt requires German basic wines, rather than merely German secondary fermentation. Champagne's 15-month minimum includes at least 12 months on lees. Chardonnay rose was added in 2025. Chartreuse Yellow is currently 43%; Nonino uses grape acquavite, not grappa; Tia Maria's current coffee is Brazilian Arabica.
- Historical/quantitative boundaries: Qvevri practice is UNESCO intangible heritage. Rioja ageing depends on wine colour and origin. Unverified rankings, universal maturation formulas, fixed shelf lives and guaranteed climate/market predictions were removed or qualified.
- Beer and whiskey: corrected yeast-temperature generalisations, Galaxy hop origin, bittering/hop-creep claims, Belgium's intangible heritage, current US craft criteria and German Bock rules. Whisky work separates protected regions and categories, Scotch's strict distillation limit, voluntary Japanese standards and Canadian rules; removes fixed climate-age conversions and methanol-cut safety myths. Dilution research is bounded to its model, and cask-investment targets/returns are not presented as guarantees.
- Recipes: IBA and producer references are comparisons, not a mandate to change local recipes to fit an image. House differences, including Zombie, Planter's Punch, Hurricane, Hugo and Margarita variants, are stated in the item scope or recipe notes.

## Evidence locations

Public: `data/editorial/content-reviews.json`.

Private implementation evidence, not exposed to the website:

- `.superpowers/sdd/2026-10-12-search-completion/editorial/wine-rum-recipes-review.md`
- `.superpowers/sdd/2026-10-12-search-completion/editorial/liqueur-sparkling-review.md`
- `.superpowers/sdd/2026-10-12-search-completion/editorial/water-juice-fragment.json`
- `.superpowers/sdd/2026-10-12-search-completion/editorial/water-juice-evidence.json`
- `.superpowers/sdd/2026-10-12-search-completion/editorial/beer-whisky-fragment.json`

Sources include EU regulations, DWI, INAO, Comité Champagne, German food/health authorities, WHO, a primary BMJ digestif study, primary sensory research, the IBA and actual producer specifications. Commercial sources are used for their own products, not for general health benefits.

## Final scoped verification

- Editorial facts test: 29 passed, following meaningful failing regressions for erroneous legacy facts and keys. Beer/whiskey's separate risk tests passed 17/17; water/juice's passed 10/10.
- Final targeted Vitest selection: four files, 41 tests passed at 12:54:21 on the review date (245-item census, editorial facts, source schema, source rendering).
- Earlier targeted recipe/schema/renderer selection: ten files, 166 tests passed at 12:50:53 under the configured test projects.
- Owned ESLint and `git diff --check`: exit 0.
- TypeScript data import: all eight courses retain their intended lesson, quiz and final-exam counts; none of the 620 answer keys has an invalid index.
- Full catalog validation returned exactly 245 expected IDs and 245 matching reviews, without missing or phantom entries. Every source ID resolves.
- This implementer did not run the whole web suite, production build, data generator, server, commit or push. Integration verification is handled separately.

## Maintenance boundary

Laws, producer formulations and product labels can change. The source date makes the review traceable; it is not a promise of permanent correctness or a guarantee of health, shelf life, taste, investment performance or a professional qualification. Product-dependent guidance should follow the current label and manufacturer instructions.
