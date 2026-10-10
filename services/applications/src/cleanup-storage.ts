import type Database from "better-sqlite3";
import type { ApplicationRepository, CustodyConfig, CustodyLedger, Reservation, IntakeCommit } from "./types";
import type { CustodyJournal } from "./custody-erasure";
import { consumeCustodyObservation, type CustodyObservation } from "./custody-erasure";
import { assertMaintenance, assertMaintenanceCustodyIdentity, assertOriginalMaintenanceCustody, selectMaintenance, maintenanceRemaining, type MaintenanceRun } from "./worker-maintenance";
import { validateInventoryJournal, validateInventoryObject, type InventoryJournal, type InventoryObject } from "./erasure-storage";

interface Source extends Omit<Reservation, "submission"> {
  submission: string; active: number; custodyStarted: number | null;
  cleanupDisposition: "abort" | "replay-loser" | null;
  cleanupGeneration: string | null; cleanupDomain: string | null; cleanupWinner: string | null;
}
interface CaseSource { id: string; reservationId: string; sessionHash: string; idempotencyKey: string; encryptedPayloadPath: string | null }
function denied(): never { throw new Error("ERASURE_ASSOCIATION_INVALID"); }
function sameReservation(source: Source, reservation: Reservation) {
  return source.id === reservation.id && source.sessionHash === reservation.sessionHash && source.idempotencyKey === reservation.idempotencyKey &&
    source.reservedBytes === reservation.reservedBytes && source.expiresAt === reservation.expiresAt && source.submission === JSON.stringify(reservation.submission);
}

