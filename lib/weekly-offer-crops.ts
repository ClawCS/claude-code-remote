export type OriginalCrop = {
  rect: number[];
  sourceDimensions: number[];
  sourceRegions?: number[][];
};

/** Mechanical original-pixel cuts only: no retouching, price replacement or rearranging. */
export async function renderOfferCrop(source: Buffer, crop: OriginalCrop): Promise<Buffer> {
  const metadata = await sharp(source).metadata();
  if (crop.sourceDimensions.length !== 2 || metadata.width !== crop.sourceDimensions[0] || metadata.height !== crop.sourceDimensions[1]) {
    throw new Error("Original source dimensions do not match the reviewed crop");
  }
  const inside = (r: number[], bounds: number[]) => r.length === 4 && r.every(Number.isSafeInteger)
    && r[2] > 0 && r[3] > 0 && r[0] >= bounds[0] && r[1] >= bounds[1]
    && r[0] + r[2] <= bounds[0] + bounds[2] && r[1] + r[3] <= bounds[1] + bounds[3];
  if (!inside(crop.rect, [0,0,metadata.width!,metadata.height!])) throw new Error("Crop outside original bounds");
  const [left,top,width,height] = crop.rect;
  if (!crop.sourceRegions) return sharp(source).extract({left,top,width,height}).webp({lossless:true,effort:6}).toBuffer();
  if (!crop.sourceRegions.length) throw new Error("Original crop regions must not be empty");
  for (const region of crop.sourceRegions) {
    if (!inside(region,crop.rect)) throw new Error("Region outside reviewed crop bounds");
  }
  const layers = await Promise.all(crop.sourceRegions.map(async ([x,y,w,h]) => ({
    input: await sharp(source).extract({left:x,top:y,width:w,height:h}).png().toBuffer(),
    left:x-left, top:y-top,
  })));
  return sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(layers).webp({lossless:true,effort:6}).toBuffer();
}
import sharp from "sharp";
