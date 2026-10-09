import { runLocalDiagnosticProcess } from "./parser-process";
import { rasterChildArgs, requireLocalTools } from "./raster-process";
import { strictRecord, type DocumentFormat } from "./reconstruction-types";
import type { SnapshotFile } from "./types";
export interface GeneratedOutputExpectation { format: DocumentFormat; pages: readonly { width: number; height: number; channels: 3 | 4; pagePoints?: { width: number; height: number } }[] }
export interface GeneratedOutputPort { verify(file: SnapshotFile, expected: GeneratedOutputExpectation, signal: AbortSignal): Promise<void> }
export const unavailableGeneratedOutput: GeneratedOutputPort = { async verify() { throw new Error("OUTPUT_UNAVAILABLE"); } };
export function createLocalGeneratedOutputVerifier(popplerPath: string, qpdfPath: string): GeneratedOutputPort {
  requireLocalTools(popplerPath, qpdfPath);
  return { async verify(file, expected, signal) {
    requireLocalTools(popplerPath, qpdfPath);
    try {
      const processResult = await runLocalDiagnosticProcess(process.execPath, rasterChildArgs(), 30_000, 4096, Buffer.from(JSON.stringify({ version: 1, operation: "verify-generated", file, expected, popplerPath, qpdfPath })), signal);
      if (signal.aborted || processResult.failure || processResult.code !== 0) throw new Error();
      const response = strictRecord(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(processResult.output)), ["version", "operation", "verified"]);
      if (response?.version !== 1 || response.operation !== "verify-generated" || response.verified !== true) throw new Error();
    } catch { throw new Error("OUTPUT_INVALID"); }
  } };
}

/** Separate generated-PDF contract: exactly a new page tree, image resources,
 * image-only drawing commands and embedded RGB JPEGs. No original policy bypass.
 * All objects must be reachable through this exact allowlist, including orphans.
 */
export async function verifyGeneratedPdfGraph(value: unknown, expected: GeneratedOutputExpectation, stream: (reference: string, raw: boolean) => Promise<Buffer>, image: (bytes: Buffer, width: number, height: number) => Promise<void>): Promise<void> {
  const fail = (): never => { throw new Error("OUTPUT_INVALID"); };
  const record = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== "object" || Array.isArray(v)) fail(); return v as Record<string, unknown>; };
  const only = (v: Record<string, unknown>, keys: readonly string[]) => { if (Object.keys(v).some(k => !keys.includes(k))) fail(); };
  const envelope = record(value); only(envelope, ["version", "parameters", "qpdf"]);
  if (envelope.version !== 2 || !Array.isArray(envelope.qpdf) || envelope.qpdf.length !== 2) fail();
  const objects = record((envelope.qpdf as unknown[])[1]), visited = new Set<string>();
  const ref = (v: unknown): string => { if (typeof v !== "string" || !/^[1-9]\d* 0 R$/.test(v)) fail(); return v as string; };
  const object = (v: unknown, isStream = false): Record<string, unknown> => {
    const key = `obj:${ref(v)}`; if (visited.has(key)) fail(); visited.add(key);
    const wrapper = record(objects[key]); only(wrapper, [isStream ? "stream" : "value"]);
    if (Object.keys(wrapper).length !== 1) fail();
    if (!isStream) return record(wrapper.value);
    const s = record(wrapper.stream); only(s, ["dict"]); return record(s.dict);
  };
  const trailerWrapper = record(objects.trailer); only(trailerWrapper,["value"]); const trailer = record(trailerWrapper.value); only(trailer, ["/Root", "/Size"]);
  const catalog = object(trailer["/Root"]); only(catalog,["/Type","/Pages"]); if (catalog["/Type"] !== "/Catalog") fail();
  const pagesRef = ref(catalog["/Pages"]), tree = object(pagesRef); only(tree,["/Type","/Kids","/Count"]);
  if (tree["/Type"] !== "/Pages" || tree["/Count"] !== expected.pages.length || !Array.isArray(tree["/Kids"]) || tree["/Kids"].length !== expected.pages.length || !expected.pages.length) fail();
  for (let i = 0; i < expected.pages.length; i++) {
    const recipe = expected.pages[i], page = object((tree["/Kids"] as unknown[])[i]);
    only(page,["/Type","/Parent","/MediaBox","/Resources","/Contents"]);
    if (page["/Type"] !== "/Page" || page["/Parent"] !== pagesRef || !recipe.pagePoints || !Array.isArray(page["/MediaBox"]) || JSON.stringify(page["/MediaBox"]) !== JSON.stringify([0,0,recipe.pagePoints.width,recipe.pagePoints.height])) fail();
    const points = recipe.pagePoints!;
    const resources = record(page["/Resources"]); only(resources,["/XObject","/Font","/ExtGState"]);
    for (const key of ["/Font","/ExtGState"]) if (resources[key] !== undefined && Object.keys(record(resources[key])).length) fail();
    const images = record(resources["/XObject"]); if (Object.keys(images).length !== 1) fail();
    const imageName = Object.keys(images)[0]; if (!/^\/Image-[0-9]+$/.test(imageName)) fail();
    const imageRef = ref(images[imageName]), embedded = object(imageRef,true);
    only(embedded,["/Type","/Subtype","/BitsPerComponent","/Width","/Height","/ColorSpace","/Filter","/Length"]);
    if (embedded["/Type"] !== "/XObject" || embedded["/Subtype"] !== "/Image" || embedded["/BitsPerComponent"] !== 8 || embedded["/Width"] !== recipe.width || embedded["/Height"] !== recipe.height || embedded["/ColorSpace"] !== "/DeviceRGB" || embedded["/Filter"] !== "/DCTDecode" || recipe.channels !== 3) fail();
    await image(await stream(imageRef,true),recipe.width,recipe.height);
    const contents = page["/Contents"]; if (!Array.isArray(contents) || contents.length !== 1) fail();
    const contentRef = ref((contents as unknown[])[0]), contentDict = object(contentRef,true); only(contentDict,["/Length","/Filter"]); if (contentDict["/Filter"] !== "/FlateDecode") fail();
    const commands = (await stream(contentRef,false)).toString("ascii").trim().split(/\s+/);
    const wanted = ["q", "1","0","0","1","0","0","cm", "1","0","0","1","0","0","cm", String(points.width),"0","0",String(points.height),"0","0","cm", "1","0","0","1","0","0","cm", imageName,"Do","Q"];
    if (commands.length !== wanted.length || commands.some((token,j) => Number.isFinite(Number(wanted[j])) ? !Number.isFinite(Number(token)) || Math.abs(Number(token)-Number(wanted[j])) > 0.000001 : token !== wanted[j])) fail();
  }
  if (Object.keys(objects).some(key => key !== "trailer" && !visited.has(key))) fail();
}
