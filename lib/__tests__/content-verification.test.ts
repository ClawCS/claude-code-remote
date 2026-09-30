import { describe, expect, it } from "vitest";
import { comparePublishedFlyers, isProductionOrigin, parseContentArguments, verifyPublishedFlyerMarkup } from "@/lib/content-verification";

const flyer = {id:"catalog-1384969-v4",title:"Wochenangebote",language:"de" as const,validFrom:"2026-09-28",validTo:"2026-10-03",viewerUrl:"https://werbung.trinkgut.de/viewer/1384969",pdfUrl:"https://werbung.trinkgut.de/pdf/1384969-v4.pdf",coverUrl:"https://werbung.trinkgut.de/cover.jpg",pageCount:18,sourceUrl:"https://werbung.trinkgut.de/viewer/1384969"};
const nlFlyer = {id:"maasduinen-2026-09-28-v2",title:"Weekaanbiedingen",language:"nl" as const,validFrom:"2026-09-28",validTo:"2026-10-03",viewerUrl:"/flyers/2026-09-28/nl-v2.pdf",pdfUrl:"/flyers/2026-09-28/nl-v2.pdf",coverUrl:"/flyers/2026-09-28/nl-v2.jpg",pageCount:1,sourceUrl:"/nl"};

describe("weekly publishing verification", () => {
  it("rejects an empty official flyer index", () => expect(comparePublishedFlyers([flyer], [], flyer)).not.toEqual([]));
  it("rejects the right ID with the wrong published files", () => expect(comparePublishedFlyers([flyer], [{...flyer,pdfUrl:"/wrong.pdf"}], flyer)).not.toEqual([]));
  it("rejects a wrong home flyer version in the same week", () => expect(comparePublishedFlyers([flyer], [flyer], {...flyer,id:"catalog-1384969-v3"})).not.toEqual([]));
  it("rejects an extra expired flyer", () => expect(comparePublishedFlyers([flyer], [flyer,{...flyer,id:"old"}], flyer)).not.toEqual([]));
  it("accepts an exact deployed flyer set", () => expect(comparePublishedFlyers([flyer], [flyer], flyer)).toEqual([]));
  it("accepts the Sunday no-current-flyer state", () => expect(comparePublishedFlyers([], [], null)).toEqual([]));
  it("rejects an expected NL flyer missing from the homepage slot", () => {
    expect(comparePublishedFlyers([flyer,nlFlyer], [flyer,nlFlyer], flyer)).not.toEqual([]);
  });
  it.each([
    {field:"id", value:"maasduinen-2026-09-28-v1"},
    {field:"title", value:"Verlopen weekaanbiedingen"},
    {field:"validFrom", value:"2026-09-21"},
    {field:"validTo", value:"2026-09-26"},
    {field:"viewerUrl", value:"/flyers/nl-old.pdf"},
    {field:"pdfUrl", value:"/flyers/nl-old.pdf"},
    {field:"coverUrl", value:"/flyers/nl-old.jpg"},
    {field:"pageCount", value:2},
    {field:"sourceUrl", value:"/wrong-source"},
  ])("rejects a mismatched NL homepage $field", ({field,value}) => {
    expect(comparePublishedFlyers([flyer,nlFlyer], [flyer,nlFlyer], flyer, {...nlFlyer,[field]:value})).not.toEqual([]);
  });
  it("accepts matching DE and one-page NL homepage slots", () => {
    expect(comparePublishedFlyers([flyer,nlFlyer], [flyer,nlFlyer], flyer, nlFlyer)).toEqual([]);
  });
  it("rejects a multi-page NL package even when the deployed metadata matches", () => {
    const multiPageNl = {...nlFlyer,pageCount:2};
    expect(comparePublishedFlyers([flyer,multiPageNl], [flyer,multiPageNl], flyer, multiPageNl)).not.toEqual([]);
  });
  it.each([null,undefined])("accepts an absent NL homepage slot when no NL package is expected: %s", nlHome => {
    expect(comparePublishedFlyers([flyer], [flyer], flyer, nlHome)).toEqual([]);
  });
  it("rejects an unexpected NL homepage flyer", () => {
    expect(comparePublishedFlyers([flyer], [flyer], flyer, nlFlyer)).not.toEqual([]);
  });
  it.each(["https://10.0.0.1","https://192.168.1.10","https://foo.localhost","https://staging.example.com","http://trinkgut-jammers.de"])("never confirms an unconfigured origin: %s", url => expect(isProductionOrigin(url, null)).toBe(false));
  it("requires an exact configured HTTPS production origin", () => {
    expect(isProductionOrigin("https://trinkgut-jammers.de", "https://trinkgut-jammers.de")).toBe(true);
    expect(isProductionOrigin("https://preview.trinkgut-jammers.de", "https://trinkgut-jammers.de")).toBe(false);
    expect(isProductionOrigin("https://10.0.0.1", "https://10.0.0.1")).toBe(false);
  });
  it.each([["--check","--prepare"],["--chek"],["--check","--week"],["--check","--now","2026-10-04T17:00:00"],["--check","--week","2026-02-30"]].map(args=>({args})))("rejects ambiguous command arguments: $args", ({args}) => expect(()=>parseContentArguments(args)).toThrow());
  it("accepts an explicit Berlin-offset evaluation time", () => expect(parseContentArguments(["--prepare","--now","2026-10-04T17:00:00+02:00"]).now.toISOString()).toBe("2026-10-04T15:00:00.000Z"));
});

