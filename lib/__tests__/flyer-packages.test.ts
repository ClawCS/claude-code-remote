import { describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { loadFlyerPackages, parseFlyerPackages, selectActiveFlyerPackages, verifyFlyerFiles } from "@/lib/flyer-packages";

const flyer = {
  id: "maasduinen-2026-10-05", language: "nl" as const, title: "Aanbiedingen",
  validFrom: "2026-10-05", validTo: "2026-10-10",
  sourceUrl: "https://www.canva.com/design/DAHHqrttnew/view", designId: "DAHHqrttnew",
  pageNumbers: [14], rightsStatus: "approved" as const, exportedAt: "2026-10-04T15:00:00Z",
  pdfPath: "/handzettel/2026/maasduinen-2026-10-05.pdf",
  coverPath: "/images/content/maasduinen-2026-10-05.webp",
  pdfSha256: "a".repeat(64), coverSha256: "b".repeat(64),
};

describe("dated Canva flyer packages", () => {
  it("refuses to load metadata for missing exported files", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "jammers-flyer-"));
    const cwd = vi.spyOn(process, "cwd").mockReturnValue(root);
    try {
      await mkdir(path.join(root, "data/editorial"), {recursive: true});
      await writeFile(path.join(root, "data/editorial/flyers.json"), JSON.stringify([flyer]));
      await expect(loadFlyerPackages()).rejects.toThrow();
    } finally {cwd.mockRestore(); await rm(root, {recursive: true, force: true});}
  });
  it("keeps Sunday preload hidden until Berlin Monday and expires after Saturday", () => {
    const packages = parseFlyerPackages([flyer]);
    expect(selectActiveFlyerPackages(packages, new Date("2026-10-04T15:00:00Z"))).toHaveLength(0);
    expect(selectActiveFlyerPackages(packages, new Date("2026-10-04T22:00:00Z"))).toHaveLength(1);
    expect(selectActiveFlyerPackages(packages, new Date("2026-10-10T22:00:00Z"))).toHaveLength(0);
  });
  it.each([
    {validFrom: "2026-02-30"}, {validTo: "2026-10-01"}, {rightsStatus: "review-required"},
    {pdfPath: "/handzettel/../private.pdf"}, {coverPath: "https://unknown.example/image.jpg"},
    {sourceUrl: "https://user:password@www.canva.com/design/DAHHqrttnew/view"},
    {pdfSha256: "none"}, {pageNumbers: [14, 14]},
  ])("rejects an unsafe or incomplete package %j", (override) => {
    expect(() => parseFlyerPackages([{...flyer, ...override}])).toThrow();
  });
  it("rejects duplicate IDs", () => expect(() => parseFlyerPackages([flyer, flyer])).toThrow());
  it("rejects overlapping weekly packages of the same language", () => expect(() => parseFlyerPackages([flyer,{...flyer,id:"another-weekly-flyer"}])).toThrow());
  it.each(["broken-pdf","wrong-page-count","broken-cover","valid"])("checks actual PDF structure, selected-page count and cover decoding: %s", async mode => {
    const root = await mkdtemp(path.join(tmpdir(),"jammers-export-"));
    try {
      const doc = await PDFDocument.create();
      doc.addPage();
      if (mode === "wrong-page-count") doc.addPage();
      const pdf = mode === "broken-pdf" ? Buffer.from("%PDF-not a complete document") : Buffer.from(await doc.save());
      const cover = mode === "broken-cover" ? Buffer.from("not an image") : await sharp({create:{width:64,height:64,channels:3,background:"red"}}).webp().toBuffer();
      const item = {...flyer,pdfSha256:createHash("sha256").update(pdf).digest("hex"),coverSha256:createHash("sha256").update(cover).digest("hex")};
      await mkdir(path.dirname(path.join(root,"public",item.pdfPath)),{recursive:true});
      await mkdir(path.dirname(path.join(root,"public",item.coverPath)),{recursive:true});
      await writeFile(path.join(root,"public",item.pdfPath),pdf);
      await writeFile(path.join(root,"public",item.coverPath),cover);
      if (mode === "valid") await expect(verifyFlyerFiles(item,root)).resolves.toBeUndefined();
      else await expect(verifyFlyerFiles(item,root)).rejects.toThrow();
    } finally {await rm(root,{recursive:true,force:true});}
  });
});
