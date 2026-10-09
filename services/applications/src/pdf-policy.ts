import type { ValidationFailure } from "./types";
export interface PdfPolicyResult { pages: number; streams: string[] }
export class PdfPolicyError extends Error { constructor(readonly reason: ValidationFailure) { super(reason); } }
export const PDF_LIMITS = { objects: 20_000, values: 200_000, depth: 64, pages: 50, jsonBytes: 16 * 1024 * 1024, diagnostics: 64 * 1024, streamBytes: 64 * 1024 * 1024, decodedBytes: 128 * 1024 * 1024, filters: 4 } as const;
type Dict = Record<string, unknown>;
const activeKeys = new Set(["/JS", "/JavaScript", "/OpenAction", "/AA", "/EmbeddedFiles", "/EF", "/AF", "/XFA", "/AcroForm", "/RichMediaContent", "/RichMediaSettings", "/3DD", "/3DA", "/PresSteps", "/Collection"]);
const activeNames = new Set(["/JavaScript", "/Launch", "/EmbeddedFile", "/Filespec", "/FileAttachment", "/Widget", "/Movie", "/Sound", "/Screen", "/RichMedia", "/3D", "/GoToR", "/GoToE", "/SubmitForm", "/ImportData", "/Rendition"]);
function fail(reason: ValidationFailure = "UNSUPPORTED_PDF"): never { throw new PdfPolicyError(reason); }
function dict(value: unknown): Dict { if (!value || typeof value !== "object" || Array.isArray(value)) fail(); return value as Dict; }
function name(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value.startsWith("/")) return value;
  if (!value.startsWith("n:/")) return undefined;
  if (/#(?![a-fA-F0-9]{2})/.test(value)) fail();
  return value.slice(2).replace(/#([a-fA-F0-9]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}
function reference(value: unknown): boolean { return typeof value === "string" && /^[1-9]\d{0,9} (?:0|[1-9]\d{0,4}) R$/.test(value); }
function normalized(value: unknown): Dict {
  const out: Dict = Object.create(null);
  for (const [key, item] of Object.entries(dict(value))) { const canonical = name(key); if (!canonical || Object.hasOwn(out, canonical)) fail(); out[canonical] = item; }
  return out;
}
export function inspectPdfGraph(input: unknown): PdfPolicyResult {
  const envelope = dict(input);
  if (Object.keys(envelope).some(k => !["version", "parameters", "qpdf"].includes(k)) || envelope.version !== 2) fail();
  const parameters = dict(envelope.parameters);
  if (Object.keys(parameters).length !== 1 || parameters.decodelevel !== "generalized") fail();
  if (!Array.isArray(envelope.qpdf) || envelope.qpdf.length !== 2) fail();
  const header = dict(envelope.qpdf[0]);
  if (header.jsonversion !== 2 || !/^(1\.[0-7]|2\.0)$/.test(String(header.pdfversion)) || header.calledgetallpages !== false || header.pushedinheritedpageresources !== false || !Number.isSafeInteger(header.maxobjectid) || Number(header.maxobjectid) < 1 || Number(header.maxobjectid) > 2147483647) fail();
  if (Object.keys(header).some(k => !["jsonversion", "pdfversion", "calledgetallpages", "pushedinheritedpageresources", "maxobjectid"].includes(k))) fail();
  const entries = Object.entries(dict(envelope.qpdf[1]));
  if (entries.length > PDF_LIMITS.objects + 1) fail("PARSER_LIMIT");
  const objects = new Map<string, unknown>(), streamObjects = new Map<string, Dict>();
  let trailer: Dict | undefined;
  for (const [key, raw] of entries) {
    const wrapper = dict(raw);
    if (Object.keys(wrapper).length !== 1) fail();
    if (key !== "trailer" && (!key.startsWith("obj:") || !reference(key.slice(4)) || Number(key.slice(4).split(" ")[0]) > Number(header.maxobjectid))) fail();
    let value: unknown;
    if (Object.hasOwn(wrapper, "value")) value = wrapper.value;
    else if (Object.hasOwn(wrapper, "stream")) {
      const stream = dict(wrapper.stream); if (Object.keys(stream).length !== 1 || !Object.hasOwn(stream, "dict") || key === "trailer") fail();
      value = stream.dict; streamObjects.set(key.slice(4), normalized(value));
    } else fail();
    if (key === "trailer") trailer = normalized(value); else objects.set(key.slice(4), value);
  }
  if (!trailer) fail();
  if (Object.hasOwn(trailer, "/Encrypt")) fail("ENCRYPTED_PDF");
  const resolve = (value: unknown): unknown => {
    const seen = new Set<string>();
    while (typeof value === "string" && reference(value)) { if (seen.has(value) || !objects.has(value) || seen.size >= PDF_LIMITS.depth) fail(); seen.add(value); value = objects.get(value); }
    return value;
  };
  const getDict = (value: unknown) => normalized(resolve(value));
  const action = (value: unknown): void => {
    const a = getDict(value);
    if (Object.hasOwn(a, "/Next")) fail("ACTIVE_PDF");
    const kind = name(resolve(a["/S"]));
    if (kind === "/URI") {
      if (Object.keys(a).some(k => !["/Type", "/S", "/URI", "/IsMap"].includes(k))) fail();
      const uri = resolve(a["/URI"]);
      if (typeof uri !== "string" || !uri.startsWith("u:") || /[\u0000-\u0020\u007f]/.test(uri.slice(2))) fail();
      let parsed: URL; try { parsed = new URL(uri.slice(2)); } catch { fail(); }
      if (!["https:", "http:", "mailto:"].includes(parsed.protocol) || parsed.username || parsed.password) fail();
    } else if (kind === "/GoTo") {
      if (Object.keys(a).some(k => !["/Type", "/S", "/D"].includes(k)) || a["/D"] === undefined) fail();
      const destination = resolve(a["/D"]);
      if (!Array.isArray(destination) && !(typeof destination === "string" && (destination.startsWith("u:") || name(destination)))) fail();
    } else fail(kind && activeNames.has(kind) ? "ACTIVE_PDF" : "UNSUPPORTED_PDF");
  };
  const annotation = (value: unknown): void => { const a = getDict(value); if (name(resolve(a["/Subtype"])) !== "/Link") fail(); if (a["/A"] !== undefined) action(a["/A"]); };
  const stack = [...objects.values(), trailer].map(value => ({ value, depth: 0 })); let visited = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (++visited > PDF_LIMITS.values || depth > PDF_LIMITS.depth) fail("PARSER_LIMIT");
    if (value === null || typeof value === "boolean") continue;
    if (typeof value === "number") { if (!Number.isFinite(value) || Math.abs(value) > 2147483647) fail(); continue; }
    if (typeof value === "string") {
      const canonical = name(value);
      if (canonical) { if (activeNames.has(canonical)) fail("ACTIVE_PDF"); }
      else if (reference(value)) { if (!objects.has(value)) fail(); }
      else if (!value.startsWith("u:") && !/^b:(?:[a-fA-F0-9]{2})*$/.test(value)) fail();
      continue;
    }
    if (Array.isArray(value)) { for (const child of value) stack.push({ value: child, depth: depth + 1 }); continue; }
    const d = normalized(value), type = name(resolve(d["/Type"])), subtype = name(resolve(d["/Subtype"]));
    for (const key of Object.keys(d)) if (activeKeys.has(key)) fail("ACTIVE_PDF");
    if (["/Extensions", "/Requirements", "/NeedsRendering", "/PA"].some(k => Object.hasOwn(d, k))) fail();
    if (subtype && !["/Link", "/Image", "/Form", "/Type0", "/Type1", "/MMType1", "/TrueType", "/Type3", "/CIDFontType0", "/CIDFontType2", "/Type1C", "/CIDFontType0C", "/OpenType", "/XML"].includes(subtype)) fail();
    if (type === "/Action") action(d);
    if (type === "/Annot") annotation(d);
    if (d["/Annots"] !== undefined) { const annots = resolve(d["/Annots"]); if (!Array.isArray(annots)) fail(); annots.forEach(annotation); }
    if (d["/A"] !== undefined) {
      const isLink = subtype === "/Link", isOutline = d["/Title"] !== undefined && d["/Parent"] !== undefined;
      if (!isLink && !isOutline) fail(); action(d["/A"]);
    }
    for (const child of Object.values(d)) stack.push({ value: child, depth: depth + 1 });
  }
  const streams: string[] = [];
  for (const [ref, d] of streamObjects) {
    if (["/F", "/FFilter", "/FDecodeParms"].some(k => Object.hasOwn(d, k))) fail();
    const filterValue = resolve(d["/Filter"]), filters = filterValue === undefined ? [] : Array.isArray(filterValue) ? filterValue : [filterValue];
    if (filters.length > PDF_LIMITS.filters) fail("PARSER_LIMIT");
    const parmsValue = resolve(d["/DecodeParms"]), parms = parmsValue === undefined || parmsValue === null ? filters.map(() => null) : Array.isArray(parmsValue) ? parmsValue : [parmsValue];
    if (parms.length !== filters.length) fail();
    filters.forEach((filter, i) => {
      const f = name(resolve(filter));
      if (!f || !["/FlateDecode", "/LZWDecode", "/ASCIIHexDecode", "/ASCII85Decode", "/RunLengthDecode", "/DCTDecode"].includes(f)) fail();
      if (resolve(parms[i]) !== null) {
        const p = getDict(parms[i]);
        // Tested Flate variants: no prediction, or QPDF's PNG-Up xref encoding.
        // Other codec/predictor variants remain outside this initial profile.
        const predictor = resolve(p["/Predictor"]), columns = resolve(p["/Columns"]);
        const plain = f === "/FlateDecode" && Object.keys(p).every(k => k === "/Predictor") && (predictor === undefined || predictor === 1);
        const xrefUp = f === "/FlateDecode" && name(d["/Type"]) === "/XRef" && predictor === 12 && Number.isInteger(columns) && Number(columns) >= 1 && Number(columns) <= 65536 && Object.keys(p).every(k => ["/Predictor", "/Columns"].includes(k));
        if (!plain && !xrefUp) fail();
      }
    });
    streams.push(ref.split(" ").slice(0, 2).join(","));
  }
  const catalog = getDict(trailer["/Root"]);
  if (name(resolve(catalog["/Type"])) !== "/Catalog" || !reference(catalog["/Pages"])) fail();
  const tree: { ref: string; parent?: string; exit: boolean; depth: number }[] = [{ ref: catalog["/Pages"] as string, exit: false, depth: 0 }];
  const seen = new Set<string>(), counts = new Map<string, number>(); let pages = 0;
  while (tree.length) {
    const frame = tree.pop()!, node = getDict(frame.ref), type = name(resolve(node["/Type"]));
    if (frame.exit) {
      const kids = resolve(node["/Kids"]) as string[], count = kids.reduce((sum, kid) => sum + (counts.get(kid) ?? 0), 0);
      if (!Number.isInteger(node["/Count"]) || node["/Count"] !== count) fail(); counts.set(frame.ref, count); continue;
    }
    if (seen.has(frame.ref) || frame.depth > PDF_LIMITS.depth || (frame.parent ? node["/Parent"] !== frame.parent : node["/Parent"] !== undefined)) fail();
    seen.add(frame.ref);
    if (type === "/Page") { if (++pages > PDF_LIMITS.pages) fail("PAGE_LIMIT"); counts.set(frame.ref, 1); }
    else if (type === "/Pages") {
      const kids = resolve(node["/Kids"]); if (!Array.isArray(kids) || !kids.length || kids.some(k => !reference(k))) fail();
      tree.push({ ...frame, exit: true }); for (const kid of kids) tree.push({ ref: kid as string, parent: frame.ref, exit: false, depth: frame.depth + 1 });
    } else fail();
  }
  if (!pages) fail();
  return { pages, streams };
}