describe("published flyer markup verification", () => {
  const deMarkup = '<a href="https://werbung.trinkgut.de/pdf/1384969-v4.pdf">PDF</a><img src="https://werbung.trinkgut.de/cover.jpg" alt="Titelseite" />';
  const nlMarkup = '<a href="/flyers/2026-09-28/nl-v2.pdf">PDF</a><img src="/flyers/2026-09-28/nl-v2.jpg" alt="Voorpagina" />';

  it.each(["/","/nl","/angebote","/handzettel"])("accepts exact DE and NL PDF links and covers on %s", route => {
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], deMarkup + nlMarkup, route)).toEqual([]);
  });
  it.each(["/","/nl"])("rejects a missing NL PDF link on %s", route => {
    const html = deMarkup + '<img src="/flyers/2026-09-28/nl-v2.jpg" alt="Voorpagina" />';
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], html, route)).toHaveLength(1);
  });
  it.each(["/","/nl"])("rejects a missing NL cover on %s", route => {
    const html = deMarkup + '<a href="/flyers/2026-09-28/nl-v2.pdf">PDF</a>';
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], html, route)).toHaveLength(1);
  });
  it("still requires the DE link and cover when NL is present", () => {
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], nlMarkup, "/")).toHaveLength(2);
  });
  it("does not count serialized flyer URLs as rendered links or images", () => {
    const html = deMarkup + '<script>window.flyer={pdfUrl:"/flyers/2026-09-28/nl-v2.pdf",coverUrl:"/flyers/2026-09-28/nl-v2.jpg"}</script>';
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], html, "/nl")).toHaveLength(2);
  });
  it("does not count commented-out flyer markup", () => {
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], deMarkup + '<!--' + nlMarkup + '-->', "/")).toHaveLength(2);
  });
  it.each(["template","textarea","style","title","iframe","noscript","xmp","noembed","noframes"])("does not count NL assets inside non-rendered %s placeholders",tag=>{
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer],deMarkup+`<${tag}>${nlMarkup}</${tag}>`,"/nl")).toHaveLength(2);
  });
  it("does not parse asset tags after a plaintext opening",()=>{
    expect(verifyPublishedFlyerMarkup([nlFlyer],`<plaintext>${nlMarkup}</plaintext>${nlMarkup}`,"/")).toHaveLength(2);
  });
  it("does not count assets inside a nested template after its inner template closes",()=>{
    expect(verifyPublishedFlyerMarkup([nlFlyer],`<template><template></template>${nlMarkup}</template>`,"/")).toHaveLength(2);
  });
  it.each(["hidden","hidden=\"\"","hidden=\"hidden\"","hidden=\"until-found\""])("does not count assets inside a %s ancestor",attribute=>{
    expect(verifyPublishedFlyerMarkup([nlFlyer],`<div ${attribute}>${nlMarkup}</div>`,"/")).toHaveLength(2);
  });
  it("does not count individually hidden PDF links or covers",()=>{
    const html='<a hidden href="/flyers/2026-09-28/nl-v2.pdf">PDF</a><img hidden src="/flyers/2026-09-28/nl-v2.jpg" />';
    expect(verifyPublishedFlyerMarkup([nlFlyer],html,"/nl")).toHaveLength(2);
  });
  it("rejects lookalike filenames containing the expected PDF and cover paths", () => {
    const html = deMarkup + '<a href="/flyers/2026-09-28/nl-v2.pdf.backup">PDF</a><img src="/flyers/2026-09-28/nl-v2.jpg.backup" />';
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], html, "/nl")).toHaveLength(2);
  });
  it("accepts a Next-optimized cover URL with an encoded original source", () => {
    const html = deMarkup + '<a href="/flyers/2026-09-28/nl-v2.pdf">PDF</a><img src="/_next/image?url=%2Fflyers%2F2026-09-28%2Fnl-v2.jpg&amp;w=1080&amp;q=75" />';
    expect(verifyPublishedFlyerMarkup([flyer,nlFlyer], html, "/")).toEqual([]);
  });
  it("rejects an optimized image whose actual source is a different cover", () => {
    const html = '<a href="/flyers/2026-09-28/nl-v2.pdf">PDF</a><img src="/_next/image?url=%2Fwrong.jpg&amp;other=%2Fflyers%2F2026-09-28%2Fnl-v2.jpg" />';
    expect(verifyPublishedFlyerMarkup([nlFlyer], html, "/nl")).toHaveLength(1);
  });
  it("accepts HTML-escaped query parameters in a PDF link", () => {
    const expected = {...nlFlyer,pdfUrl:"/flyers/nl.pdf?week=2026-09-28&version=2"};
    const html = '<a href="/flyers/nl.pdf?week=2026-09-28&amp;version=2">PDF</a><img src="/flyers/2026-09-28/nl-v2.jpg" />';
    expect(verifyPublishedFlyerMarkup([expected], html, "/nl")).toEqual([]);
  });
  it("keeps DE-only markup compatible when no NL flyer is expected", () => {
    expect(verifyPublishedFlyerMarkup([flyer], deMarkup, "/")).toEqual([]);
  });
  it("accepts empty markup when no current flyers are expected", () => {
    expect(verifyPublishedFlyerMarkup([], "", "/")).toEqual([]);
  });
});
