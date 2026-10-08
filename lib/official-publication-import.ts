import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { getCurrentWeekRange } from "./editorial-schedule";
import { parseFlyerPackages, selectWeeklyNlFlyer } from "./flyer-packages";
import { validateCatalog, type HandzettelCache } from "./handzettel-catalog";
import { parseWeeklyPublication, verifyWeeklyEdition } from "./weekly-publication";
import type { LocalAsset, PublishedOffer, WeeklyEdition, WeeklyPublication } from "./weekly-publication-types";
import { buildPublicOfferMetadata, type ReviewedWeeklyOffer, type WeeklyOfferPublicSource } from "./weekly-offer-metadata";

const MAX_BYTES = 50 * 1024 * 1024;
const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const inside = (root: string, file: string) => { const relative = path.relative(root, file); return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };

/** Editorial reads cannot escape the worktree, including through symlinks. */
async function localBytes(root: string, relative: string): Promise<Buffer> {
  if (path.isAbsolute(relative)) throw new Error("Expected an editorial relative path");
  const canonical = await realpath(root), file = await realpath(path.resolve(root, relative));
  if (!inside(canonical, file)) throw new Error("Editorial path escapes root");
  const info = await stat(file);
  if (!info.isFile() || info.size > MAX_BYTES) throw new Error("Invalid or oversized original");
  const bytes = await readFile(file);
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error("Invalid or oversized original");
  return bytes;
}
async function directory(root: string, relative: string) {
  const target = path.resolve(root, relative);
  if (!inside(path.resolve(root), target)) throw new Error("Output path escapes root");
  await mkdir(target, { recursive: true });
  if (!inside(await realpath(root), await realpath(target))) throw new Error("Output symlink escapes root");
  return target;
}
async function atomicBytes(file: string, bytes: string | Uint8Array) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try { await writeFile(temp, bytes, { flag: "wx" }); await rename(temp, file); }
  finally { await unlink(temp).catch(() => {}); }
}
async function immutableAsset(root: string, asset: LocalAsset, bytes: Buffer) {
  if (hash(bytes) !== asset.sha256 || bytes.length !== asset.bytes) throw new Error("Original checksum mismatch");
  const parent = await directory(root, path.dirname(`public${asset.path}`));
  const file = path.join(parent, path.basename(asset.path));
  try { await writeFile(file, bytes, { flag: "wx" }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if (!(await localBytes(root, `public${asset.path}`)).equals(bytes)) throw new Error("Cannot overwrite a published path with different bytes");
  }
  if (!(await localBytes(root, `public${asset.path}`)).equals(bytes)) throw new Error("Published original changed during assembly");
}
async function decodedImage(bytes: Buffer) {
  const image = sharp(bytes, { limitInputPixels: 50_000_000 });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format ?? "")) throw new Error("Invalid original cover");
  await image.resize(1, 1).raw().toBuffer();
  return metadata;
}

async function download(url: string, type: string, fetchImpl: typeof fetch): Promise<Buffer> {
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); void reader?.cancel().catch(() => {}); reject(new Error("Official original download timed out")); }, 20_000); });
  const work = async () => {
    const response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: controller.signal });
    // Redirects are rejected altogether; no unvalidated destination is contacted.
    if (!response.ok || response.redirected || (response.url && response.url !== url)) throw new Error("Unexpected official original response or redirect");
    if (response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== type) throw new Error("Invalid official original content type");
    const lengthHeader = response.headers.get("content-length");
    const expectedLength = lengthHeader === null ? undefined : Number(lengthHeader);
    if (expectedLength !== undefined && (!/^\d+$/.test(lengthHeader!) || !Number.isSafeInteger(expectedLength) || expectedLength < 1 || expectedLength > MAX_BYTES)) throw new Error("Invalid or oversized original content length");
    if (!response.body) throw new Error("Missing original stream");
    reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_BYTES) throw new Error("Official original exceeds 50 MiB");
        chunks.push(chunk.value);
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    if (!size || (expectedLength !== undefined && size !== expectedLength)) throw new Error("Truncated original stream");
    return Buffer.concat(chunks, size);
  };
  try { return await Promise.race([work(), timeout]); }
  finally { clearTimeout(timer); controller.abort(); }
}

