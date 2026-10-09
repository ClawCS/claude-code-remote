import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("../patches/imapflow-2.3.0-uid-expunge.json", import.meta.url), "utf8"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
// Explicit package path is for isolated installer tests; CLI always resolves the public export.
export function installImapPatch(packageJsonPath = require.resolve("imapflow/package.json"), checkOnly = false) {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    if (pkg.name !== manifest.package || pkg.version !== manifest.version) throw new Error();
    const writes = manifest.files.map(file => {
      const path = join(dirname(packageJsonPath), file.path), original = readFileSync(path), identity = hash(original);
      if (identity === file.patchedSha256) return { path, bytes: original, changed: false };
      if (checkOnly || identity !== file.originalSha256) throw new Error();
      let patched = original.toString("utf8");
      for (const { from, to } of file.replacements) { if (patched.split(from).length !== 2) throw new Error(); patched = patched.replace(from, to); }
      if (hash(patched) !== file.patchedSha256) throw new Error();
      return { path, bytes: Buffer.from(patched), changed: true };
    });
    // Prevalidate BOTH versions before the first write. Any partial I/O failure remains unavailable.
    for (const file of writes) if (file.changed) writeFileSync(file.path, file.bytes);
    for (const file of manifest.files) if (hash(readFileSync(join(dirname(packageJsonPath), file.path))) !== file.patchedSha256) throw new Error();
  } catch { throw new Error("IMAP_DEPENDENCY_UNAVAILABLE"); }
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try { if (process.argv.slice(2).some(arg => arg !== "--check")) throw new Error(); installImapPatch(undefined, process.argv.includes("--check")); }
  catch { process.stderr.write("IMAP_DEPENDENCY_UNAVAILABLE\n"); process.exitCode = 1; }
}
