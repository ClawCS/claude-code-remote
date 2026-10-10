import type Database from "better-sqlite3";
import { applicationId, digest, staffId, utcInstant, type ApplicationId, type CaseRecord, type Digest, type Instant, type SensitiveAction, type StaffId, type StaffSession } from "./types";
import type { PasswordRecord } from "./auth-crypto";

export interface AuthStaff { id: StaffId; login: "niko"; displayName: "Nikolaos Jammers"; enabled: number; generation: number; password: PasswordRecord; factor: string; lastStep: number }
export interface AuthSessionRow { hash: Digest; staffId: StaffId; generation: number; epoch: Digest; csrf: Digest; issuedAt: Instant; lastSeen: Instant; expiresAt: Instant; revoked: number }
export interface AuthGrantRow { hash: Digest; staffId: StaffId; sessionHash: Digest; generation: number; epoch: Digest; action: SensitiveAction["kind"]; caseId: ApplicationId; version: number; issuedAt: Instant; expiresAt: Instant }
export interface AuthActionContext { readonly row: Readonly<CaseRecord>; readonly actor: StaffId; readonly now: Instant; readonly epoch: Digest }
export const AUTH_ACTIONS = ["review", "reject", "reopen", "correct-date", "hold", "release-hold", "manual-case", "confirm-external-copies"] as const;
export function assertAction(action: SensitiveAction): void {
  applicationId(action.caseId);
  if (!AUTH_ACTIONS.includes(action.kind) || !Number.isSafeInteger(action.version) || action.version < 1) throw new Error("AUTH_DENIED");
}
export function advanceAuthMaintenanceClock(db: Database.Database, now: Instant): void {
  utcInstant(now); const old = db.prepare("SELECT lastAt FROM auth_clock WHERE singleton=1").get() as { lastAt: Instant } | undefined;
  if (old && now < utcInstant(old.lastAt)) throw new Error("AUTH_DENIED");
  db.prepare("INSERT INTO auth_clock VALUES(1,?) ON CONFLICT(singleton) DO UPDATE SET lastAt=excluded.lastAt").run(now);
}
export function pruneAuthAttempts(db: Database.Database, now: Instant): number {
  return db.transaction(() => {
    advanceAuthMaintenanceClock(db, now);
    return db.prepare("DELETE FROM auth_attempts WHERE at<=?").run(new Date(Date.parse(now) - 900000).toISOString()).changes;
  }).immediate();
}
// Internal composition only: receives the one repository owner's connection and
// case exclusion, never opens another database or exports arbitrary SQL access.
export function createAuthRepository(db: Database.Database, live: () => void, readCase: (id: ApplicationId) => CaseRecord, guarded: <T>(id: ApplicationId, action: () => Promise<T>) => Promise<T>) {
  function transaction<T>(action: () => T): T { live(); return db.transaction(action).immediate(); }
  function clock(now: Instant): void {
    advanceAuthMaintenanceClock(db, now);
  }
  function staff(login: string): AuthStaff | null {
    live(); const row = db.prepare("SELECT * FROM auth_staff WHERE login=?").get(login) as (Omit<AuthStaff, "password"> & { password: string }) | undefined;
    if (!row) return null;
    staffId(row.id); if (!Number.isSafeInteger(row.generation) || row.generation < 1 || !Number.isSafeInteger(row.lastStep) || row.lastStep < 0) throw new Error("AUTH_DENIED");
    return { ...row, password: JSON.parse(row.password) as PasswordRecord };
  }
  function current(id: StaffId, generation: number): AuthStaff {
    const row = staff("niko"); if (!row || row.id !== id || row.generation !== generation || row.enabled !== 1) throw new Error("AUTH_DENIED"); return row;
  }
  function advance(id: StaffId, generation: number, step: number): void {
    current(id, generation);
    if (!Number.isSafeInteger(step) || step < 0 || db.prepare("UPDATE auth_staff SET lastStep=? WHERE id=? AND generation=? AND enabled=1 AND lastStep<?").run(step, id, generation, step).changes !== 1) throw new Error("AUTH_DENIED");
  }
  function session(hash: Digest, epoch: Digest, now: Instant, touch = false): AuthSessionRow | null {
    live(); digest(hash); digest(epoch); utcInstant(now);
    const row = db.prepare("SELECT * FROM auth_sessions WHERE hash=?").get(hash) as AuthSessionRow | undefined;
    if (!row || row.revoked !== 0 || row.epoch !== epoch) return null;
    try {
      current(row.staffId, row.generation);
      for (const value of [row.issuedAt, row.lastSeen, row.expiresAt]) utcInstant(value);
      if (now < row.issuedAt || now < row.lastSeen || now >= row.expiresAt || Date.parse(now) >= Date.parse(row.lastSeen) + 1800000 || Date.parse(row.expiresAt) !== Date.parse(row.issuedAt) + 28800000) return null;
      if (touch) db.prepare("UPDATE auth_sessions SET lastSeen=? WHERE hash=?").run(now, hash);
      return { ...row, lastSeen: touch ? now : row.lastSeen };
    } catch { return null; }
  }
  function recovery(id: StaffId, generation: number, hash: Digest): boolean {
    live(); return !!db.prepare("SELECT 1 FROM auth_recovery WHERE staffId=? AND generation=? AND hash=?").get(id, generation, hash);
  }
  function checkGrant(hash: Digest, activeSession: StaffSession, action: SensitiveAction, epochNow: () => Digest, clockNow: () => Instant, staleError: "AUTH_DENIED" | "CASE_STALE" = "AUTH_DENIED"): AuthActionContext {
    live(); assertAction(action); digest(hash);
    const now = clockNow(), epoch = epochNow(); utcInstant(now); digest(epoch);
    const clockRow = db.prepare("SELECT lastAt FROM auth_clock WHERE singleton=1").get() as { lastAt: Instant } | undefined;
    if (clockRow && now < utcInstant(clockRow.lastAt)) throw new Error("AUTH_DENIED");
    const grant = db.prepare("SELECT * FROM auth_grants WHERE hash=?").get(hash) as AuthGrantRow | undefined;
    if (!grant || grant.staffId !== activeSession.staffId || grant.sessionHash !== activeSession.sessionId || grant.epoch !== epoch || grant.action !== action.kind || grant.caseId !== action.caseId || grant.version !== action.version || now < utcInstant(grant.issuedAt) || now >= utcInstant(grant.expiresAt) || Date.parse(grant.expiresAt) > Date.parse(grant.issuedAt) + 300000) throw new Error("AUTH_DENIED");
    const own = session(grant.sessionHash, epoch, now);
    if (!own || own.staffId !== activeSession.staffId || own.generation !== grant.generation || own.generation !== activeSession.generation || own.issuedAt !== activeSession.issuedAt || own.expiresAt !== activeSession.expiresAt || epochNow() !== epoch) throw new Error("AUTH_DENIED");
    const row = readCase(action.caseId);
    if (row.version !== action.version) throw new Error(staleError);
    return Object.freeze({ row: Object.freeze(row), actor: own.staffId, now, epoch });
  }
  const store = {
    staff, session, recovery, preflight: checkGrant,
    reserve(login: string, ip: Digest, now: Instant): AuthStaff | null {
      return transaction(() => {
        clock(now); digest(ip); const row = staff(login), key = row?.id ?? "unknown";
        const oldest = new Date(Date.parse(now) - 900000).toISOString();
        db.prepare("DELETE FROM auth_attempts WHERE at<=?").run(oldest);
        for (const [scope, identity] of [["staff", key], ["ip", ip]]) {
          const count = db.prepare("SELECT COUNT(*) AS n FROM auth_attempts WHERE scope=? AND key=?").get(scope, identity) as { n: number };
          if (count.n >= 5) throw new Error("AUTH_DENIED");
        }
        const known = db.prepare("SELECT 1 FROM auth_attempts WHERE scope='ip' AND key=?").get(ip);
        const count = db.prepare("SELECT COUNT(DISTINCT key) AS n FROM auth_attempts WHERE scope='ip'").get() as { n: number };
        if (!known && count.n >= 1024) throw new Error("AUTH_DENIED");
        for (const [scope, identity] of [["staff", key], ["ip", ip]]) db.prepare("INSERT INTO auth_attempts VALUES(?,?,?)").run(scope, identity, now);
        return row;
      });
    },
    enroll(row: AuthStaff, codes: readonly Digest[], now: Instant): void {
      transaction(() => {
        clock(now); if (staff("niko")) throw new Error("AUTH_DENIED");
        db.prepare("INSERT INTO auth_staff VALUES(@id,@login,@displayName,@enabled,@generation,@password,@factor,@lastStep)").run({ ...row, password: JSON.stringify(row.password) });
        for (const hash of codes) db.prepare("INSERT INTO auth_recovery VALUES(?,?,?)").run(hash, row.id, row.generation);
      });
    },
    login(row: AuthSessionRow, step: number, now: Instant): void {
      transaction(() => { clock(now); advance(row.staffId, row.generation, step); db.prepare("INSERT INTO auth_sessions VALUES(@hash,@staffId,@generation,@epoch,@csrf,@issuedAt,@lastSeen,@expiresAt,@revoked)").run(row); });
    },
    grant(row: AuthGrantRow, step: number, now: Instant): void {
      transaction(() => {
        clock(now); assertAction({ kind: row.action, caseId: row.caseId, version: row.version });
        const own = session(row.sessionHash, row.epoch, now), target = readCase(row.caseId);
        if (!own || own.staffId !== row.staffId || own.generation !== row.generation || target.version !== row.version) throw new Error("AUTH_DENIED");
        advance(row.staffId, row.generation, step);
        db.prepare("INSERT INTO auth_grants VALUES(@hash,@staffId,@sessionHash,@generation,@epoch,@action,@caseId,@version,@issuedAt,@expiresAt)").run(row);
      });
    },
    revoke(hash: Digest): void { live(); db.prepare("UPDATE auth_sessions SET revoked=1 WHERE hash=?").run(hash); db.prepare("DELETE FROM auth_grants WHERE sessionHash=?").run(hash); },
    replace(old: AuthStaff, row: AuthStaff, proof: { step: number } | { recovery: Digest }, codes: readonly Digest[], now: Instant): void {
      transaction(() => {
        clock(now); current(old.id, old.generation);
        if ("step" in proof) advance(old.id, old.generation, proof.step);
        else if (db.prepare("DELETE FROM auth_recovery WHERE staffId=? AND generation=? AND hash=?").run(old.id, old.generation, proof.recovery).changes !== 1) throw new Error("AUTH_DENIED");
        if (row.id !== old.id || row.generation !== old.generation + 1) throw new Error("AUTH_DENIED");
        db.prepare("UPDATE auth_staff SET generation=?,factor=?,lastStep=? WHERE id=?").run(row.generation, row.factor, row.lastStep, row.id);
        db.prepare("DELETE FROM auth_grants WHERE staffId=?").run(row.id);
        db.prepare("UPDATE auth_sessions SET revoked=1 WHERE staffId=?").run(row.id);
        db.prepare("DELETE FROM auth_recovery WHERE staffId=?").run(row.id);
        for (const hash of codes) db.prepare("INSERT INTO auth_recovery VALUES(?,?,?)").run(hash, row.id, row.generation);
      });
    },
    disable(id: StaffId): void {
      transaction(() => { db.prepare("UPDATE auth_staff SET enabled=0 WHERE id=?").run(id); db.prepare("UPDATE auth_sessions SET revoked=1 WHERE staffId=?").run(id); db.prepare("DELETE FROM auth_grants WHERE staffId=?").run(id); db.prepare("DELETE FROM auth_recovery WHERE staffId=?").run(id); });
    },
    // Task9 composes this only inside the repository. It must perform its actual
    // business mutation in this closure; no public consume-before-write path.
    async withGrant<T>(hash: Digest, activeSession: StaffSession, action: SensitiveAction, epochNow: () => Digest, clockNow: () => Instant, mutate: (row: Readonly<CaseRecord>, context: AuthActionContext) => T, staleError: "AUTH_DENIED" | "CASE_STALE" = "AUTH_DENIED"): Promise<T> {
      assertAction(action);
      return guarded(action.caseId, async () => transaction(() => {
        const context = checkGrant(hash, activeSession, action, epochNow, clockNow, staleError), { now, epoch, row } = context; clock(now);
        db.prepare("DELETE FROM auth_grants WHERE hash=?").run(hash);
        const result = mutate(row, context);
        if (result && (typeof result === "object" || typeof result === "function") && "then" in result) throw new Error("ASYNC_AUTH_MUTATION");
        if (epochNow() !== epoch) throw new Error("AUTH_DENIED");
        return result;
      }));
    },
  };
  return store;
}
export type AuthRepository = ReturnType<typeof createAuthRepository>;
