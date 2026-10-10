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
-- Task10 migration7: historical acceptance provenance stays NULL.
ALTER TABLE cases ADD COLUMN acceptanceEpochId TEXT;
CREATE TRIGGER case_acceptance_epoch_immutable BEFORE UPDATE OF acceptanceEpochId ON cases
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_ACCEPTANCE_EPOCH'); END;
CREATE TABLE journal_projection (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1), pass TEXT NOT NULL,
 ledgerId TEXT NOT NULL, historyEpoch TEXT NOT NULL, sequence TEXT NOT NULL,
 hash TEXT NOT NULL, observedAt TEXT, cursor TEXT NOT NULL
);
CREATE TABLE journal_facts (
 pass TEXT NOT NULL, eventId TEXT NOT NULL, sequence TEXT NOT NULL, entryHash TEXT NOT NULL,
 event TEXT NOT NULL CHECK(length(CAST(event AS BLOB))<=2048), caseId TEXT, kind TEXT NOT NULL,
 resultFor TEXT, PRIMARY KEY(pass,eventId), UNIQUE(pass,sequence), UNIQUE(pass,resultFor)
);
CREATE TABLE journal_fences (
 pass TEXT NOT NULL, caseId TEXT NOT NULL, eventId TEXT NOT NULL, sequence TEXT NOT NULL, entryHash TEXT NOT NULL,
 PRIMARY KEY(pass,caseId)
);
CREATE INDEX journal_case_facts ON journal_facts(pass,caseId,kind,length(sequence) DESC,sequence DESC);
CREATE TABLE deletion_progress(singleton INTEGER PRIMARY KEY CHECK(singleton=1), cycle INTEGER NOT NULL CHECK(cycle>0));
INSERT INTO deletion_progress VALUES(1,1);
CREATE TABLE deletion_state(
 caseId TEXT PRIMARY KEY REFERENCES cases(id), selectedCycle INTEGER NOT NULL DEFAULT 0, lastAttempt TEXT,
 status TEXT NOT NULL DEFAULT 'blocked' CHECK(status IN('blocked','partial','mailbox_cleared')),
 clearEventId TEXT, clearVersion INTEGER, clearSafetyRevision INTEGER,
 contradictory INTEGER NOT NULL DEFAULT 0 CHECK(contradictory IN(0,1))
);
CREATE TABLE deletion_events(
 eventId TEXT PRIMARY KEY, caseId TEXT NOT NULL REFERENCES cases(id), event TEXT NOT NULL CHECK(length(CAST(event AS BLOB))<=2048),
 resultFor TEXT UNIQUE,
 phase TEXT NOT NULL CHECK(phase IN('proposed','acknowledged')), entry TEXT CHECK(length(CAST(entry AS BLOB))<=4096), head TEXT CHECK(length(CAST(head AS BLOB))<=1024),
 CHECK((phase='proposed' AND entry IS NULL AND head IS NULL) OR (phase='acknowledged' AND entry IS NOT NULL AND head IS NOT NULL))
);
CREATE UNIQUE INDEX deletion_one_pending ON deletion_events(caseId) WHERE phase='proposed';
CREATE TRIGGER deletion_event_immutable BEFORE UPDATE OF eventId,caseId,event,resultFor ON deletion_events
BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_DELETION_EVENT'); END;
CREATE TABLE deletion_searches(
 attemptId TEXT NOT NULL REFERENCES deletion_events(eventId), round TEXT NOT NULL CHECK(round IN('1','2','3')),
 startedAt TEXT NOT NULL, finishedAt TEXT NOT NULL, expiresAt TEXT NOT NULL, complete INTEGER NOT NULL CHECK(complete IN(0,1)),
 issues TEXT NOT NULL CHECK(length(issues)<=1024), associations TEXT NOT NULL CHECK(length(associations)<=1400),
 PRIMARY KEY(attemptId,round)
);
CREATE TABLE deletion_diagnostics(
 eventId TEXT PRIMARY KEY, caseId TEXT NOT NULL REFERENCES cases(id), code TEXT NOT NULL CHECK(length(code)<=64), observedAt TEXT NOT NULL, expiresAt TEXT NOT NULL
);
CREATE INDEX deletion_due ON case_lifecycle(deleteFrom,caseId);
PRAGMA user_version = 7;
-- Task10 fix1 migration8: indexed recovery of durable contradiction evidence.
CREATE INDEX deletion_contradictory_result ON deletion_events(caseId)
 WHERE json_extract(event,'$[3]')='copy_result'
 AND json_extract(event,'$[4][2]')='mismatch'
 AND json_extract(event,'$[4][3]') IN ('INVALID_IDENTITY','CONTENT_MISMATCH','IDENTITY_CHANGED');
