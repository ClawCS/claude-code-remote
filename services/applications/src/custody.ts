import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, open, rmdir, unlink, lstat, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import type { ApplicationRepository, CommittedIntake, PrivateSnapshot, WorkerKeys, ProcessingSnapshot, CustodyLedger, CustodyInventory, CustodyConfig, Reservation, Instant } from "./types";
import { digest, utcInstant } from "./types";
import { checkPrivateRoot, checkIncomingRoot, openPrivateFile, decodePayload, decryptEnvelope, payloadDigest, syncRoot, intakePath, MAX_SEALED_BYTES, readBoundedFile } from "./crypto";

// Dedicated incoming, custody and runtime roots; never the registry directory.
const PHYSICAL_CAP = 250 * 1024 * 1024;
const JOURNAL_HEADROOM = 8192;
interface Journal {
  version: 1; id: string; kind: "intake" | "processing"; state: "reserved" | "committed" | "orphan";
  path: string; workerPath?: string; budget: number; cleanupAfter: Instant; reservation?: Reservation; caseId?: string;
}
export function createCustodyLedger(repo: ApplicationRepository, config: CustodyConfig): CustodyLedger {
  const entries = new Map<string, Journal>();
  const intakeOwners = new Set<string>();
  const processingOwners = new Set<string>();
  let ready = false, reconciled = false, queue = Promise.resolve();
  const incoming = { uid: config.intakeUid, gid: config.sharedGid };
  const now = () => utcInstant(config.clock.now().toISOString());
  const tomorrow = () => utcInstant(new Date(config.clock.now().getTime() + 86400000).toISOString());
  const metadataPath = (id: string) => join(config.custodyRoot, `${id}.journal`);
  const rootFor = (entry: Journal) => entry.kind === "intake" ? config.intakeRoot : entry.kind === "processing" ? config.runtimeRoot : config.custodyRoot;
  const ownedPath = (entry: Journal) => entry.kind === "processing" ? join(config.runtimeRoot, entry.id) : intakePath(rootFor(entry), entry.id);
  function exclusive<T>(action: () => Promise<T>): Promise<T> { const result = queue.then(action); queue = result.then(() => {}, () => {}); return result; }
  function requireReady() { if (!ready) throw new Error("CUSTODY_NOT_READY"); }
  async function save(entry: Journal) {
    const path = join(config.custodyRoot, `${entry.id}.journal.${randomUUID()}.tmp`);
    const encoded = Buffer.from(JSON.stringify(entry)); if (encoded.length > 4096) throw new Error("CUSTODY_ACCOUNTING_FAILED");
    const fd = await open(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    try { await fd.writeFile(encoded); await fd.sync(); } finally { await fd.close(); }
    await rename(path, metadataPath(entry.id)); await syncRoot(config.custodyRoot); entries.set(entry.id, entry);
  }
  async function markOrphan(entry: Journal) { await save({ ...entry, state: "orphan", cleanupAfter: entry.cleanupAfter < tomorrow() ? entry.cleanupAfter : tomorrow() }); }
  async function inspect(): Promise<CustodyInventory> {
    await checkIncomingRoot(config.intakeRoot, config.intakeUid, config.sharedGid); await checkPrivateRoot(config.custodyRoot); await checkPrivateRoot(config.runtimeRoot);
    const known = new Set([...entries.values()].flatMap(entry => [entry.path, ...(entry.workerPath ? [entry.workerPath] : []), metadataPath(entry.id)]));
    const sizes = new Map<string, number>(); let physicalBytes = 0, reservedHeadroom = JOURNAL_HEADROOM;
    for (const root of [config.intakeRoot, config.custodyRoot, config.runtimeRoot]) for (const name of await readdir(root)) {
      const path = join(root, name), stat = await lstat(path);
      if (root === config.runtimeRoot && known.has(path)) {
        if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || (stat.mode & 0o077) !== 0) throw new Error("CUSTODY_UNACCOUNTED_FILE");
        let bytes = stat.size;
        for (const file of await readdir(path)) {
          if (!/^[0-4]\.data$/.test(file)) throw new Error("CUSTODY_UNACCOUNTED_FILE");
          const fd = await openPrivateFile(join(path, file), path); try { bytes += (await fd.stat()).size; } finally { await fd.close(); }
        }
        sizes.set(path, bytes); physicalBytes += bytes; continue;
      }
      const isIncoming = root === config.intakeRoot;
      const fixture = process.env.NODE_ENV === "test" && isIncoming && config.intakeUid === process.getuid?.() && (stat.mode & 0o7777) === 0o600;
      if (!known.has(path) || !stat.isFile() || stat.nlink !== 1 || stat.uid !== (isIncoming ? config.intakeUid : process.getuid?.()) || (!fixture && (stat.mode & 0o7777) !== (isIncoming ? 0o640 : 0o600)) || (isIncoming && !fixture && stat.gid !== config.sharedGid)) throw new Error("CUSTODY_UNACCOUNTED_FILE");
      sizes.set(path, stat.size); physicalBytes += stat.size;
    }
    for (const entry of entries.values()) {
      const size = (sizes.get(entry.path) ?? 0) + (entry.workerPath ? sizes.get(entry.workerPath) ?? 0 : 0);
      if (size > entry.budget || (entry.state === "committed" && !sizes.has(entry.workerPath ?? entry.path))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      if (entry.state === "reserved" || intakeOwners.has(entry.id)) reservedHeadroom += entry.budget - size + JOURNAL_HEADROOM;
    }
    if (physicalBytes + reservedHeadroom > PHYSICAL_CAP) throw new Error("CAPACITY_EXCEEDED");
    return Object.freeze({ physicalBytes, reservedHeadroom, orphans: Object.freeze([...entries.values()].filter(entry => entry.state === "orphan").map(entry => Object.freeze({ path: entry.path, cleanupAfter: entry.cleanupAfter }))) });
  }
  async function checked() { try { return await inspect(); } catch (error) { ready = false; throw error; } }
  async function readJournal(path: string): Promise<Journal> {
    const fd = await openPrivateFile(path, config.custodyRoot);
    try {
      if ((await fd.stat()).size > 4096) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      const entry = JSON.parse((await readBoundedFile(fd, 4096)).toString("utf8")) as Journal;
      if (entry.version !== 1 || !/^[a-f0-9-]{36}$/.test(entry.id) || !["intake", "processing"].includes(entry.kind) || !["reserved", "committed", "orphan"].includes(entry.state) || !Number.isSafeInteger(entry.budget) || entry.budget < 1 || entry.budget > 2 * MAX_SEALED_BYTES || entry.path !== ownedPath(entry) || (entry.kind === "intake" && entry.workerPath !== intakePath(config.custodyRoot, entry.id))) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      utcInstant(entry.cleanupAfter); return entry;
    } finally { await fd.close(); }
  }
  async function deleteFile(entry: Journal) {
    try { await lstat(entry.path); } catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return; throw error; }
    if (entry.kind === "processing") {
      await checkPrivateRoot(entry.path);
      const names = await readdir(entry.path);
      // Validate every path before deleting any; never recursively remove unknown entries.
      for (const name of names) { if (!/^[0-4]\.data$/.test(name)) throw new Error("CUSTODY_UNACCOUNTED_FILE"); const fd = await openPrivateFile(join(entry.path, name), entry.path); await fd.close(); }
      for (const name of names) await unlink(join(entry.path, name));
      await rmdir(entry.path); await syncRoot(config.runtimeRoot); return;
    }
    const fd = await openPrivateFile(entry.path, rootFor(entry), incoming); await fd.close();
    await unlink(entry.path); await syncRoot(rootFor(entry));
  }
  async function deleteEntry(entry: Journal) {
    await deleteFile(entry);
    if (entry.workerPath) {
      let exists = true;
      try { await lstat(entry.workerPath); } catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") exists = false; else throw error; }
      if (exists) { const fd = await openPrivateFile(entry.workerPath, config.custodyRoot); await fd.close(); await unlink(entry.workerPath); }
    }
    await unlink(metadataPath(entry.id)); await syncRoot(config.custodyRoot); entries.delete(entry.id);
  }
  async function reconcile() {
    if (processingOwners.size || intakeOwners.size) throw new Error("CUSTODY_SCOPE_ACTIVE");
    ready = false; reconciled = false; entries.clear();
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
    const retained = repo.listRetainedIntakes();
    for (const record of retained) {
      const entry = [...entries.values()].find(entry => entry.kind === "intake" && entry.workerPath === record.encryptedPayloadPath);
      if (!entry || record.actualBytes > entry.budget) throw new Error("CUSTODY_ACCOUNTING_FAILED");
      const fd = await openPrivateFile(record.encryptedPayloadPath, config.custodyRoot); try { if ((await fd.stat()).size !== record.actualBytes) throw new Error("SIZE_MISMATCH"); } finally { await fd.close(); }
      await save({ ...entry, state: "committed", caseId: record.id });
    }
    for (const entry of entries.values()) {
      const retainedEntry = entry.kind === "intake" ? retained.some(record => record.encryptedPayloadPath === entry.workerPath) : retained.some(record => record.id === entry.caseId);
      if (!retainedEntry || entry.state === "reserved") await markOrphan(entry);
    }
    await inspect();
    // Startup only: known plaintext from a dead process is removed before healthy admission.
    for (const entry of [...entries.values()]) if (entry.kind === "processing") await deleteEntry(entry);
    for (const entry of entries.values()) if (entry.kind === "intake" && entry.state === "committed") { await deleteFile(entry); const record = retained.find(record => record.encryptedPayloadPath === entry.workerPath)!; await save({ ...entry, budget: record.actualBytes }); }
    const result = await inspect(); ready = true; reconciled = true; return result;
  }
  return {
    beginProcessing: (snapshot, bytes) => exclusive(async () => {
      requireReady();
      if ([...entries.values()].some(entry => entry.kind === "processing")) throw new Error("PROCESSING_IN_PROGRESS");
      if (![...entries.values()].some(entry => entry.kind === "intake" && entry.state === "committed" && entry.workerPath === snapshot.encryptedPayloadPath && entry.caseId === snapshot.id)) throw new Error("INVALID_PRIVATE_PAYLOAD");
      const total = await checked();
      if (!Number.isSafeInteger(bytes) || bytes < 4096 || bytes > 10485760 + 4096 || total.physicalBytes + total.reservedHeadroom + bytes + JOURNAL_HEADROOM > PHYSICAL_CAP) throw new Error("CAPACITY_EXCEEDED");
      const id = randomUUID(), path = join(config.runtimeRoot, id);
      try { await save({ version: 1, id, path, kind: "processing", state: "reserved", budget: bytes, caseId: snapshot.id, cleanupAfter: tomorrow() }); processingOwners.add(path); return path; } catch (error) { ready = false; throw error; }
    }),
    finishProcessing: path => exclusive(async () => {
      const entry = [...entries.values()].find(entry => entry.kind === "processing" && entry.path === path);
      if (!entry || !processingOwners.has(path)) throw new Error("INVALID_PRIVATE_PAYLOAD");
      try { await deleteEntry(entry); processingOwners.delete(path); } catch (error) { ready = false; processingOwners.delete(path); throw error; }
    }),
    reconcile: () => exclusive(reconcile),
    reserve: input => exclusive(async () => {
      requireReady();
      if (intakeOwners.size >= 2) throw new Error("CAPACITY_EXCEEDED");
      for (const entry of entries.values()) if (entry.kind === "intake" && entry.state === "reserved" && !intakeOwners.has(entry.id) && entry.reservation && entry.reservation.expiresAt <= now()) { await markOrphan(entry); repo.releaseReservation(entry.id); }
      const total = await checked();
      if (input.reservedBytes > 2 * MAX_SEALED_BYTES || total.physicalBytes + total.reservedHeadroom + input.reservedBytes + JOURNAL_HEADROOM > PHYSICAL_CAP) throw new Error("CAPACITY_EXCEEDED");
      const reservation = repo.reserve({ ...input, now: now() });
      try { await save({ version: 1, id: reservation.id, kind: "intake", state: "reserved", budget: reservation.reservedBytes, path: intakePath(config.intakeRoot, reservation.id), workerPath: intakePath(config.custodyRoot, reservation.id), reservation, cleanupAfter: reservation.expiresAt }); }
      catch (error) { ready = false; repo.releaseReservation(reservation.id); throw error; }
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
          const target = await open(entry.workerPath!, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
          try { await target.writeFile(bytes); await target.sync(); } finally { await target.close(); }
        } finally { await fd.close(); }
        await syncRoot(config.custodyRoot); await checked();
        const accepted = repo.commitIntake({ ...input, encryptedPayloadPath: entry.workerPath!, now: now() });
        if (accepted.replayed) { await markOrphan(entry); await deleteEntry(entry); }
        else { await save({ ...entry, state: "committed", caseId: accepted.id }); await deleteFile(entry); await save({ ...entry, state: "committed", caseId: accepted.id, budget: input.actualBytes }); }
        return accepted;
      } catch (error) {
        ready = false;
        // If DB commit completed, recovery must preserve the accepted file; no guessed success.
        if (!repo.listRetainedIntakes().some(record => record.encryptedPayloadPath === entry.workerPath)) { await markOrphan(entry); repo.releaseReservation(entry.id); }
        throw error;
      } finally { intakeOwners.delete(entry.id); }
    }),
    abortIntake: (id, sessionHash) => exclusive(async () => {
      const entry = entries.get(id); if (!entry || entry.kind !== "intake" || entry.reservation?.sessionHash !== sessionHash) throw new Error("INVALID_RESERVATION");
      // A failed post-commit journal write must never overrule durable DB acceptance.
      const accepted = repo.listRetainedIntakes().find(record => record.encryptedPayloadPath === entry.workerPath);
      if (accepted) {
        const committed: Journal = { ...entry, state: "committed", caseId: accepted.id };
        entries.set(id, committed);
        try { await save(committed); } catch (error) { ready = false; throw error; }
        intakeOwners.delete(id);
        throw new Error("INVALID_RESERVATION");
      }
      if (!intakeOwners.has(id) || !["reserved", "orphan"].includes(entry.state)) throw new Error("INVALID_RESERVATION");
      try { await markOrphan(entry); await deleteEntry(entry); repo.releaseReservation(id); intakeOwners.delete(id); } catch (error) { ready = false; throw error; }
    }),
    cleanupOrphans: () => exclusive(async () => {
      if (!reconciled) throw new Error("CUSTODY_NOT_READY");
      try { await checked(); for (const entry of [...entries.values()]) if (entry.state === "orphan" && !intakeOwners.has(entry.id) && entry.cleanupAfter <= now()) await deleteEntry(entry); return await inspect(); }
      catch (error) { ready = false; throw error; }
    }),
  };
}

export async function takePrivateSnapshot(record: CommittedIntake, keys: WorkerKeys): Promise<PrivateSnapshot> {
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
  } finally { plaintext?.fill(0); await source.close(); }
}
export async function withPrivateFiles<T>(snapshot: PrivateSnapshot, keys: WorkerKeys, action: (snapshot: ProcessingSnapshot) => Promise<T>): Promise<T> {
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
    const files = [];
    for (const [index, file] of payload.files.entries()) {
      const bytes = Buffer.from(file.content, "base64"), path = join(directory, `${index}.data`);
      const fd = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      try { await fd.writeFile(bytes); } finally { bytes.fill(0); await fd.close(); }
      files.push(Object.freeze({ name: file.name, mediaType: file.mediaType, digest: digest(createHash("sha256").update(Buffer.from(file.content, "base64")).digest("hex")), bytes: Buffer.from(file.content, "base64").length, path }));
    }
    return await action(Object.freeze({ ...snapshot, input: Object.freeze({ ...payload.input }), files: Object.freeze(files) }));
  } finally { plaintext?.fill(0); await source.close(); if (directory) await keys.custody.finishProcessing(directory); }
}
