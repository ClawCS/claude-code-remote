import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentWeekRange } from "@/lib/editorial-schedule";
import { validateCatalog } from "@/lib/handzettel-catalog";

/** Validate every immutable official package, including future weeks, before build. */
export async function validateOfficialCatalogPackages(root=process.cwd()):Promise<number>{
  const directory=path.join(root,"data/editorial/official-catalogs");
  const files=(await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
  for(const file of files){
    const match=/^(\d{4}-\d{2}-\d{2})\.json$/.exec(file.name);
    if(!file.isFile() || !match) throw new TypeError(`Ungültiger offizieller Paketname: ${file.name}`);
    const now=new Date(`${match[1]}T12:00:00Z`);
    if(!Number.isFinite(now.valueOf()) || now.toISOString().slice(0,10)!==match[1]) throw new TypeError(`Ungültiges Paketdatum: ${file.name}`);
    const range=getCurrentWeekRange(now);
    if(range.validFrom!==match[1]) throw new TypeError(`Paketdatei muss nach dem Montag benannt sein: ${file.name}`);
    const data:unknown=JSON.parse(await readFile(path.join(directory,file.name),"utf8"));
    validateCatalog(data,range);
  }
  return files.length;
}
