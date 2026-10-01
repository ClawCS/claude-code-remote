import { DatabaseSync } from "node:sqlite";
import { chmodSync, closeSync, existsSync, lstatSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { RentalMailEvent, RentalOrder, RentalOutboxJob, RentalPaymentStatus } from "./types";
import { rentalStorageIssue } from "./config";

type OutboxRow = { id: string; order_id: string; event: RentalMailEvent; recipient: "customer" | "market"; state: RentalOutboxJob["state"]; attempts: number; created_at: string; next_attempt_at: string; lease_until: string | null; lease_token: string | null; sent_at: string | null; error: string | null; snapshot: string };
export type ClaimedRentalMail = { job: RentalOutboxJob; snapshot: RentalOrder; token: string };
export type RentalPaymentRecord = { id: string; orderId: string; attempt: number; status: RentalPaymentStatus };

/** Single-host durable store. No external I/O is performed inside a write transaction. */
export class RentalOrderStore {
  private readonly db: DatabaseSync;

  constructor(dataDir: string, mode: "test" | "live") {
    const storageIssue = rentalStorageIssue(dataDir); if (storageIssue) throw new Error(storageIssue);
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const info = lstatSync(dataDir);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Ungültiger privater Speicherpfad.");
    chmodSync(dataDir, 0o700);
    const path = join(dataDir, "rental-orders.sqlite");
    if (!existsSync(path)) closeSync(openSync(path, "wx", 0o600));
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error("Ungültige Datenbankdatei.");
    chmodSync(path, 0o600);
    this.db = new DatabaseSync(path);
    try {
      this.db.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, nonce TEXT NOT NULL UNIQUE,
        request_hash TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS runtime_metadata (name TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payment_work (
        order_id TEXT PRIMARY KEY REFERENCES orders(id), attempt INTEGER NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE, lease_until TEXT, lease_token TEXT
      );
      CREATE TABLE IF NOT EXISTS payment_records (
        id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
        attempt INTEGER NOT NULL, status TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
        event TEXT NOT NULL, recipient TEXT NOT NULL, state TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, next_attempt_at TEXT NOT NULL,
        lease_until TEXT, lease_token TEXT, sent_at TEXT, error TEXT, snapshot TEXT NOT NULL,
        UNIQUE(order_id, event, recipient)
      );
      CREATE INDEX IF NOT EXISTS outbox_ready ON outbox(state, next_attempt_at);
      `);
      this.transaction(() => {
        const existing = this.db.prepare("SELECT value FROM runtime_metadata WHERE name='mode'").get() as { value: string } | undefined;
        if ((existing && existing.value !== mode) || this.list().some(order => order.testMode !== (mode === "test"))) throw new Error("Die Betriebsart der Datenbank darf nicht zwischen Test und Live wechseln.");
        this.db.prepare("INSERT OR IGNORE INTO runtime_metadata(name,value) VALUES('mode',?)").run(mode);
        for (const order of this.list()) if (order.payment.id) this.recordPayment({ id: order.payment.id, orderId: order.id, attempt: order.payment.attempt, status: order.payment.status });
      });
    } catch (error) { this.db.close(); throw error; }
  }

  close(): void { this.db.close(); }

  transaction<T>(operation: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try { const result = operation(); this.db.exec("COMMIT"); return result; }
    catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  get(id: string): RentalOrder | undefined {
    const row = this.db.prepare("SELECT payload FROM orders WHERE id = ?").get(id) as { payload: string } | undefined;
    return row ? JSON.parse(row.payload) as RentalOrder : undefined;
  }

  byNonce(nonce: string): { hash: string; order: RentalOrder } | undefined {
    const row = this.db.prepare("SELECT payload, request_hash FROM orders WHERE nonce = ?").get(nonce) as { payload: string; request_hash: string } | undefined;
    return row ? { hash: row.request_hash, order: JSON.parse(row.payload) } : undefined;
  }

  list(): RentalOrder[] {
    return (this.db.prepare("SELECT payload FROM orders ORDER BY rowid DESC").all() as { payload: string }[]).map(row => JSON.parse(row.payload) as RentalOrder);
  }

  insert(order: RentalOrder, nonce: string, hash: string): void {
    this.db.prepare("INSERT INTO orders(id,number,nonce,request_hash,version,payload) VALUES(?,?,?,?,?,?)").run(order.id, order.number, nonce, hash, order.version, JSON.stringify(order));
  }

  save(order: RentalOrder): void {
    const result = this.db.prepare("UPDATE orders SET payload=?, version=? WHERE id=? AND version=?").run(JSON.stringify(order), order.version, order.id, order.version - 1);
    if (result.changes !== 1) throw new Error("Bestellung wurde zwischenzeitlich geändert.");
  }

  nextNumber(prefix: string, year: string): string {
    const key = `${prefix}-${year}`;
    this.db.prepare("INSERT INTO counters(name,value) VALUES(?,1) ON CONFLICT(name) DO UPDATE SET value=value+1").run(key);
    const row = this.db.prepare("SELECT value FROM counters WHERE name=?").get(key) as { value: number };
    return `${key}-${String(row.value).padStart(6, "0")}`;
  }

  queue(order: RentalOrder, event: RentalMailEvent): void {
    for (const recipient of ["customer", "market"] as const) {
      this.db.prepare("INSERT OR IGNORE INTO outbox(id,order_id,event,recipient,state,created_at,next_attempt_at,snapshot) VALUES(?,?,?,?,?,?,?,?)")
        .run(randomUUID(), order.id, event, recipient, "pending", order.updatedAt, order.updatedAt, JSON.stringify(order));
    }
  }

  outbox(orderId?: string): RentalOutboxJob[] {
    const rows = orderId ? this.db.prepare("SELECT * FROM outbox WHERE order_id=? ORDER BY rowid").all(orderId) : this.db.prepare("SELECT * FROM outbox ORDER BY rowid").all();
    return (rows as OutboxRow[]).map(this.mapJob);
  }

  private mapJob(row: OutboxRow): RentalOutboxJob {
    return { id: row.id, orderId: row.order_id, event: row.event, recipient: row.recipient, state: row.state, attempts: row.attempts, createdAt: row.created_at, nextAttemptAt: row.next_attempt_at,
      ...(row.lease_until ? { leaseUntil: row.lease_until } : {}), ...(row.sent_at ? { sentAt: row.sent_at } : {}), ...(row.error ? { error: row.error } : {}) };
  }

  claimMail(now: string, leaseUntil: string): ClaimedRentalMail | undefined {
    return this.transaction(() => {
      const row = this.db.prepare("SELECT * FROM outbox WHERE (state='pending' AND next_attempt_at<=?) OR (state='sending' AND lease_until<=?) ORDER BY rowid LIMIT 1").get(now, now) as OutboxRow | undefined;
      if (!row) return;
      const token = randomUUID();
      const error = row.state === "sending" ? "Vorheriger Versandausgang unklar; Wiederholung mit derselben Nachrichten-ID." : row.error;
      this.db.prepare("UPDATE outbox SET state='sending', attempts=attempts+1, lease_until=?, lease_token=?, error=? WHERE id=?").run(leaseUntil, token, error, row.id);
      return { job: this.mapJob({ ...row, state: "sending", attempts: row.attempts + 1, lease_until: leaseUntil, error }), snapshot: JSON.parse(row.snapshot), token };
    });
  }

  finishMail(id: string, token: string, now: string): void {
    this.db.prepare("UPDATE outbox SET state='sent', sent_at=?, lease_until=NULL, lease_token=NULL, error=NULL WHERE id=? AND lease_token=?").run(now, id, token);
  }

  mailClaimValid(id: string, token: string, now: string): boolean {
    return !!this.db.prepare("SELECT id FROM outbox WHERE id=? AND state='sending' AND lease_token=? AND lease_until>?").get(id, token, now);
  }

  deferMail(id: string, token: string, next: string, error: string): void {
    this.db.prepare("UPDATE outbox SET state='pending', next_attempt_at=?, lease_until=NULL, lease_token=NULL, error=? WHERE id=? AND lease_token=?").run(next, error, id, token);
  }

  claimPayment(orderId: string, attempt: number, now: string, leaseUntil: string): { key: string; token: string } | undefined {
    const row = this.db.prepare("SELECT attempt,idempotency_key,lease_until FROM payment_work WHERE order_id=?").get(orderId) as { attempt: number; idempotency_key: string; lease_until: string | null } | undefined;
    if (row?.lease_until && row.lease_until > now) return;
    const key = row?.attempt === attempt ? row.idempotency_key : `rental-${orderId}-${attempt}`;
    const token = randomUUID();
    this.db.prepare("INSERT INTO payment_work(order_id,attempt,idempotency_key,lease_until,lease_token) VALUES(?,?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET attempt=excluded.attempt,idempotency_key=excluded.idempotency_key,lease_until=excluded.lease_until,lease_token=excluded.lease_token")
      .run(orderId, attempt, key, leaseUntil, token);
    return { key, token };
  }

  paymentClaimValid(orderId: string, token: string): boolean {
    return !!this.db.prepare("SELECT order_id FROM payment_work WHERE order_id=? AND lease_token=?").get(orderId, token);
  }

  releasePayment(orderId: string, token: string): void {
    this.db.prepare("UPDATE payment_work SET lease_until=NULL,lease_token=NULL WHERE order_id=? AND lease_token=?").run(orderId, token);
  }

  paymentRecord(id: string): RentalPaymentRecord | undefined {
    const row = this.db.prepare("SELECT id,order_id,attempt,status FROM payment_records WHERE id=?").get(id) as { id: string; order_id: string; attempt: number; status: RentalPaymentStatus } | undefined;
    return row ? { id: row.id, orderId: row.order_id, attempt: row.attempt, status: row.status } : undefined;
  }

  recordPayment(payment: RentalPaymentRecord): void {
    const existing = this.paymentRecord(payment.id);
    if (existing && (existing.orderId !== payment.orderId || existing.attempt !== payment.attempt)) throw new Error("Zahlungs-ID wurde bereits einer anderen Bestellung zugeordnet.");
    this.db.prepare("INSERT INTO payment_records(id,order_id,attempt,status) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=CASE WHEN payment_records.status='paid' THEN 'paid' ELSE excluded.status END")
      .run(payment.id, payment.orderId, payment.attempt, payment.status);
  }
}
