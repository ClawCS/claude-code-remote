import { constants, type Stats } from "node:fs";
import { lstat, open, opendir, unlink, rmdir } from "node:fs/promises";
import type { Dir } from "node:fs";
import { dirname, join, sep } from "node:path";
import type { ApplicationRepository, CustodyConfig, CustodyLedger, IngressEvidence, IngressLease, Instant, Reservation } from "./types";
import { checkIncomingRoot, checkPrivateRoot } from "./crypto";
import { assertMaintenance, assertMaintenanceCustodyIdentity, assertMaintenanceSettled, assertOriginalMaintenanceCustody, closeCustodyHandle, closeMaintenanceScanIterators, maintenanceCommand, maintenanceRemaining, observeCustodyHandle, type MaintenanceRun } from "./worker-maintenance";
import { erasureOwner } from "./erasure-repository";
import type { InventoryObject, InventoryJournal, AcceptedCandidate } from "./erasure-storage";
import { createAcceptedErasure, type AcceptedHooks } from "./custody-accepted-erasure";

export interface CustodyJournal {
  version: 1 | 2 | 3; id: string; kind: "intake" | "processing" | "artifact"; state: "reserved" | "committed" | "orphan";
  path: string; workerPath?: string; budget: number; cleanupAfter: Instant; reservation?: Reservation; caseId?: string;
  lease?: IngressLease; release?: "pending" | "released"; settlement?: "expired" | "drain"; artifactKind?: "bundle" | "mime";
}
type Root = InventoryObject["root"];
declare const observationBrand: unique symbol;
export interface CustodyObservation { readonly [observationBrand]: true }
export type Observation = Readonly<
  { kind: "root-open"; pass: string; root: Root } |
  { kind: "root-eof"; pass: string; root: Root } |
  { kind: "invalidate"; pass: string } |
  { kind: "accepted-plan" | "accepted-rebind" | "accepted-holders" | "accepted-absent" | "accepted-final"; pass: string; candidate: AcceptedCandidate } |
  { kind: "accepted-recovery"; pass: string; candidate: AcceptedCandidate; object: InventoryObject } |
  { kind: "recovered-native"; pass: string; root: Root; object: InventoryObject } |
  { kind: "object" | "incoming-lease-slot"; pass: string; root: Root; journal: CustodyJournal; object: InventoryObject }
>;
const observations = new WeakMap<CustodyObservation, { repository: ApplicationRepository; custody: CustodyLedger; run: MaintenanceRun; value: Observation }>();
// Fixed evidence consumer, not a DTO factory. Only original custody below mints.
export function consumeCustodyObservation(token: CustodyObservation, custody: CustodyLedger, run: MaintenanceRun): Observation {
  const value = observations.get(token);
  if (!value || value.custody !== custody || value.run !== run) throw new Error("ERASURE_OBSERVATION_INVALID");
  try { assertMaintenanceCustodyIdentity(run, value.repository, custody); } catch { throw new Error("ERASURE_OBSERVATION_INVALID"); }
  observations.delete(token); return value.value;
}
export interface CustodyErasure {
  scanBatch(run: MaintenanceRun): Promise<Readonly<{ complete: boolean; consumedItems: number }>>;
  eraseScopeBatch(commitEventId: string, run: MaintenanceRun): Promise<Readonly<{ complete: boolean; consumedItems: number }>>;
  invalidateAndClose(run: MaintenanceRun): Promise<Readonly<{ consumedItems: number }>>;
}
const owners = new WeakMap<CustodyLedger, CustodyErasure>();
export function custodyErasureOwner(custody: CustodyLedger): CustodyErasure {
  const owner = owners.get(custody); if (!owner) throw new Error("ERASURE_UNAVAILABLE"); return owner;
}
interface Hooks extends AcceptedHooks {
  exclusive<T>(action: () => Promise<T>): Promise<T>;
  track<T>(action: () => Promise<T>): Promise<T>;
  decodeJournal(bytes: Buffer): CustodyJournal;
  observeIngress(entry: CustodyJournal): Promise<IngressEvidence>;
}
interface Iterator { dir: Dir; root: Root; path: string; identity: Stats; parent?: CustodyJournal; recovered?: Readonly<InventoryJournal>; count: number; pending?: string }
function fail(code: string): never { throw new Error(code); }
function same(a: Stats, b: Stats, links = true): boolean { return a.dev === b.dev && a.ino === b.ino && a.mode === b.mode && a.uid === b.uid && a.gid === b.gid && (!links || a.nlink === b.nlink); }
function objectStats(stat: Stats) {
  return { device: stat.dev, inode: stat.ino, size: stat.size, type: stat.isDirectory() ? "directory" as const : "file" as const, uid: stat.uid, gid: stat.gid, mode: stat.mode & 0o7777, nlink: stat.nlink };
}

