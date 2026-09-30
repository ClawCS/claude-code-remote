import type { HomepageFlyer } from "./homepage-content";

export type PublishedFlyer = HomepageFlyer & {language: "de" | "nl"};
const fields = ["id","title","validFrom","validTo","viewerUrl","pdfUrl","coverUrl","pageCount","sourceUrl"] as const;

export function comparePublishedFlyers(expected: readonly PublishedFlyer[], actual: unknown, home: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(actual)) return ["Veröffentlichter Flyerindex ist keine Liste."];
  if (actual.length !== expected.length) errors.push("Die Anzahl der veröffentlichten Flyer weicht vom geprüften Paket ab.");
  for (const item of expected) {
    const matches = actual.filter((entry) => entry?.id === item.id);
    if (matches.length !== 1 || [...fields,"language"].some(key => matches[0]?.[key] !== item[key as keyof PublishedFlyer])) errors.push(`Veröffentlichter Flyer stimmt nicht mit dem geprüften Paket überein: ${item.id}`);
  }
  const expectedHome = expected.find(item => item.language === "de");
  if (expectedHome ? !home || typeof home !== "object" || fields.some(key => (home as Record<string,unknown>)[key] !== expectedHome[key]) : home !== null) errors.push("Die Homepage zeigt nicht den geprüften deutschen Handzettel.");
  return errors;
}

function isPrivateHost(host: string): boolean {
  return /^(?:localhost|.*\.localhost|127\..*|0\.0\.0\.0|\[?::1\]?|\[?fc[0-9a-f:]+\]?|\[?fd[0-9a-f:]+\]?|\[?fe80:[0-9a-f:]+\]?)$|\.(?:local|internal)$/.test(host) || /^(?:10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host);
}

export function isProductionOrigin(value: string, configuredUrl: string | null): boolean {
  if (!configuredUrl) return false;
  try {
    const actual = new URL(value), configured = new URL(configuredUrl);
    return actual.protocol === "https:" && configured.protocol === "https:" && !actual.username && !actual.password && !configured.username && !configured.password && !isPrivateHost(actual.hostname) && actual.origin === configured.origin;
  } catch { return false; }
}

export function parseContentArguments(args: readonly string[], defaultNow = new Date()) {
  let prepare: boolean | undefined;
  let now = defaultNow;
  let week: string | undefined;
  let url: string | undefined;
  const seen = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (seen.has(key)) throw new Error(`Doppelte Option: ${key}`);
    seen.add(key);
    if (key === "--prepare" || key === "--check") {
      if (prepare !== undefined) throw new Error("Genau einen Modus wählen: --prepare oder --check.");
      prepare = key === "--prepare";
      continue;
    }
    if (!["--now","--week","--url"].includes(key)) throw new Error(`Unbekannte Option: ${key}`);
    const value = args[++i];
    if (!value || value.startsWith("--")) throw new Error(`Wert fehlt: ${key}`);
    if (key === "--now") {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(new Date(value).valueOf())) throw new Error("--now erwartet ISO-Zeit mit expliziter Zeitzone.");
      now = new Date(value);
    } else if (key === "--week") {
      const date = new Date(`${value}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.valueOf()) || date.toISOString().slice(0,10) !== value || date.getUTCDay() !== 1) throw new Error("--week erwartet ein gültiges Montagsdatum (YYYY-MM-DD).");
      week = value;
    } else {
      const parsed = new URL(value);
      if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("--url erwartet eine HTTP(S)-Origin ohne Zugangsdaten.");
      url = parsed.origin;
    }
  }
  if (prepare === undefined) throw new Error("Modus fehlt: --prepare oder --check.");
  return {prepare, now, week, url};
}
