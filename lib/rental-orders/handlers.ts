import { loadRentalConfig, publicRentalConfig, type RentalRuntimeConfig } from "./config";
import { RentalOrderError } from "./service";
import { quoteRentals, type RentalSelection } from "@/lib/rental-pricing";
import { renderRentalDocument } from "./documents";
import { rentalRuntime } from "./runtime";
import { capturedMessages } from "./test-adapters";
import { ADMIN_COOKIE, RentalHttpError, adminSession, assertSameOrigin, cookieValue, credentialMatches, isLoopbackOrigin, privateJson, rateLimit, readBoundedJson, validAdminSession, validCustomerToken } from "./http";
import type { RentalSubmitInput } from "./types";

function guardRuntime(request: Request, config: RentalRuntimeConfig): void {
  if (config.mode === "test" && (!isLoopbackOrigin(request.url) || !isLoopbackOrigin(config.publicOrigin))) throw new RentalHttpError("Testbetrieb ist nur lokal erreichbar.", 403);
}
/** Reject inadmissible requests before constructing the durable store or transports. */
function admissionConfig(request: Request): RentalRuntimeConfig {
  const config = loadRentalConfig();
  if (!config.enabled) throw new RentalHttpError("Online-Bestellungen werden noch eingerichtet. Bitte kontaktiere den Markt für deine Anfrage.", 503);
  guardRuntime(request, config);
  return config;
}
function requireAdmin(request: Request, config: RentalRuntimeConfig): void {
  guardRuntime(request, config);
  if (!validAdminSession(cookieValue(request, ADMIN_COOKIE), config.sessionSecret)) throw new RentalHttpError("Bitte im Marktbereich anmelden.", 401);
}
function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RentalHttpError("Ungültige Anfrage.");
  return value as Record<string, unknown>;
}
async function guarded(run: () => Promise<Response> | Response): Promise<Response> {
  try { return await run(); }
  catch (error) {
    if (error instanceof RentalHttpError || error instanceof RentalOrderError) {
      const response = privateJson({ error: error.message }, error.status);
      if (error instanceof RentalHttpError && error.retryAfterSeconds) response.headers.set("Retry-After", String(error.retryAfterSeconds));
      return response;
    }
    return privateJson({ error: "Die Aktion konnte nicht abgeschlossen werden. Bitte erneut versuchen oder den Markt kontaktieren." }, 500);
  }
}
function publicOrderAccess(request: Request, id: string, config: RentalRuntimeConfig): void {
  guardRuntime(request, config);
  const token = new URL(request.url).searchParams.get("token");
  if (!validCustomerToken(id, token, config.sessionSecret)) throw new RentalHttpError("Dieser Bestelllink ist nicht gültig.", 404);
}
async function sendPending(service: ReturnType<typeof rentalRuntime>["service"]): Promise<void> {
  try { await service.dispatchOutbox(6); } catch { /* The durable queue remains visible to the market for retries. */ }
}
export const rentalConfigHandler = (request: Request) => guarded(() => {
  const config = loadRentalConfig(); guardRuntime(request, config);
  return privateJson(publicRentalConfig(config));
});
export const rentalQuoteHandler = (request: Request) => guarded(async () => {
  const config = loadRentalConfig(); guardRuntime(request, config);
  assertSameOrigin(request, config.publicOrigin || new URL(request.url).origin);
  const body = objectBody(await readBoundedJson(request));
  try { return privateJson({ quote: quoteRentals(body.items as RentalSelection[]) }); }
  catch (error) { throw new RentalHttpError(error instanceof Error ? error.message : "Bitte die Auswahl prüfen."); }
});
export const rentalSubmitHandler = (request: Request) => guarded(async () => {
  const admission = admissionConfig(request); assertSameOrigin(request, admission.publicOrigin);
  rateLimit(request, "rental-submit", admission);
  const body = objectBody(await readBoundedJson(request));
  const nonce = request.headers.get("idempotency-key") || "";
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(nonce)) throw new RentalHttpError("Bitte die Bestellseite erneut öffnen.");
  const { config, service, statusUrl } = rentalRuntime(); guardRuntime(request, config); assertSameOrigin(request, config.publicOrigin);
  const order = await service.submit(body as unknown as RentalSubmitInput, nonce);
  await sendPending(service);
  return privateJson({ order, statusUrl: statusUrl(order.id) }, 201);
});
export const rentalStatusHandler = (request: Request, id: string) => guarded(() => {
  publicOrderAccess(request, id, admissionConfig(request));
  const { config, service } = rentalRuntime(); publicOrderAccess(request, id, config);
  const order = service.get(id); if (!order) throw new RentalHttpError("Bestellung nicht gefunden.", 404);
  return privateJson({ order });
});
export const rentalDocumentHandler = (request: Request, id: string, kind: string, admin = false) => guarded(async () => {
  const admission = admissionConfig(request);
  if (admin) requireAdmin(request, admission); else publicOrderAccess(request, id, admission);
  if (kind !== "invoice" && kind !== "delivery_note") throw new RentalHttpError("Beleg nicht gefunden.", 404);
  const { config, service } = rentalRuntime();
  if (admin) requireAdmin(request, config); else publicOrderAccess(request, id, config);
  const order = service.get(id); if (!order || (kind === "invoice" ? !order.invoice : !order.deliveryNote)) throw new RentalHttpError("Der Beleg ist noch nicht verfügbar.", 404);
  const bytes = await renderRentalDocument(order, kind);
  const number = kind === "invoice" ? order.invoice!.number : order.deliveryNote!.number;
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${number.replace(/[^A-Za-z0-9_-]/g, "-")}.pdf"`, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" } });
});
export const rentalLoginHandler = (request: Request) => guarded(async () => {
  const config = loadRentalConfig(); guardRuntime(request, config);
  if (!config.enabled) throw new RentalHttpError("Die Marktverwaltung ist noch nicht eingerichtet.", 503);
  assertSameOrigin(request, config.publicOrigin); rateLimit(request, "rental-login", config);
  const body = objectBody(await readBoundedJson(request, 2048));
  if (!credentialMatches(body.password, config.adminSecret)) throw new RentalHttpError("Der Markt-Zugang ist nicht korrekt.", 401);
  const response = privateJson({ ok: true });
  response.headers.set("Set-Cookie", `${ADMIN_COOKIE}=${adminSession(config.sessionSecret)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=21600${config.publicOrigin.startsWith("https:") ? "; Secure" : ""}`);
  return response;
});
export const rentalLogoutHandler = (request: Request) => guarded(() => {
  const config = loadRentalConfig(); guardRuntime(request, config); assertSameOrigin(request, config.publicOrigin);
  const response = privateJson({ ok: true }); response.headers.set("Set-Cookie", `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${config.publicOrigin.startsWith("https:") ? "; Secure" : ""}`); return response;
});
export const rentalAdminListHandler = (request: Request) => guarded(() => {
  requireAdmin(request, admissionConfig(request));
  const { config, service } = rentalRuntime(); requireAdmin(request, config);
  return privateJson({ orders: service.list(), jobs: service.outbox(), testMode: config.mode === "test" });
});
export const rentalAdminActionHandler = (request: Request, id: string) => guarded(async () => {
  const admission = admissionConfig(request); requireAdmin(request, admission); assertSameOrigin(request, admission.publicOrigin);
  const body = objectBody(await readBoundedJson(request, 2048));
  if (!Number.isSafeInteger(body.version)) throw new RentalHttpError("Bitte die Bestellansicht aktualisieren.");
  const version = body.version as number;
  const { config, service } = rentalRuntime(); requireAdmin(request, config); assertSameOrigin(request, config.publicOrigin);
  switch (body.action) {
    case "accept": await service.accept(id, version); break;
    case "decline": await service.decline(id, version); break;
    case "cash": await service.recordCash(id, version); break;
    case "handover": await service.handover(id, version); break;
    case "return": await service.returned(id, version); break;
    case "retry_payment": await service.retryPayment(id); break;
    case "sync_payment": { const order = service.get(id); if (!order?.payment.id) throw new RentalHttpError("Noch keine Onlinezahlung angelegt."); await service.syncPayment(order.payment.id); break; }
    default: throw new RentalHttpError("Unbekannte Aktion.");
  }
  await sendPending(service);
  return privateJson({ order: service.get(id), jobs: service.outbox(id) });
});
export const rentalOutboxHandler = (request: Request) => guarded(async () => {
  const admission = admissionConfig(request); requireAdmin(request, admission); assertSameOrigin(request, admission.publicOrigin);
  const { config, service } = rentalRuntime(); requireAdmin(request, config); assertSameOrigin(request, config.publicOrigin);
  await service.dispatchOutbox(20); return privateJson({ jobs: service.outbox() });
});
export const rentalTestMailsHandler = (request: Request) => guarded(async () => {
  const admission = admissionConfig(request); requireAdmin(request, admission);
  if (admission.mode !== "test") throw new RentalHttpError("Nicht verfügbar.", 404);
  const { config } = rentalRuntime(); requireAdmin(request, config);
  if (config.mode !== "test") throw new RentalHttpError("Nicht verfügbar.", 404);
  return privateJson({ messages: await capturedMessages(config.dataDir) });
});
export const rentalTestPayHandler = (request: Request, id: string) => guarded(async () => {
  const admission = admissionConfig(request); publicOrderAccess(request, id, admission); assertSameOrigin(request, admission.publicOrigin);
  if (admission.mode !== "test") throw new RentalHttpError("Nicht verfügbar.", 404);
  const { config, service, testGateway } = rentalRuntime(); publicOrderAccess(request, id, config); assertSameOrigin(request, config.publicOrigin);
  if (config.mode !== "test" || !testGateway) throw new RentalHttpError("Nicht verfügbar.", 404);
  const order = service.get(id);
  if (!order || order.status !== "accepted" || !order.payment.id || order.paymentMethod !== "online") throw new RentalHttpError("Die Testzahlung ist noch nicht verfügbar.", 409);
  await testGateway.markPaid(order.payment.id); await service.syncPayment(order.payment.id); await sendPending(service);
  return privateJson({ order: service.get(id) });
});
export const rentalWebhookHandler = (request: Request) => guarded(async () => {
  const admission = admissionConfig(request);
  if (admission.mode !== "live") throw new RentalHttpError("Nicht verfügbar.", 404);
  rateLimit(request, "rental-webhook", admission);
  if (Number(request.headers.get("content-length")) > 2048) throw new RentalHttpError("Ungültige Meldung.", 413);
  const reader = request.body?.getReader(); if (!reader) throw new RentalHttpError("Ungültige Meldung.");
  let text = ""; let length = 0; const decoder = new TextDecoder();
  for (;;) { const result = await reader.read(); if (result.done) break; length += result.value.byteLength; if (length > 2048) { await reader.cancel(); throw new RentalHttpError("Ungültige Meldung.", 413); } text += decoder.decode(result.value, { stream: true }); }
  text += decoder.decode(); const id = new URLSearchParams(text).get("id");
  if (!id || !/^tr_[A-Za-z0-9]{4,100}$/.test(id)) throw new RentalHttpError("Ungültige Meldung.");
  const { config, service } = rentalRuntime(); guardRuntime(request, config);
  if (config.mode !== "live") throw new RentalHttpError("Nicht verfügbar.", 404);
  try { await service.syncPayment(id); await sendPending(service); }
  catch (error) { if (!(error instanceof RentalOrderError && error.status === 404)) throw error; }
  return privateJson({ received: true });
});
