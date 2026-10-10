import { execFileSync } from "node:child_process";
import path from "node:path";
import { loadFlyerPackages } from "../lib/flyer-packages";
import { validateOfficialCatalogPackages } from "../lib/official-catalog-packages";
import { loadWeeklyPublications } from "../lib/weekly-publication";
import { buildWeeklyOffers } from "./build-weekly-offers";

export async function validateWeeklyPublicationBuild(root=process.cwd()):Promise<number> {
  const loaded=await loadWeeklyPublications(root);
  if (loaded.issues.length) throw new Error(`Ungültige Wochenbindung: ${loaded.issues.map(issue=>`${issue.week??"unknown"}:${issue.language??"all"}:${issue.code}`).join(", ")}`);
  await buildWeeklyOffers(root,["--check"]);
  return loaded.editions.length;
}

async function main() {
  // Validate immutable public derivatives before any content/build output.
  // These validators need no private account metadata on a clean checkout.
  for (const script of ["build-cinematic-assets.mjs", "build-market-assets.mjs", "build-google-market-assets.mjs", "build-user-market-assets.mjs"]) {
    execFileSync(process.execPath, [`scripts/${script}`, "--check"], { stdio: "inherit" });
  }
  const packages = await loadFlyerPackages();
  const official = await validateOfficialCatalogPackages();
  const weekly = await validateWeeklyPublicationBuild();
  process.stdout.write(`Inhaltspakete vor Build geprüft: ${packages.length} Canva, ${official} offiziell, ${weekly} gebundene Wochenausgaben\n`);
  execFileSync(process.execPath, ["scripts/generate-handzettel-manifest.mjs"], {stdio:"inherit"});
}
if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(import.meta.filename)) main().catch(error => {process.stderr.write(`Inhaltspaket ungültig: ${error instanceof Error ? error.message : "Dateifehler"}\n`);process.exitCode=1;});
