import type { IncomingMessage } from "node:http";
import busboy from "busboy";
import { validatePayload } from "./crypto";
import type { IntakePayload, PayloadFile } from "./types";

const REQUEST_LIMIT = 11 * 1024 * 1024, FIELD_LIMIT = 16384, FILE_LIMIT = 5242880, TOTAL_LIMIT = 10485760;
const fieldNames = new Set(["name", "email", "job", "phone", "message"]);
function invalid(): never { throw new Error("INVALID_REQUEST"); }
function large(): never { throw new Error("PAYLOAD_TOO_LARGE"); }
function filename(value: string): string {
  const normalized = value.normalize("NFC").trim();
  if (!normalized || normalized.length > 255 || /[\/\\\x00-\x1f\x7f]/.test(normalized) || [".", ".."].includes(normalized)) invalid();
  return normalized;
}

// Busboy deliberately replaces invalid UTF-8 and does not expose field charset.
// This bounded observer retains only headers and a delimiter-sized body suffix,
// validates raw field bytes, and rejects ambiguous framing/parameters. Busboy
// remains responsible for producing the field/file streams; its internals are untouched.
class MultipartEvidence {
  private buffer = Buffer.alloc(0);
  private state: "first" | "headers" | "body" | "suffix" | "done" = "first";
  private decoder: TextDecoder | undefined;
  private fields = 0; private files = 0; private parts = 0; private fieldBytes = 0;
  private delimiter: Buffer;
  constructor(private boundary: string) { this.delimiter = Buffer.from("\r\n--" + boundary); }
  private headers(bytes: Buffer) {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes), headers = new Map<string, string>();
    for (const line of text.split("\r\n")) {
      const match = /^([A-Za-z-]+):[ \t]*([^\r\n]*)$/.exec(line);
      if (!match || headers.has(match[1].toLowerCase()) || !["content-disposition", "content-type", "content-transfer-encoding"].includes(match[1].toLowerCase())) invalid();
      headers.set(match[1].toLowerCase(), match[2]);
    }
    const disposition = headers.get("content-disposition");
    if (!disposition || !disposition.startsWith("form-data;")) invalid();
    const params = new Map<string, string>(); let remaining = disposition.slice(9);
    while (remaining.length) {
      const match = /^;[ \t]*(name|filename\*|filename)=(?:"([^"\\\r\n]*)"|([^;\s]+))/.exec(remaining);
      if (!match || params.has(match[1])) invalid();
      params.set(match[1], match[2] ?? match[3]); remaining = remaining.slice(match[0].length);
    }
    const name = params.get("name"); if (!name || !/^[A-Za-z]+$/.test(name)) invalid();
    if (params.has("filename") && params.has("filename*")) invalid();
    let file = params.get("filename");
    if (params.has("filename*")) {
      const extended = params.get("filename*")!;
      if (!/^UTF-8''/i.test(extended)) invalid();
      try { file = decodeURIComponent(extended.slice(7)); } catch { invalid(); }
    }
    const type = headers.get("content-type"), encoding = headers.get("content-transfer-encoding");
    if (encoding && !["7bit", "8bit", "binary"].includes(encoding.toLowerCase())) invalid();
    if (++this.parts > 13) large();
    if (file !== undefined) {
      filename(file); if (name !== "files" || !type || !["application/pdf", "image/jpeg", "image/png"].includes(type.toLowerCase())) invalid();
      if (++this.files > 5) large(); this.decoder = undefined;
    } else {
      if (++this.fields > 8) large();
      if (type && !/^text\/plain(?:;[ \t]*charset=(?:utf-8|"utf-8"))?$/i.test(type)) invalid();
      this.decoder = new TextDecoder("utf-8", { fatal: true });
    }
  }
  private body(bytes: Buffer, final = false) {
    if (this.decoder) { this.fieldBytes += bytes.length; if (this.fieldBytes > FIELD_LIMIT) large(); this.decoder.decode(bytes, { stream: !final }); }
  }
  write(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      if (this.state === "first") {
        const first = Buffer.from("--" + this.boundary + "\r\n");
        if (this.buffer.length < first.length) return;
        if (!this.buffer.subarray(0, first.length).equals(first)) invalid();
        this.buffer = this.buffer.subarray(first.length); this.state = "headers";
      } else if (this.state === "headers") {
        const end = this.buffer.indexOf("\r\n\r\n");
        if (end < 0) { if (this.buffer.length > 16384) invalid(); return; }
        if (end > 16384) invalid(); this.headers(this.buffer.subarray(0, end));
        this.buffer = this.buffer.subarray(end + 4); this.state = "body";
      } else if (this.state === "body") {
        const index = this.buffer.indexOf(this.delimiter);
        if (index < 0) {
          const emit = Math.max(0, this.buffer.length - this.delimiter.length - 2);
          this.body(this.buffer.subarray(0, emit)); this.buffer = Buffer.from(this.buffer.subarray(emit)); return;
        }
        if (this.buffer.length < index + this.delimiter.length + 2) { this.body(this.buffer.subarray(0, index)); this.buffer = Buffer.from(this.buffer.subarray(index)); return; }
        const suffix = this.buffer.subarray(index + this.delimiter.length, index + this.delimiter.length + 2).toString("ascii");
        if (suffix !== "--" && suffix !== "\r\n") {
          // Busboy recognizes the bare delimiter even with a bad suffix. Reject
          // instead of allowing two parsers to disagree about file/field bytes.
          invalid();
        }
        this.body(this.buffer.subarray(0, index), true); this.buffer = this.buffer.subarray(index + this.delimiter.length); this.state = "suffix";
      } else if (this.state === "suffix") {
        if (this.buffer.length < 2) return;
        const suffix = this.buffer.subarray(0, 2).toString("ascii"); this.buffer = this.buffer.subarray(2);
        this.state = suffix === "--" ? "done" : "headers";
      } else {
        if (this.buffer.length > 2 || (this.buffer.length === 2 && !this.buffer.equals(Buffer.from("\r\n")))) invalid(); return;
      }
    }
  }
  finish() { if (this.state !== "done" || (this.buffer.length !== 0 && !this.buffer.equals(Buffer.from("\r\n")))) invalid(); }
}
// Header-only protocol validation: constructing Busboy neither reads nor resumes
// the request. Keep its boundary syntax decision before worker admission too.
export function preflightMultipart(request: Pick<IncomingMessage, "headers">) {
  const contentType = request.headers["content-type"];
  const match = typeof contentType === "string" && /^multipart\/form-data;[ \t]*boundary=(?:"([A-Za-z0-9'()+_,.\/:=?-]{1,70})"|([A-Za-z0-9'()+_,.\/:=?-]{1,70}))$/i.exec(contentType);
  if (!match) invalid();
  const length = request.headers["content-length"];
  if (length !== undefined && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))) invalid();
  // Busboy emits `limit` at equality; +1 sentinels preserve inclusive budgets.
  let parser: ReturnType<typeof busboy>;
  try { parser = busboy({ headers: request.headers, preservePath: true, defCharset: "utf8", defParamCharset: "utf8", highWaterMark: 65536, fileHwm: 65536, limits: { files: 5, fields: 8, parts: 14, fileSize: FILE_LIMIT + 1, fieldSize: FIELD_LIMIT + 1, headerPairs: 3 } }); } catch { invalid(); }
  return { boundary: match[1] ?? match[2], parser };
}
export async function parseMultipart(request: IncomingMessage, signal: AbortSignal, transport = preflightMultipart(request)): Promise<IntakePayload> {
  // A valid transport with oversized content is an admitted attempt, not a
  // protocol-header rejection. Its size check deliberately remains post-reserve.
  const length = request.headers["content-length"];
  if (length !== undefined && Number(length) > REQUEST_LIMIT) large();
  if (signal.aborted || request.destroyed) throw signal.reason ?? new Error("INVALID_REQUEST");
  const evidence = new MultipartEvidence(transport.boundary), parser = transport.parser;
  return new Promise<IntakePayload>((resolve, reject) => {
    const fields: Record<string, string> = {}, files: PayloadFile[] = [];
    let rawBytes = 0, totalBytes = 0, ended = false, settled = false, invalidShape = false;
    const active = new Set<import("node:stream").Readable>();
    const cleanup = () => { request.pause(); request.removeListener("data", data); request.removeListener("end", end); request.removeListener("aborted", abort); request.removeListener("error", abort); signal.removeEventListener("abort", abort); };
    const fail = (error: unknown) => { if (settled) return; settled = true; cleanup(); for (const stream of active) stream.destroy(); parser.destroy(); reject(error instanceof Error && ["PAYLOAD_TOO_LARGE", "REQUEST_TIMEOUT"].includes(error.message) ? error : new Error("INVALID_REQUEST")); };
    const abort = () => fail(signal.reason ?? new Error("INVALID_REQUEST"));
    const data = (chunk: Buffer) => {
      request.pause(); rawBytes += chunk.length;
      try {
        if (rawBytes > REQUEST_LIMIT) large();
        for (let offset = 0; offset < chunk.length; offset += 65536) evidence.write(chunk.subarray(offset, offset + 65536));
        parser.write(chunk, error => { if (error) fail(error); else if (!settled) request.resume(); });
      } catch (error) { fail(error); }
    };
    const end = () => { try { evidence.finish(); ended = true; parser.end(); } catch (error) { fail(error); } };
    parser.on("field", (name, value, info) => {
      // Keep the bounded transport count/byte evidence independent of network
      // chunking. Shape rejection is deferred, never persisted or committed.
      if (!fieldNames.has(name) || Object.hasOwn(fields, name) || info.nameTruncated || info.valueTruncated) { invalidShape = true; return; }
      fields[name] = value;
    });
    parser.on("file", (name, stream, info) => {
      active.add(stream); const chunks: Buffer[] = []; let bytes = 0;
      const index = files.length; files.push({ name: "", mediaType: "image/png", content: "" });
      try { if (name !== "files") invalid(); filename(info.filename); } catch (error) { fail(error); return; }
      stream.on("error", fail);
      stream.on("limit", () => fail(new Error("PAYLOAD_TOO_LARGE")));
      stream.on("data", (chunk: Buffer) => {
        bytes += chunk.length; totalBytes += chunk.length;
        if (bytes > FILE_LIMIT || totalBytes > TOTAL_LIMIT) { fail(new Error("PAYLOAD_TOO_LARGE")); return; }
        chunks.push(Buffer.from(chunk));
      });
      stream.on("end", () => {
        active.delete(stream); if (settled) return;
        files[index] = { name: filename(info.filename), mediaType: info.mimeType as PayloadFile["mediaType"], content: Buffer.concat(chunks, bytes).toString("base64") };
      });
    });
    for (const event of ["filesLimit", "fieldsLimit", "partsLimit"] as const) parser.on(event, () => fail(new Error("PAYLOAD_TOO_LARGE")));
    parser.on("error", fail);
    parser.on("close", () => {
      if (settled) return;
      try { if (!ended || active.size || invalidShape) invalid(); const payload = validatePayload({ version: 1, input: fields, files }); settled = true; cleanup(); resolve(payload); } catch (error) { fail(error); }
    });
    request.on("data", data); request.on("end", end); request.on("aborted", abort); request.on("error", abort); signal.addEventListener("abort", abort, { once: true }); request.resume();
  });
}
