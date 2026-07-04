import crypto from "crypto";

/**
 * Timing-sicherer Vergleich des Authorization: Bearer <CRON_SECRET> Headers.
 * Gibt false zurück, wenn CRON_SECRET nicht gesetzt ist (Endpoint gilt dann als
 * nicht konfiguriert) oder der Header nicht exakt passt.
 */
export function isAuthorizedBearer(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  // timingSafeEqual wirft bei unterschiedlicher Länge → vorher abfangen,
  // aber trotzdem eine Vergleichsoperation ausführen, um Timing-Leaks zu vermeiden.
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
