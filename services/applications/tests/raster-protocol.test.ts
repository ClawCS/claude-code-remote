import { describe, expect, it } from "vitest";
import { decodeRasterFrame, decodeRasterStream } from "../src/raster-protocol";

const rgb = { index: 0, width: 2, height: 1, channels: 3 };
function packet(header: unknown, pixels = Buffer.alloc(0)): Buffer {
  const json = Buffer.from(JSON.stringify(header)), size = Buffer.alloc(4);
  size.writeUInt32BE(json.length);
  return Buffer.concat([size, json, pixels]);
}
async function* chunks(bytes: Buffer, size = 7) { for (let i = 0; i < bytes.length; i += size) yield bytes.subarray(i, i + size); }
const frame = (header = rgb) => packet({ version: 1, operation: "raster", kind: "frame", frame: header }, Buffer.from([1, 2, 3, 4, 5, 6]));
const done = (format = "png", pageCount = 1) => packet({ version: 1, operation: "raster", kind: "completed", inspection: { format, pageCount } });

describe("bounded raw raster frame contract", () => {
  it("accepts exactly decoded pixels and does not accept encoded image bytes", () => {
    expect(decodeRasterFrame(rgb, new Uint8Array([1, 2, 3, 4, 5, 6]), 0, "png")).toEqual({ ...rgb, pixels: new Uint8Array([1, 2, 3, 4, 5, 6]) });
    expect(() => decodeRasterFrame(rgb, Buffer.from("encoded PNG"), 0, "png")).toThrow("RASTER_BYTES");
  });
  it.each([0, -1, 1.5, NaN, Infinity])("rejects invalid width or height %s", dimension => {
    for (const axis of ["width", "height"]) expect(() => decodeRasterFrame({ ...rgb, [axis]: dimension }, new Uint8Array(6), 0, "png")).toThrow("RASTER_INVALID");
  });
  it.each([{ width: 8193, height: 1 }, { width: 1, height: 8193 }, { width: 5001, height: 5000 }])("rejects oversized image dimensions $width/$height before byte handling", dimensions => {
    expect(() => decodeRasterFrame({ ...rgb, ...dimensions }, new Uint8Array(0), 0, "png")).toThrow("RASTER_LIMIT");
  });
  it("allows the inclusive edge boundary and preserves PNG alpha bytes", () => {
    expect(decodeRasterFrame({ ...rgb, width: 8192 }, new Uint8Array(24576), 0, "jpeg").width).toBe(8192);
    const pixels = new Uint8Array([0, 0, 0, 0, 255, 255, 255, 255]);
    expect(decodeRasterFrame({ ...rgb, channels: 4 }, pixels, 0, "png").pixels).toEqual(pixels);
  });
  it("rejects a PDF raster above eight megapixels", () => {
    expect(() => decodeRasterFrame({ ...rgb, width: 4001, height: 2000, pagePoints: { width: 612, height: 792 } }, new Uint8Array(0), 0, "pdf")).toThrow("RASTER_LIMIT");
  });
  it.each([5, 7])("rejects %s bytes where six are required", length => {
    expect(() => decodeRasterFrame(rgb, new Uint8Array(length), 0, "png")).toThrow("RASTER_BYTES");
  });
  it.each([-1, 0, 2, 0.5, NaN])("rejects out-of-order index %s when next index is one", index => {
    expect(() => decodeRasterFrame({ ...rgb, index }, new Uint8Array(6), 1, "pdf")).toThrow("RASTER_INDEX");
  });
  it.each([undefined, { width: 0, height: 1 }, { width: NaN, height: 1 }, { width: Infinity, height: 1 }, { width: 1, height: -1 }, { width: 1, height: 1, extra: true }])("requires strict finite positive PDF page geometry %j", pagePoints => {
    expect(() => decodeRasterFrame({ ...rgb, pagePoints }, new Uint8Array(6), 0, "pdf")).toThrow("RASTER_PAGE_POINTS");
  });
  it("allows fractional PDF points but forbids PDF alpha", () => {
    expect(decodeRasterFrame({ ...rgb, pagePoints: { width: 1.25, height: 2.5 } }, new Uint8Array(6), 0, "pdf").pagePoints).toEqual({ width: 1.25, height: 2.5 });
    expect(() => decodeRasterFrame({ ...rgb, channels: 4, pagePoints: { width: 1, height: 1 } }, new Uint8Array(8), 0, "pdf")).toThrow("RASTER_INVALID");
  });
  it.each(["jpeg", "png"] as const)("rejects PDF metadata on %s frames", format => {
    expect(() => decodeRasterFrame({ ...rgb, pagePoints: { width: 1, height: 1 } }, new Uint8Array(6), 0, format)).toThrow("RASTER_PAGE_POINTS");
  });
  it.each([{ ...rgb, extra: true }, { ...rgb, channels: 2 }, Object.create(rgb), Object.defineProperty({ ...rgb }, "width", { get: () => 2 }), null])("rejects malformed frame DTO %j", header => {
    expect(() => decodeRasterFrame(header, new Uint8Array(6), 0, "png")).toThrow("RASTER_INVALID");
  });
});

