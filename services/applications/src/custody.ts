import { createHash, randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { constants } from "node:fs";
import { mkdir, open, rmdir, unlink, lstat, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import type { ApplicationRepository, ApplicationId, ArtifactRecord, CommittedIntake, PrivateSnapshot, WorkerKeys, ProcessingSnapshot, CustodyLedger, CustodyInventory, CustodyConfig, IngressLease, IngressEvidence, Acceptance } from "./types";
import { applicationId, digest, utcInstant } from "./types";
import { checkPrivateRoot, checkIncomingRoot, openPrivateFile, decodePayload, decryptEnvelope, payloadDigest, syncRoot, intakePath, MAX_SEALED_BYTES, readBoundedFile, strictObject } from "./crypto";
import { ARTIFACT_METADATA_RESERVE, artifactLimit, OUTPUT_RESERVE, SCRATCH_RESERVE, storageBudget } from "./storage-budget";
import { openArtifactHandle, readArtifactFile } from "./artifact-crypto";
import { submissionKind } from "./intake-admission";
import { registerMaintenanceCustody, withCustodyResourceTracking, observeCustodyHandle, closeCustodyHandle } from "./worker-maintenance";
import type { FileHandle } from "node:fs/promises";
import { custodyUnwindOwner } from "./repository";
import { bindCustodyErasure, type CustodyJournal } from "./custody-erasure";
import type { InventoryJournal } from "./erasure-storage";
import { bindCleanupSource } from "./cleanup-storage";

// Dedicated incoming, custody and runtime roots; never the registry directory.
const PHYSICAL_CAP = 250 * 1024 * 1024;
const JOURNAL_HEADROOM = 8192;
type Journal = CustodyJournal;
const scopeReaders = new WeakMap<CustodyLedger["beginProcessing"], <T>(action: () => Promise<T>) => Promise<T>>();
export function createCustodyLedger(repo: ApplicationRepository, config: CustodyConfig): CustodyLedger {
  config = Object.freeze({ ...config });
  const ingressObserve = config.ingressAuthority?.observe;
  const ingressQuiesce = config.ingressAuthority?.quiesce, ingressReleased = config.ingressAuthority?.released;
  const ingressPort = config.ingressAuthority, ingressAssurance = ingressPort?.assurance;
  const unwind = custodyUnwindOwner(repo);
  const entries = new Map<string, Journal>();
  let privateRevision = 0;
  const intakeOwners = new Set<string>();
  const processingOwners = new Set<string>();
  const scopeContext = new AsyncLocalStorage<{id:ApplicationId;path:string;active:boolean}>();
  let ready = false, reconciled = false, ingressBlocked = false, queue = Promise.resolve(), inhibited = false;
  const lifetimes = new Set<Promise<unknown>>();
  // Producer completion and actual resource release are independent. Failed
  // close/cleanup identities remain here after the producer promise rejects.
  const handles = new Set<FileHandle>();
  const unresolvedReleases = new Set<string>();
  // In-memory milestones of the original admitted processing cleanup only.
  // An absent pathname cannot discharge a previously failed durability step.
  const pendingProcessingSync = new Set<string>();
  const unlinkedProcessingJournals = new Set<string>();
  const resourceObserver = { acquired: (handle: FileHandle) => { handles.add(handle); }, released: (handle: FileHandle) => { handles.delete(handle); } };
  const processingLifetimes = new Map<string, { done: Promise<void>; finish(): void }>();
  function track<T>(action: () => Promise<T>): Promise<T> {
    const promise = withCustodyResourceTracking(resourceObserver, async () => action()); lifetimes.add(promise);
    void promise.then(() => lifetimes.delete(promise), () => lifetimes.delete(promise));
    return promise;
  }
  const incoming = { uid: config.intakeUid, gid: config.sharedGid };
  const now = () => utcInstant(config.clock.now().toISOString());
  const tomorrow = () => utcInstant(new Date(config.clock.now().getTime() + 86400000).toISOString());
  const metadataPath = (id: string) => join(config.custodyRoot, `${id}.journal`);
  const rootFor = (entry: Journal) => entry.kind === "intake" ? config.intakeRoot : entry.kind === "processing" ? config.runtimeRoot : config.custodyRoot;
  const ownedPath = (entry: Journal) => entry.kind === "processing" ? join(config.runtimeRoot, entry.id) : entry.kind === "artifact" ? join(config.custodyRoot, `${entry.id}.${entry.artifactKind}.staging`) : intakePath(rootFor(entry), entry.id);
  const scopeName = (name:string) => /^[0-4]\.data$/.test(name) || /^document-[1-5]\.(pdf|jpg|png)$/.test(name);
  function authority() {
    const port = config.ingressAuthority;
    if (!port || port.assurance === "unavailable" || (port.assurance === "local-test" && process.env.NODE_ENV !== "test")) throw new Error("INGRESS_AUTHORITY_UNAVAILABLE");
    return port;
  }
  function validateEvidence(entry: Journal, evidence: IngressEvidence): IngressEvidence {
    const lease = entry.lease;
    if (!lease || JSON.stringify(evidence.lease) !== JSON.stringify(lease) || !["prepared", "bounded", "quiescent", "released"].includes(evidence.state) || !Number.isSafeInteger(evidence.chargedBytes) || evidence.chargedBytes < 0 || evidence.chargedBytes > lease.allowance || (evidence.state === "released" && (evidence.chargedBytes !== 0 || evidence.object !== null))) throw new Error("INGRESS_AUTHORITY_MISMATCH");
    return evidence;
  }
  function originalIngress() {
    const port = authority();
    if (port !== ingressPort || port.assurance !== ingressAssurance || port.observe !== ingressObserve || port.quiesce !== ingressQuiesce || port.released !== ingressReleased) throw new Error("INGRESS_RECOVERY_REQUIRED");
    return port;
  }
  async function observeSource(entry: Journal) {
    if (!entry.lease || !ingressObserve) throw new Error("INGRESS_RECOVERY_REQUIRED");
    const originalObservation = () => {
      const port = authority();
      if (port !== ingressPort || port.assurance !== ingressAssurance || port.observe !== ingressObserve) throw new Error("INGRESS_RECOVERY_REQUIRED");
      return port;
    };
    const evidence = await ingressObserve.call(originalObservation(), entry.lease); originalObservation();
    return validateEvidence(entry, evidence);
  }
  async function acceptedIngress(journal: Readonly<InventoryJournal>, operation: "observe" | "quiesce" | "released"): Promise<IngressEvidence> {
    if (journal.kind !== "intake" || journal.reservationId !== journal.journalId || !journal.generation || !journal.domain || !journal.allowance) throw new Error("INGRESS_RECOVERY_REQUIRED");
    const lease: IngressLease = { reservationId: journal.journalId, path: intakePath(config.intakeRoot, journal.journalId), allowance: journal.allowance, generation: journal.generation, domain: journal.domain };
    try {
      const port = originalIngress(), method = operation === "observe" ? ingressObserve : operation === "quiesce" ? ingressQuiesce : ingressReleased;
      if (!method) throw new Error();
      const evidence = await method.call(port, lease); originalIngress();
      if (!evidence.lease || (Object.keys(lease) as (keyof IngressLease)[]).some(key => evidence.lease[key] !== lease[key]) || !["prepared", "bounded", "quiescent", "released"].includes(evidence.state) || !Number.isSafeInteger(evidence.chargedBytes) || evidence.chargedBytes < 0 || evidence.chargedBytes > lease.allowance || (evidence.object !== null && (!Number.isSafeInteger(evidence.object.dev) || evidence.object.dev < 0 || !Number.isSafeInteger(evidence.object.ino) || evidence.object.ino < 0)) || (evidence.state === "released" && (evidence.chargedBytes !== 0 || evidence.object !== null))) throw new Error();
      return evidence;
    } catch { throw new Error("INGRESS_RECOVERY_REQUIRED"); }
  }
  async function releaseIngress(entry: Journal): Promise<boolean> {
    if (entry.kind !== "intake") return true;
    if (!entry.lease) throw new Error("INGRESS_AUTHORITY_UNAVAILABLE");
    const key = `ingress:${JSON.stringify([entry.id, entry.lease.reservationId, entry.lease.domain, entry.lease.generation, entry.lease.path, entry.lease.allowance])}`;
    unresolvedReleases.add(key);
    const released = await releaseIngressHeld(entry, entry.lease);
    if (released) unresolvedReleases.delete(key);
    return released;
  }
  async function releaseIngressHeld(entry: Journal, lease: IngressLease): Promise<boolean> {
    await save({ ...entry, version: 3, release: "pending" });
    const evidence = validateEvidence(entry, await authority().quiesce(lease));
    if (!["quiescent", "released"].includes(evidence.state)) { ingressBlocked = true; return false; }
    let existing: Awaited<ReturnType<typeof lstat>> | undefined;
    try { existing = await lstat(entry.path); } catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
    if (existing) {
      if (!evidence.object || existing.dev !== evidence.object.dev || existing.ino !== evidence.object.ino || !existing.isFile() || existing.nlink !== 1 || existing.uid !== config.intakeUid) throw new Error("INGRESS_AUTHORITY_MISMATCH");
      const fd = await openPrivateFile(entry.path, config.intakeRoot, incoming); await closeCustodyHandle(fd);
      await unlink(entry.path); await syncRoot(config.intakeRoot);
    } else if (evidence.state !== "released" && evidence.chargedBytes !== 0) {
      // An absent name cannot prove that an unlinked inode has been released.
      throw new Error("INGRESS_RELEASE_UNCONFIRMED");
    }
    const released = validateEvidence(entry, await authority().released(lease));
    if (released.state !== "released") throw new Error("INGRESS_RELEASE_UNCONFIRMED");
    const retained = unwind.listRetainedIntakes().find(record => record.encryptedPayloadPath === entry.workerPath);
    await save({ ...entry, version: 3, release: "released", budget: retained?.actualBytes ?? entry.budget });
    return true;
  }
  function exclusive<T>(action: () => Promise<T>): Promise<T> { const result = queue.then(action); queue = result.then(() => {}, () => {}); return result; }
  function requireReady() { if (inhibited) throw new Error("MAINTENANCE_INHIBITED"); if (!ready) throw new Error("CUSTODY_NOT_READY"); }
  async function save(entry: Journal) {
    const path = join(config.custodyRoot, `${entry.id}.journal.${randomUUID()}.tmp`);
    const encoded = Buffer.from(JSON.stringify(entry)); if (encoded.length > 4096) throw new Error("CUSTODY_ACCOUNTING_FAILED");
    const fd = observeCustodyHandle(await open(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600));
    try { await fd.writeFile(encoded); await fd.sync(); } finally { await closeCustodyHandle(fd); }
    await rename(path, metadataPath(entry.id)); await syncRoot(config.custodyRoot); entries.set(entry.id, entry);
  }
  async function markOrphan(entry: Journal) { await save({ ...entry, version: entry.kind === "intake" ? 3 : entry.version, state: "orphan", cleanupAfter: entry.cleanupAfter < tomorrow() ? entry.cleanupAfter : tomorrow() }); }
  function acceptedIntakeId(entry: Journal): ApplicationId | undefined {
    // Logical original retirement clears retained-intake registration, not the
    // accepted case's authority. Neither settlement nor recovery may erase it.
    const retained = unwind.listRetainedIntakes().find(record => record.encryptedPayloadPath === entry.workerPath);
    const id = retained?.id ?? (entry.caseId ? unwind.getRequestIdentity(applicationId(entry.caseId)).id : undefined);
    if (id && JSON.stringify(entry.reservation!.submission) !== JSON.stringify(unwind.getSubmissionKind(id))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
    return id;
  }
  async function inspect(): Promise<CustodyInventory> {
    await checkIncomingRoot(config.intakeRoot, config.intakeUid, config.sharedGid); await checkPrivateRoot(config.custodyRoot); await checkPrivateRoot(config.runtimeRoot);
    const known = new Set([...entries.values()].flatMap(entry => [entry.path, ...(entry.workerPath ? [entry.workerPath] : []), metadataPath(entry.id)]));
    const sizes = new Map<string, number>(); let physicalBytes = 0, scratchBytes = 0;
    for (const root of [config.intakeRoot, config.custodyRoot, config.runtimeRoot]) for (const name of await readdir(root)) {
      const path = join(root, name), stat = await lstat(path);
      if (root === config.runtimeRoot && known.has(path)) {
        if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || (stat.mode & 0o077) !== 0) throw new Error("CUSTODY_UNACCOUNTED_FILE");
        let bytes = stat.size;
        for (const file of await readdir(path)) {
          if (!scopeName(file)) throw new Error("CUSTODY_UNACCOUNTED_FILE");
          const fd = await openPrivateFile(join(path, file), path); try { bytes += (await fd.stat()).size; } finally { await closeCustodyHandle(fd); }
        }
        sizes.set(path, bytes); physicalBytes += bytes; scratchBytes += bytes; continue;
      }
      const isIncoming = root === config.intakeRoot;
      const fixture = process.env.NODE_ENV === "test" && isIncoming && config.intakeUid === process.getuid?.() && (stat.mode & 0o7777) === 0o600;
      if (!known.has(path) || !stat.isFile() || stat.nlink !== 1 || stat.uid !== (isIncoming ? config.intakeUid : process.getuid?.()) || (!fixture && (stat.mode & 0o7777) !== (isIncoming ? 0o640 : 0o600)) || (isIncoming && !fixture && stat.gid !== config.sharedGid)) throw new Error("CUSTODY_UNACCOUNTED_FILE");
      sizes.set(path, stat.size); physicalBytes += stat.size;
    }
    const claims: { allowance: number; actual: number }[] = [];
    for (const entry of entries.values()) {
      const size = (sizes.get(entry.path) ?? 0) + (entry.workerPath ? sizes.get(entry.workerPath) ?? 0 : 0);
      if(entry.kind==="processing")scratchBytes+=sizes.get(metadataPath(entry.id))??0;
      if (size > entry.budget || (entry.state === "committed" && !sizes.has(entry.workerPath ?? entry.path))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      if (entry.kind === "intake") {
        if (!entry.lease) throw new Error("INGRESS_AUTHORITY_UNAVAILABLE");
        const evidence = validateEvidence(entry, await authority().observe(entry.lease));
        if (entry.release === "released" && evidence.state !== "released") throw new Error("INGRESS_AUTHORITY_MISMATCH");
        const hidden = Math.max(0, evidence.chargedBytes - (sizes.get(entry.path) ?? 0));
        physicalBytes += hidden;
        if (entry.release !== "released") claims.push({ allowance: entry.budget, actual: size + hidden });
      }
    }
    let metadataHeadroom=JOURNAL_HEADROOM;
    for(const entry of entries.values())if(entry.kind==="intake")metadataHeadroom+=Math.max(0,JOURNAL_HEADROOM-(sizes.get(metadataPath(entry.id))??0));
    for (const reserve of repo.listArtifactReservations()) {
      const active = [...entries.values()].filter(entry => entry.kind === "artifact" && entry.caseId === reserve.caseId && entry.artifactKind === reserve.kind && entry.state !== "orphan");
      const registered = repo.getArtifact(reserve.caseId,reserve.kind);
      claims.push({ allowance: registered?.bytes ?? reserve.bytes, actual: registered ? sizes.get(registered.path) ?? 0 : active.reduce((sum,entry)=>sum+(sizes.get(entry.path)??0)+(sizes.get(entry.workerPath!)??0),0) });
      metadataHeadroom+=Math.max(0,ARTIFACT_METADATA_RESERVE-active.reduce((sum,entry)=>sum+(sizes.get(metadataPath(entry.id))??0),0));
    }
    // New in-flight keys need one future output set; accepted-key retries do not.
    for (const entry of entries.values()) if (entry.kind === "intake" && entry.state === "reserved" && !entry.caseId && entry.reservation) {
      if (!repo.isReplayReservation(entry.reservation.id)) claims.push({ allowance: OUTPUT_RESERVE, actual: 0 });
    }
    const { reservedHeadroom } = storageBudget(physicalBytes, scratchBytes, claims, metadataHeadroom);
    return Object.freeze({ physicalBytes, reservedHeadroom, orphans: Object.freeze([...entries.values()].filter(entry => entry.state === "orphan").map(entry => Object.freeze({ path: entry.path, cleanupAfter: entry.cleanupAfter }))) });
  }
  async function checked() { try { return await inspect(); } catch (error) { ready = false; throw error; } }
  async function readJournal(path: string): Promise<Journal> {
    const fd = await openPrivateFile(path, config.custodyRoot);
    try {
      if ((await fd.stat()).size > 4096) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      return decodeJournal(await readBoundedFile(fd, 4096));
    } finally { await closeCustodyHandle(fd); }
  }
  function decodeJournal(bytes: Buffer): Journal {
      const entry = JSON.parse(bytes.toString("utf8")) as Journal;
      const journalVersion = entry.version;
      if (entry.kind === "intake") {
        if (!entry.reservation || entry.reservation.id !== entry.id) throw new Error("CUSTODY_ACCOUNTING_FAILED");
        try {
          strictObject(entry.reservation, ["id", "sessionHash", "idempotencyKey", "reservedBytes", "expiresAt"], ["submission"]);
          digest(entry.reservation.sessionHash); utcInstant(entry.reservation.expiresAt);
          if (!/^[A-Za-z0-9_-]{1,128}$/.test(entry.reservation.idempotencyKey) || !Number.isSafeInteger(entry.reservation.reservedBytes) || entry.reservation.reservedBytes < 1 || entry.reservation.reservedBytes > 2 * MAX_SEALED_BYTES) throw new Error();
          const submission = submissionKind(journalVersion < 3 && entry.reservation.submission === undefined ? { kind: "application" } : entry.reservation.submission);
          if (journalVersion < 3 && submission.kind !== "application") throw new Error();
          entry.reservation = { ...entry.reservation, submission };
        } catch { throw new Error("CUSTODY_ACCOUNTING_FAILED"); }
      }
      if (![1,2,3].includes(entry.version) || !/^[a-f0-9-]{36}$/.test(entry.id) || !["intake", "processing", "artifact"].includes(entry.kind) || !["reserved", "committed", "orphan"].includes(entry.state) || !Number.isSafeInteger(entry.budget) || entry.budget < 1 || entry.budget > (entry.kind === "processing" ? SCRATCH_RESERVE : 2 * MAX_SEALED_BYTES) || entry.path !== ownedPath(entry) || (entry.kind === "intake" && entry.workerPath !== intakePath(config.custodyRoot, entry.id))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      if (entry.kind === "artifact" && (!["bundle","mime"].includes(entry.artifactKind ?? "") || entry.workerPath !== join(config.custodyRoot,`${entry.id}.${entry.artifactKind}.enc`) || entry.budget > artifactLimit(entry.artifactKind!))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      if (entry.version >= 2 && entry.kind === "intake" && (!entry.lease || entry.lease.reservationId !== entry.id || entry.lease.path !== entry.path || entry.lease.allowance !== entry.reservation!.reservedBytes / 2 || !entry.lease.generation || !entry.lease.domain || !["pending","released"].includes(entry.release ?? ""))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      if (entry.settlement !== undefined && (entry.kind !== "intake" || !["expired", "drain"].includes(entry.settlement))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      utcInstant(entry.cleanupAfter); return entry;
  }
  async function deleteFile(entry: Journal) {
    try { await lstat(entry.path); } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      if (entry.kind === "processing" && pendingProcessingSync.has(entry.id)) {
        await syncRoot(config.runtimeRoot); pendingProcessingSync.delete(entry.id);
      }
      return;
    }
    if (entry.kind === "processing") {
      await checkPrivateRoot(entry.path);
      const names = await readdir(entry.path);
      // Validate every path before deleting any; never recursively remove unknown entries.
      for (const name of names) { if (!scopeName(name)) throw new Error("CUSTODY_UNACCOUNTED_FILE"); const fd = await openPrivateFile(join(entry.path, name), entry.path); await closeCustodyHandle(fd); }
      pendingProcessingSync.add(entry.id);
      for (const name of names) await unlink(join(entry.path, name));
      await rmdir(entry.path); await syncRoot(config.runtimeRoot); pendingProcessingSync.delete(entry.id); return;
    }
    const fd = entry.kind==="artifact"?await openArtifactHandle(entry.path,config.custodyRoot,entry.artifactKind!):await openPrivateFile(entry.path, rootFor(entry), entry.kind === "intake" ? incoming : undefined); await closeCustodyHandle(fd);
    await unlink(entry.path); await syncRoot(rootFor(entry));
  }
  async function deleteEntry(entry: Journal) {
    const key = `cleanup:${entry.id}`;
    unresolvedReleases.add(key);
    await deleteEntryHeld(entry);
    unresolvedReleases.delete(key);
  }
  async function deleteEntryHeld(entry: Journal) {
    if (entry.kind === "intake") { if (!await releaseIngress(entry)) throw new Error("INGRESS_BUSY"); }
    else await deleteFile(entry);
    if (entry.workerPath) {
      let exists = true;
      try { await lstat(entry.workerPath); } catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") exists = false; else throw error; }
      if (exists) { const fd = entry.kind==="artifact"?await openArtifactHandle(entry.workerPath,config.custodyRoot,entry.artifactKind!):await openPrivateFile(entry.workerPath, config.custodyRoot); await closeCustodyHandle(fd); await unlink(entry.workerPath); }
    }
    if (entry.kind !== "processing" || !unlinkedProcessingJournals.has(entry.id)) {
      await unlink(metadataPath(entry.id));
      if (entry.kind === "processing") unlinkedProcessingJournals.add(entry.id);
    }
    await syncRoot(config.custodyRoot);
    unlinkedProcessingJournals.delete(entry.id); entries.delete(entry.id);
  }
  async function reconcile() {
    if (processingOwners.size || intakeOwners.size) throw new Error("CUSTODY_SCOPE_ACTIVE");
    ready = false; reconciled = false; entries.clear();
    // Mandatory startup sweep; later bootstrap also schedules it <= every 5min.
    repo.pruneAdmissionEvents(now());
    const roots = [config.intakeRoot, config.custodyRoot, config.runtimeRoot];
    if (process.env.NODE_ENV !== "test" && config.intakeUid === process.getuid?.()) throw new Error("INVALID_STORAGE_IDENTITY");
    for (const root of roots) { if (root === config.intakeRoot) await checkIncomingRoot(root, config.intakeUid, config.sharedGid); else await checkPrivateRoot(root); if (roots.some(other => other !== root && root.startsWith(other + "/")) || roots.filter(other => other === root).length > 1) throw new Error("UNSAFE_PATH"); }
    if (process.env.NODE_ENV !== "test" && !config.runtimeRoot.startsWith("/run/")) throw new Error("UNSAFE_RUNTIME_ROOT");
    // Recover a worker-owned atomic journal write before interpreting intake files.
    for (const name of await readdir(config.custodyRoot)) if (/^[a-f0-9-]{36}\.journal\.[a-f0-9-]{36}\.tmp$/.test(name)) {
      const path = join(config.custodyRoot, name), entry = await readJournal(path);
      if (!name.startsWith(entry.id + ".journal.")) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      try { await lstat(metadataPath(entry.id)); await unlink(path); } catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; await rename(path, metadataPath(entry.id)); }
      await syncRoot(config.custodyRoot);
    }
    for (const name of await readdir(config.custodyRoot)) if (/^[a-f0-9-]{36}\.journal$/.test(name)) {
      const entry = await readJournal(join(config.custodyRoot, name)); if (name !== `${entry.id}.journal`) throw new Error("CUSTODY_ACCOUNTING_FAILED"); entries.set(entry.id, entry);
    }
    const legacy=[...entries.values()].filter(entry=>entry.kind==="intake"&&!entry.lease);
    const recovered=await authority().recover([...entries.values()].flatMap(entry=>entry.lease?[entry.lease]:[]),legacy.map(entry=>({reservationId:entry.id,path:entry.path,allowance:entry.reservation!.reservedBytes/2})));
    if(recovered.length!==legacy.length)throw new Error("INGRESS_LEGACY_RECONCILIATION_REQUIRED");
    for(const entry of legacy){
      const lease=recovered.find(lease=>lease.reservationId===entry.id);
      if(!lease||lease.path!==entry.path||lease.allowance!==entry.reservation!.reservedBytes/2||!lease.generation||!lease.domain)throw new Error("INGRESS_AUTHORITY_MISMATCH");
      const migrated:Journal={...entry,version:3,lease,release:"pending",budget:entry.reservation!.reservedBytes};
      const terminal=validateEvidence(migrated,await authority().observe(lease));
      if(!["quiescent","released"].includes(terminal.state))throw new Error("INGRESS_LEGACY_RECONCILIATION_REQUIRED");
      await save(migrated);
    }
    const retained = repo.listRetainedIntakes();
    const retainedArtifacts = repo.listRetainedArtifacts();
    for (const record of retained) {
      const entry = [...entries.values()].find(entry => entry.kind === "intake" && entry.workerPath === record.encryptedPayloadPath);
      if (!entry || record.actualBytes > entry.budget) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      // Submission is immutable: do not await a case lock while holding the
      // custody queue that artifact consumers acquire after their case lock.
      if (JSON.stringify(entry.reservation?.submission) !== JSON.stringify(repo.getSubmissionKind(record.id))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      const fd = await openPrivateFile(record.encryptedPayloadPath, config.custodyRoot); try { if ((await fd.stat()).size !== record.actualBytes) throw new Error("SIZE_MISMATCH"); } finally { await closeCustodyHandle(fd); }
      await save({ ...entry, version: 3, state: "committed", caseId: record.id });
    }
    for (const record of retainedArtifacts) {
      const entry = [...entries.values()].find(entry=>entry.kind === "artifact" && entry.workerPath === record.path && entry.caseId === record.caseId && entry.artifactKind === record.kind);
      if (!entry || (await lstat(record.path)).size !== record.bytes) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      await readArtifactFile(record,config.custodyRoot);
      await save({...entry,state:"committed",budget:record.bytes});
    }
    for (const entry of entries.values()) {
      if (entry.kind === "intake") {
        const acceptedId = acceptedIntakeId(entry);
        if (acceptedId) { await save({ ...entry, version: 3, state: "committed", caseId: acceptedId }); continue; }
      }
      const retainedEntry = entry.kind === "intake" ? retained.some(record => record.encryptedPayloadPath === entry.workerPath) : entry.kind === "artifact" ? retainedArtifacts.some(record=>record.path===entry.workerPath) : retained.some(record => record.id === entry.caseId) || retainedArtifacts.some(record=>record.caseId===entry.caseId);
      if (!retainedEntry || entry.state === "reserved") await markOrphan(entry);
    }
    await inspect();
    // Startup only: known plaintext from a dead process is removed before healthy admission.
    for (const entry of [...entries.values()]) if (entry.kind === "processing") await deleteEntry(entry);
    for (const entry of entries.values()) if (entry.kind === "intake" && entry.state === "committed") await releaseIngress(entry);
    const result = await inspect(); reconciled = true;
    ready = ![...entries.values()].some(entry => (entry.kind === "intake" && entry.state === "orphan") || (entry.settlement && entry.release !== "released"));
    return result;
  }
  async function settleIngress(request: { kind: "expired" | "drain" }) {
    if (!reconciled || !["expired", "drain"].includes(request.kind)) throw new Error("CUSTODY_NOT_READY");
    let pending = 0;
    try {
      for (const original of [...entries.values()]) {
        if (original.kind !== "intake" || (request.kind !== "drain" && !original.settlement && original.reservation!.expiresAt > now())) continue;
        // Acceptance is authoritative even if a previous journal write/reply failed.
        const acceptedId = acceptedIntakeId(original);
        const entry: Journal = { ...original, settlement: original.settlement ?? request.kind, ...(acceptedId ? { state: "committed", caseId: acceptedId } : { state: "orphan" }) };
        await save(entry);
        if (!acceptedId) { pending++; continue; }
        if (!await releaseIngress(entry)) { pending++; continue; }
        unwind.releaseReservation(entry.id);
        intakeOwners.delete(entry.id);
      }
      let inventory = await checked();
      ingressBlocked = pending !== 0;
      if (pending) ready = false;
      // A settlement cannot waive an unrelated storage failure. Re-establish
      // full custody evidence only when every live scope/owner has settled.
      else if (!ready && !intakeOwners.size && !processingOwners.size) inventory = await reconcile();
      return { complete: pending === 0, pending, inventory };
    } catch (error) { ready = false; throw error; }
  }
  const ledger: CustodyLedger = {
    getIntakeReadiness: () => ({ ready: ready && !ingressBlocked && !inhibited }),
    withProcessingAuthority: async (id,path,action) => {
      if (!processingOwners.has(path) || ![...entries.values()].some(entry=>entry.path===path && entry.caseId===id)) throw new Error("INVALID_PRIVATE_PAYLOAD");
      const guard={id,path,active:true};
      try { return await scopeContext.run(guard,action); } finally { guard.active=false; }
    },
    withScope: async (id,action) => {
      const own=scopeContext.getStore();
      if (own?.active && own.id===id && processingOwners.has(own.path)) return action(own.path);
      const path=await exclusive(async()=>{
        requireReady();
        if ([...entries.values()].some(entry=>entry.kind==="processing")) throw new Error("BUSY");
        if (!repo.getArtifact(id,"bundle")) throw new Error("INVALID_ARTIFACT_AUTHORITY");
        const ticket=randomUUID(),path=join(config.runtimeRoot,ticket);
        await save({version:2,id:ticket,path,kind:"processing",state:"reserved",budget:SCRATCH_RESERVE,caseId:id,cleanupAfter:tomorrow()});
        processingOwners.add(path);
        try { await mkdir(path,{mode:0o700}); return path; }
        catch(error) { processingOwners.delete(path); ready=false; throw error; }
      });
      const guard={id,path,active:true};
      try { requireReady(); return await scopeContext.run(guard,()=>action(path)); }
      finally {
        guard.active=false;
        await exclusive(async()=>{ const entry=[...entries.values()].find(entry=>entry.path===path)!; try { await deleteEntry(entry); processingOwners.delete(path); } catch(error) { ready=false;throw error; } });
      }
    },
    publishArtifact: (id,kind,bytes,metadata,expectedVersion) => exclusive(async()=>{
      requireReady();
      if (bytes.length>artifactLimit(kind) || createHash("sha256").update(bytes).digest("hex")!==metadata.ciphertextDigest) throw new Error("INVALID_ARTIFACT");
      if (repo.getArtifact(id,kind)) throw new Error("ARTIFACT_CONFLICT");
      const ticket=randomUUID(),entry:Journal={version:2,id:ticket,kind:"artifact",artifactKind:kind,state:"reserved",path:join(config.custodyRoot,`${ticket}.${kind}.staging`),workerPath:join(config.custodyRoot,`${ticket}.${kind}.enc`),budget:artifactLimit(kind),cleanupAfter:metadata.expiresAt,caseId:id};
      await save(entry);
      const record:ArtifactRecord={caseId:id,kind,path:entry.workerPath!,bytes:bytes.length,...metadata};
      try {
        await checked();
        const fd=observeCustodyHandle(await open(entry.path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600));
        try { await fd.writeFile(bytes); await fd.sync(); } finally { await closeCustodyHandle(fd); }
        await syncRoot(config.custodyRoot); await rename(entry.path,entry.workerPath!); await syncRoot(config.custodyRoot);
        requireReady(); await repo.adoptArtifact(record,expectedVersion);
        await save({...entry,state:"committed",budget:bytes.length});
        return record;
      } catch(error) {
        ready=false;
        if (!unwind.listRetainedArtifacts().some(record=>record.path===entry.workerPath)) await markOrphan(entry);
        throw error;
      }
    }),
    beginProcessing: (snapshot, bytes) => exclusive(async () => {
      requireReady();
      if ([...entries.values()].some(entry => entry.kind === "processing")) throw new Error("PROCESSING_IN_PROGRESS");
      if (![...entries.values()].some(entry => entry.kind === "intake" && entry.state === "committed" && entry.workerPath === snapshot.encryptedPayloadPath && entry.caseId === snapshot.id)) throw new Error("INVALID_PRIVATE_PAYLOAD");
      await checked();
      if (!Number.isSafeInteger(bytes) || bytes < 4096 || bytes > 10485760 + 4096) throw new Error("CAPACITY_EXCEEDED");
      const id = randomUUID(), path = join(config.runtimeRoot, id);
      try {
        await save({ version: 2, id, path, kind: "processing", state: "reserved", budget: SCRATCH_RESERVE, caseId: snapshot.id, cleanupAfter: tomorrow() });
        requireReady(); processingOwners.add(path);
        let finish!: () => void; const done = new Promise<void>(resolve => { finish = resolve; });
        processingLifetimes.set(path, { done, finish }); return path;
      } catch (error) { ready = false; throw error; }
    }),
    finishProcessing: path => exclusive(async () => {
      const entry = [...entries.values()].find(entry => entry.kind === "processing" && entry.path === path);
      if (!entry || !processingOwners.has(path)) throw new Error("INVALID_PRIVATE_PAYLOAD");
      try { await deleteEntry(entry); processingOwners.delete(path); } catch (error) { ready = false; throw error; }
      // Finish this attempt, not its failed release. Keep the original owner
      // for an exact retry; deleteEntry's uncertainty still prevents settlement.
      finally { processingLifetimes.get(path)?.finish(); processingLifetimes.delete(path); }
    }),
    reconcile: () => exclusive(reconcile),
    settleIngress: request => exclusive(() => settleIngress(request)),
    reserve: (input, readiness) => exclusive(async () => {
      requireReady();
      if (ingressBlocked) throw new Error("CUSTODY_NOT_READY");
      if (readiness?.getIntakeReadiness().ready !== true) throw new Error("WORKER_UNAVAILABLE");
      // Expiry asks the producer authority; it is never proof of release itself.
      if ([...entries.values()].some(entry => entry.kind === "intake" && entry.release !== "released" && entry.reservation!.expiresAt <= now())) {
        ready = false; throw new Error("CUSTODY_NOT_READY");
      }
      const total = await checked();
      let producerSlots=0;
      try{
        for(const entry of entries.values())if(entry.kind==="intake"&&entry.lease){
          const evidence=validateEvidence(entry,await authority().observe(entry.lease));
          if(evidence.state==="prepared"||evidence.state==="bounded")producerSlots++;
        }
      }catch(error){ready=false;throw error;}
      const exhausted = intakeOwners.size >= 2 || producerSlots >= 2 || input.reservedBytes > 2 * MAX_SEALED_BYTES || total.physicalBytes + total.reservedHeadroom + input.reservedBytes + JOURNAL_HEADROOM > PHYSICAL_CAP;
      if (readiness?.getIntakeReadiness().ready !== true) throw new Error("WORKER_UNAVAILABLE");
      const reservation = repo.reserve({ ...input, now: now() }, exhausted ? "exhausted" : "available");
      const outputAllowance=repo.isReplayReservation(reservation.id)?0:OUTPUT_RESERVE;
      if(total.physicalBytes+total.reservedHeadroom+input.reservedBytes+JOURNAL_HEADROOM+outputAllowance>PHYSICAL_CAP){
        unwind.releaseReservation(reservation.id);throw new Error("CAPACITY_EXCEEDED");
      }
      try {
        cleanupSource.start(reservation);
        const path = intakePath(config.intakeRoot, reservation.id), lease = await authority().prepare(reservation.id, path, reservation.reservedBytes / 2);
        const entry: Journal = { version: 3, id: reservation.id, kind: "intake", state: "reserved", budget: reservation.reservedBytes, path, workerPath: intakePath(config.custodyRoot, reservation.id), reservation, cleanupAfter: reservation.expiresAt, lease, release: "pending" };
        if (lease.reservationId !== reservation.id || lease.path !== path || lease.allowance !== reservation.reservedBytes / 2) throw new Error("INGRESS_AUTHORITY_MISMATCH");
        await save(entry); intakeOwners.add(reservation.id); await checked();
        requireReady(); if (readiness?.getIntakeReadiness().ready !== true) throw new Error("WORKER_UNAVAILABLE");
        if (validateEvidence(entry, await authority().grant(lease)).state !== "bounded") throw new Error("INGRESS_AUTHORITY_MISMATCH");
        requireReady();
      }
      catch (error) {
        ready = false;
        if (!entries.has(reservation.id)) unwind.releaseReservation(reservation.id);
        throw error;
      }
      intakeOwners.add(reservation.id);
      return reservation;
    }),
    commitIntake: input => exclusive(async () => {
      requireReady(); const entry = entries.get(input.reservationId);
      if (!entry || entry.kind !== "intake" || entry.state !== "reserved" || input.encryptedPayloadPath !== entry.path) throw new Error("INVALID_PRIVATE_PAYLOAD");
      try {
        const fd = await openPrivateFile(entry.path, config.intakeRoot, incoming);
        try {
          if ((await fd.stat()).size !== input.actualBytes) throw new Error("SIZE_MISMATCH");
          if (2 * input.actualBytes > entry.budget) throw new Error("RESERVATION_EXCEEDED");
          const bytes = await readBoundedFile(fd, input.actualBytes); if (bytes.length !== input.actualBytes) throw new Error("SIZE_MISMATCH");
          const target = observeCustodyHandle(await open(entry.workerPath!, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600));
          try { await target.writeFile(bytes); await target.sync(); } finally { await closeCustodyHandle(target); }
        } finally { await closeCustodyHandle(fd); }
        await syncRoot(config.custodyRoot); await checked();
        requireReady();
        await observeSource(entry);
        requireReady();
        const accepted: Acceptance = cleanupSource.commit(entry, { ...input, encryptedPayloadPath: entry.workerPath!, now: now() });
        if (cleanupSource.accepted(entry) !== accepted.id) throw new Error("WORKER_UNAVAILABLE");
        const committed: Journal = { ...entry, state: "committed", caseId: accepted.id }; await save(committed); await releaseIngress(committed);
        return accepted;
      } catch (error) {
        ready = false;
        // If DB commit completed, recovery must preserve the accepted file; no guessed success.
        if (!cleanupSource.accepted(entry)) {
          await markOrphan(entry);
        }
        throw error;
      } finally { if (!entries.has(entry.id) || entries.get(entry.id)!.release === "released") intakeOwners.delete(entry.id); }
    }),
    abortIntake: (id, sessionHash) => exclusive(async () => {
      const entry = entries.get(id); if (!entry || entry.kind !== "intake" || entry.reservation?.sessionHash !== sessionHash) throw new Error("INVALID_RESERVATION");
      // A failed post-commit journal write must never overrule durable DB acceptance.
      const acceptedId = cleanupSource.accepted(entry);
      if (acceptedId) {
        const committed: Journal = { ...entry, state: "committed", caseId: applicationId(acceptedId) };
        entries.set(id, committed);
        try { await save(committed); } catch (error) { ready = false; throw error; }
        if (committed.release === "released") intakeOwners.delete(id);
        throw new Error("INVALID_RESERVATION");
      }
      if (!intakeOwners.has(id) || !["reserved", "orphan"].includes(entry.state)) throw new Error("INVALID_RESERVATION");
      try {
        await observeSource(entry);
        cleanupSource.abort(entry);
        await markOrphan(entry);
        throw new Error("CUSTODY_NOT_READY");
      } catch (error) { ready = false; throw error; }
    }),
    cleanupOrphans: () => exclusive(async () => {
      if (!reconciled) throw new Error("CUSTODY_NOT_READY");
      try { await checked(); for (const entry of [...entries.values()]) if (entry.state === "orphan" && entry.cleanupAfter <= now()) {
        if (entry.kind === "intake") throw new Error("CUSTODY_NOT_READY");
        if (!intakeOwners.has(entry.id)) await deleteEntry(entry);
      } return await inspect(); }
      catch (error) { ready = false; throw error; }
    }),
  };
  registerMaintenanceCustody(ledger, repo, config.clock, {
    inhibit() { inhibited = true; },
    async settle() {
      while (lifetimes.size || processingLifetimes.size) await Promise.allSettled([...lifetimes, ...[...processingLifetimes.values()].map(scope => scope.done)]);
      await queue;
      if (handles.size || unresolvedReleases.size || !scanResources.idle()) throw new Error("CUSTODY_RELEASE_UNCERTAIN");
    },
    idle: () => lifetimes.size === 0 && processingOwners.size === 0 && handles.size === 0 && unresolvedReleases.size === 0 && scanResources.idle(),
    closeReady: () => scanResources.closeReady(),
    closeScanIterators: () => scanResources.closeIterators(),
    finishAcceptedResources: run => {
      if (lifetimes.size || processingLifetimes.size || processingOwners.size) throw new Error("MAINTENANCE_WORK_ACTIVE");
      return scanResources.finishAcceptedResources(run);
    },
    finishNeverAcceptedResources: run => {
      if (lifetimes.size || processingLifetimes.size || processingOwners.size) throw new Error("MAINTENANCE_WORK_ACTIVE");
      return scanResources.finishNeverAcceptedResources(run);
    },
  }, config);
  const cleanupSource = bindCleanupSource(repo, ledger, config);
  const scanResources = bindCustodyErasure(ledger, repo, config, { exclusive, track, decodeJournal, ingress: acceptedIngress,
    cleanupDependency: id => entries.has(id) || intakeOwners.has(id) || handles.size !== 0 || unresolvedReleases.size !== 0 || processingOwners.size !== 0 || processingLifetimes.size !== 0,
    privateRevision: () => privateRevision,
    privateReady: () => handles.size === 0 && unresolvedReleases.size === 0 && processingOwners.size === 0 && processingLifetimes.size === 0,
    async forget(journal) {
      const entry = entries.get(journal.journalId);
      if (processingOwners.has(join(config.runtimeRoot, journal.journalId)) || processingLifetimes.has(join(config.runtimeRoot, journal.journalId))) throw new Error("CUSTODY_SCOPE_ACTIVE");
      if (entry && (entry.id !== journal.journalId || entry.kind !== journal.kind || (entry.caseId && entry.caseId !== journal.caseId) || (entry.artifactKind ?? null) !== journal.artifactKind || (entry.lease && (entry.lease.generation !== journal.generation || entry.lease.domain !== journal.domain || entry.lease.allowance !== journal.allowance)))) throw new Error("ERASURE_ASSOCIATION_INVALID");
      if (entry && (entry.path !== ownedPath(entry) || entry.budget !== journal.budget || entry.cleanupAfter !== journal.cleanupAfter || entry.version !== journal.version || (entry.kind === "intake" && (entry.workerPath !== join(config.custodyRoot, `${entry.id}.enc`) || entry.reservation?.id !== journal.reservationId || entry.reservation?.reservedBytes !== 2 * journal.allowance!)) || (entry.kind === "artifact" && entry.workerPath !== join(config.custodyRoot, `${entry.id}.${entry.artifactKind}.enc`)))) throw new Error("ERASURE_ASSOCIATION_INVALID");
      let consumedItems = 5;
      if (journal.kind === "intake") {
        const evidence = await acceptedIngress(journal, "observe"); consumedItems += 2;
        if (evidence.state !== "released") throw new Error("INGRESS_RECOVERY_REQUIRED");
        intakeOwners.delete(journal.journalId); consumedItems++;
      }
      entries.delete(journal.journalId); privateRevision++; return consumedItems + 1;
    }, async observeIngress(entry) {
    const lease = entry.lease;
    if (!lease || typeof lease.generation !== "string" || !lease.generation || typeof lease.domain !== "string" || !lease.domain || lease.reservationId !== entry.id || lease.path !== entry.path || lease.allowance !== entry.reservation!.reservedBytes / 2) throw new Error("INGRESS_RECOVERY_REQUIRED");
    try {
      const evidence = await observeSource(entry);
      if (entry.release === "released" && evidence.state !== "released") throw new Error("INGRESS_RECOVERY_REQUIRED");
      return evidence;
    } catch { throw new Error("INGRESS_RECOVERY_REQUIRED"); }
  } });
  for (const name of Object.keys(ledger) as (keyof CustodyLedger)[]) {
    if (name === "getIntakeReadiness") continue;
    const method = ledger[name] as (...args: unknown[]) => Promise<unknown>;
    Object.defineProperty(ledger, name, { value: (...args: unknown[]) => {
      if (inhibited && name !== "finishProcessing" && name !== "abortIntake") return Promise.reject(new Error("MAINTENANCE_INHIBITED"));
      privateRevision++;
      return track(() => method(...args));
    }, writable: true });
  }
  scopeReaders.set(ledger.beginProcessing, action => {
    if (inhibited) return Promise.reject(new Error("MAINTENANCE_INHIBITED"));
    return track(action);
  });
  return ledger;
}

export async function takePrivateSnapshot(record: CommittedIntake, keys: WorkerKeys): Promise<PrivateSnapshot> {
  const track = scopeReaders.get(keys.custody.beginProcessing); if (!track) throw new Error("CUSTODY_NOT_READY");
  return track(() => readPrivateSnapshot(record, keys));
}
async function readPrivateSnapshot(record: CommittedIntake, keys: WorkerKeys): Promise<PrivateSnapshot> {
  await checkPrivateRoot(keys.privateRoot);
  const source = await openPrivateFile(record.encryptedPayloadPath, keys.privateRoot);
  let plaintext: Buffer | undefined;
  try {
    const stat = await source.stat();
    if (stat.size !== record.actualBytes) throw new Error("SIZE_MISMATCH");
    // Read only from the opened inode; the authenticated fingerprint detects mutations during copy.
    const ciphertext = await readBoundedFile(source, record.actualBytes);
    if (ciphertext.length !== stat.size) throw new Error("SIZE_MISMATCH");
    plaintext = decryptEnvelope(ciphertext, keys.privateKey);
    const payload = decodePayload(plaintext);
    if (payloadDigest(payload) !== record.digest) throw new Error("DIGEST_MISMATCH");
    return Object.freeze({ id: record.id, input: Object.freeze({ ...payload.input }), files: Object.freeze(payload.files.map(file => Object.freeze({ name: file.name, mediaType: file.mediaType, bytes: Buffer.from(file.content, "base64").length, digest: digest(createHash("sha256").update(Buffer.from(file.content, "base64")).digest("hex")) }))), digest: record.digest, encryptedPayloadPath: record.encryptedPayloadPath, bytes: record.actualBytes });
  } finally { plaintext?.fill(0); await closeCustodyHandle(source); }
}
export async function withPrivateFiles<T>(snapshot: PrivateSnapshot, keys: WorkerKeys, action: (snapshot: ProcessingSnapshot) => Promise<T>): Promise<T> {
  const track = scopeReaders.get(keys.custody.beginProcessing); if (!track) throw new Error("CUSTODY_NOT_READY");
  return track(() => usePrivateFiles(snapshot, keys, action));
}
async function usePrivateFiles<T>(snapshot: PrivateSnapshot, keys: WorkerKeys, action: (snapshot: ProcessingSnapshot) => Promise<T>): Promise<T> {
  await checkPrivateRoot(keys.runtimeRoot);
  if (process.env.NODE_ENV !== "test" && !keys.runtimeRoot.startsWith("/run/")) throw new Error("UNSAFE_RUNTIME_ROOT");
  const source = await openPrivateFile(snapshot.encryptedPayloadPath, keys.privateRoot);
  let plaintext: Buffer | undefined, directory: string | undefined;
  try {
    if ((await source.stat()).size !== snapshot.bytes) throw new Error("SIZE_MISMATCH");
    plaintext = decryptEnvelope(await readBoundedFile(source, snapshot.bytes), keys.privateKey);
    const payload = decodePayload(plaintext);
    if (payloadDigest(payload) !== snapshot.digest) throw new Error("DIGEST_MISMATCH");
    // Authentication completes before any scanner-readable path exists.
    directory = await keys.custody.beginProcessing(snapshot, payload.files.reduce((sum, file) => sum + Buffer.from(file.content, "base64").length, 0) + 4096);
    await mkdir(directory, { mode: 0o700 });
    const files: ProcessingSnapshot["files"][number][] = [];
    for (const [index, file] of payload.files.entries()) {
      const bytes = Buffer.from(file.content, "base64"), path = join(directory, `${index}.data`);
      const fd = observeCustodyHandle(await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600));
      try { await fd.writeFile(bytes); } finally { bytes.fill(0); await closeCustodyHandle(fd); }
      files.push(Object.freeze({ name: file.name, mediaType: file.mediaType, digest: digest(createHash("sha256").update(Buffer.from(file.content, "base64")).digest("hex")), bytes: Buffer.from(file.content, "base64").length, path }));
    }
    return await keys.custody.withProcessingAuthority(snapshot.id,directory,()=>action(Object.freeze({ ...snapshot, input: Object.freeze({ ...payload.input }), files: Object.freeze(files) })));
  } finally { plaintext?.fill(0); try { await closeCustodyHandle(source); } finally { if (directory) await keys.custody.finishProcessing(directory); } }
}
