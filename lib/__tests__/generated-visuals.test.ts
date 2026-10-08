import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {describe,expect,it} from "vitest";
import manifest from "@/data/generated-visuals.json";
import {courses} from "@/data/akademie";
import {rentalItems} from "@/data/rentals";

describe("approved generated visual assets",()=>{
  it("covers exactly eight courses and the nineteen retained rental articles",()=>{
    expect(manifest.images.filter(i=>i.kind==="academy").map(i=>i.id).sort()).toEqual(courses.map(c=>"academy-"+c.slug).sort());
    expect(manifest.images.filter(i=>i.kind==="rental").map(i=>i.path).sort()).toEqual(rentalItems.map(i=>i.image).sort());
    expect(manifest.images).toHaveLength(27);
    expect(new Set(manifest.images.map(i=>i.path)).size).toBe(27);
  });
  it.each(manifest.images)("verifies the published derivative of $id",image=>{
    expect(createHash("sha256").update(readFileSync("public"+image.path)).digest("hex")).toBe(image.sha256);
    expect(image.prompt.length).toBeGreaterThan(40);
    expect(image.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(image.sourcePath).toContain("assets/source/generated-visuals/");
    expect(image.width/image.height).toBe(1.5);
  });
});
