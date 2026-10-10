# Task10 — finite targeted mailbox cleanup

BASE `df84e796f4f9a5dd91319215ceb1c8a3c02849c2`; branch `codex/cinematic-production`; worktree `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`. Implements the combined brief and R77–79/R83 on reviewed Task9B `cb7e52c`. Local synthetic evidence only: no provider qualification, activation, overall erasure or independent-review claim. Controller owns independent review.

## APIs and original owner

- `runDeletionOnce(deps): Promise<DeletionReport>` receives original repository, JournalClock, optional independent DeletionScopePort, current complete `verificationKeys()` map, and `createMailbox(actualTask6RunBudget)`. It obtains the one journal from the original owner, not another reader/dependency.
- Frozen report: runId32hex, ownership=`settled|retained`, stopReason=`finished|deadline|blocked`, hasMore, at-most20 frozen `{id,status,reason,externalCopiesConfirmed}` results. Status=`not_due|held|mailbox_cleared|partial|blocked`; reason is a closed local/Task6 code. Selected unvisited cases remain blocked/DEFERRED. No arbitrary provider text, overall closure or automatic successor.
- Internal `hasRetainedDeletion(repository)` and `awaitDeletionSettlement(repository)` observe the same private WeakMap. Slot installation precedes ID/budget/adapter allocation. Repeated invocations with different wrappers return the exact original promise. Real work/cleanup, not timeout/report, removes that exact slot. Settlement helper starts nothing.
- `openRepository(path,clock,{journal?:SafetyJournal})` becomes `openRepository(path,clock,{journalFactory?:(projection:JournalSafetyProjection)=>SafetyJournal,admissionScope?:AdmissionScopePort})`. One original DB constructs one frozen sink and calls the factory exactly once synchronously, retaining the facade before lifecycle/deletion composition. Construction failure closes DB. Missing configuration fails closed. No setter, second connection, RPC or HTTP API.
- Internal deletion-repository binding exposes fixed owner methods snapshot,pending,prepare,acknowledge,start,search,diagnostic,clear and bounded listWork. Case-specific methods require the existing original AsyncLocalStorage guard, not a second mutex. Existing active claims are never stolen/reset.

## Original provenance and keyed associations

Original commitIntake captures repository clock once inside its existing transaction; that trusted instant controls reservation expiry, acceptedAt, deadlines, proof and audit. Caller input.now remains shape-validated, not authority. Stored reservation submission must match current exact AdmissionScope `[epoch32hex,application|synthetic,null|pilotRunId,validFrom,validThrough|null]`, with half-open interval. Missing/throwing/malformed/inactive/mismatching scope blocks acceptance. Epoch, initial lifecycle authority, case, delivery, reservations and audit are atomic. Replays retain original acceptedAt/epoch, do not require today's scope and never backfill historical nulls.

Separate DeletionScopePort supplies exact `{ledgerId,historyEpoch,associationKeyId,associationKey,approvedScopes}`:32-byte key, `[a-z0-9-]{1,32}` ID,1–16 dense exact scopes with unique epochs. Snapshots copy bytes/freeze primitive tuples. Every relevant boundary rechecks whole scope/key configuration, fresh full registration, all verification-key entries, provenance/submission, local version/safety/authority/hold/calendar and claims, plus independent current case authority. Admission is not deletion approval. Dedicated provisioning/one-key-per-history policy remain14/15; no automatic rotation or persisted-DB trust fallback.

Pure deletion-association APIs: snapshotAdmissionScope, snapshotDeletionScope, admissionScopeAccepts, sameDeletionScope, registrationAssociation, copyAssociation. Exact approved domain prefixes `tj-deletion-registration-v1\n` / `tj-deletion-copy-v1\n` and flat ordered canonical JSON feed HMAC-SHA256. Full registration shape/profile, generated attachment names/order/media/count/size limits are checked before encoding.32768-byte ceiling includes domain/newline; tested maxima1075/12472 bytes. Copy path1–4096 UTF-16 units, well-formed Unicode/no forbidden controls; positive canonical32-bit UID/UIDVALIDITY. No normalization/truncation/unkeyed hash/raw preimage logging or saved-route retry.

