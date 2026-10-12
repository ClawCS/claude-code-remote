# Fresh subpages and corrected film — 12 October 2026

## Approved scope

The operator approved the neutral academy/catalogue preview, requested the same accents across every customer subpage, and authorized live publication together with the approved V6 film. Homepage composition, header/footer root tokens, orange NL identity, original photos, weekly offers and operating permissions remain unchanged. The existing original Jammers-hilft heart/handshake symbol is included at its three approved website-only placements, not in the film.

## Implementation

- Neutral white/cool-gray surfaces and graphite intros with readable white headings and restrained red rules are native CSS, not a proxy or injected preview.
- Eight academy cards use the approved thematic accent colors. Catalogue cards preserve full offer images and unclipped keyboard outlines.
- Neutral variables apply to customer mains and their root-mounted shopping drawers. The flyer component no longer resets the entire root palette. NL main aliases are rebound while orange identity and original logos remain intact.
- V6 desktop is the exact approved preview, 3,719,740 bytes, SHA-256 `06fd3bdde1a2d6045b056a73fcf0350c4a443a756ee121988e07967d15bd363f`.
- V6 mobile is a full-frame 640×360 derivative of the approved 1920×1080 master, 628,843 bytes, SHA-256 `e2f94ee62e776519a7b4788a0f156123d056433ebd438f43a39f6d979dfecba3`. Exact encoder settings and source hash are in the sanitized provenance manifest.
- Both films decode all 360 frames: 24 fps, 15 seconds, progressive H.264 High, no audio, fast-start. The accepted compact single tap points forward and stays on the table. The accepted animated devil/angel finale is retained.
- New media paths are hash-bound. Poster SHA-256 `62abe3860959351d0d6c4bb03d075e10d4a82549fdfb56ac643ae37b872aa638`, prior V4 files and full V4/V2 provenance are unchanged.

## Regression and review evidence

Before implementation, the focused native-palette test failed against the old rental main. Updated V6 tests failed against V4: 17 expected failures and 27 passes. After integration the focused media tests passed 44/44.

The first full palette matrix passed 80 browser cases at 390/1440 pixels. Independent review then found nested giveaway intro links still burgundy on graphite. A targeted test reproduced the contrast failure; native light action text fixed it and the targeted test passed. Original filled primary actions, logos and link targets were preserved.

Initial continuity expectations contained stale assumptions: valid neutral gradients have a transparent background-color; NL own-brand imagery now also includes the already-approved symbol; current market chapters have seven rather than five text links. The checks now exercise those actual surfaces/images/links without reducing functional or contrast coverage. A development-only run also encountered hot-reload/aborted-fetch navigation states while the imported film constants triggered a recompilation; final qualification uses an isolated production server without hot reload. Gated synthetic fixtures are not asserted on an unmarked production server.

Full final local web suite: **2,364 tests / 129 files passed**, excluding native `services/applications/**` and private scratch `.superpowers/**` only. Lint: zero errors, 20 pre-existing warnings. Route type generation, TypeScript, all 210 original stored offers and production build passed. Final isolated production browser gate: **190/190 passed** in 1.6 minutes, covering all 39 subpage templates, 360/390/768/1440-pixel continuity, navigation with/without JavaScript, seven axe contrast routes, 200% reflow, complete DE/NL covers and viewer keyboard operation, 82/12/70 catalogue filters, and responsive V6 playback/pause/reduced-motion. Linux/public results are recorded below when completed.

## Publication status

Independent final review: no remaining Critical or Important findings. The initial P2 contrast regression was independently verified fixed at 390/1440 with JavaScript on/off, including correct secondary hover and unchanged primary backgrounds/targets. A minor review point was addressed: the routine catalogue test now compares current typed API counts rather than hardcoding KW42; this release's exact 82/70/12 census remains in the acceptance evidence.

App release **`059def3a247c19e422abb04da152b452a48c57bf`** became ready on **12 October 2026, 15:26:32 UTC / 17:26:32 Europe/Berlin**. Rollback remains `00302feabe2698929c05d46723e6c9d8b85a7d57`. The exact committed source archive had 1,688 allowed entries, no private environment/build/raw-source entries, and SHA-256 `8f97db9c355b14e7abc1fd0cba1d58093fe661cb5d32e12d6261b47959067c25`. Source install/build/test happened in a new Linux release as the existing service user, not in current.

Linux qualification: Node 22.23.3; **2,307 web tests / 125 files passed**. Exactly four Chromium-dependent files were excluded on Linux and fully passed locally, as required by the runbook. Lint, route type generation, TypeScript, 210 original offers and production build passed. Nine security configuration hashes were identical before build, immediately before switch and after readiness. Only the existing Next service was restarted; no old release was removed. Pre-release free space was 3,430,887,424 bytes; the temporary upload archive was removed only after successful public integrity checks.

Actual HTTPS evidence on `https://trinkgut-jammers.de`:

- Normal content check with the real production date: `ok`, no errors/warnings, `websiteVerified:true`, `deploymentVerified:true`. Current KW42 (12–17 October) remains 70 DE + 12 NL offers, and originals/covers/tiles were compared by actual GET type, size and SHA-256. DE original `a8dfe6b0a728982667ce83ac8eed0e527c6cf2b6d03dd7b10fcd857112f4f37e`; agency NL original `b669c22d2e7bcb6466af9771cf68573f935312556db0d58e24db9a6e5bfe448d`.
- Public HTTP audit: **293 pages, 2,581 local resources, five unknown-page probes and 31 API contracts**, zero errors or warnings. No external contact action was triggered.
- Giveaway delivery: **18 actual image GETs**, zero findings.
- Actual public GETs for both V6 MP4s, retained poster and original Jammers-hilft symbol matched all expected bytes, types and SHA-256. The three hash-versioned assets have their exact immutable cache rules.
- Public browser palette/media gate: **85/85 passed**. Six additional public navigation/playback cases passed, including header destinations and Back with JavaScript enabled/disabled at 390/1440, and real play/pause/six-bottle finale controls. Twelve actual rendered mobile/desktop captures showed no overflow or runtime errors, and `currentSrc` was V6 mobile 640×360 or V6 desktop 1280×720, each 15 seconds. Forward-tap scene and academy/card surfaces were visually inspected from the public screenshots.
- Main HTTPS route returned 200 with the expected security headers; www preserves the path and redirects to the canonical domain.
- After removing only the exact own temporary upload archive, free server space was 1,790,525,440 bytes. Keep current/rollback releases; check space and obtain specific cleanup approval before a later release if necessary.

Public screenshot and machine-readable evidence are saved under `audit/screenshots/fresh-subpages-film-2026-10-12/` and `audit/evidence/2026-10-12-fresh-subpages-film-*`. The current content run is `audit/content-runs/2026-10-12T15-27-27-657Z-check-9477904c.json`.

Separate dependency note: full `npm audit` reported five high labels in the existing ESLint/fast-glob/micromatch/braces development-tool chain, based on one braces stack-exhaustion advisory. `npm audit --omit=dev` reported zero known vulnerabilities in the resolved production dependency set; this is not a guarantee against unknown issues. Package/lock versions are unchanged by this task. No forced dependency downgrade or automatic security rewrite was attempted.

## Boundaries

No upload, application administration, SMTP, newsletter, rental-order, payment or erasure operation is activated. No real customer data, emails or payments are created. The native application service remains separately unqualified; existing business/security restrictions are preserved. Canva/Instagram accounts are unchanged. Foreign screenshots and the private application audit are not staged or reverted.
