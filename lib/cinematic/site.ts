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
  whatsappNumber: "491752492386",
  email: "jammers-goch@trinkgut.de",
  openingHours: "Mo–Sa 08:00–20:00 Uhr",
  openingHoursNote: "Sonn- und Feiertage geschlossen",
} as const);

export const SITE_LINKS = Object.freeze({
  whatsapp:
    "https://wa.me/491752492386?text=Hallo%20Trinkgut%20Jammers%2C%20ich%20habe%20eine%20Frage.",
  whatsappNl:
    "https://wa.me/491752492386?text=Hallo%20Trinkgut%20Jammers%2C%20ik%20heb%20een%20vraag.",
  // Include the business name: the previous abbreviated address resolved to another business.
  route: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${MARKET.displayName}, ${MARKET.street}, ${MARKET.postalCode} ${MARKET.city}, Deutschland`,
  )}`,
  grailbid: "https://grailbid.com",
  instagram: "https://www.instagram.com/trinkgutjammers_goch/",
  nl: "/nl",
} as const);

export type NavLink = Readonly<{ label: string; href: string }>;
export type NavItem = NavLink | Readonly<{ label: string; children: readonly NavLink[] }>;

export const CINEMATIC_NAV: readonly NavItem[] = Object.freeze([
  { label: "Angebote", href: "/angebote" },
  { label: "Sortiment", href: "/produkte" },
  { label: "Rezepte & Wissen", children: [
    { label: "Cocktail-Rezepte", href: "/cocktails" },
    { label: "Getränkeakademie", href: "/akademie" },
  ] },
  { label: "Party & Miete", href: "/vermietung" },
  { label: "Eigenmarken", href: "/eigenmarke" },
  { label: "Gewinnspiele", href: "/gewinnspiel" },
  { label: "Team & Karriere", children: [
    { label: "Unser Team", href: "/galerie" },
    { label: "Offene Stellen & Bewerbung", href: "/bewerbung" },
  ] },
  { label: "TCG", href: "https://grailbid.com" },
  { label: "Kontakt", href: "/kontakt" },
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

const berlinDate = new Intl.DateTimeFormat("en-CA", {timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit"});

/** NRW statutory holidays, including Easter-relative dates (Feiertagsgesetz NRW §2). */
function isPublicHoliday(day: string): boolean {
  if (["01-01", "05-01", "10-03", "11-01", "12-25", "12-26"].includes(day.slice(5))) return true;
  const year = Number(day.slice(0, 4));
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), date = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = Date.UTC(year, month - 1, date);
  return [-2, 1, 39, 50, 60].some(offset => new Date(easter + offset * 86_400_000).toISOString().slice(0, 10) === day);
}

export function getMarketStatus(now: Date): MarketStatus {
  const parts = Object.fromEntries(
    berlinClock
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const isOpen = openDays.has(parts.weekday) && !isPublicHoliday(berlinDate.format(now)) && minutes >= 8 * 60 && minutes < 20 * 60;
  return isOpen
    ? { isOpen: true, label: "Heute bis 20 Uhr" }
    : { isOpen: false, label: "Heute geschlossen" };
}