## R83 inline safety projection

Exact worker-only sink: beginProjection(anchor), applyVerifiedEntry(previous,entry), readCaseAuthority(caseId,expectedAppliedHead). JournalFenceFact={eventId,sequence,entryHash}; SafetyJournal.caseAuthority returns null for unavailable, non-null `{head,latestFence:null}` only for covered no-fence proof. Facade checks fresh unchanged trust/time and exact verified/applied head around the indexed query; bounded outputs are frozen.

journal-projection creates a new random pass at each owner construction. Only independently pinned genesis is supported. Restored pass/head claims and non-genesis earlier state are never trusted; no startup bulk deletion. Per verified entry, one synchronous original-DB transaction checks exact previous head, applies minimal causal/fence facts, and advances applied head atomically. Indexed latest fence cross-checks the derived row with its verified fact. Fence ancestry, same-case intent/marker/clear references, unique marker-result and exact reverified event/hash prefix are enforced. Rewind verification cannot regress global checkpoint.

Existing1000-entry/8MiB/30s replay includes projection with pre/post deadline/trust checks. No extra phase, second reader, whole-history array, case lock acquisition, business mutation, grant consumption or network inside projection. Iterator cleanup must actually finish before current observation. SQL fault/timeout keeps precise pending target/prefix for explicit bounded recovery, never automatic fresh-ID retry.

Narrow lifecycle integration compares locally validated binding to latest projected fence before proposal, after ack, at final grant transaction and during exact pending recovery. An independently newer fence absent from local business history blocks stale actions/deletion without reconstructing missing decisions. Historical unknown ordinary review/attestation behavior stays intact, without deletion authority.

## Phases, evidence and recovery

Closed R77 payloads under unchanged canonical signed-envelope/size/depth rules:

1. attempt_intent `[caseId,runId,authorityKind,authorityId,expectedVersionDecimal,acceptanceEpochId,associationKeyId,registrationAssociation]`.
2. copy_mutation_started `[caseId,intentEventId,round1to3,copyAssociation]`.
3. copy_result `[caseId,markerEventId,resultKind,issueOrNull]`: deleted/not-found=null; mismatch=INVALID_IDENTITY|CONTENT_MISMATCH|UIDVALIDITY_CHANGED|IDENTITY_CHANGED; blocked=DEPENDENCY_UNAVAILABLE|CONNECTION_FAILED|OPERATION_TIMEOUT|PROTOCOL_LIMIT|FOLDER_UNAVAILABLE|CANDIDATE_LIMIT|INCOMPLETE_CONTENT|UNSAFE_DELETE_CAPABILITY|WRITE_UNAVAILABLE; uncertain=DELETE_UNCERTAIN.
4. mailbox_clear_observed `[caseId,intentEventId,round1to3,searchStartedAt,searchFinishedAt,listed-selectable-v1]`; start<=finish<=event, both search times independently operationally bounded during signed verification.

Exact proposals persist before append. Acknowledgement stores original signed entry/head. Intent precedes discovery, acknowledged marker precedes fresh-copy mutation, exact result is locally proposed before another mutation. Clear requires exact stored complete issue-free empty intent/round/time evidence and no contradiction, then original receipt and fresh authorization before technical-clear state. No DB transaction crosses network awaits.

Unknown/lost acknowledgement stops. Later explicit run recovers the exact saved ID/payload, distinguishes fresh recovery barrier from original phase receipt, retrieves original receipt via idempotent append, validates event/sequence/hash binding against verified projection and defers without IMAP. Restart regression covers lost result acknowledgement, then new discovery with no saved UID retry. Acknowledged marker without result never implies non-mutation/success.

Incomplete/any-issue search performs zero mutation. Contradictory identity/content issue history latches separately; later empty search cannot erase it. Transient uncertainty resolves only with later fresh complete issue-free empty evidence, preserving original diagnostic timestamps/expiry. Round3 mutation remains partial until a separate invocation proves absence. Organizational confirmation is separate and never a technical-cleanup prerequisite or overall closure claim.

