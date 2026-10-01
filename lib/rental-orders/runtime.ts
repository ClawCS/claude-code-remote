import { createHash } from "node:crypto";
import { loadRentalConfig } from "./config";
import { RentalOrderService } from "./service";
import { buildRentalMessage, createMollieGateway, createSmtpSender } from "./integrations";
import { customerToken, RentalHttpError } from "./http";
import { captureMailSender, LocalTestGateway } from "./test-adapters";
import { renderRentalDocument } from "./documents";

type Runtime = { config: ReturnType<typeof loadRentalConfig>; service: RentalOrderService; testGateway?: LocalTestGateway; statusUrl: (id: string) => string };
const runtimeGlobal = globalThis as typeof globalThis & { jammersRentalRuntimes?: Map<string, Runtime> };

export function rentalRuntime(): Runtime {
  const config = loadRentalConfig();
  if (!config.enabled) throw new RentalHttpError("Online-Bestellungen werden noch eingerichtet. Bitte kontaktiere den Markt für deine Anfrage.", 503);
  const key = createHash("sha256").update(JSON.stringify(config)).digest("hex");
  const cache = runtimeGlobal.jammersRentalRuntimes ??= new Map();
  const existing = cache.get(key);
  if (existing) return existing;
  const statusUrl = (id: string) => `${config.publicOrigin}/mietbestellung/${encodeURIComponent(id)}?token=${customerToken(id, config.sessionSecret)}`;
  const testGateway = config.mode === "test" ? new LocalTestGateway(config.dataDir) : undefined;
  const gateway = testGateway ?? (config.onlinePayment && config.mollieApiKey ? createMollieGateway(config.mollieApiKey) : undefined);
  const sender = config.mode === "test" ? captureMailSender(config.dataDir) : createSmtpSender(config.smtp!);
  const service = new RentalOrderService(config, { gateway, sender, buildMessage: buildRentalMessage, statusUrl,
    preflightDocument: async order => {
      // Validate renderability before contract acceptance; this preview is never stored or sent.
      await renderRentalDocument({ ...order, status: "accepted", invoice: { number: "PRUEFUNG", issuedAt: new Date().toISOString() } }, "invoice");
    },
  });
  const runtime = { config, service, testGateway, statusUrl };
  cache.set(key, runtime);
  return runtime;
}
