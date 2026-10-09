# ImapFlow 2.3.0 exact-UID deletion patch

`imapflow-2.3.0-uid-expunge.json` is the single source for original/patched SHA-256 identities and exact replacements of the installed CJS and ESM `commands/expunge.js`. Upstream provenance: npm `imapflow@2.3.0`, Postal Systems OÜ, MIT, dependency version/integrity retained in `package-lock.json`.

R48: upstream checks UIDPLUS only after awaited STORE and falls back to global EXPUNGE when capability disappears. UID mode now requires an explicit UIDPLUS token before STORE and again after it; UID mode never selects bare EXPUNGE. Non-UID callers retain upstream behavior, but the applications adapter exposes no non-UID operation. Failure after STORE is uncertain, not rollback.

`npm run applications:imap-patch` prevalidates both files/version before writing, permits only known originals or patched bytes, and verifies both afterward. `postinstall`, `preapplications:build`, and the existing `prebuild` path apply it. `node scripts/applications-imap-patch.mjs --check` is read-only. Runtime verifies both identities and never repairs them. TypeScript copies the imported manifest into the compiled backend. Missing/unapplied/altered/partial installs fail closed with `IMAP_DEPENDENCY_UNAVAILABLE`.

Upgrades deliberately fail until this patch is re-reviewed against installed source and real loopback protocol regressions in both formats. Do not refresh hashes to silence a failure, run the installer in a live worker, or treat source hashes as a whole-package supply-chain guarantee. Restart workers after dependency installation. Resource containment and actual provider qualification remain separate activation gates.
