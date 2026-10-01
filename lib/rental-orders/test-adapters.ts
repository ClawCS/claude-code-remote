import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename, readdir } from "node:fs/promises";
import path from "node:path";
import type { RentalGatewayPayment, RentalMailMessage, RentalMailSender, RentalPaymentGateway } from "./types";

function fileId(value: string): string { return createHash("sha256").update(value).digest("hex"); }
/** Explicit local test transport. Never contacts a bank, payment provider or mail server. */
export class LocalTestGateway implements RentalPaymentGateway {
  private directory: string;
  constructor(dataDir: string) { this.directory = path.join(dataDir, "test-payments"); }
  async createPayment(input: Parameters<RentalPaymentGateway["createPayment"]>[0]): Promise<RentalGatewayPayment> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const id = `test_${fileId(input.idempotencyKey).slice(0, 32)}`;
    const payment: RentalGatewayPayment = { id, url: `${input.redirectUrl}&testpay=1`, status: "pending", orderId: input.orderId, amountCents: input.amountCents, currency: "EUR" };
    try { await writeFile(path.join(this.directory, `${id}.json`), JSON.stringify(payment), { flag: "wx", mode: 0o600 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    return this.getPayment(id);
  }
  async getPayment(id: string): Promise<RentalGatewayPayment> {
    if (!/^test_[a-f0-9]{32}$/.test(id)) throw new Error("Ungültige Testzahlung.");
    return JSON.parse(await readFile(path.join(this.directory, `${id}.json`), "utf8"));
  }
  async markPaid(id: string): Promise<void> {
    const payment = await this.getPayment(id);
    const destination = path.join(this.directory, `${id}.json`);
    const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify({ ...payment, status: "paid" }), { mode: 0o600 });
    await rename(temporary, destination);
  }
}
export function captureMailSender(dataDir: string): RentalMailSender {
  return { async send(message: RentalMailMessage) {
    const directory = path.join(dataDir, "test-mail");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const id = fileId(message.messageId);
    const captured = { ...message, capturedAt: new Date().toISOString(), attachments: message.attachments.map(file => ({ filename: file.filename, contentBase64: Buffer.from(file.content).toString("base64") })) };
    try { await writeFile(path.join(directory, `${id}.json`), JSON.stringify(captured), { flag: "wx", mode: 0o600 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    return { id };
  } };
}
export async function capturedMessages(dataDir: string): Promise<unknown[]> {
  const directory = path.join(dataDir, "test-mail");
  let files: string[];
  try { files = await readdir(directory); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  return Promise.all(files.filter(file => /^[a-f0-9]{64}\.json$/.test(file)).sort().slice(-100).map(async file => {
    const message = JSON.parse(await readFile(path.join(directory, file), "utf8"));
    return { ...message, attachments: message.attachments.map((attachment: { filename: string }) => ({ filename: attachment.filename })) };
  }));
}
