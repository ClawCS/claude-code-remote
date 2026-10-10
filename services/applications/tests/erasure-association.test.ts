import { describe, expect, it } from "vitest";
import { replayAssociation, externalAttestationAssociation } from "../src/erasure-association";
import { applicationId, digest, staffId, utcInstant, type CurrentExternalAttestation, type DeletionScope } from "../src/types";

const scope: DeletionScope = { ledgerId: "1".repeat(32), historyEpoch: "2".repeat(32), associationKeyId: "erase-key", associationKey: Buffer.alloc(32, 7), approvedScopes: [["a".repeat(32), "application", null, "2020-01-01T00:00:00.000Z", null]] };
const id = applicationId("11111111-1111-4111-8111-111111111111");
const session = digest("3".repeat(64));
const audit: CurrentExternalAttestation = { sequence: 12, version: 34, actor: staffId("22222222-2222-4222-8222-222222222222"), at: utcInstant("2026-10-10T12:00:00.000Z"), reason: "Kopien geklärt 😀" };
describe("private erasure associations", () => {
  it("binds the exact session/key independently of acceptance, case and submission", () => {
    expect(replayAssociation(scope, session, "retry_1")).toBe("27656bf9d66fa32e2dc51a418c6f0e6271c081ba3d227e45dd74066e7720111f");
    expect(replayAssociation({ ...scope, approvedScopes: [["b".repeat(32), "synthetic", "other", "2021-01-01T00:00:00.000Z", null]] }, session, "retry_1")).toBe(replayAssociation(scope, session, "retry_1"));
    for (const changed of [{ ...scope, ledgerId: "4".repeat(32) }, { ...scope, historyEpoch: "4".repeat(32) }, { ...scope, associationKeyId: "other" }, { ...scope, associationKey: Buffer.alloc(32, 8) }]) expect(replayAssociation(changed, session, "retry_1")).not.toBe(replayAssociation(scope, session, "retry_1"));
  });
  it("binds the actual positive audit values without Unicode normalization", () => {
    expect(externalAttestationAssociation(scope, id, audit)).toBe("5e6baeadfcebf7106bf86b07005bffaedf26f9cce1046b2b66232638e4a75d96");
    for (const changed of [{ ...audit, sequence: 13 }, { ...audit, version: 35 }, { ...audit, reason: "Kopien geklärt 😀" }]) expect(externalAttestationAssociation(scope, id, changed)).not.toBe(externalAttestationAssociation(scope, id, audit));
  });
  it.each(["", "x".repeat(129), "canary@example.com", "ü", "a/b"])("rejects malformed replay operands without leaking %j", key => {
    expect(() => replayAssociation(scope, session, key)).toThrow("ERASURE_ASSOCIATION_INVALID");
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN])("rejects nonpositive/noncanonical audit integer %s before encoding", value => {
    expect(() => externalAttestationAssociation(scope, id, { ...audit, sequence: value })).toThrow("ERASURE_ASSOCIATION_INVALID");
    expect(() => externalAttestationAssociation(scope, id, { ...audit, version: value })).toThrow("ERASURE_ASSOCIATION_INVALID");
  });
  it.each(["", " ", "x".repeat(501), "\ud800", "canary\nsecret", "x\u202e"])("rejects invalid audit text without a raw preimage", reason => {
    expect(() => externalAttestationAssociation(scope, id, { ...audit, reason })).toThrow("ERASURE_ASSOCIATION_INVALID");
  });
  it("accepts maximal bounded primitive inputs and rejects malformed private shapes", () => {
    expect(replayAssociation(scope, session, "x".repeat(128))).toMatch(/^[a-f0-9]{64}$/);
    expect(externalAttestationAssociation(scope, id, { ...audit, sequence: Number.MAX_SAFE_INTEGER, version: Number.MAX_SAFE_INTEGER, reason: "😀".repeat(500) })).toMatch(/^[a-f0-9]{64}$/);
    for (const source of [{ ...scope, associationKey: Buffer.alloc(31) }, { ...scope, ledgerId: "x".repeat(33) }, { ...scope, historyEpoch: "A".repeat(32) }, { ...scope, associationKeyId: "x".repeat(33) }, { ...scope, approvedScopes: [] }]) {
      expect(() => replayAssociation(source, session, "retry_1")).toThrow("ERASURE_ASSOCIATION_INVALID");
      expect(() => externalAttestationAssociation(source, id, audit)).toThrow("ERASURE_ASSOCIATION_INVALID");
    }
    for (const source of [{ ...audit, actor: "canary@example.com" }, { ...audit, at: "2026-10-10T12:00:00Z" }, { ...audit, confirmed: false }]) expect(() => externalAttestationAssociation(scope, id, source as CurrentExternalAttestation)).toThrow("ERASURE_ASSOCIATION_INVALID");
  });
});
