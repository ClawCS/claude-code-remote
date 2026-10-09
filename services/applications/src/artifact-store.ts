import { createHash } from "node:crypto";
import type { ApplicationId, ApplicationRepository, ArtifactKind, ArtifactRecord, CustodyLedger, WorkerKeys } from "./types";
import { digest, utcInstant } from "./types";
import { assertReconstructedBundle, encodeReconstructedBundle, withRestoredReconstructedBundle, type ReconstructedBundle } from "./reconstruction";
import { authenticatedArtifactBytes, sealArtifactEnvelope, withAuthenticatedArtifact } from "./artifact-crypto";
import { MAX_MIME_PLAINTEXT } from "./storage-budget";
import { takePrivateSnapshot } from "./custody";

export interface ArtifactStore {
  adoptBundle(bundle:ReconstructedBundle,expectedVersion:number):Promise<ArtifactRecord>;
  withBundle<T>(id:ApplicationId,action:(bundle:ReconstructedBundle)=>Promise<T>):Promise<T>;
  adoptMime(id:ApplicationId,raw:AsyncIterable<Uint8Array>,expectedVersion:number):Promise<ArtifactRecord>;
  withMime<T>(id:ApplicationId,action:(raw:AsyncIterable<Uint8Array>)=>Promise<T>):Promise<T>;
}
export function createArtifactStore(repo:ApplicationRepository,keys:WorkerKeys,custody:CustodyLedger):ArtifactStore {
  async function adopt(id:ApplicationId,kind:ArtifactKind,plaintext:Buffer,expectedVersion:number):Promise<ArtifactRecord>{
    try{return await repo.withCaseLock(id,async row=>{
      const hash=digest(createHash("sha256").update(plaintext).digest("hex")),existing=repo.getArtifact(id,kind);
      if(existing){
        await withAuthenticatedArtifact(repo,existing,keys,async()=>{});
        if(existing.plaintextDigest!==hash)throw new Error("ARTIFACT_CONFLICT");
        return existing;
      }
      if(row.version!==expectedVersion)throw new Error("STALE_VERSION");
      if(!["queued","scanning","ready"].includes(row.deliveryState))throw new Error("ARTIFACT_CREATION_CLOSED");
      const deadline=utcInstant(new Date(Date.parse(row.acceptedAt)+7*86400000).toISOString());
      const expiresAt=row.payloadDeleteAfter<deadline?row.payloadDeleteAfter:deadline;
      const ciphertext=sealArtifactEnvelope(plaintext,id,kind,keys.publicKey);
      return custody.publishArtifact(id,kind,ciphertext,{plaintextDigest:hash,ciphertextDigest:digest(createHash("sha256").update(ciphertext).digest("hex")),expiresAt},expectedVersion);
    });}finally{plaintext.fill(0);}
  }
  return {
    adoptBundle:async(bundle,version)=>{
      assertReconstructedBundle(bundle);
      const identity=repo.getRequestIdentity(bundle.id);
      if(bundle.requestDigest!==identity.digest)throw new Error("DIGEST_MISMATCH");
      const original=repo.getCommittedIntake(bundle.id);
      if(original&&!repo.getArtifact(bundle.id,"bundle")){
        const snapshot=await takePrivateSnapshot(original,keys);
        const fields=["name","email","job","phone","message"] as const;
        if(fields.some(field=>snapshot.input[field]!==bundle.input[field])||snapshot.files.length!==bundle.files.length||bundle.files.some((file,index)=>file.sourceIndex!==index||file.sourceDigest!==snapshot.files[index].digest||file.mediaType!==snapshot.files[index].mediaType))throw new Error("DIGEST_MISMATCH");
      }
      return adopt(bundle.id,"bundle",await encodeReconstructedBundle(bundle),version);
    },
    withBundle:async(id,action)=>{
      const record=repo.getArtifact(id,"bundle");if(!record)throw new Error("ARTIFACT_NOT_FOUND");
      return repo.withCaseLock(id,()=>custody.withScope(id,directory=>withAuthenticatedArtifact(repo,record,keys,evidence=>withRestoredReconstructedBundle(evidence,repo.getRequestIdentity(id),directory,action))));
    },
    adoptMime:async(id,raw,version)=>{
      const chunks:Buffer[]=[];let size=0;
      try{
        for await(const chunk of raw){size+=chunk.length;if(size>MAX_MIME_PLAINTEXT)throw new Error("ARTIFACT_TOO_LARGE");chunks.push(Buffer.from(chunk));}
        return await adopt(id,"mime",Buffer.concat(chunks,size),version);
      }finally{for(const chunk of chunks)chunk.fill(0);}
    },
    withMime:async(id,action)=>{
      const record=repo.getArtifact(id,"mime");if(!record)throw new Error("ARTIFACT_NOT_FOUND");
      return withAuthenticatedArtifact(repo,record,keys,async evidence=>{
        const bytes=authenticatedArtifactBytes(evidence,id,"mime");let active=true;
        try{return await action((async function*(){if(!active)throw new Error("INVALID_ARTIFACT_AUTHORITY");yield bytes;})());}
        finally{active=false;bytes.fill(0);}
      });
    },
  };
}
