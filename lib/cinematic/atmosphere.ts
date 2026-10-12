/** Presentation only. No catalog, offer, account or provider dependencies. */
export type AtmosphereTheme =
  | "neutral" | "offers" | "beer" | "fresh" | "wine" | "spirits"
  | "party" | "learning" | "people" | "nl";

// Exact paths deliberately do not style unknown descendants or protected routes.
// Dynamic public templates can opt into PageIntro's explicit theme prop.
const routeThemes: Readonly<Record<string, AtmosphereTheme>> = Object.freeze({
  "/angebote": "offers",
  "/handzettel": "offers",
  "/produkte": "offers",
  "/kategorie/bier": "beer",
  "/kategorie/alkoholfrei": "fresh",
  "/kategorie/wein": "wine",
  "/kategorie/sekt": "wine",
  "/kategorie/spirituosen": "spirits",
  "/eigenmarke": "spirits",
  "/regionale-spirituosen": "spirits",
  "/vermietung": "party",
  "/partyplaner": "party",
  "/partyspiele": "party",
  "/cocktails": "learning",
  "/akademie": "learning",
  "/akademie/zertifikate": "learning",
  "/marktleben": "people",
  "/galerie": "people",
  "/karriere": "people",
  "/nl": "nl",
});

export function getAtmosphereTheme(pathname: string): AtmosphereTheme {
  return Object.hasOwn(routeThemes, pathname) ? routeThemes[pathname] : "neutral";
}
