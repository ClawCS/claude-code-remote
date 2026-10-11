import { rm, unlink, symlink } from "node:fs/promises";
import * as fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { loadSupplementalPublications, parseSupplementalPublication, selectSupplementalEditions } from "@/lib/supplemental-publication";
import { loadWeeklyPublications, selectPublishedEditions } from "@/lib/weekly-publication";
import { verifyPublicationEdition } from "@/lib/publication-integrity";
import { supplementalPublicationFixture } from "./fixtures/supplemental-publication";
import { sha256 } from "./fixtures/weekly-publication";

// Preserve real I/O while allowing a deterministic pause at a dependency boundary.
vi.mock("node:fs/promises", async importOriginal => ({ ...await importOriginal<typeof import("node:fs/promises")>() }));

const roots: string[] = [];
async function fixture(...args: Parameters<typeof supplementalPublicationFixture>) {
  const f = await supplementalPublicationFixture(...args); roots.push(f.root); return f;
}
afterEach(async () => { vi.restoreAllMocks(); vi.unstubAllEnvs(); await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe("independently bound supplemental originals", () => {
  it.each([["2026-10-07", "2026-10-18"], ["2026-10-28", "2026-11-08"], ["2026-12-30", "2027-01-10"]])(
    "accepts a printed non-Monday multiweek span %s to Sunday %s", async (from, to) => {
      const f = await fixture(from, to);
      expect(parseSupplementalPublication(f.supplemental).edition.validTo).toBe(to);
      const loaded = await loadSupplementalPublications(f.root);
      expect(loaded.issues).toEqual([]);
      expect(selectSupplementalEditions(loaded, new Date(`${to}T12:00:00Z`)).map(row => row.edition.id)).toEqual(["maasduinen-synthetic"]);
    });
  it("keeps weekly and supplemental NL streams with the same start date independently verified", async () => {
    const f = await fixture("2026-10-05", "2026-10-18");
    expect((await loadWeeklyPublications(f.root)).editions).toHaveLength(2);
    const loaded = await loadSupplementalPublications(f.root);
    expect(loaded.issues).toEqual([]);
    expect(loaded.editions[0].offers.map(row => row.id)).toEqual(["maasduinen-synthetic-p1"]);
  });
  it("retains a longer supplement when the next Monday's weekly manifest is absent", async () => {
    const f = await fixture();
    const now = new Date("2026-10-12T12:00:00Z");
    expect(selectPublishedEditions(await loadWeeklyPublications(f.root), now)).toEqual([]);
    expect(selectSupplementalEditions(await loadSupplementalPublications(f.root), now)).toHaveLength(1);
  });
  it("verifies the future agency weekly stream alongside a same-date Canva supplement", async () => {
    const f = await fixture("2026-10-12", "2026-10-25", "2026-10-12", "2026-10-17");
    const weekly = await loadWeeklyPublications(f.root);
    const supplemental = await loadSupplementalPublications(f.root);
    expect(weekly.issues).toEqual([]);
    expect(supplemental.issues).toEqual([]);
    expect(weekly.editions[1].edition.source).toEqual({ kind: "agency", originalId: "nl-2026-10-12", medium: "de-maas-driehoek" });
    expect(supplemental.editions[0].offers.map(row => row.id)).toEqual(["maasduinen-synthetic-p1"]);
  });
  it.each([
    ["2026-10-24T21:59:59Z", 0], ["2026-10-24T22:00:00Z", 1],
    ["2026-10-25T00:59:59Z", 1], ["2026-10-25T01:00:00Z", 1],
    ["2026-10-25T22:59:59Z", 1], ["2026-10-25T23:00:00Z", 0],
  ])("selects each Berlin midnight/DST boundary anew at %s", async (now, count) => {
    const f = await fixture("2026-10-25", "2026-10-25");
    expect(selectSupplementalEditions(await loadSupplementalPublications(f.root), new Date(now))).toHaveLength(count);
  });
  it("isolates a corrupt declared supplement from both healthy weekly originals", async () => {
    const f = await fixture();
    f.supplemental.edition.pdf = { ...f.supplemental.edition.pdf, sha256: "a".repeat(64) };
    await f.save();
    expect((await loadWeeklyPublications(f.root)).editions).toHaveLength(2);
    const loaded = await loadSupplementalPublications(f.root);
    expect(loaded.editions).toEqual([]);
    expect(loaded.issues).toEqual([{ register: "supplemental", editionId: "maasduinen-synthetic", validFrom: "2026-10-07", validTo: "2026-10-18", code: "edition-invalid" }]);
  });
  it("never borrows a malformed raw identity to disable a healthy supplement", async () => {
    const f = await fixture();
    await f.write("data/editorial/supplemental-publications/broken.json", JSON.stringify({ schemaVersion: 1, edition: { ...f.supplemental.edition, cover: null } }));
    const loaded = await loadSupplementalPublications(f.root);
    expect(loaded.editions).toHaveLength(1);
    expect(loaded.issues).toEqual([{ register: "supplemental", code: "edition-invalid" }]);
  });
  it("isolates a schema-valid corrupt supplement from a healthy overlapping supplement", async () => {
    const f = await fixture();
    const id = "maasduinen-corrupt";
    const source = structuredClone(f.supplementalSource);
    source.flyerId = id; source.pages[0].offers[0].id = `${id}-p1`;
    const offer = { ...f.supplementalOffer, id: `${id}-p1`, flyerId: id };
    f.sources.push(source); f.offers.push(offer); await f.save();
    const corrupt = { ...f.supplemental.edition, id, source: { kind: "canva", flyerId: id },
      offerIds: [offer.id], offersSha256: sha256(JSON.stringify([offer])),
      pdf: { ...f.supplemental.edition.pdf, sha256: "a".repeat(64) } };
    await f.write(`data/editorial/supplemental-publications/${id}.json`, JSON.stringify({ schemaVersion: 1, edition: corrupt }));
    const loaded = await loadSupplementalPublications(f.root);
    expect(loaded.editions.map(row => row.edition.id)).toEqual(["maasduinen-synthetic"]);
    expect(loaded.issues).toEqual([{ register: "supplemental", editionId: id, validFrom: "2026-10-07", validTo: "2026-10-18", code: "edition-invalid" }]);
  });
  it.each([
    { identity: undefined }, { identity: { language: "nl", purpose: "weekly", medium: "legacy-canva" } },
    { validFrom: "2026-02-30" }, { validTo: "2026-10-06" }, { pageCount: 2 },
    { source: { kind: "agency", originalId: "synthetic", medium: "de-maas-driehoek" } },
    { review: { reviewedAt: "2026-10-05T12:00:00Z", printedValidFrom: "2026-10-07", printedValidTo: "2026-10-18", pageOfferCounts: [1] } },
  ])("rejects invalid supplemental identity, dates, original or approval %j", async override => {
    const f = await fixture();
    expect(() => parseSupplementalPublication({ ...f.supplemental, edition: { ...f.supplemental.edition, ...override } })).toThrow();
  });
  it("rejects globally colliding schema-valid edition IDs across independent registers", async () => {
    const f = await fixture();
    f.editions[1].id = f.supplemental.edition.id;
    await f.save();
    expect((await loadWeeklyPublications(f.root)).editions.map(row => row.edition.language)).toEqual(["de"]);
    expect((await loadSupplementalPublications(f.root)).editions).toEqual([]);
  });
  it("rejects a globally duplicated offer ID without selecting unrelated same-date rows", async () => {
    const f = await fixture();
    f.offers.push({ ...f.offers[0], id: f.supplementalOffer.id });
    await f.save();
    await expect(verifyPublicationEdition(parseSupplementalPublication(f.supplemental).edition, f.root)).rejects.toThrow(/duplicate/i);
  });
  it.each(["multi-page", "truncated-pdf", "image-dimensions", "source-identity", "source-census", "symlink"])("retains shared immutable integrity checks: %s", async mode => {
    const f = await fixture();
    const edition = f.supplemental.edition;
    if (mode === "multi-page" || mode === "truncated-pdf") {
      const doc = await PDFDocument.create(); doc.addPage(); if (mode === "multi-page") doc.addPage();
      let bytes = Buffer.from(await doc.save()); if (mode === "truncated-pdf") bytes = bytes.subarray(0, bytes.length - 10);
      edition.pdf = { ...edition.pdf, sha256: sha256(bytes), bytes: bytes.length };
      f.supplementalFlyer.pdfSha256 = edition.pdf.sha256;
      f.supplementalSource.pdfSha256 = edition.pdf.sha256;
      await f.write(`public${edition.pdf.path}`, bytes);
    }
    if (mode === "image-dimensions") { f.supplementalSource.pages[0].offers[0].rect = [1, 1, 3, 3]; f.supplementalOffer.rect = [1, 1, 3, 3]; }
    if (mode === "source-identity") f.supplementalFlyer.identity = { ...f.supplementalFlyer.identity, purpose: "weekly" } as never;
    if (mode === "source-census") f.supplementalSource.pages[0].expectedOffers = 2;
    if (mode === "symlink") {
      const target = path.join(f.root, `public${edition.pdf.path}`);
      await f.write("outside.pdf", f.pdfs[1]); await unlink(target); await symlink(path.join(f.root, "outside.pdf"), target);
    }
    edition.offersSha256 = sha256(JSON.stringify([f.supplementalOffer])); await f.save();
    await expect(verifyPublicationEdition(parseSupplementalPublication(f.supplemental).edition, f.root)).rejects.toThrow();
  });
  it("treats an absent optional register as normal and malformed registry JSON as unassigned", async () => {
    const f = await fixture();
    await rm(path.join(f.root, "data/editorial/supplemental-publications"), { recursive: true });
    expect(await loadSupplementalPublications(f.root)).toEqual({ editions: [], issues: [] });
    await f.write("data/editorial/supplemental-publications/unreadable.json", "not json");
    expect((await loadSupplementalPublications(f.root)).issues).toEqual([{ register: "supplemental", code: "edition-invalid" }]);
  });
  it("keeps an unreadable supplemental register from rejecting the healthy weekly register", async () => {
    const f = await fixture();
    await rm(path.join(f.root, "data/editorial/supplemental-publications"), { recursive: true });
    await f.write("data/editorial/supplemental-publications", "not a directory");
    expect((await loadSupplementalPublications(f.root)).issues).toEqual([{ register: "supplemental", code: "register-invalid" }]);
    expect((await loadWeeklyPublications(f.root)).editions).toHaveLength(2);
  });
  it("shares the durable transaction lock before and after production verification", async () => {
    const f = await fixture(); vi.stubEnv("NODE_ENV", "production");
    const loaded = await loadSupplementalPublications(f.root);
    await f.write(`public${f.supplemental.edition.pdf.path}`, "changed after verification");
    expect(await loadSupplementalPublications(f.root)).toBe(loaded);
    expect(selectSupplementalEditions(loaded, new Date("2026-10-19T12:00:00Z"))).toEqual([]);
    await f.write("data/editorial/.weekly-offers.lock", "interrupted");
    expect(await loadSupplementalPublications(f.root)).toEqual({ editions: [], issues: [{ register: "supplemental", code: "preparation-incomplete" }] });
    expect((await loadWeeklyPublications(f.root)).editions).toEqual([]);
  });
  it("withholds a verified supplement if preparation starts while verification is in flight", async () => {
    const f = await fixture();
    const target = path.join(await fs.realpath(f.root), "data/weekly-offer-layout.json");
    const read = fs.readFile;
    let entered!: () => void; let release!: () => void;
    const paused = new Promise<void>(resolve => { entered = resolve; });
    const resume = new Promise<void>(resolve => { release = resolve; });
    vi.spyOn(fs, "readFile").mockImplementation(async (...args: Parameters<typeof fs.readFile>) => {
      if (String(args[0]) === target) { entered(); await resume; }
      return read(...args);
    });
    const loading = loadSupplementalPublications(f.root);
    try { await paused; await f.write("data/editorial/.weekly-offers.lock", "interrupted"); }
    finally { release(); }
    expect(await loading).toEqual({ editions: [], issues: [{ register: "supplemental", code: "preparation-incomplete" }] });
  });
});
