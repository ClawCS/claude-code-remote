import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { randomFillSync } from "node:crypto";
import { withReconstructedDocuments, type ReconstructionDependencies } from "../src/reconstruction";
import { utcInstant } from "../src/types";
import type { RasterFrame } from "../src/reconstruction-types";
import { fixture, snapshot, staticPdf } from "./fixtures/synthetic";
import { blank } from "./fixtures/reconstruction";
let root: string, scopePath: string;
beforeEach(async () => { scopePath = ""; root = await mkdtemp(join(tmpdir(), "reconstruction-")); });
afterEach(async () => { vi.useRealTimers(); await rm(root, { recursive: true, force: true }); });
function dependencies(frames: RasterFrame[] = [blank()]): ReconstructionDependencies {
  return {
    inspector: { assurance: "local-test", async inspect(file) { return { kind: "inspected", inspection: { format: file.mediaType === "application/pdf" ? "pdf" : "png", pageCount: frames.length } }; } },
    raster: { async render(file, emit) { for (const frame of frames) await emit(frame); return { format: file.mediaType === "application/pdf" ? "pdf" : "png", pageCount: frames.length }; } },
    scanner: { assurance: "qualified-local-engine", async scan(file) { return { kind: "clean", complete: true, digest: file.digest, bytes: file.bytes, signatureTime: utcInstant(new Date().toISOString()), engineIdentity: "typed-synthetic-not-clamav" }; } },
    output: { async verify(file, expected) { if (!expected.pages.length || !(await stat(file.path)).isFile()) throw new Error("OUTPUT_INVALID"); } },
    scope: { async withScope(_id, action) { scopePath = await mkdtemp(join(root, "scope-")); try { return await action(scopePath); } finally { await rm(scopePath, { recursive: true, force: true }); } } },
    monotonicNow: () => performance.now(),
  };
}
describe("complete reconstructed packages (typed boundary doubles, not readiness proof)", () => {
  it("keeps source order, request identity, the actual blank page and only callback-scoped copies", async () => {
    const first = await fixture(root, staticPdf(), "first.pdf"), second = await fixture(root, staticPdf(), "second.pdf"), source = snapshot([first, second]);
    await withReconstructedDocuments(source, dependencies([blank(), blank(1)]), async bundle => {
      expect(bundle.files.map(f => f.sourceIndex)).toEqual([0, 1]);
      expect(bundle.files.map(f => f.pageCount)).toEqual([2, 2]);
      expect(bundle.requestDigest).toBe(source.digest); expect(bundle.id).toBe(source.id);
      expect(bundle.files[0].digest).not.toBe(first.digest); expect(bundle.files[0].path).not.toBe(first.path);
      expect(await readdir(scopePath)).toHaveLength(2);
    });
    await expect(stat(scopePath)).rejects.toThrow();
  });
  it("allows an empty complete bundle but still requires scanner readiness", async () => {
    const deps = dependencies(); const mailSink = vi.fn(async () => "empty");
    expect(await withReconstructedDocuments(snapshot([]), deps, mailSink)).toBe("empty");
    deps.scanner = { assurance: "unavailable", async scan() { throw new Error(); } };
    await expect(withReconstructedDocuments(snapshot([]), deps, mailSink)).rejects.toThrow("NOT_READY");
    expect(mailSink).toHaveBeenCalledTimes(1);
  });
  it.each(["file-two", "page-two", "missing-frame", "wrong-close", "bad-scan", "output-recipe", "deadline", "geometry"])("blocks the entire callback and cleans scope on %s", async fault => {
    const source = snapshot([await fixture(root, staticPdf(), "one.pdf"), await fixture(root, staticPdf(), "two.pdf")]);
    const deps = dependencies([blank(), blank(1)]), render = deps.raster.render; let calls = 0;
    if (fault === "file-two") deps.raster.render = async (...args) => { if (++calls === 2) throw new Error("RASTER_PROCESS"); return render(...args); };
    if (fault === "page-two") deps.raster.render = async (_file, emit) => { await emit(blank()); throw new Error("RASTER_PROCESS"); };
    if (fault === "missing-frame") deps.raster.render = async (_file, emit) => { await emit(blank()); return { format: "pdf", pageCount: 2 }; };
    if (fault === "wrong-close") deps.raster.render = async (...args) => { await render(...args); return { format: "pdf", pageCount: 1 }; };
    if (fault === "geometry") deps.raster.render = async (_file, emit) => { await emit({ ...blank(), pagePoints: { width: 50, height: 36 } }); return { format: "pdf", pageCount: 1 }; };
    if (fault === "bad-scan") { const scan = deps.scanner.scan; deps.scanner.scan = async (...args) => ({ ...await scan(...args), digest: source.digest }); }
    if (fault === "output-recipe") deps.output.verify = async () => { throw new Error("OUTPUT_INVALID"); };
    if (fault === "deadline") { let now = 0; deps.monotonicNow = () => now; const inspect = deps.inspector.inspect; deps.inspector.inspect = async (...args) => { const result = await inspect(...args); now = 90_000; return result; }; }
    const mailSink = vi.fn(async () => {});
    await expect(withReconstructedDocuments(source, deps, mailSink)).rejects.toThrow(); expect(mailSink).not.toHaveBeenCalled();
    if (scopePath) await expect(stat(scopePath)).rejects.toThrow();
  });
  it("rejects 41 aggregate PDF pages before rendering", async () => {
    const source = snapshot(await Promise.all(["a.pdf", "b.pdf", "c.pdf"].map(name => fixture(root, staticPdf(), name))));
    const deps = dependencies(); let index = 0;
    deps.inspector.inspect = async () => ({ kind: "inspected", inspection: { format: "pdf", pageCount: [20,20,1][index++] } });
    const mailSink = vi.fn(async () => {}); await expect(withReconstructedDocuments(source, deps, mailSink)).rejects.toThrow("PAGE_LIMIT"); expect(mailSink).not.toHaveBeenCalled();
  });
  it.each(["one-file", "whole-set"])("never delivers outputs beyond the %s byte limit", async limit => {
    const side = limit === "one-file" ? 1400 : 1100, pixels = randomFillSync(new Uint8Array(side*side*4));
    const frame: RasterFrame = {index:0,width:side,height:side,channels:4,pixels};
    const input = await sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
    const source = snapshot(await Promise.all((limit === "one-file" ? ["a.png"] : ["a.png","b.png","c.png"]).map(name=>fixture(root,input,name,"image/png"))));
    const mailSink = vi.fn(async () => {});
    await expect(withReconstructedDocuments(source,dependencies([frame]),mailSink)).rejects.toThrow("OUTPUT_LIMIT"); expect(mailSink).not.toHaveBeenCalled();
    await expect(stat(scopePath)).rejects.toThrow();
  });
  it("checks cancellation again after output verifier settlement", async () => {
    const source = snapshot([await fixture(root,staticPdf())]), deps = dependencies(); let now = 0; deps.monotonicNow = () => now;
    deps.output.verify = async () => { now = 90_000; };
    const mailSink = vi.fn(async()=>{}); await expect(withReconstructedDocuments(source,deps,mailSink)).rejects.toThrow("RECONSTRUCTION_TIMEOUT"); expect(mailSink).not.toHaveBeenCalled();
  });
  it("never lets a dependency's document diagnostic escape as the failure code", async () => {
    const deps=dependencies(), source=snapshot([await fixture(root,staticPdf())]); deps.raster.render=async()=>{throw new Error("private applicant path and codec diagnostic");};
    const mailSink=vi.fn(async()=>{}); await expect(withReconstructedDocuments(source,deps,mailSink)).rejects.toThrow("RECONSTRUCTION_FAILED"); expect(mailSink).not.toHaveBeenCalled();
  });
  it("rescans the entire output set and rejects a later incomplete scan", async () => {
    const file = await fixture(root, staticPdf()), deps = dependencies(); const scan = deps.scanner.scan; let scans = 0;
    deps.scanner.scan = async (...args) => ({ ...await scan(...args), complete: ++scans === 1 });
    const mailSink = vi.fn(async () => {}); await expect(withReconstructedDocuments(snapshot([file]), deps, mailSink)).rejects.toThrow("INCOMPLETE_SCAN"); expect(mailSink).not.toHaveBeenCalled();
  });
  it("rechecks the entire output set after a later scan changed an earlier output", async () => {
    const source=snapshot([await fixture(root,staticPdf(),"first.pdf"),await fixture(root,staticPdf(),"second.pdf")]), deps=dependencies(), scan=deps.scanner.scan; let scans=0, firstOutput="";
    deps.scanner.scan=async(...args)=>{const result=await scan(...args);if(++scans===3)firstOutput=args[0].path;if(scans===4)await writeFile(firstOutput,"changed after its own scan");return result;};
    const mailSink=vi.fn(async()=>{});await expect(withReconstructedDocuments(source,deps,mailSink)).rejects.toThrow("DIGEST_MISMATCH");expect(mailSink).not.toHaveBeenCalled();
  });
  it("waits for an abort-ignoring raster before cleaning or freeing processing slot", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }); const file = await fixture(root, staticPdf()), deps = dependencies();
    let start!: () => void, finish!: () => void; const started = new Promise<void>(resolve => { start = resolve; });
    deps.raster.render = async () => { start(); await new Promise<void>(resolve => { finish = resolve; }); return { format: "pdf", pageCount: 1 }; };
    const mailSink = vi.fn(async () => {}); const pending = withReconstructedDocuments(snapshot([file]), deps, mailSink); const failure = expect(pending).rejects.toThrow("RECONSTRUCTION_TIMEOUT");
    await started; await vi.advanceTimersByTimeAsync(90_000);
    await expect(withReconstructedDocuments(snapshot([]), dependencies(), mailSink)).rejects.toThrow("BUSY"); expect((await stat(scopePath)).isDirectory()).toBe(true);
    finish(); await failure; expect(mailSink).not.toHaveBeenCalled(); await expect(stat(scopePath)).rejects.toThrow();
  });
});
