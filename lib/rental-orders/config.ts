import type { RentalIssuer, RentalPublicConfig } from "./types";
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import { isAbsolute, parse, resolve, sep } from "node:path";
import { homedir, tmpdir } from "node:os";

export type RentalRuntimeConfig = {
  mode: "disabled" | "test" | "live"; enabled: boolean; issues: string[];
  dataDir: string; publicOrigin: string; adminSecret: string; sessionSecret: string;
  trustedProxy?: "single-proxy-x-real-ip";
  mollieApiKey?: string;
  smtp?: { host: string; port: number; secure: boolean; user: string; pass: string; from: string };
  marketEmail: string; issuer: RentalIssuer; termsVersion: string; termsText: string;
  privacyText: string; onlinePayment: boolean;
};
const email = /^[^\s@<>,;:"\\\[\]()]+@[^\s@<>,;:"\\\[\]()]+\.[^\s@<>,;:"\\\[\]()]+$/;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const loopback = (hostname: string) => ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

/** Keep database, WAL and customer documents away from static assets and application symlinks. */
export function rentalStorageIssue(dataDir: string): string | undefined {
  if (!isAbsolute(dataDir)) return "RENTAL_DATA_DIR muss ein absoluter privater, dauerhafter Speicherpfad sein.";
  const path = resolve(dataDir);
  // cwd() is already absolute; this is a string comparison, not a bundled asset dependency.
  if ([parse(path).root, "/tmp", "/var", "/private/tmp", "/private/var", "/home", "/Users", "/srv", "/var/lib", resolve(homedir()), resolve(tmpdir()), process.cwd()].includes(path)) return "Bitte ein eigenes privates Verzeichnis nur für Mietdaten angeben.";
  const parts = path.slice(parse(path).root.length).split(sep);
  if (parts.some(part => ["public", ".next", ".git"].includes(part.toLowerCase()))) return "Mietdaten dürfen nicht in öffentlichen Assets oder Build-Verzeichnissen liegen.";
  let current = parse(path).root;
  for (const part of parts) {
    current = resolve(current, part);
    try {
      const info = lstatSync(current);
      if (info.isSymbolicLink()) {
        // macOS supplies these fixed system aliases; application-created links remain prohibited.
        const systemAlias = process.platform === "darwin" && ((current === "/var" && readlinkSync(current) === "private/var") || (current === "/tmp" && readlinkSync(current) === "private/tmp"));
        if (!systemAlias) return "Der private Mietdatenpfad darf keine symbolischen Links enthalten.";
      } else if (!info.isDirectory()) return "Der private Mietdatenpfad muss ein Verzeichnis sein.";
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      return "Der private Mietdatenpfad konnte nicht geprüft werden.";
    }
  }
}

/** Missing or invalid settings disable ordering; diagnostics never contain supplied secret values. */
export function loadRentalConfig(env: Record<string, string | undefined> = process.env): RentalRuntimeConfig {
  const mode = env.RENTAL_MODE === "test" || env.RENTAL_MODE === "live" ? env.RENTAL_MODE : "disabled";
  const issues: string[] = [];
  const config: RentalRuntimeConfig = {
    mode, enabled: false, issues, dataDir: text(env.RENTAL_DATA_DIR), publicOrigin: "",
    adminSecret: text(env.RENTAL_ADMIN_SECRET), sessionSecret: text(env.RENTAL_SESSION_SECRET),
    marketEmail: "", issuer: { name: "", address: [], taxNumber: "", vatRateBps: NaN, invoicePrefix: "" },
    termsVersion: "", termsText: "", privacyText: "", onlinePayment: false,
  };
  if (mode === "disabled") return config;
  const storageIssue = rentalStorageIssue(config.dataDir); if (storageIssue) issues.push(storageIssue);
  if (mode === "test") {
    Object.assign(config, {
      publicOrigin: text(env.RENTAL_PUBLIC_ORIGIN) || "http://localhost:3000",
      adminSecret: config.adminSecret || "TEST-ONLY-local-admin-secret-not-for-live",
      sessionSecret: config.sessionSecret || "TEST-ONLY-local-session-secret-not-for-live",
      marketEmail: "market@example.invalid", onlinePayment: true,
      issuer: { name: "TESTBETRIEB – keine echte Rechnung", address: ["Teststraße 1", "00000 Testort"], taxNumber: "TEST-KEINE-STEUERNUMMER", vatRateBps: 1900, invoicePrefix: "TEST" },
      termsVersion: "test-v1", termsText: "TESTMODUS: Nur Selbstabholung. Keine zusätzlichen Vorauszahlungen. Kein echter Vertrag, keine echte Zahlung.",
      privacyText: "TESTMODUS: Nur erfundene Kundendaten eingeben. E-Mails werden lokal aufgezeichnet und nicht versendet.",
    });
    try { const url = new URL(config.publicOrigin); if (!loopback(url.hostname) || !["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) issues.push("Testmodus ist nur auf einem gültigen Loopback-Ursprung zulässig."); else config.publicOrigin = url.origin; }
    catch { issues.push("Ungültiger Test-Ursprung."); }
  } else {
    // Operator attestation: the app is reachable only through one trusted proxy
    // which overwrites X-Real-IP with the connecting client's IP, never appends it.
    // Do not set this until the actual ingress boundary has been verified.
    if (env.RENTAL_TRUSTED_PROXY === "single-proxy-x-real-ip") config.trustedProxy = "single-proxy-x-real-ip";
    else issues.push("RENTAL_TRUSTED_PROXY erfordert einen geprüften einzelnen Proxy mit überschriebenem X-Real-IP und gesperrtem Direktzugriff.");
    let settings: Record<string, unknown> = {};
    try {
      if (!env.RENTAL_SETTINGS_FILE || !isAbsolute(env.RENTAL_SETTINGS_FILE)) throw new Error();
      const info = lstatSync(env.RENTAL_SETTINGS_FILE);
      if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o077) !== 0 || info.size > 128_000) throw new Error();
      const parsed: unknown = JSON.parse(readFileSync(env.RENTAL_SETTINGS_FILE, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      settings = parsed as Record<string, unknown>;
    } catch { issues.push("Private RENTAL_SETTINGS_FILE fehlt oder ist ungültig (Dateirechte 0600)."); }
    const issuer = settings.issuer && typeof settings.issuer === "object" ? settings.issuer as Record<string, unknown> : {};
    config.issuer = { name: text(issuer.name), address: Array.isArray(issuer.address) ? issuer.address.map(text).filter(Boolean) : [], taxNumber: text(issuer.taxNumber), vatRateBps: typeof issuer.vatRateBps === "number" ? issuer.vatRateBps : NaN, invoicePrefix: text(issuer.invoicePrefix) };
    if (!config.issuer.name || !config.issuer.address.length || !config.issuer.taxNumber || !Number.isInteger(config.issuer.vatRateBps) || config.issuer.vatRateBps < 0 || config.issuer.vatRateBps > 10000 || !/^[A-Za-z0-9-]{1,24}$/.test(config.issuer.invoicePrefix) || /^TEST/i.test(config.issuer.invoicePrefix)) issues.push("Vollständige bestätigte Aussteller-, Steuer- und Rechnungsnummernangaben erforderlich.");
    config.termsVersion = text(settings.termsVersion); config.termsText = text(settings.termsText); config.privacyText = text(settings.privacyText);
    if (!config.termsVersion || !config.termsText || !config.privacyText) issues.push("Freigegebene Mietbedingungen, Version und Datenschutzhinweis erforderlich.");
    if (settings.selfPickupOnly !== true || settings.noExtraUpfrontCharges !== true) issues.push("Selbstabholung ohne zusätzliche Vorauszahlungen muss ausdrücklich bestätigt sein; unbekannte Kautionen oder Gebühren verhindern die Aktivierung.");
    config.marketEmail = text(settings.marketEmail);
    if (config.marketEmail.length > 254 || !email.test(config.marketEmail)) issues.push("Gültiges Marktpostfach erforderlich.");
    config.publicOrigin = text(settings.publicOrigin);
    try { const url = new URL(config.publicOrigin); if (url.protocol !== "https:" || loopback(url.hostname) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error(); config.publicOrigin = url.origin; }
    catch { issues.push("Öffentlicher HTTPS-Ursprung erforderlich."); }
    if (config.adminSecret.length < 32 || config.sessionSecret.length < 32 || config.adminSecret === config.sessionSecret || /TEST-ONLY/i.test(config.adminSecret) || /TEST-ONLY/i.test(config.sessionSecret)) issues.push("Unterschiedliche private Admin- und Sitzungsschlüssel mit mindestens 32 Zeichen erforderlich; öffentliche Testschlüssel sind unzulässig.");
    config.smtp = { host: text(env.SMTP_HOST), port: Number(env.SMTP_PORT), secure: env.SMTP_SECURE === "true", user: text(env.SMTP_USER), pass: env.SMTP_PASS || "", from: text(env.SMTP_FROM) };
    if (!config.smtp.host || config.smtp.host.length > 253 || !/^[A-Za-z0-9.:[\]-]+$/.test(config.smtp.host) || !Number.isInteger(config.smtp.port) || config.smtp.port < 1 || config.smtp.port > 65535 || !["true", "false"].includes(env.SMTP_SECURE || "") || !config.smtp.user || !config.smtp.pass || /[\u0000-\u001f\u007f]/.test(config.smtp.user + config.smtp.pass) || config.smtp.from.length > 254 || !email.test(config.smtp.from)) issues.push("Vollständige gültige SMTP-Konfiguration einschließlich Absender erforderlich.");
    config.onlinePayment = settings.onlinePayment === true;
    if (config.onlinePayment) {
      config.mollieApiKey = text(env.MOLLIE_API_KEY);
      if (!/^live_[A-Za-z0-9_-]{7,200}$/.test(config.mollieApiKey)) issues.push("Gültiger Live-Zahlungsschlüssel für Onlinezahlung erforderlich.");
    }
  }
  config.enabled = issues.length === 0;
  return config;
}
export function publicRentalConfig(config: RentalRuntimeConfig): RentalPublicConfig {
  return { enabled: config.enabled, testMode: config.mode === "test", onlinePayment: config.enabled && config.onlinePayment,
    termsVersion: config.enabled ? config.termsVersion : "", termsText: config.enabled ? config.termsText : "", privacyText: config.enabled ? config.privacyText : "",
    message: !config.enabled ? "Online-Bestellungen sind noch nicht freigeschaltet. Bitte stellen Sie eine unverbindliche Anfrage." : config.mode === "test" ? "TESTMODUS – keine echte Bestellung, Zahlung oder E-Mail." : "Die Bestellung wird erst mit der ausdrücklichen Annahme durch den Markt verbindlich. Selbstabholung ohne zusätzliche Vorauszahlungen.",
  };
}
