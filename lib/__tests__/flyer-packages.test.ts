import { describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { loadFlyerPackages, parseFlyerPackages, selectActiveFlyerPackages, selectWeeklyNlFlyer, verifyFlyerFiles } from "@/lib/flyer-packages";

const flyer = {
  id: "maasduinen-2026-10-05", language: "nl" as const, title: "Aanbiedingen",
  validFrom: "2026-10-05", validTo: "2026-10-10",
  sourceUrl: "https://www.canva.com/design/DAHHqrttnew/view", designId: "DAHHqrttnew",
  pageNumbers: [14], rightsStatus: "approved" as const, exportedAt: "2026-10-04T15:00:00Z",
  pdfPath: "/handzettel/2026/maasduinen-2026-10-05.pdf",
  coverPath: "/images/content/maasduinen-2026-10-05.webp",
  pdfSha256: "a".repeat(64), coverSha256: "b".repeat(64),
};
const agency = {
  id: "driehoek-synthetic-2026-10-12", language: "nl", title: "Synthetic agency original",
  validFrom: "2026-10-12", validTo: "2026-10-17",
  identity: { language: "nl", purpose: "weekly", medium: "de-maas-driehoek" },
  source: { kind: "agency", originalId: "driehoek-synthetic-2026-10-12", medium: "de-maas-driehoek" },
  pageCount: 1, rightsStatus: "approved", exportedAt: "2026-10-11T10:00:00Z",
  review: { reviewedAt: "2026-10-11T11:00:00Z", approvedAt: "2026-10-11T12:00:00Z", printedValidFrom: "2026-10-12", printedValidTo: "2026-10-17" },
  pdfPath: "/handzettel/2026/synthetic-agency.pdf", coverPath: "/images/content/synthetic-agency.webp",
  pdfSha256: "a".repeat(64), coverSha256: "b".repeat(64),
};

describe("dated Canva flyer packages", () => {
  it("accepts typed agency original without fictitious Canva URL or identity", () => {
    const [parsed] = parseFlyerPackages([agency]);
    expect(parsed).toMatchObject({ source: agency.source, identity: agency.identity, pageCount: 1 });
    expect(parsed.sourceUrl).toBeUndefined();
    expect(parsed.designId).toBeUndefined();
    expect(selectWeeklyNlFlyer([parsed], { validFrom: "2026-10-12", validTo: "2026-10-17" })?.id).toBe(agency.id);
  });
  it.each([
    { source: undefined }, { identity: undefined }, { pageCount: 2 }, { sourceUrl: "https://www.canva.com/design/fake/view" },
    { source: { ...agency.source, medium: "udens-weekblad" } },
    { identity: { ...agency.identity, language: "de" } }, { validFrom: "2025-10-12" },
    { review: { ...agency.review, printedValidTo: "2026-10-18" } },
    { review: { ...agency.review, approvedAt: "2026-02-30T12:00:00Z" } },
    { review: { ...agency.review, reviewedAt: "2026-10-11" } },
    { review: { ...agency.review, approvedAt: "2026-10-11T09:00:00Z" } },
    { pdfSha256: "unverified" }, { extra: "private" },
  ])("rejects incomplete or contradictory typed provenance %j", override => {
    expect(() => parseFlyerPackages([{ ...agency, ...override }])).toThrow();
  });
  it("does not allow Maasduinen to satisfy the weekly NL requirement", () => {
    const item = { ...agency, identity: { language: "nl", purpose: "supplemental", medium: "maasduinen" },
      source: { kind: "canva", flyerId: agency.id }, sourceUrl: flyer.sourceUrl, designId: flyer.designId, pageNumbers: [14] };
    const [parsed] = parseFlyerPackages([item]);
    expect(selectWeeklyNlFlyer([parsed], { validFrom: "2026-10-12", validTo: "2026-10-17" })).toBeNull();
  });
  it("normalizes unchanged historical Canva provenance without mutating its input", () => {
    const before = JSON.stringify(flyer);
    expect(parseFlyerPackages([flyer])[0]).toMatchObject({
      identity: { language: "nl", purpose: "weekly", medium: "legacy-canva" },
      source: { kind: "canva", flyerId: flyer.id }, pageCount: 1,
      pdfSha256: flyer.pdfSha256, coverSha256: flyer.coverSha256,
    });
    expect(JSON.stringify(flyer)).toBe(before);
  });
  it("rejects future untyped Canva weekly provenance", () => {
    expect(() => parseFlyerPackages([{ ...flyer, validFrom: "2026-10-12", validTo: "2026-10-17" }])).toThrow();
  });
  it("accepts the reviewed KW40 Friday-ending NL page without extending its printed validity",()=>{
    const item={...flyer,validFrom:"2026-09-28",validTo:"2026-10-02"};
    expect(selectWeeklyNlFlyer([item],{validFrom:"2026-09-28",validTo:"2026-10-03"})?.validTo).toBe("2026-10-02");
  });
  it("still accepts the calendar Saturday ending when that is what the NL source prints",()=>{
    const item={...flyer,validFrom:"2026-09-28",validTo:"2026-10-03"};
    expect(selectWeeklyNlFlyer([item],{validFrom:"2026-09-28",validTo:"2026-10-03"})?.validTo).toBe("2026-10-03");
  });
  it.each([{validFrom:"2026-09-28",validTo:"2026-10-01"},{validFrom:"2026-09-29",validTo:"2026-10-02"},{validFrom:"2026-10-05",validTo:"2026-10-09"}])("does not generalize the reviewed exception into arbitrary shortened weeks: %j", dates=>{
    const range=dates.validFrom==="2026-10-05"?{validFrom:"2026-10-05",validTo:"2026-10-10"}:{validFrom:"2026-09-28",validTo:"2026-10-03"};
    expect(selectWeeklyNlFlyer([{...flyer,...dates}],range)).toBeNull();
  });
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
  it("rejects a multi-page NL export instead of accepting a collection as the weekly page", () => {
    expect(() => parseFlyerPackages([{...flyer, pageNumbers: [13, 14]}])).toThrow(/NL|niederländ|Seite/i);
  });
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
