import { rm } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { buildWeeklyOffers } from "../../scripts/build-weekly-offers";
import { validateWeeklyPublicationBuild } from "../../scripts/validate-content-build";
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";

const roots:string[]=[];
async function fixture() {
  const f=await weeklyPublicationFixture();roots.push(f.root);
  for (const source of f.sources) { source.privatePdf=`assets/private-originals/${source.language}.pdf`; }
  await f.save();
  return f;
}
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
describe("release-like weekly build gate",()=>{
  it("checks bound public originals without private input folders",async()=>{
    const f=await fixture();expect(await buildWeeklyOffers(f.root,["--check"])).toEqual({count:3,check:true});
    expect(await validateWeeklyPublicationBuild(f.root)).toBe(2);
  });
  it("still requires private originals when actually generating",async()=>{
    const f=await fixture();await expect(buildWeeklyOffers(f.root,[])).rejects.toThrow();
  });
  it("rejects a declared source removed from the binding even without an ignored lock",async()=>{
    const f=await fixture();f.publication.editions.splice(1);await f.save();
    await expect(validateWeeklyPublicationBuild(f.root)).rejects.toThrow();
  });
  it("rejects an inconsistent bound offer census without a transaction marker",async()=>{
    const f=await fixture();f.offers.pop();await f.save();
    await expect(validateWeeklyPublicationBuild(f.root)).rejects.toThrow();
  });
  it("rejects an interrupted transaction before build",async()=>{
    const f=await fixture();await f.write("data/editorial/.weekly-offers.lock","binding");
    await expect(validateWeeklyPublicationBuild(f.root)).rejects.toThrow();
  });
});
