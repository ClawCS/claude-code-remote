import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import manifest from "../../../patches/imapflow-2.3.0-uid-expunge.json";
const resolvePackage = createRequire(__filename);
// No repair at runtime. Skipped install scripts, partial installs and upgrades fail closed.
export function assertImapDependency(packageJsonPath = resolvePackage.resolve("imapflow/package.json")): void {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    if (pkg.name !== manifest.package || pkg.version !== manifest.version) throw new Error();
    for (const file of manifest.files) {
      const bytes = readFileSync(join(dirname(packageJsonPath), file.path));
      if (createHash("sha256").update(bytes).digest("hex") !== file.patchedSha256) throw new Error();
    }
  } catch { throw new Error("IMAP_DEPENDENCY_UNAVAILABLE"); }
}
