import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Splitter, type SplitterChunk } from "@zone-eu/mailsplit";
import type { MimeNode } from "@zone-eu/mailsplit/lib/types";
import type { MimeLimits } from "./types";

export const MAIL_PROFILE = "tj-mail-1" as const;
export const MAIL_ADDRESS = "info@trinkgut-jammers.de" as const;
export const MIME_LIMITS: Readonly<MimeLimits> = Object.freeze({ maxRawBytes: 16777216, maxParts: 12, maxAttachments: 5, maxDepth: 1, maxFileBytes: 5242880, maxAttachmentBytes: 10485760, maxTextBytes: 65536 });
export const STABLE_HEADERS = ["from", "to", "reply-to", "subject", "date", "message-id", "x-tj-application-id", "x-tj-profile", "x-tj-key-id"] as const;
const rootHeaders = new Set<string>([...STABLE_HEADERS, "mime-version", "content-type", "content-transfer-encoding", "x-tj-fingerprint", "x-tj-signature", "received"]);
const leafHeaders = new Set(["content-type", "content-transfer-encoding", "content-disposition"]);
export interface DeclaredAttachment { name: string; mediaType: string; bytes: number }
export interface MimeStructure { headers: Readonly<Record<string, string>>; text: string; parts: number; kind: "text" | "mixed"; attachments: DeclaredAttachment[] }
function invalid(): never { throw new Error("INVALID_MIME"); }
export function checkMimeLimits(limits: MimeLimits): void {
  for (const key of Object.keys(MIME_LIMITS) as (keyof MimeLimits)[]) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] < (key === "maxDepth" || key === "maxAttachments" ? 0 : 1) || limits[key] > MIME_LIMITS[key]) throw new Error("MIME_LIMIT");
  }
}
export async function collectMime(raw: AsyncIterable<Uint8Array>, maximum: number): Promise<Buffer> {
  const chunks: Buffer[] = []; let bytes = 0;
  for await (const chunk of raw) {
    if (!(chunk instanceof Uint8Array) || (bytes += chunk.byteLength) > maximum) throw new Error("MIME_LIMIT");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks, bytes);
}
function headers(node: MimeNode): Record<string, string> {
  if (!node.headers) return invalid();
  const values: Record<string, string> = Object.create(null);
  for (const { key, line } of node.headers.getList()) {
    if (!(node.root ? rootHeaders : leafHeaders).has(key) || (key !== "received" && key in values)) invalid();
    const colon = line.indexOf(":"); if (colon < 1) invalid();
    // Unfold only the line break; following spaces/tabs are content and must
    // remain fingerprint-bound, rather than collapsing to a single space.
    const value = line.slice(colon + 1).replace(/^ /, "").replace(/\r?\n(?=[\t ])/g, "");
    if (/[^\x20-\x7e\t]/.test(value)) invalid(); values[key] = value;
  }
  return values;
}
function declaration(raw: string | undefined): { value: string; params: Record<string, string> } {
  if (!raw) return invalid();
  // The generated v1 profile has only ASCII token/quoted-token parameters.
  const sections = raw.split(";"); const value = sections.shift()!.trim().toLowerCase(); const params: Record<string, string> = Object.create(null);
  if (!/^[a-z0-9-]+(?:\/[a-z0-9.+-]+)?$/.test(value)) invalid();
  for (const section of sections) {
    const match = /^\s*([a-zA-Z0-9-]+)=(?:"([a-zA-Z0-9_.=-]+)"|([a-zA-Z0-9_.=-]+))\s*$/.exec(section);
    if (!match || match[1].toLowerCase() in params) invalid(); params[match[1].toLowerCase()] = match[2] ?? match[3];
  }
  return { value, params };
}
export async function inspectMimeStructure(raw: Buffer, limits: MimeLimits): Promise<MimeStructure> {
  checkMimeLimits(limits); if (raw.length > limits.maxRawBytes) throw new Error("MIME_LIMIT");
  const splitter = new Splitter({ maxHeadSize: 16384, maxChildNodes: limits.maxParts, ignoreEmbedded: true });
  const nodes: { node: MimeNode; headers: Record<string, string>; body: Buffer[] }[] = [];
  const framing: Buffer[] = [];
  const running = pipeline(Readable.from([raw]), splitter);
  try {
    for await (const value of splitter) {
      const chunk = value as SplitterChunk;
      if (chunk.type === "node") {
        if (nodes.length >= limits.maxParts) throw new Error("MIME_LIMIT");
        let depth = 0, parent = chunk.parentNode; while (parent) { depth++; parent = parent.parentNode; }
        if (depth > limits.maxDepth || depth > 1 || (nodes.length > 0 && chunk.parentNode !== nodes[0].node)) invalid();
        nodes.push({ node: chunk, headers: headers(chunk), body: [] });
      } else if (chunk.type === "body") {
        const part = nodes.find(item => item.node === chunk.node); if (!part) invalid(); part.body.push(chunk.value);
      } else { framing.push(chunk.value); }
    }
    await running;
  } catch (error) { splitter.destroy(); await running.catch(() => {}); throw error; }
  if (!nodes.length) invalid();
  const root = nodes[0], rootType = declaration(root.headers["content-type"]);
  for (const field of STABLE_HEADERS) if (!(field in root.headers)) invalid();
  if (root.headers["mime-version"] !== "1.0" || root.headers.from !== MAIL_ADDRESS || root.headers.to !== MAIL_ADDRESS || root.headers["x-tj-profile"] !== MAIL_PROFILE) invalid();
  let textPart = root, kind: "mixed" | "text" = "text";
  if (rootType.value === "multipart/mixed") {
    kind = "mixed"; if (Object.keys(rootType.params).join() !== "boundary" || !rootType.params.boundary || nodes.length < 3 || "content-transfer-encoding" in root.headers) invalid(); textPart = nodes[1];
    const lines = Buffer.concat(framing).toString("latin1").split(/\r?\n/).filter(line => line !== "");
    if (lines.length !== nodes.length || lines.slice(0, -1).some(line => line !== `--${rootType.params.boundary}`) || lines.at(-1) !== `--${rootType.params.boundary}--`) invalid();
  } else if (nodes.length !== 1) invalid();
  else if (framing.some(chunk => chunk.length !== 0)) invalid();
  const textType = declaration(textPart.headers["content-type"]);
  if (textType.value !== "text/plain" || Object.keys(textType.params).join() !== "charset" || textType.params.charset.toLowerCase() !== "utf-8" || textPart.headers["content-transfer-encoding"] !== "base64" || "content-disposition" in textPart.headers) invalid();
  const normalizedBase64 = Buffer.concat(textPart.body).toString("latin1").replace(/\r\n|\n/g, "");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalizedBase64)) invalid();
  const decoded = Buffer.from(normalizedBase64, "base64"); if (decoded.length > limits.maxTextBytes) throw new Error("MIME_LIMIT");
  let text: string; try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(decoded); } catch { return invalid(); }
  text = text.replace(/\r\n/g, "\n"); if (text.includes("\r")) invalid();
  const attachments: DeclaredAttachment[] = [];
  for (const part of nodes.slice(kind === "mixed" ? 2 : 1)) {
    const type = declaration(part.headers["content-type"]), disposition = declaration(part.headers["content-disposition"]);
    const name = disposition.params.filename;
    const ext = type.value === "application/pdf" ? "pdf" : type.value === "image/jpeg" ? "jpg" : type.value === "image/png" ? "png" : undefined;
    if (!ext || disposition.value !== "attachment" || Object.keys(disposition.params).join() !== "filename" || Object.keys(type.params).join() !== "name" || type.params.name !== name || name !== `document-${attachments.length + 1}.${ext}` || part.headers["content-transfer-encoding"] !== "base64") invalid();
    const base64 = Buffer.concat(part.body).toString("latin1").replace(/\r\n|\n/g, "");
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) invalid();
    const bytes = base64.length / 4 * 3 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
    if (bytes < 1 || bytes > limits.maxFileBytes) throw new Error("MIME_LIMIT");
    attachments.push({ name, mediaType: type.value, bytes });
  }
  if (attachments.length > limits.maxAttachments) throw new Error("MIME_LIMIT");
  if (attachments.reduce((total, attachment) => total + attachment.bytes, 0) > limits.maxAttachmentBytes) throw new Error("MIME_LIMIT");
  return { headers: Object.freeze(root.headers), text, parts: nodes.length, kind, attachments };
}
