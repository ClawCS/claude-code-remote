import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { expect, it } from "vitest";
import { EIGENMARKEN_BOTTLES } from "@/data/eigenmarken-bottles";

const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
it("ships the approved V6 film in two bounded fast-start versions matching provenance", () => {
  const manifest = JSON.parse(readFileSync("assets/source/hero-film/provenance.json", "utf8"));
  expect(manifest.source).toMatchObject({ filename: "jammers-hero-v6-master.mp4", sha256: "6062ba8e3bd56af9647c16ccbd03c9a21aa9ed5b6ac8f89872922e3a5c501e1b", bytes: 10893745, width: 1920, height: 1080, frames: 360, durationSeconds: 15, fps: 24, hasAudio: false });
  for (const [path, budget, width, height, sha256] of [
    ["public/videos/jammers-hero-v6-desktop-06fd3bdde1a2d604.mp4", 6000000, 1280, 720, "06fd3bdde1a2d6045b056a73fcf0350c4a443a756ee121988e07967d15bd363f"],
    ["public/videos/jammers-hero-v6-mobile-e2f94ee62e776519.mp4", 1000000, 640, 360, "e2f94ee62e776519a7b4788a0f156123d056433ebd438f43a39f6d979dfecba3"],
  ] as const) {
    expect(existsSync(path), path).toBe(true);
    const bytes = readFileSync(path), record = manifest.files.find((file: {path:string}) => file.path === path);
    expect(bytes.length).toBeLessThan(budget);
    expect(hash(bytes)).toBe(sha256);
    expect(record.sha256).toBe(sha256); expect(record.bytes).toBe(bytes.length);
    expect(record).toMatchObject({ width, height, frames: 360, durationSeconds:15, fps:24, hasAudio:false });
    expect(bytes.indexOf("moov")).toBeGreaterThan(0);
    expect(bytes.indexOf("moov")).toBeLessThan(bytes.indexOf("mdat"));
  }
});

it("preserves the complete V4 provenance and retained historical film bytes", () => {
  const manifest = JSON.parse(readFileSync("assets/source/hero-film/provenance.json", "utf8"));
  const archived = manifest.history.find((entry: { version: string }) => entry.version === "v4");
  expect(archived?.source.sha256).toBe("59a70d3ef71c8eef46396005b3242f2109e3570a46b286f1b7f3fadbe0cc81a2");
  expect(archived.files).toHaveLength(6);
  expect(archived.generation.finale).toContain("Accepted static AI motif");
  expect(archived.sceneTimeline).toHaveLength(4);
  expect(archived.performanceReview.mobileCurrentBytes).toBe(980962);
  expect(manifest.history.find((entry: { version: string }) => entry.version === "v2")).toBeDefined();
  for (const entry of manifest.history) {
    for (const record of entry.files) {
      const bytes = readFileSync(record.path);
      expect(hash(bytes)).toBe(record.sha256);
      expect(bytes.length).toBe(record.bytes);
    }
  }
});

it("records the approved frame-exact V6 montage with the animated finale starting at 11 seconds", () => {
  const manifest = JSON.parse(readFileSync("assets/source/hero-film/provenance.json", "utf8"));
  expect(manifest.sceneTimeline.map((scene: { startFrameInclusive: number; endFrameExclusive: number }) => [scene.startFrameInclusive, scene.endFrameExclusive])).toEqual([[0, 94], [94, 167], [167, 263], [263, 264], [264, 360]]);
  expect(manifest.sceneTimeline[4].startSeconds).toBe(11);
  expect(manifest.generation.finale).toContain("devil/angel");
  expect(manifest.generation.finale).not.toContain("Rejected animated finale");
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