// Composed exactly once, synchronously inside the original custody constructor.
// It borrows that custody's queue, descriptor observer and immutable config.
export function bindCustodyErasure(custody: CustodyLedger, repository: ApplicationRepository, config: CustodyConfig, hooks: Hooks) {
  if (owners.has(custody)) fail("ERASURE_ALREADY_OWNED");
  assertOriginalMaintenanceCustody(custody, repository, config);
  const storage = erasureOwner(repository).bindCustody(custody, config);
  const roots = ["custody", "incoming", "runtime"] as const;
  const paths = { custody: config.custodyRoot, incoming: config.intakeRoot, runtime: config.runtimeRoot };
  const identities = new Map<string, Stats>();
  const failedCloses = new Set<Iterator>();
  let iterator: Iterator | undefined, child: Iterator | undefined, pass: string | undefined, index = 0, invalid = false, invalidated = false;
  // One outstanding reservation, never a bank of five-credit grants. Its run
  // identifies the admitting operation that already paid, including across a
  // dormant continuation; a successor does not receive a fresh allowance.
  let finishing: { readonly run: MaintenanceRun; readonly pass: string } | undefined;
  const depth = (path: string) => { let n = 0; for (; path !== dirname(path); path = dirname(path)) n++; return n; };
  const ancestryMaximum = roots.reduce((n, root) => n + depth(paths[root]), 0);
  // At most three ancestry walks, iterator stat/read2, journal open/stat/read/stat/pathstat/
  // close6 + decode1, ingress observe/validation2, object stat1, storage<=20,
  // child open/recheck2, EOF close1; failure denial3 and at most2 closes.
  // A live intake journal additionally probes its fixed incoming slot: two
  // native stats, observe+validation, and the existing <=20-credit writer.
  const entryMaximum = 3 * ancestryMaximum + 64;
  function mint(run: MaintenanceRun, value: Observation): CustodyObservation {
    const token = Object.freeze({}) as CustodyObservation;
    observations.set(token, { repository, custody, run, value: Object.freeze(value) }); return token;
  }
  async function close(target: Iterator, io: <T>(action: () => Promise<T>) => Promise<T>) {
    try { await io(() => target.dir.close()); failedCloses.delete(target); if (child === target) child = undefined; if (iterator === target) iterator = undefined; }
    catch (error) { failedCloses.add(target); throw error; }
  }
  async function checkRoots(io: <T>(action: () => Promise<T>) => Promise<T>) {
    // Shared ancestors may gain unrelated sibling directories. Their inode,
    // type, permissions and ownership still must match; nlink is meaningful
    // for our three dedicated roots, not the entire shared ancestor domain.
    for (const [path, expected] of identities) if (!same(expected, await io(() => lstat(path)), roots.some(root => paths[root] === path))) fail("ERASURE_ROOT_CHANGED");
  }
  function invalidate(run: MaintenanceRun): number {
    invalid = true;
    if (!pass || invalidated) return 0;
    const count = storage.invalidate(mint(run, { kind: "invalidate", pass }), run);
    invalidated = true; return count;
  }
  async function closeIterators(): Promise<number> {
    return hooks.track(() => hooks.exclusive(async () => {
      if (!invalid || (pass && !invalidated)) fail("ERASURE_ROOT_CHANGED");
      let consumed = 0, error: unknown;
      const io = async <T>(action: () => Promise<T>) => { consumed++; return action(); };
      for (const target of [child, iterator]) if (target) try { await close(target, io); } catch (caught) { error = caught; }
      if (error) throw error;
      return consumed;
    }));
  }
  async function finishFailure(run: MaintenanceRun, error: unknown): Promise<never> {
    try {
      await hooks.exclusive(async () => {
        if (!finishing) return;
        if (finishing.pass !== pass) fail("MAINTENANCE_COMMAND_FAILED");
        finishing = undefined; // Spend once, even if a write or actual close fails.
        invalidate(run); // Exactly three fixed-key writes; no query or new work.
        const io = <T>(operation: () => Promise<T>) => operation();
        for (const target of [child, iterator]) if (target && !failedCloses.has(target)) try { await close(target, io); } catch { /* Exact failed resource remains retained for charged R105 retry. */ }
      });
    } catch { fail("MAINTENANCE_COMMAND_FAILED"); }
    throw error;
  }
  // Keep the complete admitted step (including post-command denial/close) in
  // the original custody lifetime. Five finishing credits remain charged even
  // on success, and replace (never accumulate with) any prior unspent funding.
  function step(run: MaintenanceRun, maximum: number, action: () => Promise<{ value: boolean; consumedItems: number }>) {
    return hooks.track(async () => {
      try {
        return await maintenanceCommand(run, repository, maximum, "filesystem", () => {
          finishing = { run, pass: pass! };
          return hooks.exclusive(action).then(result => ({ ...result, consumedItems: result.consumedItems + 5 }));
        });
      } catch (error) {
        return finishFailure(run, error);
      }
    });
  }
  async function readJournal(id: string, path: string, io: <T>(action: () => Promise<T>) => Promise<T>): Promise<CustodyJournal> {
    const fd = observeCustodyHandle(await io(() => open(path, constants.O_RDONLY | constants.O_NOFOLLOW)));
    try {
      const before = await io(() => fd.stat());
      if (!before.isFile() || before.nlink !== 1 || before.uid !== process.getuid?.() || (before.mode & 0o7777) !== 0o600 || before.size > 4096) fail("ERASURE_JOURNAL_INVALID");
      const buffer = Buffer.alloc(4097), read = await io(() => fd.read(buffer, 0, buffer.length, 0));
      const after = await io(() => fd.stat());
      const atPath = await io(() => lstat(path));
      // Short native reads block rather than creating an uncharged retry loop.
      if (read.bytesRead !== before.size || !same(before, after) || !same(before, atPath) || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) fail("ERASURE_JOURNAL_INVALID");
      let entry: CustodyJournal; try { entry = await io(async () => hooks.decodeJournal(buffer.subarray(0, read.bytesRead))); } catch { fail("ERASURE_JOURNAL_INVALID"); }
      if (entry.id !== id) fail("ERASURE_ASSOCIATION_INVALID");
      if (entry.kind === "intake" && !entry.lease) fail("INGRESS_RECOVERY_REQUIRED");
      return entry;
    } finally { await io(() => closeCustodyHandle(fd)); }
  }
  async function observe(target: Iterator, name: string, run: MaintenanceRun, io: <T>(action: () => Promise<T>) => Promise<T>) {
    let id: string, slot: InventoryObject["slot"], leaf = "", entry: CustodyJournal | undefined;
    const live = async (id: string, path: string) => {
      try { return await readJournal(id, path, io); }
      catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
        try { await io(() => lstat(path)); }
        catch (absent) { if (absent instanceof Error && "code" in absent && absent.code === "ENOENT") return undefined; throw absent; }
        fail("ERASURE_JOURNAL_INVALID");
      }
    };
    if (target.parent || target.recovered) {
      if (!/^(?:[0-4]\.data|document-[1-5]\.(?:pdf|jpg|png))$/.test(name) || target.count >= 20) fail("ERASURE_UNKNOWN_OBJECT");
      id = target.parent?.id ?? target.recovered!.journalId; slot = "processing-file"; leaf = name; entry = await live(id, join(config.custodyRoot, `${id}.journal`));
      if (target.parent && JSON.stringify(entry) !== JSON.stringify(target.parent)) fail("ERASURE_ASSOCIATION_INVALID");
    } else {
      const match = /^([a-f0-9-]{36})(.*)$/.exec(name); if (!match) fail("ERASURE_UNKNOWN_OBJECT");
      id = match[1]; const suffix = match[2];
      if (target.root === "incoming" && suffix === ".enc") slot = "incoming-sealed";
      else if (target.root === "runtime" && suffix === "") slot = "processing-directory";
      else if (target.root === "custody" && suffix === ".journal") slot = "journal";
      else if (target.root === "custody" && /^\.journal\.[a-f0-9-]{36}\.tmp$/.test(suffix)) { slot = "journal-temp"; leaf = suffix.slice(9, -4); }
      else if (target.root === "custody" && suffix === ".enc") slot = "original-sealed";
      else if (target.root === "custody" && /^\.(bundle|mime)\.(staging|enc)$/.test(suffix)) slot = suffix.endsWith(".staging") ? "artifact-staging" : "artifact-sealed";
      else fail("ERASURE_UNKNOWN_OBJECT");
      entry = await live(id, join(config.custodyRoot, slot === "journal-temp" ? name : `${id}.journal`));
      if (entry && (slot === "artifact-staging" || slot === "artifact-sealed") && suffix !== `.${entry.artifactKind}.${slot === "artifact-staging" ? "staging" : "enc"}`) fail("ERASURE_ASSOCIATION_INVALID");
    }
    const path = join(target.path, name), stat = await io(() => lstat(path));
    if (stat.isSymbolicLink() || (slot === "processing-directory" ? !stat.isDirectory() : !stat.isFile())) fail("ERASURE_OWNERSHIP_INVALID");
    if (!entry) {
      if (slot === "journal" || slot === "journal-temp") fail("ERASURE_JOURNAL_INVALID");
      const recovered = storage.recoveredEntry(id, slot, leaf, run), value = recovered.value;
      const object: InventoryObject = { ...value.object, presence: "present", ...objectStats(stat) };
      if (join(paths[object.root], value.relativePath) !== path) fail("ERASURE_ASSOCIATION_INVALID");
      if (value.journal.kind === "intake") {
        const evidence = await io(() => hooks.ingress(value.journal, "observe"));
        if (slot === "incoming-sealed") Object.assign(object, { leaseState: evidence.state, chargedBytes: evidence.chargedBytes, leaseDevice: evidence.object?.dev ?? null, leaseInode: evidence.object?.ino ?? null });
      }
      const result = storage.record(mint(run, { kind: "recovered-native", pass: pass!, root: target.root, object }), run);
      result.consumedItems += recovered.consumedItems;
      if (slot === "processing-directory") {
        child = { dir: await io(() => opendir(path, { bufferSize: 1 })), root: "runtime", path, identity: stat, recovered: value.journal, count: 0 };
        if (!same(stat, await io(() => lstat(path)))) fail("ERASURE_ROOT_CHANGED");
      }
      target.count++; return result;
    }
    let lease: IngressEvidence | undefined;
    if (entry.kind === "intake") {
      const evidence = await io(() => hooks.observeIngress(entry));
      await io(async () => { if (slot === "incoming-sealed" && (!evidence.object || evidence.object.dev !== stat.dev || evidence.object.ino !== stat.ino)) fail("ERASURE_ASSOCIATION_INVALID"); });
      if (slot === "incoming-sealed") lease = evidence;
    }
    const object: InventoryObject = { pass: pass!, journalId: id, slot, leaf, root: target.root, presence: "present", ...objectStats(stat), leaseState: lease?.state ?? null, chargedBytes: lease?.chargedBytes ?? null, leaseDevice: lease?.object?.dev ?? null, leaseInode: lease?.object?.ino ?? null };
    const result = storage.record(mint(run, { kind: "object", pass: pass!, root: target.root, journal: entry, object }), run);
    if ("deferred" in result && result.deferred) return result;
    if (slot === "journal" && entry.kind === "intake") {
      const inspect = async () => {
        try { return await io(() => lstat(entry.path)); }
        catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined; throw error; }
      };
      const before = await inspect(), evidence = await io(() => hooks.observeIngress(entry)), after = await inspect();
      await io(async () => {
        if (!!before !== !!after || (before && after && (!same(before, after) || before.size !== after.size)) ||
          (after ? !evidence.object || evidence.object.dev !== after.dev || evidence.object.ino !== after.ino : evidence.object !== null)) fail("ERASURE_OWNERSHIP_INVALID");
      });
      const incoming: InventoryObject = { pass: pass!, journalId: id, slot: "incoming-sealed", leaf: "", root: "incoming",
        presence: after ? "present" : "absent", ...(after ? objectStats(after) : { device: null, inode: null, size: null, type: null, uid: null, gid: null, mode: null, nlink: null }),
        leaseState: evidence.state, chargedBytes: evidence.chargedBytes, leaseDevice: evidence.object?.dev ?? null, leaseInode: evidence.object?.ino ?? null };
      const recorded = storage.record(mint(run, { kind: "incoming-lease-slot", pass: pass!, root: "incoming", journal: entry, object: incoming }), run);
      if ("deferred" in recorded && recorded.deferred) return { ...recorded, consumedItems: result.consumedItems + recorded.consumedItems };
      result.consumedItems += recorded.consumedItems;
    }
    if (slot === "processing-directory") {
      child = { dir: await io(() => opendir(path, { bufferSize: 1 })), root: "runtime", path, identity: stat, parent: entry, count: 0 };
      if (!same(stat, await io(() => lstat(path)))) fail("ERASURE_ROOT_CHANGED");
    }
    target.count++;
    return result;
  }
  const accepted = createAcceptedErasure({ custody, repository, config, storage, hooks, ancestryMaximum, mint,
    checkCoverage() { if (!pass || index !== roots.length || !storage.recoveryReady() || invalid || iterator || child || failedCloses.size) fail("ERASURE_ROOT_CHANGED"); },
    async remove(candidate, run, io) {
      const value = storage.readAccepted(candidate, run), path = join(paths[value.object.root], value.relativePath), parentPath = dirname(path);
      const before = await io(() => lstat(parentPath)), captured = identities.get(parentPath);
      if (captured && !same(captured, before)) fail("ERASURE_ROOT_CHANGED");
      assertMaintenance(run, repository, "filesystem");
      try { await io(() => value.object.slot === "processing-directory" ? rmdir(path) : unlink(path)); }
      finally {
        let absent = false;
        try { await io(() => lstat(path)); }
        catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") absent = true; else throw error; }
        const after = await io(() => lstat(parentPath));
        if (!same(before, after, false) || after.size > before.size || (after.nlink !== before.nlink && (!absent || after.nlink !== before.nlink - 1))) fail("ERASURE_ROOT_CHANGED");
        assertMaintenance(run, repository);
        // Only this native operation's verified parent change is absorbed.
        // macOS counts regular entries too; Linux may leave nlink unchanged.
        if (captured && absent) identities.set(parentPath, after);
      }
    },
    async coverage(run, io) {
      assertMaintenance(run, repository, "filesystem");
      if (!pass || index !== roots.length || !storage.recoveryReady() || invalid || iterator || child || failedCloses.size) fail("ERASURE_ROOT_CHANGED");
      const current = await io(async () => storage.pass());
      await io(async () => { if (current !== pass) fail("ERASURE_ROOT_CHANGED"); });
      await checkRoots(io); assertMaintenance(run, repository); return pass;
    },
  });
  const owner: CustodyErasure = Object.freeze({
    eraseScopeBatch: accepted.eraseScopeBatch,
    async scanBatch(run: MaintenanceRun) {
      // Invalid/stale/foreign callers must never reach another scan's denial.
      assertMaintenanceCustodyIdentity(run, repository, custody);
      try { assertMaintenanceSettled(run, repository); }
      catch (error) { return hooks.track(() => finishFailure(run, error)); }
      return hooks.track(async () => { try {
      if (invalid || failedCloses.size) fail("ERASURE_ROOT_CHANGED");
      let consumedItems = 0;
      if (!pass) {
        const result = await maintenanceCommand(run, repository, 7, "filesystem", () => {
          pass = storage.pass();
          finishing = { run, pass };
          return { value: pass, consumedItems: 7 };
        });
        consumedItems += result.consumedItems;
      }
      let checkedComplete = false;
      while (index < roots.length || !checkedComplete) {
        if (invalid || failedCloses.size) fail("ERASURE_ROOT_CHANGED");
        if (maintenanceRemaining(run, repository).selections === 0) break;
        const root = roots[index], maximum = !identities.size ? 4 * ancestryMaximum + 10 : entryMaximum;
        if (maintenanceRemaining(run, repository).items < maximum) break;
        const result = await step(run, maximum, async () => {
          if (invalid || failedCloses.size) fail("ERASURE_ROOT_CHANGED");
          let consumed = 0;
          const io = async <T>(action: () => Promise<T>): Promise<T> => { consumed++; return action(); };
          assertMaintenance(run, repository, "filesystem");
            if (!identities.size) {
              for (const a of roots) for (const b of roots) if (a !== b && (paths[a] === paths[b] || paths[a].startsWith(paths[b] + sep))) fail("ERASURE_ROOT_CHANGED");
              for (const name of roots) {
                consumed += depth(paths[name]) + (name === "incoming" ? 1 : 0);
                if (name === "incoming") await checkIncomingRoot(paths[name], config.intakeUid, config.sharedGid); else await checkPrivateRoot(paths[name]);
                for (let path = paths[name]; path !== dirname(path); path = dirname(path)) if (!identities.has(path)) {
                  const identity = await io(() => lstat(path));
                  if (!identity.isDirectory() || identity.isSymbolicLink()) fail("ERASURE_ROOT_CHANGED");
                  identities.set(path, identity);
                }
                consumed += depth(paths[name]) + (name === "incoming" ? 1 : 0);
                if (name === "incoming") await checkIncomingRoot(paths[name], config.intakeUid, config.sharedGid); else await checkPrivateRoot(paths[name]);
              }
              await checkRoots(io);
              assertMaintenance(run, repository);
              return { value: false, consumedItems: consumed };
            }
            await checkRoots(io);
            if (!storage.recoveryReady()) {
              const selected = storage.nextRecovery(run); consumed += selected.consumedItems;
              if (selected.candidate) {
                const value = storage.readAccepted(selected.candidate, run), path = join(paths[value.object.root], value.relativePath);
                const inspect = async () => {
                  try { return await io(() => lstat(path)); }
                  catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined; throw error; }
                };
                const before = await inspect();
                const evidence = value.journal.kind === "intake" ? await io(() => hooks.ingress(value.journal, "observe")) : undefined;
                const after = await inspect();
                await io(async () => { if (!!before !== !!after || (before && after && (!same(before, after) || before.size !== after.size))) fail("ERASURE_OWNERSHIP_INVALID"); });
                const incoming = value.object.slot === "incoming-sealed";
                const object: InventoryObject = { ...value.object, pass: pass!, presence: after ? "present" : "absent",
                  ...(after ? objectStats(after) : { device: null, inode: null, size: null, type: null, uid: null, gid: null, mode: null, nlink: null }),
                  leaseState: incoming ? evidence!.state : null, chargedBytes: incoming ? evidence!.chargedBytes : null, leaseDevice: incoming ? evidence!.object?.dev ?? null : null, leaseInode: incoming ? evidence!.object?.ino ?? null : null };
                consumed += storage.recordRecovery(mint(run, { kind: "accepted-recovery", pass: pass!, candidate: selected.candidate, object }), run);
              }
              await checkRoots(io); assertMaintenance(run, repository);
              return { value: false, consumedItems: consumed };
            }
            if (index === roots.length) { assertMaintenance(run, repository); checkedComplete = true; return { value: false, consumedItems: consumed }; }
            if (!iterator) {
              const identity = await io(() => lstat(paths[root]));
              iterator = { dir: await io(() => opendir(paths[root], { bufferSize: 1 })), root, path: paths[root], identity, count: 0 };
              if (!same(identity, await io(() => lstat(paths[root])))) { invalid = true; fail("ERASURE_ROOT_CHANGED"); }
              await checkRoots(io); assertMaintenance(run, repository);
              consumed += storage.record(mint(run, { kind: "root-open", pass: pass!, root }), run).consumedItems;
            } else {
              const current = child ?? iterator;
              if (!same(current.identity, await io(() => lstat(current.path)))) { invalid = true; fail("ERASURE_ROOT_CHANGED"); }
              const entry = current.pending ? { name: current.pending } : await io(() => current.dir.read());
              assertMaintenance(run, repository);
              if (entry) {
                current.pending = entry.name;
                const observed = await observe(current, entry.name, run, io); consumed += observed.consumedItems;
                if ("deferred" in observed && observed.deferred) return { value: true, consumedItems: consumed };
                current.pending = undefined;
              }
              else {
                const nested = current === child;
                await close(current, io);
                await checkRoots(io); assertMaintenance(run, repository);
                if (!nested) { consumed += storage.record(mint(run, { kind: "root-eof", pass: pass!, root }), run).consumedItems; index++; }
              }
            }
            await checkRoots(io);
            assertMaintenance(run, repository);
            return { value: false, consumedItems: consumed };
        });
        consumedItems += result.consumedItems;
        if (result.value) break;
      }
      return Object.freeze({ complete: index === roots.length && checkedComplete && !invalid, consumedItems });
      } catch (error) { return finishFailure(run, error); } });
    },
    async invalidateAndClose(run: MaintenanceRun) {
      assertMaintenanceCustodyIdentity(run, repository, custody);
      // Track the whole boundary, including rejection before normal admission.
      // This is custody lifetime tracking, not an extra pending maintenance
      // command: R105 must still check all prior commands without self-blocking.
      return hooks.track(async () => {
        try {
          let consumedItems = 0;
          if (!invalidated) {
            const result = await maintenanceCommand(run, repository, 3, "filesystem", () => hooks.exclusive(async () => ({ value: undefined, consumedItems: invalidate(run) })));
            consumedItems += result.consumedItems;
          }
          const result = await closeMaintenanceScanIterators(run, custody);
          return Object.freeze({ consumedItems: consumedItems + result.consumedItems });
        } catch (error) { return finishFailure(run, error); }
      });
    },
  });
  owners.set(custody, owner);
  return Object.freeze({ idle: () => failedCloses.size === 0 && accepted.idle(), closeReady: () => !iterator && !child && failedCloses.size === 0 && accepted.idle(), closeIterators, finishAcceptedResources: accepted.finishResources });
}
