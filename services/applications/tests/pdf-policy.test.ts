import { describe, expect, it } from "vitest";
import { inspectPdfGraph } from "../src/pdf-policy";

function graph(extra: Record<string, unknown> = {}, objects: Record<string, unknown> = {}) {
  return { version: 2, parameters: { decodelevel: "generalized" }, qpdf: [{ jsonversion: 2, pdfversion: "1.7", pushedinheritedpageresources: false, calledgetallpages: false, maxobjectid: 4 }, {
    "obj:1 0 R": { value: { "/Type": "/Catalog", "/Pages": "2 0 R", ...extra } },
    "obj:2 0 R": { value: { "/Type": "/Pages", "/Kids": ["3 0 R"], "/Count": 1 } },
    "obj:3 0 R": { value: { "/Type": "/Page", "/Parent": "2 0 R", "/MediaBox": [0, 0, 612, 792] } },
    trailer: { value: { "/Root": "1 0 R", "/Size": 5 } }, ...objects,
  }] };
}
describe("QPDF selected-view static profile", () => {
  it.each([20, 21])("enforces the twenty-page limit on actual page tree count %s", count => {
    const input = graph();
    input.qpdf[0].maxobjectid = count + 2;
    const objects = input.qpdf[1] as Record<string, unknown>;
    objects["obj:2 0 R"] = { value: { "/Type": "/Pages", "/Kids": Array.from({ length: count }, (_, i) => `${i + 3} 0 R`), "/Count": count } };
    for (let i = 0; i < count; i++) objects[`obj:${i + 3} 0 R`] = { value: { "/Type": "/Page", "/Parent": "2 0 R" } };
    if (count === 20) expect(inspectPdfGraph(input).pages).toBe(20);
    else expect(() => inspectPdfGraph(input)).toThrow("PAGE_LIMIT");
  });
  it("allows ordinary page Parent backlinks and syntax-looking strings", () => { expect(inspectPdfGraph(graph({}, { "obj:4 0 R": { value: { "/Title": "u:/JavaScript /Launch", "/S": "/P" } } }))).toEqual({ pages: 1, streams: [] }); });
  it.each(["/JS", "/JavaScript", "/OpenAction", "/AA", "/EmbeddedFiles", "/XFA", "/AcroForm", "/AF"]) ("rejects active key %s in selected unreferenced objects", key => { expect(() => inspectPdfGraph(graph({}, { "obj:4 0 R": { value: { [key]: {} } } }))).toThrow("ACTIVE_PDF"); });
  it("decodes binary canonical names rather than matching raw spelling", () => { expect(() => inspectPdfGraph(graph({ "n:/Open#41ction": {} }))).toThrow("ACTIVE_PDF"); });
  it.each(["/Launch", "/RichMedia", "/3D", "/EmbeddedFile"]) ("rejects active name %s", value => { expect(() => inspectPdfGraph(graph({}, { "obj:4 0 R": { value: { "/Type": value } } }))).toThrow("ACTIVE_PDF"); });
  it("allows supported URI Link actions but rejects other schemes and chains", () => {
    const link = (action: unknown) => graph({}, { "obj:4 0 R": { value: { "/Type": "/Annot", "/Subtype": "/Link", "/A": action } } });
    expect(inspectPdfGraph(link({ "/S": "/URI", "/URI": "u:https://example.invalid/cv" })).pages).toBe(1);
    expect(() => inspectPdfGraph(link({ "/S": "/URI", "/URI": "u:file:///etc/passwd" }))).toThrow("UNSUPPORTED_PDF");
    expect(() => inspectPdfGraph(link({ "/S": "/GoTo", "/D": ["3 0 R", "/Fit"], "/Next": {} }))).toThrow("ACTIVE_PDF");
  });
  it.each(["/Text", "/Widget", "/Movie", "/Unknown"]) ("rejects unsupported annotation %s", subtype => { expect(() => inspectPdfGraph(graph({}, { "obj:4 0 R": { value: { "/Type": "/Annot", "/Subtype": subtype } } }))).toThrow(); });
  it("rejects untyped unsupported annotation subtypes and unapproved action locations", () => {
    expect(() => inspectPdfGraph(graph({}, { "obj:4 0 R": { value: { "/Subtype": "/Unknown" } } }))).toThrow("UNSUPPORTED_PDF");
    expect(() => inspectPdfGraph(graph({}, { "obj:4 0 R": { value: { "/Subtype": "/Link", "/PA": { "/S": "/URI", "/URI": "u:file:///etc/passwd" } } } }))).toThrow("UNSUPPORTED_PDF");
  });
  it("rejects dangling refs, repeated pages, false Counts and child-tree cycles", () => {
    for (const pages of [{ "/Kids": ["9 0 R"], "/Count": 1 }, { "/Kids": ["3 0 R", "3 0 R"], "/Count": 2 }, { "/Kids": ["3 0 R"], "/Count": 2 }, { "/Kids": ["2 0 R"], "/Count": 1 }]) {
      expect(() => inspectPdfGraph(graph({}, { "obj:2 0 R": { value: { "/Type": "/Pages", ...pages } } }))).toThrow("UNSUPPORTED_PDF");
    }
  });
  it("checks every selected stream including unreferenced streams", () => {
    const stream = (dict: unknown) => graph({}, { "obj:4 0 R": { stream: { dict } } });
    expect(inspectPdfGraph(stream({ "/Filter": "/FlateDecode" })).streams).toEqual(["4,0"]);
    for (const dict of [{ "/Filter": "/JBIG2Decode" }, { "/Filter": "/Crypt" }, { "/Filter": "/FlateDecode", "/DecodeParms": { "/Unknown": 1 } }, { "/F": "u:external" }]) expect(() => inspectPdfGraph(stream(dict))).toThrow("UNSUPPORTED_PDF");
  });
  it("bounds depth and rejects schema changes", () => {
    let value: unknown = 0; for (let i = 0; i < 66; i++) value = [value];
    expect(() => inspectPdfGraph(graph({}, { "obj:4 0 R": { value } }))).toThrow("PARSER_LIMIT");
    expect(() => inspectPdfGraph({ ...graph(), qpdf: [] })).toThrow("UNSUPPORTED_PDF");
  });
});
