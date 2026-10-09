# Task4B — bounded HTTP intake implementation report

Status: DONE_WITH_CONCERNS. Local implementation/verification is complete; the existing shared custody availability/lost-reply boundaries below need controller review and a worker-lifecycle correction before activation. This is not production readiness evidence.

Worktree `/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production`; branch `codex/cinematic-production`; BASE `b7fb73b7a31f1d3c97a79c3e5ee19bdede40d167`. Implemented the approved HTTP half only, using R18–R21/R37/R38, R44 helper ownership, the reviewed4A contracts and the reconstruction amendment. No fetch/branch movement/push, production server/account/credential/mail action, dependency installation, admin/UI/retention/configuration expansion or subagent. Initial42 foreign audit artifacts and subsequent controller-owned documentation changes were preserved and excluded from this task's staging.

## Interfaces and R45 wire decision

- `createIntakeServer(config:IntakeConfig, worker:IntakeWorkerPort):Server`: exactly POST `/api/bewerbung`, GET `/api/bewerbung/config`, POST `/api/bewerbung/session`, GET `/api/bewerbung/status`. No download/admin/file/mail endpoint.
- `createIntakeWorkerClient(config)` consumes the reviewed five-operation UnixRPC client unchanged: reserve, commitIntake, getPublicStatus, abortIntake, getIntakeReadiness. Disabled/no-secret mode supplies unavailable operations without socket/private-worker material. No production readiness adapter was added.
- `startIntakeServer(env)` is separate from the importable HTTP factory; only direct execution starts127.0.0.1:3105. Backend compiles through existing applications:build; no production tsx dependency. SIGTERM/SIGINT close the HTTP server without deleting custody data. Startup failures log one fixed code, not environment/error/request contents.
- R45 resolved the real wire ambiguity with the controller before implementation: empty POST session returns `{formToken}`; upload uses `X-Application-Form-Token`, `Idempotency-Key`, and exact pilot `X-Application-Synthetic: 1`. Text fields are exactly ApplicationInput names; repeated file parts use `files`. Pilot bootstrap and status use `Authorization: Bearer`; no secret query parameter is accepted. Public session DTO is the sole lib change.
- POST requires exact configured Origin before body admission. GET config/status require same-origin Fetch Metadata and reject a present mismatching Origin, but allow absent Origin on normal same-origin GET. Fetch mode is cors/same-origin and destination empty. Duplicate security headers and ambiguous pilot markers reject. R45 rationale: there was no live HTTP consumer; these narrow names finish the adopted contract, and a mistaken choice would require only local future UI integration changes, not production action.
- JSON responses carry private,no-store/no-referrer/nosniff and Connection:close. Errors project bounded public codes; rate Retry-After comes from worker authority, capacity/contention/unavailable use60 seconds. Node-level malformed headers and unsupported Expect also receive private JSON errors, with no request/error logging. Unknown paths/methods/query/fragment/encoded paths are rejected. Status returns only reference/state/acceptedAt, using a canonical32-byte bearer hash; reference alone cannot recover status.

## Session/pilot and admission

Fixed seven-day signed anonymous identity, purpose-separated stable keys, fresh reusable at-most15-minute form proof bounded by fixed session/pilot expiry. Refresh never rotates a valid session or extends its original expiry. Production cookie is `__Host-application-session`, Secure,HttpOnly,SameSite=Strict,Path=/,no Domain; only NODE_ENV=test plus literal HTTP localhost permits the separate non-Secure test cookie. Cookie/form/pilot authentication uses strict canonical base64url, constant-time signature comparison, exact claim shape, trusted configured server time, and no URL/browser-storage token path.

Pilot grant claims are `{v:1,runId,issuedAt,expiresAt}` signed in TJ-PILOT-1 domain with the pilot key. Expiry is at most one hour. Signed session pilot claims preserve grant issuance/expiry and bounded run ID; expired pilot claims preserve anonymous identity but cannot upload/refresh without valid new authorization. Session/form domains are separate; grants enter only session bootstrap Authorization and are never persisted raw. Ordinary enabled mode rejects pilot cookies/markers/Authorization. Immutable synthetic metadata is derived from authenticated claims outside V1 and supplied only on reservation; commit derives kind from the reviewed reservation.

