CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  sessionHash TEXT NOT NULL,
  idempotencyKey TEXT NOT NULL,
  reservedBytes INTEGER NOT NULL CHECK (reservedBytes >= 0),
  expiresAt TEXT NOT NULL,
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  submission TEXT NOT NULL DEFAULT '{"kind":"application"}'
);
CREATE UNIQUE INDEX active_reservation_key ON reservations(sessionHash, idempotencyKey) WHERE active = 1;
CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  reservationId TEXT NOT NULL UNIQUE REFERENCES reservations(id),
  sessionHash TEXT NOT NULL,
  idempotencyKey TEXT NOT NULL,
  digest TEXT NOT NULL,
  encryptedName TEXT NOT NULL,
  job TEXT NOT NULL CHECK (job IN ('sales-fulltime', 'sales-parttime')),
  acceptedAt TEXT NOT NULL,
  deliveryState TEXT NOT NULL CHECK (deliveryState IN ('queued','scanning','ready','sending','smtp_accepted','uncertain','delivered','needs_attention')),
  caseState TEXT NOT NULL CHECK (caseState IN ('open','reviewing','rejected_closed','manual_case')),
  version INTEGER NOT NULL CHECK (version > 0),
  encryptedPayloadPath TEXT,
  payloadBytes INTEGER NOT NULL CHECK (payloadBytes >= 0),
  closedOn TEXT,
  deleteAfter TEXT,
  payloadDeleteAfter TEXT NOT NULL,
  contactDeleteAfter TEXT NOT NULL,
  claimOwner TEXT,
  claimedAt TEXT,
  submission TEXT NOT NULL DEFAULT '{"kind":"application"}',
  UNIQUE (sessionHash, idempotencyKey)
);
CREATE INDEX cases_queue ON cases(deliveryState, acceptedAt, id);
CREATE TABLE status_proofs (
  proofHash TEXT PRIMARY KEY,
  caseId TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  expiresAt TEXT NOT NULL
);
CREATE INDEX status_proofs_expiry ON status_proofs(expiresAt);
CREATE TABLE audit (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  caseId TEXT NOT NULL REFERENCES cases(id),
  event TEXT NOT NULL,
  version INTEGER NOT NULL,
  at TEXT NOT NULL
);
CREATE TABLE artifacts (
  caseId TEXT NOT NULL REFERENCES cases(id),
  kind TEXT NOT NULL CHECK(kind IN ('bundle','mime')),
  path TEXT NOT NULL UNIQUE,
  bytes INTEGER NOT NULL CHECK(bytes > 0),
  plaintextDigest TEXT NOT NULL,
  ciphertextDigest TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  PRIMARY KEY(caseId, kind)
);
CREATE TABLE artifact_reservations (
  caseId TEXT NOT NULL REFERENCES cases(id),
  kind TEXT NOT NULL CHECK(kind IN ('bundle','mime')),
  bytes INTEGER NOT NULL CHECK(bytes > 0),
  expiresAt TEXT NOT NULL,
  PRIMARY KEY(caseId, kind)
);
CREATE TABLE abuse_events (
  scope TEXT NOT NULL CHECK(scope IN ('session','ip')),
  key TEXT NOT NULL,
  occurredAt TEXT NOT NULL,
  expiresAt TEXT NOT NULL
);
CREATE INDEX abuse_events_key ON abuse_events(scope,key,occurredAt);
CREATE INDEX abuse_events_expiry ON abuse_events(expiresAt);
CREATE TRIGGER reservation_submission_immutable BEFORE UPDATE OF submission ON reservations
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_SUBMISSION'); END;
CREATE TRIGGER case_submission_immutable BEFORE UPDATE OF submission ON cases
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_SUBMISSION'); END;
PRAGMA user_version = 3;