PRAGMA user_version = 8;
-- Task11A migration9: fixed erasure obligations survive removal of live parents.
CREATE TABLE erasure_events(
 eventId TEXT PRIMARY KEY CHECK(length(eventId)=32 AND eventId NOT GLOB '*[^a-f0-9]*'),
 caseId TEXT NOT NULL, event TEXT NOT NULL CHECK(length(CAST(event AS BLOB))<=2048 AND json_valid(event)),
 phase TEXT NOT NULL CHECK(phase IN('proposed','acknowledged')),
 entry TEXT CHECK(length(CAST(entry AS BLOB))<=4096), head TEXT CHECK(length(CAST(head AS BLOB))<=1024),
 CHECK(json_array_length(event)=5 AND json_extract(event,'$[0]')='tj-journal-event-v1' AND json_extract(event,'$[1]')=eventId AND json_extract(event,'$[4][0]')=caseId),
 CHECK(json_extract(event,'$[3]') IN('erase_commit','erase_done')),
 CHECK((phase='proposed' AND entry IS NULL AND head IS NULL) OR (phase='acknowledged' AND entry IS NOT NULL AND head IS NOT NULL))
);
CREATE UNIQUE INDEX erasure_one_pending ON erasure_events(caseId) WHERE phase='proposed';
CREATE TRIGGER erasure_event_immutable BEFORE UPDATE OF eventId,caseId,event ON erasure_events
BEGIN SELECT RAISE(ABORT,'IMMUTABLE_ERASURE_EVENT'); END;
CREATE TABLE erasure_replay(
 ledgerId TEXT NOT NULL, historyEpoch TEXT NOT NULL, associationKeyId TEXT NOT NULL,
 replayAssociation TEXT NOT NULL CHECK(length(replayAssociation)=64 AND replayAssociation NOT GLOB '*[^a-f0-9]*'),
 stagedEventId TEXT NOT NULL, committedEventId TEXT,
 PRIMARY KEY(ledgerId,historyEpoch,associationKeyId,replayAssociation)
);
CREATE TABLE erasure_obligations(
 commitEventId TEXT PRIMARY KEY, caseId TEXT NOT NULL,
 scope TEXT NOT NULL CHECK(scope IN('processing_payload','processing_contact','public_token','incident_identity','identifying_register')),
 ledgerId TEXT NOT NULL, historyEpoch TEXT NOT NULL, associationKeyId TEXT NOT NULL, replayAssociation TEXT NOT NULL,
 sequence TEXT NOT NULL, entryHash TEXT NOT NULL, inspectionGeneration TEXT NOT NULL,
 stage TEXT NOT NULL DEFAULT 'rows-pending' CHECK(stage IN('rows-pending','database-maintenance-pending','locally-complete')),
 historicalDone TEXT UNIQUE, selectedCycle INTEGER NOT NULL DEFAULT 0 CHECK(selectedCycle BETWEEN 0 AND 9007199254740991)
);
CREATE INDEX erasure_work_order ON erasure_obligations(inspectionGeneration,selectedCycle,length(sequence),sequence,caseId,commitEventId) WHERE stage!='locally-complete';
CREATE INDEX erasure_case_scope ON erasure_obligations(caseId,scope);
CREATE TRIGGER erasure_obligation_immutable BEFORE UPDATE OF commitEventId,caseId,scope,ledgerId,historyEpoch,associationKeyId,replayAssociation,sequence,entryHash ON erasure_obligations
BEGIN SELECT RAISE(ABORT,'IMMUTABLE_ERASURE_OBLIGATION'); END;
CREATE TABLE erasure_scopes(
 caseId TEXT NOT NULL, scope TEXT NOT NULL CHECK(scope IN('processing_payload','processing_contact','public_token','incident_identity','identifying_register')),
 eventId TEXT NOT NULL, committed INTEGER NOT NULL CHECK(committed IN(0,1)), PRIMARY KEY(caseId,scope)
);
CREATE TRIGGER erasure_scope_monotonic BEFORE UPDATE OF committed ON erasure_scopes WHEN NEW.committed<OLD.committed
BEGIN SELECT RAISE(ABORT,'MONOTONIC_ERASURE_SCOPE'); END;
CREATE TABLE erasure_progress(singleton INTEGER PRIMARY KEY CHECK(singleton=1),cycle INTEGER NOT NULL CHECK(cycle BETWEEN 1 AND 9007199254740991));
INSERT INTO erasure_progress VALUES(1,1);
CREATE TABLE erasure_maintenance(
 singleton INTEGER PRIMARY KEY CHECK(singleton=1), authLocked INTEGER NOT NULL DEFAULT 0 CHECK(authLocked IN(0,1)),
 sanitation TEXT NOT NULL DEFAULT 'unqualified' CHECK(sanitation IN('unqualified','required','pending')),
 scanPass TEXT NOT NULL CHECK(length(scanPass)=32 AND scanPass NOT GLOB '*[^a-f0-9]*')
);
INSERT INTO erasure_maintenance(singleton,scanPass) VALUES(1,lower(hex(randomblob(16))));
CREATE TRIGGER erasure_auth_lock_monotonic BEFORE UPDATE OF authLocked ON erasure_maintenance WHEN NEW.authLocked<OLD.authLocked
BEGIN SELECT RAISE(ABORT,'AUTH_RESTORE_LOCKED'); END;
CREATE TABLE erasure_safety_carry(
 eventId TEXT PRIMARY KEY, caseId TEXT NOT NULL, source TEXT NOT NULL CHECK(source IN('lifecycle','mailbox')),
 event TEXT NOT NULL CHECK(length(CAST(event AS BLOB))<=2048 AND json_valid(event)),
 phase TEXT NOT NULL CHECK(phase IN('proposed','acknowledged')),
 entry TEXT CHECK(length(CAST(entry AS BLOB))<=4096), head TEXT CHECK(length(CAST(head AS BLOB))<=1024),
 coveringCommit TEXT NOT NULL REFERENCES erasure_obligations(commitEventId), UNIQUE(caseId,source),
 CHECK(json_array_length(event)=5 AND json_extract(event,'$[1]')=eventId AND json_extract(event,'$[4][0]')=caseId),
 CHECK((source='lifecycle' AND json_extract(event,'$[3]')='case_fence') OR (source='mailbox' AND json_extract(event,'$[3]') IN('attempt_intent','copy_mutation_started','copy_result','mailbox_clear_observed'))),
 CHECK((phase='proposed' AND entry IS NULL AND head IS NULL) OR (phase='acknowledged' AND entry IS NOT NULL AND head IS NOT NULL))
);
CREATE TABLE erasure_scans(
 pass TEXT NOT NULL CHECK(length(pass)=32 AND pass NOT GLOB '*[^a-f0-9]*'), root TEXT NOT NULL CHECK(root IN('incoming','custody','runtime')),
 state TEXT NOT NULL CHECK(state IN('scanning','complete','blocked')), itemCount INTEGER NOT NULL CHECK(itemCount BETWEEN 0 AND 9007199254740991),
 error TEXT CHECK(error IN('UNKNOWN_OBJECT','OWNERSHIP_INVALID','JOURNAL_INVALID','INGRESS_RECOVERY_REQUIRED','STORAGE_FAILED')),
 PRIMARY KEY(pass,root), CHECK((state='blocked')=(error IS NOT NULL))
);
CREATE TABLE erasure_inventory_journals(
 pass TEXT NOT NULL CHECK(length(pass)=32 AND pass NOT GLOB '*[^a-f0-9]*'), journalId TEXT NOT NULL CHECK(length(journalId)=36 AND journalId NOT GLOB '*[^a-f0-9-]*'), caseId TEXT,
 kind TEXT NOT NULL CHECK(kind IN('intake','artifact','processing')), version INTEGER NOT NULL CHECK(version IN(1,2,3)),
 state TEXT NOT NULL CHECK(state IN('reserved','committed','orphan')), artifactKind TEXT CHECK(artifactKind IN('bundle','mime')),
 budget INTEGER NOT NULL CHECK(budget BETWEEN 1 AND 134217728), cleanupAfter TEXT NOT NULL,
 reservationId TEXT, generation TEXT, domain TEXT, allowance INTEGER CHECK(allowance BETWEEN 1 AND 9007199254740991),
 PRIMARY KEY(pass,journalId), CHECK((kind='artifact')=(artifactKind IS NOT NULL)),
 CHECK((kind='intake' AND reservationId IS NOT NULL AND reservationId=journalId) OR (kind!='intake' AND reservationId IS NULL AND generation IS NULL AND domain IS NULL AND allowance IS NULL)),
 CHECK((generation IS NULL AND domain IS NULL AND allowance IS NULL AND (kind!='intake' OR version=1)) OR (kind='intake' AND generation IS NOT NULL AND domain IS NOT NULL AND length(generation)>0 AND length(domain)>0 AND allowance BETWEEN 1 AND 14747648)),
 CHECK(kind='processing' OR (kind='intake' AND budget<=29495296) OR (kind='artifact' AND ((artifactKind='bundle' AND budget<=10553344) OR (artifactKind='mime' AND budget<=16779264)))),
 CHECK(length(CAST(COALESCE(generation,'') AS BLOB))+length(CAST(COALESCE(domain,'') AS BLOB))<=4096)
);
CREATE TABLE erasure_inventory_objects(
 pass TEXT NOT NULL, journalId TEXT NOT NULL, slot TEXT NOT NULL CHECK(slot IN('incoming-sealed','original-sealed','artifact-staging','artifact-sealed','processing-directory','processing-file','journal','journal-temp')),
 leaf TEXT NOT NULL DEFAULT '', root TEXT NOT NULL CHECK(root IN('incoming','custody','runtime')),
 presence TEXT NOT NULL CHECK(presence IN('present','absent')), device INTEGER, inode INTEGER, size INTEGER,
 type TEXT CHECK(type IN('file','directory')), uid INTEGER, gid INTEGER, mode INTEGER, nlink INTEGER,
 leaseState TEXT CHECK(leaseState IN('prepared','bounded','quiescent','released')), chargedBytes INTEGER,
 leaseDevice INTEGER, leaseInode INTEGER,
 PRIMARY KEY(pass,journalId,slot,leaf), FOREIGN KEY(pass,journalId) REFERENCES erasure_inventory_journals(pass,journalId),
 CHECK((slot='incoming-sealed' AND root='incoming') OR (slot IN('processing-directory','processing-file') AND root='runtime') OR (slot IN('original-sealed','artifact-staging','artifact-sealed','journal','journal-temp') AND root='custody')),
 CHECK((slot='processing-file' AND (leaf GLOB '[0-4].data' OR leaf GLOB 'document-[1-5].pdf' OR leaf GLOB 'document-[1-5].jpg' OR leaf GLOB 'document-[1-5].png')) OR (slot='journal-temp' AND length(leaf)=36 AND leaf NOT GLOB '*[^a-f0-9-]*') OR (slot NOT IN('processing-file','journal-temp') AND leaf='')),
 CHECK((presence='absent' AND device IS NULL AND inode IS NULL AND size IS NULL AND type IS NULL AND uid IS NULL AND gid IS NULL AND mode IS NULL AND nlink IS NULL) OR (presence='present' AND device IS NOT NULL AND inode IS NOT NULL AND size IS NOT NULL AND type IS NOT NULL AND uid IS NOT NULL AND gid IS NOT NULL AND mode IS NOT NULL AND nlink IS NOT NULL AND device BETWEEN 0 AND 9007199254740991 AND inode BETWEEN 0 AND 9007199254740991 AND size BETWEEN 0 AND 9007199254740991 AND uid BETWEEN 0 AND 9007199254740991 AND gid BETWEEN 0 AND 9007199254740991 AND mode BETWEEN 0 AND 4095 AND ((slot='processing-directory' AND type='directory' AND nlink BETWEEN 1 AND 9007199254740991) OR (slot!='processing-directory' AND type='file' AND nlink=1)))),
 CHECK((leaseState IS NULL AND chargedBytes IS NULL AND leaseDevice IS NULL AND leaseInode IS NULL) OR (leaseState IS NOT NULL AND slot='incoming-sealed' AND chargedBytes IS NOT NULL AND chargedBytes BETWEEN 0 AND 9007199254740991 AND ((leaseDevice IS NULL AND leaseInode IS NULL) OR (leaseDevice IS NOT NULL AND leaseInode IS NOT NULL AND leaseDevice BETWEEN 0 AND 9007199254740991 AND leaseInode BETWEEN 0 AND 9007199254740991)))),
 CHECK(leaseState!='released' OR (chargedBytes=0 AND leaseDevice IS NULL AND leaseInode IS NULL))
);
CREATE TRIGGER erasure_object_kind_insert BEFORE INSERT ON erasure_inventory_objects
WHEN NOT EXISTS(SELECT 1 FROM erasure_inventory_journals j WHERE j.pass=NEW.pass AND j.journalId=NEW.journalId
 AND ((NEW.slot IN('incoming-sealed','original-sealed') AND j.kind='intake') OR (NEW.slot IN('artifact-staging','artifact-sealed') AND j.kind='artifact') OR (NEW.slot IN('processing-directory','processing-file') AND j.kind='processing') OR NEW.slot IN('journal','journal-temp'))
 AND (NEW.leaseState IS NULL OR (j.allowance IS NOT NULL AND NEW.chargedBytes<=j.allowance)))
