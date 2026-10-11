import { readFile, rm, unlink } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildWeeklyOffers, parseOfferArguments } from "../../scripts/build-weekly-offers";
import { validateWeeklyPublicationBuild } from "../../scripts/validate-content-build";
import { weeklyPublicationFixture } from "./fixtures/weekly-publication";
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";
import { verifyWeeklyEdition } from "../weekly-publication";

const roots:string[]=[];
async function fixture() {
  const f=await weeklyPublicationFixture();roots.push(f.root);
  for (const source of f.sources) { source.privatePdf=`assets/private-originals/${source.language}.pdf`; }
  await f.save();
  return f;
}
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
describe("release-like weekly build gate",()=>{
  it("targets a supplement without consuming or deleting same-date main rows",async()=>{
    const f=await supplementalPublicationFixture("2026-10-05","2026-10-10");roots.push(f.root);
    expect(await buildWeeklyOffers(f.root,["--week","2026-10-05"])).toEqual({count:3,check:false});
    expect(await buildWeeklyOffers(f.root,["--edition",f.supplemental.edition.id])).toEqual({count:1,check:false});
    expect(JSON.parse(await readFile(path.join(f.root,"data/weekly-offers.json"),"utf8"))).toEqual(f.offers);
    expect(await buildWeeklyOffers(f.root,["--check"])).toEqual({count:4,check:true});
  });
  it.each([{args:["--week","2026-10-05","--edition","maasduinen"]},{args:["--edition"]},{args:["--edition","../unsafe"]},{args:["--edition","a","--edition","b"]}])("rejects invalid edition targeting %j",({args})=>{
    expect(()=>parseOfferArguments(args)).toThrow();
  });
  it("validates the exact edition target",()=>{
    expect(parseOfferArguments(["--edition","maasduinen-synthetic","--check"])).toEqual({check:true,week:undefined,edition:"maasduinen-synthetic"});
  });
  it("rejects future NL generation lacking typed agency provenance",async()=>{
    const f=await weeklyPublicationFixture("2026-10-12","2026-10-17","1399999");roots.push(f.root);
    delete f.sources[1].identity;delete f.sources[1].source;await f.save();
    await expect(buildWeeklyOffers(f.root,["--week","2026-10-12"])).rejects.toThrow(/provenance/);
  });
  it("requires explicit reviewed identity, provenance and approval on future bound originals",async()=>{
    const f=await weeklyPublicationFixture("2026-10-12","2026-10-17","1399999");roots.push(f.root);
    delete f.sources[1].identity;delete f.sources[1].source;delete f.sources[1].approvedAt;await f.save();
    await expect(verifyWeeklyEdition(f.editions[1],f.root)).rejects.toThrow(/provenance/);
  });
  it("binds the approval timestamp to the exact reviewed agency original",async()=>{
    const f=await weeklyPublicationFixture("2026-10-12","2026-10-17","1399999");roots.push(f.root);
    Object.assign(f.originalFlyer,{review:{reviewedAt:f.sources[1].reviewedAt,approvedAt:"2026-10-13T12:00:00Z",printedValidFrom:"2026-10-12",printedValidTo:"2026-10-17"}});await f.save();
    await expect(verifyWeeklyEdition(f.editions[1],f.root)).rejects.toThrow(/binding mismatch/);
  });
  it("rejects typed identity whose language disagrees with the layout before replacing rows",async()=>{
    const f=await weeklyPublicationFixture("2026-10-12","2026-10-17","1399999");roots.push(f.root);
    f.sources[1].identity={language:"de",purpose:"weekly",medium:"trinkgut"};f.sources[1].source=f.editions[0].source;await f.save();
    const before=await readFile(path.join(f.root,"data/weekly-offers.json"));
    await expect(buildWeeklyOffers(f.root,["--week","2026-10-12"])).rejects.toThrow(/identity/);
    expect(await readFile(path.join(f.root,"data/weekly-offers.json"))).toEqual(before);
  });
  it("rejects offer IDs shared by a selected edition and an untouched edition",async()=>{
    const f=await supplementalPublicationFixture("2026-10-05","2026-10-10");roots.push(f.root);
    const id=f.supplementalOffer.id;f.sources[1].pages[0].offers[0].id=id;delete (f.sources[1].pages[0].offers[0] as {imagePath?:string}).imagePath;await f.save();
    await expect(buildWeeklyOffers(f.root,["--week","2026-10-05"])).rejects.toThrow(/conflicts/);
  });
  it("checks manifests not merely declared layout sources",async()=>{
    const f=await fixture();await f.write("data/editorial/supplemental-publications/broken.json","{}");
    await expect(buildWeeklyOffers(f.root,["--check"])).rejects.toThrow();
  });
  it.each(["missing-manifest","duplicate-id","broken-census"])("blocks release for a declared supplemental %s",async mode=>{
    const f=await supplementalPublicationFixture();roots.push(f.root);
    if(mode==="missing-manifest")await unlink(path.join(f.root,`data/editorial/supplemental-publications/${f.supplemental.edition.id}.json`));
    if(mode==="duplicate-id") {f.publication.editions[1].id=f.supplemental.edition.id;await f.save();}
    if(mode==="broken-census") {f.supplemental.edition.review.pageOfferCounts=[2];await f.save();}
    await expect(validateWeeklyPublicationBuild(f.root)).rejects.toThrow();
  });
  it("checks both independent registries without private originals",async()=>{
    const f=await supplementalPublicationFixture();roots.push(f.root);
    for(const source of f.sources)source.privatePdf="missing/private.pdf";
    await f.save();
    expect(await validateWeeklyPublicationBuild(f.root)).toBe(3);
  });
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
