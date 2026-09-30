import { execFileSync } from "node:child_process";
import { loadFlyerPackages } from "../lib/flyer-packages";
import { validateOfficialCatalogPackages } from "../lib/official-catalog-packages";

async function main() {
  // Validate immutable public derivatives before any content/build output.
  // Neither validator needs private account metadata on a clean checkout.
  for (const script of ["build-cinematic-assets.mjs", "build-market-assets.mjs"]) {
    execFileSync(process.execPath, [`scripts/${script}`, "--check"], { stdio: "inherit" });
  }
  const packages = await loadFlyerPackages();
  const official = await validateOfficialCatalogPackages();
  process.stdout.write(`Inhaltspakete vor Build geprüft: ${packages.length} Canva, ${official} offiziell\n`);
  execFileSync(process.execPath, ["scripts/generate-handzettel-manifest.mjs"], {stdio:"inherit"});
}
main().catch(error => {process.stderr.write(`Inhaltspaket ungültig: ${error instanceof Error ? error.message : "Dateifehler"}\n`);process.exitCode=1;});
