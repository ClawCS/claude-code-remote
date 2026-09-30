import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateOfficialCatalogPackages } from "@/lib/official-catalog-packages";

const roots:string[]=[];
async function fixture(name="2026-09-28.json", corrupt=false){
  const root=await mkdtemp(path.join(tmpdir(),"jammers-official-"));roots.push(root);
  const directory=path.join(root,"data/editorial/official-catalogs");await mkdir(directory,{recursive:true});
  const original=await readFile(path.join(process.cwd(),"data/editorial/official-catalogs/2026-09-28.json"),"utf8");
  await writeFile(path.join(directory,name),corrupt ? original.slice(0,80) : original);
  return root;
}
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
describe("official build package gate",()=>{
  it("accepts validated catalog data for its exact Monday filename",async()=>expect(await validateOfficialCatalogPackages(await fixture())).toBe(1));
  it("rejects a corrupted versioned JSON file",async()=>expect(validateOfficialCatalogPackages(await fixture("2026-09-28.json",true))).rejects.toThrow());
  it.each(["2026-09-29.json","2026-10-05.json","arbitrary.json"])("rejects filename/range mismatch %s",async name=>expect(validateOfficialCatalogPackages(await fixture(name))).rejects.toThrow());
});