Canonical `x-application-client-ip` is validated only from a loopback peer, rejects chains/duplicates/ports/zones/ambiguous forms, and is purpose-HMACed without raw-IP persistence/logging. IPv6 must be canonical compressed lower-case; mapped IPv4 aliases are rejected. Arbitrary forwarding headers are unused. Loopback is topology evidence, not process authentication: production Caddy must overwrite this one header and actual OS/socket identities remain an activation gate.

Worker owns six/session,30/IP rolling-hour counters, two producer slots, waiting/physical budgets and readiness; no ingress-local maps or client-provided clocks/rate/readiness assertions. Admission is charged by reserve before parsing authenticated bodies, including malformed/disconnected bodies and capacity denials; pre-protocol/unready failures do not reserve. Reserve rechecks readiness privately.

## Bounded multipart and encrypted handoff

Installed Busboy is used without internal mutation. Because its callbacks replace invalid UTF-8 and hide explicit field charset, the permitted intake-multipart helper adds a bounded raw framing/header/UTF-8 observer. It retains at most a16KiB header plus one<=64KiB observer chunk/delimiter suffix, not a whole multipart request. Strict raw headers, UTF-8/charset, disposition parameters, canonical safe NFC/trimmed filenames and matching `files` role prevent parser disagreement. A bare delimiter with an invalid suffix is rejected because Busboy recognizes that prefix; safe partial prefixes remain ordinary bytes. No generic parser/auth framework was added.

Inclusive limits:5 files,5MiB/file,10MiB total file bytes,8 text parts,13 total parts,16KiB cumulative submitted UTF-8 field bytes,11MiB raw multipart body including overhead. Busboy byte/part sentinel limits use +1 where it emits at equality; explicit cumulative counters enforce real maxima. Shape errors are held until bounded parsing finishes so count errors do not depend on network chunking. Unsupported charset/encoding, duplicates/unknown fields, invalid UTF-8, malformed shape/framing/params/types and unsafe names reject before sealing/commit.

Files are bounded per-file chunks and base64 strings in V1; fields and files pass existing validatePayload/encodePayload/payloadDigest. This is bounded materialization, not constant-memory streaming. Digest is canonical payloadDigest, not wireDigest. File count/order/name/type/content and canonical input determine retry identity. A real same-content retry creates different random ciphertext but returns the same durable case/reference.

Reserve grants the reviewed journal/ingress lease. The HTTP side requests2×MAX_SEALED_BYTES and seals exclusively to the granted reservation path with maxBytes=reservation.reservedBytes/2, using the worker public key only. The writer fsyncs/closes before commit. Name uses reviewed hybrid sealName, never plaintext placeholder. 202 is returned only after durable worker commit resolves. No ingress unlink after commit starts or RPC result becomes uncertain.

Overall HTTP deadline60s and absolute RPC wait5s are independent of injected wall-clock time. Deadline response is emitted even while a filesystem await is blocked, but the real writer must settle before worker-authoritative terminal abort. Body/disconnect aborts stop bounded parsing and seal source. Known/late reserve IDs release only through session-bound abortIntake. Commit timeout/disconnect/failure may be uncertain: no abort/forced deletion is attempted; same session/key/content retry recovers. Expected cleanup errors are caught quietly and custody journals/real lifetime authority remain responsible.

## TDD evidence

Commands ran locally with invented data only. Setup transform/path/ESM-spy failures were repaired and are not counted as behavioral RED. Tests added after their related family was green are covering regressions, not separately claimed initial RED.

1. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts` against the minimal404 factory scaffold:2 behavioral failures, expected200/403 but got404. Minimal disabled config/header/origin implementation made these GREEN2/2.
2. `NODE_ENV=test npx vitest run services/applications/tests/intake-session.test.ts` against null session reader: valid independently HMAC-signed fixed session returned null rather than the literal expected claims (1 failed/1 passed). Implemented strict reader; HTTP+session GREEN4/4.
3. Expanded real HTTP/SQLite/custody/UnixRPC tests before HTTP session/admission wiring:3 failures, bootstrap503vs200 and pilot503vs403. After wiring, acceptance still correctly RED400vs202 against rejecting multipart scaffold. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts -t 'inclusive boundary'`:6 failures, exact boundaries400vs202 and over-boundaries400vs413. After bounded Busboy/observer: HTTP+session GREEN18/18.
4. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts -t 'malformed pilot'`: signed extra-field grant produced503 rather than403. Normalized untrusted claim/JSON errors to FORBIDDEN; HTTP+session GREEN27/27.
5. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts -t 'unbounded empty-session'`: actual timeout5000ms because a request iterator ignored controller cancellation. Replaced only empty-body wait with cancellable event listeners; HTTP+session GREEN30/30.
6. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts services/applications/tests/intake-multipart.test.ts -t 'malformed unquoted|submitted field count'`:2 actual failures: malformed boundary503vs400; byte-split ninth field400vs413. Guarded Busboy construction and deferred bounded shape error. Build exited0; three focused files GREEN54/54.
7. `NODE_ENV=test npx vitest run services/applications/tests/intake-session.test.ts`: pilot issuance-bound claim reader REDnullvs literal valid claims (1 failed/4 passed). Added signed pilot issuance and independent<=3600s validation, preserving expired-claim identity. Three focused files GREEN60/60.
8. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts -t 'Node-rejected'`: malformed Content-Length produced400 with null body rather than private JSON error. Added fixed Node clientError projection; covering2/2 GREEN after correcting the absent-header test fixture.
9. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts -t 'real handoff writer'`: after correcting the ESM instrumentation fixture, a real producer fd.write was held at a deterministic promise gate; at60s actual response.writableEnded was false, expected true. Deadline callback now responds immediately but retains the writer/lease. `NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts -t 'real handoff writer|unbounded empty-session|absolute commit|late reserve'`:4 passed,32 filtered,633ms. Test resumes the real write, awaits real custody abort, verifies no accepted case and final empty incoming root. No arbitrary sleep or fake-success storage response.

Coverage includes actual HTTP multipart byte streams, one-byte/seven-byte splits, inclusive exact5/10MiB and file counts, field/part counts and16KiB cumulative bytes, raw charset/UTF-8/extended params/false delimiter, strict proof/cookie/mode/IP/duplicate header checks, fresh proof/fixed identity, cross-session idempotency isolation, same-content/changed-content retry, expired/wrong status bearer, URL-token rejection, two simultaneous unbounded uploads, charged capacity/rate outcomes, disconnect, known late-reserve result, unknown commit outcome, absolute commit timeout, blocked producer write and disabled compiled runtime imports.

Count8/parts13/exact16KiB cases intentionally reach shape400 because ApplicationInput only has five unique fields and its approved string bounds fit below16KiB; +1 returns413. The11MiB exact/over declared Content-Length tests use controlled invalid framing to distinguish400/413; no claim that an11MiB body violating other stricter guards is a valid accepted V1 payload. Exact max file/aggregate acceptance is exercised through the real durable pipeline.

## Final verification

Final `npm run applications:build`: exit0, no diagnostics. Rebuilt current sources before compiled-import test. Final `npx tsc --noEmit`: exit0, no diagnostics.

Final focused command:

```sh
NODE_ENV=test npx vitest run services/applications/tests/intake-http.test.ts services/applications/tests/intake-session.test.ts services/applications/tests/intake-multipart.test.ts
```

Output:3 files/63 tests passed,2.86s, exit0; no warnings/errors. Includes concrete post-conflict availability assertions below.

Final lint:

```sh
npx eslint services/applications/src/intake-http.ts services/applications/src/intake-session.ts services/applications/src/intake-multipart.ts services/applications/src/intake-client.ts services/applications/src/intake-main.ts services/applications/tests/intake-http.test.ts services/applications/tests/intake-session.test.ts services/applications/tests/intake-multipart.test.ts lib/applications-contract.ts --max-warnings 0
```

Exit0, no warnings/errors. `git diff --check`: exit0. Full suite ran ONCE after final code/test changes, with both mandatory tool paths:

```sh
NODE_ENV=test APPLICATIONS_TEST_QPDF=/opt/homebrew/opt/qpdf/bin/qpdf APPLICATIONS_TEST_POPPLER=/Users/niko/Desktop/Homepage/trinkgut-jammers-v2/.worktrees/cinematic-production/.superpowers/sdd/2026-10-09-application-document-reconstruction/tools/prefix/poppler-26.10.0/bin/pdftoppm npm test
```

Output: `Test Files 103 passed (103)`; `Tests 1881 passed (1881)`;26.22s; exit0. No errors/warnings/skips in the full result. Tools were not installed or substituted.

Read the installed Next16 server/client-components guide completely for the sole type-only lib change. Existing localhost dev server was reachable; none was started/reconfigured. `curl -sf -o /dev/null -m 3 http://localhost:3000/` exited0; `/bewerbung` HTML still contains Bewerbung and `info@trinkgut-jammers.de`, the contact fallback. No UI behavior/string/activation change. If viewing the page, Cmd+Shift+R (Windows Strg+Shift+R) bypasses cached rendering; local refresh is not live evidence.

