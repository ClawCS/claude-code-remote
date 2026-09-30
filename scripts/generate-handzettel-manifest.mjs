#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Compatibility tombstone: KW-only archives are never current advertising.
const base=join(process.cwd(),"public/handzettel");
mkdirSync(base,{recursive:true});
writeFileSync(join(base,"manifest.json"),JSON.stringify({
  deprecated:true,
  notice:"Dieses historische Format wird nicht mehr aktualisiert. Aktuelle, datierte Handzettel stehen im Inhaltsindex.",
  currentIndex:"/api/content/flyers",
  de:[],
  nl:[],
},null,2)+"\n","utf8");
process.stdout.write("Historisches Handzettel-Manifest stillgelegt; aktuelle Quelle: /api/content/flyers\n");
