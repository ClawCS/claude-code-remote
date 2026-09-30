import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

it("does not publish freshly dated KW-only archive entries",()=>{
  const root=mkdtempSync(join(tmpdir(),"jammers-legacy-"));
  try{
    mkdirSync(join(root,"public/handzettel"),{recursive:true});
    execFileSync(process.execPath,[resolve("scripts/generate-handzettel-manifest.mjs")],{cwd:root,stdio:"pipe"});
    const data=JSON.parse(readFileSync(join(root,"public/handzettel/manifest.json"),"utf8"));
    expect(data.deprecated).toBe(true);expect(data.de).toEqual([]);expect(data.nl).toEqual([]);
    expect(data.currentIndex).toBe("/api/content/flyers");expect(data.generated).toBeUndefined();
  }finally{rmSync(root,{recursive:true,force:true});}
});
