import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { expect, it } from "vitest";
import { EIGENMARKEN_BOTTLES } from "@/data/eigenmarken-bottles";

const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
it("ships the approved v4 film in two bounded fast-start versions matching provenance", () => {
  const manifest = JSON.parse(readFileSync("assets/source/hero-film/provenance.json", "utf8"));
  expect(manifest.source.sha256).toBe("59a70d3ef71c8eef46396005b3242f2109e3570a46b286f1b7f3fadbe0cc81a2");
  for (const [variant, budget] of [["desktop",6000000], ["mobile",3000000]] as const) {
    const path = `public/videos/jammers-hero-v4-${variant}.mp4`;
    expect(existsSync(path), path).toBe(true);
    const bytes = readFileSync(path), record = manifest.files.find((file: {path:string}) => file.path === path);
    expect(bytes.length).toBeLessThan(budget);
    expect(record.sha256).toBe(hash(bytes)); expect(record.bytes).toBe(bytes.length);
    expect(record).toMatchObject({durationSeconds:15,fps:24,hasAudio:false});
    expect(bytes.indexOf("moov")).toBeGreaterThan(0);
    expect(bytes.indexOf("moov")).toBeLessThan(bytes.indexOf("mdat"));
    expect(existsSync(`public/videos/jammers-hero-${variant}.mp4`)).toBe(true);
  }
});

it("retains each exact original transparent bottle without trimming its pixels", async () => {
  const manifest = JSON.parse(readFileSync("assets/source/eigenmarken-bottles/provenance.json", "utf8"));
  for (const [slug, bottle] of Object.entries(EIGENMARKEN_BOTTLES)) {
    const bytes = readFileSync(`public${bottle.src}`), meta = await sharp(bytes).metadata();
    const record = manifest.files.find((file: {slug:string}) => file.slug === slug);
    expect(hash(bytes)).toBe(record.sourceSha256); expect(record.sha256).toBe(record.sourceSha256);
    expect(meta).toMatchObject({width:bottle.width,height:bottle.height,hasAlpha:true});
    const {data,info} = await sharp(bytes).raw().toBuffer({resolveWithObject:true});
    const alpha = Array.from({length:info.width*info.height}, (_,index) => data[index*info.channels+info.channels-1]);
    expect(alpha.some(value => value === 0)).toBe(true); expect(alpha.some(value => value === 255)).toBe(true);
  }
});