BEGIN SELECT RAISE(ABORT,'ERASURE_INVENTORY_INVALID');END;
CREATE TRIGGER erasure_object_binding_immutable BEFORE UPDATE OF pass,journalId,slot,leaf,root ON erasure_inventory_objects
BEGIN SELECT RAISE(ABORT,'IMMUTABLE_ERASURE_OBJECT');END;
CREATE TRIGGER erasure_journal_binding_immutable BEFORE UPDATE OF pass,journalId,kind,version,artifactKind,reservationId,generation,domain,allowance ON erasure_inventory_journals
BEGIN SELECT RAISE(ABORT,'IMMUTABLE_ERASURE_JOURNAL');END;
CREATE TABLE erasure_manifests(
 eraseCommitId TEXT NOT NULL REFERENCES erasure_obligations(commitEventId), scanPass TEXT NOT NULL, journalId TEXT NOT NULL,
 slot TEXT NOT NULL, leaf TEXT NOT NULL DEFAULT '', expectedDevice INTEGER, expectedInode INTEGER,
 expectedSize INTEGER NOT NULL CHECK(expectedSize BETWEEN 0 AND 9007199254740991), remainingCharge INTEGER NOT NULL CHECK(remainingCharge BETWEEN 0 AND 9007199254740991),
 phase TEXT NOT NULL CHECK(phase IN('planned','holders-released','absent-synced','metadata-finalized')),
 PRIMARY KEY(eraseCommitId,journalId,slot,leaf), FOREIGN KEY(scanPass,journalId,slot,leaf) REFERENCES erasure_inventory_objects(pass,journalId,slot,leaf),
 CHECK((expectedDevice IS NULL AND expectedInode IS NULL) OR (expectedDevice IS NOT NULL AND expectedInode IS NOT NULL AND expectedDevice BETWEEN 0 AND 9007199254740991 AND expectedInode BETWEEN 0 AND 9007199254740991))
);
CREATE TRIGGER erasure_manifest_binding_immutable BEFORE UPDATE OF eraseCommitId,scanPass,journalId,slot,leaf,expectedDevice,expectedInode,expectedSize ON erasure_manifests
BEGIN SELECT RAISE(ABORT,'IMMUTABLE_ERASURE_MANIFEST');END;
CREATE INDEX erasure_status_proofs ON status_proofs(caseId,proofHash);
CREATE INDEX erasure_audit ON audit(caseId,sequence);
CREATE INDEX erasure_grants ON auth_grants(caseId,hash);
CREATE INDEX erasure_lifecycle_audit ON lifecycle_audit(caseId,sequence);
CREATE INDEX erasure_positive_audit ON lifecycle_audit(caseId,sequence DESC) WHERE kind='confirm-external-copies';
CREATE INDEX erasure_invalidated_audit ON lifecycle_audit(caseId,sequence) WHERE newExternalConfirmed=0;
CREATE INDEX erasure_lifecycle_proposals ON lifecycle_proposals(caseId,eventId);
CREATE INDEX erasure_mail_events ON deletion_events(caseId,eventId);
CREATE INDEX erasure_diagnostics ON deletion_diagnostics(caseId,eventId);
CREATE INDEX erasure_reservations ON reservations(sessionHash,idempotencyKey,id);
PRAGMA user_version = 9;