describe("bounded raster stream", () => {
  it("does not emit the next frame while the prior consumer is pending", async () => {
    let release!: () => void, started!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), firstStarted = new Promise<void>(resolve => { started = resolve; });
    const emitted: number[] = [];
    const pdfFrame = (index: number) => packet({ version: 1, operation: "raster", kind: "frame", frame: { ...rgb, index, pagePoints: { width: 612, height: 792 } } }, Buffer.alloc(6));
    const result = decodeRasterStream(chunks(Buffer.concat([pdfFrame(0), pdfFrame(1), done("pdf", 2)]), 1024), { format: "pdf", pageCount: 2 }, async value => {
      emitted.push(value.index); if (value.index === 0) { started(); await gate; }
    }, Promise.resolve(0));
    await firstStarted; await new Promise<void>(resolve => setImmediate(resolve));
    expect(emitted).toEqual([0]); release();
    expect(await result).toEqual({ format: "pdf", pageCount: 2 }); expect(emitted).toEqual([0, 1]);
  });
  it("does not return success before observed process close", async () => {
    let close!: (code: number) => void, ended!: () => void;
    const processClose = new Promise<number>(resolve => { close = resolve; }), streamEnded = new Promise<void>(resolve => { ended = resolve; });
    async function* output() { yield Buffer.concat([frame(), done()]); ended(); }
    let settled = false;
    const result = decodeRasterStream(output(), { format: "png", pageCount: 1 }, async () => {}, processClose).then(value => { settled = true; return value; });
    await streamEnded; await new Promise<void>(resolve => setImmediate(resolve));
    expect(settled).toBe(false); close(0);
    expect(await result).toEqual({ format: "png", pageCount: 1 });
  });
  it("handles fragmented headers/pixels and awaits each consumer before the next frame", async () => {
    const emitted: number[] = [];
    const pdfFrame = (index: number) => frame({ ...rgb, index, pagePoints: { width: 612, height: 792 } } as typeof rgb);
    const result = await decodeRasterStream(chunks(Buffer.concat([pdfFrame(0), pdfFrame(1), done("pdf", 2)])), { format: "pdf", pageCount: 2 }, async value => {
      await Promise.resolve(); emitted.push(value.index);
    }, 0);
    expect(emitted).toEqual([0, 1]); expect(result).toEqual({ format: "pdf", pageCount: 2 });
  });
  it.each([
    { name: "no completion", bytes: frame(), exit: 0 },
    { name: "missing frame", bytes: done(), exit: 0 },
    { name: "suffix bytes", bytes: Buffer.concat([frame(), done(), Buffer.from([0])]), exit: 0 },
    { name: "duplicate frame", bytes: Buffer.concat([frame(), frame(), done()]), exit: 0 },
    { name: "mismatched count", bytes: Buffer.concat([frame(), done("png", 2)]), exit: 0 },
    { name: "mismatched format", bytes: Buffer.concat([frame(), done("jpeg")]), exit: 0 },
    { name: "crash after completion", bytes: Buffer.concat([frame(), done()]), exit: 1 },
    { name: "signal after completion", bytes: Buffer.concat([frame(), done()]), exit: null },
    { name: "truncated pixels", bytes: frame().subarray(0, -1), exit: 0 },
    { name: "unknown operation", bytes: packet({ version: 1, operation: "other", kind: "completed" }), exit: 0 },
  ])("blocks $name", async ({ bytes, exit }) => {
    await expect(decodeRasterStream(chunks(bytes), { format: "png", pageCount: 1 }, async () => {}, exit)).rejects.toThrow();
  });
  it("rejects oversized header length without reading or allocating its advertised body", async () => {
    const size = Buffer.alloc(4); size.writeUInt32BE(4097);
    await expect(decodeRasterStream(chunks(size), { format: "png", pageCount: 1 }, async () => {}, 0)).rejects.toThrow("RASTER_LIMIT");
  });
  it("rejects invalid UTF-8 rather than replacement decoding", async () => {
    const json = Buffer.concat([Buffer.from('{"a":"'), Buffer.from([0xff]), Buffer.from('"}')]), size = Buffer.alloc(4); size.writeUInt32BE(json.length);
    await expect(decodeRasterStream(chunks(Buffer.concat([size, json])), { format: "png", pageCount: 1 }, async () => {}, 0)).rejects.toThrow("RASTER_PROTOCOL");
  });
});