// One source owner on the original connection. The issuance map corroborates
// only this connection's new never-started rows; restored zero is not lineage.
export function createCleanupSource(db: Database.Database) {
  const issued = new Map<string, Readonly<Reservation>>();
  let commitContext: { entry: CustodyJournal; config: CustodyConfig } | undefined;
  function cases(source: Source) {
    const own = db.prepare("SELECT id,reservationId,sessionHash,idempotencyKey,encryptedPayloadPath FROM cases WHERE reservationId=?").get(source.id) as CaseSource | undefined;
    const winner = db.prepare("SELECT id,reservationId,sessionHash,idempotencyKey,encryptedPayloadPath FROM cases WHERE sessionHash=? AND idempotencyKey=?").get(source.sessionHash, source.idempotencyKey) as CaseSource | undefined;
    if (own && (!winner || own.id !== winner.id || own.reservationId !== source.id || own.sessionHash !== source.sessionHash || own.idempotencyKey !== source.idempotencyKey)) denied();
    return { own, winner };
  }
  function source(id: string) { return db.prepare("SELECT * FROM reservations WHERE id=?").get(id) as Source | undefined; }
  function original(entry: CustodyJournal, config: CustodyConfig) {
    const row = source(entry.id), lease = entry.lease;
    if (!row || !entry.reservation || !sameReservation(row, entry.reservation) || row.custodyStarted !== 1 || entry.kind !== "intake" ||
      !lease || !lease.generation || !lease.domain || lease.reservationId !== entry.id || lease.allowance !== row.reservedBytes / 2 ||
      entry.path !== `${config.intakeRoot}/${entry.id}.enc` || lease.path !== entry.path || entry.workerPath !== `${config.custodyRoot}/${entry.id}.enc`) denied();
    return { row, ...cases(row) };
  }
  function release(id: string) {
    db.transaction(() => {
      const row = source(id), lineage = issued.get(id);
      if (!row || !lineage || row.custodyStarted !== 0 || row.active !== 1 || !sameReservation(row, lineage) || row.cleanupDisposition !== null) return;
      const linked = cases(row);
      if (linked.own || (linked.winner && linked.winner.reservationId === row.id) || db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE reservationId=? LIMIT 1").get(id) || db.prepare("SELECT 1 FROM reservations WHERE cleanupWinner=? LIMIT 1").get(id) || db.prepare("SELECT 1 FROM cleanup_manifests WHERE reservationId=? LIMIT 1").get(id)) return;
      db.prepare("DELETE FROM reservations WHERE id=? AND active=1 AND custodyStarted=0").run(id);
    }).immediate();
    if (!source(id)) issued.delete(id);
  }
  return Object.freeze({
    issued(reservation: Reservation) { issued.set(reservation.id, Object.freeze({ ...reservation })); },
    release,
    captureReplay(id: string) {
      if (!commitContext || commitContext.entry.id !== id || !db.inTransaction) denied();
      const commitEntry = commitContext.entry;
      const { row, own, winner } = original(commitEntry, commitContext.config);
      if (own) return false;
      if (!winner || winner.reservationId === row.id || row.active !== 1 || (winner.encryptedPayloadPath !== null && winner.encryptedPayloadPath === commitEntry.workerPath)) denied();
      if (row.cleanupDisposition !== null) {
        if (row.cleanupDisposition !== "replay-loser" || row.cleanupWinner !== winner.reservationId || row.cleanupGeneration !== commitEntry.lease!.generation || row.cleanupDomain !== commitEntry.lease!.domain) denied();
      } else db.prepare("UPDATE reservations SET cleanupDisposition='replay-loser',cleanupGeneration=?,cleanupDomain=?,cleanupWinner=? WHERE id=? AND active=1 AND custodyStarted=1 AND cleanupDisposition IS NULL").run(commitEntry.lease!.generation, commitEntry.lease!.domain, winner.reservationId, id);
      return true;
    },
    bind(config: CustodyConfig, repository: ApplicationRepository, custody: CustodyLedger) {
      function eligibility(journal: Readonly<InventoryJournal>, now: string): Disposition | null {
        const row = source(journal.journalId);
        if (!row || row.custodyStarted !== 1 || row.active !== 1 || journal.kind !== "intake" || journal.caseId !== null || journal.reservationId !== row.id || journal.state === "committed" || journal.allowance !== row.reservedBytes / 2 || journal.budget > row.reservedBytes || journal.cleanupAfter > row.expiresAt || !journal.generation || !journal.domain) denied();
        const linked = cases(row);
        if (linked.own) denied();
        if (row.cleanupDisposition !== null) {
          if (row.cleanupGeneration !== journal.generation || row.cleanupDomain !== journal.domain) denied();
          if (row.cleanupDisposition === "abort") { if (linked.winner || row.cleanupWinner !== null) denied(); return "abort"; }
          if (!linked.winner || linked.winner.reservationId !== row.cleanupWinner || row.cleanupWinner === row.id || linked.winner.encryptedPayloadPath === `${config.custodyRoot}/${row.id}.enc`) denied();
          return "replay-loser";
        }
        if (linked.winner || row.cleanupGeneration !== null || row.cleanupDomain !== null || row.cleanupWinner !== null) denied();
        return row.expiresAt <= now ? "expiry" : null;
      }
      const inventory = createCleanupInventory(db, repository, custody, config, eligibility, id => {
        const row = source(id), original = issued.get(id);
        if (!row) issued.delete(id);
        if (!row || !original || row.custodyStarted !== 0 || row.active !== 1 || row.cleanupDisposition !== null || !sameReservation(row, original)) return false;
        const linked = cases(row); return !linked.own && (!linked.winner || linked.winner.reservationId !== row.id);
      });
      return Object.freeze({
        inventory,
        captureExpired(observation: CustodyObservation, run: MaintenanceRun) {
          assertMaintenanceCustodyIdentity(run, repository, custody); assertMaintenance(run, repository);
          const value = consumeCustodyObservation(observation, custody, run);
          if (!db.inTransaction || value.kind !== "cleanup-expiry-source" || value.pass !== (db.prepare("SELECT scanPass FROM erasure_maintenance WHERE singleton=1").get() as { scanPass: string }).scanPass) denied();
          const entry = value.journal, { row, own, winner } = original(entry, config);
          if (own || !winner || winner.reservationId === row.id || winner.encryptedPayloadPath === entry.workerPath || row.active !== 1 || row.expiresAt > maintenanceRemaining(run, repository).now || entry.state === "committed" || entry.caseId || entry.cleanupAfter > row.expiresAt || JSON.stringify(value.evidence.lease) !== JSON.stringify(entry.lease)) denied();
          if (row.cleanupDisposition !== null) {
            if (row.cleanupDisposition !== "replay-loser" || row.cleanupWinner !== winner.reservationId || row.cleanupGeneration !== entry.lease!.generation || row.cleanupDomain !== entry.lease!.domain) denied();
          } else if (row.cleanupGeneration !== null || row.cleanupDomain !== null || row.cleanupWinner !== null || db.prepare("UPDATE reservations SET cleanupDisposition='replay-loser',cleanupGeneration=?,cleanupDomain=?,cleanupWinner=? WHERE id=? AND active=1 AND custodyStarted=1 AND cleanupDisposition IS NULL").run(entry.lease!.generation, entry.lease!.domain, winner.reservationId, row.id).changes !== 1) denied();
          return 20; // Pass2 + source/case6 + fixed evidence/source checks + update1.
        },
        isReplayLoser(entry: CustodyJournal) {
          const { row, own, winner } = original(entry, config);
          return !own && !!winner && row.active === 1 && row.cleanupDisposition === "replay-loser" && row.cleanupWinner === winner.reservationId && row.cleanupGeneration === entry.lease!.generation && row.cleanupDomain === entry.lease!.domain && winner.encryptedPayloadPath !== entry.workerPath;
        },
        commit(entry: CustodyJournal, input: IntakeCommit) {
          if (commitContext || entry.id !== input.reservationId) denied();
          original(entry, config); commitContext = { entry, config };
          try { return repository.commitIntake(input); } finally { commitContext = undefined; }
        },
        accepted(entry: CustodyJournal) { return original(entry, config).own?.id; },
        start(reservation: Reservation) {
          db.transaction(() => {
            const row = source(reservation.id), lineage = issued.get(reservation.id);
            if (!row || !lineage || !sameReservation(row, lineage) || !sameReservation(row, reservation) || row.active !== 1 || row.custodyStarted !== 0) denied();
            if (cases(row).own) denied();
            if (db.prepare("UPDATE reservations SET custodyStarted=1 WHERE id=? AND active=1 AND custodyStarted=0").run(row.id).changes !== 1) denied();
          }).immediate();
          issued.delete(reservation.id);
        },
        abort(entry: CustodyJournal) {
          db.transaction(() => {
            const { row, own, winner } = original(entry, config);
            if (own || row.active !== 1) denied();
            // A loser is a distinct retry source, not proof that its commit ran.
            // Authenticated cancellation can bind that same current winner.
            if (winner) {
              if (winner.reservationId === row.id || winner.encryptedPayloadPath === entry.workerPath) denied();
              if (row.cleanupDisposition !== null) {
                if (row.cleanupDisposition !== "replay-loser" || row.cleanupWinner !== winner.reservationId || row.cleanupGeneration !== entry.lease!.generation || row.cleanupDomain !== entry.lease!.domain) denied();
              } else if (db.prepare("UPDATE reservations SET cleanupDisposition='replay-loser',cleanupGeneration=?,cleanupDomain=?,cleanupWinner=? WHERE id=? AND active=1 AND custodyStarted=1 AND cleanupDisposition IS NULL").run(entry.lease!.generation, entry.lease!.domain, winner.reservationId, row.id).changes !== 1) denied();
              return;
            }
            if (row.cleanupDisposition !== null) {
              if (row.cleanupDisposition !== "abort" || row.cleanupGeneration !== entry.lease!.generation || row.cleanupDomain !== entry.lease!.domain || row.cleanupWinner !== null) denied();
              return;
            }
            db.prepare("UPDATE reservations SET cleanupDisposition='abort',cleanupGeneration=?,cleanupDomain=? WHERE id=? AND custodyStarted=1 AND active=1 AND cleanupDisposition IS NULL").run(entry.lease!.generation, entry.lease!.domain, row.id);
          }).immediate();
        },
      });
    },
  });
}
const sources = new WeakMap<ApplicationRepository, ReturnType<typeof createCleanupSource>>();
const bound = new WeakSet<CustodyLedger>();
const boundSources = new WeakMap<CustodyLedger, ReturnType<ReturnType<typeof createCleanupSource>["bind"]>>();
export function registerCleanupSource(repository: ApplicationRepository, source: ReturnType<typeof createCleanupSource>) {
  if (sources.has(repository)) denied(); sources.set(repository, source);
}
export function bindCleanupSource(repository: ApplicationRepository, custody: CustodyLedger, config: CustodyConfig) {
  assertOriginalMaintenanceCustody(custody, repository, config);
  const source = sources.get(repository);
  if (!source || bound.has(custody)) denied();
  bound.add(custody); const result = source.bind(config, repository, custody); boundSources.set(custody, result); return result;
}
export function cleanupSourceOwner(custody: CustodyLedger) {
  const source = boundSources.get(custody); if (!source) denied(); return source;
}

type Disposition = "abort" | "expiry" | "replay-loser";
export interface CleanupManifest {
  reservationId: string; journalId: string; slot: InventoryObject["slot"]; leaf: string; scanPass: string;
  expectedDevice: number | null; expectedInode: number | null; expectedSize: number; remainingCharge: number;
  disposition: Disposition; phase: "planned" | "holders-released" | "absent-synced" | "metadata-finalized";
}
declare const cleanupBrand: unique symbol;
export interface CleanupCandidate { readonly [cleanupBrand]: true }
declare const pruneBrand: unique symbol;
export interface CleanupPruneCandidate { readonly [pruneBrand]: true }
export interface CleanupOperands { readonly journal: Readonly<InventoryJournal>; readonly object: Readonly<InventoryObject>; readonly manifest: Readonly<CleanupManifest> | null; readonly relativePath: string }
const journalFields = "pass,journalId,caseId,kind,version,state,artifactKind,budget,cleanupAfter,reservationId,generation,domain,allowance";
const objectFields = "pass,journalId,slot,leaf,root,presence,device,inode,size,type,uid,gid,mode,nlink,leaseState,chargedBytes,leaseDevice,leaseInode";
const slots = ["incoming-sealed", "original-sealed", "journal-temp", "journal"] as const;
function createCleanupInventory(db: Database.Database, repository: ApplicationRepository, custody: CustodyLedger, config: CustodyConfig,
  eligibility: (journal: Readonly<InventoryJournal>, now: string) => Disposition | null, originalZero: (id: string) => boolean) {
  let candidates = new WeakMap<CleanupCandidate, CleanupOperands & { run: MaintenanceRun }>();
  const initialZero = new Set<string>();
  interface PruneRow { pass: string; journalId?: string; slot?: string; leaf?: string; root?: string }
  interface PruneRecord { stream: number; row: PruneRow | undefined; cursor: { scanPass: string; journalId: string; slot: string; leaf: string; root: string }; run: MaintenanceRun }
  let pruning = new WeakMap<CleanupPruneCandidate, PruneRecord>();
  let recoveryCursor = ["", "", "", ""], recoveryComplete = false, preflight = ["", "", "", ""], preflightComplete = false;
  let current: { id: string; planning: boolean; slot: string; leaf: string; execution: number; retiring: boolean } | undefined;
  let cycleStarted = false, blocked = false;
  const pass = () => (db.prepare("SELECT scanPass FROM erasure_maintenance WHERE singleton=1").get() as { scanPass: string }).scanPass;
  function check(run: MaintenanceRun) { assertMaintenanceCustodyIdentity(run, repository, custody); assertMaintenance(run, repository); }
  function journal(scanPass: string, id: string) {
    const value = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(scanPass, id) as InventoryJournal | undefined;
    if (!value || value.kind !== "intake" || value.caseId !== null || !value.allowance) denied();
    return validateInventoryJournal(value, { id, reservedBytes: 2 * value.allowance });
  }
  function operands(j: Readonly<InventoryJournal>, o: InventoryObject, m: CleanupManifest | null): CleanupOperands {
    if (!slots.includes(o.slot as typeof slots[number])) denied();
    const checked = validateInventoryObject(o, j, config);
    if (m && (m.reservationId !== j.reservationId || m.journalId !== j.journalId || m.scanPass !== j.pass || m.slot !== o.slot || m.leaf !== o.leaf || m.expectedDevice !== o.device || m.expectedInode !== o.inode || m.expectedSize !== (o.size ?? 0) || !Number.isSafeInteger(m.remainingCharge) || m.remainingCharge < 0 || m.remainingCharge > (o.slot === "incoming-sealed" ? j.allowance! : o.size ?? 0))) denied();
    return Object.freeze({ journal: j, object: Object.freeze({ ...o }), manifest: m && Object.freeze({ ...m }), relativePath: checked.relativePath });
  }
  function manifestValue(m: CleanupManifest) {
    return operands(journal(m.scanPass, m.journalId), db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(m.scanPass, m.journalId, m.slot, m.leaf) as InventoryObject, m);
  }
  function mint(value: CleanupOperands, run: MaintenanceRun) { const token = Object.freeze({}) as CleanupCandidate; candidates.set(token, { ...value, run }); return token; }
  function read(candidate: CleanupCandidate, run: MaintenanceRun) { check(run); const value = candidates.get(candidate); if (!value || value.run !== run) denied(); return value; }
  function source(value: CleanupOperands, run: MaintenanceRun) {
    const disposition = eligibility(value.journal, maintenanceRemaining(run, repository).now);
    if (!disposition || (value.manifest && disposition !== value.manifest.disposition)) denied();
    return disposition;
  }
  function immutable(candidate: CleanupCandidate, run: MaintenanceRun) {
    const value = read(candidate, run); source(value, run);
    if (value.manifest) {
      const stored = db.prepare("SELECT * FROM cleanup_manifests WHERE reservationId=? AND journalId=? AND slot=? AND leaf=?").get(value.manifest.reservationId, value.object.journalId, value.object.slot, value.object.leaf);
      if (JSON.stringify(stored) !== JSON.stringify(value.manifest)) denied();
    }
    return value;
  }
  function identity(value: CleanupOperands) {
    if (!value.manifest || value.manifest.expectedDevice === null) return;
    const rows = db.prepare("SELECT journalId,slot,leaf FROM erasure_inventory_objects WHERE pass=? AND device=? AND inode=? LIMIT 2").all(pass(), value.manifest.expectedDevice, value.manifest.expectedInode) as { journalId: string; slot: string; leaf: string }[];
    if (rows.length > 1 || rows.some(row => row.journalId !== value.object.journalId || row.slot !== value.object.slot || row.leaf !== value.object.leaf)) denied();
  }
  function advanceCursor(id: string) { db.prepare("UPDATE cleanup_maintenance SET reservationCursor=? WHERE singleton=1").run(id); }
  function prunePurpose(value: PruneRecord): { kind: "blocked" | "duplicate" | "released-intake" | "scan"; journal?: Readonly<InventoryJournal> } {
    const row = value.row, currentPass = pass();
    if (!row || row.pass === currentPass) return { kind: "blocked" };
    const stored = value.stream === 0
      ? db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(row.pass, row.journalId, row.slot, row.leaf)
      : value.stream === 1 ? db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(row.pass, row.journalId)
        : db.prepare("SELECT * FROM erasure_scans WHERE pass=? AND root=?").get(row.pass, row.root);
    if (JSON.stringify(stored) !== JSON.stringify(row)) return { kind: "blocked" };
    if (value.stream === 2) {
      if (db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE pass=? LIMIT 1").get(row.pass)) return { kind: "blocked" };
      return { kind: "scan" };
    }
    if (value.stream === 0) {
      if (db.prepare("SELECT 1 FROM erasure_manifests WHERE scanPass=? AND journalId=? AND slot=? AND leaf=? LIMIT 1").get(row.pass, row.journalId, row.slot, row.leaf) || db.prepare("SELECT 1 FROM cleanup_manifests WHERE scanPass=? AND journalId=? AND slot=? AND leaf=? LIMIT 1").get(row.pass, row.journalId, row.slot, row.leaf)) return { kind: "blocked" };
    } else if (db.prepare("SELECT 1 FROM erasure_inventory_objects WHERE pass=? AND journalId=? LIMIT 1").get(row.pass, row.journalId) || db.prepare("SELECT 1 FROM erasure_manifests WHERE scanPass=? AND journalId=? LIMIT 1").get(row.pass, row.journalId) || db.prepare("SELECT 1 FROM cleanup_manifests WHERE scanPass=? AND journalId=? LIMIT 1").get(row.pass, row.journalId)) return { kind: "blocked" };
    const old = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(row.pass, row.journalId) as InventoryJournal | undefined;
    if (!old) return { kind: "blocked" };
    const fresh = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(currentPass, row.journalId) as InventoryJournal | undefined;
    if (fresh) {
      if (JSON.stringify({ ...old, pass: currentPass }) !== JSON.stringify(fresh)) return { kind: "blocked" };
      if (value.stream === 0) {
        const object = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(currentPass, row.journalId, row.slot, row.leaf);
        if (JSON.stringify({ ...row, pass: currentPass }) !== JSON.stringify(object)) return { kind: "blocked" };
      }
      let normalized: Readonly<InventoryJournal>;
      if (fresh.kind === "intake") {
        const source = db.prepare("SELECT * FROM reservations WHERE id=?").get(fresh.reservationId) as Source | undefined;
        if (!source || source.reservedBytes !== 2 * fresh.allowance!) return { kind: "blocked" };
        const own = db.prepare("SELECT id,reservationId,encryptedPayloadPath,submission FROM cases WHERE reservationId=?").get(source.id) as { id: string; reservationId: string; encryptedPayloadPath: string | null; submission: string } | undefined;
        const winner = db.prepare("SELECT id,reservationId FROM cases WHERE sessionHash=? AND idempotencyKey=?").get(source.sessionHash, source.idempotencyKey) as { id: string; reservationId: string } | undefined;
        if ((own?.id ?? null) !== fresh.caseId) return { kind: "blocked" };
        if (own && (!winner || own.id !== winner.id || own.submission !== source.submission || (own.encryptedPayloadPath !== null && own.encryptedPayloadPath !== `${config.custodyRoot}/${source.id}.enc`))) return { kind: "blocked" };
        if (!own && winner && (source.cleanupDisposition !== "replay-loser" || source.cleanupWinner !== winner.reservationId || source.cleanupGeneration !== fresh.generation || source.cleanupDomain !== fresh.domain)) return { kind: "blocked" };
        normalized = validateInventoryJournal(fresh, source);
      } else {
        if (!fresh.caseId || !db.prepare("SELECT 1 FROM cases WHERE id=?").get(fresh.caseId)) return { kind: "blocked" };
        if (fresh.kind === "artifact") {
          const reserve = db.prepare("SELECT bytes FROM artifact_reservations WHERE caseId=? AND kind=?").get(fresh.caseId, fresh.artifactKind) as { bytes: number } | undefined;
          const artifact = db.prepare("SELECT path,bytes FROM artifacts WHERE caseId=? AND kind=?").get(fresh.caseId, fresh.artifactKind) as { path: string; bytes: number } | undefined;
          if (!reserve || (artifact && (artifact.path !== `${config.custodyRoot}/${fresh.journalId}.${fresh.artifactKind}.enc` || artifact.bytes > reserve.bytes))) return { kind: "blocked" };
        }
        normalized = validateInventoryJournal(fresh);
      }
      if (value.stream === 0) validateInventoryObject({ ...row, pass: currentPass } as InventoryObject, normalized, config);
      return { kind: "duplicate", journal: Object.freeze(old) };
    }
    if (old.kind !== "intake" || !old.reservationId || !old.generation || !old.domain || !old.allowance) return { kind: "blocked" };
    if (db.prepare("SELECT 1 FROM reservations WHERE id=?").get(old.reservationId) || db.prepare("SELECT 1 FROM cases WHERE reservationId=?").get(old.reservationId) || (old.caseId && db.prepare("SELECT 1 FROM cases WHERE id=?").get(old.caseId))) return { kind: "blocked" };
    return { kind: "released-intake", journal: validateInventoryJournal(old, { id: old.reservationId, reservedBytes: 2 * old.allowance }) };
  }
  return Object.freeze({
    read,
    startFreshPass(observation: CustodyObservation, run: MaintenanceRun) {
      check(run);
      const value = consumeCustodyObservation(observation, custody, run);
      if (value.kind !== "fresh-pass" || value.pass !== pass()) denied();
      candidates = new WeakMap(); pruning = new WeakMap(); initialZero.clear();
      recoveryCursor = ["", "", "", ""]; recoveryComplete = false;
      preflight = ["", "", "", ""]; preflightComplete = false;
      current = undefined; cycleStarted = false; blocked = false;
      return 3;
    },
    recoveryReady: () => recoveryComplete,
    nextRecovery(run: MaintenanceRun) {
      check(run);
      const m = db.prepare("SELECT * FROM cleanup_manifests WHERE (reservationId,journalId,slot,leaf)>(?,?,?,?) ORDER BY reservationId,journalId,slot,leaf LIMIT 1").get(...recoveryCursor) as CleanupManifest | undefined;
      if (!m) { recoveryComplete = true; return { candidate: null, consumedItems: 2 }; }
      const value = manifestValue(m); source(value, run); selectMaintenance(run, repository, `reservation:${m.reservationId}`);
      return { candidate: mint(value, run), consumedItems: 20 };
    },
    recordRecovery(token: CustodyObservation, run: MaintenanceRun) {
      const proof = consumeCustodyObservation(token, custody, run); if (proof.kind !== "cleanup-recovery") denied();
      const value = immutable(proof.candidate, run), m = value.manifest; if (!m) denied();
      const next = db.transaction(() => {
        immutable(proof.candidate, run); if (proof.pass !== pass()) denied();
        const j = validateInventoryJournal({ ...value.journal, pass: proof.pass }, { id: m.reservationId, reservedBytes: 2 * value.journal.allowance! });
        const o = proof.object; validateInventoryObject(o, j, config);
        if (o.journalId !== m.journalId || o.slot !== m.slot || o.leaf !== m.leaf || (o.presence === "present" && (m.remainingCharge === 0 || o.device !== m.expectedDevice || o.inode !== m.expectedInode || o.size !== m.expectedSize || o.uid !== value.object.uid || o.gid !== value.object.gid || o.mode !== value.object.mode || o.nlink !== 1)) || (o.slot === "incoming-sealed" && m.remainingCharge === 0 && o.chargedBytes !== 0)) denied();
        const priorJ = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(proof.pass, j.journalId);
        if (priorJ && JSON.stringify(priorJ) !== JSON.stringify(j)) denied();
        if (!priorJ) db.prepare(`INSERT INTO erasure_inventory_journals(${journalFields}) VALUES(${journalFields.split(",").map(key => `@${key}`).join(",")})`).run(j);
        const priorO = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(proof.pass, o.journalId, o.slot, o.leaf);
        if (priorO && JSON.stringify(priorO) !== JSON.stringify(o)) denied();
        if (!priorO) db.prepare(`INSERT INTO erasure_inventory_objects(${objectFields}) VALUES(${objectFields.split(",").map(key => `@${key}`).join(",")})`).run(o);
        return [m.reservationId, m.journalId, m.slot, m.leaf];
      }).immediate();
      recoveryCursor = next; return 45;
    },
    next(run: MaintenanceRun) {
      check(run); if (!recoveryComplete) denied();
      const scanPass = pass();
      if (!preflightComplete) {
        const m = db.prepare("SELECT * FROM cleanup_manifests WHERE (reservationId,journalId,slot,leaf)>(?,?,?,?) ORDER BY reservationId,journalId,slot,leaf LIMIT 1").get(...preflight) as CleanupManifest | undefined;
        if (m) { const value = manifestValue(m); source(value, run); identity(value); preflight = [m.reservationId, m.journalId, m.slot, m.leaf]; }
        else preflightComplete = true;
        return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 30 };
      }
      if (!current) {
        const cursor = (db.prepare("SELECT reservationCursor FROM cleanup_maintenance WHERE singleton=1").get() as { reservationCursor: string }).reservationCursor;
        if (cursor === "") { cycleStarted = true; blocked = false; }
        const row = db.prepare("SELECT * FROM reservations WHERE id>? ORDER BY id LIMIT 1").get(cursor) as Source | undefined;
        if (!row) {
          db.transaction(() => advanceCursor("")).immediate();
          const complete = cycleStarted && !blocked; cycleStarted = false;
          return { candidate: null, complete, retiring: false, planning: false, consumedItems: 7 };
        }
        selectMaintenance(run, repository, `reservation:${row.id}`);
        const j = db.prepare("SELECT * FROM erasure_inventory_journals WHERE pass=? AND journalId=?").get(scanPass, row.id) as InventoryJournal | undefined;
        if (row.active !== 1 || !j || j.caseId !== null) {
          const due = row.active === 1 && (row.expiresAt <= maintenanceRemaining(run, repository).now || row.cleanupDisposition !== null);
          if (due) blocked = true;
          // Positive never-started expiry is bookkeeping, not invented native completion.
          if (due && !j && originalZero(row.id)) {
            db.transaction(() => {
              if (!originalZero(row.id) || db.prepare("SELECT 1 FROM erasure_inventory_journals WHERE reservationId=? LIMIT 1").get(row.id) || db.prepare("SELECT 1 FROM cleanup_manifests WHERE reservationId=? LIMIT 1").get(row.id) || db.prepare("SELECT 1 FROM reservations WHERE cleanupWinner=? LIMIT 1").get(row.id)) denied();
              db.prepare("DELETE FROM reservations WHERE id=? AND active=1 AND custodyStarted=0 AND expiresAt<=?").run(row.id, maintenanceRemaining(run, repository).now); advanceCursor(row.id);
            }).immediate();
            originalZero(row.id); // Scrub only the successfully retired issuance.
          } else db.transaction(() => advanceCursor(row.id)).immediate();
          return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 40 };
        }
        let eligible: Disposition | null;
        try { eligible = eligibility(j, maintenanceRemaining(run, repository).now); }
        catch (error) {
          if (!(error instanceof Error) || error.message !== "ERASURE_ASSOCIATION_INVALID") throw error;
          blocked = true; db.transaction(() => advanceCursor(row.id)).immediate();
          return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 20 };
        }
        if (!eligible) { db.transaction(() => advanceCursor(row.id)).immediate(); return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 20 }; }
        current = { id: row.id, planning: true, slot: "", leaf: "", execution: 0, retiring: false };
        return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 20 };
      }
      const state = current;
      selectMaintenance(run, repository, `reservation:${state.id}`);
      if (state.planning) {
        const object = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND (slot,leaf)>(?,?) ORDER BY slot,leaf LIMIT 1").get(scanPass, state.id, state.slot, state.leaf) as InventoryObject | undefined;
        if (!object) { state.planning = false; state.slot = ""; state.leaf = ""; return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 6 }; }
        const existing = db.prepare("SELECT * FROM cleanup_manifests WHERE reservationId=? AND journalId=? AND slot=? AND leaf=?").get(state.id, state.id, object.slot, object.leaf) as CleanupManifest | undefined;
        if (existing) { state.slot = object.slot; state.leaf = object.leaf; return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 8 }; }
        return { candidate: mint(operands(journal(scanPass, state.id), object, null), run), complete: false, retiring: false, planning: true, consumedItems: 12 };
      }
      const m = state.retiring
        ? db.prepare("SELECT * FROM cleanup_manifests WHERE reservationId=? ORDER BY journalId,slot,leaf LIMIT 1").get(state.id) as CleanupManifest | undefined
        : db.prepare("SELECT * FROM cleanup_manifests WHERE reservationId=? AND slot=? AND leaf>=? ORDER BY leaf LIMIT 1").get(state.id, slots[state.execution], state.leaf) as CleanupManifest | undefined;
      if (!m) {
        if (state.retiring) denied();
        if (++state.execution === slots.length) state.retiring = true;
        state.leaf = ""; return { candidate: null, complete: false, retiring: false, planning: false, consumedItems: 6 };
      }
      const value = manifestValue(m); source(value, run); identity(value);
      return { candidate: mint(value, run), complete: false, retiring: state.retiring, planning: false, consumedItems: 30 };
    },
    plan(token: CustodyObservation, run: MaintenanceRun) {
      const proof = consumeCustodyObservation(token, custody, run); if (proof.kind !== "cleanup-plan") denied();
      const value = read(proof.candidate, run);
      const m = db.transaction(() => {
        const disposition = source(value, run); if (proof.pass !== pass() || value.manifest || !current?.planning) denied();
        const charge = value.object.slot === "incoming-sealed" ? value.object.chargedBytes : value.object.size;
        if (charge === null || (value.object.presence === "absent" && value.object.slot !== "incoming-sealed")) denied();
        const manifest: CleanupManifest = { reservationId: value.journal.journalId, journalId: value.journal.journalId, slot: value.object.slot, leaf: value.object.leaf, scanPass: proof.pass, expectedDevice: value.object.device, expectedInode: value.object.inode, expectedSize: value.object.size ?? 0, remainingCharge: charge, disposition, phase: "planned" };
        db.prepare("INSERT INTO cleanup_manifests(reservationId,journalId,slot,leaf,scanPass,expectedDevice,expectedInode,expectedSize,remainingCharge,disposition,phase) VALUES(@reservationId,@journalId,@slot,@leaf,@scanPass,@expectedDevice,@expectedInode,@expectedSize,@remainingCharge,@disposition,@phase)").run(manifest);
        return manifest;
      }).immediate();
      if (m.remainingCharge === 0 && value.object.presence === "present") initialZero.add(JSON.stringify([m.reservationId, m.slot, m.leaf]));
      current!.slot = m.slot; current!.leaf = m.leaf; return 25;
    },
    verify(candidate: CleanupCandidate, run: MaintenanceRun) { const value = immutable(candidate, run); identity(value); return 25; },
    rebind(token: CustodyObservation, run: MaintenanceRun) {
      const proof = consumeCustodyObservation(token, custody, run); if (proof.kind !== "cleanup-rebind") denied();
      const old = immutable(proof.candidate, run), m = old.manifest; if (!m || m.remainingCharge <= 0 || m.scanPass === proof.pass) denied();
      const next = db.transaction(() => {
        immutable(proof.candidate, run); if (proof.pass !== pass()) denied(); identity(old);
        const j = journal(proof.pass, m.journalId), o = db.prepare("SELECT * FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").get(proof.pass, m.journalId, m.slot, m.leaf) as InventoryObject;
        const value = operands(j, o, null); source(value, run);
        if (j.generation !== old.journal.generation || j.domain !== old.journal.domain || j.allowance !== old.journal.allowance || o.presence !== "present" || o.device !== m.expectedDevice || o.inode !== m.expectedInode || o.size !== m.expectedSize || o.uid !== old.object.uid || o.gid !== old.object.gid || o.mode !== old.object.mode || (o.slot === "incoming-sealed" ? o.chargedBytes : o.size) !== m.remainingCharge) denied();
        const manifest: CleanupManifest = { ...m, scanPass: proof.pass, phase: "planned" };
        if (db.prepare("DELETE FROM cleanup_manifests WHERE reservationId=? AND journalId=? AND slot=? AND leaf=?").run(m.reservationId, m.journalId, m.slot, m.leaf).changes !== 1) denied();
        db.prepare("INSERT INTO cleanup_manifests(reservationId,journalId,slot,leaf,scanPass,expectedDevice,expectedInode,expectedSize,remainingCharge,disposition,phase) VALUES(@reservationId,@journalId,@slot,@leaf,@scanPass,@expectedDevice,@expectedInode,@expectedSize,@remainingCharge,@disposition,@phase)").run(manifest);
        return { ...value, manifest: Object.freeze(manifest), run };
      }).immediate();
      candidates.set(proof.candidate, next); return 60;
    },
    initialZero(candidate: CleanupCandidate, run: MaintenanceRun) {
      const value = read(candidate, run), m = value.manifest;
      return !!m && m.scanPass === pass() && ["planned", "holders-released"].includes(m.phase) && initialZero.has(JSON.stringify([m.reservationId, m.slot, m.leaf]));
    },
    phase(token: CustodyObservation, run: MaintenanceRun) {
      const proof = consumeCustodyObservation(token, custody, run);
      if (proof.kind !== "cleanup-holders" && proof.kind !== "cleanup-absent" && proof.kind !== "cleanup-final") denied();
      const value = immutable(proof.candidate, run), old = value.manifest; if (!old) denied();
      const next = db.transaction(() => {
        immutable(proof.candidate, run); if (proof.pass !== pass()) denied(); identity(value);
        const phase = proof.kind === "cleanup-holders" ? "holders-released" : proof.kind === "cleanup-absent" ? "absent-synced" : "metadata-finalized";
        const phases = ["planned", "holders-released", "absent-synced", "metadata-finalized"];
        const nextPhase = phases.indexOf(old.phase) > phases.indexOf(phase) ? old.phase : phase;
        if (phases.indexOf(phase) > phases.indexOf(old.phase) + 1) denied();
        const remainingCharge = phase === "metadata-finalized" ? 0 : old.remainingCharge;
        db.prepare("UPDATE cleanup_manifests SET phase=?,remainingCharge=? WHERE reservationId=? AND journalId=? AND slot=? AND leaf=?").run(nextPhase, remainingCharge, old.reservationId, old.journalId, old.slot, old.leaf);
        return { ...old, phase: nextPhase as CleanupManifest["phase"], remainingCharge };
      }).immediate();
      candidates.set(proof.candidate, { ...value, manifest: Object.freeze(next) });
      if (proof.kind === "cleanup-final") current!.leaf = old.leaf + "\0";
      return 50;
    },
    retire(token: CustodyObservation, run: MaintenanceRun) {
      const proof = consumeCustodyObservation(token, custody, run); if (proof.kind !== "cleanup-retire") denied();
      const value = immutable(proof.candidate, run), m = value.manifest;
      if (!m || m.phase !== "metadata-finalized" || m.remainingCharge !== 0 || !current?.retiring) denied();
      const last = db.transaction(() => {
        immutable(proof.candidate, run); if (proof.pass !== pass()) denied();
        const rows = db.prepare("SELECT journalId,slot,leaf FROM cleanup_manifests WHERE reservationId=? ORDER BY journalId,slot,leaf LIMIT 2").all(m.reservationId);
        if (db.prepare("SELECT 1 FROM reservations WHERE cleanupWinner=? LIMIT 1").get(m.reservationId)) denied();
        if (db.prepare("DELETE FROM cleanup_manifests WHERE reservationId=? AND journalId=? AND slot=? AND leaf=?").run(m.reservationId, m.journalId, m.slot, m.leaf).changes !== 1) denied();
        if (rows.length === 1) {
          if (db.prepare("DELETE FROM reservations WHERE id=? AND active=1 AND custodyStarted=1").run(m.reservationId).changes !== 1) denied();
          advanceCursor(m.reservationId);
          return true;
        }
        return false;
      }).immediate();
      initialZero.delete(JSON.stringify([m.reservationId, m.slot, m.leaf]));
      if (last) current = undefined; return 40;
    },
    restart() { current = undefined; preflight = ["", "", "", ""]; preflightComplete = false; },
    selectPrune(run: MaintenanceRun) {
      check(run);
      const stream = (db.prepare("SELECT prunePhase FROM cleanup_maintenance WHERE singleton=1").get() as { prunePhase: number }).prunePhase;
      const cursor = db.prepare("SELECT scanPass,journalId,slot,leaf,root FROM cleanup_prune_cursors WHERE stream=?").get(stream) as PruneRecord["cursor"];
      const row = (stream === 0
        ? db.prepare("SELECT * FROM erasure_inventory_objects WHERE (pass,journalId,slot,leaf)>(?,?,?,?) ORDER BY pass,journalId,slot,leaf LIMIT 1").get(cursor.scanPass, cursor.journalId, cursor.slot, cursor.leaf)
        : stream === 1 ? db.prepare("SELECT * FROM erasure_inventory_journals WHERE (pass,journalId)>(?,?) ORDER BY pass,journalId LIMIT 1").get(cursor.scanPass, cursor.journalId)
          : db.prepare("SELECT * FROM erasure_scans WHERE (pass,root)>(?,?) ORDER BY pass,root LIMIT 1").get(cursor.scanPass, cursor.root)) as PruneRow | undefined;
      if (row) selectMaintenance(run, repository, row.journalId ? `reservation:${row.journalId}` : `scan:${row.pass}`);
      const candidate = Object.freeze({}) as CleanupPruneCandidate, value = { stream, cursor, row, run };
      pruning.set(candidate, value);
      const purpose = prunePurpose(value);
      return { candidate, ...purpose, examined: row ? 1 : 0, consumedItems: 40 };
    },
    prune(token: CustodyObservation, run: MaintenanceRun) {
      const proof = consumeCustodyObservation(token, custody, run);
      if (proof.kind !== "cleanup-prune-released" && proof.kind !== "cleanup-prune-duplicate" && proof.kind !== "cleanup-prune-blocked" && proof.kind !== "cleanup-prune-scan") denied();
      const value = pruning.get(proof.candidate); if (!value || value.run !== run) denied(); check(run);
      const removed = db.transaction(() => {
        if (proof.pass !== pass()) denied();
        const phase = (db.prepare("SELECT prunePhase FROM cleanup_maintenance WHERE singleton=1").get() as { prunePhase: number }).prunePhase;
        const cursor = db.prepare("SELECT scanPass,journalId,slot,leaf,root FROM cleanup_prune_cursors WHERE stream=?").get(value.stream);
        if (phase !== value.stream || JSON.stringify(cursor) !== JSON.stringify(value.cursor)) denied();
        const purpose = prunePurpose(value), row = value.row;
        let removed = 0;
        const allowed = (proof.kind === "cleanup-prune-released" && purpose.kind === "released-intake") || (proof.kind === "cleanup-prune-duplicate" && purpose.kind === "duplicate") || (proof.kind === "cleanup-prune-scan" && purpose.kind === "scan");
        if (allowed && row) {
          if (value.stream === 0) removed = db.prepare("DELETE FROM erasure_inventory_objects WHERE pass=? AND journalId=? AND slot=? AND leaf=?").run(row.pass, row.journalId, row.slot, row.leaf).changes;
          else if (value.stream === 1) removed = db.prepare("DELETE FROM erasure_inventory_journals WHERE pass=? AND journalId=?").run(row.pass, row.journalId).changes;
          else removed = db.prepare("DELETE FROM erasure_scans WHERE pass=? AND root=?").run(row.pass, row.root).changes;
        }
        db.prepare("UPDATE cleanup_prune_cursors SET scanPass=?,journalId=?,slot=?,leaf=?,root=? WHERE stream=?").run(row?.pass ?? "", row?.journalId ?? "", row?.slot ?? "", row?.leaf ?? "", row?.root ?? "", value.stream);
        db.prepare("UPDATE cleanup_maintenance SET prunePhase=? WHERE singleton=1").run((value.stream + 1) % 3);
        return removed;
      }).immediate();
      pruning.delete(proof.candidate); return { removed, consumedItems: 50 };
    },
  });
}
