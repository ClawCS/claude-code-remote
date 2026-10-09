// Logical-byte admission accounting. Actual filesystem quota enforcement belongs
// to the qualified storage authority, not to this arithmetic.
export const STORAGE_CAP = 250 * 1024 * 1024;
export const SCRATCH_RESERVE = 128 * 1024 * 1024;
export const ARTIFACT_METADATA_RESERVE = 8192;
export const MAX_BUNDLE_PLAINTEXT = 10 * 1024 * 1024 + 65536;
export const MAX_MIME_PLAINTEXT = 16 * 1024 * 1024;
export const ARTIFACT_OVERHEAD = 2048;
export const artifactLimit = (kind: "bundle" | "mime") => (kind === "bundle" ? MAX_BUNDLE_PLAINTEXT : MAX_MIME_PLAINTEXT) + ARTIFACT_OVERHEAD;
export const OUTPUT_RESERVE = artifactLimit("bundle") + artifactLimit("mime") + 2 * ARTIFACT_METADATA_RESERVE;
export interface StorageClaim { allowance: number; actual: number }
export function storageBudget(physicalBytes: number, scratchBytes: number, claims: readonly StorageClaim[], metadata = 8192): { physicalBytes: number; reservedHeadroom: number } {
  const values = [physicalBytes, scratchBytes, metadata, ...claims.flatMap(claim => [claim.allowance, claim.actual])];
  if (values.some(value => !Number.isSafeInteger(value) || value < 0) || scratchBytes > SCRATCH_RESERVE || scratchBytes > physicalBytes) throw new Error("CUSTODY_ACCOUNTING_FAILED");
  const reservedHeadroom = SCRATCH_RESERVE - scratchBytes + metadata + claims.reduce((sum, claim) => sum + Math.max(0, claim.allowance - claim.actual), 0);
  if (physicalBytes + reservedHeadroom > STORAGE_CAP) throw new Error("CAPACITY_EXCEEDED");
  return { physicalBytes, reservedHeadroom };
}
