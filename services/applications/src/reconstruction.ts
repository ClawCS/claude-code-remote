import { createHash } from "node:crypto";
import { lstat, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { digest, VALIDATION_FAILURES, type ApplicationId, type Digest, type ProcessingSnapshot, type ScannerPort, type SnapshotFile } from "./types";
import { inspectReconstructionSource, MAX_FILE_BYTES, readSnapshotFile } from "./file-validation";
import { decodeSourceInspection, type RasterPort, type SourceInspectorPort, type SourceInspection } from "./reconstruction-types";
import { decodeRasterFrame } from "./raster-protocol";
import { RECONSTRUCTION_LIMITS as limits } from "./reconstruction-limits";
import { scanFiles } from "./scanner";
import { encodeRaster } from "./image-encoder";
import { createPdfReconstruction } from "./pdf-reconstruction";
import type { GeneratedOutputExpectation, GeneratedOutputPort } from "./generated-output-policy";
import { strictObject, validatePayload } from "./crypto";
import { assertAuthenticatedArtifact, authenticatedArtifactBytes, type AuthenticatedArtifact } from "./artifact-crypto";
import type { RequestIdentity } from "./types";
import { MAX_BUNDLE_PLAINTEXT } from "./storage-budget";

const reconstructed: unique symbol = Symbol("verified reconstructed application bundle");
const activeBundles = new WeakSet<object>();
export function assertReconstructedBundle(value:unknown):asserts value is ReconstructedBundle {
  if (!value || typeof value!=="object" || !activeBundles.has(value)) throw new Error("INVALID_RECONSTRUCTED_BUNDLE");
}
export interface ReconstructedFile extends SnapshotFile { sourceIndex: number; sourceDigest: Digest; pageCount?: number }
export interface ReconstructedBundle { readonly [reconstructed]: true; version: 1; id: ApplicationId; input: ProcessingSnapshot["input"]; requestDigest: Digest; policyId: "tj-reconstruction-1"; files: readonly ReconstructedFile[] }
export interface ReconstructionScopePort { withScope<T>(id: ApplicationId, action: (directory: string) => Promise<T>): Promise<T> }
export interface ReconstructionDependencies { inspector: SourceInspectorPort; raster: RasterPort; scanner: ScannerPort; scope: ReconstructionScopePort; output: GeneratedOutputPort; monotonicNow: () => number }
export const reconstructionReadiness = Object.freeze({ productionReady: false, reason: "LINUX_RECONSTRUCTION_UNQUALIFIED" });
let busy = false;
const failureCodes = new Set<string>([...VALIDATION_FAILURES,"NOT_READY","BUSY","TIMEOUT","STALE_SIGNATURES","INCOMPLETE_SCAN","INFECTED","SCANNER_ERROR","OUTPUT_INVALID","OUTPUT_UNAVAILABLE","OUTPUT_LIMIT","OUTPUT_IDENTITY","UNSAFE_SCOPE","RECONSTRUCTION_TIMEOUT","RASTER_INDEX","RASTER_INVALID","RASTER_BYTES","RASTER_LIMIT","RASTER_PAGE_POINTS","RASTER_INCOMPLETE","RASTER_PROTOCOL","RASTER_PROCESS","RASTER_TIMEOUT","RASTER_SOURCE"]);
export async function withReconstructedDocuments<T>(snapshot: ProcessingSnapshot, deps: ReconstructionDependencies, action: (bundle: ReconstructedBundle) => Promise<T>): Promise<T> {
  if (busy) throw new Error("BUSY");
  if (deps.scanner?.assurance !== "qualified-local-engine" || !["linux-sandbox", "local-test"].includes(deps.inspector?.assurance) || (deps.inspector.assurance === "local-test" && process.env.NODE_ENV !== "test") || !deps.raster?.render || !deps.output?.verify || !deps.scope?.withScope) throw new Error("NOT_READY");
  if (snapshot.files.length > 5 || snapshot.files.reduce((sum, f) => sum + f.bytes, 0) > 10 * 1024 * 1024) throw new Error("FILE_LIMIT");
  busy = true;
  let handedOff = false;
  try {
    const originalScan = await scanFiles(snapshot.files, deps.scanner);
    if (originalScan.kind !== "clean") throw new Error(originalScan.reason);
    if (originalScan.scannedDigests.length !== snapshot.files.length || originalScan.scannedDigests.some((hash, i) => hash !== snapshot.files[i].digest)) throw new Error("DIGEST_MISMATCH");
    const start = deps.monotonicNow(); if (!Number.isFinite(start)) throw new Error("RECONSTRUCTION_TIMEOUT");
    const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 90_000);
    const check = () => { const now = deps.monotonicNow(); if (abort.signal.aborted || !Number.isFinite(now) || now < start || now - start >= 90_000) { abort.abort(); throw new Error("RECONSTRUCTION_TIMEOUT"); } };
    const step = async <R>(operation: () => Promise<R>): Promise<R> => {
      check(); const childTimer = setTimeout(() => abort.abort(), 30_000);
      try { const result = await operation(); check(); return result; }
      catch (error) { check(); throw error; } finally { clearTimeout(childTimer); }
    };
    try {
      const inspections: SourceInspection[] = []; let totalPages = 0;
      for (const file of snapshot.files) {
        const inspection = await step(() => inspectReconstructionSource(file, deps.inspector, abort.signal)); inspections.push(inspection);
        if (inspection.format === "pdf" && (totalPages += inspection.pageCount) > limits.applicationPdfPages) throw new Error("PAGE_LIMIT");
      }
      return await deps.scope.withScope(snapshot.id, async directory => {
        if (!isAbsolute(directory) || resolve(directory) !== directory) throw new Error("UNSAFE_SCOPE");
        const info = await lstat(directory); check(); if (!info.isDirectory() || info.isSymbolicLink() || (info.mode & 0o777) !== 0o700 || info.uid !== process.getuid?.()) throw new Error("UNSAFE_SCOPE");
        const files: ReconstructedFile[] = []; let totalBytes = 0;
        for (let sourceIndex = 0; sourceIndex < snapshot.files.length; sourceIndex++) {
          const source = snapshot.files[sourceIndex], inspection = inspections[sourceIndex];
          const expected: GeneratedOutputExpectation = { format: inspection.format, pages: [] }, pages: GeneratedOutputExpectation["pages"][number][] = [];
          const pdf = inspection.format === "pdf" ? createPdfReconstruction() : undefined; let encoded: Uint8Array | undefined, index = 0;
          const completion = await step(() => deps.raster.render(source, async raw => {
            check(); if (index >= inspection.pageCount) throw new Error("RASTER_INDEX");
            const frame = decodeRasterFrame({ index: raw.index, width: raw.width, height: raw.height, channels: raw.channels, ...(raw.pagePoints ? { pagePoints: raw.pagePoints } : {}) }, raw.pixels, index, inspection.format);
            pages.push({ width: frame.width, height: frame.height, channels: frame.channels, ...(frame.pagePoints ? { pagePoints: { ...frame.pagePoints } } : {}) });
            if (pdf) await pdf.append(frame); else encoded = await encodeRaster(frame, inspection.format as "jpeg" | "png");
            check(); index++;
          }, abort.signal));
          const actual = decodeSourceInspection(completion);
          if (!actual || actual.format !== inspection.format || actual.pageCount !== inspection.pageCount || index !== inspection.pageCount) throw new Error("RASTER_INCOMPLETE");
          await step(() => readSnapshotFile(source));
          if (pdf) encoded = await step(() => pdf.finish());
          if (!encoded || !encoded.length || encoded.length > MAX_FILE_BYTES || (totalBytes += encoded.length) > 10 * 1024 * 1024) throw new Error("OUTPUT_LIMIT");
          const extension = inspection.format === "jpeg" ? "jpg" : inspection.format, name = `document-${sourceIndex + 1}.${extension}`;
          const file: ReconstructedFile = { sourceIndex, sourceDigest: source.digest, name, path: join(directory, name), mediaType: source.mediaType, bytes: encoded.length, digest: digest(createHash("sha256").update(encoded).digest("hex")), ...(pdf ? { pageCount: inspection.pageCount } : {}) };
          // R31: deterministic canonical PNG encoding may legitimately match the
          // source digest. Identity is the new exclusively-created scoped file.
          if (file.path === source.path) throw new Error("OUTPUT_IDENTITY");
          await step(() => writeFile(file.path, encoded!, { flag: "wx", mode: 0o600 })); encoded = undefined;
          expected.pages = pages;
          await step(() => deps.output.verify(file, expected, abort.signal)); await step(() => readSnapshotFile(file)); files.push(Object.freeze(file));
        }
        check(); clearTimeout(timer);
        const outputScan = await scanFiles(files, deps.scanner);
        if (outputScan.kind !== "clean") throw new Error(outputScan.reason);
        if (outputScan.scannedDigests.length !== files.length || outputScan.scannedDigests.some((hash, i) => hash !== files[i].digest)) throw new Error("DIGEST_MISMATCH");
        // Brand only after whole-set validation/scan. It is not serialized or restorable from JSON.
        const bundle = { version: 1 as const, id: snapshot.id, input: snapshot.input, requestDigest: snapshot.digest, policyId: "tj-reconstruction-1" as const, files: Object.freeze(files) };
        Object.defineProperty(bundle, reconstructed, { value: true, enumerable: false });
        const verified=Object.freeze(bundle) as ReconstructedBundle;
        activeBundles.add(verified);
        handedOff = true;
        try { return await action(verified); } finally { activeBundles.delete(verified); }
      });
    } finally { clearTimeout(timer); }
  } catch (error) {
    // The caller owns callback failures (e.g. delivery state); reconstruction
    // diagnostics never leave this boundary as source-controlled free text.
    if (handedOff) throw error;
    throw new Error(error instanceof Error && failureCodes.has(error.message) ? error.message : "RECONSTRUCTION_FAILED");
  } finally { busy = false; }
}

