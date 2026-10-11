import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { LocalAsset } from "./weekly-publication-types";

export const publicationHash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const inside = (root: string, file: string) => { const relative = path.relative(root, file); return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };
export async function localPublicationBytes(root: string, relative: string): Promise<Buffer> {
  if (path.isAbsolute(relative)) throw new Error("Expected an editorial relative path");
  const canonical = await realpath(root), file = await realpath(path.resolve(root, relative));
  if (!inside(canonical, file)) throw new Error("Editorial path escapes root");
  const info = await stat(file);
  if (!info.isFile() || info.size > 50 * 1024 * 1024) throw new Error("Invalid or oversized original");
  const bytes = await readFile(file);
  if (!bytes.length || bytes.length > 50 * 1024 * 1024) throw new Error("Invalid or oversized original");
  return bytes;
}
export async function publicationDirectory(root: string, relative: string) {
  const target = path.resolve(root, relative);
  if (!inside(path.resolve(root), target)) throw new Error("Output path escapes root");
  await mkdir(target, { recursive: true });
  if (!inside(await realpath(root), await realpath(target))) throw new Error("Output symlink escapes root");
  return target;
}
export async function atomicPublicationBytes(file: string, bytes: string | Uint8Array) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try { await writeFile(temp, bytes, { flag: "wx" }); await rename(temp, file); }
  finally { await unlink(temp).catch(() => {}); }
}
export async function immutablePublicationAsset(root: string, asset: LocalAsset, bytes: Buffer) {
  if (publicationHash(bytes) !== asset.sha256 || bytes.length !== asset.bytes) throw new Error("Original checksum mismatch");
  const parent = await publicationDirectory(root, path.dirname(`public${asset.path}`));
  const file = path.join(parent, path.basename(asset.path));
  try { await writeFile(file, bytes, { flag: "wx" }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if (!(await localPublicationBytes(root, `public${asset.path}`)).equals(bytes)) throw new Error("Cannot overwrite a published path with different bytes");
  }
  if (!(await localPublicationBytes(root, `public${asset.path}`)).equals(bytes)) throw new Error("Published original changed during assembly");
}
export async function decodedPublicationImage(bytes: Buffer) {
  const image = sharp(bytes, { limitInputPixels: 50_000_000 });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format ?? "")) throw new Error("Invalid original cover");
  await image.resize(1, 1).raw().toBuffer();
  return metadata;
}