## Lifecycle handoff and concrete concerns

1. **Existing global availability latch:** reviewed custody.commitIntake catches all commit exceptions and sets ready=false, including an ordinary changed-content IDEMPOTENCY_CONFLICT. Fresh HTTP test observes changed retry409, config enabled:false and a different subsequent upload503 while the two original cases remain intact. This is a concrete ordinary-client-triggered availability concern, not just benign readiness gating. Controller confirmed source322–344 and reserved shared-file ownership; no HTTP readiness bypass or live reconciliation probe was added. Independent review/controller must assign the minimal shared correction/authority-backed lifecycle obligation before activation.
2. **Lost actual UnixRPC reserve reply:** an ID known to an in-process late-resolving port is safely terminal-aborted (covered). An actual UnixRPC timeout destroys its socket; if worker reserve durably created/granted a lease but its reply was lost, this five-method port cannot identify it for session-bound abort. The reviewed owner guard retains the journal/lease and fail-closed capacity/readiness consequences rather than guessing/deleting it. Task7/14 must supply safe authority-backed lost-owner/lifetime reconciliation and maintenance. No guessed reservation ID, extra RPC, force release or local unlink was added. Root explicitly accepted this handoff boundary for independent review.
3. Commit may be accepted even when RPC response is lost. Existing durable accepted-copy guard remains worker authority; HTTP does not undo it. Retry recovers original identity/reference/time and mints only a new worker status bearer bounded by original acceptedAt+7d.
4. Bootstrap must still provide fresh worker processing/scanner/deployment gates, real ingress authority and periodic at-most5-minute abuse expiry maintenance. Default production authority/readiness remain unavailable. No synthetic fixture is a generic bypass or proof of production readiness.

## OS and memory qualification bounds

Observed environment: Node v25.8.0, Darwin arm64. Same-UID controlled synthetic filesystem holders/UnixRPC are not Linux user/group isolation, descendant/FD-transfer containment, physical quota, qualified parser/scanner/AV or resource-limit proof. R4/R5/F2 and activation barriers remain open.

The observer has bounded header/chunk/tail storage and file chunks are bounded, but peak process memory was NOT measured/qualified. V1 holds up to10MiB original binary chunks; per-file concatenation can add5MiB, base64 about13.34MiB, JS JSON strings may use one/two bytes per character, encodePayload adds a roughly14MiB Buffer, and payloadDigest separately materializes canonical encoding/parse/base64 and decoded file buffers. GC can retain older copies; crypto and worker custody read/copy the encrypted object too. Two active maximum uploads can overlap these copies. The tests cover maximum individual/aggregate payload and two concurrent partial streams, not a measured two-max-upload Linux RSS bound. Later Linux qualification must include those peaks, Node/native libraries, worker buffers, descendants, processing and scratch under approved OS limits; no constant-memory or512MiB compliance claim is made here.

## Owned files and self-review

Nine product/test files: `lib/applications-contract.ts`; `services/applications/src/{intake-http.ts,intake-main.ts,intake-client.ts,intake-session.ts,intake-multipart.ts}`; `services/applications/tests/{intake-http.test.ts,intake-session.test.ts,intake-multipart.test.ts}`. Report is this ledger file. No reviewed types/config/crypto/custody/repository/RPC/fixtures were edited.

Self-review checked owned source/test diffs, public-secret boundary, strict signed claims, inclusive Busboy behavior, observer/header agreement, canonical digest/retry behavior, response projection, no logging/raw IP, disabled startup/imports, timeout/fd close ordering and scoped ownership. Found/fixed multipart error normalization/chunk-order and deadline-response issues with behavioral RED/GREEN evidence. The two existing shared availability/lost-reply boundaries were escalated, retained fail-closed, and explicitly documented rather than silently expanding4B. All tests are invented local fixtures and no real documents/mail are used.

Scoped commit subject: `feat: add bounded application upload and private status endpoint`. No push. Final SHA is returned to the controller with this report path.
