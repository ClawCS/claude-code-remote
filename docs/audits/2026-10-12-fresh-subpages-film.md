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

Publication is pending at this report checkpoint. The current public release is `00302feabe2698929c05d46723e6c9d8b85a7d57`. Pre-release read-only server check found 3,430,887,424 free bytes and an active existing Next service. Nine existing security configuration hashes match the initial check. No cleanup or configuration change is authorized by this task.

## Boundaries

No upload, application administration, SMTP, newsletter, rental-order, payment or erasure operation is activated. No real customer data, emails or payments are created. The native application service remains separately unqualified; existing business/security restrictions are preserved. Canva/Instagram accounts are unchanged. Foreign screenshots and the private application audit are not staged or reverted.