export async function importOfficialPublication(catalog: HandzettelCache, options: { root: string; fetchImpl?: typeof fetch }): Promise<{ pdf: LocalAsset; cover: LocalAsset; stagingDirectory: string }> {
  validateCatalog(catalog, getCurrentWeekRange(new Date(`${catalog.validFrom}T12:00:00Z`)));
  const fetchImpl = options.fetchImpl ?? fetch;
  const pdfBytes = await download(catalog.pdfUrl, "application/pdf", fetchImpl);
  if (pdfBytes.subarray(0, 5).toString() !== "%PDF-" || !/%%EOF\s*$/.test(pdfBytes.subarray(-1024).toString("latin1")) || (await PDFDocument.load(pdfBytes)).getPageCount() !== catalog.pageCount) throw new Error("Original PDF completeness or page count mismatch");
  const coverBytes = await download(catalog.pages[0].imageUrl, "image/jpeg", fetchImpl);
  if ((await decodedImage(coverBytes)).format !== "jpeg") throw new Error("Original cover must be JPEG");
  const pdf = { path: `/handzettel/${catalog.year}/de-${catalog.validFrom}-${hash(pdfBytes)}.pdf`, sha256: hash(pdfBytes), bytes: pdfBytes.length };
  const cover = { path: `/images/content/de-${catalog.validFrom}-${hash(coverBytes)}.jpg`, sha256: hash(coverBytes), bytes: coverBytes.length };
  const stagingDirectory = await directory(options.root, `.superpowers/weekly-preparation/${catalog.validFrom}/${randomUUID()}`);
  try {
    await writeFile(path.join(stagingDirectory, "original.pdf"), pdfBytes, { flag: "wx" });
    await writeFile(path.join(stagingDirectory, "cover.jpg"), coverBytes, { flag: "wx" });
    await writeFile(path.join(stagingDirectory, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, { flag: "wx" });
    await writeFile(path.join(stagingDirectory, "import.json"), `${JSON.stringify({ pdf, cover }, null, 2)}\n`, { flag: "wx" });
  } catch (error) { await rm(stagingDirectory, { recursive: true, force: true }); throw error; }
  return { pdf, cover, stagingDirectory };
}

type LayoutSource = WeeklyOfferPublicSource & { privatePdf: string; privateCover?: string; printedValidFrom: string; printedValidTo: string; coverSha256: string; pageCount: number; title?: string; pages: { page: number; expectedOffers: number; offers: ReviewedWeeklyOffer[] }[] };

export class WeeklyPreparationError extends Error {
  constructor(readonly publication: WeeklyPublication, readonly issues: readonly { language: "de" | "nl"; message: string }[], readonly bound: boolean) {
    super("Weekly publication preparation is incomplete");
    this.name = "WeeklyPreparationError";
  }
}

/** Bind only a complete, reviewed local offer set. Missing languages produce an explicit partial package. */
export async function assembleWeeklyPublication(week: string, root: string): Promise<WeeklyPublication> {
  parseWeeklyPublication({ schemaVersion: 1, week, editions: [] });
  try { await stat(path.join(root, "data/editorial/.weekly-offers.lock")); throw new Error("Interrupted offer preparation blocks assembly"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const layout = JSON.parse((await localBytes(root, "data/weekly-offer-layout.json")).toString()) as { sources: LayoutSource[] };
  if (!Array.isArray(layout.sources)) throw new Error("Missing reviewed layout");
  const sources = layout.sources.filter(source => source.validFrom === week);
  if (!sources.length || sources.some(source => !["de", "nl"].includes(source.language)) || new Set(sources.map(source => source.language)).size !== sources.length) throw new Error("Missing or duplicate reviewed language");
  const rows = JSON.parse((await localBytes(root, "data/weekly-offers.json")).toString()) as PublishedOffer[];
  if (!Array.isArray(rows)) throw new Error("Invalid public offer rows");
  const manifestFile = `data/editorial/weekly-publications/${week}.json`;
  let previous: WeeklyPublication | undefined;
  try { previous = parseWeeklyPublication(JSON.parse((await localBytes(root, manifestFile)).toString())); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const editions: WeeklyEdition[] = [];
  const issues: { language: "de" | "nl"; message: string }[] = [];
  const assets: { asset: LocalAsset; bytes: Buffer }[] = [];
  const candidate = await directory(root, `.superpowers/weekly-preparation/${week}/assembly-${randomUUID()}`);
  let catalogBytes: Buffer | undefined;
  try {
    for (const file of ["data/weekly-offer-layout.json", "data/weekly-offers.json", "data/editorial/flyers.json"]) await atomicBytes(path.join(candidate, file), await localBytes(root, file));
    const flyerRows: unknown = JSON.parse((await localBytes(root, "data/editorial/flyers.json")).toString());
    if (!Array.isArray(flyerRows)) throw new Error("Invalid flyer provenance list");
    for (const source of sources) {
      try {
      const sourceAssets: { asset: LocalAsset; bytes: Buffer }[] = [];
      let candidateCatalogBytes: Buffer | undefined;
      if (source.printedValidFrom !== source.validFrom || source.printedValidTo !== source.validTo || !/^[a-f0-9]{64}$/.test(source.coverSha256)) throw new Error("Missing original/date/cover review");
      const pdfBytes = await localBytes(root, source.privatePdf);
      if (hash(pdfBytes) !== source.pdfSha256) throw new Error("Reviewed PDF changed");
      let coverPath: string, coverFile: string, editionSource: WeeklyEdition["source"];
      if (source.language === "nl") {
        const flyers = parseFlyerPackages(flyerRows.filter(row => row && typeof row === "object" && row.language === "nl" && (row.id === source.flyerId || (row.validFrom <= source.validTo && row.validTo >= week))));
        const flyer = selectWeeklyNlFlyer(flyers, getCurrentWeekRange(new Date(`${week}T12:00:00Z`)));
        if (!flyer || flyer.id !== source.flyerId) throw new Error("Missing or duplicate NL original");
        coverPath = flyer.coverPath; coverFile = `public${coverPath}`;
        editionSource = { kind: "canva", flyerId: flyer.id };
      } else {
        let imported: { pdf: LocalAsset; cover: LocalAsset } | undefined;
        const importedFile = path.join(path.dirname(source.privatePdf), "import.json");
        if (source.privatePdf.startsWith(`.superpowers/weekly-preparation/${week}/`)) imported = JSON.parse((await localBytes(root, importedFile)).toString());
        const existing = previous?.editions.find(edition => edition.language === "de" && edition.pdf.sha256 === source.pdfSha256);
        coverPath = imported?.cover.path ?? existing?.cover.path ?? `/images/content/de-${week}-${source.coverSha256}${source.privateCover ? path.extname(source.privateCover) : ".jpg"}`;
        coverFile = source.privateCover ?? (imported ? path.join(path.dirname(source.privatePdf), "cover.jpg") : `public${coverPath}`);
        const file = `data/editorial/official-catalogs/${week}.json`;
        candidateCatalogBytes = await localBytes(root, imported ? path.join(path.dirname(source.privatePdf), "catalog.json") : file);
        const catalog: unknown = JSON.parse(candidateCatalogBytes.toString()); validateCatalog(catalog, getCurrentWeekRange(new Date(`${week}T12:00:00Z`)));
        // Existing identical metadata retains its original fetchedAt and exact hash.
        try {
          const bound = await localBytes(root, file); const old = JSON.parse(bound.toString());
          if (isDeepStrictEqual({ ...old, fetchedAt: null }, { ...catalog, fetchedAt: null })) candidateCatalogBytes = bound;
        } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
        await atomicBytes(path.join(candidate, file), candidateCatalogBytes);
        editionSource = { kind: "trinkgut-official", catalogId: catalog.catalogId, catalogVersion: catalog.catalogVersion, metadataSha256: hash(candidateCatalogBytes) };
        if (imported && (imported.pdf.path !== source.publishedPdfPath || imported.pdf.sha256 !== source.pdfSha256 || imported.cover.sha256 !== source.coverSha256)) throw new Error("Imported original review mismatch");
      }
      const coverBytes = await localBytes(root, coverFile);
      if (hash(coverBytes) !== source.coverSha256) throw new Error("Reviewed cover mismatch");
      await decodedImage(coverBytes);
      const offers = rows.filter(row => row.flyerId === source.flyerId).toSorted((a,b) => a.id.localeCompare(b.id));
      const canonicalOffers = offers.map(row => {
        const page = source.pages.find(page => page.offers.some(offer => offer.id === row.id));
        const offer = page?.offers.find(offer => offer.id === row.id);
        if (!page || !offer) throw new Error("Unexpected public offer outside reviewed layout");
        const imagePath = offer.imagePath ?? `/images/offers/${offer.id}-${row.imageSha256}.webp`;
        return { ...buildPublicOfferMetadata(source, page.page, offer, imagePath), imageSha256: row.imageSha256 };
      });
      const edition: WeeklyEdition = { id: source.flyerId, language: source.language as "de" | "nl", title: source.title ?? "Angebote der Woche", validFrom: source.validFrom, validTo: source.validTo, source: editionSource,
        pdf: { path: source.publishedPdfPath, sha256: source.pdfSha256, bytes: pdfBytes.length }, cover: { path: coverPath, sha256: source.coverSha256, bytes: coverBytes.length }, pageCount: source.pageCount,
        review: { reviewedAt: source.reviewedAt, printedValidFrom: source.printedValidFrom, printedValidTo: source.printedValidTo, pageOfferCounts: source.pages.map(page => page.expectedOffers) }, offerIds: offers.map(offer => offer.id), offersSha256: hash(JSON.stringify(canonicalOffers)) };
      for (const asset of [edition.pdf, edition.cover]) {
        const boundAsset = previous?.editions.flatMap(edition => [edition.pdf, edition.cover]).find(bound => bound.path === asset.path);
        if (boundAsset && (boundAsset.sha256 !== asset.sha256 || boundAsset.bytes !== asset.bytes)) throw new Error("Changed original requires a new unique published path");
      }
      for (const [asset, bytes] of [[edition.pdf, pdfBytes], [edition.cover, coverBytes]] as const) { await immutableAsset(candidate, asset, bytes); sourceAssets.push({ asset, bytes }); }
      for (const offer of offers) {
        const bytes = await localBytes(root, `public${offer.image}`);
        await immutableAsset(candidate, { path: offer.image, sha256: offer.imageSha256, bytes: bytes.length }, bytes);
      }
      await verifyWeeklyEdition(edition, candidate); editions.push(edition); assets.push(...sourceAssets);
      if (candidateCatalogBytes) catalogBytes = candidateCatalogBytes;
      } catch (error) {
        issues.push({ language: source.language as "de" | "nl", message: error instanceof Error ? error.message : "Original validation failed" });
      }
    }
    const publication = parseWeeklyPublication({ schemaVersion: 1, week, editions });
    if (issues.length && (previous || !editions.length)) throw new WeeklyPreparationError(publication, issues, false);
    // No catalog or manifest binding is replaced before all candidate validation succeeds.
    for (const { asset, bytes } of assets) {
      try { const existing = await localBytes(root, `public${asset.path}`); if (!existing.equals(bytes)) throw new Error("Cannot overwrite a published path with different bytes"); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    for (const { asset, bytes } of assets) await immutableAsset(root, asset, bytes);
    if (catalogBytes) { await directory(root, "data/editorial/official-catalogs"); await atomicBytes(path.join(root, `data/editorial/official-catalogs/${week}.json`), catalogBytes); }
    // Verify again against actual copied bytes immediately before the atomic binding.
    for (const edition of editions) await verifyWeeklyEdition(edition, root);
    await directory(root, "data/editorial/weekly-publications");
    if (!previous || JSON.stringify(previous) !== JSON.stringify(publication)) await atomicBytes(path.join(root, manifestFile), `${JSON.stringify(publication, null, 2)}\n`);
    if (issues.length) throw new WeeklyPreparationError(publication, issues, true);
    return publication;
  } finally { await rm(candidate, { recursive: true, force: true }); }
}
