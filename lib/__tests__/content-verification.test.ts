import { describe, expect, it } from "vitest";
import { comparePublishedFlyers, isProductionOrigin, parseContentArguments, verifyPublishedFlyerMarkup, verifyPublishedOfferContent, verifyPublishedOfferMarkup } from "@/lib/content-verification";
import { weeklyOfferFixtureContent } from "@/lib/cinematic/weekly-offer-fixture";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WeeklyOfferGrid from "@/components/WeeklyOfferGrid";
import { streamReactMarkup } from "./fixtures/streamed-markup";

const flyer = {id:"catalog-1384969-v4",title:"Wochenangebote",language:"de" as const,validFrom:"2026-09-28",validTo:"2026-10-03",viewerUrl:"https://werbung.trinkgut.de/viewer/1384969",pdfUrl:"https://werbung.trinkgut.de/pdf/1384969-v4.pdf",coverUrl:"https://werbung.trinkgut.de/cover.jpg",pageCount:18,sourceUrl:"https://werbung.trinkgut.de/viewer/1384969"};
const nlFlyer = {id:"maasduinen-2026-09-28-v2",title:"Weekaanbiedingen",language:"nl" as const,validFrom:"2026-09-28",validTo:"2026-10-03",viewerUrl:"/flyers/2026-09-28/nl-v2.pdf",pdfUrl:"/flyers/2026-09-28/nl-v2.pdf",coverUrl:"/flyers/2026-09-28/nl-v2.jpg",pageCount:1,sourceUrl:"/nl"};

