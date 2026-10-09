import { randomUUID } from "node:crypto";
import type { Secret } from "otpauth";
import { createPasswordHasher, ipDigest, newFactor, newRecoveryCodes, openFactor, provisioningUri, randomToken, recoveryDigest, sealFactor, tokenDigest, validPassword, verifyFactor } from "./auth-crypto";
import { assertAction, type AuthRepository, type AuthSessionRow, type AuthStaff } from "./auth-repository";
import { digest, staffId, utcInstant, type ApplicationAuth, type AuthDependencies, type Clock, type Digest, type Instant, type StaffSession } from "./types";

function publicSession(row: AuthSessionRow): StaffSession { return { sessionId: row.hash, staffId: row.staffId, generation: row.generation, issuedAt: row.issuedAt, expiresAt: row.expiresAt }; }
function later(now: Instant, ms: number): Instant { return utcInstant(new Date(Date.parse(now) + ms).toISOString()); }
export function trustedAuthEpoch(deps: Pick<AuthDependencies, "trust">): Digest {
  try { const value = deps.trust.currentEpoch(); if (typeof value !== "string") throw new Error(); return digest(value); }
  catch { throw new Error("AUTH_DENIED"); }
}
export function validAdminOrigin(origin: string | undefined, configured: string): boolean {
  try { const url = new URL(configured); return origin === configured && url.origin === configured && (url.protocol === "https:" || (process.env.NODE_ENV === "test" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))); }
  catch { return false; }
}
export function sessionCookie(token: string, expiresAt: Instant, now: Instant): string {
  tokenDigest("session", token); utcInstant(expiresAt); utcInstant(now);
  const seconds = Math.floor((Date.parse(expiresAt) - Date.parse(now)) / 1000);
  if (seconds <= 0 || seconds > 28800) throw new Error("AUTH_DENIED");
  return `__Host-tj-application-admin=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}; Expires=${new Date(expiresAt).toUTCString()}`;
}
export function expiredSessionCookie(): string { return "__Host-tj-application-admin=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0"; }

