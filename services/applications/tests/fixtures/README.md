# Synthetic application-document fixtures

No applicant files, production messages, malware, or private keys are stored here. `synthetic.ts` generates tiny PDFs in test-private temporary directories; Sharp generates solid-color PNG/JPEG files. Tests remove their temporary files. No EICAR test is claimed: ClamAV is not installed or qualified.

## Evidence classes

- `file-validation.test.ts`: real local QPDF **12.4.2** and Sharp **0.35.5**, plus explicitly identified identity/digest port doubles. Set **`APPLICATIONS_TEST_QPDF` to an absolute executable path** before running local fixtures. The shared `requireQpdfTestExecutable()` setup supplies both parser construction and fixture-generation commands; there is no platform-specific path default. Missing/relative/non-executable paths fail with `QPDF_TEST_PREREQUISITE`, never skip. This Mac's recorded installation is `/opt/homebrew/opt/qpdf/bin/qpdf`, Homebrew `qpdf 12.4.2_1` arm64_tahoe bottle. The parser checks the executable version on every PDF. Wrong versions fail closed; there is no pdf-lib fallback.
- `pdf-policy.test.ts`: manually constructed QPDF JSON-v2 DTOs exercise graph schema, selected-object policy, names, references, page trees and stream profile. These are policy tests, not parser or renderer evidence.
- `parser-process.test.ts`: real disposable local processes exercise deadline, stdout/stderr bounds, group/ordinary-descendant killing, crash/missing executable, non-secret environment and stdin metadata transport. One test uses an explicitly synthetic QPDF protocol stub to demonstrate the **total**, not per-command, deadline. These are **not** Linux sandbox, cgroup, native-memory, disabled-core-dump, read-only filesystem or network-denial proofs. Escaped process groups are not qualified by these tests.
- `scanner.test.ts`: orchestration doubles plus real Unixsocket framing against a synthetic protocol peer. No real ClamAV engine or completeness evidence. The diagnostic port always returns `complete:false`; `scanSnapshot` refuses it with `NOT_READY`. An exact INSTREAM `OK` is insufficient for production readiness.

## PDF profile and limitations

The authoritative interpretation is QPDF's warning-free selected view of the original bytes. Separate commands check encryption, structure, unmodified graph export and each selected stream. No normalization, replacement, repair or decryption is used for submitted bytes. QPDF conversion is used only to generate synthetic modern/encrypted fixtures before validation.

Positive fixtures cover classic/modern xrefs, object streams, empty static pages, harmless unreferenced objects, syntax-looking strings, safe URI/GoTo contexts, valid incremental saves, and full standalone raster decoding. Selected-stream families exercised against QPDF are unfiltered, Flate, ASCIIHex, ASCII85, RunLength, LZW and DCT. The initial parameter profile is deliberately narrow: absent/null parameters, empty parameter dictionaries, Flate Predictor=1, and QPDF XRef Flate Predictor=12 with bounded Columns. Other predictors/parameters, JPX/JBIG2/CCITT/Crypt, external streams, non-Link annotations, interactive forms and multimedia are unsupported. This can reject legitimate documents; ask the applicant to export an ordinary static PDF, never silently convert it. A representative exporter/embedded-font/image-CV corpus remains an activation requirement; these small fixtures do not establish broad rendering compatibility.

Bounds: 5 MiB/file, 20 PDF pages, 25,000,000 image pixels and 8192 pixels/edge, one 30-second supervisor deadline, 20,000 indirect objects, 200,000 graph values, 64 nested levels, 16 MiB JSON, 64 KiB **diagnostic acceptance**, 64 MiB decoded bytes/stream, 128 MiB decoded bytes/document, four filters/pipeline. The outer Node supervisor bounds stdout/stderr while receiving them. Inside that child, synchronous QPDF invocations use their per-command `maxBuffer` (up to 16 MiB for JSON or 64 MiB for decoding); stderr can therefore be buffered up to that larger cap **before** the 64-KiB diagnostic check rejects it. There is no separate early 64-KiB stderr-buffer enforcement in that inner adapter. These are buffering-versus-acceptance limits, not equal memory claims. A 512-MiB hard whole-tree memory budget is a future Linux adapter requirement, **not enforced by this diagnostic runner or by a V8 heap setting**.

