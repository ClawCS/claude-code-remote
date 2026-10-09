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
CREATE TABLE auth_staff (
 id TEXT PRIMARY KEY, login TEXT NOT NULL UNIQUE CHECK(login='niko'),
 displayName TEXT NOT NULL CHECK(displayName='Nikolaos Jammers'),
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)), generation INTEGER NOT NULL CHECK(generation>0),
 password TEXT NOT NULL CHECK(length(password)<=512), factor TEXT NOT NULL CHECK(length(factor)<=1456),
 lastStep INTEGER NOT NULL CHECK(lastStep>=0)
);
CREATE TABLE auth_sessions (
 hash TEXT PRIMARY KEY, staffId TEXT NOT NULL REFERENCES auth_staff(id), generation INTEGER NOT NULL,
 epoch TEXT NOT NULL, csrf TEXT NOT NULL, issuedAt TEXT NOT NULL, lastSeen TEXT NOT NULL,
 expiresAt TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN(0,1))
);
CREATE TABLE auth_grants (
 hash TEXT PRIMARY KEY, staffId TEXT NOT NULL REFERENCES auth_staff(id), sessionHash TEXT NOT NULL REFERENCES auth_sessions(hash),
 generation INTEGER NOT NULL, epoch TEXT NOT NULL, action TEXT NOT NULL,
 caseId TEXT NOT NULL REFERENCES cases(id), version INTEGER NOT NULL,
 issuedAt TEXT NOT NULL, expiresAt TEXT NOT NULL
);
CREATE TABLE auth_recovery (
 hash TEXT PRIMARY KEY, staffId TEXT NOT NULL REFERENCES auth_staff(id), generation INTEGER NOT NULL
);
CREATE TABLE auth_attempts (
 scope TEXT NOT NULL CHECK(scope IN('staff','ip')), key TEXT NOT NULL, at TEXT NOT NULL
);
CREATE INDEX auth_attempts_key ON auth_attempts(scope,key,at);
CREATE TABLE auth_clock (singleton INTEGER PRIMARY KEY CHECK(singleton=1), lastAt TEXT NOT NULL);
PRAGMA user_version = 5;
CREATE TABLE case_lifecycle (
 caseId TEXT PRIMARY KEY REFERENCES cases(id),
 identityState TEXT NOT NULL DEFAULT 'identifying' CHECK(identityState IN('identifying','minimized')),
 initialAuthority TEXT, authorityKind TEXT CHECK(authorityKind IN('initial','fence')), authorityId TEXT,
 safetyRevision INTEGER NOT NULL DEFAULT 0 CHECK(safetyRevision>=0), pendingEventId TEXT,
 deadline TEXT, deleteFrom TEXT, manualCategory TEXT CHECK(manualCategory IN('hired','withdrawn','data-subject-request','other')),
 holdReviewOn TEXT, holdReason TEXT CHECK(length(CAST(holdReason AS BLOB))<=2000), holdActor TEXT, holdAt TEXT,
 externalCopiesConfirmed INTEGER NOT NULL DEFAULT 0 CHECK(externalCopiesConfirmed IN(0,1)), externalCopiesAt TEXT, externalCopiesActor TEXT,
 externalCopiesReason TEXT CHECK(length(CAST(externalCopiesReason AS BLOB))<=2000)
);
INSERT INTO case_lifecycle(caseId) SELECT id FROM cases;
CREATE TRIGGER lifecycle_initial_immutable BEFORE UPDATE OF initialAuthority ON case_lifecycle
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_INITIAL_AUTHORITY'); END;
CREATE TRIGGER lifecycle_identity_monotonic BEFORE UPDATE OF identityState ON case_lifecycle WHEN OLD.identityState='minimized' AND NEW.identityState!='minimized'
BEGIN SELECT RAISE(ABORT, 'MINIMIZED_CASE'); END;
CREATE TABLE lifecycle_proposals (
 eventId TEXT PRIMARY KEY, caseId TEXT NOT NULL REFERENCES case_lifecycle(caseId),
 event TEXT NOT NULL CHECK(length(CAST(event AS BLOB))<=2048),
 actionBytes TEXT NOT NULL CHECK(length(CAST(actionBytes AS BLOB))<=4096),
 grantHash TEXT NOT NULL, phase TEXT NOT NULL CHECK(phase IN('proposed','acknowledged','applied','superseded')),
 entry TEXT CHECK(length(CAST(entry AS BLOB))<=4096), head TEXT CHECK(length(CAST(head AS BLOB))<=1024),
 CHECK((phase='proposed' AND entry IS NULL AND head IS NULL) OR (phase!='proposed' AND entry IS NOT NULL AND head IS NOT NULL))
);
CREATE INDEX lifecycle_pending ON case_lifecycle(caseId) WHERE pendingEventId IS NOT NULL;
CREATE TRIGGER lifecycle_proposal_immutable BEFORE UPDATE OF eventId,caseId,event,actionBytes,grantHash ON lifecycle_proposals
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_LIFECYCLE_PROPOSAL'); END;
CREATE TABLE lifecycle_audit (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT, caseId TEXT NOT NULL REFERENCES cases(id),
 kind TEXT NOT NULL CHECK(kind IN('review','reject','correct-date','reopen','hold','release-hold','manual-case','confirm-external-copies')),
 actor TEXT NOT NULL REFERENCES auth_staff(id), at TEXT NOT NULL, version INTEGER NOT NULL,
 reason TEXT CHECK(length(CAST(reason AS BLOB))<=2000), eventId TEXT REFERENCES lifecycle_proposals(eventId),
 oldState TEXT NOT NULL, newState TEXT NOT NULL, oldClosedOn TEXT, newClosedOn TEXT,
 oldDeadline TEXT, newDeadline TEXT, oldDeleteFrom TEXT, newDeleteFrom TEXT,
 oldHoldReviewOn TEXT, newHoldReviewOn TEXT, oldHoldReason TEXT, newHoldReason TEXT, oldHoldActor TEXT, newHoldActor TEXT, oldHoldAt TEXT, newHoldAt TEXT,
 oldManualCategory TEXT, newManualCategory TEXT, oldExternalConfirmed INTEGER NOT NULL, newExternalConfirmed INTEGER NOT NULL,
 oldExternalAt TEXT, newExternalAt TEXT, oldExternalActor TEXT, newExternalActor TEXT, oldExternalReason TEXT, newExternalReason TEXT,
 UNIQUE(caseId,version)
);
PRAGMA user_version = 6;