// Constructed exactly once by the current exclusive repository owner; the trust
// adapter and rate key must be worker-only, not request metadata or intake keys.
export function createAuthentication(store: AuthRepository, deps: AuthDependencies, clock: Clock): ApplicationAuth {
  if (!Buffer.isBuffer(deps.rateKey) || deps.rateKey.length !== 32) throw new Error("AUTH_DENIED");
  const rateKey = Buffer.from(deps.rateKey), hasher = createPasswordHasher();
  const now = () => utcInstant(clock.now().toISOString());
  const epoch = () => trustedAuthEpoch(deps);
  type Pending = { hash: Digest; secret: Secret; staff: AuthStaff; epoch: Digest; issuedAt: Instant; expiresAt: Instant; proof?: { step: number } | { recovery: Digest } };
  let pending: Pending | undefined;
  function stage(staff: AuthStaff, authority: Digest, issuedAt: Instant, proof?: Pending["proof"]) {
    if (pending && pending.expiresAt > issuedAt) throw new Error("AUTH_DENIED");
    const handle = randomToken(), secret = newFactor();
    pending = { hash: tokenDigest("replacement", handle), secret, staff, epoch: authority, issuedAt, expiresAt: later(issuedAt, 300000), proof };
    return { handle, provisioningUri: provisioningUri(secret) };
  }
  function finish(handle: string, otp: string, replacement: boolean) {
    const at = now(), authority = epoch(), item = pending;
    if (!item || item.hash !== tokenDigest("replacement", handle) || item.epoch !== authority || at < item.issuedAt || at >= item.expiresAt || !!item.proof !== replacement) throw new Error("AUTH_DENIED");
    const generation = item.staff.generation + (replacement ? 1 : 0), step = verifyFactor(item.secret, otp, Date.parse(at));
    const codes = newRecoveryCodes(), row = { ...item.staff, generation, lastStep: step, factor: sealFactor(item.secret, item.staff.id, generation, deps.keys.publicKey) };
    if (epoch() !== authority) throw new Error("AUTH_DENIED");
    const hashes = codes.map(code => recoveryDigest(code, row.id, generation));
    if (replacement) store.replace(item.staff, row, item.proof!, hashes, at); else store.enroll(row, hashes, at);
    pending = undefined; item.secret.bytes.fill(0);
    return { recoveryCodes: codes };
  }
  const service: ApplicationAuth = {
    async beginEnrollment(password, confirmation) {
      try {
        const authority = epoch(); if (!validPassword(password) || !validPassword(confirmation) || password !== confirmation || store.staff("niko")) throw new Error();
        const hashed = await hasher.hash(password), at = now();
        if (epoch() !== authority || store.staff("niko")) throw new Error();
        return stage({ id: staffId(randomUUID()), login: "niko", displayName: "Nikolaos Jammers", enabled: 1, generation: 1, password: hashed, factor: "", lastStep: 0 }, authority, at);
      } catch { throw new Error("AUTH_DENIED"); }
    },
    finishEnrollment: (handle, otp) => finish(handle, otp, false),
    async authenticate(input) {
      try {
        const authority = epoch(), initial = now();
        const staff = store.reserve(input.username, ipDigest(input.trustedIp, rateKey), initial);
        const valid = await hasher.verify(input.password, staff?.enabled === 1 ? staff.password : null), at = now();
        if (!valid || !staff || at < initial || epoch() !== authority) return { kind: "denied" };
        const step = verifyFactor(openFactor(staff.factor, staff.id, staff.generation, deps.keys.privateKey), input.otp, Date.parse(at));
        const token = randomToken(), csrf = randomToken();
        const row: AuthSessionRow = { hash: tokenDigest("session", token), staffId: staff.id, generation: staff.generation, epoch: authority, csrf: tokenDigest("csrf", csrf), issuedAt: at, lastSeen: at, expiresAt: later(at, 28800000), revoked: 0 };
        if (epoch() !== authority) return { kind: "denied" };
        store.login(row, step, at);
        return { kind: "authenticated", token, csrf, session: publicSession(row) };
      } catch { return { kind: "denied" }; }
    },
    authorizeSession(token, at) {
      try { const authority = epoch(), row = store.session(tokenDigest("session", token), authority, at, true); return row && epoch() === authority ? publicSession(row) : null; }
      catch { return null; }
    },
    async authorizeSensitiveAction(session, proof, action) {
      try {
        const authority = epoch(), initial = now(); assertAction(action);
        const own = store.session(session.sessionId, authority, initial);
        if (!own || own.staffId !== session.staffId || own.generation !== session.generation || own.issuedAt !== session.issuedAt || own.expiresAt !== session.expiresAt) throw new Error();
        const staff = store.reserve("niko", ipDigest(proof.trustedIp, rateKey), initial);
        const valid = await hasher.verify(proof.password, staff?.enabled === 1 ? staff.password : null), at = now();
        if (!valid || !staff || at < initial || epoch() !== authority) throw new Error();
        const step = verifyFactor(openFactor(staff.factor, staff.id, staff.generation, deps.keys.privateKey), proof.otp, Date.parse(at)), nonce = randomToken(), expiresAt = later(at, 300000);
        store.grant({ hash: tokenDigest("grant", nonce), staffId: own.staffId, sessionHash: own.hash, generation: own.generation, epoch: authority, action: action.kind, caseId: action.caseId, version: action.version, issuedAt: at, expiresAt }, step, at);
        return { nonce, staffId: own.staffId, action: { ...action }, issuedAt: at, expiresAt };
      } catch { throw new Error("AUTH_DENIED"); }
    },
    logout(token) { try { store.revoke(tokenDigest("session", token)); } catch { /* No token/account oracle. */ } },
    authorizeMutation(token, csrf, origin, configuredOrigin) {
      try {
        if (!validAdminOrigin(origin, configuredOrigin)) return null;
        const at = now(), authority = epoch(), row = store.session(tokenDigest("session", token), authority, at);
        if (!row || row.csrf !== tokenDigest("csrf", csrf)) return null;
        return service.authorizeSession(token, at);
      } catch { return null; }
    },
    async beginReplacement(proof) {
      try {
        const authority = epoch(), initial = now(), staff = store.reserve("niko", ipDigest(proof.trustedIp, rateKey), initial);
        const valid = await hasher.verify(proof.password, staff?.enabled === 1 ? staff.password : null), at = now();
        if (!valid || !staff || at < initial || epoch() !== authority) throw new Error();
        let replacement: Pending["proof"];
        if ("otp" in proof) {
          const step = verifyFactor(openFactor(staff.factor, staff.id, staff.generation, deps.keys.privateKey), proof.otp, Date.parse(at));
          if (step <= staff.lastStep) throw new Error(); replacement = { step };
        } else {
          const hash = recoveryDigest(proof.recoveryCode, staff.id, staff.generation);
          if (!store.recovery(staff.id, staff.generation, hash)) throw new Error(); replacement = { recovery: hash };
        }
        const current = store.staff("niko");
        if (!current || current.enabled !== 1 || current.generation !== staff.generation) throw new Error();
        return stage(staff, authority, at, replacement);
      } catch { throw new Error("AUTH_DENIED"); }
    },
    finishReplacement: (handle, otp) => finish(handle, otp, true),
  };
  return service;
}