### R16 limitation fixtures — actual QPDF 12.4.2 outcomes

| Fixture | Actual local outcome | Meaning |
| --- | --- | --- |
| `duplicateDefinitionPdf(false)` | Diagnostic accepted | Harmless selected catalog; dangerous duplicate raw definition discarded silently |
| `duplicateDefinitionPdf(true)` | Diagnostic accepted | Same, plus duplicated same-revision xref entry pointing at the dangerous definition; QPDF keeps selected entry |
| `incrementalPdf(true)` | Diagnostic accepted | Valid revision replaces earlier active-looking catalog; historical definition is not current view |
| Duplicate `/OpenAction` dictionary keys | Blocked `INVALID_FILE` | QPDF warning exit 3 is rejected, even if dangerous value was overwritten |

The first two outcomes are a **remaining malformed-input policy-bypass risk for another viewer**, not successful rejection coverage. JSON cannot reconstruct discarded definitions. Neither QPDF nor ClamAV guarantees universal viewer agreement, complete font/image/content rendering validation, or malware freedom. Independent security review can require a different validator and block activation.

**Review F2 overrides any implied future promotion under R16:** a PDF now returns `PDF_AMBIGUITY_UNRESOLVED` even when an injected future port claims `linux-sandbox` and returns an exact parsed result. This is a temporary activation barrier while the controller resolves the maintained-validator architecture. It is not a fix for PDF ambiguity or compatibility. Diagnostic-only limitation fixtures remain accepted to preserve the observed evidence; they must not qualify dispatch. OS sandboxing and antivirus alone do not close the recipient-viewer ambiguity finding.

## Bootstrap and qualification contract

Task 7 may use `createFileValidator(parserPort)` and `scanSnapshot(processingSnapshot, scannerPort)` only inside Task 2's `withPrivateFiles` callback. No keys or intake paths cross these ports. Default `validateFile` is blocked `SANDBOX_UNAVAILABLE`; `unavailableScanner` is blocked `NOT_READY`. Local factories require `NODE_ENV=test` at construction/use and yield diagnostic-only results. Neither `kind:'diagnostic'`, the legacy original-file `kind:'valid'`, nor the new `SourceInspection` qualifies direct dispatch under the reconstruction amendment: PDF/JPEG/PNG all require newly encoded, bound and validated outputs plus the complete output scan/package gates. `inspectReconstructionSource` checks source identity/digest/profile only. Failure reasons are internal codes, not upload/document diagnostics. HTTP translation remains Task 4/7.

Runtime parser assurance is an exact allowlist, and result DTOs require exact own data fields, supported `kind`/format/reason values, and no extra fields/arrays/accessors/inherited shapes. A malformed injected port result cannot become valid. The production-PDF barrier above applies in addition to these checks and remains independent of Linux readiness.

Before supplying a `linux-sandbox` port, Task 14/15 must prove distinct-UID, read-only private input, no network or secrets, minimal environment, bounded private temporary storage, disabled core dumps, OS-enforced memory/CPU/process limits for the complete tree, kill/reap behavior including escaped descendants, shared 30-second deadline, pinned QPDF/Sharp and unchanged digest binding. A fake success/assurance string in a unit test is not that proof. The production readiness exports remain false; no Linux adapter or configuration activation is implemented here.

Before supplying `qualified-local-engine`, prove a local Unixsocket-only real ClamAV engine with UTC/fresh database timestamps, reload/scan binding, full enabled-format coverage, all skip/limit outcomes fail closed, transport/file/scan/recursion/file-count/format limits, temporary-file ownership/crash cleanup, disabled payload diagnostics, engine deadlines/cancellation, and one scan across all worker processes. VERSION-before/after is non-atomic; protocol tests never set `complete:true`. Real engine synthetic/EICAR integration and combined host pressure tests remain outstanding.

## Updating the pin

Obtain a maintained binary from a trusted primary distribution without production changes, record package/build/dependency versions, update the explicit pin, then rerun real acceptance/rejection/limitation/resource fixtures and independent review. Do not relax warnings or add filter/parameter variants just to make a fixture pass. No unrelated package upgrades are part of this task.