describe("weekly publishing verification", () => {
  it("verifies the actual offer grid after a real React SSR segment completes", async()=>{
    const content=weeklyOfferFixtureContent("monday");
    const html=await streamReactMarkup(createElement(WeeklyOfferGrid,{content}));
    expect(html).toContain('hidden id="S:0"');
    expect(html).toContain('$RC("B:0","S:0")');
    expect(verifyPublishedOfferMarkup(content.offers,html,"/produkte")).toEqual([]);
  });
  it("keeps a resolved grid's genuinely hidden children unavailable", async()=>{
    const content=weeklyOfferFixtureContent("monday");
    const html=await streamReactMarkup(createElement("div",{hidden:true},createElement(WeeklyOfferGrid,{content})));
    expect(verifyPublishedOfferMarkup(content.offers,html,"/produkte")).not.toEqual([]);
  });
  it("resolves nested SSR boundaries while removing the complete nested fallback",()=>{
    const content=weeklyOfferFixtureContent("monday");
    const cards=renderToStaticMarkup(createElement(WeeklyOfferGrid,{content}));
    const html='<main><!--$?--><template id="B:0"></template><!--$?--><template id="B:f"></template><p>Nested fallback</p><!--/$--><!--/$--></main>'
      +'<div hidden id="S:0"><section><!--$?--><template id="B:1"></template><p>Loading</p><!--/$--></section></div>'
      +`<div hidden id="S:1">${cards}</div><script>$RC("B:0","S:0");$RC("B:1","S:1")</script>`;
    expect(verifyPublishedOfferMarkup(content.offers,html,"/produkte")).toEqual([]);
    expect(verifyPublishedOfferMarkup(content.offers,html.replace('<main>','<main hidden>'),"/produkte")).not.toEqual([]);
  });
  it.each(["hidden","template","script"])("keeps apparent cards in %s unavailable after segment completion",async kind=>{
    const content=weeklyOfferFixtureContent("monday");
    const cards=renderToStaticMarkup(createElement(WeeklyOfferGrid,{content}));
    const tag=kind==="hidden"?"div":kind;
    const html=await streamReactMarkup(createElement("section",{dangerouslySetInnerHTML:{__html:`<${tag}${kind==="hidden"?" hidden":""}>${cards}</${tag}>`}}));
    expect(verifyPublishedOfferMarkup(content.offers,html,"/produkte")).not.toEqual([]);
  });
  it.each(["missing-call","missing-segment","missing-close","wrong-boundary","string-call","comment-call","function-call","regex-call","conditional-call","dynamic-args","wrong-pair","duplicate-id","template-call"])("rejects unproven SSR completion: %s",async variant=>{
    const content=weeklyOfferFixtureContent("monday");
    let html=await streamReactMarkup(createElement(WeeklyOfferGrid,{content}));
    const call='$RC("B:0","S:0")';
    if(variant==="missing-call") html=html.replace(call,"");
    if(variant==="missing-segment") html=html.replace('id="S:0"','id="missing"');
    if(variant==="missing-close") html=html.replace('<!--/$-->',"");
    if(variant==="wrong-boundary") html=html.replace('<template id="B:0"></template>','<div id="B:0"></div>');
    if(variant==="string-call") html=html.replace(call,`'${call}'`);
    if(variant==="comment-call") html=html.replace(call,`/*${call}*/`);
    if(variant==="function-call") html=html.replace(call,`function unused(){${call}}`);
    if(variant==="regex-call") html=html.replace(call,`const unused=/;${call};/`);
    if(variant==="conditional-call") html=html.replace(call,`if(false)${call}`);
    if(variant==="dynamic-args") html=html.replace(call,'$RC("B:"+"0","S:0")');
    if(variant==="wrong-pair") html=html.replace(call,'$RC("B:0","S:1")');
    if(variant==="duplicate-id") html+='<div hidden id="S:0"></div>';
    if(variant==="template-call") html=html.replace(call,"")+`<template><script>${call}</script></template>`;
    expect(verifyPublishedOfferMarkup(content.offers,html,"/produkte")).not.toEqual([]);
  });
  it("rejects an expired local PDF rendered on a regular empty Sunday",()=>{
    expect(verifyPublishedFlyerMarkup([], '<a href="/handzettel/2026-10-05/de.pdf">Expired</a>', "/angebote")).not.toEqual([]);
  });
  it.each([
    "/handzettel/2026-10-05/de.pdf?download=1",
    "https://trinkgut-jammers.de/handzettel/2026-10-05/de.pdf",
    "https://trinkgut-jammers.de/handzettel/2026-10-05/de.pdf?download=1#page=2",
  ])("rejects normalized expired same-origin Sunday links: %s",link=>{
    expect(verifyPublishedFlyerMarkup([],`<a href="${link}">Expired</a>`,"/angebote","https://trinkgut-jammers.de")).not.toEqual([]);
  });
  it("does not let an unrelated origin satisfy the approved local PDF link",()=>{
    const local={...flyer,pdfUrl:"/handzettel/2026-10-05/de.pdf"};
    expect(verifyPublishedFlyerMarkup([local],`<a href="https://unrelated.example/handzettel/2026-10-05/de.pdf">PDF</a><img src="${local.coverUrl}">`,"/angebote","https://trinkgut-jammers.de")).not.toEqual([]);
  });
  it("rejects otherwise complete offer markup beneath a hidden ancestor",()=>{
    const {offers}=weeklyOfferFixtureContent("monday"),o=offers[0];
    const card=`<article data-offer-id="${o.id}"><h2>${o.name}</h2><p>${o.conditions}</p><img src="${o.image}"><a href="${o.sourceUrl}#page=${o.sourcePage}">Original</a></article>`;
    expect(verifyPublishedOfferMarkup(offers,card,"/produkte")).toEqual([]);
    expect(verifyPublishedOfferMarkup(offers,`<div hidden>${card}</div>`,"/produkte")).not.toEqual([]);
    expect(verifyPublishedOfferMarkup(offers,card.replace('<article ','<article hidden '),"/produkte")).not.toEqual([]);
  });
  it("rejects a missing offer from an otherwise exact published package",()=>{
    const expected=weeklyOfferFixtureContent("monday");
    expect(verifyPublishedOfferContent(expected,{...expected,offers:[]})).not.toEqual([]);
  });
  it("rejects a changed original hash in the offers API",()=>{
    const expected=weeklyOfferFixtureContent("monday");
    expect(verifyPublishedOfferContent(expected,{...expected,offers:[{...expected.offers[0],pdfSha256:"b".repeat(64)}]})).not.toEqual([]);
  });
  it("accepts exact offers regardless of response generation time",()=>{
    const expected=weeklyOfferFixtureContent("monday");
    expect(verifyPublishedOfferContent(expected,{...expected,generatedAt:"2026-10-13T12:01:00Z"})).toEqual([]);
  });
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