export async function encodeReconstructedBundle(bundle:ReconstructedBundle):Promise<Buffer> {
  assertReconstructedBundle(bundle);
  const content:Buffer[]=[];
  const input=validatePayload({version:1,input:bundle.input,files:[]}).input;
  const canonicalInput={name:input.name,email:input.email,job:input.job,...(input.phone!==undefined?{phone:input.phone}:{}),...(input.message!==undefined?{message:input.message}:{})};
  const files=[];
  for(const file of bundle.files){
    const bytes=await readSnapshotFile(file); content.push(Buffer.from(bytes));
    files.push({name:file.name,mediaType:file.mediaType,bytes:file.bytes,digest:file.digest,sourceIndex:file.sourceIndex,sourceDigest:file.sourceDigest,...(file.pageCount!==undefined?{pageCount:file.pageCount}:{})});
  }
  assertReconstructedBundle(bundle);
  const manifest=Buffer.from(JSON.stringify({version:1,id:bundle.id,input:canonicalInput,requestDigest:bundle.requestDigest,policyId:bundle.policyId,files}));
  if(manifest.length+4>65536)throw new Error("ARTIFACT_TOO_LARGE");
  const size=Buffer.alloc(4);size.writeUInt32BE(manifest.length);
  const bytes=Buffer.concat([size,manifest,...content]);
  if(bytes.length>MAX_BUNDLE_PLAINTEXT)throw new Error("ARTIFACT_TOO_LARGE");
  return bytes;
}

