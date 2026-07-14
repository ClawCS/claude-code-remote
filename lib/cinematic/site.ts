export const MARKET = Object.freeze({
  displayName: "Trinkgut Jammers",
  legalName: "Getränkesupermarkt Jammers e.K.",
  owner: "Nikolaos Jammers",
  street: "Jurgensstraße 20",
  postalCode: "47574",
  city: "Goch",
  phoneDisplay: "02823 418707",
  phoneHref: "tel:+492823418707",
  whatsappDisplay: "+49 175 2492386",
  email: "jammers-goch@trinkgut.de",
  openingHours: "Mo–Sa 08:00–20:00 Uhr",
} as const);

export const SITE_LINKS = Object.freeze({
  whatsapp:
    "https://wa.me/491752492386?text=Hallo%20Trinkgut%20Jammers%2C%20ich%20habe%20eine%20Frage.",
  route:
    "https://www.google.com/maps/dir/?api=1&destination=Jurgensstra%C3%9Fe+20%2C+47574+Goch",
  instagram: "https://www.instagram.com/trinkgutjammers_goch/",
  nl: "/nl",
} as const);

export const CINEMATIC_NAV = Object.freeze([
  { label: "Angebote", href: "#aktuell" },
  { label: "Party & Miete", href: "#service" },
  { label: "Eigenmarken", href: "#eigenmarken" },
  { label: "Aktionen", href: "#aktionen" },
  { label: "Über uns", href: "#menschen" },
  { label: "Kontakt", href: "#kontakt" },
] as const);

export type MarketStatus = Readonly<{ isOpen: boolean; label: "Heute bis 20 Uhr" | "Heute geschlossen" }>;

const berlinClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const openDays = new Set(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);

export function getMarketStatus(now: Date): MarketStatus {
  const parts = Object.fromEntries(
    berlinClock
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const isOpen = openDays.has(parts.weekday) && minutes >= 8 * 60 && minutes < 20 * 60;
  return isOpen
    ? { isOpen: true, label: "Heute bis 20 Uhr" }
    : { isOpen: false, label: "Heute geschlossen" };
}
