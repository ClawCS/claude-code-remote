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
  claimToken TEXT,
  claimKind TEXT CHECK(claimKind IN ('prepare','send','reconcile')),
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
CREATE TABLE deliveries (
  caseId TEXT PRIMARY KEY REFERENCES cases(id),
  messageId TEXT UNIQUE,
  keyId TEXT,
  identityDate TEXT,
  registered TEXT CHECK(registered IS NULL OR length(registered)<=4096),
  mimeDigest TEXT,
  sendDueAt TEXT,
  receiptStartedAt TEXT,
  receiptSchedule TEXT NOT NULL DEFAULT '[]' CHECK(length(receiptSchedule)<=256),
  receiptCursor INTEGER NOT NULL DEFAULT 0 CHECK(receiptCursor BETWEEN 0 AND 5),
  mailboxChecks INTEGER NOT NULL DEFAULT 0 CHECK(mailboxChecks BETWEEN 0 AND 5),
  confirmedAt TEXT,
  copies TEXT NOT NULL DEFAULT '[]' CHECK(length(copies)<=90000),
  category TEXT CHECK(category IN ('invalid','operational')),
  reason TEXT,
  determinedAt TEXT,
  cleanupDueAt TEXT,
  contactEnvelope TEXT CHECK(contactEnvelope IS NULL OR length(contactEnvelope)<=2752),
  CHECK((messageId IS NULL AND keyId IS NULL AND identityDate IS NULL) OR (messageId IS NOT NULL AND keyId IS NOT NULL AND identityDate IS NOT NULL)),
  CHECK(registered IS NULL OR messageId IS NOT NULL),
  CHECK(mimeDigest IS NULL OR registered IS NOT NULL)
);
CREATE TABLE delivery_attempts (
  caseId TEXT NOT NULL REFERENCES deliveries(caseId),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 1 AND 3),
  startedAt TEXT NOT NULL,
  finishedAt TEXT,
  outcome TEXT CHECK(outcome IN ('accepted','definitely_failed','uncertain')),
  retryable INTEGER CHECK(retryable IN (0,1)),
  mimeDigest TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  PRIMARY KEY(caseId,ordinal),
  CHECK((finishedAt IS NULL AND outcome IS NULL AND retryable IS NULL) OR
        (finishedAt IS NOT NULL AND outcome IS NOT NULL AND ((outcome='definitely_failed' AND retryable IS NOT NULL) OR (outcome!='definitely_failed' AND retryable IS NULL))))
);
CREATE UNIQUE INDEX delivery_unfinished ON delivery_attempts(caseId) WHERE finishedAt IS NULL;
CREATE UNIQUE INDEX delivery_claim_token ON cases(claimToken) WHERE claimToken IS NOT NULL;
CREATE TRIGGER case_accepted_at_immutable BEFORE UPDATE OF acceptedAt ON cases
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_ACCEPTED_AT'); END;
PRAGMA user_version = 4;