## Finite work and settlement

One real Task6 budget grants20 discovery/revalidation credits across cases/adapter instances; one global counter admits at most3 actual findVerified calls. SQL selects max20 ordered due/lastAttempt/ID; persisted selectedCycle/cycle provides fair continuation across restart. No whole-backlog array/slice.

Run900000ms begins before enumeration/lock acquisition. Acquired-case600000ms is capped by run deadline. Real timers and monotonic absolute deadlines latch expiry; rollback fails closed.55s journal/refresh,160s discovery/empty evidence,250s possible mutation reserves include the approved cleanup allowance. Checks follow awaits and precede effects, including after synchronous proposal persistence. Insufficient reserve defers without marker/delete. Guard acquired after expiry does no external work.

MailboxPort.settle snapshots actual admitted serial/underlying operation promises, including timeout losers and logout cleanup. Disconnect remains bounded stop request, not settlement. SafetyJournal.settle snapshots admitted queue/replay/iterator-cleanup ownership, even after public timeout. Neither method starts reconciliation or changes freshness/uncertainty/outcome. Real entered-messageDelete and delayed journal/iterator regressions test ownership.

Guarded callback requests disconnect then awaits both genuine settle observers via allSettled; one rejecting observer cannot release another pending owner. Deadline only delivers immutable retained report. Guard/slot may remain indefinitely for unsettled work. Late exact observed result may persist locally as pending, but no future journal/mailbox effect or retroactive report upgrade. No unowned cleanup/retry.

## Schema7 and Task11 seam

Exactly one appended migration7 follows frozen prior0–6 stages; historical1/2/3/4/5/6 and fresh0/reopen regressions preserve actual acceptance/auth/grants/delivery/custody/lifecycle facts. cases.acceptanceEpochId is nullable historical, immutable after insert.

- journal_projection: singleton pass/ledger/history/exact applied sequence/hash/time/cursor.
- journal_facts: pass/event/sequence/hash, canonical minimal safety event, case/kind, unique resultFor; indexed event/sequence/latest-case-fence/result queries.
- journal_fences: pass/case/latest event/sequence/hash, no business reconstruction.
- deletion_progress: durable selection cycle.
- deletion_state: case selectedCycle,lastAttempt,status blocked|partial|mailbox_cleared,clearEventId/version/safetyRevision,contradictory latch.
- deletion_events: immutable exact case/event/resultFor,proposed|acknowledged,original entry/head; one pending/case and one result/marker.
- deletion_searches: intent/round,observed start/finish/30-day expiry,complete,fixed issues,keyed associations.
- deletion_diagnostics: random ID/case/fixed code/observedAt/30-day expiry. Retry never rewrites old observation expiry.

No new raw mailbox route/UID/UIDVALIDITY/address/body/file/provider text storage. Existing Task7 copies untouched. Task11 extends this same closed projection with physical minimization/erase/replay-suppression and consumes pending facts; no second applyRestoreBatch reader. Actual30-day cleanup/inactive-pass pruning remain11 under approved coverage, not indefinite retention.

## RED/GREEN and fixture evidence

