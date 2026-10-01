import { rentalRuntime } from "../lib/rental-orders/runtime";
async function main() {
  try {
    const { service } = rentalRuntime();
    try {
      const result = await service.dispatchOutbox(50);
      const remaining = service.outbox().filter(job => job.state !== "sent").length;
      console.log(JSON.stringify({ sent: result.sent, failed: result.failed, pending: remaining }));
      if (result.failed) process.exitCode = 1;
    } finally { service.close(); }
  } catch {
    console.error("Mietversand nicht ausgeführt. Private Konfiguration und Marktansicht prüfen.");
    process.exitCode = 1;
  }
}
void main();