// This is not a generic brand mint: it consumes only the exact registered,
// authenticated plaintext while its evidence callback is live, validates every
// schema/content binding, creates its own scoped paths, and revokes on exit.
export async function withRestoredReconstructedBundle<T>(evidence:AuthenticatedArtifact,identity:RequestIdentity,directory:string,action:(bundle:ReconstructedBundle)=>Promise<T>):Promise<T>{
  const bytes=authenticatedArtifactBytes(evidence,identity.id,"bundle");
  let verified:ReconstructedBundle|undefined;
  try{
    if(bytes.length<4||bytes.length>MAX_BUNDLE_PLAINTEXT)throw new Error("INVALID_ARTIFACT");
    const length=bytes.readUInt32BE(0);if(length+4>65536||length+4>bytes.length)throw new Error("INVALID_ARTIFACT");
    const body=strictObject(JSON.parse(new TextDecoder("utf8",{fatal:true}).decode(bytes.subarray(4,4+length))),["version","id","input","requestDigest","policyId","files"]);
    if(body.version!==1||body.id!==identity.id||body.requestDigest!==identity.digest||body.policyId!=="tj-reconstruction-1"||!Array.isArray(body.files)||body.files.length>5)throw new Error("INVALID_ARTIFACT");
    const input=validatePayload({version:1,input:body.input,files:[]}).input;
    const pending:{file:ReconstructedFile;bytes:Buffer}[]=[];let offset=4+length,total=0,pages=0;
    for(const [index,value] of body.files.entries()){
      const file=strictObject(value,["name","mediaType","bytes","digest","sourceIndex","sourceDigest"],["pageCount"]);
      const ext=file.mediaType==="application/pdf"?"pdf":file.mediaType==="image/jpeg"?"jpg":file.mediaType==="image/png"?"png":null;
      if(!ext||file.name!==`document-${index+1}.${ext}`||file.sourceIndex!==index||!Number.isSafeInteger(file.bytes)||(file.bytes as number)<1||(file.bytes as number)>5242880)throw new Error("INVALID_ARTIFACT");
      if(ext==="pdf"?(!Number.isInteger(file.pageCount)||(file.pageCount as number)<1||(file.pageCount as number)>20):file.pageCount!==undefined)throw new Error("INVALID_ARTIFACT");
      total+=file.bytes as number;pages+=(file.pageCount as number|undefined)??0;
      if(total>10485760||pages>40||offset+(file.bytes as number)>bytes.length)throw new Error("INVALID_ARTIFACT");
      const content=bytes.subarray(offset,offset+(file.bytes as number));offset+=content.length;
      if(createHash("sha256").update(content).digest("hex")!==digest(String(file.digest)))throw new Error("DIGEST_MISMATCH");
      const restored:ReconstructedFile={name:String(file.name),mediaType:String(file.mediaType),bytes:content.length,digest:digest(String(file.digest)),sourceIndex:index,sourceDigest:digest(String(file.sourceDigest)),path:join(directory,String(file.name)),...(file.pageCount!==undefined?{pageCount:file.pageCount as number}:{})};
      pending.push({file:restored,bytes:content});
    }
    if(offset!==bytes.length)throw new Error("INVALID_ARTIFACT");
    // Check the whole manifest and every hash before exposing any restored file.
    const info=await lstat(directory);if(!isAbsolute(directory)||resolve(directory)!==directory||!info.isDirectory()||info.isSymbolicLink()||(info.mode&0o777)!==0o700||info.uid!==process.getuid?.())throw new Error("UNSAFE_SCOPE");
    for(const item of pending){
      try{await writeFile(item.file.path,item.bytes,{flag:"wx",mode:0o600});}
      catch(error){
        if(!(error instanceof Error&&"code" in error&&error.code==="EEXIST"))throw error;
        // Nested reopens reuse only a hash-verified output, never source paths.
        await readSnapshotFile(item.file);
      }
    }
    assertAuthenticatedArtifact(evidence,identity.id,"bundle");
    const bundle={version:1 as const,id:identity.id,input:Object.freeze({...input}),requestDigest:identity.digest,policyId:"tj-reconstruction-1" as const,files:Object.freeze(pending.map(item=>Object.freeze(item.file)))};
    Object.defineProperty(bundle,reconstructed,{value:true,enumerable:false});
    verified=Object.freeze(bundle) as ReconstructedBundle;activeBundles.add(verified);
    return await action(verified);
  }finally{if(verified)activeBundles.delete(verified);bytes.fill(0);}
}
