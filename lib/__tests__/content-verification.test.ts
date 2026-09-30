import { describe, expect, it } from "vitest";
import { comparePublishedFlyers, isProductionOrigin, parseContentArguments } from "@/lib/content-verification";

const flyer = {id:"catalog-1384969-v4",title:"Wochenangebote",language:"de" as const,validFrom:"2026-09-28",validTo:"2026-10-03",viewerUrl:"https://werbung.trinkgut.de/viewer/1384969",pdfUrl:"https://werbung.trinkgut.de/pdf/1384969-v4.pdf",coverUrl:"https://werbung.trinkgut.de/cover.jpg",pageCount:18,sourceUrl:"https://werbung.trinkgut.de/viewer/1384969"};

describe("weekly publishing verification", () => {
  it("rejects an empty official flyer index", () => expect(comparePublishedFlyers([flyer], [], flyer)).not.toEqual([]));
  it("rejects the right ID with the wrong published files", () => expect(comparePublishedFlyers([flyer], [{...flyer,pdfUrl:"/wrong.pdf"}], flyer)).not.toEqual([]));
  it("rejects a wrong home flyer version in the same week", () => expect(comparePublishedFlyers([flyer], [flyer], {...flyer,id:"catalog-1384969-v3"})).not.toEqual([]));
  it("rejects an extra expired flyer", () => expect(comparePublishedFlyers([flyer], [flyer,{...flyer,id:"old"}], flyer)).not.toEqual([]));
  it("accepts an exact deployed flyer set", () => expect(comparePublishedFlyers([flyer], [flyer], flyer)).toEqual([]));
  it("accepts the Sunday no-current-flyer state", () => expect(comparePublishedFlyers([], [], null)).toEqual([]));
  it.each(["https://10.0.0.1","https://192.168.1.10","https://foo.localhost","https://staging.example.com","http://trinkgut-jammers.de"])("never confirms an unconfigured origin: %s", url => expect(isProductionOrigin(url, null)).toBe(false));
  it("requires an exact configured HTTPS production origin", () => {
    expect(isProductionOrigin("https://trinkgut-jammers.de", "https://trinkgut-jammers.de")).toBe(true);
    expect(isProductionOrigin("https://preview.trinkgut-jammers.de", "https://trinkgut-jammers.de")).toBe(false);
    expect(isProductionOrigin("https://10.0.0.1", "https://10.0.0.1")).toBe(false);
  });
  it.each([["--check","--prepare"],["--chek"],["--check","--week"],["--check","--now","2026-10-04T17:00:00"],["--check","--week","2026-02-30"]].map(args=>({args})))("rejects ambiguous command arguments: $args", ({args}) => expect(()=>parseContentArguments(args)).toThrow());
  it("accepts an explicit Berlin-offset evaluation time", () => expect(parseContentArguments(["--prepare","--now","2026-10-04T17:00:00+02:00"]).now.toISOString()).toBe("2026-10-04T15:00:00.000Z"));
});
