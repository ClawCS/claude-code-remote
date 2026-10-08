import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { renderOfferCrop } from "@/lib/weekly-offer-crops";

const image = () => sharp({create:{width:8,height:6,channels:4,background:{r:200,g:20,b:10,alpha:1}}}).png().toBuffer();

describe("lossless original offer crops", () => {
  it("preserves the source pixels and requested natural dimensions", async () => {
    const result = await renderOfferCrop(await image(), {rect:[1,1,4,3],sourceDimensions:[8,6]});
    const {data,info} = await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    expect([info.width,info.height]).toEqual([4,3]);
    expect([...data.subarray(0,4)]).toEqual([200,20,10,255]);
  });
  it("retains interlocking original regions in place without a neighbouring offer price", async () => {
    const result = await renderOfferCrop(await image(), {rect:[1,1,4,3],sourceDimensions:[8,6],sourceRegions:[[1,1,2,3],[3,1,2,1]]});
    const {data,info} = await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const pixel=(x:number,y:number)=>[...data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4)];
    expect(pixel(0,2)).toEqual([200,20,10,255]);
    expect(pixel(3,0)).toEqual([200,20,10,255]);
    expect(pixel(3,2)[3]).toBe(0);
  });
  it("rejects wrong source dimensions and out-of-bounds cuts instead of silently changing the offer", async () => {
    await expect(renderOfferCrop(await image(),{rect:[0,0,4,3],sourceDimensions:[9,6]})).rejects.toThrow(/dimensions/i);
    await expect(renderOfferCrop(await image(),{rect:[6,0,4,3],sourceDimensions:[8,6]})).rejects.toThrow(/bounds/i);
    await expect(renderOfferCrop(await image(),{rect:[1,1,4,3],sourceDimensions:[8,6],sourceRegions:[[0,0,2,2]]})).rejects.toThrow(/bounds/i);
    await expect(renderOfferCrop(await image(),{rect:[1,1,4,3],sourceDimensions:[8,6],sourceRegions:[]})).rejects.toThrow(/regions/i);
  });
});
