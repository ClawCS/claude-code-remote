import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

export const sha256 = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");

/** Real, synthetic assets only. No production data or network dependencies. */
export async function weeklyPublicationFixture(week = "2026-10-05", validTo = "2026-10-10", catalogId = "1390117", catalogVersion = "1") {
  const root = await mkdtemp(path.join(tmpdir(), "weekly-publication-"));
  const write = async (file: string, bytes: string | Uint8Array) => {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), bytes);
  };
  const image = await sharp({ create: { width: 8, height: 6, channels: 3, background: "red" } }).webp({ lossless: true }).toBuffer();
  const crop = await sharp(image).extract({ left: 1, top: 1, width: 4, height: 3 }).webp({ lossless: true }).toBuffer();
  const pdfs = await Promise.all([2, 1].map(async count => {
    const doc = await PDFDocument.create();
    for (let index = 0; index < count; index++) doc.addPage([100, 100]);
    return Buffer.from(await doc.save());
  }));
  const identityDate = new Date(`${week}T12:00:00Z`);
  identityDate.setUTCDate(identityDate.getUTCDate() + 4 - (identityDate.getUTCDay() || 7));
  const year = identityDate.getUTCFullYear();
  const kw = Math.ceil(((identityDate.valueOf() - Date.UTC(year, 0, 1, 12)) / 86400000 + 1) / 7);
  const officialUrl = `https://werbung.trinkgut.de/frontend/catalogs/${catalogId}/${catalogVersion}/pdf/complete.pdf`;
  const catalog = {
    catalogId, catalogVersion, storeId: "13027", werbekreis: "3.6", kw, year,
    validFrom: week, validTo, fetchedAt: `${week}T12:00:00.000Z`,
    viewerUrl: "https://werbung.trinkgut.de/frontend/mvc/catalog/by-name/13027/newest",
    pdfUrl: officialUrl, pageCount: 2,
    pages: [1, 2].map(number => ({ number,
      imageUrl: `https://werbung.trinkgut.de/frontend/mvc/api/catalogs/${catalogId}/v${catalogVersion}/normal/bk_${number}.jpg`,
      thumbnailUrl: `https://werbung.trinkgut.de/frontend/mvc/api/catalogs/${catalogId}/v${catalogVersion}/thumbnails/bk_${number}.jpg`,
    })), status: "ok",
  };
  const metadata = JSON.stringify(catalog);
  await write(`data/editorial/official-catalogs/${week}.json`, metadata);
  const sources = ["de", "nl"].map((language, index) => {
    const flyerId = `${language}-${week}`;
    const publishedPdfPath = `/handzettel/${week}/${language}.pdf`;
    return {
      language, flyerId, sourceUrl: language === "de" ? officialUrl : "https://www.canva.com/design/SYNTHETIC/view",
      privatePdf: `public${publishedPdfPath}`, publishedPdfPath, pdfSha256: sha256(pdfs[index]),
      validFrom: week, validTo, reviewedAt: `${week}T12:00:00Z`, rightsStatus: "approved",
      pageCount: index === 0 ? 2 : 1,
      pages: Array.from({ length: index === 0 ? 2 : 1 }, (_, pageIndex) => ({
        page: pageIndex + 1, sourceImage: `public/images/content/${week}/${language}.webp`, expectedOffers: 1,
        offers: [{ id: `${flyerId}-p${pageIndex + 1}`, name: "Synthetic original offer", categorySlug: "alkoholfrei",
          rect: [1, 1, 4, 3], sourceDimensions: [8, 6], conditions: "Printed condition unchanged" }],
      })),
    };
  });
  const offers = sources.flatMap(source => source.pages.flatMap(page => page.offers.map(offer => ({
    id: offer.id, name: offer.name, categorySlug: offer.categorySlug,
    language: source.language, flyerId: source.flyerId, validFrom: week, validTo,
    image: `/images/offers/${offer.id}.webp`, sourcePage: page.page,
    rect: offer.rect, sourceDimensions: offer.sourceDimensions,
    pdfSha256: source.pdfSha256, sourceUrl: source.publishedPdfPath,
    rightsStatus: "approved", reviewedAt: source.reviewedAt, conditions: offer.conditions, imageSha256: sha256(crop),
  }))));
  const editions = sources.map((source, index) => ({
    id: source.flyerId, language: source.language as "de" | "nl", title: "Synthetic weekly original",
    validFrom: week, validTo,
    source: index === 0
      ? { kind: "trinkgut-official" as const, catalogId, catalogVersion, metadataSha256: sha256(metadata) }
      : { kind: "canva" as const, flyerId: source.flyerId },
    pdf: { path: source.publishedPdfPath, sha256: source.pdfSha256, bytes: pdfs[index].length },
    cover: { path: `/images/content/${week}/${source.language}.webp`, sha256: sha256(image), bytes: image.length },
    pageCount: source.pageCount,
    review: { reviewedAt: source.reviewedAt, printedValidFrom: week, printedValidTo: validTo,
      pageOfferCounts: source.pages.map(page => page.expectedOffers) },
    offerIds: offers.filter(offer => offer.language === source.language).map(offer => offer.id),
    offersSha256: sha256(JSON.stringify(offers.filter(offer => offer.language === source.language).sort((a, b) => a.id.localeCompare(b.id)))),
  }));
  const flyer = {
    id: sources[1].flyerId, language: "nl", title: "Synthetic original", validFrom: week, validTo,
    sourceUrl: sources[1].sourceUrl, designId: "SYNTHETIC", pageNumbers: [14], rightsStatus: "approved",
    exportedAt: sources[1].reviewedAt, pdfPath: editions[1].pdf.path, coverPath: editions[1].cover.path,
    pdfSha256: editions[1].pdf.sha256, coverSha256: editions[1].cover.sha256,
  };
  const publication = { schemaVersion: 1 as const, week, editions };
  const save = async () => {
    await write(`data/editorial/weekly-publications/${week}.json`, JSON.stringify(publication));
    await write("data/editorial/flyers.json", JSON.stringify([flyer]));
    await write("data/weekly-offer-layout.json", JSON.stringify({ schemaVersion: 1, week, sources }));
    await write("data/weekly-offers.json", JSON.stringify(offers));
  };
  for (const [index, edition] of editions.entries()) {
    await write(`public${edition.pdf.path}`, pdfs[index]);
    await write(`public${edition.cover.path}`, image);
  }
  for (const offer of offers) await write(`public${offer.image}`, crop);
  await save();
  return { root, write, save, publication, editions, offers, sources, flyer, catalog, image, crop, pdfs };
}