- R77:20 intended RED/58 pass, then codec+facade116 green. R78 throwing-stub behavioral RED7/48, then171 green. Signed clear operational-bound RED1 and sparse-scope RED1 then combined173 green. Module-resolution errors were not counted as behavioral RED.
- Projection/provenance initially5 RED then5 green. Independently newer-fence lifecycle test RED on stale JOURNAL_UNKNOWN path, then exact current-authority check green. Missing settle APIs RED then genuine deferred mailbox/journal ownership green. Fake-timer/network fixture was replaced by real loopback already-entered messageDelete, not a resolved mock.
- Full verification-key configuration change and one cleanup rejection against another pending owner:2 RED then2 green. Sparse copies/issues:2 RED then green. Missing/wrong restored fence versus verified facts:2 RED then green. Persisted transient state incorrectly blocked while report partial:1 RED then2 focused green after status correction.
- Integrated six-file focused run (deletion,lifecycle,ledger-contract,deletion-association,ledger,imap-protocol, --maxWorkers=2):335/335 green,62.02s. Five added fence/deadline/restart/expiry checks green; two cross-case/duplicate causal checks green; queued-lock expiry green. Restartable fair selector green after explicit valid historical fixture correction. Final aggregate contains45 deletion tests.
- Existing fixture corrected six-file run170/170 green. Initial nine-file run8 failed/228 passed from missing explicit synthetic scope/clock, old-schema fixtures, child fixture imports and one admission stress timeout under concurrent load; focused reruns passed. No security assertions removed.

Fixture inventory: fixtures/admission.ts adds test-only openTestRepository, explicit2020–2035 application scope/trusted default2026-10-09 clock and removeTask10Schema for genuine prior schemas. fixtures/artifacts.ts, admission.test.ts, artifact-store.test.ts, auth.test.ts, custody.test.ts, delivery-repository.test.ts, dispatch.test.ts, intake-http.test.ts, repository.test.ts, storage-budget.test.ts, worker-rpc.test.ts use it; custody/worker child processes do too. Synthetic pilot tests explicitly supply pilot scope and controlled clock. lifecycle.test.ts supplies actual owner-backed journalFactory and fresh facade on owner restart; historical4/5 fixtures remove only7 before downgrade. New deletion fixture uses actual synthetic admission/auth/grant lifecycle, signed facade and genuine signed MIME. Selector-only historical candidates deliberately lack deletion authority. No NODE_ENV production bypass or real account enrollment.

## Final verification

One full unit suite, after all product/test edits:

```sh
NODE_ENV=test APPLICATIONS_TEST_QPDF=/opt/homebrew/opt/qpdf/bin/qpdf APPLICATIONS_TEST_POPPLER=/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production/.superpowers/sdd/2026-10-09-application-document-reconstruction/tools/prefix/poppler-26.10.0/bin/pdftoppm npm test
```

Local output task-10-full-suite.log. Result:119/119 test files,2476/2476 tests passed,70.73s,exit0. This was the only full unit-suite execution for Task10.

Final applications:build, root tsc --noEmit, zero-warning ESLint of all changed source modules and applications tests, git diff --check: all exit0. Initial final lint found one unused type import; removed before the full suite and rerun clean. Existing installed build IMAP patch check ran; no install/dependency change.

## Self-review and later gates

Self-review tightened dense arrays, whole key map identity, post-SQL deadlines, indexed latest-fence consistency/unique result predecessor, both-cleanup settlement and persisted partial state. Actual multi-folder protocol integration preserves unrelated already-Deleted mail and issues no global EXPUNGE/CLOSE. Existing IMAP regressions cover forged identity/content, inaccessible folders, UIDPLUS/UIDVALIDITY, uncertainty and shared credit limits. Projection regressions cover orphan/cross-case/duplicate facts,1000 replay cap, cold higher head, non-genesis refusal, SQL-fault exact recovery and cross-case guard order.

No activation.11 owns expiry/minimization/old-pass pruning/erase/restore and physical completion.14 owns independent scope/key/trust/writer/provider qualification, scheduler/readiness exclusion while retained, stop-admission then real drain before close, native SQL stall/throughput qualification and no silent reactivation.15 owns explicitly authorized real operating acceptance.

R83 blocker: a signed head/non-genesis anchor is not a complete independently authenticated compacted current-case base. Backup-horizon+30-day pruning can strand six-month/held-case authority. Do not extend retention, infer missing SQLite state, prune required coverage or activate until base/classification are approved and qualified. Only complete synthetic genesis coverage is implemented.

No fetch/push/deploy/install/provider/account/real-mail/credentials/activation, no subagents, no out-of-scope product changes, no modification/staging of42 foreign audit paths. Private sources remain local. Commit only verified owned application paths and this report.
